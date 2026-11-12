import React, { useState, useMemo } from 'react';
import DashboardLayout from '../DashboardLayout/DashboardLayout';
import useAuthCheck from '../../../redux/hooks/useAuthCheck';
import ClinicalReportViewer from '../../Patient/MedicalRecords/ClinicalReportViewer';
import {
    useGetDoctorReportsQuery,
    useGetPatientReportsQuery,
    useCreateMedicalReportMutation,
    useDeleteMedicalReportMutation
} from '../../../redux/api/medicalReportApi';
import { useGetDoctorPatientsQuery, useGetDoctorAppointmentsQuery } from '../../../redux/api/appointmentApi';
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
    Avatar,
    Alert
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
    FaHeartbeat,
} from 'react-icons/fa';
import moment from 'moment';
import {
    CLINICAL_PROBLEM_TYPES,
    filterReportsByProblem,
    detectProblemCategory,
    buildConsultationReportDraft,
} from '../../../utils/clinicalProblemMatcher';
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
    const { data: appointmentsData } = useGetDoctorAppointmentsQuery({});
    const [createReport, { isLoading: isCreating }] = useCreateMedicalReportMutation();
    const [deleteReport, { isLoading: isDeleting }] = useDeleteMedicalReportMutation();

    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState(undefined);
    const [problemFilter, setProblemFilter] = useState(CLINICAL_PROBLEM_TYPES.ALL);
    const [selectedProblemInModal, setSelectedProblemInModal] = useState(CLINICAL_PROBLEM_TYPES.GENERAL_CONSULTATION);
    const [selectedPatientId, setSelectedPatientId] = useState(undefined);
    const [draftFindings, setDraftFindings] = useState([]);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState(undefined);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [form] = Form.useForm();

    const reports = reportsData || [];
    const patients = patientsData || [];

    // Strictly list ONLY Completed consultations for the selected patient
    const patientAppointments = useMemo(() => {
        if (!selectedPatientId || !appointmentsData) return [];
        return appointmentsData.filter(a => a.patientId === selectedPatientId && a.status === 'Completed');
    }, [selectedPatientId, appointmentsData]);

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
        if (problemFilter) {
            result = filterReportsByProblem(result, problemFilter);
        }
        return result;
    }, [reports, searchTerm, typeFilter, problemFilter]);

    const handleAutofillForProblem = (problemKey, apptOverride = null) => {
        const appt = apptOverride || appointmentsData?.find(a => a.id === selectedAppointmentId) || null;
        const draft = buildConsultationReportDraft(appt, problemKey);
        setDraftFindings(draft.findings || []);
        form.setFieldsValue({
            patientProblem: draft.problemKey,
            reportTitle: draft.reportTitle,
            reportType: draft.reportType,
            category: draft.category,
            hospitalOrLab: draft.hospitalOrLab,
            description: draft.description,
            doctorComments: draft.doctorComments,
            fileUrl: null,
            fileName: null,
            status: 'completed',
        });
        message.success(`Clinical draft loaded: ${draft.reportTitle}`);
    };

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
            const linkedAppt = appointmentsData?.find(a => a.id === values.appointmentId);
            if (!linkedAppt || linkedAppt.status !== 'Completed') {
                message.warning('Select a Completed consultation appointment before issuing an official medical report.');
                return;
            }
            const validCategories = new Set(['IMAGING', 'LAB', 'GENERAL', 'OTHER']);
            const category = validCategories.has(values.category) ? values.category : 'GENERAL';

            await createReport({
                appointmentId: values.appointmentId,
                patientId: values.patientId,
                reportType: values.reportType,
                reportTitle: values.reportTitle,
                category,
                hospitalOrLab: values.hospitalOrLab || null,
                doctorComments: values.doctorComments || null,
                description: values.description,
                recordResults: {
                    problemKey: selectedProblemInModal,
                    findings: draftFindings,
                    impression: values.doctorComments || '',
                },
                reportDate: values.reportDate ? values.reportDate.format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
                status: values.status || 'completed',
                fileUrl: values.fileUrl || null,
                fileName: values.fileName || null,
            }).unwrap();

            message.success('Post-consultation medical report published successfully');
            setIsUploadModalOpen(false);
            form.resetFields();
            setSelectedPatientId(undefined);
            setSelectedAppointmentId(undefined);
            setDraftFindings([]);
            refetch();
        } catch (error) {
            message.error(error?.data?.message || 'Failed to publish medical report');
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
            title: 'Consultation Appt',
            key: 'appointment',
            render: (_, record) => {
                if (record.appointment?.trackingId) {
                    return (
                        <div>
                            <Tag color="purple">#{record.appointment.trackingId}</Tag>
                            <div className="small text-muted" style={{ fontSize: '11px' }}>
                                {record.appointment.scheduleDate ? moment(record.appointment.scheduleDate).format('MMM DD, YYYY') : 'Consulted'}
                            </div>
                        </div>
                    );
                }
                return <Tag color="default">Direct Consultation</Tag>;
            },
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
                {/* Patient Clinical Chief Complaint / Problem Filter Bar */}
                <div className="card border-0 mb-3 p-3 text-white rounded-3 shadow-sm" style={{ background: 'linear-gradient(135deg, #0f2b5c 0%, #0d9488 100%)' }}>
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                        <div>
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <span style={{ fontSize: '1.4rem' }}>
                                    {problemFilter === CLINICAL_PROBLEM_TYPES.CHEST ? '🫁' : problemFilter === CLINICAL_PROBLEM_TYPES.SPINE ? '🦴' : problemFilter === CLINICAL_PROBLEM_TYPES.ABDOMEN ? '🩺' : problemFilter === CLINICAL_PROBLEM_TYPES.BLOOD_METABOLIC ? '🩸' : '📋'}
                                </span>
                                <h5 className="mb-0 text-white fw-bold">
                                    {problemFilter === CLINICAL_PROBLEM_TYPES.CHEST
                                        ? 'Patient Clinical Problem: Chest & Respiratory (Chest Pain, Cough, Bronchitis)'
                                        : problemFilter === CLINICAL_PROBLEM_TYPES.SPINE
                                        ? 'Patient Clinical Problem: Spine & Orthopedic'
                                        : problemFilter === CLINICAL_PROBLEM_TYPES.ABDOMEN
                                        ? 'Patient Clinical Problem: Abdominal & Digestive'
                                        : problemFilter === CLINICAL_PROBLEM_TYPES.BLOOD_METABOLIC
                                        ? 'Patient Clinical Problem: Blood & Metabolic'
                                        : 'All Patient Diagnostic Reports'}
                                </h5>
                                <Tag color="cyan">Clinically Matched</Tag>
                            </div>
                            <p className="mb-0 small text-light opacity-90">
                                {problemFilter === CLINICAL_PROBLEM_TYPES.CHEST
                                    ? 'Active Clinical Rule: Displaying ONLY diagnostic reports matching chest symptoms (Digital Chest X-Ray PA View, 12-Lead ECG). Non-chest modalities (Spine MRI, Abdominal Ultrasound) are filtered out.'
                                    : problemFilter === CLINICAL_PROBLEM_TYPES.SPINE
                                    ? 'Active Clinical Rule: Displaying ONLY spine/orthopedic reports (Lumbar Spine MRI).'
                                    : problemFilter === CLINICAL_PROBLEM_TYPES.ABDOMEN
                                    ? 'Active Clinical Rule: Displaying ONLY abdominal diagnostic reports (High-Resolution USG Abdomen).'
                                    : problemFilter === CLINICAL_PROBLEM_TYPES.BLOOD_METABOLIC
                                    ? 'Active Clinical Rule: Displaying ONLY hematology and metabolic panels (CBC with ESR, Lipid Profile).'
                                    : 'Showing all diagnostic reports without clinical filtering.'}
                            </p>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <span className="small text-white-50">Filter by Problem:</span>
                            <Select
                                value={problemFilter}
                                onChange={setProblemFilter}
                                style={{ width: 260 }}
                            >
                                <Option value={CLINICAL_PROBLEM_TYPES.ALL}>📋 All Diagnostic Reports</Option>
                                <Option value={CLINICAL_PROBLEM_TYPES.GENERAL_CONSULTATION}>🏥 General Consultation &amp; Chronic Care</Option>
                                <Option value={CLINICAL_PROBLEM_TYPES.CHEST}>🫁 Chest &amp; Respiratory</Option>
                                <Option value={CLINICAL_PROBLEM_TYPES.SPINE}>🦴 Spine &amp; Orthopedic</Option>
                                <Option value={CLINICAL_PROBLEM_TYPES.ABDOMEN}>🩺 Abdominal &amp; Digestive</Option>
                                <Option value={CLINICAL_PROBLEM_TYPES.BLOOD_METABOLIC}>🩸 Blood &amp; Metabolic</Option>
                            </Select>
                        </div>
                    </div>
                </div>

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
                    <div className="p-3 mb-3 rounded border border-primary bg-light">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <strong className="text-primary">
                                <FaHeartbeat className="me-1" /> Clinical Problem Domain:
                            </strong>
                            <Button
                                type="default"
                                size="small"
                                onClick={() => handleAutofillForProblem(selectedProblemInModal)}
                            >
                                Load Consultation Draft
                            </Button>
                        </div>
                        <Select
                            value={selectedProblemInModal}
                            onChange={(val) => {
                                setSelectedProblemInModal(val);
                                handleAutofillForProblem(val);
                            }}
                            style={{ width: '100%' }}
                        >
                            <Option value={CLINICAL_PROBLEM_TYPES.GENERAL_CONSULTATION}>🏥 General Consultation, Chronic Care &amp; Vaccination</Option>
                            <Option value={CLINICAL_PROBLEM_TYPES.CHEST}>🫁 Chest Problem (Chest Pain, Cough, Bronchitis)</Option>
                            <Option value={CLINICAL_PROBLEM_TYPES.SPINE}>🦴 Spine / Back Problem (Lumbar Stiffness, Sciatica)</Option>
                            <Option value={CLINICAL_PROBLEM_TYPES.ABDOMEN}>🩺 Abdominal Problem (Stomach, Gallbladder, Visceral)</Option>
                            <Option value={CLINICAL_PROBLEM_TYPES.BLOOD_METABOLIC}>🩸 Blood &amp; Metabolic (Fever, Infection, Lipids)</Option>
                        </Select>
                        <small className="text-muted d-block mt-1">
                            Drafts patient-specific structured findings based on the selected Completed consultation without placeholder stock images.
                        </small>
                    </div>

                    <Form.Item
                        name="patientId"
                        label="Select Consulted Patient"
                        rules={[{ required: true, message: 'Please select a patient' }]}
                    >
                        <Select
                            placeholder="Choose patient"
                            showSearch
                            optionFilterProp="children"
                            onChange={(pId) => {
                                setSelectedPatientId(pId);
                                setSelectedAppointmentId(undefined);
                                form.setFieldsValue({ appointmentId: undefined });
                            }}
                        >
                            {patients.map((p) => (
                                <Option key={p.id} value={p.id}>
                                    {p.firstName} {p.lastName} ({p.email || p.mobile || 'No contact'})
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="appointmentId"
                        label="Completed Consultation / Appointment"
                        rules={[{ required: true, message: 'Please select a Completed consultation appointment' }]}
                        help={selectedPatientId && patientAppointments.length === 0 ? 'No Completed consultations found for this patient. Mark an appointment Completed first.' : undefined}
                    >
                        <Select
                            placeholder={selectedPatientId ? "Select completed consultation" : "Select a patient first"}
                            disabled={!selectedPatientId}
                            onChange={(apptId) => {
                                setSelectedAppointmentId(apptId);
                                const appt = appointmentsData?.find(a => a.id === apptId);
                                if (appt) {
                                    const fullText = `${appt.reasonForVisit || ''} ${appt.description || ''} ${appt.consultationType || ''}`;
                                    const detected = detectProblemCategory(fullText);
                                    setSelectedProblemInModal(detected);
                                    handleAutofillForProblem(detected, appt);
                                }
                            }}
                        >
                            {patientAppointments.map(a => (
                                <Option key={a.id} value={a.id}>
                                    #{a.trackingId} — {moment(a.scheduleDate).format('MMM DD, YYYY')} ({a.reasonForVisit || 'Consultation'})
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="category" hidden><Input /></Form.Item>
                    <Form.Item name="hospitalOrLab" hidden><Input /></Form.Item>
                    <Form.Item name="doctorComments" hidden><Input /></Form.Item>

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
            <ClinicalReportViewer
                report={selectedReport}
                open={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
            />
        </div>
    );
};

const PatientReportsView = () => {
    const { data: reportsData, isLoading, refetch } = useGetPatientReportsQuery();
    const [createReport, { isLoading: isCreating }] = useCreateMedicalReportMutation();
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState(undefined);
    const [problemFilter, setProblemFilter] = useState(CLINICAL_PROBLEM_TYPES.ALL);
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
        if (problemFilter) {
            result = filterReportsByProblem(result, problemFilter);
        }
        return result;
    }, [reports, searchTerm, typeFilter, problemFilter]);

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
            title: 'Consultation Appt',
            key: 'appointment',
            render: (_, record) => {
                if (record.appointment?.trackingId) {
                    return (
                        <div>
                            <Tag color="purple">#{record.appointment.trackingId}</Tag>
                            <div className="small text-muted" style={{ fontSize: '11px' }}>
                                {record.appointment.scheduleDate ? moment(record.appointment.scheduleDate).format('MMM DD, YYYY') : 'Consulted'}
                            </div>
                        </div>
                    );
                }
                return <Tag color="default">Direct Consultation</Tag>;
            },
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
                {/* Patient Clinical Chief Complaint / Problem Filter Bar */}
                <div className="card border-0 mb-3 p-3 text-white rounded-3 shadow-sm" style={{ background: 'linear-gradient(135deg, #0f2b5c 0%, #0d9488 100%)' }}>
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                        <div>
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <span style={{ fontSize: '1.4rem' }}>
                                    {problemFilter === CLINICAL_PROBLEM_TYPES.CHEST ? '🫁' : problemFilter === CLINICAL_PROBLEM_TYPES.SPINE ? '🦴' : problemFilter === CLINICAL_PROBLEM_TYPES.ABDOMEN ? '🩺' : problemFilter === CLINICAL_PROBLEM_TYPES.BLOOD_METABOLIC ? '🩸' : '📋'}
                                </span>
                                <h5 className="mb-0 text-white fw-bold">
                                    {problemFilter === CLINICAL_PROBLEM_TYPES.CHEST
                                        ? 'Patient Clinical Problem: Chest & Respiratory (Chest Pain, Cough, Bronchitis)'
                                        : problemFilter === CLINICAL_PROBLEM_TYPES.SPINE
                                        ? 'Patient Clinical Problem: Spine & Orthopedic'
                                        : problemFilter === CLINICAL_PROBLEM_TYPES.ABDOMEN
                                        ? 'Patient Clinical Problem: Abdominal & Digestive'
                                        : problemFilter === CLINICAL_PROBLEM_TYPES.BLOOD_METABOLIC
                                        ? 'Patient Clinical Problem: Blood & Metabolic'
                                        : 'All Patient Diagnostic Reports'}
                                </h5>
                                <Tag color="cyan">Clinically Matched</Tag>
                            </div>
                            <p className="mb-0 small text-light opacity-90">
                                {problemFilter === CLINICAL_PROBLEM_TYPES.CHEST
                                    ? 'Active Clinical Rule: Displaying ONLY diagnostic reports matching chest symptoms (Digital Chest X-Ray PA View, 12-Lead ECG). Non-chest modalities (Spine MRI, Abdominal Ultrasound) are filtered out.'
                                    : problemFilter === CLINICAL_PROBLEM_TYPES.SPINE
                                    ? 'Active Clinical Rule: Displaying ONLY spine/orthopedic reports (Lumbar Spine MRI).'
                                    : problemFilter === CLINICAL_PROBLEM_TYPES.ABDOMEN
                                    ? 'Active Clinical Rule: Displaying ONLY abdominal diagnostic reports (High-Resolution USG Abdomen).'
                                    : problemFilter === CLINICAL_PROBLEM_TYPES.BLOOD_METABOLIC
                                    ? 'Active Clinical Rule: Displaying ONLY hematology and metabolic panels (CBC with ESR, Lipid Profile).'
                                    : 'Showing all diagnostic reports without clinical filtering.'}
                            </p>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <span className="small text-white-50">Filter by Problem:</span>
                            <Select
                                value={problemFilter}
                                onChange={setProblemFilter}
                                style={{ width: 260 }}
                            >
                                <Option value={CLINICAL_PROBLEM_TYPES.ALL}>📋 All Diagnostic Reports</Option>
                                <Option value={CLINICAL_PROBLEM_TYPES.GENERAL_CONSULTATION}>🏥 General Consultation &amp; Chronic Care</Option>
                                <Option value={CLINICAL_PROBLEM_TYPES.CHEST}>🫁 Chest &amp; Respiratory</Option>
                                <Option value={CLINICAL_PROBLEM_TYPES.SPINE}>🦴 Spine &amp; Orthopedic</Option>
                                <Option value={CLINICAL_PROBLEM_TYPES.ABDOMEN}>🩺 Abdominal &amp; Digestive</Option>
                                <Option value={CLINICAL_PROBLEM_TYPES.BLOOD_METABOLIC}>🩸 Blood &amp; Metabolic</Option>
                            </Select>
                        </div>
                    </div>
                </div>

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
                        reportType: 'Lab Test',
                        reportDate: moment(),
                    }}
                >
                    <Alert
                        type="info"
                        showIcon
                        style={{ marginBottom: 14 }}
                        message="Upload an external laboratory or imaging document from your files"
                        description="Official doctor diagnostic reports are published automatically by your physician after each completed consultation."
                    />
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
            <ClinicalReportViewer
                report={selectedReport}
                open={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
            />
        </div>
    );
};

export default Reports;

