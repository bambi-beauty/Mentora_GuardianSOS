import express from 'express';
import {
  createGroup,
  getGroups,
  getGroupById,
  joinGroup,
  leaveGroup,
  addMessage
} from '../controller/groupController.js';

import { protect } from '../middleware/authMiddleware.js'; 

const router = express.Router();

// Create a new group (protected)
router.post('/', protect, createGroup);

// Get all groups (optional category filter)
router.get('/', protect, getGroups);

// Get group by ID (with messages)
router.get('/:id', protect, getGroupById);

// Join a group
router.post('/:id/join', protect, joinGroup);

// Leave a group
router.post('/:id/leave', protect, leaveGroup);

// Add a message to group chat
router.post('/:id/messages', protect, addMessage);

export default router;
