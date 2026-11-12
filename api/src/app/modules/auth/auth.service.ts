import bcrypt from 'bcrypt';
import prisma from "../../../shared/prisma";
import ApiError from '../../../errors/apiError';
import httpStatus from 'http-status';
import { JwtHelper } from '../../../helpers/jwtHelper';
import config from '../../../config';
import { Secret } from 'jsonwebtoken';
import moment from 'moment';
import crypto from 'crypto';
import fs from 'fs';
import { EmailtTransporter } from '../../../helpers/emailTransporter';
import { validatePayload } from '../../../helpers/validation';
import {
    loginSchema,
    passwordResetConfirmSchema,
    resetPasswordSchema,
    forgotPasswordSchema,
    validateResetTokenSchema,
    resetPasswordWithTokenSchema
} from './auth.validation';
const { v4: uuidv4 } = require('uuid');
import * as path from 'path';

type ILginResponse = {
    accessToken?: string;
    user: {}
}

const loginUser = async (user: any): Promise<ILginResponse> => {
    const { email: IEmail, password } = validatePayload(loginSchema, user);
    const isUserExist = await prisma.auth.findUnique({
        where: { email: IEmail.trim().toLowerCase() }
    })

    if (!isUserExist) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Email or password is incorrect.");
    }

    const isPasswordMatched = await bcrypt.compare(password, isUserExist.password);
    if (!isPasswordMatched) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Email or password is incorrect.");
    }

    if (isUserExist.role === 'doctor') {
        const doctor = isUserExist.userId
            ? await prisma.doctor.findUnique({ where: { id: isUserExist.userId } })
            : null;
        if (!doctor) {
            throw new ApiError(httpStatus.FORBIDDEN, "Doctor account could not be found.");
        }
        if (doctor.approvalStatus === 'PENDING') {
            throw new ApiError(httpStatus.FORBIDDEN, "Your account is awaiting Super Admin approval.");
        }
        if (doctor.approvalStatus === 'REJECTED') {
            throw new ApiError(httpStatus.FORBIDDEN, doctor.rejectionReason
                ? `Your doctor application was rejected: ${doctor.rejectionReason}`
                : "Your doctor application was rejected.");
        }
        if (doctor.approvalStatus === 'SUSPENDED') {
            throw new ApiError(httpStatus.FORBIDDEN, "Your doctor account is suspended. Contact platform support.");
        }
    }
    if (isUserExist.role === 'patient' && isUserExist.userId) {
        const patient = await prisma.patient.findUnique({
            where: { id: isUserExist.userId },
            select: { isActive: true },
        });
        if (!patient || !patient.isActive) {
            throw new ApiError(httpStatus.FORBIDDEN, "Your patient account is inactive.");
        }
    }
    const { role, userId, isDemo, email } = isUserExist;
    if (role === 'super_admin') {
        await prisma.activityLog.create({
            data: {
                actorId: isUserExist.id,
                actorEmail: email,
                action: 'super_admin.login',
                entityType: 'auth',
                entityId: isUserExist.id,
            },
        });
    }
    const accessToken = JwtHelper.createToken(
        { role, userId, email, ...(role === 'super_admin' ? { authId: isUserExist.id } : {}), isDemo: role === 'admin' ? Boolean(isDemo) : false },
        config.jwt.secret as Secret,
        config.jwt.JWT_EXPIRES_IN as string
    )
    return {
        accessToken,
        user: { role, userId, email, isDemo: role === 'admin' ? Boolean(isDemo) : false },
    }
}

const VerificationUser = async (user: any): Promise<ILginResponse> => {
    const { email: IEmail, password } = user;
    const isUserExist = await prisma.auth.findUnique({
        where: { email: IEmail }
    })

    if (!isUserExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "User is not Exist !");
    }
    const isPasswordMatched = await bcrypt.compare(password, isUserExist.password);

    if (!isPasswordMatched) {
        throw new ApiError(httpStatus.NOT_FOUND, "Password is not Matched !");
    }
    const { role, userId, isDemo, email } = isUserExist;
    const accessToken = JwtHelper.createToken(
        { role, userId, email, isDemo: role === 'admin' ? Boolean(isDemo) : false },
        config.jwt.secret as Secret,
        config.jwt.JWT_EXPIRES_IN as string
    )
    return {
        accessToken,
        user: { role, userId, email, isDemo: role === 'admin' ? Boolean(isDemo) : false },
    }
}

