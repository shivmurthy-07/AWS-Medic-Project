import React, { useEffect, useState } from 'react';
import { FaCheck, FaEnvelope, FaEye, FaEyeSlash, FaLock, FaTimes, FaUser } from 'react-icons/fa';
import Spinner from 'react-bootstrap/Spinner'
import swal from 'sweetalert';
import { useDoctorSignUpMutation, usePatientSignUpMutation } from '../../redux/api/authApi';
import { message } from 'antd';
import { doctorSpecialistOptions } from '../../constant/global';

// password regex
// ^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$
// At least one upper case English letter, (?=.*?[A-Z])
// At least one lower case English letter, (?=.*?[a-z])
// At least one digit, (?=.*?[0-9])
// At least one special character, (?=.*?[#?!@$%^&*-])
// Minimum eight in length .{8,} (with the anchors)

const getRegistrationErrorMessage = (error, accountType) => {
    const responseData = error?.data;
    const responseMessage = typeof responseData === 'string'
        ? responseData
        : responseData?.message || responseData?.error?.message || error?.error;

    if (typeof responseMessage === 'string' && responseMessage.trim()) {
        return responseMessage;
    }

    if (error?.status === 'FETCH_ERROR' || error?.status === 'TIMEOUT_ERROR' || !error?.status) {
        return 'Unable to reach the server. Please start the API and try again.';
    }

    return `${accountType} registration failed (HTTP ${error.status}). Please try again.`;
};

