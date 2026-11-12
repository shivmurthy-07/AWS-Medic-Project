import React, { useEffect, useState } from 'react';
import {
	Modal,
	Form,
	Input,
	Select,
	Button,
	Upload,
	Space,
	Tag,
	Alert,
	Divider,
	message,
} from 'antd';
import {
	FaPlus,
	FaTrash,
	FaUpload,
	FaCheckCircle,
	FaFileMedical,
} from 'react-icons/fa';
import {
	CLINICAL_PROBLEMS,
	CLINICAL_PROBLEM_TYPES,
	buildConsultationReportDraft,
} from '../../../utils/clinicalProblemMatcher';
import {
	useCreateMedicalReportMutation,
	useUploadReportFileMutation,
} from '../../../redux/api/medicalReportApi';

const { TextArea } = Input;
const { Option } = Select;

const VALID_CATEGORIES = new Set(['IMAGING', 'LAB', 'GENERAL', 'OTHER']);

const FINDING_STATUS_OPTIONS = [
	'Normal',
	'Reviewed',
	'Borderline',
	'Mildly Elevated',
	'Abnormal',
	'High',
	'Low',
];

/**
 * Reusable post-consultation report author modal for physicians.
 * Requires a Completed consultation appointment and produces individualized structured findings
 * plus an optional patient-specific diagnostic file upload (never generic stock photos).
 */
