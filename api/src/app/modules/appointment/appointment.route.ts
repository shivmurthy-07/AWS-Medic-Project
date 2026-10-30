import express from 'express';
import { auth, optionalAuth } from '../../middlewares/auth';
import { AuthUser } from '../../../enums';
import { AppointmentController } from './appointment.controller';

const router = express.Router();

router.get('/', auth(AuthUser.ADMIN), AppointmentController.getAllAppointment);

router.get('/patient/appointments',auth(AuthUser.PATIENT), AppointmentController.getPatientAppointmentById);
router.get('/patient/invoices',auth(AuthUser.PATIENT), AppointmentController.getPatientPaymentInfo);
router.get('/doctor/invoices',auth(AuthUser.DOCTOR), AppointmentController.getDoctorInvoices);

router.get('/doctor/appointments',auth(AuthUser.DOCTOR), AppointmentController.getDoctorAppointmentsById);
router.get('/doctor/patients',auth(AuthUser.DOCTOR), AppointmentController.getDoctorPatients);

router.get('/patient-payment-info/:id',auth(AuthUser.ADMIN, AuthUser.PATIENT, AuthUser.DOCTOR), AppointmentController.getPaymentInfoViaAppintmentId);

router.post('/tracking', AppointmentController.getAppointmentByTrackingId);
router.post('/create', optionalAuth, AppointmentController.createAppointment);
router.post('/create-un-authenticate', AppointmentController.createAppointmentByUnAuthenticateUser);

router.get('/confirmation/:id', AppointmentController.getAppointmentConfirmation);
router.get('/:id', auth(AuthUser.ADMIN, AuthUser.DOCTOR, AuthUser.PATIENT), AppointmentController.getAppointment);

router.delete('/:id', auth(AuthUser.ADMIN), AppointmentController.deleteAppointment);
router.patch('/:id', auth(AuthUser.ADMIN, AuthUser.DOCTOR, AuthUser.PATIENT),AppointmentController.updateAppointment);
//doctor side
router.patch('/doctor/update-appointment',auth(AuthUser.DOCTOR), AppointmentController.updateAppointmentByDoctor);


export const AppointmentRouter = router;