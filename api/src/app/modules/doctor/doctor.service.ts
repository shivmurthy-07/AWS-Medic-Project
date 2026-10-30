import { Doctor, UserRole } from "@prisma/client";
import prisma from "../../../shared/prisma";
import bcrypt from 'bcrypt';
import ApiError from "../../../errors/apiError";
import httpStatus from "http-status";
import { DoctorSearchableFields } from "./doctor.interface";
import calculatePagination from "../../../shared/paginationHelper";
import { IGenericResponse } from "../../../interfaces/common";
import { Request } from "express";
import { IUpload } from "../../../interfaces/file";
import { CloudinaryHelper } from "../../../helpers/uploadHelper";
import { uuidSchema, validatePayload } from "../../../helpers/validation";
import {
    doctorAwardSchema,
    doctorEducationSchema,
    doctorExperienceSchema,
    doctorFilterSchema,
    doctorPaginationSchema,
    doctorProfileUpdateSchema,
    doctorRegistrationSchema,
} from "./doctor.validation";
import { getDoctorProfileProgress } from "../../../helpers/doctorProfileCompletion";

const create = async (payload: unknown): Promise<any> => {
    const validatedPayload = validatePayload(doctorRegistrationSchema, payload);
    const normalizedEmail = validatedPayload.email;
    const existingAuth = await prisma.auth.findUnique({ where: { email: normalizedEmail } });
    if (existingAuth) {
        if (
            existingAuth.role === UserRole.doctor &&
            existingAuth.userId &&
            await bcrypt.compare(validatedPayload.password, existingAuth.password)
        ) {
            const existingDoctor = await prisma.doctor.findUnique({ where: { id: existingAuth.userId } });
            if (existingDoctor?.approvalStatus === 'REJECTED') {
                const { password: _password, ...resubmittedData } = validatedPayload;
                const resubmittedDoctor = await prisma.$transaction(async (tx) => {
                    const doctor = await tx.doctor.update({
                        where: { id: existingDoctor.id },
                        data: {
                            ...resubmittedData,
                            country: 'India',
                            approvalStatus: 'PENDING',
                            rejectionReason: null,
                            approvedAt: null,
                            approvedById: null,
                        },
                    });
                    await tx.activityLog.create({
                        data: {
                            actorEmail: doctor.email,
                            action: 'doctor.resubmitted',
                            entityType: 'doctor',
                            entityId: doctor.id,
                        },
                    });
                    return doctor;
                });
                return resubmittedDoctor;
            }
            if (existingDoctor?.approvalStatus === 'PENDING') {
                return existingDoctor;
            }
        }
        throw new ApiError(httpStatus.CONFLICT, "An account with this email already exists.");
    }

    const data = await prisma.$transaction(async (tx) => {
        const { password, ...othersData } = validatedPayload;
        othersData.email = normalizedEmail;
        othersData.country = 'India';
        const existEmail = await tx.auth.findUnique({ where: { email: othersData.email } });
        if (existEmail) {
            throw new ApiError(httpStatus.CONFLICT, "An account with this email already exists.");
        }
        const doctor = await tx.doctor.create({ data: othersData });
        await tx.auth.create({
            data: {
                email: doctor.email,
                password: await bcrypt.hash(password, 12),
                role: UserRole.doctor,
                userId: doctor.id
            },
        });
        await tx.activityLog.create({
            data: {
                actorEmail: doctor.email,
                action: 'doctor.registered',
                entityType: 'doctor',
                entityId: doctor.id,
            },
        });
        return doctor
    });

    return data;

}

const getAllDoctors = async (filters: unknown, options: unknown): Promise<IGenericResponse<Doctor[]>> => {
    const validatedFilters = validatePayload(doctorFilterSchema, filters);
    const validatedOptions = validatePayload(doctorPaginationSchema, options);
    const { limit, page, skip } = calculatePagination(validatedOptions);
    const { searchTerm, max, min, specialist, ...filterData } = validatedFilters;

    const andCondition = [];
    if (searchTerm) {
        andCondition.push({
            OR: DoctorSearchableFields.map((field) => ({
                [field]: {
                    contains: searchTerm,
                    mode: 'insensitive'
                }
            }))
        })
    }

    if (Object.keys(filterData).length > 0) {
        andCondition.push({
            AND: Object.entries(filterData).map(([key, value]) => ({
                [key]: { equals: value }
            }))
        })
    }

    if (min || max) {
        andCondition.push({
            AND: ({
                price: {
                    gte: min,
                    lte: max
                }
            })
        })
    }

    if (specialist) {
        andCondition.push({
            AND: ({
                services: {
                    contains: specialist
                }
            })
        })
    }

    const whereCondition = {
        AND: [
            { approvalStatus: 'APPROVED' as const },
            ...andCondition,
        ],
    };
    const result = await prisma.doctor.findMany({
        skip,
        take: limit,
        where: whereCondition,
    });

    const total = await prisma.doctor.count({ where: whereCondition });
    return {
        meta: {
            page,
            limit,
            total,
        },
        data: result
    }
}

