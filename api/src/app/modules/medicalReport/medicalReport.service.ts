import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/apiError";
import httpStatus from "http-status";
import { validatePayload, uuidSchema } from "../../../helpers/validation";
import { resolveRegisteredPatientId } from "../../../helpers/patientResolver";
import { createMedicalReportSchema, updateMedicalReportSchema } from "./medicalReport.validation";

const BLOCKED_STOCK_PLACEHOLDER_PATTERNS = [
    'images.unsplash.com/photo-1530497610245-94d3c16cda28',
    'images.unsplash.com/photo-1579684385127-1ef15d508118',
    'images.unsplash.com/photo-1559757175-5700dde675bc',
    'images.unsplash.com/photo-1576091160399-112ba8d25d1d',
];

const sanitizeReportFileUrl = (url?: string | null): string | null => {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    if (BLOCKED_STOCK_PLACEHOLDER_PATTERNS.some((pattern) => trimmed.includes(pattern))) {
        return null;
    }
    return trimmed;
};

export const sanitizeReportRecord = <T extends { fileUrl?: string | null; fileName?: string | null }>(report: T): T => {
    const cleanUrl = sanitizeReportFileUrl(report.fileUrl);
    return {
        ...report,
        fileUrl: cleanUrl,
        fileName: cleanUrl ? report.fileName : null,
    };
};

const createReport = async (user: any, payload: any) => {
    const validated = validatePayload(createMedicalReportSchema, payload);
    const { userId, role } = user;

    let targetPatientId = validated.patientId;
    let targetDoctorId = validated.doctorId || null;
    const appointmentId = validated.appointmentId || null;
    let linkedAppointment: any = null;

    if (role === 'patient') {
        if (appointmentId) {
            throw new ApiError(
                httpStatus.FORBIDDEN,
                'Only the consulting doctor can generate post-consultation diagnostic reports.'
            );
        }
        targetPatientId = userId;
        targetDoctorId = null;
    } else if (role === 'doctor') {
        if (!appointmentId) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                'A completed consultation appointment ID is required to generate an official medical report.'
            );
        }
        targetDoctorId = userId;
    }

    if (appointmentId) {
        linkedAppointment = await prisma.appointments.findUnique({
            where: { id: appointmentId }
        });
        if (!linkedAppointment) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Consultation appointment not found');
        }
        if (role === 'doctor' && linkedAppointment.doctorId !== userId) {
            throw new ApiError(
                httpStatus.FORBIDDEN,
                'You can only generate consultation reports for your own assigned appointments.'
            );
        }
        if (linkedAppointment.status !== 'Completed') {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                'Post-consultation diagnostic reports can only be generated after the consultation is marked Completed.'
            );
        }
        if (linkedAppointment.patientId) {
            targetPatientId = linkedAppointment.patientId;
        } else {
            const resolvedPatientId = await resolveRegisteredPatientId({
                patientId: targetPatientId,
                email: linkedAppointment.email,
                phone: linkedAppointment.phone,
            });
            if (resolvedPatientId) {
                targetPatientId = resolvedPatientId;
                await prisma.appointments.update({
                    where: { id: linkedAppointment.id },
                    data: { patientId: resolvedPatientId },
                });
            }
        }
        if (linkedAppointment.doctorId) {
            targetDoctorId = linkedAppointment.doctorId;
        }
    }

    if (!targetPatientId) {
        const emailSuffix = linkedAppointment?.email ? ` (${linkedAppointment.email})` : '';
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            `A registered patient account is required to generate an official medical report. No registered patient profile matched this booking${emailSuffix}.`
        );
    }

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
        where: { id: targetPatientId }
    });
    if (!patient) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Patient not found');
    }

    const reportDate = validated.reportDate ? new Date(validated.reportDate) : new Date();
    const fallbackApptDate = linkedAppointment?.scheduleDate ? new Date(linkedAppointment.scheduleDate) : null;
    const testDate = validated.testDate ? new Date(validated.testDate) : fallbackApptDate;
    const cleanFileUrl = sanitizeReportFileUrl(validated.fileUrl);

    const result = await prisma.medicalReport.create({
        data: {
            appointmentId,
            patientId: targetPatientId,
            doctorId: targetDoctorId || null,
            reportType: validated.reportType,
            reportTitle: validated.reportTitle,
            category: validated.category || 'GENERAL',
            hospitalOrLab: validated.hospitalOrLab || null,
            testDate,
            doctorComments: validated.doctorComments || null,
            recordResults: validated.recordResults || null,
            fileSize: cleanFileUrl ? (validated.fileSize || null) : null,
            fileMimeType: cleanFileUrl ? (validated.fileMimeType || null) : null,
            description: validated.description || null,
            reportDate,
            fileUrl: cleanFileUrl,
            fileName: cleanFileUrl ? (validated.fileName || null) : null,
            uploadedBy: role === 'doctor' ? 'doctor' : 'patient',
            status: validated.status || 'completed',
        },
        include: {
            appointment: {
                select: {
                    id: true,
                    trackingId: true,
                    scheduleDate: true,
                    scheduleTime: true,
                    reasonForVisit: true,
                    status: true,
                }
            },
            doctor: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    specialization: true,
                    designation: true,
                    registration: true,
                    hospitalName: true,
                    clinicName: true,
                }
            },
            patient: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    mobile: true,
                    gender: true,
                    dateOfBirth: true,
                    bloodGroup: true,
                    address: true,
                    city: true,
                    state: true,
                    country: true,
                }
            }
        }
    });

    return result;
};

