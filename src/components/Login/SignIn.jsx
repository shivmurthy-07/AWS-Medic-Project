import React, { useState } from 'react';
import { FaEnvelope, FaEye, FaEyeSlash, FaLock } from 'react-icons/fa';
import { useForm } from 'react-hook-form';
import Spinner from 'react-bootstrap/Spinner';
import { Link, useNavigate } from 'react-router-dom';
import { useUserLoginMutation } from '../../redux/api/authApi';
import { message } from 'antd';

const SignIn = ({ handleResponse }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [infoError, setInfoError] = useState('');
    const { register, handleSubmit, formState: { errors } } = useForm();
    const navigate = useNavigate();
    const [userLogin, { isLoading }] = useUserLoginMutation();

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

    return (
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
            <Link to="/forgot-password" className="auth-text-button auth-forgot-link">
                Forgot password?
            </Link>
            <button className="iBtn" type="submit" disabled={isLoading}>
                {isLoading ? <Spinner animation="border" variant="info" /> : 'Sign In'}
            </button>
        </form>
    );
};

export default SignIn;
