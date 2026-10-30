import { NextFunction, Request, Response } from "express";
import ApiError from "../../errors/apiError";
import { JwtHelper } from "../../helpers/jwtHelper";
import config from "../../config";
import { Secret } from "jsonwebtoken";
import { getTokenFromAuthorization } from "../../helpers/jwtHelper";
import prisma from "../../shared/prisma";
import { getDoctorProfileProgress } from "../../helpers/doctorProfileCompletion";

export const auth = (...rules: string[]) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = getTokenFromAuthorization(req.headers.authorization);
        if (!token) {
            throw new ApiError(401, "Authentication token is required.")
        }
        let verifiedUser: ReturnType<typeof JwtHelper.verifyToken>;
        try {
            verifiedUser = await JwtHelper.verifyToken(token, config.jwt.secret as Secret);
        } catch (error) {
            throw new ApiError(401, "Authentication token is invalid or expired.")
        }
        req.user = verifiedUser;

        if (rules.length && !rules.includes(verifiedUser.role)) {
            throw new ApiError(403, "You are not Authorised !!")
        }
        const account = typeof verifiedUser.email === 'string'
            ? await prisma.auth.findUnique({
                where: { email: verifiedUser.email.toLowerCase() },
                select: { role: true, userId: true },
            })
            : null;
        if (
            !account ||
            account.role !== verifiedUser.role ||
            account.userId !== (typeof verifiedUser.userId === 'string' ? verifiedUser.userId : null)
        ) {
            throw new ApiError(403, 'Account access has changed. Sign in again.');
        }
        if (verifiedUser.role === 'doctor') {
            const doctor = verifiedUser.userId
                ? await prisma.doctor.findUnique({ where: { id: verifiedUser.userId } })
                : null;
            if (!doctor || doctor.approvalStatus !== 'APPROVED') {
                throw new ApiError(403, "This doctor account is not approved or is no longer active.");
            }
        }
        if (verifiedUser.role === 'patient') {
            const patient = verifiedUser.userId
                ? await prisma.patient.findUnique({
                    where: { id: verifiedUser.userId },
                    select: { isActive: true },
                })
                : null;
            if (patient && patient.isActive === false) {
                throw new ApiError(403, "This patient account is inactive.");
            }
        }
        next();
    } catch (error) {
        next(error)
    }
}

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
    const token = getTokenFromAuthorization(req.headers.authorization);
    if (!token) {
        return next();
    }
    let verifiedUser;
    try {
        verifiedUser = await JwtHelper.verifyToken(token, config.jwt.secret as Secret);
    } catch {
        return next(new ApiError(401, "Authentication token is invalid or expired."));
    }

    try {
        const account = typeof verifiedUser.email === 'string'
            ? await prisma.auth.findUnique({
                where: { email: verifiedUser.email.toLowerCase() },
                select: { role: true, userId: true },
            })
            : null;
        if (
            !account ||
            account.role !== verifiedUser.role ||
            account.userId !== (typeof verifiedUser.userId === 'string' ? verifiedUser.userId : null)
        ) {
            throw new ApiError(403, 'Account access has changed. Sign in again.');
        }
        if (verifiedUser.role === 'patient') {
            const patient = verifiedUser.userId
                ? await prisma.patient.findUnique({
                    where: { id: verifiedUser.userId },
                    select: { isActive: true },
                })
                : null;
            if (patient && patient.isActive === false) {
                throw new ApiError(403, 'This patient account is inactive.');
            }
        }
        req.user = verifiedUser;
        return next();
    } catch (error) {
        return next(error);
    }
};

export const ownerOrAdmin = (parameterName = 'id') =>
    (req: Request, res: Response, next: NextFunction) => {
        if (req.user?.role === 'admin' || req.user?.userId === req.params[parameterName]) {
            return next();
        }
        return next(new ApiError(403, "You are not authorised to access this account."));
    };