const forgotPassword = async (payload: any): Promise<{ message: string; emailSent?: boolean; resetLink?: string; emailErrorMessage?: string }> => {
    const { email } = validatePayload(forgotPasswordSchema, payload);

    const isUserExist = await prisma.auth.findUnique({
        where: { email: email.toLowerCase() }
    });

    if (!isUserExist) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            'This email is not registered with any account. Please check your email or create an account.'
        );
    }

    // Generate cryptographically secure random token (64 hex characters)
    const rawToken = crypto.randomBytes(32).toString('hex');

    // Store only hashed token in database (SHA-256)
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Token expires in exactly 15 minutes
    const expiresAt = moment().add(15, 'minutes').toDate();

    const frontendBaseUrl = (config.frontendUrl || config.clientUrl || 'http://localhost:3000').replace(/\/+$/, '');
    const resetLink = `${frontendBaseUrl}/reset-password?token=${rawToken}`;

    // Look up display name for personal greeting in email
    let recipientName = '';
    try {
        if (isUserExist.role === 'doctor' && isUserExist.userId) {
            const doc = await prisma.doctor.findUnique({ where: { id: isUserExist.userId } });
            if (doc?.firstName) {
                recipientName = `Dr. ${[doc.firstName, doc.lastName].filter(Boolean).join(' ')}`;
            }
        } else if (isUserExist.role === 'patient' && isUserExist.userId) {
            const pat = await prisma.patient.findUnique({ where: { id: isUserExist.userId } });
            if (pat?.firstName) {
                recipientName = [pat.firstName, pat.lastName].filter(Boolean).join(' ');
            }
        }
    } catch {
        // Fallback to generic greeting
    }

    await prisma.$transaction(async (tx) => {
        // Invalidate any existing/previous tokens for this user
        await tx.forgotPassword.deleteMany({
            where: { userId: isUserExist.id }
        });

        // Store hashed token with 15-minute expiry
        await tx.forgotPassword.create({
            data: {
                userId: isUserExist.id,
                uniqueString: hashedToken,
                expiresAt: expiresAt
            }
        });
    });

    // Send email via Gmail SMTP
    const pathName = path.join(__dirname, '../../../../template/resetPassword.html');
    const templatePath = fs.existsSync(pathName)
        ? pathName
        : path.join(process.cwd(), 'template/resetPassword.html');

    const obj = {
        name: recipientName,
        link: resetLink,
        appName: 'AWS Medic'
    };
    const subject = 'Reset Your AWS Medic Account Password';
    const toMail = isUserExist.email;

    let emailSent = false;
    let emailErrorMessage = '';
    try {
        await EmailtTransporter({ pathName: templatePath, replacementObj: obj, toMail, subject });
        emailSent = true;
    } catch (error: any) {
        emailSent = false;
        emailErrorMessage = error?.message || 'SMTP delivery failed';
        console.error('Password reset email delivery failed:', emailErrorMessage);
        // Log development/testing link for easy verification when testing locally
        console.log(`[TEST/DEV RESET LINK] ${isUserExist.email} -> ${resetLink}`);
    }

    return {
        message: emailSent
            ? 'Password reset link sent to your registered email. Please check your inbox.'
            : 'Password reset link generated successfully.',
        emailSent,
        resetLink,
        emailErrorMessage: !emailSent ? emailErrorMessage : undefined
    };
};

const validateResetToken = async (payload: any): Promise<{ valid: boolean; message: string }> => {
    const { token } = validatePayload(validateResetTokenSchema, payload);
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const record = await prisma.forgotPassword.findFirst({
        where: { uniqueString: hashedToken }
    });

    if (!record) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired password reset link.');
    }

    if (!record.expiresAt || moment(record.expiresAt).isBefore(moment())) {
        await prisma.forgotPassword.delete({ where: { id: record.id } }).catch(() => {});
        throw new ApiError(httpStatus.BAD_REQUEST, 'Password reset link has expired. Please request a new one.');
    }

    const user = await prisma.auth.findUnique({
        where: { id: record.userId }
    });

    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User associated with this reset link was not found.');
    }

    return {
        valid: true,
        message: 'Token is valid.'
    };
};

