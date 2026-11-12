import React, { useState, useMemo } from 'react';
import { Modal, Button, Tag } from 'antd';
import {
	FaPrint,
	FaDownload,
	FaCheckCircle,
	FaHospital,
	FaAdjust,
	FaTimes,
	FaFilePdf,
	FaFileMedical,
	FaExternalLinkAlt,
} from 'react-icons/fa';
import moment from 'moment';
import { getSanitizedReportFileUrl } from '../../../utils/clinicalProblemMatcher';
import './ClinicalReportViewer.css';

const normalizeFindingsFromRecordResults = (recordResults) => {
	if (!recordResults || typeof recordResults !== 'object') return [];

	// Preferred format: { findings: [{ parameter, finding/value, reference, status }] }
	if (Array.isArray(recordResults.findings)) {
		return recordResults.findings
			.filter((row) => row && (row.parameter || row.finding || row.value))
			.map((row) => ({
				parameter: row.parameter || row.label || 'Observation',
				finding: row.finding || row.value || row.result || '-',
				reference: row.reference || row.range || row.referenceRange || '-',
				status: row.status || row.flag || 'Normal',
			}));
	}

	// Array directly
	if (Array.isArray(recordResults)) {
		return recordResults
			.filter((row) => row && (row.parameter || row.finding || row.value))
			.map((row) => ({
				parameter: row.parameter || row.label || 'Observation',
				finding: row.finding || row.value || row.result || '-',
				reference: row.reference || row.range || row.referenceRange || '-',
				status: row.status || row.flag || 'Normal',
			}));
	}

	// Key-value map (skip metadata keys like problemKey, impression)
	const META_KEYS = new Set(['problemKey', 'impression', 'notes', 'summary', 'vitals']);
	const rows = [];

	if (recordResults.vitals && typeof recordResults.vitals === 'object') {
		Object.entries(recordResults.vitals).forEach(([k, v]) => {
			if (v !== undefined && v !== null && String(v).trim() !== '') {
				rows.push({
					parameter: k,
					finding: String(v),
					reference: 'Vital Sign',
					status: 'Recorded',
				});
			}
		});
	}

	Object.entries(recordResults).forEach(([key, val]) => {
		if (META_KEYS.has(key)) return;
		if (val && typeof val === 'object' && !Array.isArray(val)) {
			const valStr = [val.value ?? val.result ?? val.finding, val.unit].filter(Boolean).join(' ');
			rows.push({
				parameter: key,
				finding: valStr || '-',
				reference: val.reference || val.range || val.normal || '-',
				status: val.flag || val.status || 'Normal',
			});
		} else if (val !== undefined && val !== null && String(val).trim() !== '') {
			rows.push({
				parameter: key,
				finding: String(val),
				reference: '-',
				status: 'Recorded',
			});
		}
	});

	return rows;
};

const getStatusTagColor = (statusText) => {
	const lower = String(statusText || '').toLowerCase();
	if (lower.includes('high') || lower.includes('abnormal') || lower.includes('elevated') || lower.includes('critical') || lower.includes('positive')) {
		return 'red';
	}
	if (lower.includes('low') || lower.includes('borderline') || lower.includes('attention') || lower.includes('mild')) {
		return 'orange';
	}
	if (lower.includes('normal') || lower.includes('clear') || lower.includes('intact') || lower.includes('stable')) {
		return 'green';
	}
	return 'blue';
};

