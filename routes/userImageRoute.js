// routes/UserImageRoute.js
import express from 'express';
import { 
  getUserImages, 
  uploadUserImage, 
  getCurrentUserProfileImage  // Add this import
} from '../controller/userImageController.js';
import { uploadSingleImage } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// POST upload image
router.post('/users/:userId/images', uploadSingleImage('image'), uploadUserImage);

// GET images by user ID
router.get('/users/:userId/images', getUserImages);

// GET current user profile image - ADD THIS ROUTE
router.get('/users/:userId/profile-image', getCurrentUserProfileImage);

export default router;