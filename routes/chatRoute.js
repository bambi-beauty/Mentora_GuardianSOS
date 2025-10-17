// routes/chatRoutes.js

import express from 'express';
import { chatWithGemini, getChatHistory, listModels } from '../controller/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected (requires user to be logged in)
router.post('/chat', protect, chatWithGemini);
router.get('/chat/history', protect, getChatHistory);
router.get('/list-models', protect, listModels);

export default router;
