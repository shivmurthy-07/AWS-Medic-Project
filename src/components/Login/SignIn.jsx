import React, { useState } from 'react';
import { FaEnvelope, FaEye, FaEyeSlash, FaLock } from 'react-icons/fa';
import { useForm } from 'react-hook-form';
import Spinner from 'react-bootstrap/Spinner';
import { useNavigate } from 'react-router-dom';
import { useResetPasswordMutation, useUserLoginMutation } from '../../redux/api/authApi';
import { message } from 'antd';
import { useMessageEffect } from '../../utils/messageSideEffect';

const SignIn = ({ handleResponse }) => {
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [infoError, setInfoError] = useState('');
    const { register, handleSubmit, formState: { errors } } = useForm();
    const navigate = useNavigate();
    const [userLogin, { isLoading }] = useUserLoginMutation();
    const [forgotEmail, setForgotEmail] = useState('');
    const [resetPassword, { isError: resetIsError, isSuccess: resetIsSuccess, error: resetError, isLoading: resetIsLoading }] = useResetPasswordMutation();

    const onSubmit = async (formData) => {
        setInfoError('');
        try {
            const result = await userLogin({ ...formData }).unwrap();
            message.success('Successfully Logged in');
            const role = result?.user?.role;
            if (role === 'super_admin') {
                navigate('/super-admin/dashboard', { replace: true });
            } else if (role === 'admin') {
                navigate('/admin/dashboard', { replace: true });
            } else if (role === 'doctor' || role === 'patient') {
                navigate('/dashboard', { replace: true });
            } else {
                throw new Error('Your account role could not be determined.');
            }
        } catch (err) {
            const msg = err?.data?.message || err?.message || 'Login failed';
            message.error(msg);
            setInfoError(typeof msg === 'string' ? msg : '');
        }
    };

    const onHandleForgotPassword = async (e) => {
        e.preventDefault();
        const result = await resetPassword({ email: forgotEmail });
        if (!result?.error) {
            setForgotEmail('');
            setShowForgotPassword(false);
        }
    };

    useMessageEffect(resetIsLoading, resetIsSuccess, resetIsError, resetError, 'Successfully Reset Password, Please check your Email!!');

    const handleShowForgotPassword = () => {
        setShowForgotPassword(!showForgotPassword);
    };

    return (
        <>
            {showForgotPassword ? (
                <form className="sign-in-form" onSubmit={onHandleForgotPassword}>
                    <h2 className="title">Forgot Password</h2>
                    <p className="auth-form-description">Enter your email and we’ll send instructions to reset your password.</p>
                    <div className="input-field">
                        <span className="fIcon"><FaEnvelope /></span>
                        <input
                            value={forgotEmail !== undefined && forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            placeholder="Enter Your Email"
                            type="email"
                            required
                        />
                    </div>
                    <button type="button" className="auth-text-button" onClick={handleShowForgotPassword}>
                        Remember your password? Sign in
                    </button>
                    <button className="iBtn" type="submit">
                        {resetIsLoading ? <Spinner animation="border" variant="info" /> : 'Submit'}
                    </button>
                </form>
            ) : (
                <form className="sign-in-form" onSubmit={handleSubmit(onSubmit)}>
                    <div className="auth-form-heading">
                        <span className="auth-eyebrow">WELCOME BACK</span>
                        <h2 className="title">Sign in to your account</h2>
                        <p className="auth-form-description">Your care dashboard is just a step away.</p>
                    </div>
                    <div className="input-field">
                        <span className="fIcon"><FaEnvelope /></span>
                        <input {...register('email', { required: true })} placeholder="Email address" type="email" autoComplete="email" aria-label="Email address" />
                    </div>
                    {errors.email && <span className="auth-field-error">Enter your email address.</span>}
                    <div className="input-field">
                        <span className="fIcon"><FaLock /></span>
                        <input {...register('password', { required: true })} type={showPassword ? 'text' : 'password'} placeholder="Password" autoComplete="current-password" aria-label="Password" />
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
                    {errors.password && <span className="auth-field-error">Enter your password.</span>}
                    {infoError && <p className="auth-login-error" role="alert">{infoError}</p>}
                    <button type="button" className="auth-text-button auth-forgot-link" onClick={handleShowForgotPassword}>
                        Forgot password?
                    </button>
                    <button className="iBtn" type="submit" disabled={isLoading}>
                        {isLoading ? <Spinner animation="border" variant="info" /> : 'Sign In'}
                    </button>
                </form>
            )}
        </>
    );
};

export default SignIn;
