import { Patient, Prisma } from "@prisma/client";
import prisma from "../../../shared/prisma";
import { create } from "./patientService";
import { IUpload } from "../../../interfaces/file";
import { Request } from "express";
import { CloudinaryHelper } from "../../../helpers/uploadHelper";
import ApiError from "../../../errors/apiError";
import httpStatus from "http-status";
import { parseJsonPayload, uuidSchema, validatePayload } from "../../../helpers/validation";
import { patientMedicalHistorySchema, patientProfileUpdateSchema } from "./patient.validation";
const createPatient = async (payload: any): Promise<any> => {
    const result = await create(payload)
    return result;
}

const getAllPatients = async (): Promise<Patient[] | null> => {
    const result = await prisma.patient.findMany();
    return result;
}

const getPatient = async (id: string): Promise<Patient | null> => {
    id = validatePayload(uuidSchema, id);
    const result = await prisma.patient.findUnique({
        where: {
            id: id
        }
    });
    return result;
}

const deletePatient = async (id: string): Promise<any> => {
    id = validatePayload(uuidSchema, id);
    const result = await prisma.$transaction(async (tx) => {
        const patient = await tx.patient.delete({
            where: {
                id: id
            }
        });
        await tx.auth.delete({
            where: {
                email: patient.email
            }
        })
    });
    return result;
}

// : Promise<Patient>
const updatePatient = async (req: Request): Promise<Patient | null> => {
    const file = req.file as IUpload;
    const id = validatePayload(uuidSchema, req.params.id);
    const user = validatePayload(patientProfileUpdateSchema, parseJsonPayload(req.body.data));
    let updateData: Prisma.PatientUpdateInput = user;
    if (file) {
        const uploadImage = await CloudinaryHelper.uploadFile(file);
        if (uploadImage) {
            updateData = { ...user, img: uploadImage.secure_url };
        } else {
            throw new ApiError(httpStatus.EXPECTATION_FAILED, 'Failed to updateImage !!')
        }
    }
    const result = await prisma.patient.update({
        where: { id },
        data: updateData
    })
    return result;
}

const getMedicalHistory = async (patientId: string, user: any) => {
    const validatedId = validatePayload(uuidSchema, patientId);
    if (user.role === 'patient' && user.userId !== validatedId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to view this medical history');
    }
    if (user.role === 'doctor') {
        const hasAppointment = await prisma.appointments.findFirst({
            where: {
                doctorId: user.userId,
                patientId: validatedId,
            },
        });
        if (!hasAppointment) {
            throw new ApiError(httpStatus.FORBIDDEN, 'You can only view medical records of your own patients');
        }
    }

    let history = await prisma.patientMedicalHistory.findUnique({
        where: { patientId: validatedId },
    });

    if (!history) {
        const patient = await prisma.patient.findUnique({
            where: { id: validatedId },
            select: { bloodGroup: true }
        });
        history = await prisma.patientMedicalHistory.create({
            data: {
                patientId: validatedId,
                bloodGroup: patient?.bloodGroup || null,
            }
        });
    }

    return history;
};

const updateMedicalHistory = async (patientId: string, user: any, payload: any) => {
    const validatedId = validatePayload(uuidSchema, patientId);
    if (user.role === 'patient' && user.userId !== validatedId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to update this medical history');
    }

    const validated = validatePayload(patientMedicalHistorySchema, payload);

    const history = await prisma.patientMedicalHistory.upsert({
        where: { patientId: validatedId },
        update: validated,
        create: {
            patientId: validatedId,
            ...validated,
        },
    });

    if (validated.bloodGroup) {
        await prisma.patient.update({
            where: { id: validatedId },
            data: { bloodGroup: validated.bloodGroup },
        });
    }

    return history;
};

export const PatientService = {
    createPatient,
    updatePatient,
    getPatient,
    getAllPatients,
    deletePatient,
    getMedicalHistory,
    updateMedicalHistory,
}