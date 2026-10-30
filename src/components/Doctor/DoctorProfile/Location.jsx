import React from 'react';
import { FaMapMarkerAlt, FaDirections, FaPhoneAlt } from 'react-icons/fa';
import { Empty } from 'antd';
import './Location.css';

const Location = ({ doctor }) => {
	const addressParts = [
		doctor?.clinicAddress || doctor?.address,
		doctor?.city,
		doctor?.state,
		doctor?.postalCode,
		'India',
	].filter(Boolean);
	const address = addressParts.join(', ');
	const mapQuery = [
		'India',
		doctor?.clinicName,
		doctor?.city,
		doctor?.state,
		doctor?.postalCode,
		doctor?.clinicAddress || doctor?.address,
	].filter(Boolean).join(', ');
	const encodedQuery = encodeURIComponent(mapQuery);
	const mapUrl = `https://www.google.com/maps?q=${encodedQuery}&output=embed&hl=en&gl=in`;
	const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}&hl=en&gl=in`;

	if (!doctor || !addressParts.some((part) => part !== 'India')) {
		return (
			<div className="locations-container">
				<Empty description="This doctor has not added a clinic address in India yet." />
			</div>
		);
	}

	return (
		<div className="locations-container">
			<section className="location-card" aria-label="Doctor clinic location in India">
				<div className="location-card__header">
					<div>
						<h3 className="location-card__name">{doctor.clinicName || 'Clinic'}</h3>
						<p className="location-card__specialty">
							{doctor.specialization || 'Doctor clinic'} · India
						</p>
					</div>
				</div>

				<div className="location-card__info">
					<div className="location-card__info-item">
						<FaMapMarkerAlt className="location-card__icon" />
						<div>
							<p>{address}</p>
							<a
								href={directionsUrl}
								className="location-card__directions"
								target="_blank"
								rel="noopener noreferrer"
							>
								<FaDirections /> Get directions
							</a>
						</div>
					</div>
					{doctor.phone && (
						<div className="location-card__info-item">
							<FaPhoneAlt className="location-card__icon" />
							<div><p>{doctor.phone}</p></div>
						</div>
					)}
				</div>

				<iframe
					className="location-card__map"
					title={`Map showing ${doctor.clinicName || 'doctor clinic'} in India`}
					src={mapUrl}
					loading="lazy"
					referrerPolicy="no-referrer-when-downgrade"
					allowFullScreen
				/>
			</section>
		</div>
	);
};

export default Location;
