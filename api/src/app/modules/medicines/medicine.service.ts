import { Medicine } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/apiError";
import httpStatus from "http-status";
import { validatePayload, uuidSchema } from "../../../helpers/validation";
import { createMedicinesSchema, updateMedicineSchema } from "./medicine.validation";

const createMedicine = async (payload: Medicine[], user: any): Promise<{message : string}> => {
    payload = validatePayload(createMedicinesSchema, payload) as Medicine[];
    const prescriptionIds = [...new Set(payload.map((medicine) => medicine.prescriptionId))];
    const ownedPrescriptions = await prisma.prescription.findMany({
        where: { id: { in: prescriptionIds }, doctorId: user.userId },
        select: { id: true }
    });
    if (ownedPrescriptions.length !== prescriptionIds.length) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorised to add medicines to this prescription.');
    }
    const createMedicinePromise = payload.map((medicine: Medicine) =>
        prisma.medicine.create({
            data: {
                dosage: medicine.dosage,
                duration: medicine.duration,
                frequency: medicine.frequency,
                medicine: medicine.medicine,
                prescriptionId: medicine.prescriptionId
            }
        })
    )
    await prisma.$transaction(createMedicinePromise);
    return {
        message: "Successfully medicine added"
    }
}

const updateMedicine = async (payload: Medicine, user: any): Promise<Medicine> => {
    payload = validatePayload(updateMedicineSchema, payload) as Medicine;
    const existingMedicine = await prisma.medicine.findUnique({
        where: {
            id: payload.id
        },
        include: { prescription: { select: { doctorId: true } } }
    });
    if (!existingMedicine) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Medicine was not found.');
    }
    if (existingMedicine.prescription.doctorId !== user.userId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorised to update this medicine.');
    }

    const result = await prisma.medicine.update({
        where: {
            id: payload.id
        },
        data: {
            dosage: payload.dosage,
            duration: payload.duration,
            frequency: payload.frequency,
            medicine: payload.medicine
        }
    })
    return result;

}

const deleteMedicine = async (id: string, user: any): Promise<Medicine> => {
    id = validatePayload(uuidSchema, id);
    const existingMedicine = await prisma.medicine.findUnique({
        where: { id },
        include: { prescription: { select: { doctorId: true } } }
    });
    if (!existingMedicine) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Medicine was not found.');
    }
    if (existingMedicine.prescription.doctorId !== user.userId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorised to delete this medicine.');
    }
    const result = await prisma.medicine.delete({where: {id}})
    return result;
}

export const MedicineService = {
    updateMedicine,
    createMedicine,
    deleteMedicine
}