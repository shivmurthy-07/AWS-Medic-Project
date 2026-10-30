import { DoctorApprovalStatus, Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import moment from 'moment';
import ApiError from '../../../errors/apiError';
import { validatePayload, uuidSchema } from '../../../helpers/validation';
import prisma from '../../../shared/prisma';
import { getDoctorProfileProgress } from '../../../helpers/doctorProfileCompletion';
import {
    appointmentListQuerySchema,
    doctorListQuerySchema,
    listQuerySchema,
    patientStatusSchema,
    rejectDoctorSchema,
    userListQuerySchema,
    userRoleSchema,
} from './superAdmin.validation';

type Actor = { userId?: string; email?: string };
const logAction = (actor: Actor, action: string, entityType: string, entityId?: string, metadata?: Prisma.InputJsonValue) => ({
    actorId: actor.userId || null,
    actorEmail: actor.email || 'unknown',
    action,
    entityType,
    entityId,
    metadata,
});

const pageOptions = (query: { page?: number; limit?: number }) => {
    const page = query.page || 1;
    const limit = query.limit || 20;
    return { page, limit, skip: (page - 1) * limit };
};

const dashboard = async () => {
    const today = moment().format('YYYY-MM-DD');
    const lastWeek = moment().subtract(6, 'days').startOf('day').toDate();
    const [doctorStatus, totalPatients, totalAppointments, upcomingAppointments, completedAppointments,
        cancelledAppointments, totalPrescriptions, recentDoctors, recentPatients, recentAppointments, activityCount] =
        await Promise.all([
            prisma.doctor.groupBy({ by: ['approvalStatus'], _count: { _all: true } }),
            prisma.patient.count(),
            prisma.appointments.count(),
            prisma.appointments.count({ where: { scheduleDate: { gte: today }, status: { notIn: ['Completed', 'completed', 'cancel', 'cancelled', 'canceled'] } } }),
            prisma.appointments.count({ where: { status: { in: ['Completed', 'completed'] } } }),
            prisma.appointments.count({ where: { status: { in: ['cancel', 'cancelled', 'canceled'] } } }),
            prisma.prescription.count(),
            prisma.doctor.findMany({
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: { id: true, firstName: true, lastName: true, email: true, specialization: true, approvalStatus: true, createdAt: true },
            }),
            prisma.patient.findMany({
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: { id: true, firstName: true, lastName: true, email: true, createdAt: true },
            }),
            prisma.appointments.findMany({
                where: { createdAt: { gte: lastWeek } },
                select: { createdAt: true },
            }),
            prisma.activityLog.count(),
        ]);
    const doctorCounts = Object.fromEntries(doctorStatus.map((row) => [row.approvalStatus, row._count._all]));
    const appointmentsByDay = Array.from({ length: 7 }, (_, index) => {
        const date = moment().subtract(6 - index, 'days');
        return {
            date: date.format('YYYY-MM-DD'),
            count: recentAppointments.filter((appointment) =>
                moment(appointment.createdAt).format('YYYY-MM-DD') === date.format('YYYY-MM-DD')
            ).length,
        };
    });
    const recentRegistrations = [
        ...recentDoctors.map((doctor) => ({ ...doctor, type: 'doctor' })),
        ...recentPatients.map((patient) => ({ ...patient, type: 'patient' })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 8);

    return {
        statistics: {
            totalDoctors: Object.values(doctorCounts).reduce((total, count) => total + count, 0),
            pendingDoctors: doctorCounts.PENDING || 0,
            approvedDoctors: doctorCounts.APPROVED || 0,
            rejectedDoctors: doctorCounts.REJECTED || 0,
            suspendedDoctors: doctorCounts.SUSPENDED || 0,
            totalPatients,
            totalAppointments,
            upcomingAppointments,
            completedAppointments,
            cancelledAppointments,
            totalPrescriptions,
            activityCount,
        },
        appointmentsByDay,
        recentRegistrations,
    };
};

const listDoctors = async (input: unknown, pendingOnly = false) => {
    const query = validatePayload(doctorListQuerySchema, input);
    const { page, limit, skip } = pageOptions(query);
    const status = pendingOnly ? DoctorApprovalStatus.PENDING : query.status;
    const search = query.search;
    const where: Prisma.DoctorWhereInput = {
        ...(status ? { approvalStatus: status } : {}),
        ...(search ? {
            OR: [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { email: { contains: search } },
                { specialization: { contains: search } },
                { registration: { contains: search } },
            ],
        } : {}),
    };
    const [rows, total] = await Promise.all([
        prisma.doctor.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            select: {
                id: true, firstName: true, lastName: true, img: true, email: true, phone: true, specialization: true,
                degree: true, college: true, completionYear: true, experience: true, registration: true,
                approvalStatus: true, rejectionReason: true, approvedAt: true, approvedById: true,
                clinicName: true, clinicAddress: true, price: true,
                createdAt: true, _count: { select: { appointments: true } },
            },
        }),
        prisma.doctor.count({ where }),
    ]);
    return {
        data: rows.map((doctor) => ({
            ...doctor,
            profileComplete: getDoctorProfileProgress(doctor).complete,
            appointmentCount: doctor._count.appointments,
            _count: undefined,
        })),
        meta: { page, limit, total },
    };
};

