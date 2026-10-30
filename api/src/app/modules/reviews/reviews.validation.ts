import { z } from 'zod';

const reviewFields = {
    description: z.string().trim().min(10).max(2000),
    star: z.union([
        z.enum(['1', '2', '3', '4', '5']),
        z.number().int().min(1).max(5).transform(String),
    ]),
    isRecommended: z.boolean(),
};

export const createReviewSchema = z.object({
    ...reviewFields,
    doctorId: z.string().uuid(),
}).strict();

export const updateReviewSchema = z.object(reviewFields).partial().strict()
    .refine((value) => Object.keys(value).length > 0, 'Provide at least one review field to update');

export const reviewReplySchema = z.object({
    response: z.string().trim().min(1).max(2000),
}).strict();

export const reviewListQuerySchema = z.object({
    limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(100000)).optional(),
}).strict();
