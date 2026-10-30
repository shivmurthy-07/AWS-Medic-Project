import express from 'express';
import { auth } from '../../middlewares/auth';
import { AuthUser } from '../../../enums';
import { MedicalReportController } from './medicalReport.controller';

import { CloudinaryHelper } from '../../../helpers/uploadHelper';

const router = express.Router();

router.get('/doctor', auth(AuthUser.DOCTOR), MedicalReportController.getDoctorReports);
router.get('/patient', auth(AuthUser.PATIENT), MedicalReportController.getPatientReports);
router.get('/patient/:patientId', auth(AuthUser.DOCTOR, AuthUser.ADMIN), MedicalReportController.getPatientReportsByDoctor);
router.get('/:id', auth(AuthUser.DOCTOR, AuthUser.PATIENT, AuthUser.ADMIN), MedicalReportController.getSingleReport);
router.post('/upload', auth(AuthUser.DOCTOR, AuthUser.PATIENT, AuthUser.ADMIN), CloudinaryHelper.upload.single('file'), MedicalReportController.uploadReportFile);
router.post('/create', auth(AuthUser.DOCTOR, AuthUser.PATIENT), MedicalReportController.createReport);
router.delete('/:id', auth(AuthUser.DOCTOR, AuthUser.PATIENT, AuthUser.ADMIN), MedicalReportController.deleteReport);
router.patch('/:id', auth(AuthUser.DOCTOR, AuthUser.PATIENT), MedicalReportController.updateReport);

export const MedicalReportRouter = router;

