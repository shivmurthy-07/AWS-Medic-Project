import { z } from 'zod';

const nameSchema = z.string().trim().min(1).max(80)
    .regex(/^[\p{L}\p{M}]+(?:[ '-][\p{L}\p{M}]+)*$/u, 'Enter a valid name');

export const contactPayloadSchema = z.object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
    subject: z.string().trim().min(3).max(150),
    text: z.string().trim().min(10).max(5000),
}).strict();
