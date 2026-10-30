import { z } from 'zod';

export const createSpecializationSchema = z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    description: z.string().trim().max(1000).optional().nullable(),
    isActive: z.boolean().optional().default(true),
});

export const updateSpecializationSchema = z.object({
    name: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().max(1000).optional().nullable(),
    isActive: z.boolean().optional(),
});

export const createServiceSchema = z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
    code: z.string().trim().max(50).optional().nullable(),
    appointmentMode: z.enum(['ONLINE', 'IN_PERSON', 'BOTH']).default('BOTH'),
    description: z.string().trim().max(1000).optional().nullable(),
    isActive: z.boolean().optional().default(true),
});

export const updateServiceSchema = z.object({
    name: z.string().trim().min(2).max(120).optional(),
    code: z.string().trim().max(50).optional().nullable(),
    appointmentMode: z.enum(['ONLINE', 'IN_PERSON', 'BOTH']).optional(),
    description: z.string().trim().max(1000).optional().nullable(),
    isActive: z.boolean().optional(),
});

export const setSpecializationFeeSchema = z.object({
    specializationId: z.string().uuid(),
    serviceId: z.string().uuid(),
    mode: z.enum(['ONLINE', 'IN_PERSON', 'BOTH']).default('IN_PERSON'),
    fee: z.number().min(0, 'Fee must be non-negative'),
    isActive: z.boolean().optional().default(true),
});

export const setDoctorFeeSchema = z.object({
    doctorId: z.string().uuid(),
    serviceId: z.string().uuid(),
    mode: z.enum(['ONLINE', 'IN_PERSON', 'BOTH']).default('IN_PERSON'),
    fee: z.number().min(0, 'Fee must be non-negative'),
    isActive: z.boolean().optional().default(true),
});

export const createFeeChangeRequestSchema = z.object({
    serviceId: z.string().uuid(),
    mode: z.enum(['ONLINE', 'IN_PERSON', 'BOTH']).default('IN_PERSON'),
    proposedFee: z.number().min(0, 'Fee must be non-negative'),
    reason: z.string().trim().min(5, 'Reason must be at least 5 characters').max(1000),
});

export const reviewFeeChangeRequestSchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
    adminComment: z.string().trim().max(1000).optional().nullable(),
});

