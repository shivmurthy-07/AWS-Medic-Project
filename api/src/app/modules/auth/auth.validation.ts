import { z } from 'zod';
import { isValidPassword } from '../../../helpers/registrationValidation';

const usernamePattern = /^[a-zA-Z0-9][a-zA-Z0-9._-]{2,63}$/;
const loginIdentifierSchema = z.string()
    .trim()
    .min(3)
    .max(254)
    .refine((value) => z.string().email().safeParse(value).success || usernamePattern.test(value), {
        message: 'Enter a valid email address or username',
    })
    .transform((identifier) => identifier.toLowerCase());

export const loginSchema = z.object({
    email: loginIdentifierSchema,
    password: z.string().min(1).max(128),
}).strict();

export const resetPasswordSchema = z.object({
    email: z.string().trim().email('Enter a valid email address').max(254).transform((email) => email.toLowerCase()),
}).strict();

export const forgotPasswordSchema = resetPasswordSchema;

export const validateResetTokenSchema = z.object({
    token: z.string().trim().min(1, 'Reset token is required').max(256),
}).strict();

export const resetPasswordWithTokenSchema = z.object({
    token: z.string().trim().min(1, 'Reset token is required').max(256),
    password: z.string().refine(isValidPassword, 'Password must be 8 to 128 characters and include uppercase, lowercase, a number, and a symbol'),
}).strict();

export const passwordResetConfirmSchema = z.object({
    userId: z.string().uuid(),
    uniqueString: z.string().min(1).max(2000),
    password: z.string().refine(isValidPassword, 'Password must be 8 to 128 characters and include uppercase, lowercase, a number, and a symbol'),
}).strict();
