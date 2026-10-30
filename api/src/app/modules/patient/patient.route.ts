import express, { NextFunction, Request, Response } from 'express';
import { PatientController } from './patient.controller';
import { auth, ownerOrAdmin } from '../../middlewares/auth';
import { AuthUser } from '../../../enums';
import { CloudinaryHelper } from '../../../helpers/uploadHelper';

const router = express.Router();

router.get('/', auth(AuthUser.ADMIN, AuthUser.SUPER_ADMIN), PatientController.getAllPatients);
router.post('/', PatientController.createPatient);

router.get('/:id/medical-history',
    auth(AuthUser.PATIENT, AuthUser.DOCTOR, AuthUser.ADMIN, AuthUser.SUPER_ADMIN),
    PatientController.getMedicalHistory
);

router.put('/:id/medical-history',
    auth(AuthUser.PATIENT, AuthUser.ADMIN, AuthUser.SUPER_ADMIN),
    PatientController.updateMedicalHistory
);

router.get('/:id', auth(AuthUser.PATIENT, AuthUser.ADMIN, AuthUser.SUPER_ADMIN), ownerOrAdmin(), PatientController.getPatient);
router.delete('/:id', auth(AuthUser.ADMIN, AuthUser.SUPER_ADMIN), PatientController.deletePatient);
router.patch('/:id',
    auth(AuthUser.PATIENT, AuthUser.ADMIN, AuthUser.SUPER_ADMIN),
    ownerOrAdmin(),
    CloudinaryHelper.upload.single('file'),
    (req: Request, res: Response, next: NextFunction) => {
        return PatientController.updatePatient(req, res, next)
    }
);

export const PatientRouter = router;