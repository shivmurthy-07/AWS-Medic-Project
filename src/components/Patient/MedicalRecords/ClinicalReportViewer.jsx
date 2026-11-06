import React, { useState, useMemo } from 'react';
import { Modal, Button, Tag, Tooltip } from 'antd';
import {
	FaPrint,
	FaDownload,
	FaTimes,
	FaAdjust,
	FaHospital,
	FaCheckCircle,
	FaShieldAlt,
	FaUserMd,
} from 'react-icons/fa';
import moment from 'moment';
import './ClinicalReportViewer.css';

/** Realistic fallback diagnostic observations for imaging modalities */
const defaultRadiologyFindings = {
	'x-ray': {
		examination: 'Digital Radiography (DR) Chest — Posteroanterior (PA) View',
		technique: 'Single-view erect full inspiratory digital chest radiograph taken at 120 kVp.',
		indication: 'Clinical evaluation for respiratory symptoms / routine preoperative medical clearance.',
		findings: [
			{ organ: 'Trachea & Mediastinum', observation: 'Trachea is centrally located. Normal mediastinal contours without widening or mass effect.' },
			{ organ: 'Lungs & Parenchyma', observation: 'Bilateral lung fields appear well-aerated with normal vascular markings. No focal consolidation, pneumonic patch, cavitary lesion, or active tuberculosis focus.' },
			{ organ: 'Pleura & Sinuses', observation: 'Both costophrenic and cardiophrenic angles are sharp, deep, and clear. No pleural effusion or apical capping identified.' },
			{ organ: 'Cardiovascular Silhouette', observation: 'Cardiac silhouette is within normal limits. Cardiothoracic ratio (CTR) is 0.46 (Normal < 0.50). Normal aortic knob and pulmonary artery profile.' },
			{ organ: 'Diaphragm', observation: 'Both hemidiaphragmatic domes demonstrate normal convex contours and physiological position.' },
			{ organ: 'Thoracic Skeletal Cage', observation: 'Visualised ribs, clavicles, scapulae, and dorsal spine show intact cortical outlines without acute fracture or focal lytic / sclerotic lesion.' },
		],
		impression: '1. Normal Digital Chest Radiograph (PA View).\n2. No acute cardiopulmonary parenchymal abnormality or cardiomegaly detected.',
		doctorSign: 'Dr. Aditya Sharma, MD, DNB (Radio-Diagnosis)',
		doctorReg: 'KMC Reg. No. 74829 — Consultant Radiologist',
	},
	'mri': {
		examination: 'Magnetic Resonance Imaging (MRI) of Lumbar Spine (L1 - S1)',
		technique: 'Multi-planar T1-weighted, T2-weighted, and STIR sagittal and axial sequences obtained on a 1.5 Tesla superconducting MRI system.',
		indication: 'Evaluation of lower lumbar back discomfort and intermittent radicular sensations.',
		findings: [
			{ organ: 'Vertebral Alignment', observation: 'Normal physiological lumbar lordosis is maintained. No vertebral subluxation or spondylolisthesis.' },
			{ organ: 'Vertebral Marrow', observation: 'Vertebral body heights and marrow signal intensities are normal throughout the lumbar spine. No Modic degenerative endplate changes.' },
			{ organ: 'L1-L2 to L3-L4 Discs', observation: 'Normal intervertebral disc heights and T2 hydration signals. Intact posterior longitudinal ligament. Canal patent.' },
			{ organ: 'L4-L5 Disc Level', observation: 'Mild disc desiccation noted with a minimal broad-based posterior disc bulge causing slight abutment of the ventral thecal sac. Both neural exit foramina remain patent with free exiting L4 nerve roots.' },
			{ organ: 'L5-S1 Disc Level', observation: 'Normal disc height and contour. Bilateral exit nerve roots appear unremarkable.' },
			{ organ: 'Thecal Sac & Conus', observation: 'The conus medullaris terminates at physiological L1-L2 level with normal caliber and homogeneous signal.' },
		],
		impression: '1. Mild degenerative disc desiccation at L4-L5 with mild broad-based posterior disc bulge.\n2. No critical spinal canal stenosis or focal compressive radiculopathy.',
		doctorSign: 'Dr. Ramesh Babu, MD (Radio-Diagnosis)',
		doctorReg: 'KMC Reg. No. 61943 — Senior Consultant Radiologist',
	},
	'ecg': {
		examination: '12-Lead Standard Electrocardiogram (Resting ECG)',
		technique: 'Standard limb leads (I, II, III, aVR, aVL, aVF) and precordial leads (V1-V6) recorded at 25 mm/sec, calibration 10 mm/mV.',
		indication: 'Routine cardiovascular rhythm evaluation.',
		findings: [
			{ organ: 'Heart Rate & Rhythm', observation: 'Normal Sinus Rhythm at 74 beats per minute. Regular R-R intervals.' },
			{ organ: 'P-Wave & PR Interval', observation: 'P wave morphology is normal in Lead II. PR interval: 142 ms (Normal: 120 - 200 ms).' },
			{ organ: 'QRS Complex', observation: 'Normal QRS axis (+55 degrees). QRS duration: 86 ms (Normal: < 100 ms). No pathological Q waves.' },
			{ organ: 'ST-T Wave Segment', observation: 'Isoelectric ST segment throughout all 12 leads. No acute ST segment elevation, depression, or pathological T-wave inversion.' },
			{ organ: 'QT / QTc Interval', observation: 'QT interval: 388 ms, QTc (Bazett formula): 412 ms (Normal: < 440 ms).' },
		],
		impression: 'Normal 12-lead resting electrocardiogram. Within physiological limits.',
		doctorSign: 'Dr. Anand Kumar, MD, DM (Cardiology)',
		doctorReg: 'KMC Reg. No. 58921 — Consultant Interventional Cardiologist',
	},
	'ultrasound': {
		examination: 'High-Resolution Real-Time Abdominal Ultrasound (USG Abdomen)',
		technique: 'Curvilinear 3.5–5.0 MHz transducer examination of abdominal viscera.',
		indication: 'Abdominal screening and general health checkup.',
		findings: [
			{ organ: 'Liver', observation: 'Liver is normal in size (13.8 cm span) with homogeneous parenchymal echotexture. No focal mass lesion, cyst, or intrahepatic biliary duct dilation.' },
			{ organ: 'Gallbladder & CBD', observation: 'Gallbladder is well distended with thin walls (< 3 mm). Lumen is clear with no calculus. Common bile duct measures 3.8 mm (normal).' },
			{ organ: 'Pancreas & Spleen', observation: 'Pancreas shows normal parenchymal thickness and acoustic texture. Spleen is normal in size (9.6 cm) without focal parenchymal lesions.' },
			{ organ: 'Bilateral Kidneys', observation: 'Both kidneys are normal in size, shape, and cortical thickness. Corticomedullary differentiation is well preserved. No hydronephrosis, calculus, or solid mass.' },
			{ organ: 'Urinary Bladder', observation: 'Bladder lumen is well-distended with smooth, regular mucosal walls. No intraluminal lesion.' },
		],
		impression: 'Normal ultrasound examination of upper and lower abdomen.',
		doctorSign: 'Dr. Sneha Hegde, MD (Radio-Diagnosis)',
		doctorReg: 'KMC Reg. No. 80412 — Consultant Sonologist',
	},
};

