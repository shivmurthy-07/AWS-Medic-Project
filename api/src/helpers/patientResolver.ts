import { Prisma } from '@prisma/client';
import prisma from '../shared/prisma';

/**
 * Resolves a registered Patient record ID from an explicit patientId, email, or unique 10-digit phone number.
 */
export async function resolveRegisteredPatientId(
    params: {
        patientId?: string | null;
        email?: string | null;
        phone?: string | null;
    },
    tx: Prisma.TransactionClient | typeof prisma = prisma
): Promise<string | null> {
    if (params.patientId) {
        const byId = await tx.patient.findUnique({
            where: { id: params.patientId },
            select: { id: true },
        });
        if (byId) return byId.id;
    }

    const normalizedEmail = params.email?.trim().toLowerCase();
    if (normalizedEmail) {
        const byEmail = await tx.patient.findFirst({
            where: { email: normalizedEmail },
            select: { id: true },
        });
        if (byEmail) return byEmail.id;
    }

    const rawDigits = params.phone?.replace(/\D/g, '');
    if (rawDigits && rawDigits.length >= 10) {
        const last10 = rawDigits.slice(-10);
        const candidates = await tx.patient.findMany({
            where: { mobile: { contains: last10 } },
            select: { id: true },
            take: 2,
        });
        if (candidates.length === 1) {
            return candidates[0].id;
        }
    }

    return null;
}