const getDoctor = async (id: string) => {
    const doctorId = validatePayload(uuidSchema, id);
    const doctor = await prisma.doctor.findUnique({
        where: { id: doctorId },
        include: {
            education: { orderBy: { createdAt: 'desc' } },
            workExperience: { orderBy: { createdAt: 'desc' } },
            awardsCertifications: { orderBy: { createdAt: 'desc' } },
            customFees: {
                where: { isActive: true },
                include: { service: true },
            },
            _count: { select: { appointments: true } },
        },
    });
    if (!doctor) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Doctor account was not found.');
    }
    return { ...doctor, profileComplete: getDoctorProfileProgress(doctor).complete, appointmentCount: doctor._count.appointments, _count: undefined };
};

const changeDoctorStatus = async (actor: Actor, id: string, action: 'approve' | 'reject' | 'suspend' | 'reactivate', body?: unknown) => {
    const doctorId = validatePayload(uuidSchema, id);
    const rejection = action === 'reject' ? validatePayload(rejectDoctorSchema, body) : undefined;
    return prisma.$transaction(async (tx) => {
        const doctor = await tx.doctor.findUnique({ where: { id: doctorId } });
        if (!doctor) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Doctor account was not found.');
        }
        const allowed: DoctorApprovalStatus[] = {
            approve: [DoctorApprovalStatus.PENDING],
            reject: [DoctorApprovalStatus.PENDING],
            suspend: [DoctorApprovalStatus.APPROVED],
            reactivate: [DoctorApprovalStatus.SUSPENDED],
        }[action];
        if (!allowed.includes(doctor.approvalStatus)) {
            throw new ApiError(httpStatus.CONFLICT, `Cannot ${action} a doctor with ${doctor.approvalStatus.toLowerCase()} status.`);
        }
        const nextStatus = {
            approve: DoctorApprovalStatus.APPROVED,
            reject: DoctorApprovalStatus.REJECTED,
            suspend: DoctorApprovalStatus.SUSPENDED,
            reactivate: DoctorApprovalStatus.APPROVED,
        }[action];
        const change = await tx.doctor.updateMany({
            where: { id: doctorId, approvalStatus: doctor.approvalStatus },
            data: {
                approvalStatus: nextStatus,
                rejectionReason: action === 'reject' ? rejection?.reason : null,
                approvedAt: action === 'approve' || action === 'reactivate' ? new Date() : doctor.approvedAt,
                approvedById: action === 'approve' || action === 'reactivate' ? actor.userId : doctor.approvedById,
            },
        });
        if (change.count !== 1) {
            throw new ApiError(httpStatus.CONFLICT, 'The doctor status changed while this action was being processed.');
        }
        const updated = await tx.doctor.findUnique({
            where: { id: doctorId },
            select: { id: true, firstName: true, lastName: true, email: true, approvalStatus: true, rejectionReason: true, approvedAt: true },
        });
        if (!updated) {
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'The doctor status update could not be confirmed.');
        }
        await tx.activityLog.create({
            data: logAction(actor, `doctor.${action}`, 'doctor', doctorId, action === 'reject' ? { reason: rejection?.reason } : undefined),
        });
        return updated;
    });
};

