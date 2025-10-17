// routes/incidentRoutes.js
import express from 'express';
import {
  createIncident,
  getDangerZones,
  getAllIncidents, // ✅ Import the new controller
} from '../controller/incidentController.js';
import { protect } from '../middleware/authMiddleware.js'; // Only if you use JWT auth

const router = express.Router();

router.post('/', protect, createIncident);

router.get('/', getAllIncidents);

router.get('/danger-zones', getDangerZones);

export default router;
