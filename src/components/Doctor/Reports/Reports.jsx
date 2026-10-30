import React, { useState, useMemo } from 'react';
import DashboardLayout from '../DashboardLayout/DashboardLayout';
import useAuthCheck from '../../../redux/hooks/useAuthCheck';
import {
    useGetDoctorReportsQuery,
    useGetPatientReportsQuery,
    useCreateMedicalReportMutation,
    useDeleteMedicalReportMutation
} from '../../../redux/api/medicalReportApi';
import { useGetDoctorPatientsQuery } from '../../../redux/api/appointmentApi';
import {
    Table,
    Card,
    Button,
    Tag,
    Modal,
    Input,
    Select,
    DatePicker,
    Space,
    Popconfirm,
    message,
    Form,
    Typography,
    Avatar
} from 'antd';
import {
    FaFileMedical,
    FaPlus,
    FaEye,
    FaTrash,
    FaSearch,
    FaUser,
    FaDownload,
    FaFilePdf,
    FaXRay,
    FaVial,
    FaHeartbeat
} from 'react-icons/fa';
import moment from 'moment';
import './Reports.css';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const REPORT_TYPES = [
    'X-Ray',
    'Blood Test',
    'MRI Scan',
    'CT Scan',
    'Ultrasound',
    'ECG / EKG',
    'Urine Analysis',
    'Biopsy',
    'Lab Test',
    'Other'
];

const Reports = () => {
    const { role } = useAuthCheck();

    return (
        <DashboardLayout>
            {role === 'doctor' ? <DoctorReportsView /> : <PatientReportsView />}
        </DashboardLayout>
    );
};

