import { Gender } from '@prisma/client';
import { z } from 'zod';
import { isValidPassword } from '../../../helpers/registrationValidation';

const optionalText = (maxLength: number) => z.string().trim().max(maxLength).nullable().optional();
const optionalName = z.string().trim().min(1).max(100)
    .regex(/^[\p{L}\p{M}]+(?:[ '-][\p{L}\p{M}]+)*$/u, 'Enter a valid name')
    .optional();

const optionalPhone = z.string()
    .trim()
    .max(25)
    .refine((value) => {
        if (!value || value.trim() === '') return true;
        const cleaned = value.replace(/[\s()\-.]/g, '');
        // Allow formats: +919876543210, 9876543210 (10 digits), 09876543210, or international 8-15 digits
        return /^(?:\+?[1-9]\d{7,14}|0\d{9,11})$/.test(cleaned);
    }, 'Enter a valid phone number (10-15 digits, optionally with country code)')
    .nullable()
    .optional();

const optionalBiography = z.string()
    .trim()
    .max(5000)
    .refine((value) => {
        if (!value || value.trim() === '') return true;
        return value.trim().length >= 20;
    }, 'Biography must be at least 20 characters describing your clinical background')
    .nullable()
    .optional();

const optionalGender = z.union([
    z.nativeEnum(Gender),
    z.string().trim().toLowerCase().pipe(z.nativeEnum(Gender))
]).nullable().optional();

const optionalPrice = z.union([
    z.string().trim().regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid non-negative price'),
    z.number().finite().nonnegative()
]).refine((value) => Number(value) <= 1000000, 'Consultation fee cannot exceed 1,000,000')
    .transform(String).nullable().optional();

const doctorProfileFields = {
    firstName: optionalName,
    lastName: optionalName,
    email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()).optional(),
    address: optionalText(500),
    img: optionalText(2048),
    phone: optionalPhone,
    gender: optionalGender,
    dob: optionalText(50),
    biography: optionalBiography,
    clinicName: optionalText(200),
    clinicAddress: optionalText(500),
    clinicImages: optionalText(2048),
    city: optionalText(100),
    state: optionalText(100),
    country: optionalText(100),
    postalCode: optionalText(20),
    price: optionalPrice,
    services: z.string().trim().max(1000).nullable().optional(),
    specialization: optionalText(200),
    degree: optionalText(200),
    college: optionalText(200),
    completionYear: optionalText(10),
    experience: optionalText(1000),
    designation: optionalText(200),
    award: optionalText(1000),
    awardYear: optionalText(10),
    registration: optionalText(200),
    year: optionalText(10),
    experienceHospitalName: optionalText(200),
    expericenceStart: optionalText(10),
    expericenceEnd: optionalText(10),
    secondarySpecializations: optionalText(500),
    registrationCouncil: optionalText(200),
    languages: optionalText(500),
    onlineConsultation: z.boolean().optional(),
    inPersonConsultation: z.boolean().optional(),
    hospitalName: optionalText(200),
    hospitalAddress: optionalText(500),
    verified: z.union([
        z.boolean(),
        z.enum(['true', 'false']).transform((v) => v === 'true'),
    ]).optional(),
};

export const doctorEducationSchema = z.object({
    degree: z.string().trim().min(1, 'Degree is required').max(100),
    specialization: optionalText(100),
    college: z.string().trim().min(1, 'College is required').max(200),
    startYear: optionalText(10),
    completionYear: optionalText(10),
    certificateUrl: optionalText(2048),
});

export const doctorExperienceSchema = z.object({
    hospitalName: z.string().trim().min(1, 'Hospital name is required').max(200),
    organization: optionalText(200),
    designation: z.string().trim().min(1, 'Designation is required').max(100),
    department: optionalText(100),
    startDate: optionalText(20),
    endDate: optionalText(20),
    isCurrent: z.boolean().optional().default(false),
    description: optionalText(2000),
});

export const doctorAwardSchema = z.object({
    title: z.string().trim().min(1, 'Title is required').max(200),
    organization: optionalText(200),
    year: optionalText(10),
    certificateUrl: optionalText(2048),
});

export const doctorRegistrationSchema = z.object({
    ...doctorProfileFields,
    firstName: z.string().trim().min(1).max(100).regex(/^[\p{L}\p{M}]+(?:[ '-][\p{L}\p{M}]+)*$/u, 'Enter a valid first name'),
    lastName: z.string().trim().min(1).max(100).regex(/^[\p{L}\p{M}]+(?:[ '-][\p{L}\p{M}]+)*$/u, 'Enter a valid last name'),
    email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
    password: z.string().refine(isValidPassword, 'Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol'),
    specialization: z.string().trim().min(1).max(200),
}).strict();

export const doctorProfileUpdateSchema = z.object(doctorProfileFields);

const optionalQueryText = z.string().trim().min(1).max(100).optional();
const optionalMoneyFilter = z.string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid non-negative price')
    .optional();

export const doctorFilterSchema = z.object({
    searchTerm: optionalQueryText,
    firstName: optionalQueryText,
    lastName: optionalQueryText,
    gender: z.nativeEnum(Gender).optional(),
    city: optionalQueryText,
    min: optionalMoneyFilter,
    max: optionalMoneyFilter,
    specialist: optionalQueryText,
}).strict().refine((filters) => {
    if (filters.min !== undefined && filters.max !== undefined) {
        return Number(filters.min) <= Number(filters.max);
    }
    return true;
}, { message: 'Minimum price cannot be greater than maximum price', path: ['min'] });

const optionalPositiveInteger = (maximum: number) => z.string()
    .regex(/^\d+$/, 'Must be a positive whole number')
    .transform(Number)
    .pipe(z.number().int().positive().max(maximum))
    .optional();

export const doctorPaginationSchema = z.object({
    page: optionalPositiveInteger(100000),
    limit: optionalPositiveInteger(100),
    sortBy: z.enum(['createdAt', 'firstName', 'lastName', 'price']).optional(),
    sortOrder: z.enum(['asc', 'desc', 'dsc']).transform((value) => value === 'desc' ? 'dsc' : value).optional(),
}).strict();
