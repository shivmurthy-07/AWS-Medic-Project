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
import {
    FaVial,
    FaPlus,
    FaSearch,
    FaEye,
    FaDownload,
    FaTrash,
    FaUpload,
    FaFilePdf,
    FaFileImage,
} from 'react-icons/fa';
import moment from 'moment';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const LabReports = () => {
    const { data: reportsData, isLoading, refetch } = useGetPatientReportsQuery({});
    const [createReport, { isLoading: isCreating }] = useCreateMedicalReportMutation();
    const [deleteReport, { isLoading: isDeleting }] = useDeleteMedicalReportMutation();
    const [uploadFile, { isLoading: isUploadingFile }] = useUploadReportFileMutation();

    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [previewDoc, setPreviewDoc] = useState(null);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState([]);

    const allReports = reportsData?.data || reportsData || [];

    // Filter specifically to lab reports
    const labReports = useMemo(() => {
        return allReports.filter((r) => {
            const isLab = r.category === 'LAB' ||
                ['blood', 'sugar', 'glucose', 'cbc', 'lipid', 'cholesterol', 'thyroid', 'urine', 'lft', 'kft', 'creatinine', 'electrolyte', 'vitamin', 'biochemistry', 'pathology']
                    .some((k) => (r.reportType || '').toLowerCase().includes(k) || (r.reportTitle || '').toLowerCase().includes(k));

            if (!isLab) return false;

            if (categoryFilter !== 'ALL') {
                if (!(r.reportType || '').toLowerCase().includes(categoryFilter.toLowerCase())) {
                    return false;
                }
            }

            if (search) {
                const s = search.toLowerCase();
                const matchTitle = (r.reportTitle || '').toLowerCase().includes(s);
                const matchType = (r.reportType || '').toLowerCase().includes(s);
                const matchHospital = (r.hospitalOrLab || '').toLowerCase().includes(s);
                if (!matchTitle && !matchType && !matchHospital) return false;
            }

            return true;
        });
    }, [allReports, search, categoryFilter]);

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

            await createReport({
                reportTitle: values.reportTitle,
                reportType: values.reportType,
                category: 'LAB',
                hospitalOrLab: values.hospitalOrLab || null,
                testDate: values.testDate ? values.testDate.format('YYYY-MM-DD') : null,
                reportDate: values.reportDate ? values.reportDate.format('YYYY-MM-DD') : new Date().toISOString(),
                description: values.description || null,
                fileUrl: uploadedFileUrl || null,
                fileName: originalFileName || null,
                fileSize: fileSize || null,
                fileMimeType: fileMime || null,
            }).unwrap();

            message.success('Laboratory test report uploaded successfully.');
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
            message.success('Lab report deleted successfully.');
            refetch();
        } catch (error) {
            message.error(error?.data?.message || 'Could not delete report.');
        }
    };

    const columns = [
        {
            title: 'Test / Panel Name',
            key: 'title',
            render: (_, r) => (
                <div>
                    <strong className="d-block">{r.reportTitle}</strong>
                    {r.description && <small className="text-muted text-truncate d-block" style={{ maxWidth: 220 }}>{r.description}</small>}
                </div>
            ),
        },
        {
            title: 'Test Category',
            dataIndex: 'reportType',
            key: 'reportType',
            render: (type) => <Tag color="geekblue">{type}</Tag>,
        },
        {
            title: 'Diagnostic Lab',
            dataIndex: 'hospitalOrLab',
            key: 'hospitalOrLab',
            render: (lab) => lab || 'Diagnostic Pathology Lab',
        },
        {
            title: 'Sample / Test Date',
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
                            <a href={r.fileUrl} download={r.fileName || 'lab-report'} target="_blank" rel="noreferrer">
                                <Button size="small" icon={<FaDownload />}>Download</Button>
                            </a>
                        </>
                    )}
                    <Popconfirm
                        title="Delete this laboratory report?"
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
            <div className="lab-reports-page">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                    <div>
                        <Title level={3} className="mb-1">
                            <FaVial className="text-primary me-2" /> Laboratory Reports
                        </Title>
                        <Text type="secondary">
                            Manage blood counts, lipid profiles, diabetes screenings, thyroid panels, and biochemical tests.
                        </Text>
                    </div>
                    <Button
                        type="primary"
                        icon={<FaPlus />}
                        onClick={() => setIsUploadModalOpen(true)}
                    >
                        Upload Lab Report
                    </Button>
                </div>

                <Card className="shadow-sm border-0 mb-4">
                    <div className="row g-2 align-items-center mb-3">
                        <div className="col-12 col-md-6 col-lg-4">
                            <Input
                                placeholder="Search by test name, pathology lab..."
                                prefix={<FaSearch className="text-muted" />}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                allowClear
                            />
                        </div>
                        <div className="col-12 col-md-6 col-lg-3">
                            <Select
                                value={categoryFilter}
                                onChange={setCategoryFilter}
                                style={{ width: '100%' }}
                            >
                                <Option value="ALL">All Test Categories</Option>
                                <Option value="Complete Blood Count">Complete Blood Count (CBC)</Option>
                                <Option value="Blood Sugar">Blood Sugar (FBS / PPBS / HbA1c)</Option>
                                <Option value="Lipid Profile">Lipid Profile</Option>
                                <Option value="Thyroid Profile">Thyroid Profile (TSH / T3 / T4)</Option>
                                <Option value="Liver Function Test">Liver Function Test (LFT)</Option>
                                <Option value="Kidney Function Test">Kidney Function Test (KFT)</Option>
                                <Option value="Urine Test">Urine Analysis</Option>
                                <Option value="Other">Other Lab Tests</Option>
                            </Select>
                        </div>
                    </div>

                    <Table
                        columns={columns}
                        dataSource={labReports}
                        rowKey="id"
                        loading={isLoading}
                        pagination={{ pageSize: 8 }}
                        scroll={{ x: 800 }}
                    />
                </Card>

                {/* Upload Modal */}
                <Modal
                    title="Upload Laboratory Test Report"
                    open={isUploadModalOpen}
                    onCancel={() => { setIsUploadModalOpen(false); form.resetFields(); setFileList([]); }}
                    footer={null}
                    width={600}
                >
                    <Form form={form} layout="vertical" onFinish={handleUploadSubmit}>
                        <Form.Item
                            name="reportTitle"
                            label="Test / Panel Name"
                            rules={[{ required: true, message: 'Please enter a title for the lab test' }]}
                        >
                            <Input placeholder="E.g., Complete Blood Count (CBC), Fasting Blood Sugar" />
                        </Form.Item>

                        <div className="row">
                            <div className="col-md-6">
                                <Form.Item
                                    name="reportType"
                                    label="Test Category"
                                    rules={[{ required: true, message: 'Please select a test category' }]}
                                >
                                    <Select placeholder="Select category">
                                        <Option value="Complete Blood Count">Complete Blood Count (CBC)</Option>
                                        <Option value="Blood Sugar">Blood Sugar (FBS/PPBS/HbA1c)</Option>
                                        <Option value="Lipid Profile">Lipid Profile</Option>
                                        <Option value="Thyroid Profile">Thyroid Profile</Option>
                                        <Option value="Liver Function Test">Liver Function Test (LFT)</Option>
                                        <Option value="Kidney Function Test">Kidney Function Test (KFT)</Option>
                                        <Option value="Urine Test">Urine Analysis</Option>
                                        <Option value="Biochemistry Panel">Biochemistry Panel</Option>
                                        <Option value="Other Lab Test">Other Lab Test</Option>
                                    </Select>
                                </Form.Item>
                            </div>
                            <div className="col-md-6">
                                <Form.Item name="hospitalOrLab" label="Diagnostic Pathology Lab">
                                    <Input placeholder="E.g., Lal PathLabs, SRL Diagnostics" />
                                </Form.Item>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6">
                                <Form.Item name="testDate" label="Sample Collection Date">
                                    <DatePicker style={{ width: '100%' }} />
                                </Form.Item>
                            </div>
                            <div className="col-md-6">
                                <Form.Item name="reportDate" label="Report Date">
                                    <DatePicker style={{ width: '100%' }} defaultValue={moment()} />
                                </Form.Item>
                            </div>
                        </div>

                        <Form.Item name="description" label="Recorded Values / Lab Observations">
                            <TextArea rows={3} placeholder="E.g., Hemoglobin: 14.2 g/dL, Total WBC: 7,500, Platelets: 250,000..." />
                        </Form.Item>

                        <Form.Item label="Report File (JPG, PNG, WEBP, PDF up to 10MB)" required>
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
                                Upload Report
                            </Button>
                        </div>
                    </Form>
                </Modal>

                {/* Document Preview Modal */}
                <Modal
                    title={previewDoc?.reportTitle || 'Lab Report Preview'}
                    open={Boolean(previewDoc)}
                    onCancel={() => setPreviewDoc(null)}
                    footer={[
                        <a key="download" href={previewDoc?.fileUrl} download={previewDoc?.fileName || 'lab-report'} target="_blank" rel="noreferrer">
                            <Button icon={<FaDownload />}>Download</Button>
                        </a>,
                        <Button key="close" type="primary" onClick={() => setPreviewDoc(null)}>
                            Close
                        </Button>
                    ]}
                    width={750}
                >
                    {previewDoc && (
                        <div className="text-center py-2">
                            {previewDoc.fileUrl?.toLowerCase().endsWith('.pdf') ? (
                                <iframe
                                    src={previewDoc.fileUrl}
                                    title="PDF Document Preview"
                                    width="100%"
                                    height="500px"
                                    style={{ border: 'none' }}
                                />
                            ) : (
                                <img
                                    src={previewDoc.fileUrl}
                                    alt="Medical Report"
                                    style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }}
                                    className="rounded shadow-sm"
                                />
                            )}
                            <div className="mt-3 text-start bg-light p-3 rounded">
                                <strong>{previewDoc.reportTitle}</strong> ({previewDoc.reportType})
                                <div className="text-muted small">
                                    Laboratory: {previewDoc.hospitalOrLab || 'Diagnostic Pathology Lab'} · Date: {moment(previewDoc.testDate || previewDoc.reportDate).format('LL')}
                                </div>
                                {previewDoc.description && <p className="mt-2 mb-0 small">{previewDoc.description}</p>}
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default LabReports;