const getDoctorReports = async (user: any) => {
    const { userId } = user;

    // Find consultation appointments belonging to this doctor
    const doctorAppointments = await prisma.appointments.findMany({
        where: { doctorId: userId },
        select: { id: true, patientId: true, status: true }
    });

    const completedAppointmentIds = doctorAppointments
        .filter(a => a.status === 'Completed')
        .map(a => a.id);
    const consultedPatientIds = Array.from(
        new Set(doctorAppointments.map(a => a.patientId).filter(Boolean))
    ) as string[];

    // Only expose reports for completed consultations or patient-uploaded external records for consulted patients
    const orClauses: any[] = [];
    if (completedAppointmentIds.length > 0) {
        orClauses.push({ appointmentId: { in: completedAppointmentIds } });
    }
    if (consultedPatientIds.length > 0) {
        orClauses.push({
            appointmentId: null,
            uploadedBy: 'patient',
            patientId: { in: consultedPatientIds }
        });
    }

    if (orClauses.length === 0) {
        return [];
    }

    const result = await prisma.medicalReport.findMany({
        where: {
            OR: orClauses
        },
        include: {
            appointment: {
                select: {
                    id: true,
                    trackingId: true,
                    scheduleDate: true,
                    scheduleTime: true,
                    reasonForVisit: true,
                    status: true,
                }
            },
            doctor: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    specialization: true,
                    designation: true,
                    registration: true,
                    hospitalName: true,
                    clinicName: true,
                }
            },
            patient: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    mobile: true,
                    gender: true,
                    dateOfBirth: true,
                    bloodGroup: true,
                    address: true,
                    city: true,
                    state: true,
                    country: true,
                }
            }
        },
        orderBy: {
            reportDate: 'desc'
        }
    });

    return result.map(sanitizeReportRecord);
};

const getPatientReports = async (user: any, query?: any) => {
    const { userId } = user;
    const category = query?.category as string | undefined;
    const search = query?.search as string | undefined;

    const baseFilter: any = {
        patientId: userId,
        OR: [
            { appointmentId: null, uploadedBy: 'patient' },
            { appointment: { is: { status: 'Completed' } } }
        ]
    };

    const andConditions: any[] = [baseFilter];
    if (category && category !== 'ALL') {
        andConditions.push({ category });
    }
    if (search && search.trim()) {
        const s = search.trim();
        andConditions.push({
            OR: [
                { reportTitle: { contains: s } },
                { reportType: { contains: s } },
                { hospitalOrLab: { contains: s } },
                { description: { contains: s } },
            ]
        });
    }

    const where: any = { AND: andConditions };

    const result = await prisma.medicalReport.findMany({
        where,
        include: {
            appointment: {
                select: {
                    id: true,
                    trackingId: true,
                    scheduleDate: true,
                    scheduleTime: true,
                    reasonForVisit: true,
                    status: true,
                }
            },
            doctor: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    specialization: true,
                    designation: true,
                    registration: true,
                    hospitalName: true,
                    clinicName: true,
                }
            },
            patient: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    mobile: true,
                    gender: true,
                    dateOfBirth: true,
                    bloodGroup: true,
                    address: true,
                    city: true,
                    state: true,
                    country: true,
                }
            }
        },
        orderBy: {
            reportDate: 'desc'
        }
    });

    return result.map(sanitizeReportRecord);
};

