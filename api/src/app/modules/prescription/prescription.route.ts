import express from 'express';
import { auth } from '../../middlewares/auth';
import { AuthUser } from '../../../enums';
import { PrescriptionController } from './prescription.controller';

const router = express.Router();

router.get('/doctor/prescription', auth(AuthUser.DOCTOR), PrescriptionController.getDoctorPrescriptionById);
router.get('/patient/prescription', auth(AuthUser.PATIENT), PrescriptionController.getPatientPrescriptionById);

router.get('/:id', auth(AuthUser.DOCTOR, AuthUser.PATIENT, AuthUser.ADMIN), PrescriptionController.getPrescriptionById);
router.get('/', auth(AuthUser.ADMIN), PrescriptionController.getAllPrescriptions);

router.post('/create', auth(AuthUser.DOCTOR), PrescriptionController.createPrescription);

router.delete('/:id', auth(AuthUser.DOCTOR, AuthUser.ADMIN), PrescriptionController.deletePrescription);
router.patch('/:id', auth(AuthUser.DOCTOR, AuthUser.ADMIN), PrescriptionController.updatePrescription);
router.patch('/update-prescription-appointment', auth(AuthUser.DOCTOR), PrescriptionController.updatePrescriptionAndAppointment);

export const PrescriptionRouter = router;