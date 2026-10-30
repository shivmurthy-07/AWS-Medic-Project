import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/apiError";
import httpStatus from "http-status";
import { validatePayload, uuidSchema } from "../../../helpers/validation";
import { Prisma } from "@prisma/client";
import {
    createSpecializationSchema,
    updateSpecializationSchema,
    createServiceSchema,
    updateServiceSchema,
    setSpecializationFeeSchema,
    setDoctorFeeSchema,
    createFeeChangeRequestSchema,
    reviewFeeChangeRequestSchema,
} from "./fee.validation";

// Specializations
const getAllSpecializations = async (onlyActive = false) => {
    return prisma.specialization.findMany({
        where: onlyActive ? { isActive: true } : undefined,
        orderBy: { name: 'asc' },
        include: {
            fees: {
                include: {
                    service: true,
                },
            },
        },
    });
};

const createSpecialization = async (payload: any) => {
    const validated = validatePayload(createSpecializationSchema, payload);
    const existing = await prisma.specialization.findUnique({
        where: { name: validated.name },
    });
    if (existing) {
        throw new ApiError(httpStatus.CONFLICT, 'Specialization with this name already exists');
    }
    return prisma.specialization.create({
        data: validated,
    });
};

const updateSpecialization = async (id: string, payload: any) => {
    const validatedId = validatePayload(uuidSchema, id);
    const validated = validatePayload(updateSpecializationSchema, payload);
    return prisma.specialization.update({
        where: { id: validatedId },
        data: validated,
    });
};

// Consultation Services
const getAllServices = async (onlyActive = false) => {
    return prisma.consultationService.findMany({
        where: onlyActive ? { isActive: true } : undefined,
        orderBy: { name: 'asc' },
    });
};

const createService = async (payload: any) => {
    const validated = validatePayload(createServiceSchema, payload);
    const existing = await prisma.consultationService.findUnique({
        where: { name: validated.name },
    });
    if (existing) {
        throw new ApiError(httpStatus.CONFLICT, 'Consultation service with this name already exists');
    }
    return prisma.consultationService.create({
        data: validated,
    });
};

const updateService = async (id: string, payload: any) => {
    const validatedId = validatePayload(uuidSchema, id);
    const validated = validatePayload(updateServiceSchema, payload);
    return prisma.consultationService.update({
        where: { id: validatedId },
        data: validated,
    });
};

// Specialization Fees
const getAllSpecializationFees = async (specializationId?: string) => {
    return prisma.specializationFee.findMany({
        where: specializationId ? { specializationId } : undefined,
        include: {
            specialization: true,
            service: true,
        },
        orderBy: [
            { specialization: { name: 'asc' } },
            { service: { name: 'asc' } },
        ],
    });
};

const setSpecializationFee = async (payload: any) => {
    const validated = validatePayload(setSpecializationFeeSchema, payload);
    const existing = await prisma.specializationFee.findFirst({
        where: {
            specializationId: validated.specializationId,
            serviceId: validated.serviceId,
            mode: validated.mode,
        },
    });

    if (existing) {
        return prisma.specializationFee.update({
            where: { id: existing.id },
            data: {
                fee: new Prisma.Decimal(validated.fee),
                isActive: validated.isActive,
            },
            include: {
                specialization: true,
                service: true,
            },
        });
    }

    return prisma.specializationFee.create({
        data: {
            specializationId: validated.specializationId,
            serviceId: validated.serviceId,
            mode: validated.mode,
            fee: new Prisma.Decimal(validated.fee),
            isActive: validated.isActive,
        },
        include: {
            specialization: true,
            service: true,
        },
    });
};

// Doctor-Specific Fees
const getDoctorFees = async (doctorId: string) => {
    const validatedDoctorId = validatePayload(uuidSchema, doctorId);
    return prisma.doctorFee.findMany({
        where: { doctorId: validatedDoctorId },
        include: {
            service: true,
        },
        orderBy: { service: { name: 'asc' } },
    });
};

const setDoctorFee = async (payload: any) => {
    const validated = validatePayload(setDoctorFeeSchema, payload);
    const existing = await prisma.doctorFee.findFirst({
        where: {
            doctorId: validated.doctorId,
            serviceId: validated.serviceId,
            mode: validated.mode,
        },
    });

    if (existing) {
        return prisma.doctorFee.update({
            where: { id: existing.id },
            data: {
                fee: new Prisma.Decimal(validated.fee),
                isActive: validated.isActive,
            },
            include: {
                service: true,
            },
        });
    }

    return prisma.doctorFee.create({
        data: {
            doctorId: validated.doctorId,
            serviceId: validated.serviceId,
            mode: validated.mode,
            fee: new Prisma.Decimal(validated.fee),
            isActive: validated.isActive,
        },
        include: {
            service: true,
        },
    });
};

// Fee Change Requests
const createFeeChangeRequest = async (user: any, payload: any) => {
    const doctorId = user.userId;
    const validated = validatePayload(createFeeChangeRequestSchema, payload);

    // Find current doctor fee or specialization fee
    const currentDoctorFee = await prisma.doctorFee.findFirst({
        where: {
            doctorId,
            serviceId: validated.serviceId,
            mode: validated.mode,
        },
    });

    const currentFee = currentDoctorFee ? currentDoctorFee.fee : null;

    return prisma.feeChangeRequest.create({
        data: {
            doctorId,
            serviceId: validated.serviceId,
            mode: validated.mode,
            proposedFee: new Prisma.Decimal(validated.proposedFee),
            currentFee,
            reason: validated.reason,
            status: 'PENDING',
        },
        include: {
            service: true,
            doctor: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    specialization: true,
                },
            },
        },
    });
};