const getPatientReportsByDoctor = async (patientId: string, user?: any) => {
    const validatedId = validatePayload(uuidSchema, patientId);

    if (user?.role === 'doctor') {
        const hasRelationship = await prisma.appointments.findFirst({
            where: {
                doctorId: user.userId,
                patientId: validatedId,
            },
            select: { id: true }
        });
        if (!hasRelationship) {
            throw new ApiError(httpStatus.FORBIDDEN, 'You can only view records of patients who booked an appointment with you.');
        }
    }

    const result = await prisma.medicalReport.findMany({
        where: {
            patientId: validatedId,
            OR: [
                { appointmentId: null, uploadedBy: 'patient' },
                {
                    appointment: {
                        is: {
                            status: 'Completed',
                            ...(user?.role === 'doctor' ? { doctorId: user.userId } : {})
                        }
                    }
                }
            ]
        },
        include: {
            appointment: {
                select: {
                    id: true,
                    trackingId: true,
                    scheduleDate: true,
                    scheduleTime: true,
                    reasonForVisit: true,
                    status: true,
                }
            },
            doctor: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    specialization: true,
                    designation: true,
                    registration: true,
                    hospitalName: true,
                    clinicName: true,
                }
            },
            patient: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    mobile: true,
                    gender: true,
                    dateOfBirth: true,
                    bloodGroup: true,
                    address: true,
                    city: true,
                    state: true,
                    country: true,
                }
            }
        },
        orderBy: {
            reportDate: 'desc'
        }
    });

    return result.map(sanitizeReportRecord);
};

const getSingleReport = async (id: string, user: any) => {
    const validatedId = validatePayload(uuidSchema, id);
    const report = await prisma.medicalReport.findUnique({
        where: { id: validatedId },
        include: {
            appointment: {
                select: {
                    id: true,
                    trackingId: true,
                    scheduleDate: true,
                    scheduleTime: true,
                    reasonForVisit: true,
                    status: true,
                }
            },
            doctor: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    specialization: true,
                    designation: true,
                    registration: true,
                    hospitalName: true,
                    clinicName: true,
                }
            },
            patient: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    mobile: true,
                    gender: true,
                    dateOfBirth: true,
                    bloodGroup: true,
                    address: true,
                    city: true,
                    state: true,
                    country: true,
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

    if (user.role === 'doctor' && report.doctorId !== user.userId) {
        const isPatientSelfUpload = report.uploadedBy === 'patient' && !report.appointmentId;
        if (!isPatientSelfUpload) {
            throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to view this report');
        }
        const consulted = await prisma.appointments.findFirst({
            where: { doctorId: user.userId, patientId: report.patientId },
            select: { id: true }
        });
        if (!consulted) {
            throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to view this report');
        }
    }

    if (report.appointmentId && report.appointment?.status !== 'Completed') {
        throw new ApiError(
            httpStatus.FORBIDDEN,
            'Diagnostic consultation reports become available after the consultation is marked Completed.'
        );
    }

    return sanitizeReportRecord(report);
};

const getReportsByAppointment = async (appointmentId: string, user: any) => {
    const validatedId = validatePayload(uuidSchema, appointmentId);
    const appointment = await prisma.appointments.findUnique({
        where: { id: validatedId }
    });
    if (!appointment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Appointment not found');
    }

    if (
        user.role !== 'admin' &&
        user.userId !== appointment.doctorId &&
        user.userId !== appointment.patientId
    ) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorised to access reports for this appointment.');
    }

    if (appointment.status !== 'Completed') {
        return [];
    }

    const result = await prisma.medicalReport.findMany({
        where: {
            appointmentId: validatedId
        },
        include: {
            appointment: {
                select: {
                    id: true,
                    trackingId: true,
                    scheduleDate: true,
                    scheduleTime: true,
                    reasonForVisit: true,
                    status: true,
                }
            },
            doctor: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    specialization: true,
                    designation: true,
                    registration: true,
                    hospitalName: true,
                    clinicName: true,
                }
            },
            patient: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    mobile: true,
                    gender: true,
                    dateOfBirth: true,
                    bloodGroup: true,
                    address: true,
                    city: true,
                    state: true,
                    country: true,
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return result.map(sanitizeReportRecord);
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

    if (user.role === 'patient') {
        if (report.patientId !== user.userId || report.appointmentId) {
            throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to update this report');
        }
    } else if (user.role === 'doctor' && report.doctorId !== user.userId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to update this report');
    }

    const updateData: any = { ...validated };
    if (validated.reportDate) {
        updateData.reportDate = new Date(validated.reportDate);
    }
    if (validated.testDate) {
        updateData.testDate = new Date(validated.testDate);
    }
    if ('fileUrl' in validated) {
        const cleanUrl = sanitizeReportFileUrl(validated.fileUrl);
        updateData.fileUrl = cleanUrl;
        if (!cleanUrl) {
            updateData.fileName = null;
        }
    }

    const result = await prisma.medicalReport.update({
        where: { id: validatedId },
        data: updateData
    });

    return sanitizeReportRecord(result);
};

export const MedicalReportService = {
    createReport,
    getDoctorReports,
    getPatientReports,
    getPatientReportsByDoctor,
    getReportsByAppointment,
    getSingleReport,
    deleteReport,
    updateReport
};

