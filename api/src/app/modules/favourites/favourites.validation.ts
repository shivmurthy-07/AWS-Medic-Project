import { z } from 'zod';

export const favouriteSchema = z.object({
    doctorId: z.string().uuid(),
}).strict();
