import moment from 'moment';
import { z } from 'zod';

const nameSchema = z.string().trim().min(1).max(50);
const appointmentDate = z.string().trim().refine(
    (value) => moment(value, ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD', moment.ISO_8601]).isValid(),
    'Select a valid appointment date and time'
);

export const appointmentCreateSchema = z.object({
    patientInfo: z.object({
        firstName: nameSchema,
        lastName: nameSchema,
        email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
        phone: z.string().trim().min(8).max(20),
        address: z.string().trim().max(250).optional().nullable(),
        reasonForVisit: z.string().trim().min(1).max(1000),
        description: z.string().trim().max(1000).optional().nullable(),
        doctorId: z.string().optional().nullable(),
        patientId: z.string().optional().nullable(),
        scheduleDate: appointmentDate,
        scheduleTime: z.string().trim().min(1).max(50),
        patientType: z.string().trim().max(50).optional().nullable(),
    }).passthrough(),
    payment: z.object({
        paymentMethod: z.enum(['paypal', 'payoneer', 'cash', 'demo', 'card', 'upi']).or(z.string()),
        paymentType: z.enum(['creditCard', 'cash', 'online', 'upi']).or(z.string()),
    }).passthrough(),
}).passthrough();

const appointmentStatus = z.enum([
    'pending', 'scheduled', 'Completed', 'Canceled', 'Follow-up', 'Follow-up Scheduled', 'FollowUp',
    'cancel', 'canceled', 'archived', 'InProgress', 'confirmed', 'Patient Not Came', 'Not Attended', 'No-Show'
]);

export const appointmentAdminUpdateSchema = z.object({
    status: appointmentStatus.optional(),
    paymentStatus: z.enum(['paid', 'unpaid']).optional(),
    prescriptionStatus: z.enum(['issued', 'notIssued']).optional(),
    isFollowUp: z.boolean().optional(),
    patientType: z.string().trim().max(40).nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update');

const appointmentDoctorUpdateFields = z.object({
    status: appointmentStatus.optional(),
    isFollowUp: z.boolean().optional(),
    patientType: z.string().trim().max(40).nullable().optional(),
    prescriptionStatus: z.enum(['issued', 'notIssued']).optional(),
    reasonForVisit: z.string().trim().max(1000).optional(),
    description: z.string().trim().max(1000).optional(),
    scheduleDate: z.string().trim().optional(),
    scheduleTime: z.string().trim().optional(),
}).strict();

export const appointmentDoctorUpdateSchema = appointmentDoctorUpdateFields
    .refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update');
export const appointmentDoctorUpdateWithIdSchema = appointmentDoctorUpdateFields.extend({
    id: z.string().uuid(),
}).strict().refine(({ id, ...value }) => Object.keys(value).length > 0, 'Provide at least one field to update');

export const appointmentPatientUpdateSchema = z.object({
    status: z.enum(['cancel', 'canceled']),
}).strict();

export const appointmentTrackingSchema = z.object({
    id: z.string().trim().min(16).max(64).regex(/^[A-Fa-f0-9]+$/, 'Enter a valid tracking ID'),
}).strict();

export const appointmentDoctorListQuerySchema = z.object({
    sortBy: z.enum(['today', 'upcoming']).optional(),
}).strict();