const resetPasswordWithToken = async (payload: any): Promise<{ message: string }> => {
    const { token, password } = validatePayload(resetPasswordWithTokenSchema, payload);
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const record = await prisma.forgotPassword.findFirst({
        where: { uniqueString: hashedToken }
    });

    if (!record) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired password reset link.');
    }

    if (!record.expiresAt || moment(record.expiresAt).isBefore(moment())) {
        await prisma.forgotPassword.delete({ where: { id: record.id } }).catch(() => {});
        throw new ApiError(httpStatus.BAD_REQUEST, 'Password reset link has expired. Please request a new one.');
    }

    const user = await prisma.auth.findUnique({
        where: { id: record.userId }
    });

    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User associated with this reset link was not found.');
    }

    const newHashedPassword = await bcrypt.hash(password, 12);

    await prisma.$transaction(async (tx) => {
        // Update user password only - never touch user role or doctor approval status
        await tx.auth.update({
            where: { id: record.userId },
            data: { password: newHashedPassword }
        });

        // Invalidate token immediately so it can only be used once
        await tx.forgotPassword.deleteMany({
            where: { userId: record.userId }
        });
    });

    return {
        message: 'Your password has been reset successfully. You can now log in using your new password.'
    };
};

const resetPassword = async (payload: any): Promise<{ message: string }> => {
    // If payload contains token & password, perform token-based reset
    if (payload?.token && payload?.password) {
        return resetPasswordWithToken(payload);
    }
    // If payload contains email, perform forgot password request
    return forgotPassword(payload);
};

const PassworResetConfirm = async (payload: any): Promise<any> => {
    if (payload?.token && payload?.password) {
        return resetPasswordWithToken(payload);
    }

    const { userId, uniqueString, password } = validatePayload(passwordResetConfirmSchema, payload);

    await prisma.$transaction(async (tx) => {
        const isUserExist = await tx.auth.findUnique({
            where: { id: userId }
        });

        if (!isUserExist) {
            throw new ApiError(httpStatus.NOT_FOUND, "User is not Exist !");
        }

        const resetLink = `${config.clientUrl}/reset-password/${isUserExist.id}/${uniqueString}`;
        const getForgotRequest = await tx.forgotPassword.findFirst({
            where: {
                userId: userId as string,
                uniqueString: resetLink
            }
        });

        if (!getForgotRequest) {
            throw new ApiError(httpStatus.NOT_FOUND, "Forgot Request was not found or Invalid !");
        }

        const expiresAt = moment(getForgotRequest.expiresAt);
        const currentTime = moment();
        if (expiresAt.isBefore(currentTime)) {
            throw new ApiError(httpStatus.NOT_FOUND, "Forgot Request has been expired !");
        } else {
            await tx.auth.update({
                where: {
                    id: userId
                },
                data: {
                    password: await bcrypt.hash(password, 12)
                }
            });
            await tx.forgotPassword.delete({
                where: {
                    id: getForgotRequest.id
                }
            });
        }
    });
    return {
        message: "Your password has been reset successfully. You can now log in using your new password."
    };
};

const changePassword = async (user: any, payload: any): Promise<{ message: string }> => {
    const rawOldPassword = payload?.oldPassword ?? payload?.currentPassword;
    const rawNewPassword = payload?.newPassword;
    if (
        typeof rawOldPassword !== 'string' ||
        typeof rawNewPassword !== 'string' ||
        !rawOldPassword.trim() ||
        !rawNewPassword.trim()
    ) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Please provide both current and new password.');
    }
    if (rawNewPassword.length < 8 || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(rawNewPassword)) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            'New password must be at least 8 characters and include uppercase, lowercase, and a number.'
        );
    }
    if (!user?.email) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Authenticated user email not found.');
    }
    const isUserExist = await prisma.auth.findUnique({
        where: { email: user.email.toLowerCase() }
    });
    if (!isUserExist) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found.');
    }
    const isPasswordMatched = await bcrypt.compare(rawOldPassword, isUserExist.password);
    if (!isPasswordMatched) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Current password does not match.');
    }
    const hashedPassword = await bcrypt.hash(rawNewPassword, 12);
    await prisma.auth.update({
        where: { id: isUserExist.id },
        data: { password: hashedPassword }
    });
    return {
        message: 'Password changed successfully.'
    };
};

export const AuthService = {
    loginUser,
    VerificationUser,
    forgotPassword,
    validateResetToken,
    resetPasswordWithToken,
    resetPassword,
    PassworResetConfirm,
    changePassword,
}