const getDoctor = async (id: string): Promise<Doctor | null> => {
    const validatedId = validatePayload(uuidSchema, id);
    const result = await prisma.doctor.findUnique({
        where: {
            id: validatedId,
        },
        include: {
            education: { orderBy: { createdAt: 'desc' } },
            workExperience: { orderBy: { createdAt: 'desc' } },
            awardsCertifications: { orderBy: { createdAt: 'desc' } },
            customFees: {
                where: { isActive: true },
                include: { service: true },
            },
        },
    });
    if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Doctor Account is not found !!');
    }
    return result;
}

const addEducation = async (doctorId: string, payload: any) => {
    const validatedDoctorId = validatePayload(uuidSchema, doctorId);
    const validated = validatePayload(doctorEducationSchema, payload);
    return prisma.doctorEducation.create({
        data: {
            doctorId: validatedDoctorId,
            ...validated,
        },
    });
};

const deleteEducation = async (doctorId: string, educationId: string) => {
    const validatedDoctorId = validatePayload(uuidSchema, doctorId);
    const validatedEduId = validatePayload(uuidSchema, educationId);
    return prisma.doctorEducation.deleteMany({
        where: {
            id: validatedEduId,
            doctorId: validatedDoctorId,
        },
    });
};

const addExperience = async (doctorId: string, payload: any) => {
    const validatedDoctorId = validatePayload(uuidSchema, doctorId);
    const validated = validatePayload(doctorExperienceSchema, payload);
    return prisma.doctorExperience.create({
        data: {
            doctorId: validatedDoctorId,
            ...validated,
        },
    });
};

const deleteExperience = async (doctorId: string, experienceId: string) => {
    const validatedDoctorId = validatePayload(uuidSchema, doctorId);
    const validatedExpId = validatePayload(uuidSchema, experienceId);
    return prisma.doctorExperience.deleteMany({
        where: {
            id: validatedExpId,
            doctorId: validatedDoctorId,
        },
    });
};

const addAward = async (doctorId: string, payload: any) => {
    const validatedDoctorId = validatePayload(uuidSchema, doctorId);
    const validated = validatePayload(doctorAwardSchema, payload);
    return prisma.doctorAward.create({
        data: {
            doctorId: validatedDoctorId,
            ...validated,
        },
    });
};

const deleteAward = async (doctorId: string, awardId: string) => {
    const validatedDoctorId = validatePayload(uuidSchema, doctorId);
    const validatedAwardId = validatePayload(uuidSchema, awardId);
    return prisma.doctorAward.deleteMany({
        where: {
            id: validatedAwardId,
            doctorId: validatedDoctorId,
        },
    });
};

const deleteDoctor = async (id: string): Promise<any> => {
    const validatedId = validatePayload(uuidSchema, id);
    const result = await prisma.$transaction(async (tx) => {
        const patient = await tx.doctor.delete({
            where: {
                id: validatedId
            }
        });
        await tx.auth.delete({
            where: {
                email: patient.email
            }
        })
    });
    return result;
}

const updateDoctor = async (req: Request): Promise<Doctor> => {
    const file = req.file as IUpload;
    const id = validatePayload(uuidSchema, req.params.id);
    let updatePayload: unknown;
    try {
        updatePayload = JSON.parse(req.body.data);
    } catch {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Doctor profile data must be valid JSON.');
    }
    const user = validatePayload(doctorProfileUpdateSchema, updatePayload);
    if (Object.keys(user).length === 0 && !file) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Provide at least one profile field or an image to update.');
    }
    const existingDoctor = await prisma.doctor.findUnique({ where: { id } });
    if (!existingDoctor) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Doctor Account is not found.');
    }
    if (user.email && user.email !== existingDoctor.email.toLowerCase()) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Email cannot be changed from the doctor profile.');
    }
    const doctorData = { ...user, country: 'India' };
    delete doctorData.email;
    delete (doctorData as any).id;

    if (file) {
        try {
            const uploadImage = await CloudinaryHelper.uploadFile(file);
            if (uploadImage?.secure_url) {
                doctorData.img = uploadImage.secure_url;
            } else {
                throw new ApiError(httpStatus.EXPECTATION_FAILED, 'Failed to upload profile image.');
            }
        } catch (uploadErr: any) {
            throw new ApiError(
                uploadErr.statusCode || httpStatus.BAD_REQUEST,
                uploadErr.message || 'Image upload failed. Please try a different image.'
            );
        }
    }
    const result = await prisma.doctor.update({
        where: { id },
        data: doctorData
    })
    return result;
}

export const DoctorService = {
    create,
    updateDoctor,
    deleteDoctor,
    getAllDoctors,
    getDoctor,
    addEducation,
    deleteEducation,
    addExperience,
    deleteExperience,
    addAward,
    deleteAward,
};