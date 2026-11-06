import express from 'express';
import { AuthController } from './auth.controller';
import { auth } from '../../middlewares/auth';
import { AuthUser } from '../../../enums';
import { createRateLimiter } from '../../middlewares/rateLimiter';

const router = express.Router();

// Sensitive endpoint rate limiter: max 5 requests per 15 minutes per IP
const forgotPasswordLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many password reset requests from this IP. Please wait a few minutes before trying again.',
});

router.post('/login', AuthController.Login);
router.post('/forgot-password', forgotPasswordLimiter, AuthController.forgotPassword);
router.post('/validate-reset-token', AuthController.validateResetToken);
router.post('/reset-password', AuthController.resetPassword);
router.post('/reset-password/confirm', AuthController.PasswordResetConfirm);
router.post('/change-password', auth(AuthUser.DOCTOR, AuthUser.PATIENT, AuthUser.ADMIN), AuthController.changePassword);
router.post('/logout', auth(AuthUser.SUPER_ADMIN), AuthController.Logout);
router.get('/user/verify/:userId/:uniqueString', AuthController.VerifyUser);
router.get('/verified', AuthController.Verified);
router.get('/expired/link', AuthController.VerficationExpired);

export const AuthRouter = router;