import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { SuperAdminService } from './superAdmin.service';

const dashboard = catchAsync(async (_req: Request, res: Response) => {
    const data = await SuperAdminService.dashboard();
    sendResponse(res, { statusCode: 200, message: 'Dashboard data retrieved.', success: true, data });
});

const listDoctors = catchAsync(async (req: Request, res: Response) => {
    const result = await SuperAdminService.listDoctors(req.query);
    sendResponse(res, { statusCode: 200, message: 'Doctors retrieved.', success: true, data: result.data, meta: result.meta });
});

const listPendingDoctors = catchAsync(async (req: Request, res: Response) => {
    const result = await SuperAdminService.listDoctors(req.query, true);
    sendResponse(res, { statusCode: 200, message: 'Pending doctor applications retrieved.', success: true, data: result.data, meta: result.meta });
});

const getDoctor = catchAsync(async (req: Request, res: Response) => {
    const data = await SuperAdminService.getDoctor(req.params.id);
    sendResponse(res, { statusCode: 200, message: 'Doctor details retrieved.', success: true, data });
});

const updateDoctorStatus = (action: 'approve' | 'reject' | 'suspend' | 'reactivate') =>
    catchAsync(async (req: Request, res: Response) => {
        const actor = {
            userId: typeof req.user?.authId === 'string' ? req.user.authId : undefined,
            email: typeof req.user?.email === 'string' ? req.user.email : undefined,
        };
        const data = await SuperAdminService.changeDoctorStatus(actor, req.params.id, action, req.body);
        const messages = {
            approve: 'Doctor approved successfully.',
            reject: 'Doctor application rejected.',
            suspend: 'Doctor suspended successfully.',
            reactivate: 'Doctor reactivated successfully.',
        };
        sendResponse(res, { statusCode: 200, message: messages[action], success: true, data });
    });

const listPatients = catchAsync(async (req: Request, res: Response) => {
    const result = await SuperAdminService.listPatients(req.query);
    sendResponse(res, { statusCode: 200, message: 'Patients retrieved.', success: true, data: result.data, meta: result.meta });
});

const updatePatientStatus = catchAsync(async (req: Request, res: Response) => {
    const actor = {
        userId: typeof req.user?.authId === 'string' ? req.user.authId : undefined,
        email: typeof req.user?.email === 'string' ? req.user.email : undefined,
    };
    const data = await SuperAdminService.setPatientStatus(actor, req.params.id, req.body);
    sendResponse(res, { statusCode: 200, message: 'Patient account status updated.', success: true, data });
});

const listAppointments = catchAsync(async (req: Request, res: Response) => {
    const result = await SuperAdminService.listAppointments(req.query);
    sendResponse(res, { statusCode: 200, message: 'Appointments retrieved.', success: true, data: result.data, meta: result.meta });
});

const listActivityLogs = catchAsync(async (req: Request, res: Response) => {
    const result = await SuperAdminService.listActivityLogs(req.query);
    sendResponse(res, { statusCode: 200, message: 'Activity logs retrieved.', success: true, data: result.data, meta: result.meta });
});

const listUsers = catchAsync(async (req: Request, res: Response) => {
    const result = await SuperAdminService.listUsers(req.query);
    sendResponse(res, { statusCode: 200, message: 'User accounts retrieved.', success: true, data: result.data, meta: result.meta });
});

const changeUserRole = catchAsync(async (req: Request, res: Response) => {
    const actor = {
        userId: typeof req.user?.userId === 'string' ? req.user.userId : undefined,
        email: typeof req.user?.email === 'string' ? req.user.email : undefined,
    };
    const data = await SuperAdminService.changeUserRole(actor, req.params.id, req.body);
    sendResponse(res, { statusCode: 200, message: 'User role updated.', success: true, data });
});

export const SuperAdminController = {
    dashboard,
    listDoctors,
    listPendingDoctors,
    getDoctor,
    approveDoctor: updateDoctorStatus('approve'),
    rejectDoctor: updateDoctorStatus('reject'),
    suspendDoctor: updateDoctorStatus('suspend'),
    reactivateDoctor: updateDoctorStatus('reactivate'),
    listPatients,
    updatePatientStatus,
    listAppointments,
    listActivityLogs,
    listUsers,
    changeUserRole,
};
