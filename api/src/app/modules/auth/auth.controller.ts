import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { AuthService } from "./auth.service";
import config from "../../../config";
import path from 'path';
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/apiError";
import httpStatus from "http-status";
import moment from "moment";
import bcrypt from "bcrypt";
import { auth } from "../../middlewares/auth";
import { AuthUser } from "../../../enums";
import { validatePayload, uuidSchema } from "../../../helpers/validation";

const Login = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.loginUser(req.body);
    const { accessToken } = result;

    const cookieOptions = {
        secure: config.env === 'production',
        httpOnly: true
    }
    res.cookie('accessToken', accessToken, cookieOptions)
    sendResponse(res, {
        statusCode: 200,
        message: 'Successfully Logged !!',
        success: true,
        data: result,
    })
})
const resetPassword = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.resetPassword(req.body);
    sendResponse(res, {
        statusCode: 200,
        message: 'Successfully Passwrod Reset!!',
        success: true,
        data: result,
    })
})

const PasswordResetConfirm = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.PassworResetConfirm(req.body);
    sendResponse(res, {
        statusCode: 200,
        message: 'Successfully Passwrod Changed!!',
        success: true,
        data: result,
    })
})

const Logout = catchAsync(async (req: Request, res: Response) => {
    if (req.user?.role === AuthUser.SUPER_ADMIN) {
        await prisma.activityLog.create({
            data: {
                actorId: typeof req.user.authId === 'string' ? req.user.authId : null,
                actorEmail: typeof req.user.email === 'string' ? req.user.email : 'unknown',
                action: 'super_admin.logout',
                entityType: 'auth',
                entityId: typeof req.user.authId === 'string' ? req.user.authId : undefined,
            },
        });
    }
    res.clearCookie('accessToken');
    sendResponse(res, { statusCode: 200, message: 'Logged out.', success: true });
});

const VerifyUser = catchAsync(async (req: Request, res: Response) => {
    const userId = validatePayload(uuidSchema, req.params.userId);
    const uniqueString = req.params.uniqueString;
    if (!uniqueString || uniqueString.length > 500) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Verification link is invalid.');
    }
    const isUserExist = await prisma.doctor.findUnique({
        where: {
            id: userId
        }
    })
    if (!isUserExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "User is not found !!");
    }
    const getVerficationUser = await prisma.userVerfication.findFirst({
        where: {
            userId: userId
        }
    })
    const isValidToken = Boolean(
        getVerficationUser?.uniqueString &&
        await bcrypt.compare(uniqueString, getVerficationUser.uniqueString)
    );
    if (!getVerficationUser || !isValidToken) {
        res.redirect('/api/v1/auth/expired/link');
        return;
    }

    const expiresAt = moment(getVerficationUser.expiresAt);
    if (!expiresAt.isAfter(moment())) {
        res.redirect('/api/v1/auth/expired/link');
        return;
    }

    await prisma.$transaction(async (tx) => {
        await tx.doctor.update({
            where: { id: isUserExist.id },
            data: { verified: true }
        });
        await tx.userVerfication.delete({
            where: { id: getVerficationUser.id }
        });
    });
    res.redirect('/api/v1/auth/verified');
})

const Verified = catchAsync(async (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "../../../../template/verfied.html"))
})

const VerficationExpired = catchAsync(async (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "../../../../template/expiredVarification.html"))
})

const changePassword = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.changePassword(req.user, req.body);
    sendResponse(res, {
        statusCode: 200,
        message: 'Password changed successfully.',
        success: true,
        data: result,
    });
});

export const AuthController = {
    Login,
    VerifyUser,
    Verified,
    VerficationExpired,
    resetPassword,
    PasswordResetConfirm,
    Logout,
    changePassword,
};