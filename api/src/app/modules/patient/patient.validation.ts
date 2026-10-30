import moment from 'moment';
import { z } from 'zod';

const name = z.string().trim().min(1).max(80)
    .regex(/^[\p{L}\p{M}]+(?:[ '-][\p{L}\p{M}]+)*$/u, 'Enter a valid name');
const optionalText = (max: number) => z.string().trim().max(max).optional();

export const patientProfileUpdateSchema = z.object({
    firstName: name.optional(),
    lastName: name.optional(),
    dateOfBirth: z.string().trim().optional().transform((value) => {
        if (value === undefined || value === '') return undefined;
        return value;
    }).refine((value) => value === undefined || moment(value, moment.ISO_8601, true).isValid(), 'Enter a valid date of birth')
        .refine((value) => value === undefined || !moment(value).isAfter(moment(), 'day'), 'Date of birth cannot be in the future')
        .transform((value) => value === undefined ? undefined : new Date(value)),
    bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).nullable().optional(),
    mobile: z.string().trim().max(25)
        .refine((value) => {
            if (!value || value.trim() === '') return true;
            const cleaned = value.replace(/[\s()\-.]/g, '');
            return /^(?:\+?[1-9]\d{7,14}|0\d{9,11})$/.test(cleaned);
        }, 'Enter a valid phone number (10-15 digits, optionally with country code)')
        .nullable().optional(),
    city: optionalText(100).nullable(),
    state: optionalText(100).nullable(),
    zipCode: optionalText(20).nullable(),
    gender: z.enum(['male', 'female', 'other']).nullable().optional(),
    country: optionalText(100).nullable(),
    address: optionalText(500).nullable(),
}).strict().refine((value) => Object.keys(value).length > 0, 'Provide at least one profile field to update');

export const patientMedicalHistorySchema = z.object({
    bloodGroup: z.string().trim().max(10).optional().nullable(),
    allergies: z.string().trim().max(2000).optional().nullable(),
    previousDiseases: z.string().trim().max(2000).optional().nullable(),
    existingConditions: z.string().trim().max(2000).optional().nullable(),
    currentMedications: z.string().trim().max(2000).optional().nullable(),
    previousSurgeries: z.string().trim().max(2000).optional().nullable(),
    familyHistory: z.string().trim().max(2000).optional().nullable(),
    previousTreatments: z.string().trim().max(2000).optional().nullable(),
    notes: z.string().trim().max(2000).optional().nullable(),
});
