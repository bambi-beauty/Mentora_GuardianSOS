import Incident from '../model/incidentModel.js';
import { analyzeIncident } from '../utils/gemini.js';
import User from '../model/userModel.js';
import { aiAdminReviewIncident } from '../services/aiAdminService.js';

export const createIncident = async (req, res) => {
  try {
    const { type, description, locationText, coordinates, anonymous } = req.body;
    if (!type || !description || !locationText) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const user = req.user._id;

    const incident = new Incident({
      user,
      type,
      description,
      locationText,
      coordinates,
      anonymous,
    });

    await incident.save();

    let reviewedIncident;
    try {
      reviewedIncident = await aiAdminReviewIncident(incident._id);
    } catch (err) {
      console.error('AI Admin review failed:', err);
      reviewedIncident = incident;
    }

    res.status(201).json({
      success: true,
      message: 'Incident created and analyzed by AI Admin',
      data: reviewedIncident,
    });
  } catch (error) {
    console.error('AI Incident creation error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const getDangerZones = async (req, res) => {
  try {
    const incidents = await Incident.find({ dangerLevel: { $in: ['medium', 'high'] } });
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch danger zones' });
  }
};

export const getAllIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find().sort({ createdAt: -1 });
    res.status(200).json(incidents);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({ message: 'Failed to fetch incidents' });
  }
};
