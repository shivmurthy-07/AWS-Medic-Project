import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/apiError";
import httpStatus from "http-status";
import { validatePayload, uuidSchema } from "../../../helpers/validation";
import { createMedicalReportSchema, updateMedicalReportSchema } from "./medicalReport.validation";

const createReport = async (user: any, payload: any) => {
    const validated = validatePayload(createMedicalReportSchema, payload);
    const { userId, role } = user;

    let targetPatientId = validated.patientId;
    let targetDoctorId = validated.doctorId;

    if (role === 'patient') {
        targetPatientId = userId;
    } else if (role === 'doctor') {
        targetDoctorId = userId;
    }

    if (!targetPatientId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Patient ID is required');
    }

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
        where: { id: targetPatientId }
    });
    if (!patient) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Patient not found');
    }

    const reportDate = validated.reportDate ? new Date(validated.reportDate) : new Date();
    const testDate = validated.testDate ? new Date(validated.testDate) : null;

    const result = await prisma.medicalReport.create({
        data: {
            patientId: targetPatientId,
            doctorId: targetDoctorId || null,
            reportType: validated.reportType,
            reportTitle: validated.reportTitle,
            category: validated.category || 'GENERAL',
            hospitalOrLab: validated.hospitalOrLab || null,
            testDate,
            doctorComments: validated.doctorComments || null,
            recordResults: validated.recordResults || null,
            fileSize: validated.fileSize || null,
            fileMimeType: validated.fileMimeType || null,
            description: validated.description || null,
            reportDate,
            fileUrl: validated.fileUrl || null,
            fileName: validated.fileName || null,
            uploadedBy: role === 'doctor' ? 'doctor' : 'patient',
            status: validated.status || 'completed',
        },
        include: {
            doctor: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    specialization: true,
                }
            },
            patient: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    mobile: true,
                }
            }
        }
    });

    return result;
};

const getDoctorReports = async (user: any) => {
    const { userId } = user;
    // Get all reports where doctor is this doctor or patients are patients of this doctor
    const doctorAppointments = await prisma.appointments.findMany({
        where: { doctorId: userId },
        select: { patientId: true }
    });
    const patientIds = Array.from(new Set(doctorAppointments.map(a => a.patientId).filter(Boolean))) as string[];

    const result = await prisma.medicalReport.findMany({
        where: {
            OR: [
                { doctorId: userId },
                { patientId: { in: patientIds } }
            ]
        },
        include: {
            doctor: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    specialization: true,
                }
            },
            patient: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    mobile: true,
                }
            }
        },
        orderBy: {
            reportDate: 'desc'
        }
    });

    return result;
};

const getPatientReports = async (user: any, query?: any) => {
    const { userId } = user;
    const category = query?.category as string | undefined;
    const search = query?.search as string | undefined;

    const where: any = { patientId: userId };
    if (category && category !== 'ALL') {
        where.category = category;
    }
    if (search && search.trim()) {
        const s = search.trim();
        where.OR = [
            { reportTitle: { contains: s } },
            { reportType: { contains: s } },
            { hospitalOrLab: { contains: s } },
            { description: { contains: s } },
        ];
    }

    const result = await prisma.medicalReport.findMany({
        where,
        include: {
            doctor: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    specialization: true,
                }
            },
            patient: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    mobile: true,
                }
            }
        },
        orderBy: {
            reportDate: 'desc'
        }
    });

    return result;
};

const getPatientReportsByDoctor = async (patientId: string) => {
    const validatedId = validatePayload(uuidSchema, patientId);
    const result = await prisma.medicalReport.findMany({
        where: {
            patientId: validatedId
        },
        include: {
            doctor: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    specialization: true,
                }
            },
            patient: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    mobile: true,
                }
            }
        },
        orderBy: {
            reportDate: 'desc'
        }
    });

    return result;
};

const getSingleReport = async (id: string, user: any) => {
    const validatedId = validatePayload(uuidSchema, id);
    const report = await prisma.medicalReport.findUnique({
        where: { id: validatedId },
        include: {
            doctor: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    specialization: true,
                }
            },
            patient: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    mobile: true,
                }
            }
        }
    });

    if (!report) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Medical report not found');
    }

    if (user.role === 'patient' && report.patientId !== user.userId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to view this report');
    }

    return report;
};

const deleteReport = async (id: string, user: any) => {
    const validatedId = validatePayload(uuidSchema, id);
    const report = await prisma.medicalReport.findUnique({
        where: { id: validatedId }
    });

    if (!report) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Medical report not found');
    }

    if (user.role === 'patient' && report.patientId !== user.userId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to delete this report');
    }

    if (user.role === 'doctor' && report.doctorId !== user.userId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to delete this report');
    }

    const result = await prisma.medicalReport.delete({
        where: { id: validatedId }
    });

    return result;
};

const updateReport = async (id: string, user: any, payload: any) => {
    const validatedId = validatePayload(uuidSchema, id);
    const validated = validatePayload(updateMedicalReportSchema, payload);

    const report = await prisma.medicalReport.findUnique({
        where: { id: validatedId }
    });

    if (!report) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Medical report not found');
    }

    const updateData: any = { ...validated };
    if (validated.reportDate) {
        updateData.reportDate = new Date(validated.reportDate);
    }

    const result = await prisma.medicalReport.update({
        where: { id: validatedId },
        data: updateData
    });

    return result;
};

export const MedicalReportService = {
    createReport,
    getDoctorReports,
    getPatientReports,
    getPatientReportsByDoctor,
    getSingleReport,
    deleteReport,
    updateReport
};

