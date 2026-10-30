import httpStatus from "http-status";
import ApiError from "../../../errors/apiError";
import prisma from "../../../shared/prisma";
import { Prescription } from "@prisma/client";
import { validatePayload, uuidSchema } from "../../../helpers/validation";
import {
    createPrescriptionSchema,
    updatePrescriptionAndAppointmentSchema,
    updatePrescriptionSchema,
} from "./prescription.validation";

const createPrescription = async (user: any, paylaod: any): Promise<{message: string}> => {
    const { medicine, appointmentId, followUpdate, status, patientType, ...prescriptionFields } =
        validatePayload(createPrescriptionSchema, paylaod);
    const { userId } = user;
    const isDoctor = await prisma.doctor.findUnique({
        where: {
            id: userId
        }
    })
    if (!isDoctor) { throw new ApiError(httpStatus.NOT_FOUND, 'Doctor Account is not found !!') }

    const isAppointment = await prisma.appointments.findUnique({
        where: {
            id: appointmentId
        }
    })
    if (!isAppointment) { throw new ApiError(httpStatus.NOT_FOUND, 'Appopintment is not found !!') }
    if (isAppointment.doctorId !== isDoctor.id) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorised to prescribe for this appointment.');
    }
    if (!isAppointment.patientId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'A prescription requires a registered patient account.');
    }
    const patientId = isAppointment.patientId;

    await prisma.$transaction(async (tx) => {
        await tx.appointments.update({
            where: {
                id: isAppointment.id
            },
            data: {
                isFollowUp: Boolean(followUpdate),
                status,
                patientType,
                prescriptionStatus: "issued"
            }
        })
        
        const prescription = await tx.prescription.create({
            data: {
                ...prescriptionFields,
                followUpdate,
                doctorId: isDoctor.id,
                patientId,
                appointmentId: isAppointment.id,
            }
        });

        const medicinePromise = medicine.map((medicine: any) =>
            tx.medicine.create({
                data: {
                    dosage: medicine.dosage,
                    duration: medicine.duration,
                    frequency: medicine.frequency,
                    medicine: medicine.medicine,
                    prescriptionId: prescription.id
                }
            })
        )
        await Promise.all(medicinePromise)
    })
    return {
        message: "Successfully Prescription Created"
    }
}
// Update Prescription and Appointment table 
const updatePrescriptionAndAppointment = async (user: any, paylaod: any): Promise<{message: string}> => {
    const { status, patientType, followUpdate, prescriptionId, ...others } =
        validatePayload(updatePrescriptionAndAppointmentSchema, paylaod);
    const { userId } = user;
    const isDoctor = await prisma.doctor.findUnique({
        where: {
            id: userId
        }
    })
    if (!isDoctor) { throw new ApiError(httpStatus.NOT_FOUND, 'Doctor Account is not found !!') }

    const isPrescribed = await prisma.prescription.findUnique({
        where: {
            id: prescriptionId
        }
    })
    if (!isPrescribed) { throw new ApiError(httpStatus.NOT_FOUND, 'Prescription is not found !!') }
    if (isPrescribed.doctorId !== isDoctor.id) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorised to update this prescription.');
    }

    await prisma.$transaction(async (tx) => {
        
        await tx.appointments.update({
            where: {
                id: isPrescribed.appointmentId
            },
            data: {
                isFollowUp: Boolean(followUpdate),
                status,
                patientType,
            }
        })
        
        await tx.prescription.update({
            where: {
                id: prescriptionId
            },
            data: {
                ...others,
            }
        });

    })
    return {
        message: "Successfully Prescription Updated"
    }
}

const getAllPrescriptions = async (): Promise<Prescription[] | null> => {
    const result = await prisma.prescription.findMany({
        include: {
            appointment: {
                select: {
                    trackingId: true
                }
            }
        }
    });
    return result;
}

const getPrescriptionById = async (id: string, user: any): Promise<Prescription | null> => {
    id = validatePayload(uuidSchema, id);
    const result = await prisma.prescription.findUnique({
        where: {
            id: id
        },
        include: {
            medicines: true,
            appointment: {
                select: {
                    scheduleDate: true,
                    scheduleTime: true,
                    status: true,
                    trackingId: true,
                }
            },
            doctor: {
                select: {
                    firstName: true,
                    lastName: true,
                    designation: true,
                    email: true,
                    college: true,
                    address: true,
                    country: true,
                    state: true,
                    specialization: true
                }
            },
            patient: {
                select: {
                    firstName: true,
                    lastName: true,
                    gender: true,
                    dateOfBirth: true,
                    email: true,
                    bloodGroup: true,
                    address: true,
                    img: true,
                    city: true,
                }
            }
        }
    });
    if (
        result &&
        user.role !== 'admin' &&
        (user.role === 'doctor' ? result.doctorId : result.patientId) !== user.userId
    ) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorised to access this prescription.');
    }
    return result;
}

const getPatientPrescriptionById = async (user: any): Promise<Prescription[] | null> => {
    const { userId } = user;
    const isPatient = await prisma.patient.findUnique({
        where: {
            id: userId
        }
    })
    if (!isPatient) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Patient Account is not found !!')
    }
    const result = await prisma.prescription.findMany({
        where: {
            patientId: userId
        },
        include: {
            doctor: {
                select: {
                    firstName: true,
                    lastName: true,
                    designation: true
                }
            },
            appointment: {
                select: {
                    scheduleDate: true,
                    scheduleTime: true,
                    status: true,
                    trackingId: true
                }
            }
        }
    })
    return result;
}

const getDoctorPrescriptionById = async (user: any): Promise<Prescription[] | null> => {
    const { userId } = user;
    const isDoctor = await prisma.doctor.findUnique({
        where: {
            id: userId
        }
    })
    if (!isDoctor) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Doctor Account is not found !!')
    }
    const result = await prisma.prescription.findMany({
        where: {
            doctorId: userId,
        },
        include: {
            medicines: true,
            patient: true
        }
    })
    return result;
}

const deletePrescription = async (id: string, user: any): Promise<any> => {
    id = validatePayload(uuidSchema, id);
    const prescription = await prisma.prescription.findUnique({
        where: { id },
        select: { doctorId: true }
    });
    if (!prescription) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Prescription was not found.');
    }
    if (user.role !== 'admin' && prescription.doctorId !== user.userId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorised to delete this prescription.');
    }
    const result = await prisma.prescription.delete({
        where: {
            id: id
        }
    });
    return result;
}

const updatePrescription = async (id: string, payload: Partial<Prescription>, user: any): Promise<Prescription> => {
    id = validatePayload(uuidSchema, id);
    payload = validatePayload(updatePrescriptionSchema, payload) as Partial<Prescription>;
    const prescription = await prisma.prescription.findUnique({
        where: { id },
        select: { doctorId: true }
    });
    if (!prescription) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Prescription was not found.');
    }
    if (user.role !== 'admin' && prescription.doctorId !== user.userId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorised to update this prescription.');
    }
    const result = await prisma.prescription.update({
        data: payload,
        where: {
            id: id
        }
    })
    return result;
}

export const PrescriptionService = {
    createPrescription,
    getDoctorPrescriptionById,
    updatePrescription,
    getPatientPrescriptionById,
    deletePrescription,
    getPrescriptionById,
    getAllPrescriptions,
    updatePrescriptionAndAppointment
}