import React, { useState, useMemo } from 'react';
import DashboardLayout from '../../Doctor/DashboardLayout/DashboardLayout';
import {
    useGetPatientReportsQuery,
    useCreateMedicalReportMutation,
    useDeleteMedicalReportMutation,
    useUploadReportFileMutation,
} from '../../../redux/api/medicalReportApi';
import {
    Card,
    Table,
    Button,
    Input,
    Select,
    Modal,
    Form,
    Upload,
    DatePicker,
    Tag,
    Popconfirm,
    message,
    Space,
    Typography,
    Divider,
} from 'antd';
import ClinicalReportViewer from './ClinicalReportViewer';
import {
    FaFileMedical,
    FaPlus,
    FaSearch,
    FaEye,
    FaDownload,
    FaTrash,
    FaUpload,
    FaXRay,
    FaFilePdf,
    FaFileImage,
} from 'react-icons/fa';
import moment from 'moment';
import {
    CLINICAL_PROBLEM_TYPES,
    filterReportsByProblem,
} from '../../../utils/clinicalProblemMatcher';
import { FaCheckCircle, FaFilter } from 'react-icons/fa';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ImagingReports = () => {
    const { data: reportsData, isLoading, refetch } = useGetPatientReportsQuery({});
    const [createReport, { isLoading: isCreating }] = useCreateMedicalReportMutation();
    const [deleteReport, { isLoading: isDeleting }] = useDeleteMedicalReportMutation();
    const [uploadFile, { isLoading: isUploadingFile }] = useUploadReportFileMutation();

    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [previewDoc, setPreviewDoc] = useState(null);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [activeProblem, setActiveProblem] = useState(CLINICAL_PROBLEM_TYPES.ALL);
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState([]);

    const allReports = reportsData?.data || reportsData || [];

    // Filter specifically to imaging reports: category === 'IMAGING' or matches imaging types
    const baseImagingReports = useMemo(() => {
        return allReports.filter((r) => {
            const isImaging = r.category === 'IMAGING' ||
                ['x-ray', 'xray', 'mri', 'ct scan', 'ultrasound', 'ecg', 'imaging', 'sonography', 'pet scan']
                    .some((k) => (r.reportType || '').toLowerCase().includes(k));

            if (!isImaging) return false;

            if (typeFilter !== 'ALL') {
                if (!(r.reportType || '').toLowerCase().includes(typeFilter.toLowerCase())) {
                    return false;
                }
            }

            if (search) {
                const s = search.toLowerCase();
                const matchTitle = (r.reportTitle || '').toLowerCase().includes(s);
                const matchType = (r.reportType || '').toLowerCase().includes(s);
                const matchHospital = (r.hospitalOrLab || '').toLowerCase().includes(s);
                const matchDoctor = (`${r.doctor?.firstName || ''} ${r.doctor?.lastName || ''}`).toLowerCase().includes(s);
                if (!matchTitle && !matchType && !matchHospital && !matchDoctor) return false;
            }

            return true;
        });
    }, [allReports, search, typeFilter]);

    // Apply strict patient problem filter (e.g. Chest problem shows only Chest reports)
    const imagingReports = useMemo(() => {
        return filterReportsByProblem(baseImagingReports, activeProblem);
    }, [baseImagingReports, activeProblem]);

    const handleUploadSubmit = async (values) => {
        try {
            let uploadedFileUrl = '';
            let originalFileName = '';
            let fileSize = 0;
            let fileMime = '';

            if (fileList.length > 0) {
                const formData = new FormData();
                formData.append('file', fileList[0].originFileObj || fileList[0]);
                const uploadRes = await uploadFile(formData).unwrap();
                uploadedFileUrl = uploadRes?.data?.fileUrl || uploadRes?.fileUrl;
                originalFileName = uploadRes?.data?.fileName || fileList[0].name;
                fileSize = uploadRes?.data?.fileSize || fileList[0].size;
                fileMime = uploadRes?.data?.fileMimeType || fileList[0].type;
            }

            const finalUrl = uploadedFileUrl || null;
            const finalName = originalFileName || null;

            await createReport({
                reportTitle: values.reportTitle,
                reportType: values.reportType,
                category: 'IMAGING',
                hospitalOrLab: values.hospitalOrLab || null,
                testDate: values.testDate ? values.testDate.format('YYYY-MM-DD') : null,
                reportDate: values.reportDate ? values.reportDate.format('YYYY-MM-DD') : new Date().toISOString(),
                description: values.description || null,
                doctorComments: values.doctorComments || null,
                fileUrl: finalUrl,
                fileName: finalName,
                fileSize: fileSize || null,
                fileMimeType: fileMime || null,
            }).unwrap();

            message.success('Imaging report uploaded successfully.');
            setIsUploadModalOpen(false);
            form.resetFields();
            setFileList([]);
            refetch();
        } catch (error) {
            message.error(error?.data?.message || 'Could not upload report. Please check the file and try again.');
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteReport(id).unwrap();
            message.success('Report deleted successfully.');
            refetch();
        } catch (error) {
            message.error(error?.data?.message || 'Could not delete report.');
        }
    };

    const columns = [
        {
            title: 'Report Title',
            key: 'title',
            render: (_, r) => (
                <div>
                    <strong className="d-block">{r.reportTitle}</strong>
                    {r.description && <small className="text-muted text-truncate d-block" style={{ maxWidth: 220 }}>{r.description}</small>}
                </div>
            ),
        },
        {
            title: 'Modality / Type',
            dataIndex: 'reportType',
            key: 'reportType',
            render: (type) => <Tag color="blue">{type}</Tag>,
        },
        {
            title: 'Facility / Diagnostic Center',
            dataIndex: 'hospitalOrLab',
            key: 'hospitalOrLab',
            render: (facility) => facility || 'Diagnostic Center',
        },
        {
            title: 'Doctor',
            key: 'doctor',
            render: (_, r) => r.doctor ? `Dr. ${r.doctor.firstName} ${r.doctor.lastName}` : (r.uploadedBy === 'patient' ? 'Self Upload' : 'Doctor'),
        },
        {
            title: 'Test Date',
            key: 'testDate',
            render: (_, r) => moment(r.testDate || r.reportDate || r.createdAt).format('MMM DD, YYYY'),
        },
        {
            title: 'Document',
            key: 'document',
            render: (_, r) => {
                if (!r.fileUrl) return <span className="text-muted small">No file</span>;
                const isPdf = (r.fileUrl || '').toLowerCase().endsWith('.pdf') || (r.fileName || '').toLowerCase().endsWith('.pdf');
                return (
                    <Tag icon={isPdf ? <FaFilePdf /> : <FaFileImage />} color={isPdf ? 'volcano' : 'cyan'}>
                        {isPdf ? 'PDF' : 'IMAGE'}
                    </Tag>
                );
            },
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, r) => (
                <Space size="small">
                    {r.fileUrl && (
                        <>
                            <Button size="small" icon={<FaEye />} onClick={() => setPreviewDoc(r)}>
                                Preview
                            </Button>
                            <a href={r.fileUrl} download={r.fileName || 'imaging-report'} target="_blank" rel="noreferrer">
                                <Button size="small" icon={<FaDownload />}>Download</Button>
                            </a>
                        </>
                    )}
                    <Popconfirm
                        title="Delete this medical report?"
                        description="This action cannot be undone."
                        onConfirm={() => handleDelete(r.id)}
                        okText="Yes, delete"
                        cancelText="No"
                    >
                        <Button size="small" danger icon={<FaTrash />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <DashboardLayout>
            <div className="imaging-reports-page">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                    <div>
                        <Title level={3} className="mb-1">
                            <FaXRay className="text-primary me-2" /> X-Ray & Imaging Reports
                        </Title>
                        <Text type="secondary">
                            View, inspect, and safely archive your X-Rays, MRIs, CT Scans, Ultrasounds, and ECGs.
                        </Text>
                    </div>
                    <Button
                        type="primary"
                        icon={<FaPlus />}
                        onClick={() => setIsUploadModalOpen(true)}
                    >
                        Upload Imaging Report
                    </Button>
                </div>

                {/* Clinical Chief Complaint / Problem Relevance Bar */}
                <div className="card border-0 mb-4 p-3 text-white rounded-3 shadow-sm" style={{ background: 'linear-gradient(135deg, #0f2b5c 0%, #0d9488 100%)' }}>
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                        <div>
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <span style={{ fontSize: '1.4rem' }}>
                                    {activeProblem === CLINICAL_PROBLEM_TYPES.CHEST ? '🫁' : activeProblem === CLINICAL_PROBLEM_TYPES.SPINE ? '🦴' : activeProblem === CLINICAL_PROBLEM_TYPES.ABDOMEN ? '🩺' : '📋'}
                                </span>
                                <h5 className="mb-0 text-white fw-bold">
                                    {activeProblem === CLINICAL_PROBLEM_TYPES.CHEST
                                        ? 'Patient Chief Complaint: Chest & Respiratory Problem'
                                        : activeProblem === CLINICAL_PROBLEM_TYPES.SPINE
                                        ? 'Patient Chief Complaint: Spine & Orthopedic Problem'
                                        : activeProblem === CLINICAL_PROBLEM_TYPES.ABDOMEN
                                        ? 'Patient Chief Complaint: Abdominal & Digestive Problem'
                                        : 'All Diagnostic Medical Records'}
                                </h5>
                                <Tag color="cyan">Clinically Matched</Tag>
                            </div>
                            <p className="mb-0 small text-light opacity-90">
                                {activeProblem === CLINICAL_PROBLEM_TYPES.CHEST
                                    ? 'Active Clinical Rule: Displaying ONLY diagnostic reports matching chest symptoms (Digital Chest X-Ray PA View, 12-Lead ECG). Non-chest modalities (Spine MRI, Abdominal Ultrasound) are filtered out.'
                                    : activeProblem === CLINICAL_PROBLEM_TYPES.SPINE
                                    ? 'Active Clinical Rule: Displaying ONLY spine/orthopedic reports (Lumbar Spine MRI). Non-spine modalities are filtered out.'
                                    : activeProblem === CLINICAL_PROBLEM_TYPES.ABDOMEN
                                    ? 'Active Clinical Rule: Displaying ONLY abdominal diagnostic reports (High-Resolution USG Abdomen).'
                                    : 'Showing all archived imaging studies across all clinical modalities.'}
                            </p>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <span className="small text-white-50">Patient Problem:</span>
                            <Select
                                value={activeProblem}
                                onChange={setActiveProblem}
                                style={{ width: 260 }}
                            >
                                <Option value={CLINICAL_PROBLEM_TYPES.ALL}>📋 All Diagnostic Reports</Option>
                                <Option value={CLINICAL_PROBLEM_TYPES.CHEST}>🫁 Chest &amp; Respiratory</Option>
                                <Option value={CLINICAL_PROBLEM_TYPES.SPINE}>🦴 Spine &amp; Orthopedic</Option>
                                <Option value={CLINICAL_PROBLEM_TYPES.ABDOMEN}>🩺 Abdominal &amp; Digestive</Option>
                            </Select>
                        </div>
                    </div>
                </div>

                <Card className="shadow-sm border-0 mb-4">
                    <div className="row g-2 align-items-center mb-3">
                        <div className="col-12 col-md-6 col-lg-4">
                            <Input
                                placeholder="Search by test name, center, or doctor..."
                                prefix={<FaSearch className="text-muted" />}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                allowClear
                            />
                        </div>
                        <div className="col-12 col-md-6 col-lg-3">
                            <Select
                                value={typeFilter}
                                onChange={setTypeFilter}
                                style={{ width: '100%' }}
                            >
                                <Option value="ALL">All Imaging Modalities</Option>
                                <Option value="X-Ray">X-Ray</Option>
                                <Option value="MRI">MRI Scan</Option>
                                <Option value="CT Scan">CT Scan</Option>
                                <Option value="Ultrasound">Ultrasound / Sonography</Option>
                                <Option value="ECG">ECG / Echo</Option>
                                <Option value="Other">Other Imaging</Option>
                            </Select>
                        </div>
                    </div>

                    <Table
                        columns={columns}
                        dataSource={imagingReports}
                        rowKey="id"
                        loading={isLoading}
                        pagination={{ pageSize: 8 }}
                        scroll={{ x: 800 }}
                    />
                </Card>

                {/* Upload Modal */}
                <Modal
                    title="Upload X-Ray / Imaging Document"
                    open={isUploadModalOpen}
                    onCancel={() => { setIsUploadModalOpen(false); form.resetFields(); setFileList([]); }}
                    footer={null}
                    width={600}
                >
                    <Form form={form} layout="vertical" onFinish={handleUploadSubmit}>
                        <div className="alert alert-info mb-3 small">
                            Official doctor-ordered consultation imaging reports appear here automatically after your doctor completes your consultation. Use this form only to upload external scans or PDFs from your computer.
                        </div>

                        <Form.Item
                            name="reportTitle"
                            label="Report Title"
                            rules={[{ required: true, message: 'Please enter a title for the report' }]}
                        >
                            <Input placeholder="E.g., Chest X-Ray PA View, Lumbar Spine MRI" />
                        </Form.Item>

                        <div className="row">
                            <div className="col-md-6">
                                <Form.Item
                                    name="reportType"
                                    label="Imaging Modality / Type"
                                    rules={[{ required: true, message: 'Please select an imaging type' }]}
                                >
                                    <Select placeholder="Select type">
                                        <Option value="X-Ray">X-Ray</Option>
                                        <Option value="MRI">MRI</Option>
                                        <Option value="CT Scan">CT Scan</Option>
                                        <Option value="Ultrasound">Ultrasound</Option>
                                        <Option value="ECG">ECG</Option>
                                        <Option value="PET Scan">PET Scan</Option>
                                        <Option value="Mammography">Mammography</Option>
                                        <Option value="Other Imaging">Other Imaging</Option>
                                    </Select>
                                </Form.Item>
                            </div>
                            <div className="col-md-6">
                                <Form.Item name="hospitalOrLab" label="Hospital / Imaging Center">
                                    <Input placeholder="E.g., Apollo Imaging, Suburban Diagnostics" />
                                </Form.Item>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6">
                                <Form.Item name="testDate" label="Test / Scan Date">
                                    <DatePicker style={{ width: '100%' }} />
                                </Form.Item>
                            </div>
                            <div className="col-md-6">
                                <Form.Item name="reportDate" label="Report Date">
                                    <DatePicker style={{ width: '100%' }} defaultValue={moment()} />
                                </Form.Item>
                            </div>
                        </div>

                        <Form.Item name="description" label="Clinical Notes / Findings">
                            <TextArea rows={3} placeholder="Radiologist impressions, clinical notes, or findings..." />
                        </Form.Item>

                        <Form.Item name="doctorComments" label="Attending Physician / Radiologist Impressions">
                            <TextArea rows={2} placeholder="Physician conclusion / impression..." />
                        </Form.Item>

                        <Form.Item label="Report Scan / Radiograph Document" required>
                            <Upload
                                beforeUpload={(file) => {
                                    const isValidType = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type);
                                    if (!isValidType) {
                                        message.error('You can only upload JPG, PNG, WEBP, or PDF files!');
                                        return Upload.LIST_IGNORE;
                                    }
                                    const isLt10M = file.size / 1024 / 1024 < 10;
                                    if (!isLt10M) {
                                        message.error('File must be smaller than 10MB!');
                                        return Upload.LIST_IGNORE;
                                    }
                                    setFileList([file]);
                                    return false;
                                }}
                                fileList={fileList}
                                onRemove={() => setFileList([])}
                                maxCount={1}
                            >
                                <Button icon={<FaUpload />}>Select File</Button>
                            </Upload>
                            <div className="small text-muted mt-1">
                                Upload your authentic scan image or PDF (JPG, PNG, WEBP, PDF up to 10MB).
                            </div>
                        </Form.Item>

                        <Divider />
                        <div className="d-flex justify-content-end gap-2">
                            <Button onClick={() => { setIsUploadModalOpen(false); form.resetFields(); setFileList([]); }}>
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={isCreating || isUploadingFile}
                                disabled={fileList.length === 0}
                            >
                                Upload Imaging Report
                            </Button>
                        </div>
                    </Form>
                </Modal>

                {/* Document Preview Modal */}
                <ClinicalReportViewer
                    report={previewDoc}
                    open={Boolean(previewDoc)}
                    onClose={() => setPreviewDoc(null)}
                />
            </div>
        </DashboardLayout>
    );
};

export default ImagingReports;

