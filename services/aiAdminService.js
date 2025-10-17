import Incident from '../model/incidentModel.js';
import { analyzeIncident } from '../utils/gemini.js';
import { geocodeLocation } from '../utils/geocode.js';

/**
 * AI Admin service:
 * 1. Geocodes missing coordinates
 * 2. Uses Gemini to analyze danger level
 * 3. Updates similar nearby incidents automatically
 */
export const aiAdminReviewIncident = async (incidentId) => {
  const incident = await Incident.findById(incidentId);
  if (!incident) throw new Error('Incident not found');

  // 1️⃣ Ensure coordinates exist
  if (!incident.coordinates && incident.locationText) {
    const geo = await geocodeLocation(incident.locationText);
    if (geo) incident.coordinates = geo;
  }

  // 2️⃣ Get Gemini AI evaluation
  const geminiResult = await analyzeIncident(incident);
  incident.geminiAnalysis = geminiResult;
  incident.dangerLevel = geminiResult?.dangerLevel || 'medium';
  incident.aiVerified = true;
  incident.aiVerifiedAt = new Date();

  await incident.save();

  // 3️⃣ Optional: find nearby incidents to adjust their risk level
  const nearby = await Incident.find({
    _id: { $ne: incident._id },
    'coordinates.lat': { $exists: true },
    'coordinates.lng': { $exists: true },
  });

  const closeIncidents = nearby.filter((i) => {
    const dx = incident.coordinates.lat - i.coordinates.lat;
    const dy = incident.coordinates.lng - i.coordinates.lng;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < 0.05; 
  });

  if (closeIncidents.length >= 3) {
  
    for (const i of closeIncidents) {
      if (i.dangerLevel !== 'high') {
        i.dangerLevel = 'high';
        i.aiClusterFlag = true;
        await i.save();
      }
    }
  }

  return incident;
};
