import bcrypt from 'bcrypt';
import prisma from "../../../shared/prisma";
import ApiError from '../../../errors/apiError';
import httpStatus from 'http-status';
import { JwtHelper } from '../../../helpers/jwtHelper';
import config from '../../../config';
import { Secret } from 'jsonwebtoken';
import moment from 'moment';
import { EmailtTransporter } from '../../../helpers/emailTransporter';
import { validatePayload } from '../../../helpers/validation';
import { loginSchema, passwordResetConfirmSchema, resetPasswordSchema } from './auth.validation';
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

const resetPassword = async (payload: any): Promise<{ message: string }> => {
    const { email } = validatePayload(resetPasswordSchema, payload);
    const genericResponse = { message: 'If an account exists for this email, password reset instructions will be sent.' };
    const isUserExist = await prisma.auth.findUnique({
        where: { email }
    })
    if (!isUserExist) {
        return genericResponse;
    }
    const clientUrl = `${config.clientUrl}/reset-password/`
    const uniqueString = uuidv4() + isUserExist.id;
    const uniqueStringHashed = await bcrypt.hashSync(uniqueString, 12);
    const encodedUniqueStringHashed = uniqueStringHashed.replace(/\//g, '-');

    const resetLink = clientUrl + isUserExist.id + '/' + encodedUniqueStringHashed;
    const currentTime = moment();
    const expiresTime = moment(currentTime).add(4, 'hours');

    await prisma.$transaction(async (tx) => {
        //Check if the forgotPassword record exists before attempting reset
        const existingForgotPassword = await tx.forgotPassword.findUnique({
            where: { id: isUserExist.id }
        });
        if (existingForgotPassword) {
            await tx.forgotPassword.delete({
                where: { id: isUserExist.id }
            })
        }

        const forgotPassword = await tx.forgotPassword.create({
            data: {
                userId: isUserExist.id,
                expiresAt: expiresTime.toDate(),
                uniqueString: resetLink
            }
        });
        
        if (forgotPassword) {
            const pathName = path.join(__dirname, '../../../../template/resetPassword.html')
            const obj = {
                link: resetLink
            };
            const subject = "Request to Reset Password";
            const toMail = isUserExist.email;
            try {
                await EmailtTransporter({ pathName, replacementObj: obj, toMail, subject })
            } catch (error) {
                console.log("Error reset password email", error);
                throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Unable to send reset email!")
            }
        }
        return forgotPassword;
    });


    return genericResponse;
}

const PassworResetConfirm = async (payload: any): Promise<any> => {
    const { userId, uniqueString, password } = validatePayload(passwordResetConfirmSchema, payload);

    await prisma.$transaction(async (tx) => {
        const isUserExist = await tx.auth.findUnique({
            where: { id: userId }
        });

        if (!isUserExist) { throw new ApiError(httpStatus.NOT_FOUND, "User is not Exist !") };
        const resetLink = `${config.clientUrl}/reset-password/${isUserExist.id}/${uniqueString}`
        const getForgotRequest = await tx.forgotPassword.findFirst({
            where: {
                userId: userId as string,
                uniqueString: resetLink
            }
        })
        if (!getForgotRequest) { throw new ApiError(httpStatus.NOT_FOUND, "Forgot Request was not found or Invalid !") };

        const expiresAt = moment(getForgotRequest.expiresAt);
        const currentTime = moment();
        if (expiresAt.isBefore(currentTime)) {
            throw new ApiError(httpStatus.NOT_FOUND, "Forgot Request has been expired !")
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
            })
        }
    });
    return {
        message: "Password Changed Successfully !!"
    }
}

const changePassword = async (user: any, payload: any): Promise<{ message: string }> => {
    const { oldPassword, newPassword } = payload || {};
    if (!oldPassword || !newPassword) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Please provide both current and new password.');
    }
    const isUserExist = await prisma.auth.findUnique({
        where: { email: user.email.toLowerCase() }
    });
    if (!isUserExist) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found.');
    }
    const isPasswordMatched = await bcrypt.compare(oldPassword, isUserExist.password);
    if (!isPasswordMatched) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Current password does not match.');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 12);
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
    resetPassword,
    PassworResetConfirm,
    changePassword,
}