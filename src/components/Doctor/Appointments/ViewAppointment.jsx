import React, { useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGetSingleAppointmentQuery, useUpdateAppointmentMutation } from '../../../redux/api/appointmentApi';
import useAuthCheck from '../../../redux/hooks/useAuthCheck';
import ClinicalReportViewer from '../../Patient/MedicalRecords/ClinicalReportViewer';
import ConsultationReportGeneratorModal from '../Reports/ConsultationReportGeneratorModal';
import {
	detectProblemCategory,
	CLINICAL_PROBLEM_TYPES,
} from '../../../utils/clinicalProblemMatcher';
import Header from '../../Shared/Header/Header';
import Footer from '../../Shared/Footer/Footer';
import moment from 'moment';
import './index.css';
import './ViewAppointment.css';
import { Button, Tag, Tooltip, Spin, Empty, message, Alert } from 'antd';
import { clickToCopyClipBoard } from '../../../utils/copyClipBoard';
import { FaPrint, FaCopy, FaUserMd, FaMapMarkerAlt, FaEye, FaFileMedical, FaCheckCircle, FaClock } from 'react-icons/fa';
import { useReactToPrint } from 'react-to-print';
import IntegratedVideoSession from './IntegratedVideoSession';

/** Safe age in full years from DOB; null if unknown or invalid */
function getAgeFromDateOfBirth(dateOfBirth) {
	if (dateOfBirth == null || dateOfBirth === '') return null;
	const dob = moment(dateOfBirth);
	if (!dob.isValid()) return null;
	const years = moment().diff(dob, 'years');
	return Number.isFinite(years) && years >= 0 && years < 130 ? years : null;
}

function joinLocation(parts) {
	return parts.filter((p) => p != null && String(p).trim() !== '').join(' · ');
}

