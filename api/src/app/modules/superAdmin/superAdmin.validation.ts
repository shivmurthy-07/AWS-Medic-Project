import { DoctorApprovalStatus } from '@prisma/client';
import { z } from 'zod';

const page = z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive().max(100000)).optional();
const limit = z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive().max(100)).optional();
const search = z.string().trim().min(1).max(100).optional();

export const listQuerySchema = z.object({
    page,
    limit,
    search,
}).strict();

export const doctorListQuerySchema = listQuerySchema.extend({
    status: z.nativeEnum(DoctorApprovalStatus).optional(),
}).strict();

export const userListQuerySchema = listQuerySchema.extend({
    role: z.enum(['admin', 'doctor', 'patient']).optional(),
}).strict();

export const userRoleSchema = z.object({
    role: z.enum(['admin', 'doctor', 'patient']),
}).strict();

export const appointmentListQuerySchema = listQuerySchema.extend({
    status: z.string().trim().min(1).max(30).optional(),
    from: z.string().date().optional(),
    to: z.string().date().optional(),
}).strict().refine((query) => !query.from || !query.to || query.from <= query.to, {
    message: 'Start date cannot be after end date',
    path: ['from'],
});

export const rejectDoctorSchema = z.object({
    reason: z.string().trim().min(10).max(1000),
}).strict();

export const patientStatusSchema = z.object({
    isActive: z.boolean(),
}).strict();