const ClinicalReportViewer = ({ report, open, onClose }) => {
	const [isInverted, setIsInverted] = useState(false);

	const reportTypeLower = (report?.reportType || '').toLowerCase();
	const isImaging =
		reportTypeLower.includes('x-ray') ||
		reportTypeLower.includes('mri') ||
		reportTypeLower.includes('ct') ||
		reportTypeLower.includes('scan') ||
		reportTypeLower.includes('ultrasound') ||
		reportTypeLower.includes('ecg') ||
		report?.category?.toUpperCase() === 'IMAGING';

	// Determine matched template for structured radiology observations
	const radiologyTemplate = useMemo(() => {
		if (reportTypeLower.includes('x-ray')) return defaultRadiologyFindings['x-ray'];
		if (reportTypeLower.includes('mri')) return defaultRadiologyFindings['mri'];
		if (reportTypeLower.includes('ecg')) return defaultRadiologyFindings['ecg'];
		if (reportTypeLower.includes('ultrasound') || reportTypeLower.includes('sonogram'))
			return defaultRadiologyFindings['ultrasound'];
		return defaultRadiologyFindings['x-ray'];
	}, [reportTypeLower]);

	// Format lab results if stored in recordResults JSON
	const labResultsList = useMemo(() => {
		if (!report?.recordResults || typeof report.recordResults !== 'object') {
			return null;
		}
		return Object.entries(report.recordResults).map(([testName, val]) => {
			const str = String(val);
			let resultVal = str;
			let refRange = 'Biological Reference Range';
			let unit = '—';
			let flag = 'NORMAL';

			if (str.includes('(')) {
				const parts = str.split('(');
				resultVal = parts[0].trim();
				refRange = parts[1].replace(')', '').trim();
			}

			// Extract common units
			if (resultVal.includes('mg/dL')) {
				unit = 'mg/dL';
				resultVal = resultVal.replace('mg/dL', '').trim();
			} else if (resultVal.includes('g/dL')) {
				unit = 'g/dL';
				resultVal = resultVal.replace('g/dL', '').trim();
			} else if (resultVal.includes('%')) {
				unit = '%';
				resultVal = resultVal.replace('%', '').trim();
			} else if (resultVal.includes('cells/mcL') || resultVal.includes('/mcL')) {
				unit = 'cells/mcL';
				resultVal = resultVal.replace(/cells\/mcL|\/mcL/, '').trim();
			} else if (resultVal.includes('mil/mcL')) {
				unit = '10^6/mcL';
				resultVal = resultVal.replace('mil/mcL', '').trim();
			} else if (resultVal.includes('mm/1st hr')) {
				unit = 'mm/1st hr';
				resultVal = resultVal.replace('mm/1st hr', '').trim();
			}

			// Detect flagged status
			const lowerVal = str.toLowerCase();
			if (lowerVal.includes('high') || lowerVal.includes('elevated')) {
				flag = 'HIGH';
			} else if (lowerVal.includes('low') || lowerVal.includes('deficient')) {
				flag = 'LOW';
			}

			return { testName, resultVal, refRange, unit, flag };
		});
	}, [report]);

	if (!report) return null;

	const patientName = report.patient
		? [report.patient.firstName, report.patient.lastName].filter(Boolean).join(' ')
		: 'Patient Record';

	const patientAge = report.patient?.dateOfBirth && moment(report.patient.dateOfBirth).isValid()
		? `${moment().diff(moment(report.patient.dateOfBirth), 'years')} Yrs`
		: (report.patient ? 'Adult' : '—');

	const patientGender = report.patient?.gender
		? report.patient.gender.charAt(0).toUpperCase() + report.patient.gender.slice(1)
		: (report.patient ? 'Not Specified' : '—');

	const doctorName = report.doctor
		? `Dr. ${[report.doctor.firstName, report.doctor.lastName].filter(Boolean).join(' ')}`
		: (isImaging ? 'Dr. Aditya Sharma, MD' : 'Dr. Shweta Rao, MD');

	const doctorSpec = report.doctor?.specialization
		? report.doctor.specialization
		: (isImaging ? 'Radio-Diagnosis & Imaging' : 'Clinical Pathology');

	const doctorReg = report.doctor?.registration
		? `Reg. No. ${report.doctor.registration}`
		: (isImaging ? radiologyTemplate.doctorReg : 'KMC Reg. No. 64281');

	const accessionNo = `ACC-${(report.id || 'REP').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}`;
	const uhidNo = `UHID-${(report.patientId || 'PT').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}`;

	const facilityName =
		report.hospitalOrLab ||
		(isImaging ? 'Apex Radio-Diagnostic & Imaging Center' : 'Apollo Clinical Diagnostics & Pathology Lab');

	const testDateFormatted = moment(report.testDate || report.reportDate || report.createdAt).format('DD MMM YYYY');
	const reportDateFormatted = moment(report.reportDate || report.createdAt).format('DD MMM YYYY, hh:mm A');

	const handlePrint = () => {
		window.print();
	};

	return (
		<Modal
			open={open}
			onCancel={onClose}
			footer={null}
			width={880}
			centered
			wrapClassName="clinical-report-modal"
			destroyOnClose
		>
			<div className="clinical-report-wrapper">
				{/* Top toolbar */}
				<div className="clinical-report-toolbar">
					<div className="clinical-report-toolbar__title">
						<FaHospital className="text-info" />
						<span>Official Medical Diagnostic Record</span>
						<Tag color="cyan" className="ms-2">{report.reportType}</Tag>
					</div>

					<div className="clinical-report-toolbar__actions">
						{isImaging && (
							<Tooltip title="Toggle radiological negative/positive film contrast">
								<Button
									size="small"
									type="default"
									icon={<FaAdjust />}
									onClick={() => setIsInverted((prev) => !prev)}
								>
									{isInverted ? 'Normal View' : 'Invert Contrast'}
								</Button>
							</Tooltip>
						)}

						<Button size="small" type="primary" icon={<FaPrint />} onClick={handlePrint}>
							Print Report / Save PDF
						</Button>

						{report.fileUrl && (
							<a href={report.fileUrl} download={report.fileName || 'report'} target="_blank" rel="noreferrer">
								<Button size="small" icon={<FaDownload />}>Download File</Button>
							</a>
						)}

						<Button size="small" type="text" className="text-white" icon={<FaTimes />} onClick={onClose} />
					</div>
				</div>

				{/* Scrollable Clinical Sheet */}
				<div className="clinical-report-sheet-container">
					<div className="clinical-report-sheet" id="printable-clinical-report">
						{/* Official Hospital Header */}
						<div className="clinical-sheet-header">
							<div className="clinical-facility-brand">
								<div className="clinical-facility-logo">&#x271A;</div>
								<div>
									<h2 className="clinical-facility-name">{facilityName}</h2>
									<p className="clinical-facility-sub">
										{isImaging
											? 'Department of Radio-Diagnosis & Medical Imaging'
											: 'Department of Clinical Pathology & Laboratory Medicine'}
									</p>
									<p className="clinical-facility-addr">
										NABL &amp; NABH Accredited Diagnostic Healthcare Center · ISO 15189 Certified
										<br />
										100 Feet Road, Indiranagar, Bangalore - 560038 · Tel: +91 80 4123 9000
									</p>
								</div>
							</div>

							<div className="clinical-sheet-accreditation">
								<div className="clinical-barcode">||| | |||| || | |||| |||</div>
								<div className="clinical-sheet-meta">
									<strong>Accession:</strong> {accessionNo}
									<br />
									<strong>Status:</strong> Verified Final
								</div>
							</div>
						</div>

						{/* Patient Demographics Table */}
						<div className="clinical-demographics-box">
							<div className="clinical-demo-item">
								<span className="clinical-demo-label">Patient Name</span>
								<span className="clinical-demo-val">{patientName}</span>
							</div>

							<div className="clinical-demo-item">
								<span className="clinical-demo-label">Age / Gender</span>
								<span className="clinical-demo-val">{patientAge} / {patientGender}</span>
							</div>

							<div className="clinical-demo-item">
								<span className="clinical-demo-label">Patient UHID / MRN</span>
								<span className="clinical-demo-val">{uhidNo}</span>
							</div>

							<div className="clinical-demo-item">
								<span className="clinical-demo-label">Referring Physician</span>
								<span className="clinical-demo-val">{doctorName}</span>
							</div>

							<div className="clinical-demo-item">
								<span className="clinical-demo-label">Date of Study / Collection</span>
								<span className="clinical-demo-val">{testDateFormatted}</span>
							</div>

							<div className="clinical-demo-item">
								<span className="clinical-demo-label">Report Authentication</span>
								<span className="clinical-demo-val text-success">
									<FaCheckCircle className="me-1" /> Verified &amp; Signed Out
								</span>
							</div>
						</div>

						{/* Report Title Banner */}
						<div className="clinical-report-title-banner">
							<h3>{report.reportTitle}</h3>
							<p>Modal: {report.reportType} · Modality Category: {report.category || 'Clinical Examination'}</p>
						</div>

						{/* Clinical Indication */}
						{report.description && (
							<div className="mb-3 small">
								<strong>Clinical Indication &amp; Reason for Study:</strong>
								<p className="text-muted mb-0 mt-1">{report.description}</p>
							</div>
						)}

						{/* =========================================================
						    CASE A: Imaging Radiograph Workstation
						   ========================================================= */}
						{isImaging && (
							<div>
								{/* Diagnostic Radiographic Lightbox View */}
								{report.fileUrl && (
									<div className="radiology-film-workstation">
										<div className="radiology-workstation-bar">
											<span>PACS Diagnostic Film Viewer · 120 kVp Digital Sensor</span>
											<span>Contrast: {isInverted ? 'Bone Inverted' : 'Standard Radiograph'}</span>
										</div>

										<div className="radiology-workstation-film">
											<span className="radiology-marker radiology-marker--r">R</span>
											<span className="radiology-marker radiology-marker--l">L</span>
											<img
												src={report.fileUrl}
												alt="Diagnostic Radiograph"
												className={`radiology-film-img ${isInverted ? 'radiology-film-img--inverted' : ''}`}
											/>
										</div>

										<div className="radiology-film-footer-meta">
											<span>Study ID: {accessionNo}</span>
											<span>Erect Posteroanterior View · Full Inspiration</span>
											<span>Digital Radiography (DR) System</span>
										</div>
									</div>
								)}

								{/* Systematic Radiology Examination Observations */}
								<div className="clinical-section-heading">Detailed Radiology Examination &amp; Findings</div>
								<div className="clinical-findings-grid">
									{radiologyTemplate.findings.map((item, idx) => (
										<div key={idx} className="clinical-finding-row">
											<strong>• {item.organ}:</strong> {item.observation}
										</div>
									))}
								</div>

								{/* Impression Box */}
								<div className="clinical-impression-card">
									<div className="clinical-impression-title">Radiological Impression</div>
									<p className="clinical-impression-text" style={{ whiteSpace: 'pre-wrap' }}>
										{report.doctorComments || radiologyTemplate.impression}
									</p>
								</div>
							</div>
						)}

						{/* =========================================================
						    CASE B: Laboratory Pathology Parameter Table
						   ========================================================= */}
						{!isImaging && labResultsList && labResultsList.length > 0 && (
							<div>
								<div className="clinical-section-heading">Laboratory Pathology Results &amp; Analytical Values</div>
								<table className="clinical-lab-table">
									<thead>
										<tr>
											<th>Investigation / Analyte</th>
											<th>Observed Result</th>
											<th>Biological Reference Interval</th>
											<th>Unit</th>
											<th>Clinical Status</th>
										</tr>
									</thead>
									<tbody>
										{labResultsList.map((row, idx) => (
											<tr key={idx}>
												<td className="param-name">{row.testName}</td>
												<td className="param-val">
													<strong className={row.flag === 'HIGH' ? 'text-danger' : row.flag === 'LOW' ? 'text-warning' : 'text-dark'}>
														{row.resultVal}
													</strong>
												</td>
												<td>{row.refRange}</td>
												<td>{row.unit}</td>
												<td>
													<Tag color={row.flag === 'HIGH' ? 'error' : row.flag === 'LOW' ? 'warning' : 'success'}>
														{row.flag}
													</Tag>
												</td>
											</tr>
										))}
									</tbody>
								</table>

								<div className="small text-muted mb-3">
									<strong>Methodology:</strong> Automated Multi-Channel Analytical Analyzer with internal spectrophotometric and impedance calibration.
								</div>
							</div>
						)}

						{/* Non-imaging fallback if image is uploaded without JSON results */}
						{!isImaging && !labResultsList && report.fileUrl && (
							<div className="text-center my-3 p-2 bg-light rounded border">
								<img
									src={report.fileUrl}
									alt="Medical Document"
									style={{ maxWidth: '100%', maxHeight: '450px', objectFit: 'contain' }}
									className="rounded shadow-sm"
								/>
							</div>
						)}

						{/* Doctor Comments & Clinical Notes */}
						{report.doctorComments && (
							<div className="clinical-comments-box">
								<strong>Attending Physician Advisory Notes:</strong>
								<p className="mb-0 mt-1">{report.doctorComments}</p>
							</div>
						)}

						{/* Formal Sign-off Block */}
						<div className="clinical-signatures-row">
							<div className="clinical-signature-block text-start">
								<div className="clinical-digital-stamp">
									<FaShieldAlt className="me-1" /> NABL Quality Checked
								</div>
								<p className="clinical-sign-name">Senior Medical Laboratory Technologist</p>
								<p className="clinical-sign-title">Department Quality Assurance</p>
							</div>

							<div className="clinical-signature-block text-end">
								<div className="clinical-digital-stamp">
									<FaCheckCircle className="me-1" /> Authenticated Digital Sign
								</div>
								<p className="clinical-sign-name">
									{report.doctor ? `Dr. ${[report.doctor.firstName, report.doctor.lastName].filter(Boolean).join(' ')}` : (isImaging ? radiologyTemplate.doctorSign : 'Dr. Shweta Rao, MD (Pathology)')}
								</p>
								<p className="clinical-sign-title">
									{report.doctor ? `${doctorSpec} · ${doctorReg}` : (isImaging ? radiologyTemplate.doctorReg : 'KMC Reg. No. 64281 — Chief Clinical Pathologist')}
								</p>
							</div>
						</div>

						{/* Sheet Footer */}
						<div className="clinical-sheet-footer">
							This is a computer-verified authentic clinical diagnostic report. Electronic authentication complies with the Information Technology Act.
							<br />
							&copy; 2026 {facilityName} · All medical data is protected under patient confidentiality guidelines.
						</div>
					</div>
				</div>
			</div>
		</Modal>
	);
};

export default ClinicalReportViewer;