const ConsultationReportGeneratorModal = ({
	open,
	appointment,
	onClose,
	onSuccess,
}) => {
	const [form] = Form.useForm();
	const [problemKey, setProblemKey] = useState(CLINICAL_PROBLEM_TYPES.GENERAL_CONSULTATION);
	const [findings, setFindings] = useState([]);
	const [uploadedFile, setUploadedFile] = useState(null);

	const [createReport, { isLoading: isCreating }] = useCreateMedicalReportMutation();
	const [uploadFile, { isLoading: isUploading }] = useUploadReportFileMutation();

	const applyDraftForProblem = (appt, selectedKey = null) => {
		if (!appt) return;
		const draft = buildConsultationReportDraft(appt, selectedKey);
		setProblemKey(draft.problemKey);
		setFindings(draft.findings || []);
		form.setFieldsValue({
			reportType: draft.reportType,
			reportTitle: draft.reportTitle,
			category: VALID_CATEGORIES.has(draft.category) ? draft.category : 'GENERAL',
			hospitalOrLab: draft.hospitalOrLab,
			description: draft.description,
			doctorComments: draft.doctorComments,
		});
	};

	useEffect(() => {
		if (open && appointment) {
			setUploadedFile(null);
			applyDraftForProblem(appointment, null);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, appointment?.id]);

	const handleProblemPresetChange = (nextKey) => {
		setProblemKey(nextKey);
		applyDraftForProblem(appointment, nextKey);
	};

	const handleFindingChange = (index, field, value) => {
		setFindings((prev) =>
			prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row))
		);
	};

	const handleAddFindingRow = () => {
		setFindings((prev) => [
			...prev,
			{ parameter: '', finding: '', reference: '-', status: 'Normal' },
		]);
	};

	const handleRemoveFindingRow = (index) => {
		setFindings((prev) => prev.filter((_, idx) => idx !== index));
	};

	const handleCustomUpload = async (file) => {
		const formData = new FormData();
		formData.append('file', file);
		try {
			const res = await uploadFile(formData).unwrap();
			const uploaded = res?.data || res;
			if (!uploaded?.fileUrl) {
				message.error('Upload succeeded but returned no file URL.');
				return Upload.LIST_IGNORE;
			}
			setUploadedFile({
				fileUrl: uploaded.fileUrl,
				fileName: uploaded.fileName || file.name,
				fileSize: uploaded.fileSize || file.size,
				fileMimeType: uploaded.fileMimeType || file.type,
			});
			message.success(`Attached "${uploaded.fileName || file.name}" to this report.`);
		} catch (err) {
			message.error(err?.data?.message || 'Could not upload diagnostic attachment.');
		}
		return false;
	};

	const handleSubmit = async (values) => {
		if (!appointment?.id) {
			message.error('Consultation appointment reference is missing.');
			return;
		}
		if (appointment.status !== 'Completed') {
			message.warning('Please mark this consultation as Completed before generating an official report.');
			return;
		}

		const sanitizedFindings = findings
			.filter((row) => String(row.parameter || '').trim() || String(row.finding || '').trim())
			.map((row) => ({
				parameter: String(row.parameter || 'Observation').trim(),
				finding: String(row.finding || '-').trim(),
				reference: String(row.reference || '-').trim(),
				status: String(row.status || 'Normal').trim(),
			}));

		const normalizedCategory = VALID_CATEGORIES.has(values.category)
			? values.category
			: 'GENERAL';

		const payload = {
			appointmentId: appointment.id,
			patientId: appointment.patientId || appointment.patient?.id || undefined,
			reportType: values.reportType,
			reportTitle: values.reportTitle,
			category: normalizedCategory,
			hospitalOrLab: values.hospitalOrLab,
			testDate: appointment.scheduleDate || new Date().toISOString(),
			description: values.description,
			doctorComments: values.doctorComments,
			recordResults: {
				problemKey,
				findings: sanitizedFindings,
				impression: values.doctorComments || '',
			},
			fileUrl: uploadedFile?.fileUrl || null,
			fileName: uploadedFile?.fileName || null,
			fileSize: uploadedFile?.fileSize || null,
			fileMimeType: uploadedFile?.fileMimeType || null,
		};

		try {
			const res = await createReport(payload).unwrap();
			const createdReport = res?.data || res;
			message.success('Official post-consultation report published to appointment & patient vault.');
			if (onSuccess) onSuccess(createdReport);
			if (onClose) onClose();
		} catch (err) {
			message.error(err?.data?.message || 'Failed to publish post-consultation report.');
		}
	};

	const patientFullName = appointment?.patient
		? `${appointment.patient.firstName || ''} ${appointment.patient.lastName || ''}`.trim()
		: `${appointment?.firstName || 'Patient'} ${appointment?.lastName || ''}`.trim();

	return (
		<Modal
			open={open}
			onCancel={onClose}
			footer={null}
			width={820}
			destroyOnClose
			title={
				<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
					<FaFileMedical style={{ color: '#0284c7' }} />
					<span>Generate Post-Consultation Diagnostic / Clinical Report</span>
				</span>
			}
		>
			{appointment && (
				<>
					<Alert
						type="info"
						showIcon
						style={{ marginBottom: 14 }}
						message={
							<span>
								<strong>Patient:</strong> {patientFullName} ·{' '}
								<strong>Chief Complaint:</strong> {appointment.reasonForVisit || 'General Consultation'} ·{' '}
								<strong>Status:</strong>{' '}
								<Tag color={appointment.status === 'Completed' ? 'green' : 'orange'}>
									{appointment.status}
								</Tag>
							</span>
						}
						description="Customize the findings below specifically for this patient. Only upload a scan image/PDF if you have an actual file for this visit."
					/>

					<Form form={form} layout="vertical" onFinish={handleSubmit}>
						<div className="row">
							<div className="col-md-6">
								<Form.Item label="Clinical Domain Template">
									<Select value={problemKey} onChange={handleProblemPresetChange}>
										{CLINICAL_PROBLEMS.map((prob) => (
											<Option key={prob.key} value={prob.key}>
												{prob.label}
											</Option>
										))}
									</Select>
								</Form.Item>
							</div>
							<div className="col-md-3">
								<Form.Item
									name="category"
									label="Category"
									rules={[{ required: true, message: 'Select category' }]}
								>
									<Select>
										<Option value="GENERAL">Consultation / General</Option>
										<Option value="LAB">Laboratory Panel</Option>
										<Option value="IMAGING">Diagnostic Imaging</Option>
										<Option value="OTHER">Other Record</Option>
									</Select>
								</Form.Item>
							</div>
							<div className="col-md-3">
								<Form.Item
									name="reportType"
									label="Report / Modality Type"
									rules={[{ required: true, message: 'Enter report type' }]}
								>
									<Input placeholder="e.g., Consultation Summary, Lab Test, X-Ray" />
								</Form.Item>
							</div>
						</div>

						<div className="row">
							<div className="col-md-7">
								<Form.Item
									name="reportTitle"
									label="Official Report Title"
									rules={[{ required: true, message: 'Enter report title' }]}
								>
									<Input placeholder="Specific diagnostic or consultation summary title" />
								</Form.Item>
							</div>
							<div className="col-md-5">
								<Form.Item name="hospitalOrLab" label="Clinic / Diagnostic Facility">
									<Input placeholder="Clinic or lab name" />
								</Form.Item>
							</div>
						</div>

						<Form.Item name="description" label="Clinical Indication & Examination Notes">
							<TextArea rows={2} placeholder="Summarize symptoms evaluated, onset, and clinical examination details..." />
						</Form.Item>

						<Divider orientation="left" style={{ margin: '10px 0 12px', fontSize: 13 }}>
							Patient-Specific Structured Findings / Parameters
						</Divider>

						<div style={{ marginBottom: 14 }}>
							{findings.map((row, idx) => (
								<div
									key={idx}
									style={{
										display: 'grid',
										gridTemplateColumns: '1.3fr 1.8fr 1fr 0.9fr auto',
										gap: 8,
										marginBottom: 8,
										alignItems: 'center',
									}}
								>
									<Input
										size="small"
										value={row.parameter}
										placeholder="Parameter / Area"
										onChange={(e) => handleFindingChange(idx, 'parameter', e.target.value)}
									/>
									<Input
										size="small"
										value={row.finding}
										placeholder="Patient observation / value"
										onChange={(e) => handleFindingChange(idx, 'finding', e.target.value)}
									/>
									<Input
										size="small"
										value={row.reference}
										placeholder="Reference"
										onChange={(e) => handleFindingChange(idx, 'reference', e.target.value)}
									/>
									<Select
										size="small"
										value={row.status}
										onChange={(val) => handleFindingChange(idx, 'status', val)}
									>
										{FINDING_STATUS_OPTIONS.map((opt) => (
											<Option key={opt} value={opt}>
												{opt}
											</Option>
										))}
									</Select>
									<Button
										size="small"
										danger
										type="text"
										icon={<FaTrash />}
										onClick={() => handleRemoveFindingRow(idx)}
										aria-label="Remove finding row"
									/>
								</div>
							))}
							<Button
								size="small"
								type="dashed"
								icon={<FaPlus />}
								onClick={handleAddFindingRow}
							>
								Add Clinical Observation / Parameter
							</Button>
						</div>

						<Form.Item
							name="doctorComments"
							label="Physician Impression, Diagnosis & Follow-Up Plan"
							rules={[{ required: true, message: 'Provide clinical impression and plan' }]}
						>
							<TextArea rows={2} placeholder="Final impression, treatment guidance, and follow-up timeline..." />
						</Form.Item>

						<div
							style={{
								background: '#f8fafc',
								border: '1px dashed #cbd5e1',
								borderRadius: 8,
								padding: '10px 14px',
								marginBottom: 16,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								flexWrap: 'wrap',
								gap: 10,
							}}
						>
							<div>
								<div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>
									Optional Authentic Scan / Lab PDF Attachment
								</div>
								<div style={{ fontSize: 12, color: '#64748b' }}>
									{uploadedFile
										? `Attached: ${uploadedFile.fileName}`
										: 'Leave empty if no external scan/PDF needs to be attached — structured report renders cleanly without placeholder photos.'}
								</div>
							</div>
							<Space>
								<Upload
									showUploadList={false}
									beforeUpload={handleCustomUpload}
									accept=".pdf,image/*"
								>
									<Button size="small" icon={<FaUpload />} loading={isUploading}>
										{uploadedFile ? 'Replace File' : 'Upload Scan / PDF'}
									</Button>
								</Upload>
								{uploadedFile && (
									<Button size="small" danger onClick={() => setUploadedFile(null)}>
										Remove
									</Button>
								)}
							</Space>
						</div>

						<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
							<Button onClick={onClose}>Cancel</Button>
							<Button
								type="primary"
								htmlType="submit"
								loading={isCreating}
								disabled={appointment.status !== 'Completed'}
								icon={<FaCheckCircle />}
							>
								Publish Official Report
							</Button>
						</div>
					</Form>
				</>
			)}
		</Modal>
	);
};

export default ConsultationReportGeneratorModal;
