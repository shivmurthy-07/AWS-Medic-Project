import React, { useState, useMemo } from 'react';
import DashboardLayout from '../../Doctor/DashboardLayout/DashboardLayout';
import {
    useGetPatientReportsQuery,
    useDeleteMedicalReportMutation,
} from '../../../redux/api/medicalReportApi';
import {
    Card,
    Table,
    Button,
    Input,
    Select,
    Tag,
    Popconfirm,
    message,
    Space,
    Typography,
} from 'antd';
import ClinicalReportViewer from './ClinicalReportViewer';
import {
    FaSearch,
    FaEye,
    FaDownload,
    FaTrash,
    FaXRay,
    FaFilePdf,
    FaFileImage,
} from 'react-icons/fa';
import moment from 'moment';
import {
    CLINICAL_PROBLEM_TYPES,
    filterReportsByProblem,
} from '../../../utils/clinicalProblemMatcher';

const { Title, Text } = Typography;
const { Option } = Select;

const ImagingReports = () => {
    const { data: reportsData, isLoading, refetch } = useGetPatientReportsQuery({});
    const [deleteReport] = useDeleteMedicalReportMutation();

    const [previewDoc, setPreviewDoc] = useState(null);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [activeProblem, setActiveProblem] = useState(CLINICAL_PROBLEM_TYPES.ALL);

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
            title: 'Appointment ID',
            key: 'appointmentId',
            width: 190,
            render: (_, r) => r.appointment?.trackingId ? (
                <Tag color="purple" style={{ whiteSpace: 'normal', wordBreak: 'break-all', lineHeight: 1.35 }}>
                    #{r.appointment.trackingId}
                </Tag>
            ) : <span className="text-muted">—</span>,
        },
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