const SignUp = ({ setSignUp, userType = 'patient', onUserTypeChange }) => {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [localUserType, setLocalUserType] = useState(userType);
    const selectedUserType = onUserTypeChange ? userType : localUserType;
    const formField = {
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        specialization: '',
    }
    const [user, setUser] = useState(formField)
    const namePattern = /^[\p{L}\p{M}]+(?:[ '-][\p{L}\p{M}]+)*$/u;
    const isValidName = (value) => value.trim().length <= 80 && namePattern.test(value.trim());
    const [doctorSignUp, { data: dData, isSuccess: dIsSuccess, isError: dIsError, error: dError, isLoading: dIsLoading }] = useDoctorSignUpMutation();
    const [patientSignUp, { data: pData, isSuccess: pIsSuccess, isError: pIsError, error: pError, isLoading: pIsLoading }] = usePatientSignUpMutation();
    const [passwordValidation, setPasswordValidation] = useState({
        carLength: false,
        specailChar: false,
        upperLowerCase: false,
        numeric: false
    })

    const handleSignUpSuccess = () => {
        setLoading(false);
        setUser({ ...formField });
        setPasswordValidation({
            carLength: false,
            specailChar: false,
            upperLowerCase: false,
            numeric: false
        });
        setEmailError({ emailError: false });
    }
    useEffect(() => {
        // doctor account
        if (dIsError && dError) {
            message.error(getRegistrationErrorMessage(dError, 'Doctor'));
            setLoading(false);
        }

        if (!dIsError && dIsSuccess) {
            handleSignUpSuccess();
            swal({
                icon: 'success',
                text: 'Registration Successful! Your account is waiting for Super Admin approval. You will be able to log in after your account is approved.',
                timer: 5000
            })
        }

        // Patient account
        if (pIsError && pError) {
            message.error(getRegistrationErrorMessage(pError, 'Patient'));
            setLoading(false);
        }
        if (!pIsError && pIsSuccess) {
            handleSignUpSuccess();
            setSignUp(false);
            swal({
                icon: 'success',
                text: `Successfully ${selectedUserType === 'doctor' ? 'Doctor' : 'Patient'} Account Created Please Login`,
                timer: 2000
            })
        }

    }, [dIsError, dError, pError, pIsError, pIsLoading, dIsLoading, pData, dData, pIsSuccess, dIsSuccess, selectedUserType, setSignUp])

    const [emailError, setEmailError] = useState({
        emailError: false
    })

    const handleEmailError = (name, value) => {
        if (name === 'email') {
            setEmailError({
                emailError: value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
            })
        }
    }
    const hanldeValidation = (name, value) => {
        if (name === 'password') {
            setPasswordValidation({
                carLength: (value.length >= 8 && value.length <= 128 && value.trim().length > 0),
                specailChar: /[ `!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(value),
                upperLowerCase: /^(?=.*[a-z])(?=.*[A-Z])/.test(value),
                numeric: /^(?=.*\d)/.test(value),
            })
        }
    }

    const hanldeOnChange = (e) => {
        let { name, value } = e.target;
        hanldeValidation(name, value)
        handleEmailError(name, value)
        setUser((currentUser) => ({ ...currentUser, [name]: value }));
    }

    const handleUserTypeChange = (e) => {
        const nextUserType = e.target.value;
        setLocalUserType(nextUserType);
        onUserTypeChange?.(nextUserType);
    }
    const hanldeOnSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        if (selectedUserType === "doctor") {
            doctorSignUp(user);
        } else {
            const { firstName, lastName, email, password } = user;
            patientSignUp({ firstName, lastName, email, password })
        }
    }

    return (
        <form className="sign-up-form" onSubmit={hanldeOnSubmit}>
            <div className="auth-form-heading">
                <span className="auth-eyebrow">GET STARTED</span>
                <h2 className="title">Create your account</h2>
                <p className="auth-form-description">A more connected healthcare experience starts here.</p>
            </div>
            <p className="auth-signup-note">
                {selectedUserType === 'doctor'
                    ? 'Doctor accounts require Super Admin approval before sign-in.'
                    : 'Create a patient account to book appointments and manage your care.'}
            </p>
            <div className="input-field">
                <span className="fIcon"><FaUser /></span>
                <input placeholder="First name" name="firstName" type="text" autoComplete="given-name" maxLength={80} required onChange={(e) => hanldeOnChange(e)} value={user.firstName} aria-invalid={Boolean(user.firstName && !isValidName(user.firstName))} />
                {user.firstName && !isValidName(user.firstName) && <small role="alert">Name must contain valid letters, spaces, hyphens, or apostrophes.</small>}
            </div>
            <div className="input-field">
                <span className="fIcon"><FaUser /></span>
                <input placeholder="Last name" name="lastName" type="text" autoComplete="family-name" maxLength={80} required onChange={(e) => hanldeOnChange(e)} value={user.lastName} aria-invalid={Boolean(user.lastName && !isValidName(user.lastName))} />
                {user.lastName && !isValidName(user.lastName) && <small role="alert">Name must contain valid letters, spaces, hyphens, or apostrophes.</small>}
            </div>
            <div className="input-field">
                <span className="fIcon"><FaEnvelope /></span>
                <input placeholder="Email address" name="email" type="email" autoComplete="email" maxLength={254} required onChange={(e) => hanldeOnChange(e)} value={user.email} aria-label="Email address" aria-invalid={Boolean(user.email && !emailError.emailError)} />
            </div>
            <div className="input-field">
                <span className="fIcon"><FaLock /></span>
                <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Create a password" autoComplete="new-password" minLength={8} maxLength={128} required onChange={(e) => hanldeOnChange(e)} value={user.password} aria-label="Create a password" />
                <button
                    type="button"
                    className="auth-password-toggle"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((visible) => !visible)}
                >
                    {showPassword ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
                </button>
            </div>
            <label className="auth-role-label" htmlFor="signup-role">I am registering as</label>
            <div className="auth-role-select">
                <select
                    id="signup-role"
                    aria-label="Account type"
                    onChange={(e) => handleUserTypeChange(e)}
                    value={selectedUserType}
                >
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                </select>
            </div>
            {selectedUserType === 'doctor' && (
                <>
                    <label className="auth-role-label" htmlFor="signup-specialization">Specialization</label>
                    <div className="auth-role-select">
                        <select
                            id="signup-specialization"
                            name="specialization"
                            aria-label="Specialization"
                            required
                            onChange={hanldeOnChange}
                            value={user.specialization}
                        >
                            <option value="">Select a specialization</option>
                            {doctorSpecialistOptions.map(({ value, label }) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>
                </>
            )}
            <button type="submit"
                className="iBtn"
                disabled={loading || !isValidName(user.firstName) || !isValidName(user.lastName) || !passwordValidation.carLength || !passwordValidation.numeric || !passwordValidation.upperLowerCase || !passwordValidation.specailChar || !emailError.emailError || (selectedUserType === 'doctor' && !user.specialization)}
            >
                {loading ? <Spinner animation="border" variant="info" /> : "Sign Up"}
            </button>

            <div className="password-validatity">

                <div style={emailError.emailError ? { color: "green" } : { color: "red" }}>
                    <p>{emailError.emailError ? <FaCheck /> : <FaTimes />}
                        <span className="ms-2">Must Have Valid Email.</span></p>
                </div>

                <div style={passwordValidation.carLength ? { color: "green" } : { color: "red" }}>
                    <p>{passwordValidation.carLength ? <FaCheck /> : <FaTimes />}
                        <span className="ms-2">Password must have at least 8 characters.</span></p>
                </div>

                <div style={passwordValidation.specailChar ? { color: "green" } : { color: "red" }}>
                    <p>{passwordValidation.specailChar ? <FaCheck /> : <FaTimes />}
                        <span className="ms-2">Password must include a symbol.</span></p>
                </div>

                <div style={passwordValidation.upperLowerCase ? { color: "green" } : { color: "red" }}>
                    <p>{passwordValidation.upperLowerCase ? <FaCheck /> : <FaTimes />}
                        <span className="ms-2">Password must include uppercase and lowercase letters.</span></p>
                </div>

                <div style={passwordValidation.numeric ? { color: "green" } : { color: "red" }}>
                    <p>{passwordValidation.numeric ? <FaCheck /> : <FaTimes />}
                        <span className="ms-2">Password must include a number.</span></p>
                </div>
            </div>

        </form>

    );
};

export default SignUp;