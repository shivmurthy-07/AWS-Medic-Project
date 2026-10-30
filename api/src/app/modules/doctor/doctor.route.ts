import express, { NextFunction, Request, Response } from 'express';
import { DoctorController } from './doctor.controller';
import { AuthUser } from '../../../enums';
import { auth, ownerOrAdmin } from '../../middlewares/auth';
import { CloudinaryHelper } from '../../../helpers/uploadHelper';

const router = express.Router();

router.get('/', DoctorController.getAllDoctors);
router.post('/', DoctorController.createDoctor);

// Education, Experience, Awards sub-resources for authenticated doctor
router.post('/education', auth(AuthUser.DOCTOR), DoctorController.addEducation);
router.delete('/education/:eduId', auth(AuthUser.DOCTOR), DoctorController.deleteEducation);

router.post('/experience', auth(AuthUser.DOCTOR), DoctorController.addExperience);
router.delete('/experience/:expId', auth(AuthUser.DOCTOR), DoctorController.deleteExperience);

router.post('/award', auth(AuthUser.DOCTOR), DoctorController.addAward);
router.delete('/award/:awardId', auth(AuthUser.DOCTOR), DoctorController.deleteAward);

router.get('/:id', DoctorController.getDoctor);
router.delete('/:id', auth(AuthUser.ADMIN), DoctorController.deleteDoctor);
router.patch('/:id',
    auth(AuthUser.DOCTOR, AuthUser.ADMIN),
    ownerOrAdmin(),
    CloudinaryHelper.upload.single('file'),
    (req: Request, res: Response, next: NextFunction) => {
        return DoctorController.updateDoctor(req, res, next);
    }
);

export const DoctorRouter = router;