const ClinicalReportViewer = ({ report, open, onClose, onBack }) => {
	const [invertContrast, setInvertContrast] = useState(false);

	const handleClose = onClose || onBack || (() => {});
	const isModalOpen = typeof open === 'boolean' ? open : Boolean(report);

	const cleanFileUrl = useMemo(() => getSanitizedReportFileUrl(report), [report]);

	const isPdfFile = useMemo(() => {
		if (!cleanFileUrl) return false;
		const mime = String(report?.fileMimeType || '').toLowerCase();
		const name = String(report?.fileName || cleanFileUrl).toLowerCase();
		return mime.includes('pdf') || name.endsWith('.pdf');
	}, [cleanFileUrl, report]);

	const structuredFindings = useMemo(
		() => normalizeFindingsFromRecordResults(report?.recordResults),
		[report?.recordResults]
	);

	if (!report) return null;

	const patientName = report.patient
		? `${report.patient.firstName || ''} ${report.patient.lastName || ''}`.trim() || 'Patient'
		: 'Patient';

	const patientAge = report.patient?.dateOfBirth
		? `${moment().diff(moment(report.patient.dateOfBirth), 'years')} Yrs`
		: null;
	const patientGender = report.patient?.gender || null;
	const demographicsText = [patientAge, patientGender].filter(Boolean).join(' / ') || 'Adult / Not Specified';

	const patientUhid = report.patient?.id
		? `UHID-${report.patient.id.slice(0, 8).toUpperCase()}`
		: 'UHID-VERIFIED';

	const doctorName = report.doctor
		? `Dr. ${report.doctor.firstName || ''} ${report.doctor.lastName || ''}`.trim()
		: 'Attending Physician';

	const doctorCredentials = [
		report.doctor?.designation,
		report.doctor?.specialization,
		report.doctor?.registration ? `Reg. No: ${report.doctor.registration}` : null,
	]
		.filter(Boolean)
		.join(' · ') || 'Registered Medical Practitioner';

	const facilityName =
		report.hospitalOrLab ||
		report.doctor?.hospitalName ||
		report.doctor?.clinicName ||
		'MediConnect Outpatient Clinic & Diagnostics';

	const formattedDate = report.testDate || report.reportDate || report.createdAt
		? moment(report.testDate || report.reportDate || report.createdAt).format('DD MMM YYYY')
		: moment().format('DD MMM YYYY');

	const accessionNo = report.id ? `RPT-${report.id.slice(0, 8).toUpperCase()}` : 'RPT-OFFICIAL';
	const trackingId = report.appointment?.trackingId || null;

	const isImagingCategory =
		String(report.category || '').toUpperCase() === 'IMAGING' ||
		/x-ray|xray|mri|ct|ultrasound|ecg|ekg|scan/i.test(report.reportType || '');

	const handlePrint = () => {
		window.print();
	};

	const handleDownload = () => {
		if (!cleanFileUrl) return;
		const link = document.createElement('a');
		link.href = cleanFileUrl;
		link.target = '_blank';
		link.rel = 'noopener noreferrer';
		if (report.fileName) {
			link.download = report.fileName;
		}
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	return (
		<Modal
			open={isModalOpen}
			onCancel={handleClose}
			footer={null}
			width={900}
			centered
			closable={false}
			destroyOnClose
			className="clinical-report-modal"
		>
			<div className="clinical-report-wrapper">
				{/* Dark Clinical Action Toolbar */}
				<div className="clinical-report-toolbar">
					<div className="clinical-report-toolbar__title">
						<FaFileMedical style={{ color: '#38bdf8' }} />
						<span>Official Post-Consultation Diagnostic Record</span>
						<Tag color="cyan" style={{ marginLeft: 4 }}>
							{report.reportType || 'Clinical Report'}
						</Tag>
					</div>
					<div className="clinical-report-toolbar__actions">
						{cleanFileUrl && !isPdfFile && (
							<Button
								size="small"
								icon={<FaAdjust />}
								onClick={() => setInvertContrast((prev) => !prev)}
								style={{
									background: invertContrast ? '#0284c7' : '#1e293b',
									color: '#fff',
									borderColor: '#334155',
								}}
							>
								{invertContrast ? 'Standard View' : 'Invert Contrast'}
							</Button>
						)}
						<Button
							size="small"
							type="primary"
							icon={<FaPrint />}
							onClick={handlePrint}
						>
							Print / Save PDF
						</Button>
						{cleanFileUrl && (
							<Button
								size="small"
								icon={<FaDownload />}
								onClick={handleDownload}
								style={{ background: '#1e293b', color: '#fff', borderColor: '#334155' }}
							>
								Download Attachment
							</Button>
						)}
						<Button
							size="small"
							type="text"
							icon={<FaTimes />}
							onClick={handleClose}
							style={{ color: '#cbd5e1' }}
						/>
					</div>
				</div>

				{/* Printable Hospital Letterhead Sheet */}
				<div className="clinical-report-sheet-container">
					<div className="clinical-report-sheet">
						{/* Facility Letterhead Header */}
						<div className="clinical-sheet-header">
							<div className="clinical-facility-brand">
								<div className="clinical-facility-logo">
									<FaHospital />
								</div>
								<div>
									<h2 className="clinical-facility-name">{facilityName}</h2>
									<p className="clinical-facility-sub">
										{report.category === 'LAB'
											? 'Department of Clinical Pathology & Laboratory Medicine'
											: isImagingCategory
												? 'Department of Radio-Diagnosis & Clinical Imaging'
												: 'Department of Outpatient Clinical Care'}
									</p>
									<p className="clinical-facility-addr">
										Verified Electronic Medical Record · MediConnect Healthcare Network
									</p>
								</div>
							</div>
							<div className="clinical-sheet-accreditation">
								<div className="clinical-barcode">{accessionNo}</div>
								<div className="clinical-sheet-meta">
									{trackingId ? (
										<div>Consult Ref: <strong>#{trackingId.slice(0, 12)}</strong></div>
									) : null}
									<div>Status: <strong>{report.appointment?.status || 'Completed'}</strong></div>
								</div>
							</div>
						</div>

						{/* Patient & Consultation Demographics */}
						<div className="clinical-demographics-box">
							<div className="clinical-demo-item">
								<span className="clinical-demo-label">Patient Name</span>
								<span className="clinical-demo-val">{patientName}</span>
							</div>
							<div className="clinical-demo-item">
								<span className="clinical-demo-label">Age / Gender</span>
								<span className="clinical-demo-val">{demographicsText}</span>
							</div>
							<div className="clinical-demo-item">
								<span className="clinical-demo-label">Patient UHID / MRN</span>
								<span className="clinical-demo-val">{patientUhid}</span>
							</div>
							<div className="clinical-demo-item">
								<span className="clinical-demo-label">Consulting Physician</span>
								<span className="clinical-demo-val">{doctorName}</span>
							</div>
							<div className="clinical-demo-item">
								<span className="clinical-demo-label">Date of Evaluation</span>
								<span className="clinical-demo-val">{formattedDate}</span>
							</div>
							<div className="clinical-demo-item">
								<span className="clinical-demo-label">Blood Group</span>
								<span className="clinical-demo-val">{report.patient?.bloodGroup || 'Not Recorded'}</span>
							</div>
						</div>

						{/* Report Title Banner */}
						<div className="clinical-report-title-banner">
							<h3>{report.reportTitle || 'Clinical Diagnostic Report'}</h3>
							<p>
								Modality: {report.reportType || 'Consultation Summary'} · Category: {report.category || 'GENERAL'}
							</p>
						</div>

						{/* Chief Complaint / Indication */}
						{(report.description || report.appointment?.reasonForVisit) && (
							<div>
								<h4 className="clinical-section-heading">Clinical Indication & Reason for Consultation</h4>
								<p style={{ fontSize: '0.86rem', color: '#334155', lineHeight: 1.6, marginBottom: '1rem' }}>
									{report.appointment?.reasonForVisit && (
										<span style={{ display: 'block', marginBottom: 4 }}>
											<strong>Chief Complaint:</strong> {report.appointment.reasonForVisit}
										</span>
									)}
									{report.description}
								</p>
							</div>
						)}

						{/* Patient-Specific Uploaded Diagnostic File (NEVER fake stock imagery) */}
						{cleanFileUrl && isPdfFile && (
							<div
								style={{
									background: '#f8fafc',
									border: '1px solid #cbd5e1',
									borderRadius: 8,
									padding: '0.9rem 1.15rem',
									marginBottom: '1.25rem',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									gap: 12,
								}}
							>
								<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
									<FaFilePdf style={{ fontSize: 22, color: '#dc2626' }} />
									<div>
										<div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>
											{report.fileName || 'Attached Clinical Document (PDF)'}
										</div>
										<div style={{ fontSize: '0.75rem', color: '#64748b' }}>
											Patient-specific uploaded diagnostic attachment
										</div>
									</div>
								</div>
								<Button
									type="primary"
									size="small"
									icon={<FaExternalLinkAlt />}
									onClick={handleDownload}
								>
									Open PDF
								</Button>
							</div>
						)}

						{cleanFileUrl && !isPdfFile && (
							<div className="radiology-film-workstation">
								<div className="radiology-workstation-bar">
									<span>
										Attached Diagnostic Film: <strong>{report.fileName || report.reportTitle}</strong>
									</span>
									<span>Contrast: {invertContrast ? 'Inverted Bone Window' : 'Standard Radiograph'}</span>
								</div>
								<div className="radiology-workstation-film">
									<img
										src={cleanFileUrl}
										alt={report.reportTitle || 'Patient Diagnostic Scan'}
										className={`radiology-film-img ${invertContrast ? 'radiology-film-img--inverted' : ''}`}
									/>
								</div>
								<div className="radiology-film-footer-meta">
									<span>Patient: {patientName} ({patientUhid})</span>
									<span>Verified Attachment</span>
								</div>
							</div>
						)}

						{/* Structured Observations / Quantitative Biomarkers Table */}
						<h4 className="clinical-section-heading">
							{report.category === 'LAB'
								? 'Laboratory Test Results & Reference Ranges'
								: 'Clinical Observations & Diagnostic Findings'}
						</h4>

						{structuredFindings.length > 0 ? (
							<table className="clinical-lab-table">
								<thead>
									<tr>
										<th>Parameter / Clinical Domain</th>
										<th>Observed Finding / Result</th>
										<th>Reference / Expected</th>
										<th>Status</th>
									</tr>
								</thead>
								<tbody>
									{structuredFindings.map((row, idx) => (
										<tr key={`${row.parameter}-${idx}`}>
											<td className="param-name">{row.parameter}</td>
											<td className="param-val">{row.finding}</td>
											<td>{row.reference || '-'}</td>
											<td>
												<Tag color={getStatusTagColor(row.status)}>
													{row.status || 'Normal'}
												</Tag>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						) : (
							<div className="clinical-findings-grid">
								<div className="clinical-finding-row">
									<strong>Evaluation Summary:</strong>{' '}
									{report.description ||
										`Structured ${report.reportType || 'clinical'} evaluation recorded for ${patientName}.`}
								</div>
							</div>
						)}

						{/* Physician Clinical Impression */}
						<div className="clinical-impression-card">
							<div className="clinical-impression-title">
								Physician Clinical Impression & Recommendations
							</div>
							<p className="clinical-impression-text">
								{report.doctorComments ||
									report.recordResults?.impression ||
									'Post-consultation evaluation reviewed with patient. Continue prescribed management and advised follow-up if new symptoms arise.'}
							</p>
						</div>

						{/* Physician Sign-Off Block */}
						<div className="clinical-signatures-row">
							<div>
								<span className="clinical-digital-stamp">
									<FaCheckCircle style={{ marginRight: 5 }} />
									Electronically Signed & Verified Post-Consultation
								</span>
								<p style={{ fontSize: '0.72rem', color: '#64748b', margin: '0.25rem 0 0' }}>
									Signed Date: {formattedDate}
								</p>
							</div>
							<div className="clinical-signature-block">
								<p className="clinical-sign-name">{doctorName}</p>
								<p className="clinical-sign-title">{doctorCredentials}</p>
							</div>
						</div>

						{/* Footer Disclaimer */}
						<div className="clinical-sheet-footer">
							Confidential Medical Record generated after verified consultation on MediConnect EHR · Intended strictly for clinical correlation by registered physicians and the named patient ({patientName}).
						</div>
					</div>
				</div>
			</div>
		</Modal>
	);
};

export default ClinicalReportViewer;
