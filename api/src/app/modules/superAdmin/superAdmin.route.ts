import express from 'express';
import { AuthUser } from '../../../enums';
import { auth } from '../../middlewares/auth';
import { SuperAdminController } from './superAdmin.controller';

const router = express.Router();
router.use(auth(AuthUser.SUPER_ADMIN));

router.get('/dashboard', SuperAdminController.dashboard);
router.get('/doctors/pending', SuperAdminController.listPendingDoctors);
router.get('/doctors', SuperAdminController.listDoctors);
router.get('/doctors/:id', SuperAdminController.getDoctor);
router.patch('/doctors/:id/approve', SuperAdminController.approveDoctor);
router.patch('/doctors/:id/reject', SuperAdminController.rejectDoctor);
router.patch('/doctors/:id/suspend', SuperAdminController.suspendDoctor);
router.patch('/doctors/:id/reactivate', SuperAdminController.reactivateDoctor);
router.get('/patients', SuperAdminController.listPatients);
router.patch('/patients/:id/status', SuperAdminController.updatePatientStatus);
router.get('/users', SuperAdminController.listUsers);
router.patch('/users/:id/role', SuperAdminController.changeUserRole);
router.get('/appointments', SuperAdminController.listAppointments);
router.get('/activity-logs', SuperAdminController.listActivityLogs);

export const SuperAdminRouter = router;
