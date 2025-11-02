import express from 'express';
import {
  createGroup,
  getGroups,
  getGroupById,
  joinGroup,
  leaveGroup,
  addMessage,
  getUserGroups
} from '../controller/groupController.js';

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Debug routes
router.get('/debug', (req, res) => {
  console.log('🔍 Debug route hit');
  res.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

router.get('/debug/auth', protect, (req, res) => {
  console.log('🔍 Auth debug route hit - User:', req.user);
  res.json({ 
    message: 'Authentication is working!',
    user: req.user ? { id: req.user._id, email: req.user.email } : 'No user'
  });
});

router.post('/', protect, createGroup);
router.get('/', protect, getGroups);
router.get('/user/my-groups', protect, getUserGroups);
router.get('/:id', protect, getGroupById);
router.post('/:id/join', protect, joinGroup);
router.post('/:id/leave', protect, leaveGroup);
router.post('/:id/messages', protect, addMessage);

export default router;