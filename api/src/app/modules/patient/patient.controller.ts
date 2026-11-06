import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { PatientService } from "./patient.service";
import { Patient } from "@prisma/client";
import ApiError from "../../../errors/apiError";
import httpStatus from "http-status";

const createPatient = catchAsync(async (req: Request, res: Response) => {
    await PatientService.createPatient(req.body);
    sendResponse(res, {
        statusCode: 200,
        message: 'Successfully Patient Created !!',
        success: true
    })
})

const getAllPatients = catchAsync(async (req: Request, res: Response) => {
    const result = await PatientService.getAllPatients();
    sendResponse<Patient[]>(res, {
        statusCode: 200,
        message: 'Successfully Get Patients !!',
        success: true,
        data: result,
    })
})

const getPatient = catchAsync(async (req: Request, res: Response) => {
    const result = await PatientService.getPatient(req.params.id, req.user);
    sendResponse<Patient>(res, {
        statusCode: 200,
        message: 'Successfully Get Patient !!',
        success: true,
        data: result,
    })
})

const deletePatient = catchAsync(async (req: Request, res: Response) => {
    const result = await PatientService.deletePatient(req.params.id);
    sendResponse<Patient>(res, {
        statusCode: 200,
        message: 'Successfully Deleted Patient !!',
        success: true,
        data: result,
    })
})

const updatePatient = catchAsync(async (req: Request, res: Response) => {
    if (req.user?.role !== 'admin' && req.user?.userId !== req.params.id) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorised to update this patient.');
    }
    const result = await PatientService.updatePatient(req);
    sendResponse<Patient>(res, {
        statusCode: 200,
        message: 'Successfully Updated Patient !!',
        success: true,
        data: result
    })
})

const getMedicalHistory = catchAsync(async (req: Request, res: Response) => {
    const result = await PatientService.getMedicalHistory(req.params.id, req.user);
    sendResponse(res, {
        statusCode: 200,
        message: 'Successfully retrieved patient medical history',
        success: true,
        data: result,
    });
});

const updateMedicalHistory = catchAsync(async (req: Request, res: Response) => {
    const result = await PatientService.updateMedicalHistory(req.params.id, req.user, req.body);
    sendResponse(res, {
        statusCode: 200,
        message: 'Successfully updated patient medical history',
        success: true,
        data: result,
    });
});

export const PatientController = {
    createPatient,
    updatePatient,
    getPatient,
    getAllPatients,
    deletePatient,
    getMedicalHistory,
    updateMedicalHistory,
}