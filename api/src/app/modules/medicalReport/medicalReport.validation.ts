import { z } from 'zod';

export const createMedicalReportSchema = z.object({
    appointmentId: z.string().uuid().optional().nullable(),
    patientId: z.string().uuid().optional(),
    doctorId: z.string().uuid().optional().nullable(),
    reportType: z.string().trim().min(1, 'Report type is required'),
    reportTitle: z.string().trim().min(1, 'Report title is required').max(200),
    category: z.enum(['IMAGING', 'LAB', 'GENERAL', 'OTHER']).optional().default('GENERAL'),
    hospitalOrLab: z.string().trim().max(255).optional().nullable(),
    testDate: z.string().optional().nullable(),
    doctorComments: z.string().trim().max(2000).optional().nullable(),
    recordResults: z.any().optional().nullable(),
    fileSize: z.number().optional().nullable(),
    fileMimeType: z.string().trim().max(100).optional().nullable(),
    description: z.string().trim().max(2000).optional().nullable(),
    reportDate: z.string().optional().nullable(),
    fileUrl: z.string().trim().optional().nullable(),
    fileName: z.string().trim().max(255).optional().nullable(),
    uploadedBy: z.enum(['doctor', 'patient']).optional(),
    status: z.string().trim().max(50).optional().nullable(),
}).passthrough();

export const updateMedicalReportSchema = z.object({
    appointmentId: z.string().uuid().optional().nullable(),
    reportType: z.string().trim().min(1).optional(),
    reportTitle: z.string().trim().min(1).max(200).optional(),
    category: z.enum(['IMAGING', 'LAB', 'GENERAL', 'OTHER']).optional(),
    hospitalOrLab: z.string().trim().max(255).optional().nullable(),
    testDate: z.string().optional().nullable(),
    doctorComments: z.string().trim().max(2000).optional().nullable(),
    recordResults: z.any().optional().nullable(),
    description: z.string().trim().max(2000).optional().nullable(),
    reportDate: z.string().optional().nullable(),
    fileUrl: z.string().trim().optional().nullable(),
    fileName: z.string().trim().max(255).optional().nullable(),
    status: z.string().trim().max(50).optional().nullable(),
}).passthrough();

