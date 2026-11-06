import React, { useState } from 'react';
import { FaEnvelope, FaHeartbeat, FaShieldAlt, FaArrowLeft, FaCheckCircle, FaPaperPlane } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import Spinner from 'react-bootstrap/Spinner';
import { message, Alert } from 'antd';
import { useForgotPasswordMutation } from '../../redux/api/authApi';
import './SignInForm.css';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [resetLinkData, setResetLinkData] = useState(null);

    const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
        if (emailError) setEmailError('');
        if (errorMessage) setErrorMessage('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            setEmailError('Please enter your email address.');
            return;
        }

        if (!emailRegex.test(trimmedEmail)) {
            setEmailError('Please enter a valid email address.');
            return;
        }

        try {
            const res = await forgotPassword({ email: trimmedEmail }).unwrap();
            const payload = res?.data || res;
            setResetLinkData(payload);
            setIsSubmitted(true);
            message.success(
                payload?.message ||
                'Password reset link sent to your registered email. Please check your inbox.'
            );
        } catch (err) {
            const errorMsg =
                err?.data?.message ||
                err?.message ||
                'Unable to send reset email. Please try again later.';
            setErrorMessage(errorMsg);
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
                    <span className="auth-eyebrow"><FaShieldAlt /> ACCOUNT RECOVERY</span>
                    <h1>Secure <span>Password Reset</span></h1>
                    <p>
                        We take your health data security seriously. Reset links are uniquely generated, cryptographically signed, and valid for 15 minutes.
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
                    {isSubmitted ? (
                        <div className="text-center py-4 px-2">
                            <div className="mb-3" style={{ fontSize: '3.5rem', color: '#10b981' }}>
                                <FaCheckCircle />
                            </div>
                            <h2 className="title" style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>
                                {resetLinkData?.emailSent ? 'Check Your Inbox' : 'Reset Link Generated'}
                            </h2>
                            <Alert
                                type="success"
                                showIcon
                                message={resetLinkData?.emailSent ? 'Reset Link Sent' : 'Reset Link Ready'}
                                description={
                                    resetLinkData?.emailSent
                                        ? `A password reset link has been dispatched to ${email}. Please check your inbox and click the link within 15 minutes.`
                                        : 'A unique reset link has been generated for your registered account. You can proceed below to reset your password.'
                                }
                                className="mb-4 text-start"
                            />
                            {resetLinkData?.resetLink && (
                                <div className="p-3 mb-4 rounded border text-start" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                                    <div className="fw-bold mb-1 text-success" style={{ fontSize: '0.9rem' }}>
                                        Direct Reset Access:
                                    </div>
                                    <p className="small text-muted mb-2" style={{ fontSize: '0.82rem' }}>
                                        {resetLinkData?.emailSent
                                            ? 'In case of email delay, you can also proceed directly using this link:'
                                            : 'Click below to open the secure password reset page:'}
                                    </p>
                                    <a
                                        href={resetLinkData.resetLink}
                                        className="btn btn-success btn-sm w-100 fw-bold"
                                        style={{ borderRadius: '8px', padding: '8px' }}
                                    >
                                        Open Password Reset Page
                                    </a>
                                </div>
                            )}
                            <p className="auth-form-description mb-4" style={{ fontSize: '0.88rem' }}>
                                The reset link is valid for <strong>15 minutes</strong> and can only be used once.
                            </p>
                            <div className="d-flex flex-column gap-2">
                                <Link to="/login" className="iBtn text-center">
                                    Return to Sign In
                                </Link>
                                <button
                                    type="button"
                                    className="auth-text-button mt-2"
                                    onClick={() => {
                                        setIsSubmitted(false);
                                        setEmail('');
                                        setResetLinkData(null);
                                    }}
                                >
                                    Try a different email address
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form className="sign-in-form" onSubmit={handleSubmit} noValidate>
                            <div className="auth-form-heading">
                                <span className="auth-eyebrow">RECOVER ACCESS</span>
                                <h2 className="title">Forgot Password</h2>
                                <p className="auth-form-description">
                                    Enter your registered email address and we'll send you a secure link to reset your password.
                                </p>
                            </div>

                            {errorMessage && (
                                <Alert
                                    type="error"
                                    showIcon
                                    message={errorMessage}
                                    className="mb-3"
                                />
                            )}

                            <div className="input-field">
                                <span className="fIcon"><FaEnvelope /></span>
                                <input
                                    value={email}
                                    onChange={handleEmailChange}
                                    placeholder="Enter your registered email"
                                    type="email"
                                    autoComplete="email"
                                    aria-label="Email address"
                                    required
                                />
                            </div>
                            {emailError && <span className="auth-field-error">{emailError}</span>}

                            <button className="iBtn mt-3" type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Sending Reset Link…
                                    </>
                                ) : (
                                    <>
                                        <FaPaperPlane className="me-2" />
                                        Send Reset Link
                                    </>
                                )}
                            </button>

                            <div className="text-center mt-3">
                                <Link to="/login" className="auth-text-button">
                                    Remember your password? Sign In
                                </Link>
                            </div>
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

export default ForgotPasswordPage;

