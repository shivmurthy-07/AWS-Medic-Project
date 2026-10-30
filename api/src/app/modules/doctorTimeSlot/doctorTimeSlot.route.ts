import express from 'express';
import { auth } from '../../middlewares/auth';
import { AuthUser } from '../../../enums';
import { doctorTimeSlotController } from './doctorTimeSlot.controller';

const router = express.Router();

router.get('/my-slot', auth(AuthUser.DOCTOR), doctorTimeSlotController.getMyTimeSlot);
router.get('/unavailability', auth(AuthUser.DOCTOR), doctorTimeSlotController.getDoctorUnavailability);
router.post('/unavailability', auth(AuthUser.DOCTOR), doctorTimeSlotController.createUnavailability);
router.delete('/unavailability/:id', auth(AuthUser.DOCTOR), doctorTimeSlotController.deleteDoctorUnavailability);
router.get('/:id', auth(AuthUser.DOCTOR), doctorTimeSlotController.getTimeSlot);
router.get('/appointment-time/:id', doctorTimeSlotController.getAppointmentTimeOfEachDoctor);
router.post('/create', auth(AuthUser.DOCTOR), doctorTimeSlotController.createTimeSlot);
router.get('/', doctorTimeSlotController.getAllTimeSlot);
router.patch('/', auth(AuthUser.DOCTOR), doctorTimeSlotController.updateTimeSlot);
router.delete('/:id', auth(AuthUser.DOCTOR), doctorTimeSlotController.deleteTimeSlot);

export const DoctorTimeSlotRouter = router;