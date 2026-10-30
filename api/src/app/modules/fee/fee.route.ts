import express from 'express';
import { auth } from '../../middlewares/auth';
import { AuthUser } from '../../../enums';
import { FeeController } from './fee.controller';

const router = express.Router();

// Public / Patient accessible endpoints for fee discovery & calculation
router.get('/specializations', FeeController.getAllSpecializations);
router.get('/services', FeeController.getAllServices);
router.get('/specialization-fees', FeeController.getAllSpecializationFees);
router.get('/calculate', FeeController.calculateConsultationFee);
router.get('/doctor-fees/:doctorId', FeeController.getDoctorFees);

// Doctor specific routes
router.post('/change-requests', auth(AuthUser.DOCTOR), FeeController.createFeeChangeRequest);
router.get('/change-requests/my', auth(AuthUser.DOCTOR), FeeController.getMyFeeChangeRequests);

// Super Admin & Admin management routes
router.post('/specializations', auth(AuthUser.SUPER_ADMIN, AuthUser.ADMIN), FeeController.createSpecialization);
router.patch('/specializations/:id', auth(AuthUser.SUPER_ADMIN, AuthUser.ADMIN), FeeController.updateSpecialization);

router.post('/services', auth(AuthUser.SUPER_ADMIN, AuthUser.ADMIN), FeeController.createService);
router.patch('/services/:id', auth(AuthUser.SUPER_ADMIN, AuthUser.ADMIN), FeeController.updateService);

router.post('/specialization-fees', auth(AuthUser.SUPER_ADMIN, AuthUser.ADMIN), FeeController.setSpecializationFee);
router.post('/doctor-fees', auth(AuthUser.SUPER_ADMIN, AuthUser.ADMIN), FeeController.setDoctorFee);

router.get('/change-requests', auth(AuthUser.SUPER_ADMIN, AuthUser.ADMIN), FeeController.getAllFeeChangeRequests);
router.patch('/change-requests/:id/review', auth(AuthUser.SUPER_ADMIN, AuthUser.ADMIN), FeeController.reviewFeeChangeRequest);

export const FeeRouter = router;

