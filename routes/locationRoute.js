import express from 'express';
import { createLocation } from '../controller/LocationController.js';
import authenticate from '../middleware/authenticate.js';

const router = express.Router();

router.post('/location', authenticate,createLocation);

export default router;
