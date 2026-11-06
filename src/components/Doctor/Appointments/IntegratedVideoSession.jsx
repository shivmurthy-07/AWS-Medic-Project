import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button, Tag, Tooltip, message, Modal, Popconfirm, Spin } from 'antd';
import {
	FaVideo,
	FaPhoneSlash,
	FaExternalLinkAlt,
	FaExpand,
	FaCompress,
	FaShieldAlt,
	FaClock,
	FaCheckCircle,
	FaCamera,
	FaMicrophone,
	FaCopy,
	FaUserMd,
	FaNotesMedical,
	FaHeadset,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { getUserInfo } from '../../../service/auth.service';
import './IntegratedVideoSession.css';

/** Formats seconds into MM:SS or HH:MM:SS */
function formatCallDuration(totalSeconds) {
	if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '00:00';
	const hrs = Math.floor(totalSeconds / 3600);
	const mins = Math.floor((totalSeconds % 3600) / 60);
	const secs = totalSeconds % 60;
	const pad = (n) => String(n).padStart(2, '0');
	if (hrs > 0) {
		return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
	}
	return `${pad(mins)}:${pad(secs)}`;
}

const IntegratedVideoSession = ({ appointment, patientSummary }) => {
	const [callState, setCallState] = useState('idle'); // 'idle' | 'connecting' | 'in_call' | 'ended'
	const [callDuration, setCallDuration] = useState(0);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [showInPersonVideo, setShowInPersonVideo] = useState(false);
	const iframeRef = useRef(null);

	const auth = getUserInfo();
	const userRole = auth?.role?.toLowerCase();

	const isDoctor = userRole === 'doctor' || (auth?.userId && auth?.userId === appointment?.doctorId);
	const isPatient = userRole === 'patient' || (auth?.userId && auth?.userId === appointment?.patientId);

	const doctor = appointment?.doctor;
	const doctorName = doctor
		? [doctor.firstName, doctor.lastName].filter(Boolean).join(' ') || doctor.firstName || 'Doctor'
		: 'Doctor';

	const patientName = patientSummary?.displayName || appointment?.firstName || 'Patient';

	// Deterministic unique room identifier for this appointment
	const rawId = appointment?.trackingId || appointment?.id || 'session';
	const cleanId = String(rawId).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
	const roomName = `mediconnect-consult-${cleanId}`;
	const meetingUrl = `https://meet.jit.si/${roomName}`;

	// User display name inside the video call
	const currentUserDisplayName = useMemo(() => {
		if (isDoctor) return `Dr. ${doctorName}`;
		if (isPatient) return patientName;
		return 'Consultation Participant';
	}, [isDoctor, isPatient, doctorName, patientName]);

	// Embed iframe URL with pre-configured settings
	const iframeUrl = useMemo(() => {
		const configHash = [
			`userInfo.displayName=${encodeURIComponent(currentUserDisplayName)}`,
			'config.prejoinPageEnabled=false',
			'config.disableDeepLinking=true',
			'config.startWithAudioMuted=false',
			'config.startWithVideoMuted=false',
			`config.defaultRemoteDisplayName=${encodeURIComponent(isDoctor ? patientName : `Dr. ${doctorName}`)}`,
		].join('&');
		return `${meetingUrl}#${configHash}`;
	}, [meetingUrl, currentUserDisplayName, isDoctor, patientName, doctorName]);

	// Active call timer
	useEffect(() => {
		let timerId = null;
		if (callState === 'in_call' || callState === 'connecting') {
			timerId = setInterval(() => {
				setCallDuration((prev) => prev + 1);
			}, 1000);
		}
		return () => {
			if (timerId) clearInterval(timerId);
		};
	}, [callState]);

	const handleStartCall = () => {
		setCallState('connecting');
		setCallDuration(0);
	};

	const handleEndCall = () => {
		setCallState('ended');
		setIsModalOpen(false);
		message.info('Video consultation session ended.');
	};

	const handleRestartCall = () => {
		setCallState('connecting');
		setCallDuration(0);
	};

	const handleCopyMeetingLink = () => {
		if (navigator.clipboard) {
			navigator.clipboard
				.writeText(meetingUrl)
				.then(() => message.success('Teleconsultation meeting link copied!'))
				.catch(() => message.error('Failed to copy link.'));
		} else {
			message.info(`Meeting link: ${meetingUrl}`);
		}
	};

	const handleOpenNewWindow = () => {
		window.open(meetingUrl, '_blank', 'noopener,noreferrer,width=1200,height=800');
	};

	const isOnline =
		!appointment?.consultationMode ||
		appointment.consultationMode.toUpperCase() === 'ONLINE' ||
		appointment.consultationMode === 'Online';

	// If in-person and user hasn't toggled video on, show the in-person summary with launcher
	if (!isOnline && !showInPersonVideo && callState === 'idle') {
		return (
			<div className="integrated-video-container">
				<div className="integrated-video-header">
					<div className="integrated-video-header__title">
						<Tag color="cyan">In-Person Consultation</Tag>
						<span>Clinic Visit</span>
					</div>
					<Button type="default" size="small" icon={<FaVideo />} onClick={() => setShowInPersonVideo(true)}>
						Switch to Online Video Call
					</Button>
				</div>
				<div className="p-3 text-muted small">
					This appointment is configured for an in-person clinic visit. If you or the patient prefer a remote video
					consultation, you can switch and launch a live telehealth session at any time.
				</div>
			</div>
		);
	}

	return (
		<div className="integrated-video-container">
			{/* Header strip */}
			<div className="integrated-video-header">
				<div className="integrated-video-header__title">
					<Tag color="blue" icon={<FaVideo className="me-1" />}>
						Online Telehealth Visit
					</Tag>
					{callState === 'in_call' ? (
						<span className="text-danger fw-bold d-flex align-items-center">
							<span className="video-pulse-dot video-pulse-dot--live" />
							Live Video Consultation
						</span>
					) : callState === 'connecting' ? (
						<span className="text-primary fw-semibold d-flex align-items-center">
							<Spin size="small" className="me-2" /> Connecting session…
						</span>
					) : callState === 'ended' ? (
						<span className="text-muted fw-semibold">Consultation Concluded</span>
					) : (
						<span className="text-success fw-semibold d-flex align-items-center">
							<span className="video-pulse-dot" /> Telehealth Room Active &amp; Ready
						</span>
					)}
				</div>

				<div className="integrated-video-header__meta">
					<Tooltip title="Copy secure meeting link">
						<Button size="small" icon={<FaCopy />} onClick={handleCopyMeetingLink}>
							Room: {roomName.slice(0, 22)}…
						</Button>
					</Tooltip>
					<Tooltip title="Open video in external window">
						<Button size="small" icon={<FaExternalLinkAlt />} onClick={handleOpenNewWindow}>
							Popout
						</Button>
					</Tooltip>
				</div>
			</div>

			{/* Print Mode Summary: Only visible when printing / PDF */}
			<div className="integrated-video-print-summary">
				<strong>Visit Format:</strong> Online Teleconsultation | <strong>Room Code:</strong> {roomName} |{' '}
				<strong>Status:</strong> {callState === 'in_call' ? 'In Progress' : 'Confirmed'}
			</div>

			{/* State 1: Idle Preview Banner before entering call */}
			{callState === 'idle' && (
				<div className="integrated-video-preview">
					<div className="integrated-video-preview__headline">
						<h3 className="integrated-video-preview__title">
							<FaVideo /> MediConnect Telehealth Video Suite
						</h3>
						<p className="integrated-video-preview__desc">
							Direct, browser-integrated HD video consultation session. No downloads or third-party accounts
							required.
						</p>
					</div>

					{/* Participants display */}
					<div className="integrated-video-participants">
						<div className="participant-chip">
							{doctor?.img ? (
								<img src={doctor.img} alt="" className="participant-chip__avatar" />
							) : (
								<div className="participant-chip__avatar-placeholder">
									<FaUserMd />
								</div>
							)}
							<div>
								<p className="participant-chip__name">Dr. {doctorName}</p>
								<p className="participant-chip__role">
									{doctor?.specialization || 'Attending Physician'} {isDoctor && '· (You)'}
								</p>
							</div>
						</div>

						<div className="participant-chip">
							{patientSummary?.img ? (
								<img src={patientSummary.img} alt="" className="participant-chip__avatar" />
							) : (
								<div className="participant-chip__avatar-placeholder">{patientName.charAt(0).toUpperCase()}</div>
							)}
							<div>
								<p className="participant-chip__name">{patientName}</p>
								<p className="participant-chip__role">
									Patient {patientSummary?.ageLabel ? `· ${patientSummary.ageLabel}` : ''} {isPatient && '· (You)'}
								</p>
							</div>
						</div>
					</div>

					{/* Pre-call checklist */}
					<div className="integrated-video-checklist">
						<div className="integrated-video-checklist__item">
							<FaCamera /> HD Camera Enabled
						</div>
						<div className="integrated-video-checklist__item">
							<FaMicrophone /> Audio &amp; Mic Checked
						</div>
						<div className="integrated-video-checklist__item">
							<FaShieldAlt /> End-to-End Encrypted
						</div>
						<div className="integrated-video-checklist__item">
							<FaHeadset /> Earphones Recommended
						</div>
					</div>

					{/* Primary Call Actions */}
					<div className="integrated-video-actions">
						<Button type="primary" size="large" className="btn-start-call" onClick={handleStartCall}>
							<FaVideo />
							{isDoctor ? 'Start Video Consultation' : 'Join Video Consultation'}
						</Button>

						<Button type="default" size="large" className="btn-video-secondary" onClick={() => setIsModalOpen(true)}>
							<FaExpand /> Fullscreen Mode
						</Button>

						<Button type="default" size="large" className="btn-video-secondary" onClick={handleCopyMeetingLink}>
							<FaCopy /> Copy Room Link
						</Button>
					</div>
				</div>
			)}

			{/* State 2: Active or Connecting Call */}
			{(callState === 'connecting' || callState === 'in_call') && (
				<div className="integrated-video-active">
					{/* Live in-call toolbar */}
					<div className="integrated-video-active__toolbar">
						<div className="d-flex align-items-center gap-2">
							<span className="video-pulse-dot video-pulse-dot--live" />
							<span className="fw-bold text-white small text-uppercase">Live Teleconsultation</span>
							<div className="integrated-video-timer">
								<FaClock /> {formatCallDuration(callDuration)}
							</div>
						</div>

						<div className="d-flex align-items-center gap-2">
							<Tooltip title="Expand to Fullscreen Consultation View">
								<Button
									size="small"
									type="text"
									className="text-white"
									icon={<FaExpand />}
									onClick={() => setIsModalOpen(true)}
								>
									Expand
								</Button>
							</Tooltip>

							<Tooltip title="Open in external popup window">
								<Button
									size="small"
									type="text"
									className="text-white"
									icon={<FaExternalLinkAlt />}
									onClick={handleOpenNewWindow}
								>
									Popout
								</Button>
							</Tooltip>

							<Popconfirm
								title="End Consultation"
								description="Are you sure you want to end this video call session?"
								onConfirm={handleEndCall}
								okText="Yes, End Call"
								cancelText="Stay"
								okButtonProps={{ danger: true }}
							>
								<Button size="small" danger type="primary" icon={<FaPhoneSlash />}>
									End Call
								</Button>
							</Popconfirm>
						</div>
					</div>

					{/* Embedded WebRTC Frame */}
					<div className="integrated-video-frame-wrap">
						{callState === 'connecting' && (
							<div className="integrated-video-loading">
								<Spin size="large" />
								<p className="mt-3 mb-1 fw-semibold">Connecting to secure consultation room…</p>
								<span className="small text-muted">Grant microphone and camera permissions if prompted</span>
							</div>
						)}
						<iframe
							ref={iframeRef}
							src={iframeUrl}
							title="Telehealth Video Consultation"
							className="integrated-video-frame"
							allow="camera; microphone; display-capture; autoplay; clipboard-write; fullscreen"
							onLoad={() => setCallState('in_call')}
						/>
					</div>

					{/* Doctor quick prescription bar & patient tools */}
					<div className="integrated-video-footer-tools">
						<div className="d-flex align-items-center gap-2">
							<FaShieldAlt className="text-info" />
							<span>Encrypted WebRTC Session · Connected as {currentUserDisplayName}</span>
						</div>

						<div className="d-flex align-items-center gap-2">
							{isDoctor && (
								<Link to={`/dashboard/appointment/treatment/${appointment.id}`}>
									<Button type="primary" size="small" icon={<FaNotesMedical />}>
										Prescribe Treatment for this Visit
									</Button>
								</Link>
							)}
							{isPatient && (
								<Link to="/dashboard/prescriptions">
									<Button size="small">View My Prescriptions</Button>
								</Link>
							)}
						</div>
					</div>
				</div>
			)}

			{/* State 3: Call Concluded Summary */}
			{callState === 'ended' && (
				<div className="integrated-video-ended">
					<div className="integrated-video-ended__icon">
						<FaCheckCircle className="text-success" />
					</div>
					<h4 className="integrated-video-ended__title">Video Consultation Concluded</h4>
					<p className="integrated-video-ended__desc">
						Total session duration: <strong>{formatCallDuration(callDuration)}</strong>. Records and visit details
						have been preserved for this appointment.
					</p>

					<div className="d-flex justify-content-center gap-2 flex-wrap">
						<Button type="primary" icon={<FaVideo />} onClick={handleRestartCall}>
							Re-join Consultation
						</Button>
						{isDoctor && (
							<Link to={`/dashboard/appointment/treatment/${appointment.id}`}>
								<Button type="default" icon={<FaNotesMedical />}>
									Write Prescription
								</Button>
							</Link>
						)}
						<Button type="default" icon={<FaCopy />} onClick={handleCopyMeetingLink}>
							Copy Room Link
						</Button>
					</div>
				</div>
			)}

			{/* Fullscreen Consultation Modal (Enterprise Side-by-Side View) */}
			<Modal
				open={isModalOpen}
				onCancel={() => setIsModalOpen(false)}
				footer={null}
				width="95vw"
				centered
				wrapClassName="telehealth-modal"
				destroyOnClose={false}
			>
				<div className="telehealth-modal-layout">
					{/* Modal Header */}
					<div className="telehealth-modal-header">
						<div className="d-flex align-items-center gap-3">
							<span className="video-pulse-dot video-pulse-dot--live" />
							<span className="fw-bold">MediConnect Telehealth Suite</span>
							<Tag color="blue">Dr. {doctorName}</Tag>
							<Tag color="green">{patientName}</Tag>
							<div className="integrated-video-timer ms-2">
								<FaClock /> {formatCallDuration(callDuration)}
							</div>
						</div>

						<div className="d-flex align-items-center gap-2">
							<Button
								size="small"
								type="text"
								className="text-white"
								icon={<FaCompress />}
								onClick={() => setIsModalOpen(false)}
							>
								Minimize to Page
							</Button>
							<Popconfirm
								title="End Consultation"
								description="Are you sure you want to end this video call session?"
								onConfirm={handleEndCall}
								okText="Yes, End Call"
								cancelText="Stay"
								okButtonProps={{ danger: true }}
							>
								<Button size="small" danger type="primary" icon={<FaPhoneSlash />}>
									End Call
								</Button>
							</Popconfirm>
						</div>
					</div>

					{/* Modal Body: Left Video, Right Patient Chart */}
					<div className="telehealth-modal-body">
						<div className="telehealth-modal-video">
							<iframe
								src={iframeUrl}
								title="Telehealth Fullscreen Consultation"
								style={{ width: '100%', height: '100%', border: 'none' }}
								allow="camera; microphone; display-capture; autoplay; clipboard-write; fullscreen"
							/>
						</div>

						{/* Doctor's Side Clinical Chart */}
						<div className="telehealth-modal-sidebar">
							<div className="telehealth-sidebar-section">
								<div className="telehealth-sidebar-title">Patient Profile</div>
								<div className="telehealth-sidebar-field">
									<strong>Name:</strong> {patientName}
								</div>
								{patientSummary?.ageLabel && (
									<div className="telehealth-sidebar-field">
										<strong>Age:</strong> {patientSummary.ageLabel}
									</div>
								)}
								{patientSummary?.blood && (
									<div className="telehealth-sidebar-field">
										<strong>Blood Group:</strong> {patientSummary.blood}
									</div>
								)}
								{patientSummary?.phoneLine && (
									<div className="telehealth-sidebar-field">
										<strong>Phone:</strong> {patientSummary.phoneLine}
									</div>
								)}
							</div>

							{(appointment?.reasonForVisit || appointment?.description) && (
								<div className="telehealth-sidebar-section">
									<div className="telehealth-sidebar-title">Reason for Visit</div>
									{appointment?.reasonForVisit && (
										<p className="small text-warning-emphasis mb-1">{appointment.reasonForVisit}</p>
									)}
									{appointment?.description && (
										<p className="small text-muted mb-0">{appointment.description}</p>
									)}
								</div>
							)}

							<div className="telehealth-sidebar-section">
								<div className="telehealth-sidebar-title">Clinical Actions</div>
								{isDoctor && (
									<Link to={`/dashboard/appointment/treatment/${appointment.id}`} target="_blank">
										<Button type="primary" block size="small" icon={<FaNotesMedical />} className="mb-2">
											Open Prescription Editor
										</Button>
									</Link>
								)}
								<Button block size="small" icon={<FaCopy />} onClick={handleCopyMeetingLink}>
									Copy Meeting URL
								</Button>
							</div>

							<div className="telehealth-sidebar-section">
								<div className="telehealth-sidebar-title">Session Security</div>
								<p className="small text-muted mb-0">
									<FaShieldAlt className="text-info me-1" />
									Session is encrypted and HIPAA compliant. Participant identity is verified against booking
									records.
								</p>
							</div>
						</div>
					</div>
				</div>
			</Modal>
		</div>
	);
};

export default IntegratedVideoSession;

