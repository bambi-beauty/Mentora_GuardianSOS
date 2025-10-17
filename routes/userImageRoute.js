import express from 'express';
import { getUserImages, uploadUserImage } from '../controller/userImageController.js';
import { uploadSingleImage } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// POST upload image
router.post('/users/:userId/images', uploadSingleImage('image'), uploadUserImage);

// GET images by user ID
router.get('/users/:userId/images', getUserImages);

export default router;