const ViewAppointment = () => {
	const printRef = useRef(null);
	const { id } = useParams();
	const { role } = useAuthCheck();
	const { data, isLoading, isError, refetch } = useGetSingleAppointmentQuery(id, { skip: !id });
	const [updateAppointment, { isLoading: isCompletingConsultation }] = useUpdateAppointmentMutation();
	const [previewReport, setPreviewReport] = useState(null);
	const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

	const handlePrint = useReactToPrint({
		contentRef: printRef,
		bodyClass: 'print-agreement',
		documentTitle: () => (data?.trackingId ? `Appointment-${data.trackingId}` : 'Appointment'),
	});

	const problemCategory = useMemo(() => {
		const fullText = `${data?.reasonForVisit || ''} ${data?.description || ''} ${data?.consultationType || ''}`;
		return detectProblemCategory(fullText);
	}, [data]);

	const isCompletedConsultation = data?.status === 'Completed';
	const isDoctor = role === 'doctor';
	const isBlockedTerminalStatus = ['cancel', 'canceled', 'Patient Not Came'].includes(data?.status);

	// Official consultation reports are strictly scoped to THIS completed consultation
	const consultationReports = useMemo(() => {
		if (!isCompletedConsultation) return [];
		return Array.isArray(data?.medicalReports) ? data.medicalReports : [];
	}, [data?.medicalReports, isCompletedConsultation]);

	const handleCompleteConsultation = async (openReportBuilderAfter = false) => {
		if (!data?.id) return;
		try {
			await updateAppointment({ id: data.id, data: { status: 'Completed' } }).unwrap();
			message.success('Consultation marked Completed.');
			await refetch();
			if (openReportBuilderAfter) {
				setIsGeneratorOpen(true);
			}
		} catch (err) {
			message.error(err?.data?.message || 'Could not update consultation status.');
		}
	};

	const patientSummary = useMemo(() => {
		if (!data?.id) return null;
		const p = data.patient;
		const fromRecord = [data.firstName, data.lastName].filter(Boolean).join(' ').trim();
		const fromPatient = p ? [p.firstName, p.lastName].filter(Boolean).join(' ').trim() : '';
		const displayName = fromPatient || fromRecord || 'Guest booking';
		const ageYears = p ? getAgeFromDateOfBirth(p.dateOfBirth) : null;
		let ageLabel;
		if (ageYears != null) {
			ageLabel = `${ageYears} years old`;
		} else if (p?.dateOfBirth) {
			ageLabel = 'Date of birth on file is invalid — update patient profile';
		} else {
			ageLabel = 'Not on file — add date of birth in the patient profile to show age';
		}
		const blood = p?.bloodGroup?.trim() || '—';
		const loc = joinLocation([p?.city, p?.state, p?.country]);
		const emailLine = p?.email || data.email || '—';
		const phoneLine = p?.mobile || data.phone || '—';
		return {
			displayName,
			ageLabel,
			blood,
			location: loc || '—',
			emailLine,
			phoneLine,
			hasPatientRecord: !!p,
			img: p?.img,
		};
	}, [data]);

	const doctor = data?.doctor;
	const doctorName = doctor
		? [doctor.firstName, doctor.lastName].filter(Boolean).join(' ') || doctor.firstName || doctor.lastName || 'Doctor'
		: null;
	const clinicLocation = joinLocation([doctor?.clinicName, doctor?.clinicAddress, doctor?.city, doctor?.state, 'India']);

	let content = null;
	if (!id) {
		content = (
			<div className="view-appointment-error">
				<Empty description="Missing appointment ID" />
			</div>
		);
	} else if (isLoading) {
		content = (
			<div className="view-appointment-loading">
				<Spin size="large" />
				<p className="text-muted mt-3 mb-0">Loading appointment…</p>
			</div>
		);
	} else if (isError) {
		content = (
			<div className="view-appointment-error">
				<Empty description="Unable to load this appointment" />
			</div>
		);
	} else if (data?.id && patientSummary) {
		const scheduleValid = data.scheduleDate && moment(data.scheduleDate).isValid();
		content = (
			<div className="view-appointment-sheet view-appointment-sheet--a4">
				<div className="view-appointment-top">
					<div>
						<div className="view-appointment-brand">Appointment summary</div>
						<h1>Visit details</h1>
						<div className="view-appointment-meta text-muted small mb-2">
							Created {data.createdAt ? moment(data.createdAt).format('LL') : '—'}
						</div>
						<Tooltip title="Copy tracking ID">
							<Button type="default" icon={<FaCopy />} onClick={() => clickToCopyClipBoard(data.trackingId)}>
								Tracking: <Tag color="success">{data.trackingId || '—'}</Tag>
							</Button>
						</Tooltip>
					</div>
					<div className="view-appointment-status-grid">
						{data.patientType && (
							<div>
								<span className="text-muted small me-1">Patient type</span>
								<Tag color="processing">{data.patientType}</Tag>
							</div>
						)}
						<div>
							<span className="text-muted small me-1">Status</span>
							<Tag color="orange">{data.status || '—'}</Tag>
						</div>
						<div>
							<span className="text-muted small me-1">Payment</span>
							<Tag color="success">{data.paymentStatus || '—'}</Tag>
						</div>
						<div>
							<span className="text-muted small me-1">Prescription</span>
							<Tag color="green">{data.prescriptionStatus || '—'}</Tag>
						</div>
					</div>
				</div>

				<section className="view-appointment-section">
					<h2 className="view-appointment-section__title">Schedule &amp; location</h2>
					<div className="view-appointment-grid view-appointment-grid--2">
						<div className="view-appointment-field">
							<div className="view-appointment-field__label">Date</div>
							<p className="view-appointment-field__value">
								{scheduleValid ? moment(data.scheduleDate).format('dddd, MMMM D, YYYY') : '—'}
							</p>
						</div>
						<div className="view-appointment-field">
							<div className="view-appointment-field__label">Time</div>
							<p className="view-appointment-field__value">{data.scheduleTime || '—'}</p>
						</div>
						<div className="view-appointment-field" style={{ gridColumn: '1 / -1', padding: 0, background: 'transparent', border: 'none' }}>
							<IntegratedVideoSession appointment={data} patientSummary={patientSummary} />
						</div>
						{clinicLocation && (
							<div className="view-appointment-field" style={{ gridColumn: '1 / -1' }}>
								<div className="view-appointment-field__label">
									<FaMapMarkerAlt className="me-1" />
									Clinic / address
								</div>
								<p className="view-appointment-field__value mb-0">{clinicLocation}</p>
							</div>
						)}
					</div>
				</section>

				{doctor && (
					<section className="view-appointment-section">
						<h2 className="view-appointment-section__title">Doctor</h2>
						<div className="view-appointment-person">
							{doctor.img ? (
								<img src={doctor.img} alt="" className="view-appointment-avatar" />
							) : (
								<div className="view-appointment-avatar-placeholder" aria-hidden>
									<FaUserMd />
								</div>
							)}
							<div>
								<p className="view-appointment-person__name">Dr. {doctorName}</p>
								<ul className="view-appointment-person__lines">
									{doctor.designation && <li>{doctor.designation}</li>}
									{doctor.specialization && <li>{doctor.specialization}</li>}
									{doctor.college && <li>{doctor.college}</li>}
									{doctor.phone && <li>Phone: {doctor.phone}</li>}
									{doctor.email && <li>Email: {doctor.email}</li>}
								</ul>
							</div>
						</div>
					</section>
				)}

				<section className="view-appointment-section">
					<h2 className="view-appointment-section__title">Patient</h2>
					<div className="view-appointment-person">
						{patientSummary.img ? (
							<img src={patientSummary.img} alt="" className="view-appointment-avatar" />
						) : (
							<div className="view-appointment-avatar-placeholder" aria-hidden>
								<FaUserMd />
							</div>
						)}
						<div>
							<p className="view-appointment-person__name">{patientSummary.displayName}</p>
							<ul className="view-appointment-person__lines">
								<li>
									<strong>Age:</strong> {patientSummary.ageLabel}
								</li>
								<li>
									<strong>Blood group:</strong> {patientSummary.blood}
								</li>
								<li>
									<strong>Location:</strong> {patientSummary.location}
								</li>
								<li>
									<strong>Email:</strong> {patientSummary.emailLine}
								</li>
								<li>
									<strong>Phone:</strong> {patientSummary.phoneLine}
								</li>
								{!patientSummary.hasPatientRecord && (
									<li className="text-muted">
										No linked patient account — details are taken from this booking only.
									</li>
								)}
							</ul>
							{(data.reasonForVisit || data.description) && (
								<div className="view-appointment-reason">
									<div className="view-appointment-reason__label">Reason &amp; notes</div>
									{data.reasonForVisit && <p>{data.reasonForVisit}</p>}
									{data.description && <p>{data.description}</p>}
								</div>
							)}
						</div>
					</div>
				</section>

				{/* Post-Consultation Official Diagnostic & Clinical Reports */}
				<section className="view-appointment-section">
					<div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
						<div>
							<h2 className="view-appointment-section__title mb-1">
								<FaFileMedical className="me-2 text-primary" />
								Post-Consultation Diagnostic &amp; Clinical Reports
							</h2>
							<p className="text-muted small mb-0">
								Official clinical reports are authored by the consulting physician after consultation completion and synced to this appointment.
							</p>
						</div>
						{isDoctor && isCompletedConsultation && (
							<Button
								type="primary"
								size="small"
								icon={<FaFileMedical />}
								onClick={() => setIsGeneratorOpen(true)}
							>
								Generate Consultation Report
							</Button>
						)}
					</div>

					{!isCompletedConsultation ? (
						<div className="p-3 bg-light rounded border">
							<Alert
								type={isBlockedTerminalStatus ? 'warning' : 'info'}
								showIcon
								icon={<FaClock />}
								message={
									isBlockedTerminalStatus
										? `Reports Unavailable (${data.status})`
										: 'Awaiting Consultation Completion'
								}
								description={
									isBlockedTerminalStatus
										? `No consultation report can be generated for appointments with status "${data.status}".`
										: isDoctor
											? 'Complete the patient consultation first, then generate and publish a customized post-consultation report with patient-specific findings.'
											: 'Your consulting doctor will review findings and publish the official post-consultation report here once this visit is completed.'
								}
							/>
							{isDoctor && !isBlockedTerminalStatus && (
								<div className="mt-3 d-flex flex-wrap gap-2 justify-content-end">
									<Button
										type="default"
										loading={isCompletingConsultation}
										icon={<FaCheckCircle />}
										onClick={() => handleCompleteConsultation(false)}
									>
										Mark Consultation Completed
									</Button>
									<Button
										type="primary"
										loading={isCompletingConsultation}
										icon={<FaFileMedical />}
										onClick={() => handleCompleteConsultation(true)}
									>
										Complete &amp; Generate Report
									</Button>
								</div>
							)}
						</div>
					) : consultationReports.length > 0 ? (
						<div className="row g-3">
							{consultationReports.map((report) => (
								<div key={report.id} className="col-12 col-md-6">
									<div className="card h-100 border p-3 rounded shadow-sm bg-white">
										<div className="d-flex justify-content-between align-items-start mb-2">
											<Tag color="cyan">{report.reportType || 'Clinical Report'}</Tag>
											<span className="small text-muted">
												{moment(report.testDate || report.reportDate || report.createdAt).format('MMM DD, YYYY')}
											</span>
										</div>
										<h5 className="fw-bold mb-1 text-dark" style={{ fontSize: '1rem' }}>
											{report.reportTitle}
										</h5>
										<p className="small text-muted mb-2">
											{report.hospitalOrLab || 'MediConnect Clinical Care Center'}
										</p>
										{report.description && (
											<p
												className="small text-secondary mb-3"
												style={{
													display: '-webkit-box',
													WebkitLineClamp: 2,
													WebkitBoxOrient: 'vertical',
													overflow: 'hidden',
												}}
											>
												{report.description}
											</p>
										)}
										<div className="mt-auto d-flex justify-content-between align-items-center pt-2 border-top">
											<span className="badge bg-success-subtle text-success small">
												<FaCheckCircle className="me-1" /> Signed Post-Consultation
											</span>
											<Button
												type="primary"
												size="small"
												icon={<FaEye />}
												onClick={() => setPreviewReport(report)}
											>
												Inspect Report
											</Button>
										</div>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="p-3 bg-light rounded text-center border">
							<p className="text-muted mb-2 small">
								Consultation completed ({data.reasonForVisit || 'General Consultation'}).{' '}
								{isDoctor
									? 'Generate the official post-consultation report with patient findings.'
									: 'Waiting for consulting physician to publish the clinical summary.'}
							</p>
							{isDoctor && (
								<Button
									type="primary"
									size="small"
									icon={<FaFileMedical />}
									onClick={() => setIsGeneratorOpen(true)}
								>
									Generate {problemCategory === CLINICAL_PROBLEM_TYPES.CHEST ? 'Chest & Cardiopulmonary' : 'Post-Consultation'} Report
								</Button>
							)}
						</div>
					)}
				</section>
			</div>
		);
	} else {
		content = (
			<div className="view-appointment-error">
				<Empty description="Appointment not found" />
			</div>
		);
	}

	return (
		<>
			<Header />
			<div className="view-appointment-page">
				<div className="container px-3">
					<div className="view-appointment-toolbar">
						<Button type="primary" size="large" icon={<FaPrint />} onClick={handlePrint}>
							Print / PDF
						</Button>
					</div>
					<div ref={printRef}>{content}</div>
				</div>
			</div>
			<ClinicalReportViewer
				report={previewReport}
				open={Boolean(previewReport)}
				onClose={() => setPreviewReport(null)}
			/>
			<ConsultationReportGeneratorModal
				open={isGeneratorOpen}
				appointment={data}
				onClose={() => setIsGeneratorOpen(false)}
				onSuccess={(createdReport) => {
					refetch();
					if (createdReport) setPreviewReport(createdReport);
				}}
			/>
			<Footer />
		</>
	);
};

export default ViewAppointment;
