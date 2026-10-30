import { z, ZodTypeAny } from 'zod';
import ApiError from '../errors/apiError';
import httpStatus from 'http-status';

export const validatePayload = <T extends ZodTypeAny>(schema: T, payload: unknown): z.infer<T> => {
    const result = schema.safeParse(payload);
    if (!result.success) {
        const message = result.error.issues
            .map((issue) => {
                const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
                return `${path}${issue.message}`;
            })
            .join('; ');
        throw new ApiError(httpStatus.BAD_REQUEST, `Validation failed: ${message}`);
    }
    return result.data;
};

export const uuidSchema = z.string().uuid();

export const parseJsonPayload = (payload: unknown, fieldName = 'Request data'): unknown => {
    if (typeof payload !== 'string') {
        throw new ApiError(httpStatus.BAD_REQUEST, `${fieldName} must be valid JSON.`);
    }

    try {
        return JSON.parse(payload);
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new ApiError(httpStatus.BAD_REQUEST, `${fieldName} must be valid JSON.`);
        }
        throw error;
    }
};
