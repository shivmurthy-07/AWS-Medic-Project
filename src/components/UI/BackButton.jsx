import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { getUserInfo } from '../../service/auth.service';
import './BackButton.css';

const HIDDEN_PATHS = new Set(['/', '/login', '/super-admin/login', '/forgot-password', '/reset-password']);
const DASHBOARD_ROOTS = new Set(['/dashboard', '/admin/dashboard', '/super-admin/dashboard']);

const getFallbackRoute = (role) => {
	if (role === 'admin') return '/admin/dashboard';
	if (role === 'super_admin') return '/super-admin/dashboard';
	if (role === 'patient' || role === 'doctor') return '/dashboard';
	return '/';
};

/**
 * Contextual navigation back button that steps back through router history
 * and falls back safely to the user's role dashboard when history is empty.
 */
const BackButton = ({ className = '', label = 'Back' }) => {
	const navigate = useNavigate();
	const location = useLocation();
	const role = getUserInfo()?.role;
	const hasHistory = typeof window !== 'undefined' && (window.history.state?.idx ?? 0) > 0;

	if (HIDDEN_PATHS.has(location.pathname) || location.pathname.startsWith('/reset-password/')) {
		return null;
	}

	// Don't show a dead-end Back button on the dashboard home if there is no prior page in history
	if (!hasHistory && DASHBOARD_ROOTS.has(location.pathname)) {
		return null;
	}

	const handleBack = () => {
		if (hasHistory) {
			navigate(-1);
			return;
		}
		navigate(getFallbackRoute(role));
	};

	return (
		<button
			type="button"
			onClick={handleBack}
			className={`app-back-btn ${className}`.trim()}
			aria-label="Go back to previous page"
			title="Go back"
		>
			<span className="app-back-btn__icon-wrap" aria-hidden="true">
				<FaArrowLeft className="app-back-btn__icon" />
			</span>
			<span className="app-back-btn__label">{label}</span>
		</button>
	);
};

export default BackButton;
