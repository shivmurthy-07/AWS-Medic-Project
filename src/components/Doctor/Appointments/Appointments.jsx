import React, { useState, useMemo } from 'react';
import DashboardLayout from '../DashboardLayout/DashboardLayout';
import { Table, Tag, Button, Input, Select, DatePicker, Space, Modal, message, Card, Popconfirm, Avatar, Tooltip } from 'antd';
import {
    FaEye,
    FaCheck,
    FaTimes,
    FaBriefcaseMedical,
    FaSearch,
    FaCheckCircle,
    FaUserTimes,
    FaCalendarCheck,
    FaUserMd,
    FaFilePrescription
} from 'react-icons/fa';
import {
    useGetDoctorAppointmentsQuery,
    useGetPatientAppointmentsQuery,
    useUpdateAppointmentMutation
} from '../../../redux/api/appointmentApi';
import useAuthCheck from '../../../redux/hooks/useAuthCheck';
import moment from 'moment';
import { Link } from 'react-router-dom';
import './Appointments.css';

const { RangePicker } = DatePicker;

const Appointments = () => {
    const { role } = useAuthCheck();

    return (
        <DashboardLayout>
            {role === 'doctor' ? <DoctorAppointmentsTable /> : <PatientAppointmentsTable />}
        </DashboardLayout>
    );
};