const DoctorReportsView = () => {
    const { data: reportsData, isLoading, refetch } = useGetDoctorReportsQuery();
    const { data: patientsData } = useGetDoctorPatientsQuery();
    const [createReport, { isLoading: isCreating }] = useCreateMedicalReportMutation();
    const [deleteReport, { isLoading: isDeleting }] = useDeleteMedicalReportMutation();

    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState(undefined);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [form] = Form.useForm();

    const reports = reportsData || [];
    const patients = patientsData || [];

    const filteredReports = useMemo(() => {
        let result = reports;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(r =>
                r.reportTitle?.toLowerCase().includes(term) ||
                `${r.patient?.firstName} ${r.patient?.lastName}`.toLowerCase().includes(term) ||
                r.description?.toLowerCase().includes(term)
            );
        }
        if (typeFilter) {
            result = result.filter(r => r.reportType === typeFilter);
        }
        return result;
    }, [reports, searchTerm, typeFilter]);

    const stats = useMemo(() => {
        return {
            total: reports.length,
            xray: reports.filter(r => r.reportType === 'X-Ray').length,
            tests: reports.filter(r => ['Blood Test', 'Lab Test', 'Urine Analysis'].includes(r.reportType)).length,
            scans: reports.filter(r => ['MRI Scan', 'CT Scan', 'Ultrasound'].includes(r.reportType)).length,
        };
    }, [reports]);

    const handleCreateReport = async (values) => {
        try {
            await createReport({
                patientId: values.patientId,
                reportType: values.reportType,
                reportTitle: values.reportTitle,
                description: values.description,
                reportDate: values.reportDate ? values.reportDate.format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
                status: values.status || 'completed',
                fileUrl: values.fileUrl || null,
                fileName: values.fileName || null,
            }).unwrap();

            message.success('Medical report uploaded successfully');
            setIsUploadModalOpen(false);
            form.resetFields();
            refetch();
        } catch (error) {
            message.error(error?.data?.message || 'Failed to upload report');
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteReport(id).unwrap();
            message.success('Report deleted successfully');
            refetch();
        } catch (error) {
            message.error(error?.data?.message || 'Failed to delete report');
        }
    };

    const handleView = (report) => {
        setSelectedReport(report);
        setIsDetailModalOpen(true);
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'X-Ray': return 'blue';
            case 'Blood Test': return 'green';
            case 'MRI Scan': return 'purple';
            case 'CT Scan': return 'cyan';
            case 'Ultrasound': return 'geekblue';
            case 'ECG / EKG': return 'magenta';
            default: return 'orange';
        }
    };

    const columns = [
        {
            title: 'Patient',
            key: 'patient',
            render: (_, record) => (
                <div className="d-flex align-items-center">
                    <Avatar icon={<FaUser />} size={38} className="me-2" style={{ backgroundColor: '#667eea' }} />
                    <div>
                        <div className="fw-bold">{record.patient?.firstName} {record.patient?.lastName}</div>
                        <div className="text-muted small">{record.patient?.email}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Report Type',
            dataIndex: 'reportType',
            key: 'reportType',
            render: (type) => <Tag color={getTypeColor(type)}>{type}</Tag>,
        },
        {
            title: 'Report Title',
            dataIndex: 'reportTitle',
            key: 'reportTitle',
            render: (title) => <span className="fw-semibold text-dark">{title}</span>,
        },
        {
            title: 'Date',
            dataIndex: 'reportDate',
            key: 'reportDate',
            render: (date) => moment(date).format('MMM DD, YYYY'),
        },
        {
            title: 'Uploaded By',
            dataIndex: 'uploadedBy',
            key: 'uploadedBy',
            render: (by) => (
                <Tag color={by === 'doctor' ? 'blue' : 'gold'}>
                    {by === 'doctor' ? 'Healthcare Provider' : 'Patient Upload'}
                </Tag>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'completed' || status === 'normal' ? 'success' : status === 'abnormal' ? 'error' : 'default'}>
                    {status || 'Completed'}
                </Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right',
            width: 170,
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        size="small"
                        icon={<FaEye />}
                        onClick={() => handleView(record)}
                    >
                        View
                    </Button>
                    <Popconfirm
                        title="Delete report?"
                        description="Are you sure you want to remove this medical report?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button danger size="small" icon={<FaTrash />} loading={isDeleting} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="reports-page">
            <div className="reports-header">
                <div>
                    <h2 className="reports-header-title">Patient Medical Reports</h2>
                    <p className="reports-header-subtitle">
                        Inspect, upload, and organize diagnostic tests, X-rays, lab results, and patient imaging scans.
                    </p>
                </div>
                <Button
                    type="primary"
                    icon={<FaPlus />}
                    size="large"
                    onClick={() => setIsUploadModalOpen(true)}
                    style={{ borderRadius: 8 }}
                >
                    Upload Patient Report
                </Button>
            </div>

            <div className="reports-stat-grid">
                <div className="reports-stat-card">
                    <div className="reports-stat-icon reports-stat-icon--blue">
                        <FaFileMedical />
                    </div>
                    <div>
                        <div className="reports-stat-value">{stats.total}</div>
                        <div className="reports-stat-label">Total Reports</div>
                    </div>
                </div>
                <div className="reports-stat-card">
                    <div className="reports-stat-icon reports-stat-icon--indigo">
                        <FaXRay />
                    </div>
                    <div>
                        <div className="reports-stat-value">{stats.xray}</div>
                        <div className="reports-stat-label">X-Ray Reports</div>
                    </div>
                </div>
                <div className="reports-stat-card">
                    <div className="reports-stat-icon reports-stat-icon--emerald">
                        <FaVial />
                    </div>
                    <div>
                        <div className="reports-stat-value">{stats.tests}</div>
                        <div className="reports-stat-label">Lab &amp; Blood Tests</div>
                    </div>
                </div>
                <div className="reports-stat-card">
                    <div className="reports-stat-icon reports-stat-icon--amber">
                        <FaHeartbeat />
                    </div>
                    <div>
                        <div className="reports-stat-value">{stats.scans}</div>
                        <div className="reports-stat-label">Scans &amp; Imaging</div>
                    </div>
                </div>
            </div>

            <Card className="reports-table-card">
                <div className="reports-filter-bar">
                    <Input
                        placeholder="Search patient name, report title..."
                        prefix={<FaSearch className="text-muted" />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: 300, borderRadius: 6 }}
                        allowClear
                    />
                    <Select
                        placeholder="Filter by Report Type"
                        style={{ width: 200 }}
                        value={typeFilter}
                        onChange={setTypeFilter}
                        allowClear
                    >
                        {REPORT_TYPES.map((t) => (
                            <Option key={t} value={t}>{t}</Option>
                        ))}
                    </Select>
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredReports}
                    rowKey="id"
                    loading={isLoading}
                    pagination={{ pageSize: 10, showTotal: (t) => `Total ${t} patient reports` }}
                    scroll={{ x: 850 }}
                />
            </Card>

            {/* Upload Patient Report Modal */}
            <Modal
                title="Upload Patient Report (X-Ray / Diagnostic Test)"
                open={isUploadModalOpen}
                onCancel={() => {
                    setIsUploadModalOpen(false);
                    form.resetFields();
                }}
                footer={null}
                width={650}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreateReport}
                    initialValues={{
                        reportType: 'X-Ray',
                        reportDate: moment(),
                        status: 'completed'
                    }}
                >
                    <Form.Item
                        name="patientId"
                        label="Select Patient"
                        rules={[{ required: true, message: 'Please select a patient' }]}
                    >
                        <Select placeholder="Choose patient" showSearch optionFilterProp="children">
                            {patients.map((p) => (
                                <Option key={p.id} value={p.id}>
                                    {p.firstName} {p.lastName} ({p.email || p.mobile || 'No contact'})
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <div className="row">
                        <div className="col-md-6">
                            <Form.Item
                                name="reportType"
                                label="Report Type"
                                rules={[{ required: true, message: 'Please select report type' }]}
                            >
                                <Select>
                                    {REPORT_TYPES.map((t) => (
                                        <Option key={t} value={t}>{t}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </div>
                        <div className="col-md-6">
                            <Form.Item
                                name="reportDate"
                                label="Report / Test Date"
                                rules={[{ required: true, message: 'Please select report date' }]}
                            >
                                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                            </Form.Item>
                        </div>
                    </div>

                    <Form.Item
                        name="reportTitle"
                        label="Report Title / Test Name"
                        rules={[{ required: true, message: 'Please enter report title' }]}
                    >
                        <Input placeholder="e.g. Chest X-Ray (PA View), Complete Blood Count" />
                    </Form.Item>

                    <div className="row">
                        <div className="col-md-6">
                            <Form.Item name="status" label="Report Status / Finding">
                                <Select>
                                    <Option value="completed">Completed / Normal</Option>
                                    <Option value="abnormal">Abnormal Findings</Option>
                                    <Option value="pending">Pending Follow-up</Option>
                                </Select>
                            </Form.Item>
                        </div>
                        <div className="col-md-6">
                            <Form.Item name="fileName" label="File / Attachment Name">
                                <Input placeholder="e.g. chest-xray-scan.png or report.pdf" />
                            </Form.Item>
                        </div>
                    </div>

                    <Form.Item
                        name="fileUrl"
                        label="Report File URL or Image Document"
                        help="Enter image URL, hosted scan link, or document file link"
                    >
                        <Input placeholder="https://... or /images/..." />
                    </Form.Item>

                    <Form.Item name="description" label="Clinical Findings &amp; Observations">
                        <TextArea rows={4} placeholder="Detailed observations, diagnostic findings, radiologist/lab notes for this test..." />
                    </Form.Item>

                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <Button onClick={() => setIsUploadModalOpen(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={isCreating}>
                            Save &amp; Upload Report
                        </Button>
                    </div>
                </Form>
            </Modal>

            {/* View Report Detail Modal */}
            <Modal
                title={`Medical Report: ${selectedReport?.reportTitle}`}
                open={isDetailModalOpen}
                onCancel={() => setIsDetailModalOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setIsDetailModalOpen(false)}>Close</Button>
                ]}
                width={700}
            >
                {selectedReport && (
                    <div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <Tag color={getTypeColor(selectedReport.reportType)} style={{ fontSize: '0.9rem', padding: '4px 10px' }}>
                                {selectedReport.reportType}
                            </Tag>
                            <span className="text-muted">
                                Test Date: <strong>{moment(selectedReport.reportDate).format('MMMM DD, YYYY')}</strong>
                            </span>
                        </div>

                        <div className="card p-3 mb-3 bg-light border-0">
                            <h6 className="mb-2 text-primary">Patient Details</h6>
                            <div><strong>Name:</strong> {selectedReport.patient?.firstName} {selectedReport.patient?.lastName}</div>
                            <div><strong>Email:</strong> {selectedReport.patient?.email || 'N/A'}</div>
                            <div><strong>Mobile:</strong> {selectedReport.patient?.mobile || 'N/A'}</div>
                        </div>

                        <div className="mb-3">
                            <h6 className="fw-bold">Clinical Findings &amp; Description</h6>
                            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                {selectedReport.description || 'No detailed clinical notes provided.'}
                            </p>
                        </div>

                        {selectedReport.fileUrl ? (
                            <div className="report-detail-preview">
                                <h6 className="fw-bold mb-2">Attached Scan / Document</h6>
                                {selectedReport.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) ? (
                                    <img src={selectedReport.fileUrl} alt="Report Scan" />
                                ) : (
                                    <div className="d-flex align-items-center gap-2">
                                        <FaFilePdf className="text-danger" size={24} />
                                        <a href={selectedReport.fileUrl} target="_blank" rel="noopener noreferrer">
                                            {selectedReport.fileName || 'View Attached Medical Document'}
                                        </a>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                )}
            </Modal>
        </div>
    );
};

const PatientReportsView = () => {
    const { data: reportsData, isLoading, refetch } = useGetPatientReportsQuery();
    const [createReport, { isLoading: isCreating }] = useCreateMedicalReportMutation();
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState(undefined);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [form] = Form.useForm();

    const reports = reportsData || [];

    const filteredReports = useMemo(() => {
        let result = reports;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(r =>
                r.reportTitle?.toLowerCase().includes(term) ||
                r.description?.toLowerCase().includes(term) ||
                `${r.doctor?.firstName} ${r.doctor?.lastName}`.toLowerCase().includes(term)
            );
        }
        if (typeFilter) {
            result = result.filter(r => r.reportType === typeFilter);
        }
        return result;
    }, [reports, searchTerm, typeFilter]);

    const handleCreateReport = async (values) => {
        try {
            await createReport({
                reportType: values.reportType,
                reportTitle: values.reportTitle,
                description: values.description,
                reportDate: values.reportDate ? values.reportDate.format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
                status: 'completed',
                fileUrl: values.fileUrl || null,
                fileName: values.fileName || null,
            }).unwrap();

            message.success('Report uploaded successfully');
            setIsUploadModalOpen(false);
            form.resetFields();
            refetch();
        } catch (error) {
            message.error(error?.data?.message || 'Failed to upload report');
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'X-Ray': return 'blue';
            case 'Blood Test': return 'green';
            case 'MRI Scan': return 'purple';
            case 'CT Scan': return 'cyan';
            default: return 'orange';
        }
    };

    const columns = [
        {
            title: 'Report Title',
            key: 'reportTitle',
            render: (_, record) => (
                <div>
                    <div className="fw-bold">{record.reportTitle}</div>
                    <Tag color={getTypeColor(record.reportType)} className="mt-1">{record.reportType}</Tag>
                </div>
            ),
        },
        {
            title: 'Healthcare Provider / Doctor',
            key: 'doctor',
            render: (_, record) => record.doctor ? (
                <div>
                    <div className="fw-semibold">Dr. {record.doctor.firstName} {record.doctor.lastName}</div>
                    <div className="text-muted small">{record.doctor.specialization}</div>
                </div>
            ) : (
                <span className="text-muted">Self / External Clinic</span>
            ),
        },
        {
            title: 'Date',
            dataIndex: 'reportDate',
            key: 'reportDate',
            render: (date) => moment(date).format('MMM DD, YYYY'),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'completed' || status === 'normal' ? 'success' : status === 'abnormal' ? 'error' : 'default'}>
                    {status || 'Completed'}
                </Tag>
            ),
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Button
                    type="primary"
                    size="small"
                    icon={<FaEye />}
                    onClick={() => {
                        setSelectedReport(record);
                        setIsDetailModalOpen(true);
                    }}
                >
                    View Details
                </Button>
            ),
        },
    ];

    return (
        <div className="reports-page">
            <div className="reports-header">
                <div>
                    <h2 className="reports-header-title">My Medical Reports</h2>
                    <p className="reports-header-subtitle">
                        View your personal diagnostic reports, X-rays, blood tests, and scans uploaded by your doctor or yourself.
                    </p>
                </div>
                <Button
                    type="primary"
                    icon={<FaPlus />}
                    size="large"
                    onClick={() => setIsUploadModalOpen(true)}
                    style={{ borderRadius: 8 }}
                >
                    Upload My Test Report
                </Button>
            </div>

            <Card className="reports-table-card">
                <div className="reports-filter-bar">
                    <Input
                        placeholder="Search your reports..."
                        prefix={<FaSearch className="text-muted" />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: 280, borderRadius: 6 }}
                        allowClear
                    />
                    <Select
                        placeholder="Filter by Type"
                        style={{ width: 180 }}
                        value={typeFilter}
                        onChange={setTypeFilter}
                        allowClear
                    >
                        {REPORT_TYPES.map((t) => (
                            <Option key={t} value={t}>{t}</Option>
                        ))}
                    </Select>
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredReports}
                    rowKey="id"
                    loading={isLoading}
                    pagination={{ pageSize: 8 }}
                    scroll={{ x: 750 }}
                />
            </Card>

            {/* Patient Upload Modal */}
            <Modal
                title="Upload Medical Report"
                open={isUploadModalOpen}
                onCancel={() => {
                    setIsUploadModalOpen(false);
                    form.resetFields();
                }}
                footer={null}
                width={580}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreateReport}
                    initialValues={{
                        reportType: 'Blood Test',
                        reportDate: moment(),
                    }}
                >
                    <div className="row">
                        <div className="col-md-6">
                            <Form.Item
                                name="reportType"
                                label="Report Type"
                                rules={[{ required: true, message: 'Please select report type' }]}
                            >
                                <Select>
                                    {REPORT_TYPES.map((t) => (
                                        <Option key={t} value={t}>{t}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </div>
                        <div className="col-md-6">
                            <Form.Item
                                name="reportDate"
                                label="Date"
                                rules={[{ required: true, message: 'Please select date' }]}
                            >
                                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                            </Form.Item>
                        </div>
                    </div>

                    <Form.Item
                        name="reportTitle"
                        label="Report Title / Name"
                        rules={[{ required: true, message: 'Please enter report name' }]}
                    >
                        <Input placeholder="e.g. Chest X-Ray, Blood Lipid Panel, Dental OPG" />
                    </Form.Item>

                    <Form.Item
                        name="fileUrl"
                        label="Report Scan or Document URL"
                        help="Enter file URL, scan image link, or cloud document"
                    >
                        <Input placeholder="https://..." />
                    </Form.Item>

                    <Form.Item name="description" label="Notes / Clinical Observations">
                        <TextArea rows={3} placeholder="Notes from test lab or any symptoms you want your doctor to see..." />
                    </Form.Item>

                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <Button onClick={() => setIsUploadModalOpen(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={isCreating}>
                            Upload Report
                        </Button>
                    </div>
                </Form>
            </Modal>

            {/* View Detail Modal */}
            <Modal
                title={selectedReport?.reportTitle}
                open={isDetailModalOpen}
                onCancel={() => setIsDetailModalOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setIsDetailModalOpen(false)}>Close</Button>
                ]}
                width={650}
            >
                {selectedReport && (
                    <div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <Tag color={getTypeColor(selectedReport.reportType)}>
                                {selectedReport.reportType}
                            </Tag>
                            <span className="text-muted small">
                                {moment(selectedReport.reportDate).format('MMM DD, YYYY')}
                            </span>
                        </div>

                        {selectedReport.doctor && (
                            <div className="p-3 bg-light rounded mb-3">
                                <strong>Consulting Doctor:</strong> Dr. {selectedReport.doctor.firstName} {selectedReport.doctor.lastName} ({selectedReport.doctor.specialization})
                            </div>
                        )}

                        <div className="mb-3">
                            <h6 className="fw-bold">Report Findings / Summary</h6>
                            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                {selectedReport.description || 'No detailed text notes recorded for this test.'}
                            </p>
                        </div>

                        {selectedReport.fileUrl && (
                            <div className="report-detail-preview">
                                <h6 className="fw-bold mb-2">Scan Document</h6>
                                {selectedReport.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) ? (
                                    <img src={selectedReport.fileUrl} alt="Report Scan" />
                                ) : (
                                    <a href={selectedReport.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm">
                                        <FaDownload className="me-1" /> Open Document
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Reports;

