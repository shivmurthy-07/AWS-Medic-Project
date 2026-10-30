import ApiError from '../errors/apiError';
import httpStatus from 'http-status';

export const isValidPassword = (password: unknown): password is string =>
    typeof password === 'string' &&
    password.length >= 8 &&
    password.length <= 128 &&
    password.trim().length > 0 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[ `!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(password);

const namePattern = /^[\p{L}\p{M}]+(?:[ '-][\p{L}\p{M}]+)*$/u;

export const validateRegistrationPayload = (payload: unknown) => {
    const data = payload && typeof payload === 'object' && !Array.isArray(payload)
        ? payload as Record<string, unknown>
        : {};
    const { email, password, firstName, lastName } = data;
    if (
        typeof firstName !== 'string' ||
        firstName.trim().length > 80 ||
        !namePattern.test(firstName.trim()) ||
        typeof lastName !== 'string' ||
        lastName.trim().length > 80 ||
        !namePattern.test(lastName.trim()) ||
        typeof email !== 'string' ||
        email.trim().length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
        !isValidPassword(password)
    ) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            'Provide valid first and last names, a valid email, and a password with 8 to 128 characters including uppercase, lowercase, a number, and a symbol.'
        );
    }

    const unexpectedFields = Object.keys(data).filter(
        (field) => !['firstName', 'lastName', 'email', 'password'].includes(field)
    );
    if (unexpectedFields.length > 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Registration contains unsupported fields.');
    }

    return {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
    };
};
