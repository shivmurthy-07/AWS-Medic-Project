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
    CLINICAL_PROBLEM_TYPES,
    filterReportsByProblem,
} from '../../../utils/clinicalProblemMatcher';
import {
    FaVial,
    FaSearch,
    FaEye,
    FaDownload,
    FaTrash,
    FaFilePdf,
    FaFileImage,
} from 'react-icons/fa';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;

const LabReports = () => {
    const { data: reportsData, isLoading, refetch } = useGetPatientReportsQuery({});
    const [deleteReport] = useDeleteMedicalReportMutation();

    const [previewDoc, setPreviewDoc] = useState(null);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [activeProblem] = useState(CLINICAL_PROBLEM_TYPES.ALL);

    const allReports = reportsData?.data || reportsData || [];

    // Filter specifically to lab reports
    const baseLabReports = useMemo(() => {
        return allReports.filter((r) => {
            const isLab = r.category === 'LAB' ||
                r.category === 'LABORATORY' ||
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

    const labReports = useMemo(() => {
        if (activeProblem === CLINICAL_PROBLEM_TYPES.ALL) return baseLabReports;
        return filterReportsByProblem(baseLabReports, activeProblem);
    }, [baseLabReports, activeProblem]);

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

export default LabReports;

