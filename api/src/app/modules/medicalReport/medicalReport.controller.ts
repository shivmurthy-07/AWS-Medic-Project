import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { MedicalReportService } from "./medicalReport.service";

const createReport = catchAsync(async (req: Request, res: Response) => {
    const result = await MedicalReportService.createReport(req.user, req.body);
    sendResponse(res, {
        statusCode: 200,
        message: 'Medical report created successfully',
        success: true,
        data: result
    });
});

const getDoctorReports = catchAsync(async (req: Request, res: Response) => {
    const result = await MedicalReportService.getDoctorReports(req.user);
    sendResponse(res, {
        statusCode: 200,
        message: 'Doctor medical reports retrieved successfully',
        success: true,
        data: result
    });
});

const getPatientReports = catchAsync(async (req: Request, res: Response) => {
    const result = await MedicalReportService.getPatientReports(req.user, req.query);
    sendResponse(res, {
        statusCode: 200,
        message: 'Patient medical reports retrieved successfully',
        success: true,
        data: result
    });
});

const uploadReportFile = catchAsync(async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
        return sendResponse(res, {
            statusCode: 400,
            message: 'No file provided',
            success: false,
        });
    }

    const uploadResult = await (req as any).uploadResult;
    const fileUrl = uploadResult?.secure_url || `/uploads/${file.filename}`;

    sendResponse(res, {
        statusCode: 200,
        message: 'File uploaded successfully',
        success: true,
        data: {
            fileUrl,
            fileName: file.originalname,
            fileSize: file.size,
            fileMimeType: file.mimetype,
        },
    });
});

const getPatientReportsByDoctor = catchAsync(async (req: Request, res: Response) => {
    const result = await MedicalReportService.getPatientReportsByDoctor(req.params.patientId);
    sendResponse(res, {
        statusCode: 200,
        message: 'Patient medical reports retrieved successfully',
        success: true,
        data: result
    });
});

const getSingleReport = catchAsync(async (req: Request, res: Response) => {
    const result = await MedicalReportService.getSingleReport(req.params.id, req.user);
    sendResponse(res, {
        statusCode: 200,
        message: 'Medical report retrieved successfully',
        success: true,
        data: result
    });
});

const deleteReport = catchAsync(async (req: Request, res: Response) => {
    const result = await MedicalReportService.deleteReport(req.params.id, req.user);
    sendResponse(res, {
        statusCode: 200,
        message: 'Medical report deleted successfully',
        success: true,
        data: result
    });
});

const updateReport = catchAsync(async (req: Request, res: Response) => {
    const result = await MedicalReportService.updateReport(req.params.id, req.user, req.body);
    sendResponse(res, {
        statusCode: 200,
        message: 'Medical report updated successfully',
        success: true,
        data: result
    });
});

export const MedicalReportController = {
    createReport,
    getDoctorReports,
    getPatientReports,
    getPatientReportsByDoctor,
    getSingleReport,
    deleteReport,
    updateReport,
    uploadReportFile,
};

