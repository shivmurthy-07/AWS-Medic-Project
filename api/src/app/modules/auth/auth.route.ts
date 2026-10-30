import express from 'express';
import { AuthController } from './auth.controller';
import { auth } from '../../middlewares/auth';
import { AuthUser } from '../../../enums';

const router = express.Router();

router.post('/login', AuthController.Login);
router.post('/change-password', auth(AuthUser.DOCTOR, AuthUser.PATIENT, AuthUser.ADMIN), AuthController.changePassword);
router.post('/reset-password', AuthController.resetPassword);
router.post('/reset-password/confirm', AuthController.PasswordResetConfirm);
router.post('/logout', auth(AuthUser.SUPER_ADMIN), AuthController.Logout);
router.get('/user/verify/:userId/:uniqueString', AuthController.VerifyUser);
router.get('/verified', AuthController.Verified);
router.get('/expired/link', AuthController.VerficationExpired);

export const AuthRouter = router;