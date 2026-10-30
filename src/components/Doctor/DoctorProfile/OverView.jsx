import React from 'react';
import { Empty } from 'antd';
import { FaGraduationCap, FaBriefcase, FaAward, FaStethoscope, FaStar } from 'react-icons/fa';
import './OverView.css';

const toList = (value) =>
	typeof value === 'string'
		? value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean)
		: [];

const OverView = ({ doctor }) => {
	const education = [doctor?.degree, doctor?.college, doctor?.completionYear].filter(Boolean);
	const experience = [
		doctor?.designation,
		doctor?.experienceHospitalName,
		[doctor?.expericenceStart, doctor?.expericenceEnd].filter(Boolean).join(' - '),
	].filter(Boolean);
	const location = [doctor?.city, doctor?.state, 'India'].filter(Boolean).join(', ');
	const services = toList(doctor?.services);
	const specializations = toList(doctor?.specialization);

	return (
		<div className="overview-container">
			<div className="overview-grid">
				<div className="overview-main">
					<section className="overview-section">
						<h3 className="overview-section__title">About</h3>
						<p className="overview-section__text">
							{doctor?.biography || 'This doctor has not added a profile biography yet.'}
						</p>
						{location && <p className="overview-section__text">{location}</p>}
					</section>

					<section className="overview-section">
						<h3 className="overview-section__title">
							<FaGraduationCap className="overview-section__icon" /> Education
						</h3>
						{education.length ? (
							<div className="timeline">
								<div className="timeline-item">
									<div className="timeline-marker" />
									<div className="timeline-content">
										{doctor.degree && <h4>{doctor.degree}</h4>}
										{doctor.college && <p className="timeline-institution">{doctor.college}</p>}
										{doctor.completionYear && <span className="timeline-year">{doctor.completionYear}</span>}
										{location && <p className="timeline-location">{location}</p>}
									</div>
								</div>
							</div>
						) : <p className="overview-section__text">Education details have not been added.</p>}
					</section>

					<section className="overview-section">
						<h3 className="overview-section__title">
							<FaBriefcase className="overview-section__icon" /> Work Experience
						</h3>
						{experience.length ? (
							<div className="timeline">
								<div className="timeline-item">
									<div className="timeline-marker" />
									<div className="timeline-content">
										{doctor.designation && <h4>{doctor.designation}</h4>}
										{doctor.experienceHospitalName && <p className="timeline-institution">{doctor.experienceHospitalName}</p>}
										{doctor.expericenceStart && (
											<span className="timeline-year">
												{[doctor.expericenceStart, doctor.expericenceEnd].filter(Boolean).join(' - ')}
											</span>
										)}
										{location && <p className="timeline-location">{location}</p>}
									</div>
								</div>
							</div>
						) : <p className="overview-section__text">Work experience details have not been added.</p>}
					</section>
				</div>

				<div className="overview-sidebar">
					<section className="overview-card">
						<h3 className="overview-card__title">
							<FaAward className="overview-card__icon" /> Awards &amp; Recognition
						</h3>
						{doctor?.award ? (
							<div className="awards-list">
								<div className="award-item">
									<div className="award-icon"><FaStar /></div>
									<div>
										<h5>{doctor.award}</h5>
										{doctor.awardYear && <span>{doctor.awardYear}</span>}
									</div>
								</div>
							</div>
						) : <p>No awards have been added.</p>}
					</section>

					<section className="overview-card">
						<h3 className="overview-card__title">
							<FaStethoscope className="overview-card__icon" /> Services Offered
						</h3>
						{services.length ? (
							<ul className="services-list">
								{services.map((service) => <li key={service}>{service}</li>)}
							</ul>
						) : <p>No services have been added.</p>}
					</section>

					<section className="overview-card">
						<h3 className="overview-card__title">Specializations</h3>
						{specializations.length ? (
							<div className="specializations-list">
								{specializations.map((specialization) => (
									<span className="specialization-tag" key={specialization}>{specialization}</span>
								))}
							</div>
						) : <Empty description="No specializations have been added." />}
					</section>
				</div>
			</div>
		</div>
	);
};

export default OverView;
