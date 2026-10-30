import { z } from 'zod';

export const createBlogSchema = z.object({
    title: z.string().trim().min(3).max(200),
    description: z.string().trim().min(10).max(20000),
}).strict();

export const updateBlogSchema = createBlogSchema.partial()
    .refine((value) => Object.keys(value).length > 0, 'Provide a title or description to update');

export const blogListQuerySchema = z.object({
    searchTerm: z.string().trim().max(100).optional().transform((val) => (val && val.length > 0 ? val : undefined)),
    title: z.string().trim().max(200).optional().transform((val) => (val && val.length > 0 ? val : undefined)),
    description: z.string().trim().max(200).optional().transform((val) => (val && val.length > 0 ? val : undefined)),
    limit: z.union([z.string().regex(/^\d+$/).transform(Number), z.number()]).pipe(z.number().int().min(1).max(100)).optional(),
    page: z.union([z.string().regex(/^\d+$/).transform(Number), z.number()]).pipe(z.number().int().min(1).max(100000)).optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'title']).optional(),
    sortOrder: z.enum(['asc', 'desc', 'dsc']).transform((value) => value === 'asc' ? 'asc' : 'dsc').optional(),
}).strip();
