import React, { useState } from 'react';
import DashboardLayout from '../DashboardLayout/DashboardLayout';
import {
    useGetDoctorPatientsQuery,
    useGetDoctorAppointmentsQuery,
    useUpdateAppointmentMutation
} from '../../../redux/api/appointmentApi';
import {
    Card,
    Table,
    Input,
    Avatar,
    Tag,
    Button,
    Modal,
    Space,
    Form,
    Select,
    DatePicker,
    message
} from 'antd';
import {
    FaEye,
    FaPhone,
    FaEnvelope,
    FaMapMarkerAlt,
    FaCalendar,
    FaUser,
    FaSearch,
    FaNotesMedical,
    FaUserEdit,
    FaClipboardList
} from 'react-icons/fa';
import moment from 'moment';
import './MyPatients.css';

const { Option } = Select;
const { TextArea } = Input;

const MyPatients = () => {
    const { data, isLoading, refetch } = useGetDoctorPatientsQuery();
    const { data: appointmentsData } = useGetDoctorAppointmentsQuery({});
    const [updateAppointment, { isLoading: isUpdating }] = useUpdateAppointmentMutation();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [isViewModalVisible, setIsViewModalVisible] = useState(false);
    const [isFeedModalVisible, setIsFeedModalVisible] = useState(false);
    const [feedForm] = Form.useForm();

    const appointments = appointmentsData || [];

    const getInitPatientName = (item) => {
        const fullName = `${item?.firstName ?? ''} ${item?.lastName ?? ''}`;
        return fullName.trim() || "Private Patient";
    };

    const handleViewDetails = (patient) => {
        setSelectedPatient(patient);
        setIsViewModalVisible(true);
    };

    const handleOpenFeedData = (patient) => {
        setSelectedPatient(patient);
        setIsFeedModalVisible(true);
        // Find existing appointment for this patient if any
        const patientAppt = appointments.find(a =>
            a.patientId === patient.id ||
            a.email?.toLowerCase() === patient.email?.toLowerCase()
        );

        feedForm.setFieldsValue({
            appointmentId: patientAppt?.id || undefined,
            reasonForVisit: patientAppt?.reasonForVisit || '',
            description: patientAppt?.description || '',
            status: patientAppt?.status || 'Completed',
            patientType: patientAppt?.patientType || 'General Consultation',
        });
    };

    const handleFeedDataSubmit = async (values) => {
        try {
            if (!values.appointmentId) {
                message.error('Please select an appointment record for this patient');
                return;
            }

            await updateAppointment({
                id: values.appointmentId,
                data: {
                    status: values.status,
                    reasonForVisit: values.reasonForVisit,
                    description: values.description,
                    patientType: values.patientType,
                }
            }).unwrap();

            message.success('Care details and patient instructions fed successfully! The patient can view this in their portal.');
            setIsFeedModalVisible(false);
            feedForm.resetFields();
            refetch();
        } catch (error) {
            message.error(error?.data?.message || 'Failed to update patient appointment data');
        }
    };

    const filteredData = data?.filter(patient => {
        const searchLower = searchTerm.toLowerCase();
        const fullName = getInitPatientName(patient).toLowerCase();
        return fullName.includes(searchLower) || 
               patient?.email?.toLowerCase().includes(searchLower) ||
               patient?.mobile?.includes(searchTerm);
    });

    const columns = [
        {
            title: 'Patient Details',
            key: 'patient',
            render: (_, record) => (
                <div className="d-flex align-items-center">
                    <Avatar 
                        src={record?.img} 
                        icon={<FaUser />} 
                        size={46}
                    />
                    <div className="ms-3">
                        <div className="fw-bold">{getInitPatientName(record)}</div>
                        <div className="text-muted small">ID: #{record?.trackingId || record?.id}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Contact Information',
            key: 'contact',
            render: (_, record) => (
                <div>
                    <div className="d-flex align-items-center mb-1">
                        <FaEnvelope className="text-muted me-2" />
                        <span className="small">{record?.email || 'N/A'}</span>
                    </div>
                    <div className="d-flex align-items-center">
                        <FaPhone className="text-muted me-2" />
                        <span className="small">{record?.mobile || 'N/A'}</span>
                    </div>
                </div>
            ),
        },
        {
            title: 'Last Visit Date',
            dataIndex: 'appointmentTime',
            key: 'lastVisit',
            render: (date) => (date ? moment(date).format('MMM DD, YYYY') : 'Recent Visit'),
            sorter: (a, b) => moment(a.appointmentTime).unix() - moment(b.appointmentTime).unix(),
        },
        {
            title: 'Address',
            dataIndex: 'address',
            key: 'address',
            ellipsis: true,
            render: (text) => text || 'N/A',
        },
        {
            title: 'Prescription Status',
            key: 'status',
            render: (_, record) => {
                const isPrescriptionIssued = record?.prescriptionStatus === 'issued';
                return (
                    <Tag color={isPrescriptionIssued ? 'success' : 'warning'}>
                        {isPrescriptionIssued ? 'Prescription Issued' : 'Pending Treatment'}
                    </Tag>
                );
            },
        },
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right',
            width: 250,
            render: (_, record) => (
                <Space wrap>
                    <Button 
                        type="default" 
                        icon={<FaEye />} 
                        size="small"
                        onClick={() => handleViewDetails(record)}
                    >
                        View
                    </Button>
                    <Button 
                        type="primary" 
                        icon={<FaNotesMedical />} 
                        size="small"
                        onClick={() => handleOpenFeedData(record)}
                        style={{ backgroundColor: '#4f46e5', borderColor: '#4f46e5' }}
                    >
                        Feed Care Data
                    </Button>
                </Space>
            ),
        },
    ];

    const stats = [
        {
            title: 'Total Patients',
            count: data?.length || 0,
            color: 'primary',
            icon: <FaUser />,
        },
        {
            title: 'Prescriptions Issued',
            count: data?.filter(p => p?.prescriptionStatus === 'issued')?.length || 0,
            color: 'success',
            icon: <FaCalendar />,
        },
        {
            title: 'Pending Consultation',
            count: data?.filter(p => p?.prescriptionStatus !== 'issued')?.length || 0,
            color: 'warning',
            icon: <FaCalendar />,
        },
    ];

    return (
        <DashboardLayout>
            <div className="dashboard-card">
                <div className="dashboard-card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                        <h3 className="dashboard-card-title mb-1">My Patients &amp; Patient Care Data</h3>
                        <p className="text-muted small mb-0">
                            Search patient records by name or contact and feed consultation notes, advice, and appointment details.
                        </p>
                    </div>
                </div>

                <div className="stats-mini-grid mb-4">
                    {stats.map((stat, index) => (
                        <Card key={index} className={`stat-mini-card stat-mini-card-${stat.color}`}>
                            <div className="stat-mini-icon">{stat.icon}</div>
                            <div className="stat-mini-details">
                                <div className="stat-mini-title">{stat.title}</div>
                                <div className="stat-mini-count">{stat.count}</div>
                            </div>
                        </Card>
                    ))}
                </div>

                <Card>
                    <div className="table-toolbar mb-3">
                        <Input
                            placeholder="Search patient by name, email, or contact phone..."
                            prefix={<FaSearch />}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            size="large"
                            allowClear
                            style={{ maxWidth: 450 }}
                        />
                    </div>

                    <Table
                        columns={columns}
                        dataSource={filteredData}
                        rowKey="id"
                        loading={isLoading}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total) => `Total ${total} patients found`,
                        }}
                        scroll={{ x: 1000 }}
                    />
                </Card>
            </div>

            {/* View Patient Details Modal */}
            <Modal
                title="Patient Record &amp; Contact Info"
                open={isViewModalVisible}
                onCancel={() => setIsViewModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setIsViewModalVisible(false)}>Close</Button>,
                    <Button
                        key="feed"
                        type="primary"
                        icon={<FaNotesMedical />}
                        onClick={() => {
                            setIsViewModalVisible(false);
                            handleOpenFeedData(selectedPatient);
                        }}
                    >
                        Feed Appointment Data
                    </Button>
                ]}
                width={650}
            >
                {selectedPatient && (
                    <div>
                        <div className="text-center mb-4 pt-2">
                            <Avatar src={selectedPatient?.img} icon={<FaUser />} size={80} />
                            <h4 className="mt-3 mb-1">{getInitPatientName(selectedPatient)}</h4>
                            <Tag color={selectedPatient?.prescriptionStatus === 'issued' ? 'success' : 'warning'}>
                                {selectedPatient?.prescriptionStatus === 'issued' ? 'Prescription Issued' : 'Pending Treatment'}
                            </Tag>
                        </div>

                        <div className="patient-info-grid">
                            <div className="info-item">
                                <FaUser className="info-icon" />
                                <div>
                                    <div className="info-label">Patient ID</div>
                                    <div className="info-value">#{selectedPatient?.trackingId || selectedPatient?.id}</div>
                                </div>
                            </div>

                            <div className="info-item">
                                <FaEnvelope className="info-icon" />
                                <div>
                                    <div className="info-label">Email</div>
                                    <div className="info-value">{selectedPatient?.email || 'N/A'}</div>
                                </div>
                            </div>

                            <div className="info-item">
                                <FaPhone className="info-icon" />
                                <div>
                                    <div className="info-label">Phone Contact</div>
                                    <div className="info-value">{selectedPatient?.mobile || 'N/A'}</div>
                                </div>
                            </div>

                            <div className="info-item">
                                <FaCalendar className="info-icon" />
                                <div>
                                    <div className="info-label">Last Visit Date</div>
                                    <div className="info-value">
                                        {moment(selectedPatient?.appointmentTime).format('MMM DD, YYYY')}
                                    </div>
                                </div>
                            </div>

                            <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                                <FaMapMarkerAlt className="info-icon" />
                                <div>
                                    <div className="info-label">Residential Address</div>
                                    <div className="info-value">{selectedPatient?.address || 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Feed Care & Appointment Data Modal */}
            <Modal
                title={`Feed Appointment & Care Data: ${getInitPatientName(selectedPatient)}`}
                open={isFeedModalVisible}
                onCancel={() => {
                    setIsFeedModalVisible(false);
                    feedForm.resetFields();
                }}
                footer={null}
                width={700}
            >
                <div className="p-3 bg-light rounded mb-3 border">
                    <div className="row">
                        <div className="col-md-6">
                            <strong>Patient:</strong> {getInitPatientName(selectedPatient)}
                        </div>
                        <div className="col-md-6">
                            <strong>Contact:</strong> {selectedPatient?.email} | {selectedPatient?.mobile || 'N/A'}
                        </div>
                    </div>
                </div>

                <Form
                    form={feedForm}
                    layout="vertical"
                    onFinish={handleFeedDataSubmit}
                >
                    <Form.Item
                        name="appointmentId"
                        label="Select Appointment to Update"
                        rules={[{ required: true, message: 'Please select an appointment' }]}
                    >
                        <Select placeholder="Choose appointment session">
                            {appointments
                                .filter(a =>
                                    a.patientId === selectedPatient?.id ||
                                    a.email?.toLowerCase() === selectedPatient?.email?.toLowerCase()
                                )
                                .map(apt => (
                                    <Option key={apt.id} value={apt.id}>
                                        #{apt.trackingId} — {moment(apt.scheduleDate).format('MMM DD, YYYY')} at {apt.scheduleTime} ({apt.status})
                                    </Option>
                                ))
                            }
                        </Select>
                    </Form.Item>

                    <div className="row">
                        <div className="col-md-6">
                            <Form.Item name="patientType" label="Care Category">
                                <Select>
                                    <Option value="General Consultation">General Consultation</Option>
                                    <Option value="Follow-up">Follow-up Visit</Option>
                                    <Option value="Specialist Review">Specialist Review</Option>
                                    <Option value="Emergency Care">Emergency Care</Option>
                                </Select>
                            </Form.Item>
                        </div>
                        <div className="col-md-6">
                            <Form.Item name="status" label="Appointment Status">
                                <Select>
                                    <Option value="scheduled">Scheduled</Option>
                                    <Option value="Completed">Appointment Done</Option>
                                    <Option value="Patient Not Came">Patient Not Came</Option>
                                    <Option value="pending">Pending</Option>
                                </Select>
                            </Form.Item>
                        </div>
                    </div>

                    <Form.Item
                        name="reasonForVisit"
                        label="Chief Complaint / Clinical Diagnosis"
                        rules={[{ required: true, message: 'Please enter reason / diagnosis' }]}
                    >
                        <Input placeholder="e.g. Hypertension management and seasonal cough" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Information &amp; Details Patient Needs to Know"
                        help="Feed instructions, diet advice, medication notes, or home-care details visible to patient."
                        rules={[{ required: true, message: 'Please provide details or advice for the patient' }]}
                    >
                        <TextArea
                            rows={4}
                            placeholder="Enter clinical advice, medication guidance, test instructions, precautions, and follow-up guidance that the patient needs to know..."
                        />
                    </Form.Item>

                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <Button onClick={() => setIsFeedModalVisible(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={isUpdating}>
                            Save &amp; Feed Patient Data
                        </Button>
                    </div>
                </Form>
            </Modal>
        </DashboardLayout>
    );
};

export default MyPatients;