const DoctorAppointmentsTable = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState(undefined);
    const [dateRange, setDateRange] = useState(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const { data, isLoading, refetch } = useGetDoctorAppointmentsQuery({});
    const [updateAppointment, { isLoading: isUpdating }] = useUpdateAppointmentMutation();

    const appointments = data || [];

    const filteredAppointments = useMemo(() => {
        let result = appointments;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(apt =>
                `${apt.firstName} ${apt.lastName}`.toLowerCase().includes(term) ||
                apt.trackingId?.toLowerCase().includes(term) ||
                apt.email?.toLowerCase().includes(term) ||
                apt.phone?.includes(term)
            );
        }

        if (statusFilter) {
            result = result.filter(apt => apt.status === statusFilter);
        }

        if (dateRange) {
            result = result.filter(apt => {
                const aptDate = moment(apt.scheduleDate);
                return aptDate.isBetween(dateRange[0], dateRange[1], 'day', '[]');
            });
        }

        return result;
    }, [appointments, searchTerm, statusFilter, dateRange]);

    const stats = useMemo(() => {
        return {
            total: appointments.length,
            pending: appointments.filter(a => a.status === 'pending').length,
            scheduled: appointments.filter(a => a.status === 'scheduled').length,
            today: appointments.filter(a => moment(a.scheduleDate).isSame(moment(), 'day')).length,
            completed: appointments.filter(a => a.status === 'Completed').length,
            notCame: appointments.filter(a => a.status === 'Patient Not Came' || a.status === 'Not Attended').length,
        };
    }, [appointments]);

    const handleStatusUpdate = async (id, status) => {
        try {
            await updateAppointment({ id, data: { status } }).unwrap();
            message.success(`Appointment status updated to: ${status === 'Completed' ? 'Appointment Done' : status}`);
            refetch();
        } catch (error) {
            message.error(error?.data?.message || 'Failed to update appointment status');
        }
    };

    const handleViewDetails = (record) => {
        Modal.info({
            title: `Appointment Details - #${record.trackingId}`,
            width: 650,
            content: (
                <div className="appointment-details-modal pt-2">
                    <h5 className="text-primary mb-3">Patient Information</h5>
                    <p><strong>Name:</strong> {record.firstName} {record.lastName}</p>
                    <p><strong>Email:</strong> {record.email || 'N/A'}</p>
                    <p><strong>Phone:</strong> {record.phone || 'N/A'}</p>
                    <p><strong>Address:</strong> {record.address || 'N/A'}</p>
                    <hr />
                    <h5 className="text-primary mb-3">Appointment Timing &amp; Status</h5>
                    <p><strong>Appointment Date:</strong> {moment(record.scheduleDate).format('MMMM DD, YYYY')}</p>
                    <p><strong>Scheduled Time:</strong> <Tag color="blue" style={{ fontSize: '0.9rem' }}>{record.scheduleTime}</Tag></p>
                    <p><strong>Reason for Visit:</strong> {record.reasonForVisit || 'General Consultation'}</p>
                    {record.description && <p><strong>Notes:</strong> {record.description}</p>}
                    <p><strong>Current Status:</strong> {renderStatusTag(record.status)}</p>
                    <p><strong>Payment Status:</strong> <Tag color={record.paymentStatus === 'paid' ? 'green' : 'orange'}>{record.paymentStatus || 'unpaid'}</Tag></p>
                    <p><strong>Prescription:</strong> <Tag color={record.prescriptionStatus === 'issued' ? 'green' : 'gold'}>{record.prescriptionStatus || 'notIssued'}</Tag></p>
                </div>
            ),
        });
    };

    const renderStatusTag = (status) => {
        switch (status) {
            case 'Completed':
                return <Tag color="success">Appointment Done</Tag>;
            case 'Patient Not Came':
            case 'Not Attended':
            case 'No-Show':
                return <Tag color="volcano">Patient Not Came</Tag>;
            case 'scheduled':
                return <Tag color="blue">Scheduled</Tag>;
            case 'pending':
                return <Tag color="gold">Pending</Tag>;
            case 'cancel':
            case 'canceled':
            case 'Canceled':
                return <Tag color="red">Cancelled</Tag>;
            default:
                return <Tag color="default">{status || 'Unknown'}</Tag>;
        }
    };

    const columns = [
        {
            title: 'Patient',
            key: 'patient',
            render: (_, record) => (
                <div>
                    <div className="fw-bold">{record.firstName} {record.lastName}</div>
                    <div className="text-muted small">{record.email}</div>
                    <div className="text-muted small">Tracking: #{record.trackingId}</div>
                </div>
            ),
        },
        {
            title: 'Appointment Time',
            key: 'datetime',
            render: (_, record) => (
                <div>
                    <div className="fw-semibold text-dark">{moment(record.scheduleDate).format('MMM DD, YYYY')}</div>
                    <Tag color="cyan" className="mt-1 font-monospace">{record.scheduleTime}</Tag>
                </div>
            ),
            sorter: (a, b) => moment(a.scheduleDate).unix() - moment(b.scheduleDate).unix(),
        },
        {
            title: 'Reason for Visit',
            dataIndex: 'reasonForVisit',
            key: 'reason',
            ellipsis: true,
            render: (text) => text || 'General Medical Consultation',
        },
        {
            title: 'Appointment Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => renderStatusTag(status),
        },
        {
            title: 'Payment',
            dataIndex: 'paymentStatus',
            key: 'payment',
            render: (status) => (
                <Tag color={status === 'paid' ? 'green' : 'orange'}>{status || 'unpaid'}</Tag>
            ),
        },
        {
            title: 'Actions & Attendance',
            key: 'actions',
            fixed: 'right',
            width: 320,
            render: (_, record) => (
                <Space wrap size="small">
                    <Button
                        type="default"
                        icon={<FaEye />}
                        onClick={() => handleViewDetails(record)}
                        size="small"
                    >
                        View
                    </Button>

                    {/* Pending actions */}
                    {record.status === 'pending' && (
                        <>
                            <Button
                                type="primary"
                                icon={<FaCheck />}
                                size="small"
                                onClick={() => handleStatusUpdate(record.id, 'scheduled')}
                            >
                                Accept
                            </Button>
                            <Button
                                danger
                                icon={<FaTimes />}
                                size="small"
                                onClick={() => handleStatusUpdate(record.id, 'cancel')}
                            >
                                Cancel
                            </Button>
                        </>
                    )}

                    {/* Scheduled or active actions: Mark Appointment Done or Patient Not Came */}
                    {(record.status === 'scheduled' || record.status === 'pending') && (
                        <>
                            <Popconfirm
                                title="Mark appointment as Done?"
                                description="This will set the appointment status to Completed."
                                onConfirm={() => handleStatusUpdate(record.id, 'Completed')}
                                okText="Yes, Done"
                                cancelText="No"
                            >
                                <Button
                                    type="primary"
                                    style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
                                    icon={<FaCheckCircle />}
                                    size="small"
                                >
                                    Done
                                </Button>
                            </Popconfirm>

                            <Popconfirm
                                title="Mark as Patient Not Came?"
                                description="This will mark the patient as absent / no-show."
                                onConfirm={() => handleStatusUpdate(record.id, 'Patient Not Came')}
                                okText="Yes, Not Came"
                                cancelText="No"
                            >
                                <Button
                                    danger
                                    icon={<FaUserTimes />}
                                    size="small"
                                >
                                    Not Came
                                </Button>
                            </Popconfirm>
                        </>
                    )}

                    {/* If completed, doctor can still toggle or issue prescription */}
                    {record.status === 'Completed' && (
                        <>
                            {record.prescriptionStatus === 'notIssued' ? (
                                <Link to={`/dashboard/appointment/treatment/${record.id}`}>
                                    <Button type="primary" icon={<FaBriefcaseMedical />} size="small">
                                        Prescribe
                                    </Button>
                                </Link>
                            ) : (
                                <Link to={`/dashboard/prescription/${record.prescription?.[0]?.id || ''}`}>
                                    <Button type="default" icon={<FaFilePrescription />} size="small">Prescription</Button>
                                </Link>
                            )}
                            <Popconfirm
                                title="Change status to Patient Not Came?"
                                onConfirm={() => handleStatusUpdate(record.id, 'Patient Not Came')}
                            >
                                <Button size="small" type="link" danger>Mark Absent</Button>
                            </Popconfirm>
                        </>
                    )}

                    {/* If marked Not Came, can restore if patient arrived */}
                    {(record.status === 'Patient Not Came' || record.status === 'Not Attended') && (
                        <Popconfirm
                            title="Mark appointment as Done?"
                            onConfirm={() => handleStatusUpdate(record.id, 'Completed')}
                        >
                            <Button size="small" type="primary" style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}>
                                Mark Done
                            </Button>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h2 className="mb-1" style={{ fontSize: '1.45rem', fontWeight: 700 }}>Appointment List</h2>
                    <p className="text-muted small mb-0">
                        View scheduled patient consultation times, record attendance (Appointment Done / Patient Not Came), and manage care.
                    </p>
                </div>
            </div>

            <div className="row mb-3">
                <div className="col-md-2 col-sm-4 mb-3">
                    <Card className="stat-mini-card">
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">Total</div>
                    </Card>
                </div>
                <div className="col-md-2 col-sm-4 mb-3">
                    <Card className="stat-mini-card stat-info">
                        <div className="stat-value">{stats.scheduled}</div>
                        <div className="stat-label">Scheduled</div>
                    </Card>
                </div>
                <div className="col-md-2 col-sm-4 mb-3">
                    <Card className="stat-mini-card stat-warning">
                        <div className="stat-value">{stats.pending}</div>
                        <div className="stat-label">Pending</div>
                    </Card>
                </div>
                <div className="col-md-2 col-sm-4 mb-3">
                    <Card className="stat-mini-card stat-success">
                        <div className="stat-value" style={{ color: '#10b981' }}>{stats.completed}</div>
                        <div className="stat-label">Done</div>
                    </Card>
                </div>
                <div className="col-md-2 col-sm-4 mb-3">
                    <Card className="stat-mini-card" style={{ borderLeft: '4px solid #ef4444' }}>
                        <div className="stat-value" style={{ color: '#ef4444' }}>{stats.notCame}</div>
                        <div className="stat-label">Not Came</div>
                    </Card>
                </div>
                <div className="col-md-2 col-sm-4 mb-3">
                    <Card className="stat-mini-card stat-info">
                        <div className="stat-value">{stats.today}</div>
                        <div className="stat-label">Today</div>
                    </Card>
                </div>
            </div>

            <div className="dashboard-card">
                <div className="table-toolbar mb-3 d-flex flex-wrap gap-2">
                    <Input
                        placeholder="Search patient name, email, tracking ID..."
                        prefix={<FaSearch />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: 280 }}
                        allowClear
                    />
                    <Select
                        placeholder="Filter by status"
                        value={statusFilter}
                        onChange={setStatusFilter}
                        style={{ width: 200 }}
                        allowClear
                        options={[
                            { label: 'All Statuses', value: '' },
                            { label: 'Scheduled', value: 'scheduled' },
                            { label: 'Appointment Done', value: 'Completed' },
                            { label: 'Patient Not Came', value: 'Patient Not Came' },
                            { label: 'Pending', value: 'pending' },
                            { label: 'Cancelled', value: 'cancel' },
                        ]}
                    />
                    <RangePicker
                        value={dateRange}
                        onChange={setDateRange}
                        format="MMM DD, YYYY"
                        style={{ width: 260 }}
                    />
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredAppointments}
                    rowKey="id"
                    loading={isLoading}
                    pagination={{
                        current: page,
                        pageSize,
                        total: filteredAppointments.length,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} appointments`,
                        onChange: (p, ps) => {
                            setPage(p);
                            setPageSize(ps);
                        },
                    }}
                    scroll={{ x: 1100 }}
                />
            </div>
        </div>
    );
};

const PatientAppointmentsTable = () => {
    const { data, isLoading } = useGetPatientAppointmentsQuery();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState(undefined);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const appointments = data || [];

    const filtered = useMemo(() => {
        let result = appointments;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(apt =>
                `${apt.doctor?.firstName} ${apt.doctor?.lastName}`.toLowerCase().includes(term) ||
                apt.doctor?.specialization?.toLowerCase().includes(term) ||
                apt.trackingId?.toLowerCase().includes(term)
            );
        }
        if (statusFilter) {
            result = result.filter(apt => apt.status === statusFilter);
        }
        return result;
    }, [appointments, searchTerm, statusFilter]);

    const renderStatusTag = (status) => {
        switch (status) {
            case 'Completed':
                return <Tag color="success">Appointment Done</Tag>;
            case 'Patient Not Came':
            case 'Not Attended':
                return <Tag color="volcano">Missed / Not Attended</Tag>;
            case 'scheduled':
                return <Tag color="blue">Scheduled</Tag>;
            case 'pending':
                return <Tag color="gold">Pending Confirmation</Tag>;
            case 'cancel':
            case 'canceled':
                return <Tag color="red">Cancelled</Tag>;
            default:
                return <Tag color="default">{status || 'Scheduled'}</Tag>;
        }
    };

    const columns = [
        {
            title: 'Consulting Doctor',
            key: 'doctor',
            render: (_, record) => (
                <div className="d-flex align-items-center">
                    <Avatar src={record.doctor?.img} icon={<FaUserMd />} size={42} className="me-2" />
                    <div>
                        <div className="fw-bold">Dr. {record.doctor?.firstName} {record.doctor?.lastName}</div>
                        <div className="text-muted small">{record.doctor?.specialization}</div>
                        <div className="text-muted small">{record.doctor?.clinicName}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Scheduled Date & Time',
            key: 'datetime',
            render: (_, record) => (
                <div>
                    <div className="fw-semibold text-dark">{moment(record.scheduleDate).format('MMM DD, YYYY')}</div>
                    <Tag color="cyan" className="mt-1 font-monospace">{record.scheduleTime}</Tag>
                </div>
            ),
        },
        {
            title: 'Tracking ID',
            dataIndex: 'trackingId',
            key: 'trackingId',
            render: (id) => <Tag color="#667eea">#{id}</Tag>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => renderStatusTag(status),
        },
        {
            title: 'Payment Status',
            dataIndex: 'paymentStatus',
            key: 'payment',
            render: (status) => (
                <Tag color={status === 'paid' ? 'green' : 'orange'}>{status || 'unpaid'}</Tag>
            ),
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        size="small"
                        icon={<FaEye />}
                        onClick={() => {
                            setSelectedAppointment(record);
                            setIsModalOpen(true);
                        }}
                    >
                        Details
                    </Button>
                    {record.prescription?.[0]?.id && (
                        <Link to={`/dashboard/prescription/${record.prescription[0].id}`}>
                            <Button size="small" type="default" icon={<FaFilePrescription />}>
                                Prescription
                            </Button>
                        </Link>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h2 className="mb-1" style={{ fontSize: '1.45rem', fontWeight: 700 }}>My Appointments</h2>
                    <p className="text-muted small mb-0">
                        View upcoming doctor consultations, scheduled timings, visit statuses, and prescriptions.
                    </p>
                </div>
                <Link to="/appointment">
                    <Button type="primary" size="large" style={{ borderRadius: 8 }}>
                        Book New Appointment
                    </Button>
                </Link>
            </div>

            <div className="dashboard-card">
                <div className="table-toolbar mb-3 d-flex flex-wrap gap-2">
                    <Input
                        placeholder="Search by doctor name or tracking ID..."
                        prefix={<FaSearch />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: 280 }}
                        allowClear
                    />
                    <Select
                        placeholder="Filter status"
                        value={statusFilter}
                        onChange={setStatusFilter}
                        style={{ width: 180 }}
                        allowClear
                        options={[
                            { label: 'All', value: '' },
                            { label: 'Scheduled', value: 'scheduled' },
                            { label: 'Done', value: 'Completed' },
                            { label: 'Pending', value: 'pending' },
                            { label: 'Cancelled', value: 'cancel' },
                        ]}
                    />
                </div>

                <Table
                    columns={columns}
                    dataSource={filtered}
                    rowKey="id"
                    loading={isLoading}
                    pagination={{ pageSize: 8 }}
                    scroll={{ x: 900 }}
                />
            </div>

            <Modal
                title="Appointment Details"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setIsModalOpen(false)}>Close</Button>
                ]}
                width={600}
            >
                {selectedAppointment && (
                    <div className="pt-2">
                        <div className="p-3 bg-light rounded mb-3">
                            <h6 className="text-primary mb-2">Doctor Information</h6>
                            <div><strong>Doctor:</strong> Dr. {selectedAppointment.doctor?.firstName} {selectedAppointment.doctor?.lastName}</div>
                            <div><strong>Specialization:</strong> {selectedAppointment.doctor?.specialization}</div>
                            <div><strong>Clinic:</strong> {selectedAppointment.doctor?.clinicName || selectedAppointment.doctor?.address}</div>
                        </div>

                        <div className="mb-3">
                            <h6 className="fw-bold mb-2">Appointment Schedule</h6>
                            <p><strong>Date:</strong> {moment(selectedAppointment.scheduleDate).format('MMMM DD, YYYY')}</p>
                            <p><strong>Scheduled Time Slot:</strong> <Tag color="blue">{selectedAppointment.scheduleTime}</Tag></p>
                            <p><strong>Visit Status:</strong> {renderStatusTag(selectedAppointment.status)}</p>
                            <p><strong>Tracking Number:</strong> #{selectedAppointment.trackingId}</p>
                            <p><strong>Payment Status:</strong> <Tag color={selectedAppointment.paymentStatus === 'paid' ? 'green' : 'orange'}>{selectedAppointment.paymentStatus || 'unpaid'}</Tag></p>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Appointments;
