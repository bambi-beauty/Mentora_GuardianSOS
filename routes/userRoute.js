import express from 'express';
import { 
  signup, 
  login, 
  getUser, 
  completeOnboarding, 
  deleteAccount,
  forgotPassword,
  resetPassword,
  verifyResetToken,
  updateProfile,
  changePassword
} from '../controller/userController.js';
import { verifyOTP, resendOTP } from '../controller/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { AAA } from '../middleware/Amiddleware.js';

const router = express.Router();

// Public authentication routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);

// Public password reset routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-reset-token', verifyResetToken);

// Protected user routes
router.get('/profile', protect, getUser);
router.put('/onboarding-complete', protect, completeOnboarding);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.delete('/account', protect, deleteAccount); // Changed to consistent naming

export default router;