const listPatients = async (input: unknown) => {
    const query = validatePayload(listQuerySchema, input);
    const { page, limit, skip } = pageOptions(query);
    const where: Prisma.PatientWhereInput = query.search ? {
        OR: [
            { firstName: { contains: query.search } },
            { lastName: { contains: query.search } },
            { email: { contains: query.search } },
        ],
    } : {};
    const [data, total] = await Promise.all([
        prisma.patient.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            select: {
                id: true, firstName: true, lastName: true, email: true, createdAt: true, isActive: true,
                _count: { select: { appointments: true } },
            },
        }),
        prisma.patient.count({ where }),
    ]);
    return { data: data.map(({ _count, ...patient }) => ({ ...patient, appointmentCount: _count.appointments })), meta: { page, limit, total } };
};

const setPatientStatus = async (actor: Actor, id: string, body: unknown) => {
    const patientId = validatePayload(uuidSchema, id);
    const { isActive } = validatePayload(patientStatusSchema, body);
    return prisma.$transaction(async (tx) => {
        const patient = await tx.patient.findUnique({ where: { id: patientId }, select: { id: true, isActive: true } });
        if (!patient) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Patient account was not found.');
        }
        if (patient.isActive === isActive) {
            throw new ApiError(httpStatus.CONFLICT, `Patient account is already ${isActive ? 'active' : 'inactive'}.`);
        }
        const change = await tx.patient.updateMany({
            where: { id: patientId, isActive: patient.isActive },
            data: { isActive },
        });
        if (change.count !== 1) {
            throw new ApiError(httpStatus.CONFLICT, 'The patient status changed while this action was being processed.');
        }
        const updated = await tx.patient.findUnique({
            where: { id: patientId },
            select: { id: true, isActive: true },
        });
        if (!updated) {
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'The patient status update could not be confirmed.');
        }
        await tx.activityLog.create({
            data: logAction(actor, isActive ? 'patient.activate' : 'patient.deactivate', 'patient', patientId),
        });
        return updated;
    });
};

const listAppointments = async (input: unknown) => {
    const query = validatePayload(appointmentListQuerySchema, input);
    const { page, limit, skip } = pageOptions(query);
    const dateRange = query.from || query.to ? {
        scheduleDate: {
            ...(query.from ? { gte: query.from } : {}),
            ...(query.to ? { lte: `${query.to} 23:59:59` } : {}),
        },
    } : {};
    const where: Prisma.AppointmentsWhereInput = {
        ...dateRange,
        ...(query.status ? { status: { equals: query.status } } : {}),
        ...(query.search ? {
            OR: [
                { firstName: { contains: query.search } },
                { lastName: { contains: query.search } },
                { email: { contains: query.search } },
                { doctor: { is: { firstName: { contains: query.search } } } },
                { doctor: { is: { lastName: { contains: query.search } } } },
            ],
        } : {}),
    };
    const [data, total] = await Promise.all([
        prisma.appointments.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            select: {
                id: true, trackingId: true, firstName: true, lastName: true, scheduleDate: true,
                scheduleTime: true, status: true, paymentStatus: true, createdAt: true,
                doctor: { select: { firstName: true, lastName: true, specialization: true } },
            },
        }),
        prisma.appointments.count({ where }),
    ]);
    return { data, meta: { page, limit, total } };
};

const listActivityLogs = async (input: unknown) => {
    const query = validatePayload(listQuerySchema, input);
    const { page, limit, skip } = pageOptions(query);
    const where: Prisma.ActivityLogWhereInput = query.search ? {
        OR: [
            { action: { contains: query.search } },
            { entityType: { contains: query.search } },
            { actorEmail: { contains: query.search } },
        ],
    } : {};
    const [data, total] = await Promise.all([
        prisma.activityLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
        prisma.activityLog.count({ where }),
    ]);
    return { data, meta: { page, limit, total } };
};

