import { z } from 'zod';

const medicineFields = {
    medicine: z.string().trim().min(1).max(200),
    dosage: z.string().trim().min(1).max(100),
    frequency: z.string().trim().min(1).max(100),
    duration: z.string().trim().min(1).max(100),
};

const medicineSchema = z.object({
    ...medicineFields,
    prescriptionId: z.string().uuid(),
}).strict();

export const createMedicinesSchema = z.array(medicineSchema).min(1).max(30);

export const updateMedicineSchema = z.object({
    ...medicineFields,
    id: z.string().uuid(),
}).strict();
