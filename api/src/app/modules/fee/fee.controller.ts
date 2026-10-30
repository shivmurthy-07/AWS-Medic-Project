import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { FeeService } from "./fee.service";

const getAllSpecializations = catchAsync(async (req: Request, res: Response) => {
    const onlyActive = req.query.active === 'true';
    const result = await FeeService.getAllSpecializations(onlyActive);
    sendResponse(res, {
        statusCode: 200,
        message: 'Specializations retrieved successfully',
        success: true,
        data: result,
    });
});

const createSpecialization = catchAsync(async (req: Request, res: Response) => {
    const result = await FeeService.createSpecialization(req.body);
    sendResponse(res, {
        statusCode: 200,
        message: 'Specialization created successfully',
        success: true,
        data: result,
    });
});

const updateSpecialization = catchAsync(async (req: Request, res: Response) => {
    const result = await FeeService.updateSpecialization(req.params.id, req.body);
    sendResponse(res, {
        statusCode: 200,
        message: 'Specialization updated successfully',
        success: true,
        data: result,
    });
});

const getAllServices = catchAsync(async (req: Request, res: Response) => {
    const onlyActive = req.query.active === 'true';
    const result = await FeeService.getAllServices(onlyActive);
    sendResponse(res, {
        statusCode: 200,
        message: 'Consultation services retrieved successfully',
        success: true,
        data: result,
    });
});

const createService = catchAsync(async (req: Request, res: Response) => {
    const result = await FeeService.createService(req.body);
    sendResponse(res, {
        statusCode: 200,
        message: 'Consultation service created successfully',
        success: true,
        data: result,
    });
});

const updateService = catchAsync(async (req: Request, res: Response) => {
    const result = await FeeService.updateService(req.params.id, req.body);
    sendResponse(res, {
        statusCode: 200,
        message: 'Consultation service updated successfully',
        success: true,
        data: result,
    });
});

const getAllSpecializationFees = catchAsync(async (req: Request, res: Response) => {
    const specId = req.query.specializationId as string | undefined;
    const result = await FeeService.getAllSpecializationFees(specId);
    sendResponse(res, {
        statusCode: 200,
        message: 'Specialization fees retrieved successfully',
        success: true,
        data: result,
    });
});

const setSpecializationFee = catchAsync(async (req: Request, res: Response) => {
    const result = await FeeService.setSpecializationFee(req.body);
    sendResponse(res, {
        statusCode: 200,
        message: 'Specialization fee configured successfully',
        success: true,
        data: result,
    });
});

const getDoctorFees = catchAsync(async (req: Request, res: Response) => {
    const result = await FeeService.getDoctorFees(req.params.doctorId);
    sendResponse(res, {
        statusCode: 200,
        message: 'Doctor fees retrieved successfully',
        success: true,
        data: result,
    });
});

const setDoctorFee = catchAsync(async (req: Request, res: Response) => {
    const result = await FeeService.setDoctorFee(req.body);
    sendResponse(res, {
        statusCode: 200,
        message: 'Doctor fee configured successfully',
        success: true,
        data: result,
    });
});

const createFeeChangeRequest = catchAsync(async (req: Request, res: Response) => {
    const result = await FeeService.createFeeChangeRequest(req.user, req.body);
    sendResponse(res, {
        statusCode: 200,
        message: 'Fee change request submitted successfully',
        success: true,
        data: result,
    });
});

const getMyFeeChangeRequests = catchAsync(async (req: Request, res: Response) => {
    const result = await FeeService.getMyFeeChangeRequests(req.user);
    sendResponse(res, {
        statusCode: 200,
        message: 'Your fee change requests retrieved successfully',
        success: true,
        data: result,
    });
});

const getAllFeeChangeRequests = catchAsync(async (req: Request, res: Response) => {
    const status = req.query.status as string | undefined;
    const result = await FeeService.getAllFeeChangeRequests(status);
    sendResponse(res, {
        statusCode: 200,
        message: 'All fee change requests retrieved successfully',
        success: true,
        data: result,
    });
});

const reviewFeeChangeRequest = catchAsync(async (req: Request, res: Response) => {
    const result = await FeeService.reviewFeeChangeRequest(req.params.id, req.body);
    sendResponse(res, {
        statusCode: 200,
        message: 'Fee change request reviewed successfully',
        success: true,
        data: result,
    });
});

const calculateConsultationFee = catchAsync(async (req: Request, res: Response) => {
    const doctorId = req.query.doctorId as string;
    const service = (req.query.serviceId || req.query.service || req.query.consultationType) as string | undefined;
    const mode = (req.query.mode as string) || 'IN_PERSON';

    const result = await FeeService.calculateConsultationFee(doctorId, service, mode);
    sendResponse(res, {
        statusCode: 200,
        message: 'Consultation fee calculated successfully',
        success: true,
        data: result,
    });
});

export const FeeController = {
    getAllSpecializations,
    createSpecialization,
    updateSpecialization,
    getAllServices,
    createService,
    updateService,
    getAllSpecializationFees,
    setSpecializationFee,
    getDoctorFees,
    setDoctorFee,
    createFeeChangeRequest,
    getMyFeeChangeRequests,
    getAllFeeChangeRequests,
    reviewFeeChangeRequest,
    calculateConsultationFee,
};

