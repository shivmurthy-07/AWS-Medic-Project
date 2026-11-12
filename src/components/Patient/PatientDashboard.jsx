import React, { useMemo } from 'react';
import { Card, Table, Tag, Button, Avatar, Typography, Row, Col, Empty, Spin } from 'antd';
import {
    FaCalendarCheck,
    FaClock,
    FaCheckCircle,
    FaTimesCircle,
    FaCalendarPlus,
    FaNotesMedical,
    FaPills,
    FaFileMedical,
    FaVial,
    FaFileInvoiceDollar,
    FaUserMd,
    FaArrowRight,
    FaEye,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import moment from 'moment';
import useAuthCheck from '../../redux/hooks/useAuthCheck';
import { useGetPatientAppointmentsQuery, useGetPatientInvoicesQuery } from '../../redux/api/appointmentApi';
import { useGetPatientReportsQuery } from '../../redux/api/medicalReportApi';
import { useGetPatientPrescriptionQuery } from '../../redux/api/prescriptionApi';
import { formatCurrency } from '../../utils/formatCurrency';
import defaultAvatar from '../../images/avatar.jpg';
import './PatientDashboard.css';

const { Title, Text } = Typography;

const PatientDashboard = () => {
    const { data: user } = useAuthCheck();
    const { data: appointmentsData, isLoading: appointmentsLoading } = useGetPatientAppointmentsQuery({});
    const { data: invoicesData, isLoading: invoicesLoading } = useGetPatientInvoicesQuery();
    const { data: reportsData, isLoading: reportsLoading } = useGetPatientReportsQuery({});
    const { data: prescriptionsData, isLoading: prescriptionsLoading } = useGetPatientPrescriptionQuery();

    const appointments = appointmentsData || [];
    const invoices = invoicesData || [];
    const reports = reportsData?.data || reportsData || [];
    const prescriptions = prescriptionsData || [];

    // Appointments calculation
    const stats = useMemo(() => {
        const total = appointments.length;
        const upcoming = appointments.filter((a) => {
            const isCompleted = ['completed', 'Completed'].includes(a.status);
            const isCancelled = ['cancel', 'cancelled', 'canceled'].includes(a.status?.toLowerCase());
            return !isCompleted && !isCancelled;
        }).length;
        const completed = appointments.filter((a) => ['completed', 'Completed'].includes(a.status)).length;
        const cancelled = appointments.filter((a) => ['cancel', 'cancelled', 'canceled'].includes(a.status?.toLowerCase())).length;
        return { total, upcoming, completed, cancelled };
    }, [appointments]);

    // Split reports into imaging vs lab
    const imagingReports = useMemo(() => {
        return reports.filter((r) => r.category === 'IMAGING' || ['x-ray', 'mri', 'ct scan', 'ultrasound', 'ecg'].some(t => (r.reportType || '').toLowerCase().includes(t)));
    }, [reports]);

    const labReports = useMemo(() => {
        return reports.filter((r) => r.category === 'LAB' || ['blood', 'sugar', 'lipid', 'thyroid', 'urine', 'cbc', 'lft', 'kft'].some(t => (r.reportType || '').toLowerCase().includes(t)));
    }, [reports]);

    const recentAppointments = appointments.slice(0, 5);
    const recentPrescriptions = prescriptions.slice(0, 4);
    const recentImaging = imagingReports.slice(0, 4);
    const recentLab = labReports.slice(0, 4);
    const recentInvoices = invoices.slice(0, 5);

    const appointmentColumns = [
        {
            title: 'Doctor',
            key: 'doctor',
            render: (_, item) => (
                <div className="d-flex align-items-center gap-2">
                    <Avatar src={item?.doctor?.img || defaultAvatar} icon={<FaUserMd />} />
                    <div>
                        <strong>Dr. {item?.doctor?.firstName} {item?.doctor?.lastName}</strong>
                        <div className="text-muted small">{item?.doctor?.specialization || 'Healthcare Specialist'}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Schedule',
            key: 'schedule',
            render: (_, item) => (
                <div>
                    <div>{moment(item.scheduleDate).format('MMM DD, YYYY')}</div>
                    <small className="text-muted">{item.scheduleTime}</small>
                </div>
            ),
        },
        {
            title: 'Consultation',
            dataIndex: 'consultationType',
            key: 'consultationType',
            render: (type, item) => (
                <div>
                    <span>{type || 'General Checkup'}</span>
                    <small className="d-block text-muted">{item.consultationMode === 'ONLINE' ? 'Telehealth (Online)' : 'In-Person'}</small>
                </div>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const s = String(status).toLowerCase();
                let color = 'gold';
                if (s === 'completed') color = 'green';
                else if (s.includes('cancel')) color = 'red';
                else if (s === 'scheduled' || s === 'confirmed') color = 'blue';
                return <Tag color={color}>{status || 'Pending'}</Tag>;
            },
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, item) => (
                <Link to={`/dashboard/appointments/${item.id}`}>
                    <Button size="small" icon={<FaEye />}>View</Button>
                </Link>
            ),
        },
    ];

    const invoiceColumns = [
        {
            title: 'Invoice ID',
            dataIndex: 'id',
            key: 'id',
            render: (id) => <span className="font-monospace small">{id?.substring(0, 8)}...</span>,
        },
        {
            title: 'Doctor Fee',
            dataIndex: 'DoctorFee',
            key: 'DoctorFee',
            render: (fee) => formatCurrency(fee || 0),
        },
        {
            title: 'Booking Fee',
            dataIndex: 'bookingFee',
            key: 'bookingFee',
            render: (fee) => formatCurrency(fee || 0),
        },
        {
            title: 'Total Amount',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            render: (total) => <strong>{formatCurrency(total || 0)}</strong>,
        },
        {
            title: 'Method',
            dataIndex: 'paymentMethod',
            key: 'paymentMethod',
            render: (m) => <Tag color="blue">{String(m).toUpperCase()}</Tag>,
        },
    ];

    return (
        <div className="patient-dashboard">
            {/* Welcome Banner */}
            <div className="patient-hero-banner mb-4">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                    <div className="d-flex align-items-center gap-3">
                        <Avatar
                            size={72}
                            src={user?.img || defaultAvatar}
                            className="patient-hero-avatar shadow-sm"
                        />
                        <div>
                            <span className="badge bg-light text-primary px-3 py-1 mb-1 rounded-pill fw-semibold">Patient Portal</span>
                            <Title level={2} className="mb-0 text-white">
                                Welcome, {user?.firstName} {user?.lastName}!
                            </Title>
                            <Text className="text-white-50">
                                Track consultations, inspect test results, and manage your health journey in one secure place.
                            </Text>
                        </div>
                    </div>
                    <div className="patient-hero-actions d-flex flex-wrap gap-2">
                        <Link to="/doctors">
                            <Button size="large" icon={<FaCalendarPlus />} className="btn-hero-primary">
                                Book Appointment
                            </Button>
                        </Link>
                        <Link to="/dashboard/medical-records">
                            <Button size="large" icon={<FaNotesMedical />} className="btn-hero-secondary">
                                Medical History
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Quick action buttons row */}
                <div className="patient-quick-pills mt-4 pt-3 border-top border-white-50 d-flex flex-wrap gap-2">
                    <Link to="/doctors" className="patient-quick-pill">
                        <FaCalendarPlus /> Book Appointment
                    </Link>
                    <Link to="/dashboard/medical-records" className="patient-quick-pill">
                        <FaNotesMedical /> View Medical Records
                    </Link>
                    <Link to="/dashboard/prescription" className="patient-quick-pill">
                        <FaPills /> View Prescriptions
                    </Link>
                    <Link to="/dashboard/imaging-reports" className="patient-quick-pill">
                        <FaFileMedical /> View Imaging Reports
                    </Link>
                    <Link to="/dashboard/lab-reports" className="patient-quick-pill">
                        <FaVial /> View Laboratory Reports
                    </Link>
                </div>
            </div>

            {/* Metric Statistics Cards */}
            <Row gutter={[16, 16]} className="mb-4">
                <Col xs={24} sm={12} lg={6}>
                    <Card className="patient-stat-card border-0 shadow-sm stat-blue">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <Text className="patient-stat-label">Total Appointments</Text>
                                <Title level={2} className="patient-stat-number mb-0">{stats.totalAppointments || stats.total}</Title>
                            </div>
                            <div className="patient-stat-icon-wrap bg-blue-subtle text-primary">
                                <FaCalendarCheck />
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="patient-stat-card border-0 shadow-sm stat-green">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <Text className="patient-stat-label">Upcoming</Text>
                                <Title level={2} className="patient-stat-number mb-0">{stats.upcomingAppointments || stats.upcoming}</Title>
                            </div>
                            <div className="patient-stat-icon-wrap bg-green-subtle text-success">
                                <FaClock />
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="patient-stat-card border-0 shadow-sm stat-purple">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <Text className="patient-stat-label">Completed</Text>
                                <Title level={2} className="patient-stat-number mb-0">{stats.completedAppointments || stats.completed}</Title>
                            </div>
                            <div className="patient-stat-icon-wrap bg-purple-subtle text-info">
                                <FaCheckCircle />
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="patient-stat-card border-0 shadow-sm stat-amber">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <Text className="patient-stat-label">Cancelled</Text>
                                <Title level={2} className="patient-stat-number mb-0">{stats.cancelledAppointments || stats.cancelled}</Title>
                            </div>
                            <div className="patient-stat-icon-wrap bg-amber-subtle text-warning">
                                <FaTimesCircle />
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Recent Appointments & Prescriptions */}
            <Row gutter={[16, 16]} className="mb-4">
                <Col xs={24} lg={16}>
                    <Card
                        title={
                            <div className="d-flex align-items-center justify-content-between">
                                <span className="fw-bold"><FaCalendarCheck className="text-primary me-2" /> Recent Consultations</span>
                                <Link to="/dashboard/appointments">
                                    <Button type="link" size="small">View all <FaArrowRight className="ms-1 small" /></Button>
                                </Link>
                            </div>
                        }
                        className="shadow-sm border-0 h-100"
                    >
                        <Table
                            columns={appointmentColumns}
                            dataSource={recentAppointments}
                            rowKey="id"
                            loading={appointmentsLoading}
                            pagination={false}
                            locale={{ emptyText: <Empty description="No appointments scheduled yet" /> }}
                            scroll={{ x: 600 }}
                        />
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card
                        title={
                            <div className="d-flex align-items-center justify-content-between">
                                <span className="fw-bold"><FaPills className="text-success me-2" /> Recent Prescriptions</span>
                                <Link to="/dashboard/prescription">
                                    <Button type="link" size="small">View all <FaArrowRight className="ms-1 small" /></Button>
                                </Link>
                            </div>
                        }
                        className="shadow-sm border-0 h-100"
                    >
                        {prescriptionsLoading ? (
                            <div className="text-center py-4"><Spin /></div>
                        ) : recentPrescriptions.length === 0 ? (
                            <Empty description="No prescriptions issued yet" />
                        ) : (
                            <div className="d-flex flex-column gap-3">
                                {recentPrescriptions.map((p) => (
                                    <div key={p.id} className="p-3 bg-light rounded-3 border">
                                        <div className="d-flex justify-content-between align-items-start mb-1">
                                            <strong>Dr. {p?.doctor?.firstName} {p?.doctor?.lastName}</strong>
                                            <small className="text-muted">{moment(p.createdAt).format('MMM DD')}</small>
                                        </div>
                                        <div className="text-muted small mb-2">{p.disease || p.daignosis || 'General Care'}</div>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <Tag color="cyan">{p.medicines?.length || 0} medicines</Tag>
                                            <Link to={`/dashboard/prescription/${p.id}`}>
                                                <Button size="small" type="link">Open Rx</Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* Recent Medical Reports (Imaging & Lab) */}
            <Row gutter={[16, 16]} className="mb-4">
                <Col xs={24} lg={12}>
                    <Card
                        title={
                            <div className="d-flex align-items-center justify-content-between">
                                <span className="fw-bold"><FaFileMedical className="text-primary me-2" /> X-Ray & Imaging Reports</span>
                                <Link to="/dashboard/imaging-reports">
                                    <Button type="link" size="small">View all <FaArrowRight className="ms-1 small" /></Button>
                                </Link>
                            </div>
                        }
                        className="shadow-sm border-0 h-100"
                    >
                        {reportsLoading ? (
                            <div className="text-center py-4"><Spin /></div>
                        ) : recentImaging.length === 0 ? (
                            <Empty description="No imaging reports uploaded yet" />
                        ) : (
                            <div className="d-flex flex-column gap-2">
                                {recentImaging.map((report) => (
                                    <div key={report.id} className="d-flex align-items-center justify-content-between p-2 border-bottom">
                                        <div>
                                            <div className="fw-semibold">{report.reportTitle}</div>
                                            <small className="text-muted">
                                                {report.reportType} · {moment(report.reportDate || report.createdAt).format('MMM DD, YYYY')}
                                            </small>
                                        </div>
                                        <Link to="/dashboard/imaging-reports">
                                            <Button size="small" icon={<FaEye />}>Inspect</Button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </Col>

                <Col xs={24} lg={12}>
                    <Card
                        title={
                            <div className="d-flex align-items-center justify-content-between">
                                <span className="fw-bold"><FaVial className="text-info me-2" /> Laboratory Reports</span>
                                <Link to="/dashboard/lab-reports">
                                    <Button type="link" size="small">View all <FaArrowRight className="ms-1 small" /></Button>
                                </Link>
                            </div>
                        }
                        className="shadow-sm border-0 h-100"
                    >
                        {reportsLoading ? (
                            <div className="text-center py-4"><Spin /></div>
                        ) : recentLab.length === 0 ? (
                            <Empty description="No laboratory reports recorded yet" />
                        ) : (
                            <div className="d-flex flex-column gap-2">
                                {recentLab.map((report) => (
                                    <div key={report.id} className="d-flex align-items-center justify-content-between p-2 border-bottom">
                                        <div>
                                            <div className="fw-semibold">{report.reportTitle}</div>
                                            <small className="text-muted">
                                                {report.reportType} · {report.hospitalOrLab || 'Diagnostic Center'} · {moment(report.reportDate || report.createdAt).format('MMM DD, YYYY')}
                                            </small>
                                        </div>
                                        <Link to="/dashboard/lab-reports">
                                            <Button size="small" icon={<FaEye />}>Inspect</Button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* Recent Payment Details */}
            <Card
                title={
                    <div className="d-flex align-items-center justify-content-between">
                        <span className="fw-bold"><FaFileInvoiceDollar className="text-warning me-2" /> Recent Invoices & Payments</span>
                        <Link to="/dashboard/invoices">
                            <Button type="link" size="small">View all <FaArrowRight className="ms-1 small" /></Button>
                        </Link>
                    </div>
                }
                className="shadow-sm border-0 mb-4"
            >
                <Table
                    columns={invoiceColumns}
                    dataSource={recentInvoices}
                    rowKey="id"
                    loading={invoicesLoading}
                    pagination={false}
                    locale={{ emptyText: <Empty description="No payment transactions recorded yet" /> }}
                    scroll={{ x: 600 }}
                />
            </Card>
        </div>
    );
};

export default PatientDashboard;

