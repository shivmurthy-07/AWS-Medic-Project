import { useState } from 'react';
import {
    Alert, Button, Card, Col, Descriptions, Drawer, Empty, Input, Modal, Popconfirm,
    Row, Select, Skeleton, Statistic, Table, Tag, message, Avatar, Tabs, Form, InputNumber, Divider,
    Space, Typography,
} from 'antd';
import dayjs from 'dayjs';
import {
    FaUserMd,
    FaUserInjured,
    FaGraduationCap,
    FaBriefcase,
    FaAward,
    FaHospital,
    FaRupeeSign,
    FaSearch,
    FaPlus,
    FaEye,
    FaCheck,
    FaTimes,
    FaBan,
    FaClock,
} from 'react-icons/fa';
import defaultAvatar from '../../images/avatar.jpg';
import {
    useChangeSuperAdminDoctorStatusMutation,
    useChangeSuperAdminPatientStatusMutation,
    useChangeSuperAdminUserRoleMutation,
    useGetSuperAdminActivityLogsQuery,
    useGetSuperAdminAppointmentsQuery,
    useGetSuperAdminDashboardQuery,
    useGetSuperAdminDoctorQuery,
    useGetSuperAdminDoctorsQuery,
    useGetSuperAdminPatientsQuery,
    useGetSuperAdminUsersQuery,
} from '../../redux/api/superAdminApi';
import {
    useGetSpecializationsQuery,
    useCreateSpecializationMutation,
    useUpdateSpecializationMutation,
    useGetConsultationServicesQuery,
    useCreateConsultationServiceMutation,
    useUpdateConsultationServiceMutation,
    useGetSpecializationFeesQuery,
    useSetSpecializationFeeMutation,
    useGetAllFeeChangeRequestsQuery,
    useReviewFeeChangeRequestMutation,
} from '../../redux/api/feeApi';
import { formatCurrency } from '../../utils/formatCurrency';
import './SuperAdmin.css';

const { Text } = Typography;

const PAGE_SIZE = 20;
const displayDate = (value) => value ? dayjs(value).format('MMM D, YYYY h:mm A') : '—';

const StatusTag = ({ value }) => {
    const color = {
        PENDING: 'gold',
        APPROVED: 'green',
        REJECTED: 'red',
        SUSPENDED: 'volcano',
        active: 'green',
        inactive: 'default',
    }[value] || 'blue';
    return <Tag color={color}>{value || 'Unknown'}</Tag>;
};

const PageHeading = ({ title, subtitle }) => (
    <div className="super-admin__page-heading">
        <div><h1>{title}</h1><p>{subtitle}</p></div>
    </div>
);

const QueryError = ({ error }) => error ? (
    <Alert type="error" showIcon message="Unable to load platform data" description={error?.data?.message || error?.message || 'Please try again.'} />
) : null;

