import React, { useState } from 'react';
import {
    FaArrowRight,
    FaCalendarCheck,
    FaFileMedicalAlt,
    FaHeartbeat,
    FaShieldAlt,
    FaStethoscope,
    FaUserMd,
} from 'react-icons/fa';
import { Link, useSearchParams } from 'react-router-dom';
import SignIn from './SignIn';
import './SignInForm.css';
import SignUp from './SignUp';

const SignInForm = () => {
    const [searchParams] = useSearchParams();
    const [isSignUp, setSignUp] = useState(() => searchParams.get('mode') === 'signup');
    const [accountType, setAccountType] = useState('patient');

    return (
        <main className="signin-signup-container">
            <section className="auth-brand-panel" aria-label="About MediConnect">
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
                    <span>MediConnect</span>
                </Link>
                <span className="auth-brand__mobile-note"><FaStethoscope /> Care, connected</span>
                <div className="auth-brand__content">
                    <span className="auth-eyebrow"><FaShieldAlt /> CARE THAT CONNECTS</span>
                    <h1>Your health journey, <span>all in one place.</span></h1>
                    <p>Book trusted doctors, manage appointments, and keep your care organized with a team that puts you first.</p>
                    <div className="auth-trust-card">
                        <div className="auth-trust-card__icon"><FaUserMd /></div>
                        <div>
                            <strong>Care, made simpler</strong>
                            <span>Find the right support for every step.</span>
                        </div>
                        <FaArrowRight className="auth-trust-card__arrow" />
                    </div>
                    <div className="auth-medical-highlights" aria-label="Healthcare features">
                        <span><FaCalendarCheck /> Doctor visits</span>
                        <span><FaFileMedicalAlt /> Care records</span>
                    </div>
                    <svg className="auth-ecg" viewBox="0 0 460 72" fill="none" aria-hidden="true">
                        <path d="M2 39h105l15-1 11-2 10 5 12-2h31l13-1 10 2h24l12-1 12-34 16 62 17-44 13 17 14-1h27l12-3 10 5 13-2h101" />
                        <circle cx="234" cy="39" r="3" />
                    </svg>
                </div>
                <div className="auth-brand__footer">
                    <span>Thoughtful care. Confident living.</span>
                    <span>© MediConnect</span>
                </div>
            </section>
            <section className="auth-form-panel">
                <Link to="/" className="auth-back-link"><span aria-hidden="true">←</span> Back to home</Link>
                <div className="auth-card">
                    <div className="auth-tabs" role="tablist" aria-label="Account access">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={!isSignUp}
                            className={!isSignUp ? 'is-active' : ''}
                            onClick={() => setSignUp(false)}
                        >
                            Sign in
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={isSignUp}
                            className={isSignUp ? 'is-active' : ''}
                            onClick={() => setSignUp(true)}
                        >
                            Create account
                        </button>
                    </div>
                    <div className={`auth-form-content ${isSignUp ? 'auth-form-content--signup' : ''}`}>
                        {isSignUp ? (
                            <SignUp
                                setSignUp={setSignUp}
                                userType={accountType}
                                onUserTypeChange={setAccountType}
                            />
                        ) : (
                            <SignIn />
                        )}
                    </div>
                    <div className="auth-admin-link">
                        <FaShieldAlt />
                        <span>Platform administrator?</span>
                        <Link to="/super-admin/login">Super Admin sign in</Link>
                    </div>
                </div>
                <p className="auth-privacy-note"><FaShieldAlt /> Your information is protected and handled securely.</p>
            </section>
        </main>
    );
};

export default SignInForm;