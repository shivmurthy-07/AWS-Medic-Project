import moment from 'moment';
import { z } from 'zod';

const appointmentStatus = z.enum([
    'pending', 'scheduled', 'cancel', 'confirmed', 'InProgress', 'Completed', 'FollowUp', 'archived',
]);
const patientStatus = z.enum([
    'Stable', 'Critical', 'Serious', 'Guarded', 'Unstable', 'Recovering',
    'Critical but Stable', 'Comfort Measures Only (CMO)', 'Acute', 'Chronic', 'Outpatient', 'Inpatient',
]);
const optionalDate = z.string().trim().optional().refine(
    (value) => value === undefined || value === '' || moment(value, moment.ISO_8601, true).isValid(),
    'Enter a valid follow-up date'
).refine(
    (value) => value === undefined || value === '' || moment(value).isSameOrAfter(moment().startOf('day')),
    'Follow-up date cannot be in the past'
).transform((value) => value === '' ? undefined : value);

const medicineInputSchema = z.object({
    id: z.number().int().positive().optional(),
    medicine: z.string().trim().min(1).max(200),
    dosage: z.string().trim().min(1).max(100),
    frequency: z.string().trim().min(1).max(100),
    duration: z.string().trim().min(1).max(100),
}).strict();

const prescriptionFields = {
    followUpdate: optionalDate,
    instruction: z.string().trim().max(5000).optional(),
    isFullfilled: z.boolean().optional(),
    isArchived: z.boolean().optional(),
    daignosis: z.string().trim().max(2000).optional(),
    disease: z.string().trim().min(1).max(2000),
    test: z.string().trim().max(2000).optional(),
};

export const createPrescriptionSchema = z.object({
    ...prescriptionFields,
    appointmentId: z.string().uuid(),
    status: appointmentStatus,
    patientType: patientStatus,
    medicine: z.array(medicineInputSchema).min(1).max(30),
}).strict();

export const updatePrescriptionAndAppointmentSchema = z.object({
    prescriptionId: z.string().uuid(),
    followUpdate: optionalDate,
    status: appointmentStatus.optional(),
    patientType: patientStatus.optional(),
    instruction: z.string().trim().max(5000).optional(),
    isFullfilled: z.boolean().optional(),
    isArchived: z.boolean().optional(),
    daignosis: z.string().trim().max(2000).optional(),
    disease: z.string().trim().min(1).max(2000).optional(),
    test: z.string().trim().max(2000).optional(),
}).strict().refine(({ prescriptionId, ...values }) => Object.keys(values).length > 0, 'Provide at least one field to update');

export const updatePrescriptionSchema = z.object({
    followUpdate: optionalDate,
    instruction: z.string().trim().max(5000).optional(),
    isFullfilled: z.boolean().optional(),
    isArchived: z.boolean().optional(),
    daignosis: z.string().trim().max(2000).optional(),
    disease: z.string().trim().min(1).max(2000).optional(),
    test: z.string().trim().max(2000).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update');
