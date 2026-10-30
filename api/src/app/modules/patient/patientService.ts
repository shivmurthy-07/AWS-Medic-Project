import httpStatus from "http-status";
import ApiError from "../../../errors/apiError";
import prisma from "../../../shared/prisma";
import { Prisma, UserRole } from "@prisma/client";
import bcrypt from 'bcrypt';
import { validateRegistrationPayload } from '../../../helpers/registrationValidation';

export const create = async (payload: any): Promise<any> => {
    payload = validateRegistrationPayload(payload);
    try {
        const data = await prisma.$transaction(async (tx) => {
            const { password, ...othersData } = payload;

            const normalizedEmail = othersData.email.trim().toLowerCase();
            const existEmail = await tx.auth.findUnique({ where: { email: normalizedEmail } });
            if (existEmail) {
                throw new ApiError(httpStatus.CONFLICT, "An account with this email already exists.");
            }

            othersData.email = normalizedEmail;
            const patient = await tx.patient.create({
                data: othersData,
            });

            if (patient) {
                const auth = await tx.auth.create({
                    data: {
                        email: patient.email,
                        password: await bcrypt.hash(password, 12),
                        role: UserRole.patient,
                        userId: patient.id
                    },
                });
                return {
                    patient,
                    auth,
                };
            }
        });

        return data;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new ApiError(httpStatus.CONFLICT, 'An account with this email already exists.');
        }
        throw error;
    }
};