import express from 'express';
import { signup, login, getUser, completeOnboarding, deleteAccount } from '../controller/userController.js';
import { verifyOTP, resendOTP } from '../controller/authController.js';
import { protect } from '../middleware/authMiddleware.js';  // <== Use this
import { AAA } from '../middleware/Amiddleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.get('/user', protect, getUser);  // <== Use protect here
router.put('/onboarding-complete', protect, completeOnboarding);
router.delete('/deleteuser',AAA, deleteAccount);

export default router;
