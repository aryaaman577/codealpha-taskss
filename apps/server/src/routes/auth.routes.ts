import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.patch('/change-password', protect, authController.changePassword);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-otp', authController.resendOTP);
router.get('/me', protect, authController.getMe);
router.patch('/profile', protect, authController.updateProfile);
router.post('/avatar', protect, authController.uploadAvatar);
router.get('/users/search', protect, authController.searchUsers);

// Google OAuth
router.get('/google', authController.googleStart);
router.get('/google/callback', authController.googleCallback);

export default router;