const getMyFeeChangeRequests = async (user: any) => {
    return prisma.feeChangeRequest.findMany({
        where: { doctorId: user.userId },
        include: {
            service: true,
        },
        orderBy: { createdAt: 'desc' },
    });
};

const getAllFeeChangeRequests = async (status?: string) => {
    return prisma.feeChangeRequest.findMany({
        where: status ? { status } : undefined,
        include: {
            service: true,
            doctor: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    specialization: true,
                    img: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
};

const reviewFeeChangeRequest = async (id: string, payload: any) => {
    const validatedId = validatePayload(uuidSchema, id);
    const validated = validatePayload(reviewFeeChangeRequestSchema, payload);

    const request = await prisma.feeChangeRequest.findUnique({
        where: { id: validatedId },
    });

    if (!request) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Fee change request not found');
    }

    if (request.status !== 'PENDING') {
        throw new ApiError(httpStatus.BAD_REQUEST, `Request is already ${request.status}`);
    }

    const updated = await prisma.$transaction(async (tx) => {
        const reviewed = await tx.feeChangeRequest.update({
            where: { id: validatedId },
            data: {
                status: validated.status,
                adminComment: validated.adminComment || null,
                reviewedAt: new Date(),
            },
            include: {
                service: true,
                doctor: true,
            },
        });

        // If approved, update or create the DoctorFee record
        if (validated.status === 'APPROVED') {
            const existingDoctorFee = await tx.doctorFee.findFirst({
                where: {
                    doctorId: request.doctorId,
                    serviceId: request.serviceId,
                    mode: request.mode,
                },
            });

            if (existingDoctorFee) {
                await tx.doctorFee.update({
                    where: { id: existingDoctorFee.id },
                    data: {
                        fee: request.proposedFee,
                        isActive: true,
                    },
                });
            } else {
                await tx.doctorFee.create({
                    data: {
                        doctorId: request.doctorId,
                        serviceId: request.serviceId,
                        mode: request.mode,
                        fee: request.proposedFee,
                        isActive: true,
                    },
                });
            }
        }

        return reviewed;
    });

    return updated;
};

// Calculate Dynamic Consultation Fee
const calculateConsultationFee = async (
    doctorId: string,
    serviceIdOrName?: string,
    mode: string = 'IN_PERSON'
) => {
    const validatedDoctorId = validatePayload(uuidSchema, doctorId);
    const doctor = await prisma.doctor.findUnique({
        where: { id: validatedDoctorId },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            specialization: true,
            price: true,
        },
    });

    if (!doctor) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Doctor not found');
    }

    let service: any = null;
    if (serviceIdOrName) {
        // Try to match by ID or Name
        service = await prisma.consultationService.findFirst({
            where: {
                OR: [
                    { id: serviceIdOrName },
                    { name: serviceIdOrName },
                    { code: serviceIdOrName },
                ],
                isActive: true,
            },
        });
    }

    // Default to First Consultation if not specified
    if (!service) {
        service = await prisma.consultationService.findFirst({
            where: { name: 'First Consultation', isActive: true },
        }) || await prisma.consultationService.findFirst({ where: { isActive: true } });
    }

    let feeAmount: number | null = null;
    let feeSource: 'doctor' | 'specialization' | 'base' = 'base';

    // 1. Check active Doctor-specific fee
    if (service) {
        const docFee = await prisma.doctorFee.findFirst({
            where: {
                doctorId: doctor.id,
                serviceId: service.id,
                mode: { in: [mode, 'BOTH'] },
                isActive: true,
            },
        });
        if (docFee) {
            feeAmount = Number(docFee.fee);
            feeSource = 'doctor';
        }
    }

    // 2. Check active Specialization fee
    if (feeAmount === null && service && doctor.specialization) {
        const spec = await prisma.specialization.findFirst({
            where: {
                name: { equals: doctor.specialization },
                isActive: true,
            },
        });

        if (spec) {
            const specFee = await prisma.specializationFee.findFirst({
                where: {
                    specializationId: spec.id,
                    serviceId: service.id,
                    mode: { in: [mode, 'BOTH'] },
                    isActive: true,
                },
            });
            if (specFee) {
                feeAmount = Number(specFee.fee);
                feeSource = 'specialization';
            }
        }
    }

    // 3. Fallback to Doctor's base price
    if (feeAmount === null) {
        const baseNum = Number(doctor.price);
        feeAmount = !isNaN(baseNum) && baseNum > 0 ? baseNum : 500;
        feeSource = 'base';
    }

    const bookingFee = 10;
    const vat = Math.round((15 / 100) * (feeAmount + bookingFee));
    const totalAmount = feeAmount + bookingFee + vat;

    return {
        available: true,
        doctorId: doctor.id,
        doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
        specialization: doctor.specialization || 'General',
        serviceId: service?.id || null,
        serviceName: service?.name || 'General Consultation',
        mode,
        consultationFee: feeAmount,
        bookingFee,
        vat,
        totalAmount,
        feeSource,
    };
};

export const FeeService = {
    getAllSpecializations,
    createSpecialization,
    updateSpecialization,
    getAllServices,
    createService,
    updateService,
    getAllSpecializationFees,
    setSpecializationFee,
    getDoctorFees,
    setDoctorFee,
    createFeeChangeRequest,
    getMyFeeChangeRequests,
    getAllFeeChangeRequests,
    reviewFeeChangeRequest,
    calculateConsultationFee,
};