const DashboardOverview = () => {
    const { data, isLoading, error } = useGetSuperAdminDashboardQuery();
    const stats = data?.statistics || {};
    const statistics = [
        ['Registered doctors', stats.totalDoctors],
        ['Pending approvals', stats.pendingDoctors],
        ['Approved doctors', stats.approvedDoctors],
        ['Rejected applications', stats.rejectedDoctors],
        ['Registered patients', stats.totalPatients],
        ['All appointments', stats.totalAppointments],
        ['Upcoming appointments', stats.upcomingAppointments],
        ['Completed appointments', stats.completedAppointments],
        ['Cancelled appointments', stats.cancelledAppointments],
        ['Prescriptions', stats.totalPrescriptions],
    ];

    return (
        <section>
            <PageHeading title="Platform overview" subtitle="Live activity and totals from the platform database." />
            <QueryError error={error} />
            {isLoading ? <Skeleton active /> : (
                <>
                    <Row gutter={[16, 16]} className="super-admin__stats">
                        {statistics.map(([title, value]) => (
                            <Col xs={12} sm={8} xl={5} key={title}>
                                <Card><Statistic title={title} value={value || 0} /></Card>
                            </Col>
                        ))}
                    </Row>
                    <Row gutter={[16, 16]} className="mt-4">
                        <Col xs={24} lg={12}>
                            <Card title="Appointments created — last 7 days">
                                <div className="super-admin__activity-bars">
                                    {(data?.appointmentsByDay || []).map((item) => (
                                        <div key={item.date} className="super-admin__activity-day">
                                            <span>{item.count}</span>
                                            <div style={{ height: `${Math.min(100, item.count * 12)}px` }} />
                                            <small>{dayjs(item.date).format('ddd')}</small>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </Col>
                        <Col xs={24} lg={12}>
                            <Card title="Recent registrations">
                                {data?.recentRegistrations?.length ? data.recentRegistrations.map((person) => (
                                    <div key={`${person.type}-${person.id}`} className="super-admin__recent-row">
                                        <div><strong>{person.firstName} {person.lastName}</strong><small>{person.email}</small></div>
                                        <div><Tag>{person.type}</Tag><small>{displayDate(person.createdAt)}</small></div>
                                    </div>
                                )) : <Empty description="No registrations yet" />}
                            </Card>
                        </Col>
                    </Row>
                </>
            )}
        </section>
    );
};

const DoctorManagement = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const [rejecting, setRejecting] = useState(null);
    const [reason, setReason] = useState('');
    const [requestStatus, { isLoading: saving }] = useChangeSuperAdminDoctorStatusMutation();
    const { data: dashboardData } = useGetSuperAdminDashboardQuery();

    const params = { page, limit: PAGE_SIZE, ...(search ? { search } : {}), ...(status ? { status } : {}) };
    const { data, isLoading, error } = useGetSuperAdminDoctorsQuery(params);
    const { data: selectedDoctor, isFetching: doctorLoading } = useGetSuperAdminDoctorQuery(selectedId, { skip: !selectedId });
    const doctors = data?.doctors || [];

    const stats = dashboardData?.statistics || {};

    const act = async (doctor, action, rejectionReason) => {
        try {
            await requestStatus({ id: doctor.id, action, reason: rejectionReason }).unwrap();
            message.success(`Doctor ${action === 'reject' ? 'application rejected' : `${action}d`} successfully.`);
            setRejecting(null);
            setReason('');
        } catch (requestError) {
            message.error(requestError?.data?.message || 'The doctor status could not be changed.');
        }
    };

    const actionButton = (doctor) => {
        if (doctor.approvalStatus === 'PENDING') {
            return (
                <Space size="small">
                    <Popconfirm title="Approve this doctor?" onConfirm={() => act(doctor, 'approve')}>
                        <Button size="small" type="primary" icon={<FaCheck />}>Approve</Button>
                    </Popconfirm>
                    <Button size="small" danger icon={<FaTimes />} onClick={() => setRejecting(doctor)}>Reject</Button>
                </Space>
            );
        }
        if (doctor.approvalStatus === 'APPROVED') {
            return (
                <Popconfirm title="Suspend this doctor's platform access?" onConfirm={() => act(doctor, 'suspend')}>
                    <Button size="small" danger icon={<FaBan />}>Suspend</Button>
                </Popconfirm>
            );
        }
        if (doctor.approvalStatus === 'SUSPENDED') {
            return (
                <Popconfirm title="Reactivate this doctor account?" onConfirm={() => act(doctor, 'reactivate')}>
                    <Button size="small" type="primary" icon={<FaCheck />}>Reactivate</Button>
                </Popconfirm>
            );
        }
        return null;
    };

    const columns = [
        {
            title: 'Doctor ID',
            dataIndex: 'id',
            key: 'id',
            render: (id) => <span className="font-monospace small text-muted">{id?.substring(0, 8)}...</span>,
        },
        {
            title: 'Profile',
            key: 'avatar',
            render: (_, doctor) => <Avatar src={doctor.img || defaultAvatar} icon={<FaUserMd />} />,
        },
        {
            title: 'Doctor Name',
            key: 'name',
            render: (_, doctor) => (
                <div>
                    <strong>Dr. {doctor.firstName} {doctor.lastName}</strong>
                    <div className="super-admin__table-sub">{doctor.email}</div>
                </div>
            ),
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
            render: (phone) => phone || '—',
        },
        {
            title: 'Specialization',
            dataIndex: 'specialization',
            key: 'specialization',
            render: (value) => value || 'Not provided',
        },
        {
            title: 'Qualification',
            key: 'qualification',
            render: (_, doctor) => doctor.degree || 'MBBS',
        },
        {
            title: 'Experience',
            dataIndex: 'experience',
            key: 'experience',
            render: (exp) => exp ? `${exp} yrs` : '—',
        },
        {
            title: 'Hospital / Clinic',
            key: 'clinic',
            render: (_, doctor) => doctor.clinicName || 'Clinic',
        },
        {
            title: 'Registration No.',
            dataIndex: 'registration',
            key: 'registration',
            render: (reg) => reg || '—',
        },
        {
            title: 'Registered Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: displayDate,
        },
        {
            title: 'Status',
            dataIndex: 'approvalStatus',
            key: 'approvalStatus',
            render: (value) => <StatusTag value={value} />,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, doctor) => (
                <div className="super-admin__table-actions">
                    <Button size="small" icon={<FaEye />} onClick={() => setSelectedId(doctor.id)}>Details</Button>
                    {actionButton(doctor)}
                </div>
            ),
        },
    ];

    const tabItems = [
        { key: '', label: `All Doctors (${stats.totalDoctors || 0})` },
        { key: 'PENDING', label: `Pending Approvals (${stats.pendingDoctors || 0})` },
        { key: 'APPROVED', label: `Approved (${stats.approvedDoctors || 0})` },
        { key: 'REJECTED', label: `Rejected (${stats.rejectedDoctors || 0})` },
        { key: 'SUSPENDED', label: `Suspended (${stats.suspendedDoctors || 0})` },
    ];

    return (
        <section>
            <PageHeading title="Doctor Management & Approvals" subtitle="Review practitioner credentials, verify medical registrations, and manage approval status." />

            {/* Metric Statistics Cards */}
            <Row gutter={[16, 16]} className="mb-4">
                <Col xs={12} sm={8} lg={4}>
                    <Card size="small" className="text-center shadow-sm border-0">
                        <Statistic title="Total Registered" value={stats.totalDoctors || 0} />
                    </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <Card size="small" className="text-center shadow-sm border-0 border-top border-warning border-3">
                        <Statistic title="Pending Approvals" value={stats.pendingDoctors || 0} valueStyle={{ color: '#d48806' }} />
                    </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <Card size="small" className="text-center shadow-sm border-0 border-top border-success border-3">
                        <Statistic title="Approved Doctors" value={stats.approvedDoctors || 0} valueStyle={{ color: '#389e0d' }} />
                    </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <Card size="small" className="text-center shadow-sm border-0 border-top border-danger border-3">
                        <Statistic title="Rejected" value={stats.rejectedDoctors || 0} valueStyle={{ color: '#cf1322' }} />
                    </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <Card size="small" className="text-center shadow-sm border-0 border-top border-secondary border-3">
                        <Statistic title="Suspended" value={stats.suspendedDoctors || 0} />
                    </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <Card size="small" className="text-center shadow-sm border-0 border-top border-primary border-3">
                        <Statistic title="Active on Platform" value={stats.approvedDoctors || 0} valueStyle={{ color: '#1890ff' }} />
                    </Card>
                </Col>
            </Row>

            <Card className="super-admin__table-card">
                <Tabs
                    activeKey={status}
                    onChange={(k) => { setStatus(k); setPage(1); }}
                    items={tabItems}
                />
                <div className="super-admin__filters mb-3">
                    <Input.Search
                        allowClear
                        placeholder="Search by doctor name, email, specialty, or medical registration..."
                        value={search}
                        onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                        style={{ maxWidth: 450 }}
                    />
                </div>
                <QueryError error={error} />
                <Table
                    rowKey="id"
                    loading={isLoading}
                    dataSource={doctors}
                    columns={columns}
                    scroll={{ x: 1200 }}
                    pagination={{ current: page, pageSize: PAGE_SIZE, total: data?.meta?.total || 0, onChange: setPage }}
                />
            </Card>

            {/* Individual Doctor Full Portfolio Drawer */}
            <Drawer
                title={
                    <div className="d-flex align-items-center gap-2">
                        <Avatar src={selectedDoctor?.img || defaultAvatar} size="large" />
                        <div>
                            <div className="fw-bold">Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName}</div>
                            <small className="text-muted">{selectedDoctor?.specialization || 'Healthcare Practitioner'}</small>
                        </div>
                    </div>
                }
                open={Boolean(selectedId)}
                onClose={() => setSelectedId(null)}
                width={680}
            >
                {doctorLoading ? (
                    <Skeleton active />
                ) : selectedDoctor ? (
                    <div className="d-flex flex-column gap-4">
                        <Card size="small" title="Personal & Contact Information">
                            <Descriptions column={2} bordered size="small">
                                <Descriptions.Item label="Email">{selectedDoctor.email}</Descriptions.Item>
                                <Descriptions.Item label="Phone">{selectedDoctor.phone || '—'}</Descriptions.Item>
                                <Descriptions.Item label="Gender">{selectedDoctor.gender ? String(selectedDoctor.gender).toUpperCase() : '—'}</Descriptions.Item>
                                <Descriptions.Item label="Date of Birth">{selectedDoctor.dob || '—'}</Descriptions.Item>
                                <Descriptions.Item label="City">{selectedDoctor.city || '—'}</Descriptions.Item>
                                <Descriptions.Item label="State & Postal">{selectedDoctor.state || ''} {selectedDoctor.postalCode || ''}</Descriptions.Item>
                                <Descriptions.Item label="Residential Address" span={2}>{selectedDoctor.address || '—'}</Descriptions.Item>
                            </Descriptions>
                        </Card>

                        <Card size="small" title="Professional Registration & Practice">
                            <Descriptions column={2} bordered size="small">
                                <Descriptions.Item label="Primary Specialization">{selectedDoctor.specialization || '—'}</Descriptions.Item>
                                <Descriptions.Item label="Designation">{selectedDoctor.designation || '—'}</Descriptions.Item>
                                <Descriptions.Item label="Medical Registration">{selectedDoctor.registration || '—'}</Descriptions.Item>
                                <Descriptions.Item label="Registration Council">{selectedDoctor.registrationCouncil || 'National Medical Commission'}</Descriptions.Item>
                                <Descriptions.Item label="Experience">{selectedDoctor.experience ? `${selectedDoctor.experience} Years` : '—'}</Descriptions.Item>
                                <Descriptions.Item label="Languages">{selectedDoctor.languages || 'English, Hindi'}</Descriptions.Item>
                                <Descriptions.Item label="Clinic Name">{selectedDoctor.clinicName || '—'}</Descriptions.Item>
                                <Descriptions.Item label="Base Consultation Fee">{selectedDoctor.price ? formatCurrency(selectedDoctor.price) : '—'}</Descriptions.Item>
                                <Descriptions.Item label="Clinic Address" span={2}>{selectedDoctor.clinicAddress || '—'}</Descriptions.Item>
                                <Descriptions.Item label="Professional Biography" span={2}>{selectedDoctor.biography || '—'}</Descriptions.Item>
                            </Descriptions>
                        </Card>

                        {/* Education Details List */}
                        <Card size="small" title={<span><FaGraduationCap className="text-primary me-2" /> Education & Qualifications</span>}>
                            {selectedDoctor.education && selectedDoctor.education.length > 0 ? (
                                <div className="d-flex flex-column gap-2">
                                    {selectedDoctor.education.map((edu) => (
                                        <div key={edu.id} className="p-2 border rounded bg-light">
                                            <div className="fw-bold">{edu.degree} {edu.specialization ? `in ${edu.specialization}` : ''}</div>
                                            <div className="small text-muted">{edu.college} · {edu.startYear || ''} - {edu.completionYear || 'Completed'}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div>
                                    <strong>{selectedDoctor.degree || 'MBBS'}</strong> — {selectedDoctor.college || 'Medical College'} ({selectedDoctor.completionYear || 'Graduated'})
                                </div>
                            )}
                        </Card>

                        {/* Work Experience List */}
                        <Card size="small" title={<span><FaBriefcase className="text-success me-2" /> Clinical Work Experience</span>}>
                            {selectedDoctor.workExperience && selectedDoctor.workExperience.length > 0 ? (
                                <div className="d-flex flex-column gap-2">
                                    {selectedDoctor.workExperience.map((exp) => (
                                        <div key={exp.id} className="p-2 border rounded bg-light">
                                            <div className="fw-bold">{exp.designation} · {exp.hospitalName}</div>
                                            <div className="small text-muted">{exp.department || 'Clinical Practice'} ({exp.startDate || ''} - {exp.isCurrent ? 'Present' : exp.endDate || ''})</div>
                                            {exp.description && <small className="d-block text-secondary mt-1">{exp.description}</small>}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div>
                                    <strong>{selectedDoctor.experienceHospitalName || 'Hospital Practice'}</strong> {selectedDoctor.experience ? `(${selectedDoctor.experience} years)` : ''}
                                </div>
                            )}
                        </Card>

                        {/* Awards & Certifications */}
                        {selectedDoctor.awardsCertifications && selectedDoctor.awardsCertifications.length > 0 && (
                            <Card size="small" title={<span><FaAward className="text-warning me-2" /> Awards & Certifications</span>}>
                                <div className="d-flex flex-column gap-2">
                                    {selectedDoctor.awardsCertifications.map((a) => (
                                        <div key={a.id} className="p-2 border rounded bg-light">
                                            <strong>{a.title}</strong> — <span className="text-muted">{a.organization || 'Medical Association'} ({a.year || 'Awarded'})</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Verification & Account Status */}
                        <Card size="small" title="Platform Status & Audit Log">
                            <Descriptions column={2} bordered size="small">
                                <Descriptions.Item label="Current Status"><StatusTag value={selectedDoctor.approvalStatus} /></Descriptions.Item>
                                <Descriptions.Item label="Profile Completeness">{selectedDoctor.profileComplete ? 'Complete (100%)' : 'Incomplete'}</Descriptions.Item>
                                <Descriptions.Item label="Total Booked Appointments">{selectedDoctor.appointmentCount || 0}</Descriptions.Item>
                                <Descriptions.Item label="Registered Date">{displayDate(selectedDoctor.createdAt)}</Descriptions.Item>
                                <Descriptions.Item label="Approved Date">{displayDate(selectedDoctor.approvedAt)}</Descriptions.Item>
                                {selectedDoctor.rejectionReason && (
                                    <Descriptions.Item label="Rejection Reason" span={2}>
                                        <span className="text-danger">{selectedDoctor.rejectionReason}</span>
                                    </Descriptions.Item>
                                )}
                            </Descriptions>
                        </Card>

                        {/* Quick action footer inside drawer */}
                        <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                            {actionButton(selectedDoctor)}
                            <Button onClick={() => setSelectedId(null)}>Close</Button>
                        </div>
                    </div>
                ) : <Empty description="Doctor record not found" />}
            </Drawer>

            {/* Rejection Reason Modal */}
            <Modal
                title={`Reject Dr. ${rejecting?.firstName || ''} ${rejecting?.lastName || ''}'s Application`}
                open={Boolean(rejecting)}
                confirmLoading={saving}
                onCancel={() => { setRejecting(null); setReason(''); }}
                onOk={() => act(rejecting, 'reject', reason)}
                okButtonProps={{ danger: true, disabled: reason.trim().length < 10 }}
            >
                <p>Please provide a specific reason for rejection. The doctor will see this feedback when signing in and can rectify their profile.</p>
                <Input.TextArea
                    rows={4}
                    maxLength={1000}
                    showCount
                    placeholder="E.g., Medical Council registration number could not be verified in the national database. Please upload a clear copy of your state council certificate."
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                />
            </Modal>
        </section>
    );
};

const FeeManagement = () => {
    const { data: specsData, isLoading: specsLoading, refetch: refetchSpecs } = useGetSpecializationsQuery();
    const { data: servicesData, isLoading: servicesLoading, refetch: refetchServices } = useGetConsultationServicesQuery();
    const { data: specFeesData, isLoading: specFeesLoading, refetch: refetchSpecFees } = useGetSpecializationFeesQuery();
    const { data: requestsData, isLoading: requestsLoading, refetch: refetchRequests } = useGetAllFeeChangeRequestsQuery();

    const [createSpec] = useCreateSpecializationMutation();
    const [createService] = useCreateConsultationServiceMutation();
    const [setSpecFee] = useSetSpecializationFeeMutation();
    const [reviewRequest] = useReviewFeeChangeRequestMutation();

    const [specModalOpen, setSpecModalOpen] = useState(false);
    const [serviceModalOpen, setServiceModalOpen] = useState(false);
    const [feeModalOpen, setFeeModalOpen] = useState(false);
    const [rejectRequestModal, setRejectRequestModal] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    const [specForm] = Form.useForm();
    const [serviceForm] = Form.useForm();
    const [feeForm] = Form.useForm();

    const specializations = specsData?.data || specsData || [];
    const services = servicesData?.data || servicesData || [];
    const specFees = specFeesData?.data || specFeesData || [];
    const changeRequests = requestsData?.data || requestsData || [];

    const handleCreateSpec = async (values) => {
        try {
            await createSpec(values).unwrap();
            message.success('Specialization added successfully.');
            setSpecModalOpen(false);
            specForm.resetFields();
            refetchSpecs();
        } catch (err) {
            message.error(err?.data?.message || 'Could not add specialization.');
        }
    };

    const handleCreateService = async (values) => {
        try {
            await createService(values).unwrap();
            message.success('Consultation service added successfully.');
            setServiceModalOpen(false);
            serviceForm.resetFields();
            refetchServices();
        } catch (err) {
            message.error(err?.data?.message || 'Could not add service.');
        }
    };

    const handleSetFee = async (values) => {
        try {
            await setSpecFee(values).unwrap();
            message.success('Specialization fee saved successfully.');
            setFeeModalOpen(false);
            feeForm.resetFields();
            refetchSpecFees();
        } catch (err) {
            message.error(err?.data?.message || 'Could not save fee.');
        }
    };

    const handleReviewFee = async (id, status, adminComment) => {
        try {
            await reviewRequest({ id, data: { status, adminComment } }).unwrap();
            message.success(`Fee request ${status.toLowerCase()} successfully.`);
            setRejectRequestModal(null);
            setRejectReason('');
            refetchRequests();
        } catch (err) {
            message.error(err?.data?.message || 'Could not review fee request.');
        }
    };

    const specFeeColumns = [
        {
            title: 'Specialization',
            dataIndex: ['specialization', 'name'],
            key: 'specialization',
            render: (name) => <strong>{name}</strong>,
        },
        {
            title: 'Consultation Service',
            dataIndex: ['service', 'name'],
            key: 'service',
        },
        {
            title: 'Mode',
            dataIndex: 'mode',
            key: 'mode',
            render: (mode) => (
                <Tag color={mode === 'ONLINE' ? 'cyan' : 'blue'}>
                    {mode === 'ONLINE' ? 'Telehealth (Online)' : mode === 'IN_PERSON' ? 'In-Person (Clinic)' : 'Both Modes'}
                </Tag>
            ),
        },
        {
            title: 'Configured Fee',
            dataIndex: 'fee',
            key: 'fee',
            render: (fee) => <span className="fw-bold text-success">{formatCurrency(fee)}</span>,
        },
        {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (active) => <Tag color={active ? 'green' : 'default'}>{active ? 'Active' : 'Inactive'}</Tag>,
        },
    ];

    const changeRequestColumns = [
        {
            title: 'Doctor',
            key: 'doctor',
            render: (_, r) => (
                <div className="d-flex align-items-center gap-2">
                    <Avatar src={r.doctor?.img || defaultAvatar} />
                    <div>
                        <strong>Dr. {r.doctor?.firstName} {r.doctor?.lastName}</strong>
                        <div className="small text-muted">{r.doctor?.specialization}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Service',
            dataIndex: ['service', 'name'],
            key: 'service',
        },
        {
            title: 'Mode',
            dataIndex: 'mode',
            key: 'mode',
            render: (m) => <Tag color="blue">{m}</Tag>,
        },
        {
            title: 'Current Fee',
            dataIndex: 'currentFee',
            key: 'currentFee',
            render: (f) => f ? formatCurrency(f) : '—',
        },
        {
            title: 'Proposed Fee',
            dataIndex: 'proposedFee',
            key: 'proposedFee',
            render: (f) => <strong className="text-primary">{formatCurrency(f)}</strong>,
        },
        {
            title: 'Reason',
            dataIndex: 'reason',
            key: 'reason',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (s) => <StatusTag value={s} />,
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, r) => r.status === 'PENDING' ? (
                <Space size="small">
                    <Popconfirm
                        title="Approve this fee request?"
                        description={`Doctor will be allowed to charge ${formatCurrency(r.proposedFee)}.`}
                        onConfirm={() => handleReviewFee(r.id, 'APPROVED')}
                    >
                        <Button size="small" type="primary" icon={<FaCheck />}>Approve</Button>
                    </Popconfirm>
                    <Button size="small" danger icon={<FaTimes />} onClick={() => setRejectRequestModal(r)}>
                        Reject
                    </Button>
                </Space>
            ) : (
                <small className="text-muted">{r.adminComment || 'Reviewed'}</small>
            ),
        },
    ];

    const items = [
        {
            key: 'spec-fees',
            label: <span><FaRupeeSign className="me-1" /> Specialization Fee Matrix</span>,
            children: (
                <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <Text type="secondary">
                            Configure standard consultation fee rates per specialization, service category, and appointment mode.
                        </Text>
                        <Button type="primary" icon={<FaPlus />} onClick={() => setFeeModalOpen(true)}>
                            Set Specialization Fee
                        </Button>
                    </div>
                    <Table
                        columns={specFeeColumns}
                        dataSource={specFees}
                        rowKey="id"
                        loading={specFeesLoading}
                        pagination={{ pageSize: 10 }}
                    />
                </div>
            ),
        },
        {
            key: 'fee-requests',
            label: <span><FaClock className="me-1" /> Doctor Fee Change Requests ({changeRequests.filter(r => r.status === 'PENDING').length})</span>,
            children: (
                <div>
                    <div className="mb-3">
                        <Text type="secondary">Review and approve custom consultation fee requests submitted by doctors.</Text>
                    </div>
                    <Table
                        columns={changeRequestColumns}
                        dataSource={changeRequests}
                        rowKey="id"
                        loading={requestsLoading}
                        pagination={{ pageSize: 10 }}
                    />
                </div>
            ),
        },
        {
            key: 'specializations',
            label: 'Specializations',
            children: (
                <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <Text type="secondary">Manage medical disciplines practicing on the platform.</Text>
                        <Button icon={<FaPlus />} onClick={() => setSpecModalOpen(true)}>
                            Add Specialization
                        </Button>
                    </div>
                    <Table
                        columns={[
                            { title: 'Specialization Name', dataIndex: 'name', key: 'name', render: (n) => <strong>{n}</strong> },
                            { title: 'Description', dataIndex: 'description', key: 'description' },
                            { title: 'Status', dataIndex: 'isActive', key: 'isActive', render: (a) => <Tag color={a ? 'green' : 'default'}>{a ? 'Active' : 'Inactive'}</Tag> },
                        ]}
                        dataSource={specializations}
                        rowKey="id"
                        loading={specsLoading}
                    />
                </div>
            ),
        },
        {
            key: 'services',
            label: 'Consultation Services',
            children: (
                <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <Text type="secondary">Categories of medical consultations (First consultation, Follow-up, Regular checkup, etc.).</Text>
                        <Button icon={<FaPlus />} onClick={() => setServiceModalOpen(true)}>
                            Add Service Category
                        </Button>
                    </div>
                    <Table
                        columns={[
                            { title: 'Service Name', dataIndex: 'name', key: 'name', render: (n) => <strong>{n}</strong> },
                            { title: 'Slug / Code', dataIndex: 'code', key: 'code', render: (c) => <code>{c}</code> },
                            { title: 'Mode', dataIndex: 'appointmentMode', key: 'appointmentMode', render: (m) => <Tag color="blue">{m}</Tag> },
                            { title: 'Description', dataIndex: 'description', key: 'description' },
                            { title: 'Status', dataIndex: 'isActive', key: 'isActive', render: (a) => <Tag color={a ? 'green' : 'default'}>{a ? 'Active' : 'Inactive'}</Tag> },
                        ]}
                        dataSource={services}
                        rowKey="id"
                        loading={servicesLoading}
                    />
                </div>
            ),
        },
    ];

    return (
        <section>
            <PageHeading
                title="Consultation Fee & Service Management"
                subtitle="Configure dynamic consultation fees by medical discipline, service type, and manage doctor fee change requests."
            />
            <Card className="super-admin__table-card">
                <Tabs items={items} />
            </Card>

            {/* Set Fee Modal */}
            <Modal
                title="Configure Specialization Fee"
                open={feeModalOpen}
                onCancel={() => { setFeeModalOpen(false); feeForm.resetFields(); }}
                footer={null}
            >
                <Form form={feeForm} layout="vertical" onFinish={handleSetFee}>
                    <Form.Item name="specializationId" label="Specialization" rules={[{ required: true, message: 'Select specialization' }]}>
                        <Select placeholder="Select specialization">
                            {specializations.map((s) => (
                                <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="serviceId" label="Consultation Service" rules={[{ required: true, message: 'Select service' }]}>
                        <Select placeholder="Select service">
                            {services.map((sv) => (
                                <Select.Option key={sv.id} value={sv.id}>{sv.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="mode" label="Appointment Mode" initialValue="IN_PERSON" rules={[{ required: true }]}>
                        <Select>
                            <Select.Option value="IN_PERSON">In-Person Consultation (Clinic)</Select.Option>
                            <Select.Option value="ONLINE">Telehealth (Online)</Select.Option>
                            <Select.Option value="BOTH">Both Modes</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="fee" label="Consultation Fee (₹)" rules={[{ required: true, message: 'Enter fee amount' }]}>
                        <InputNumber min={0} max={100000} style={{ width: '100%' }} prefix="₹" placeholder="E.g. 800" />
                    </Form.Item>
                    <div className="d-flex justify-content-end gap-2 mt-3">
                        <Button onClick={() => setFeeModalOpen(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit">Save Fee Configuration</Button>
                    </div>
                </Form>
            </Modal>

            {/* Add Specialization Modal */}
            <Modal
                title="Add Medical Specialization"
                open={specModalOpen}
                onCancel={() => { setSpecModalOpen(false); specForm.resetFields(); }}
                footer={null}
            >
                <Form form={specForm} layout="vertical" onFinish={handleCreateSpec}>
                    <Form.Item name="name" label="Specialization Name" rules={[{ required: true, message: 'Enter name' }]}>
                        <Input placeholder="E.g., Cardiology, Endocrinology" />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={3} placeholder="Field description..." />
                    </Form.Item>
                    <div className="d-flex justify-content-end gap-2 mt-3">
                        <Button onClick={() => setSpecModalOpen(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit">Add Specialization</Button>
                    </div>
                </Form>
            </Modal>

            {/* Add Service Modal */}
            <Modal
                title="Add Consultation Service Category"
                open={serviceModalOpen}
                onCancel={() => { setServiceModalOpen(false); serviceForm.resetFields(); }}
                footer={null}
            >
                <Form form={serviceForm} layout="vertical" onFinish={handleCreateService}>
                    <Form.Item name="name" label="Service Name" rules={[{ required: true, message: 'Enter service name' }]}>
                        <Input placeholder="E.g., Second Opinion Review, Pre-Op Assessment" />
                    </Form.Item>
                    <Form.Item name="code" label="Service Code (Optional)">
                        <Input placeholder="E.g., second_opinion" />
                    </Form.Item>
                    <Form.Item name="appointmentMode" label="Mode" initialValue="BOTH">
                        <Select>
                            <Select.Option value="BOTH">Both Online and In-Person</Select.Option>
                            <Select.Option value="IN_PERSON">In-Person Only</Select.Option>
                            <Select.Option value="ONLINE">Online Only</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={3} placeholder="Service description..." />
                    </Form.Item>
                    <div className="d-flex justify-content-end gap-2 mt-3">
                        <Button onClick={() => setServiceModalOpen(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit">Add Service</Button>
                    </div>
                </Form>
            </Modal>

            {/* Reject Request Modal */}
            <Modal
                title="Reject Fee Change Request"
                open={Boolean(rejectRequestModal)}
                onCancel={() => { setRejectRequestModal(null); setRejectReason(''); }}
                onOk={() => handleReviewFee(rejectRequestModal?.id, 'REJECTED', rejectReason)}
                okButtonProps={{ danger: true, disabled: rejectReason.trim().length < 5 }}
            >
                <p>Provide feedback for the doctor regarding why this fee adjustment is not approved.</p>
                <Input.TextArea
                    rows={3}
                    placeholder="E.g. Proposed fee exceeds standard regional limits for this specialization."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                />
            </Modal>
        </section>
    );
};

const PatientManagement = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const params = { page, limit: PAGE_SIZE, ...(search ? { search } : {}) };
    const { data, isLoading, error } = useGetSuperAdminPatientsQuery(params);
    const [updateStatus] = useChangeSuperAdminPatientStatusMutation();

    const changeStatus = async (patient) => {
        try {
            await updateStatus({ id: patient.id, isActive: !patient.isActive }).unwrap();
            message.success(`Patient account ${patient.isActive ? 'deactivated' : 'activated'}.`);
        } catch (requestError) {
            message.error(requestError?.data?.message || 'Patient status could not be changed.');
        }
    };

    const columns = [
        {
            title: 'Patient ID',
            dataIndex: 'id',
            key: 'id',
            render: (id) => <span className="font-monospace small text-muted">{id?.substring(0, 8)}...</span>,
        },
        {
            title: 'Profile',
            key: 'avatar',
            render: (_, patient) => <Avatar src={patient.img || defaultAvatar} icon={<FaUserInjured />} />,
        },
        {
            title: 'Patient Name',
            key: 'name',
            render: (_, patient) => (
                <div>
                    <strong>{patient.firstName} {patient.lastName}</strong>
                    <div className="super-admin__table-sub">{patient.email}</div>
                </div>
            ),
        },
        {
            title: 'Phone',
            dataIndex: 'mobile',
            key: 'mobile',
            render: (m) => m || '—',
        },
        {
            title: 'Blood Group',
            dataIndex: 'bloodGroup',
            key: 'bloodGroup',
            render: (bg) => bg ? <Tag color="volcano">{bg}</Tag> : '—',
        },
        {
            title: 'Registered Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: displayDate,
        },
        {
            title: 'Total Appointments',
            dataIndex: 'appointmentCount',
            key: 'appointmentCount',
            render: (c) => <span className="fw-semibold">{c || 0}</span>,
        },
        {
            title: 'Account Status',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (active) => <StatusTag value={active ? 'active' : 'inactive'} />,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, patient) => (
                <Space size="small">
                    <Button size="small" icon={<FaEye />} onClick={() => setSelectedPatient(patient)}>
                        View
                    </Button>
                    <Popconfirm
                        title={`${patient.isActive ? 'Deactivate' : 'Activate'} this patient account?`}
                        description={patient.isActive ? 'Patient will not be able to book appointments while deactivated.' : 'Restore patient booking access.'}
                        onConfirm={() => changeStatus(patient)}
                    >
                        <Button size="small" danger={patient.isActive}>
                            {patient.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <section>
            <PageHeading
                title="Patient Management"
                subtitle="Review registered patient accounts, appointment activity, and manage access restrictions."
            />
            <Alert
                message="Healthcare Privacy Compliance"
                description="Patient clinical medical records and personal diagnostic files are strictly protected by role-based privacy controls and excluded from administrative oversight."
                type="info"
                showIcon
                className="mb-4"
            />
            <Card className="super-admin__table-card">
                <Input.Search
                    className="super-admin__search mb-3"
                    allowClear
                    placeholder="Search by patient name, email, or mobile number..."
                    value={search}
                    onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                    style={{ maxWidth: 450 }}
                />
                <QueryError error={error} />
                <Table
                    rowKey="id"
                    loading={isLoading}
                    dataSource={data?.patients || []}
                    columns={columns}
                    scroll={{ x: 1000 }}
                    pagination={{ current: page, pageSize: PAGE_SIZE, total: data?.meta?.total || 0, onChange: setPage }}
                />
            </Card>

            {/* Patient Inspection Drawer */}
            <Drawer
                title={
                    <div className="d-flex align-items-center gap-2">
                        <Avatar src={selectedPatient?.img || defaultAvatar} size="large" />
                        <div>
                            <div className="fw-bold">{selectedPatient?.firstName} {selectedPatient?.lastName}</div>
                            <small className="text-muted">{selectedPatient?.email}</small>
                        </div>
                    </div>
                }
                open={Boolean(selectedPatient)}
                onClose={() => setSelectedPatient(null)}
                width={500}
            >
                {selectedPatient && (
                    <div className="d-flex flex-column gap-3">
                        <Descriptions column={1} bordered size="small">
                            <Descriptions.Item label="Patient ID">{selectedPatient.id}</Descriptions.Item>
                            <Descriptions.Item label="Full Name">{selectedPatient.firstName} {selectedPatient.lastName}</Descriptions.Item>
                            <Descriptions.Item label="Email">{selectedPatient.email}</Descriptions.Item>
                            <Descriptions.Item label="Phone Number">{selectedPatient.mobile || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Blood Group">{selectedPatient.bloodGroup || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Total Booked Appointments">{selectedPatient.appointmentCount || 0}</Descriptions.Item>
                            <Descriptions.Item label="Registered Date">{displayDate(selectedPatient.createdAt)}</Descriptions.Item>
                            <Descriptions.Item label="Account Status"><StatusTag value={selectedPatient.isActive ? 'active' : 'inactive'} /></Descriptions.Item>
                        </Descriptions>
                        <Alert
                            message="Medical Records Confidentiality"
                            description="Diagnostic test files and doctor prescription details belong strictly to the patient and their attending physician."
                            type="warning"
                            showIcon
                        />
                    </div>
                )}
            </Drawer>
        </section>
    );
};

const UserManagement = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [changeRole] = useChangeSuperAdminUserRoleMutation();
    const { data, isLoading, error } = useGetSuperAdminUsersQuery({
        page,
        limit: PAGE_SIZE,
        ...(search ? { search } : {}),
    });

    const updateRole = (user, role) => {
        Modal.confirm({
            title: 'Update account role?',
            content: `Change ${user.email} from ${user.role} to ${role}?`,
            okText: 'Update role',
            onOk: async () => {
                try {
                    await changeRole({ id: user.id, role }).unwrap();
                    message.success('Account role updated.');
                } catch (requestError) {
                    message.error(requestError?.data?.message || 'Account role could not be changed.');
                    throw requestError;
                }
            },
        });
    };

    const columns = [
        { title: 'Account', key: 'name', render: (_, user) => <><strong>{user.name || user.email}</strong><small className="super-admin__table-sub">{user.email}</small></> },
        { title: 'Role', dataIndex: 'role', render: (role) => <Tag color={role === 'super_admin' ? 'purple' : 'blue'}>{role}</Tag> },
        { title: 'Status', dataIndex: 'accountStatus', render: (status) => <StatusTag value={status} /> },
        { title: 'Created', dataIndex: 'createdAt', render: displayDate },
        { title: 'Change role', key: 'roleEditor', render: (_, user) => user.role === 'super_admin'
            ? <Tag color="purple">Protected</Tag>
            : (
                <Select
                    size="small"
                    value={user.role}
                    onChange={(role) => updateRole(user, role)}
                    options={user.availableRoles.map((role) => ({
                        value: role,
                        label: role === 'admin' ? 'Administrator' : role,
                    }))}
                />
            ) },
    ];

    return (
        <section>
            <PageHeading title="Users and roles" subtitle="Review account roles and grant or change standard platform roles. Super Admin accounts are protected." />
            <Card className="super-admin__table-card">
                <Input.Search className="super-admin__search" allowClear placeholder="Search account email" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
                <QueryError error={error} />
                <Table rowKey="id" loading={isLoading} dataSource={data?.users || []} columns={columns} pagination={{ current: page, pageSize: PAGE_SIZE, total: data?.meta?.total || 0, onChange: setPage }} />
            </Card>
        </section>
    );
};

const AppointmentManagement = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const params = { page, limit: PAGE_SIZE, ...(search ? { search } : {}), ...(status ? { status } : {}) };
    const { data, isLoading, error } = useGetSuperAdminAppointmentsQuery(params);
    const columns = [
        { title: 'Patient', key: 'patient', render: (_, appointment) => `${appointment.firstName || 'Guest'} ${appointment.lastName || ''}` },
        { title: 'Doctor', key: 'doctor', render: (_, appointment) => appointment.doctor ? `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}` : '—' },
        { title: 'Schedule', key: 'schedule', render: (_, appointment) => `${appointment.scheduleDate || '—'} ${appointment.scheduleTime || ''}` },
        { title: 'Status', dataIndex: 'status', render: (value) => <StatusTag value={value} /> },
        { title: 'Payment', dataIndex: 'paymentStatus', render: (value) => value || '—' },
        { title: 'Tracking ID', dataIndex: 'trackingId', render: (value) => value || '—' },
        { title: 'Created', dataIndex: 'createdAt', render: displayDate },
    ];
    return (
        <section>
            <PageHeading title="Appointment monitoring" subtitle="Search and filter appointment activity. Medical notes and reasons for visits are not included." />
            <Card className="super-admin__table-card">
                <div className="super-admin__filters super-admin__filters--appointments">
                    <Input.Search allowClear placeholder="Search patient or doctor" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
                    <Select allowClear value={status || undefined} placeholder="All statuses" onChange={(value) => { setStatus(value || ''); setPage(1); }}
                        options={['pending', 'scheduled', 'confirmed', 'Completed', 'cancel', 'archived'].map((value) => ({ value, label: value }))} />
                    <Input type="date" aria-label="From date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} />
                    <Input type="date" aria-label="To date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} />
                </div>
                <QueryError error={error} />
                <Table rowKey="id" loading={isLoading} dataSource={data?.appointments || []} columns={columns} scroll={{ x: 900 }} pagination={{ current: page, pageSize: PAGE_SIZE, total: data?.meta?.total || 0, onChange: setPage }} />
            </Card>
        </section>
    );
};

const ActivityLog = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const { data, isLoading, error } = useGetSuperAdminActivityLogsQuery({ page, limit: PAGE_SIZE, ...(search ? { search } : {}) });
    const columns = [
        { title: 'Time', dataIndex: 'createdAt', render: displayDate },
        { title: 'Actor', dataIndex: 'actorEmail' },
        { title: 'Action', dataIndex: 'action', render: (value) => <Tag color="blue">{value}</Tag> },
        { title: 'Entity', key: 'entity', render: (_, log) => `${log.entityType}${log.entityId ? ` · ${log.entityId}` : ''}` },
        { title: 'Metadata', dataIndex: 'metadata', render: (value) => value ? JSON.stringify(value) : '—' },
    ];
    return (
        <section>
            <PageHeading title="Administrative activity" subtitle="Read-only audit trail for platform actions and doctor registration events." />
            <Card className="super-admin__table-card">
                <Input.Search className="super-admin__search" allowClear placeholder="Search actor or action" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
                <QueryError error={error} />
                <Table rowKey="id" loading={isLoading} dataSource={data?.logs || []} columns={columns} scroll={{ x: 800 }} pagination={{ current: page, pageSize: PAGE_SIZE, total: data?.meta?.total || 0, onChange: setPage }} />
            </Card>
        </section>
    );
};

const SuperAdminPages = ({ section }) => {
    if (section === 'doctors') return <DoctorManagement />;
    if (section === 'fees') return <FeeManagement />;
    if (section === 'patients') return <PatientManagement />;
    if (section === 'users') return <UserManagement />;
    if (section === 'appointments') return <AppointmentManagement />;
    if (section === 'activity') return <ActivityLog />;
    return <DashboardOverview />;
};

export default SuperAdminPages;
