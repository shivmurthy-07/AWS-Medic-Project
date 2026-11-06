import React, { useState, useEffect, useMemo } from 'react';
import {
    FaLock,
    FaEye,
    FaEyeSlash,
    FaHeartbeat,
    FaShieldAlt,
    FaCheckCircle,
    FaTimesCircle,
    FaArrowLeft,
    FaCheck,
    FaExclamationTriangle
} from 'react-icons/fa';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Spinner from 'react-bootstrap/Spinner';
import { message, Alert, Progress } from 'antd';
import { useValidateResetTokenMutation, useResetPasswordWithTokenMutation } from '../../redux/api/authApi';
import './SignInForm.css';

// Password criteria checks
const hasMinLength = (pwd) => typeof pwd === 'string' && pwd.length >= 8 && pwd.length <= 128;
const hasUppercase = (pwd) => typeof pwd === 'string' && /[A-Z]/.test(pwd);
const hasLowercase = (pwd) => typeof pwd === 'string' && /[a-z]/.test(pwd);
const hasNumber = (pwd) => typeof pwd === 'string' && /\d/.test(pwd);
const hasSymbol = (pwd) => typeof pwd === 'string' && /[ `!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(pwd);

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const params = useParams();
    const navigate = useNavigate();

    const token = useMemo(() => {
        return searchParams.get('token') || params.uniqueString || '';
    }, [searchParams, params]);

    // Validation state
    const [isValidating, setIsValidating] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [tokenError, setTokenError] = useState('');

    // Form state
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formError, setFormError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [redirectCountdown, setRedirectCountdown] = useState(3);

    const [validateResetToken] = useValidateResetTokenMutation();
    const [resetPasswordWithToken, { isLoading: isResetting }] = useResetPasswordWithTokenMutation();

    // Verify token on mount
    useEffect(() => {
        let isMounted = true;

        const verifyToken = async () => {
            if (!token) {
                if (isMounted) {
                    setIsValidating(false);
                    setTokenValid(false);
                    setTokenError('No password reset token was provided in the link.');
                }
                return;
            }

            try {
                await validateResetToken({ token }).unwrap();
                if (isMounted) {
                    setTokenValid(true);
                    setIsValidating(false);
                }
            } catch (err) {
                if (isMounted) {
                    const msg =
                        err?.data?.message ||
                        err?.message ||
                        'This password reset link is invalid or has expired.';
                    setTokenValid(false);
                    setTokenError(msg);
                    setIsValidating(false);
                }
            }
        };

        verifyToken();

        return () => {
            isMounted = false;
        };
    }, [token, validateResetToken]);

    // Redirect countdown when reset succeeds
    useEffect(() => {
        let timer = null;
        if (isSuccess && redirectCountdown > 0) {
            timer = setTimeout(() => {
                setRedirectCountdown((prev) => prev - 1);
            }, 1000);
        } else if (isSuccess && redirectCountdown === 0) {
            navigate('/login', { replace: true });
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [isSuccess, redirectCountdown, navigate]);

    // Strength calculations
    const criteria = useMemo(() => {
        return {
            length: hasMinLength(newPassword),
            upper: hasUppercase(newPassword),
            lower: hasLowercase(newPassword),
            number: hasNumber(newPassword),
            symbol: hasSymbol(newPassword),
        };
    }, [newPassword]);

    const passedCount = Object.values(criteria).filter(Boolean).length;
    const isStrong = passedCount === 5;
    const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

    const strengthPercent = Math.round((passedCount / 5) * 100);
    const strengthLabel = passedCount <= 2 ? 'Weak' : passedCount <= 4 ? 'Moderate' : 'Strong';
    const strengthColor = passedCount <= 2 ? '#ef4444' : passedCount <= 4 ? '#f59e0b' : '#10b981';

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!isStrong) {
            setFormError('Please ensure your new password satisfies all strength requirements.');
            return;
        }

        if (!passwordsMatch) {
            setFormError('New password and confirm password do not match.');
            return;
        }

        try {
            const res = await resetPasswordWithToken({
                token,
                password: newPassword,
            }).unwrap();

            const successMessage =
                res?.message ||
                'Your password has been reset successfully. You can now log in using your new password.';
            message.success(successMessage);
            setIsSuccess(true);
        } catch (err) {
            const errorMsg =
                err?.data?.message ||
                err?.message ||
                'Unable to reset password. The link may have expired.';
            setFormError(errorMsg);
            message.error(errorMsg);
        }
    };

    return (
        <main className="signin-signup-container">
            {/* Left Brand Panel */}
            <section className="auth-brand-panel" aria-label="About AWS Medic">
                <svg className="auth-medical-art" viewBox="0 0 360 460" fill="none" aria-hidden="true">
                    <path d="M92 54v91c0 39 31 70 70 70s70-31 70-70V54" />
                    <path d="M72 54h40M212 54h40" />
                    <circle cx="72" cy="48" r="13" />
                    <circle cx="252" cy="48" r="13" />
                    <path d="M162 215v48c0 31 25 56 56 56h18" />
                    <circle cx="260" cy="319" r="24" />
                    <path d="M260 307v24M248 319h24" />
                    <path className="auth-medical-art__cross" d="M284 97v44M262 119h44" />
                    <path className="auth-medical-art__pulse" d="M20 360h86l16-1 14-1 12 3 12-1 13-27 16 57 16-39 14 9h122" />
                </svg>

                <Link to="/" className="auth-brand">
                    <span className="auth-brand__icon"><FaHeartbeat /></span>
                    <span>AWS Medic</span>
                </Link>

                <div className="auth-brand__content">
                    <span className="auth-eyebrow"><FaShieldAlt /> SECURE ACCESS</span>
                    <h1>Create Your <span>New Password</span></h1>
                    <p>
                        Choose a strong, unique password to safeguard your health records, appointments, and consultations.
                    </p>
                </div>

                <div className="auth-brand__footer">
                    <span>Thoughtful care. Confident living.</span>
                    <span>&copy; AWS Medic</span>
                </div>
            </section>

            {/* Right Form Panel */}
            <section className="auth-form-panel">
                <Link to="/login" className="auth-back-link">
                    <FaArrowLeft className="me-2" /> Back to Login
                </Link>

                <div className="auth-card">
                    {/* State 1: Verifying Token */}
                    {isValidating && (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
                            <h3 className="mt-4" style={{ fontSize: '1.2rem', color: '#0f172a' }}>
                                Validating your reset link…
                            </h3>
                            <p className="text-muted small">Please wait a moment while we verify your security token.</p>
                        </div>
                    )}

                    {/* State 2: Token Invalid / Expired */}
                    {!isValidating && !tokenValid && !isSuccess && (
                        <div className="text-center py-4 px-2">
                            <div className="mb-3" style={{ fontSize: '3rem', color: '#ef4444' }}>
                                <FaExclamationTriangle />
                            </div>
                            <h2 className="title" style={{ fontSize: '1.35rem', marginBottom: '0.75rem' }}>
                                Link Expired or Invalid
                            </h2>
                            <Alert
                                type="error"
                                showIcon
                                message="Invalid Reset Link"
                                description={
                                    tokenError ||
                                    'This password reset link is invalid or has expired. Password reset links expire after 15 minutes and can only be used once.'
                                }
                                className="mb-4 text-start"
                            />
                            <div className="d-flex flex-column gap-2">
                                <Link to="/forgot-password" className="iBtn text-center">
                                    Request a New Reset Link
                                </Link>
                                <Link to="/login" className="auth-text-button mt-2">
                                    Return to Login
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* State 3: Password Reset Succeeded */}
                    {isSuccess && (
                        <div className="text-center py-4 px-2">
                            <div className="mb-3" style={{ fontSize: '3.5rem', color: '#10b981' }}>
                                <FaCheckCircle />
                            </div>
                            <h2 className="title" style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>
                                Password Reset Complete
                            </h2>
                            <Alert
                                type="success"
                                showIcon
                                message="Success!"
                                description="Your password has been reset successfully. You can now log in using your new password."
                                className="mb-4 text-start"
                            />
                            <p className="text-muted small mb-4">
                                Redirecting to the login page in <strong>{redirectCountdown}</strong> seconds…
                            </p>
                            <Link to="/login" className="iBtn text-center d-block">
                                Log In Now
                            </Link>
                        </div>
                    )}

                    {/* State 4: Token is Valid, Show Reset Form */}
                    {!isValidating && tokenValid && !isSuccess && (
                        <form className="sign-in-form" onSubmit={handleResetSubmit} noValidate>
                            <div className="auth-form-heading">
                                <span className="auth-eyebrow">UPDATE CREDENTIALS</span>
                                <h2 className="title">Reset Your Password</h2>
                                <p className="auth-form-description">
                                    Enter and confirm your new password below.
                                </p>
                            </div>

                            {formError && (
                                <Alert
                                    type="error"
                                    showIcon
                                    message={formError}
                                    className="mb-3"
                                />
                            )}

                            {/* New Password */}
                            <div className="input-field mb-1">
                                <span className="fIcon"><FaLock /></span>
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => {
                                        setNewPassword(e.target.value);
                                        if (formError) setFormError('');
                                    }}
                                    placeholder="New Password"
                                    autoComplete="new-password"
                                    aria-label="New Password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="auth-password-toggle"
                                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                                    onClick={() => setShowNewPassword((prev) => !prev)}
                                >
                                    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>

                            {/* Password Strength Indicator */}
                            {newPassword.length > 0 && (
                                <div className="mt-2 mb-3 p-2 bg-light rounded border">
                                    <div className="d-flex justify-content-between align-items-center mb-1 small">
                                        <span className="text-muted">Password Strength:</span>
                                        <strong style={{ color: strengthColor }}>{strengthLabel}</strong>
                                    </div>
                                    <Progress
                                        percent={strengthPercent}
                                        strokeColor={strengthColor}
                                        showInfo={false}
                                        size="small"
                                    />
                                    <div className="mt-2 small text-muted" style={{ fontSize: '0.78rem', lineHeight: 1.5 }}>
                                        <div className={criteria.length ? 'text-success' : 'text-muted'}>
                                            {criteria.length ? <FaCheck className="me-1" /> : '• '} 8 to 128 characters
                                        </div>
                                        <div className={criteria.upper ? 'text-success' : 'text-muted'}>
                                            {criteria.upper ? <FaCheck className="me-1" /> : '• '} At least one uppercase letter (A-Z)
                                        </div>
                                        <div className={criteria.lower ? 'text-success' : 'text-muted'}>
                                            {criteria.lower ? <FaCheck className="me-1" /> : '• '} At least one lowercase letter (a-z)
                                        </div>
                                        <div className={criteria.number ? 'text-success' : 'text-muted'}>
                                            {criteria.number ? <FaCheck className="me-1" /> : '• '} At least one number (0-9)
                                        </div>
                                        <div className={criteria.symbol ? 'text-success' : 'text-muted'}>
                                            {criteria.symbol ? <FaCheck className="me-1" /> : '• '} At least one special symbol (!@#$%^&*)
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Confirm Password */}
                            <div className="input-field mt-3 mb-1">
                                <span className="fIcon"><FaLock /></span>
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        if (formError) setFormError('');
                                    }}
                                    placeholder="Confirm New Password"
                                    autoComplete="new-password"
                                    aria-label="Confirm New Password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="auth-password-toggle"
                                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                                >
                                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>

                            {/* Match feedback */}
                            {confirmPassword.length > 0 && (
                                <div className="mb-3 ps-1" style={{ fontSize: '0.82rem' }}>
                                    {passwordsMatch ? (
                                        <span className="text-success d-flex align-items-center">
                                            <FaCheck className="me-1" /> Passwords match
                                        </span>
                                    ) : (
                                        <span className="text-danger d-flex align-items-center">
                                            <FaTimesCircle className="me-1" /> Passwords do not match
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                className="iBtn mt-3"
                                type="submit"
                                disabled={isResetting || !isStrong || !passwordsMatch}
                            >
                                {isResetting ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Updating Password…
                                    </>
                                ) : (
                                    'Update Password'
                                )}
                            </button>
                        </form>
                    )}
                </div>

                <p className="auth-privacy-note">
                    <FaShieldAlt /> Your information is protected and handled securely.
                </p>
            </section>
        </main>
    );
};

export default ResetPasswordPage;