const listUsers = async (input: unknown) => {
    const query = validatePayload(userListQuerySchema, input);
    const { page, limit, skip } = pageOptions(query);
    const where: Prisma.AuthWhereInput = {
        role: query.role,
        ...(query.search ? { email: { contains: query.search } } : {}),
    };
    const [accounts, total] = await Promise.all([
        prisma.auth.findMany({
            where,
            skip,
            take: limit,
            orderBy: { email: 'asc' },
            select: {
                id: true,
                email: true,
                role: true,
                userId: true,
                isDemo: true,
            },
        }),
        prisma.auth.count({ where }),
    ]);
    const users = await Promise.all(accounts.map(async (account) => {
        const [doctorProfile, patientProfile] = account.userId
            ? await Promise.all([
                prisma.doctor.findUnique({
                    where: { id: account.userId },
                    select: {
                        email: true, firstName: true, lastName: true, createdAt: true,
                        approvalStatus: true,
                    },
                }),
                prisma.patient.findUnique({
                    where: { id: account.userId },
                    select: { email: true, firstName: true, lastName: true, createdAt: true, isActive: true },
                }),
            ])
            : [null, null];
        const person = account.role === 'doctor' && doctorProfile
            ? doctorProfile
            : account.role === 'patient' && patientProfile
                ? patientProfile
                : doctorProfile || patientProfile;
        const availableRoles = ['admin'];
        if (doctorProfile?.email === account.email && doctorProfile.approvalStatus === 'APPROVED') {
            availableRoles.push('doctor');
        }
        if (patientProfile?.email === account.email && patientProfile.isActive) {
            availableRoles.push('patient');
        }
        return {
            id: account.id,
            email: account.email,
            role: account.role,
            userId: account.userId,
            isDemo: account.isDemo,
            name: person ? `${person.firstName} ${person.lastName}` : null,
            createdAt: person?.createdAt || null,
            accountStatus: person && 'approvalStatus' in person
                ? person.approvalStatus
                : person && 'isActive' in person
                    ? person.isActive ? 'ACTIVE' : 'INACTIVE'
                    : account.role === 'super_admin' ? 'PROTECTED' : 'ADMIN',
            availableRoles: account.role === 'super_admin' ? [] : availableRoles,
        };
    }));
    return { data: users, meta: { page, limit, total } };
};

const changeUserRole = async (actor: Actor, id: string, body: unknown) => {
    const accountId = validatePayload(uuidSchema, id);
    const { role } = validatePayload(userRoleSchema, body);
    return prisma.$transaction(async (tx) => {
        const account = await tx.auth.findUnique({ where: { id: accountId } });
        if (!account) {
            throw new ApiError(httpStatus.NOT_FOUND, 'User account was not found.');
        }
        if (account.role === 'super_admin') {
            throw new ApiError(httpStatus.FORBIDDEN, 'Super Admin accounts cannot be changed through user management.');
        }
        if (account.role === role) {
            throw new ApiError(httpStatus.CONFLICT, `The account already has the ${role} role.`);
        }
        if (role === 'doctor') {
            const doctor = account.userId
                ? await tx.doctor.findUnique({ where: { id: account.userId }, select: { email: true, approvalStatus: true } })
                : null;
            if (!doctor || doctor.email !== account.email || doctor.approvalStatus !== 'APPROVED') {
                throw new ApiError(httpStatus.BAD_REQUEST, 'This account does not have an approved doctor profile.');
            }
        }
        if (role === 'patient') {
            const patient = account.userId
                ? await tx.patient.findUnique({ where: { id: account.userId }, select: { email: true, isActive: true } })
                : null;
            if (!patient || patient.email !== account.email || !patient.isActive) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'This account does not have an active patient profile.');
            }
        }
        const change = await tx.auth.updateMany({
            where: { id: accountId, role: account.role },
            data: { role, isDemo: false },
        });
        if (change.count !== 1) {
            throw new ApiError(httpStatus.CONFLICT, 'The user role changed while this action was being processed.');
        }
        const updated = await tx.auth.findUnique({
            where: { id: accountId },
            select: { id: true, email: true, role: true },
        });
        if (!updated) {
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'The user role update could not be confirmed.');
        }
        await tx.activityLog.create({
            data: logAction(actor, 'user.role_changed', 'auth', accountId, { from: account.role, to: role }),
        });
        return updated;
    });
};

export const SuperAdminService = {
    dashboard,
    listDoctors,
    getDoctor,
    changeDoctorStatus,
    listPatients,
    setPatientStatus,
    listAppointments,
    listActivityLogs,
    listUsers,
    changeUserRole,
};
