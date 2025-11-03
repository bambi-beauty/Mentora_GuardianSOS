// controller/chatController.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import ChatMessage from '../model/ChatMessage.js';
import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Enhanced Configuration
const CONFIG = {
  CHAT: {
    MAX_MESSAGE_LENGTH: 1000,
    MAX_HISTORY_MESSAGES: 20,
    CLEANUP_OLDER_THAN_DAYS: 30
  },
  API: {
    TIMEOUT_MS: 15000, // Increased timeout
    RETRY_ATTEMPTS: 3   // Increased retry attempts
  },
  SAFETY: {
    ANALYSIS_RADIUS_KM: 5,
    CACHE_DURATION_MS: 5 * 60 * 1000 // 5 minutes
  },
  CITIES: {
    SUPPORTED: ['johannesburg', 'pretoria', 'cape town', 'durban', 'soweto', 'alexandra', 'sandton'],
    COORDINATES: {
      johannesburg: { minLat: -26.5, maxLat: -25.5, minLng: 27.5, maxLng: 28.5 },
      pretoria: { minLat: -25.9, maxLat: -25.6, minLng: 27.9, maxLng: 28.4 },
      'cape town': { minLat: -34.2, maxLat: -33.5, minLng: 18.2, maxLng: 19.0 }
    }
  },
  GOOGLE: {
    MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
    ROUTE_OPTIONS: {
      ALTERNATIVES: true,
      AVOID: ['tolls', 'ferries']
    }
  },
  RESPONSE: {
    MIN_LENGTH: 50,      // Minimum response length
    TARGET_LENGTH: 300,  // Target response length
    MAX_RETRIES: 2       // Retry generation if response is too short
  }
};

// Enhanced Joi Validation Schemas
const validationSchemas = {
  chat: Joi.object({
    message: Joi.string()
      .min(1)
      .max(CONFIG.CHAT.MAX_MESSAGE_LENGTH)
      .trim()
      .required()
      .messages({
        'string.empty': 'Message cannot be empty',
        'string.max': `Message cannot exceed ${CONFIG.CHAT.MAX_MESSAGE_LENGTH} characters`
      }),
    userLocation: Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
      accuracy: Joi.number().optional(),
      altitude: Joi.number().optional(),
      altitudeAccuracy: Joi.number().optional(),
      heading: Joi.number().optional(),
      speed: Joi.number().optional(),
      isManual: Joi.boolean().optional(),
      locationName: Joi.string().optional()
    }).optional(),
    destinationLocation: Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
      accuracy: Joi.number().optional(),
      altitude: Joi.number().optional(),
      altitudeAccuracy: Joi.number().optional(),
      heading: Joi.number().optional(),
      speed: Joi.number().optional(),
      isManual: Joi.boolean().optional(),
      locationName: Joi.string().optional()
    }).optional(),
    multipleDestinations: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        latitude: Joi.number().min(-90).max(90).required(),
        longitude: Joi.number().min(-180).max(180).required(),
        locationName: Joi.string().optional()
      })
    ).max(5).optional(),
    routePreferences: Joi.object({
      avoidHighCrimeAreas: Joi.boolean().default(true),
      preferWellLitRoutes: Joi.boolean().default(true),
      avoidIsolatedAreas: Joi.boolean().default(true),
      travelMode: Joi.string().valid('driving', 'walking', 'bicycling', 'transit').default('driving')
    }).optional()
  }),

  coordinates: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required()
  })
};

// Cache for incidents data
let incidentsCache = {
  data: null,
  timestamp: null,
  city: null
};

// Cache for Google Routes
let routesCache = new Map();

// Utility Functions
class ChatUtils {
  static async fetchWithTimeout(url, options = {}, timeout = CONFIG.API.TIMEOUT_MS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  static async retryOperation(operation, maxAttempts = CONFIG.API.RETRY_ATTEMPTS) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    throw lastError;
  }

  static validateInput(data, schema) {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      throw new Error(`Validation failed: ${JSON.stringify(errorDetails)}`);
    }
    
    return value;
  }

  static handleError(res, error, context = 'Operation') {
    console.error(`💥 ${context}:`, {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    if (error.message.includes('Validation failed')) {
      return res.status(400).json({
        error: 'Invalid input data',
        details: JSON.parse(error.message.replace('Validation failed: ', ''))
      });
    }

    if (error.name === 'AbortError') {
      return res.status(408).json({
        error: 'Request timeout',
        message: 'The service took too long to respond'
      });
    }

    if (error.message.includes('API_KEY') || error.message.includes('quota')) {
      return res.status(503).json({
        error: 'AI service temporarily unavailable',
        message: 'Please try again later'
      });
    }

    if (error.message.includes('Authentication')) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to continue'
      });
    }

    return res.status(500).json({
      error: 'Service temporarily unavailable',
      message: 'Please try again in a few moments',
      ...(process.env.NODE_ENV === 'development' && { debug: error.message })
    });
  }
}

// Function to fetch incidents from API with caching and retry logic
async function fetchIncidentsData(cityFilter = null) {
  // Check cache first
  const now = Date.now();
  if (incidentsCache.data && 
      incidentsCache.timestamp && 
      (now - incidentsCache.timestamp) < CONFIG.SAFETY.CACHE_DURATION_MS &&
      incidentsCache.city === cityFilter) {
    console.log('📊 Using cached incidents data');
    return incidentsCache.data;
  }

  try {
    const operation = async () => {
      const response = await ChatUtils.fetchWithTimeout(
        'https://baroscopical-natosha-overrigid.ngrok-free.dev/api/incidents',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'SafetyChatBot/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Incidents API responded with status: ${response.status}`);
      }

      let incidents = await response.json();

      // Validate incidents data structure
      if (!Array.isArray(incidents)) {
        throw new Error('Invalid incidents data format: expected array');
      }

      // Filter by city if specified
      let filteredIncidents = incidents;
      if (cityFilter) {
        filteredIncidents = incidents.filter(incident => {
          if (!incident.locationText) return false;
          
          const locationLower = incident.locationText.toLowerCase();
          const cityFilterLower = cityFilter.toLowerCase();
          
          return locationLower.includes(cityFilterLower);
        });
        
        console.log(`📍 Filtered incidents for ${cityFilter}: ${filteredIncidents.length} out of ${incidents.length}`);
      } else {
        console.log(`📍 Retrieved all incidents: ${incidents.length}`);
      }

      // Update cache
      incidentsCache = {
        data: filteredIncidents,
        timestamp: now,
        city: cityFilter
      };

      return filteredIncidents;
    };

    return await ChatUtils.retryOperation(operation);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    
    // Return cached data if available, even if stale
    if (incidentsCache.data) {
      console.log('🔄 Using stale cache due to API failure');
      return incidentsCache.data;
    }
    
    return [];
  }
}

// New function to get routes from Google Maps
async function getGoogleRoutes(origin, destination, travelMode = 'driving') {
  const cacheKey = `${origin.latitude},${origin.longitude}_${destination.latitude},${destination.longitude}_${travelMode}`;
  
  // Check cache first
  if (routesCache.has(cacheKey)) {
    console.log('🗺️ Using cached route data');
    return routesCache.get(cacheKey);
  }

  try {
    if (!CONFIG.GOOGLE.MAPS_API_KEY) {
      throw new Error('Google Maps API key not configured');
    }

    const originStr = `${origin.latitude},${origin.longitude}`;
    const destinationStr = `${destination.latitude},${destination.longitude}`;
    
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&alternatives=true&mode=${travelMode}&key=${CONFIG.GOOGLE.MAPS_API_KEY}`;

    console.log('🗺️ Fetching routes from Google Maps:', { origin: originStr, destination: destinationStr, travelMode });

    const response = await ChatUtils.fetchWithTimeout(url);
    
    if (!response.ok) {
      throw new Error(`Google Maps API responded with status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Google Maps API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }

    // Process route data
    const routes = data.routes.map((route, index) => {
      const leg = route.legs[0]; // Assuming single leg for simplicity
      return {
        routeIndex: index,
        summary: route.summary,
        distance: leg.distance,
        duration: leg.duration,
        startAddress: leg.start_address,
        endAddress: leg.end_address,
        steps: leg.steps.map(step => ({
          instruction: step.html_instructions,
          distance: step.distance,
          duration: step.duration,
          coordinates: decodePolyline(step.polyline.points)
        })),
        polyline: route.overview_polyline.points,
        warnings: route.warnings || []
      };
    });

    console.log(`🗺️ Retrieved ${routes.length} route alternatives`);

    // Cache the results
    routesCache.set(cacheKey, routes);
    
    // Limit cache size
    if (routesCache.size > 100) {
      const firstKey = routesCache.keys().next().value;
      routesCache.delete(firstKey);
    }

    return routes;
  } catch (error) {
    console.error('❌ Error fetching Google Maps routes:', error);
    throw error;
  }
}

// Helper function to decode Google Maps polyline
function decodePolyline(encoded) {
  let points = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push([lat * 1e-5, lng * 1e-5]);
  }
  return points;
}

// Function to extract city from location text or coordinates
function extractCityFromLocation(userLocation, locationText = null) {
  // If we have explicit location text, try to extract city from it
  if (locationText) {
    const locationLower = locationText.toLowerCase();
    
    for (const city of CONFIG.CITIES.SUPPORTED) {
      if (locationLower.includes(city)) {
        console.log(`📍 Extracted city from location text: ${city}`);
        return city;
      }
    }
  }
  
  // If we have coordinates, use coordinate-based city detection
  if (userLocation) {
    try {
      // Only validate required coordinates
      const requiredCoords = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude
      };
      ChatUtils.validateInput(requiredCoords, validationSchemas.coordinates);
      
      const { latitude, longitude } = requiredCoords;
      
      for (const [city, bounds] of Object.entries(CONFIG.CITIES.COORDINATES)) {
        if (latitude >= bounds.minLat && latitude <= bounds.maxLat &&
            longitude >= bounds.minLng && longitude <= bounds.maxLng) {
          console.log(`📍 Detected location: ${city} based on coordinates`);
          return city;
        }
      }
    } catch (error) {
      console.warn('Invalid coordinates for city detection:', error.message);
    }
  }
  
  console.log('📍 Could not determine specific city, using all data');
  return null;
}

// Function to detect if user is asking for specific location
function extractRequestedCity(message) {
  const messageLower = message.toLowerCase();
  const cityKeywords = {
    'johannesburg': ['johannesburg', 'jhb', 'joburg'],
    'pretoria': ['pretoria', 'pta'],
    'cape town': ['cape town', 'capetown', 'cpt'],
    'durban': ['durban', 'dbn'],
    'soweto': ['soweto'],
    'alexandra': ['alexandra', 'alex'],
    'sandton': ['sandton']
  };
  
  for (const [city, keywords] of Object.entries(cityKeywords)) {
    for (const keyword of keywords) {
      if (messageLower.includes(keyword)) {
        console.log(`📍 User requested specific city: ${city}`);
        return city;
      }
    }
  }
  
  return null;
}

// Function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

// Enhanced function to analyze safety along a route
function analyzeRouteSafety(route, incidents, radiusKm = 1) {
  console.log(`🛡️ Analyzing safety for route: ${route.summary}`);
  
  const routeSafety = {
    routeSummary: route.summary,
    totalDistance: route.distance,
    totalDuration: route.duration,
    incidentAnalysis: [],
    safetyScore: 0,
    riskLevel: 'LOW',
    recommendations: []
  };

  // Analyze each step of the route
  let totalIncidents = 0;
  let highRiskSteps = [];

  route.steps.forEach((step, stepIndex) => {
    const stepIncidents = [];
    
    // Check incidents near each coordinate in the step
    step.coordinates.forEach(coord => {
      const [lat, lng] = coord;
      
      incidents.forEach(incident => {
        if (incident.coordinates && incident.coordinates.lat && incident.coordinates.lng) {
          const distance = calculateDistance(lat, lng, incident.coordinates.lat, incident.coordinates.lng);
          
          if (distance <= radiusKm) {
            stepIncidents.push({
              ...incident,
              distanceFromRoute: distance
            });
          }
        }
      });
    });

    // Remove duplicates
    const uniqueIncidents = stepIncidents.filter((incident, index, self) =>
      index === self.findIndex(i => i._id === incident._id)
    );

    if (uniqueIncidents.length > 0) {
      totalIncidents += uniqueIncidents.length;
      
      const stepRisk = uniqueIncidents.length > 3 ? 'HIGH' : 
                      uniqueIncidents.length > 1 ? 'MEDIUM' : 'LOW';
      
      if (stepRisk === 'HIGH') {
        highRiskSteps.push({
          stepIndex,
          instruction: step.instruction,
          incidents: uniqueIncidents
        });
      }

      routeSafety.incidentAnalysis.push({
        stepIndex,
        instruction: step.instruction,
        distance: step.distance,
        duration: step.duration,
        incidents: uniqueIncidents,
        riskLevel: stepRisk
      });
    }
  });

  // Calculate safety score (0-100, higher is safer)
  const baseScore = 100;
  const incidentPenalty = Math.min(totalIncidents * 5, 70); // Max 70% penalty
  routeSafety.safetyScore = Math.max(baseScore - incidentPenalty, 0);

  // Determine overall risk level
  if (routeSafety.safetyScore >= 80) {
    routeSafety.riskLevel = 'LOW';
  } else if (routeSafety.safetyScore >= 60) {
    routeSafety.riskLevel = 'MODERATE';
  } else if (routeSafety.safetyScore >= 40) {
    routeSafety.riskLevel = 'HIGH';
  } else {
    routeSafety.riskLevel = 'VERY_HIGH';
  }

  // Generate recommendations
  if (highRiskSteps.length > 0) {
    routeSafety.recommendations.push(
      `Avoid ${highRiskSteps.length} high-risk areas along this route`
    );
  }

  if (routeSafety.safetyScore < 60) {
    routeSafety.recommendations.push(
      'Consider alternative routes or travel during daylight hours'
    );
  }

  if (totalIncidents > 0) {
    routeSafety.recommendations.push(
      `Be aware of ${totalIncidents} recent incidents along this route`
    );
  }

  console.log(`🛡️ Route safety analysis complete: ${routeSafety.riskLevel} risk, ${routeSafety.safetyScore} safety score`);
  
  return routeSafety;
}

// Function to analyze safety based on incidents near location
function analyzeLocationSafety(userLat, userLng, incidents, radiusKm = CONFIG.SAFETY.ANALYSIS_RADIUS_KM) {
  console.log('📍 Safety Analysis Debug:');
  console.log('- User location:', userLat, userLng);
  console.log('- Total incidents available:', incidents?.length || 0);
  
  if (!incidents || !Array.isArray(incidents)) {
    console.log('❌ No incident data available or invalid format');
    return { safe: null, message: "No incident data available" };
  }

  const nearbyIncidents = incidents.filter(incident => {
    if (!incident.coordinates || !incident.coordinates.lat || !incident.coordinates.lng) {
      console.log(`❌ Incident ${incident._id} missing coordinates`);
      return false;
    }
    
    const incidentLat = incident.coordinates.lat;
    const incidentLng = incident.coordinates.lng;
    const distance = calculateDistance(userLat, userLng, incidentLat, incidentLng);
    
    console.log(`- Distance to incident "${incident.type}" (${incident._id}): ${distance.toFixed(2)}km`);
    console.log(`  Incident location: ${incident.locationText} (${incidentLat}, ${incidentLng})`);
    
    return distance <= radiusKm;
  });

  console.log('- Nearby incidents within', radiusKm, 'km:', nearbyIncidents.length);

  const incidentCount = nearbyIncidents.length;
  let safetyLevel, message;

  if (incidentCount === 0) {
    safetyLevel = "SAFE";
    message = "No recent incidents reported in your area";
  } else if (incidentCount <= 3) {
    safetyLevel = "MODERATELY_SAFE";
    message = `Low risk area with ${incidentCount} recent incident(s)`;
  } else if (incidentCount <= 8) {
    safetyLevel = "CAUTION_ADVISED";
    message = `Moderate risk area with ${incidentCount} recent incidents`;
  } else {
    safetyLevel = "HIGH_RISK";
    message = `High risk area with ${incidentCount} recent incidents`;
  }

  console.log('- Safety assessment:', safetyLevel);
  console.log('- Safety message:', message);

  return {
    safe: safetyLevel,
    message,
    incidentCount,
    nearbyIncidents: nearbyIncidents.slice(0, 5),
    radiusKm,
    analysisTimestamp: new Date().toISOString()
  };
}

// Enhanced function to detect if user is asking for safety analysis
function isSafetyQuery(message) {
  const safetyKeywords = [
    'safe', 'safety', 'danger', 'risk', 'secure', 'security',
    'how safe', 'is it safe', 'current safety', 'area safety',
    'crime', 'incident', 'report', 'dangerous', 'unsafe',
    'emergency', 'help', 'urgent', 'immediate', 'danger',
    'what to do', 'what should I do', 'procedure', 'steps',
    'emergency tips', 'safety tips', 'precautions',
    'route', 'direction', 'path', 'way', 'travel', 'navigation',
    'safe route', 'best route', 'alternative route', 'compare routes',
    'commute', 'travel safe', 'journey', 'trip', 'drive', 'walk',
    'location safety', 'this area', 'around here', 'nearby',
    'neighborhood', 'vicinity', 'surrounding area', 'multiple locations',
    'compare safety', 'which is safer', 'safest way', 'best path'
  ];

  const messageLower = message.toLowerCase();
  return safetyKeywords.some(keyword => messageLower.includes(keyword));
}

// Enhanced function to detect specific safety categories
function getSafetyCategory(message) {
  const messageLower = message.toLowerCase();
  
  if ((messageLower.includes('route') || messageLower.includes('direction') || 
       messageLower.includes('path') || messageLower.includes('way')) &&
      (messageLower.includes('compare') || messageLower.includes('multiple') || 
       messageLower.includes('different'))) {
    return 'ROUTE_COMPARISON';
  } else if (messageLower.includes('route') || messageLower.includes('direction') || 
             messageLower.includes('navigation')) {
    return 'SAFE_ROUTE';
  } else if (messageLower.includes('current') && messageLower.includes('safe')) {
    return 'CURRENT_SAFETY';
  } else if (messageLower.includes('emergency') || messageLower.includes('tip')) {
    return 'EMERGENCY_TIPS';
  } else if (messageLower.includes('safe') || messageLower.includes('danger') || 
             messageLower.includes('compare')) {
    return 'GENERAL_SAFETY';
  }
  
  return 'GENERAL_CHAT';
}

// Function to detect multiple locations in message
function extractMultipleDestinations(message) {
  const locationPatterns = [
    /from (.+?) to (.+?)(?: and |, |$)/gi,
    /between (.+?) and (.+?)(?: and |, |$)/gi,
    /compare (.+?) with (.+?)(?: and |, |$)/gi
  ];

  const destinations = [];
  const messageLower = message.toLowerCase();

  for (const pattern of locationPatterns) {
    let match;
    while ((match = pattern.exec(message)) !== null) {
      destinations.push(...match.slice(1).filter(Boolean));
    }
  }

  // Also look for location names in the message
  const locationKeywords = [
    'johannesburg', 'pretoria', 'cape town', 'durban', 'soweto', 
    'alexandra', 'sandton', 'joburg', 'jhb', 'pta', 'cpt'
  ];

  locationKeywords.forEach(location => {
    if (messageLower.includes(location) && !destinations.includes(location)) {
      destinations.push(location);
    }
  });

  return destinations.length > 0 ? destinations : null;
}

// Function to cleanup old messages
async function cleanupOldMessages(userId) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CONFIG.CHAT.CLEANUP_OLDER_THAN_DAYS);
    
    const result = await ChatMessage.deleteMany({
      user: userId,
      createdAt: { $lt: cutoffDate }
    });
    
    if (result.deletedCount > 0) {
      console.log(`🧹 Cleaned up ${result.deletedCount} old messages for user ${userId}`);
    }
  } catch (error) {
    console.error('Error cleaning up old messages:', error);
  }
}

// Enhanced function to generate AI response with retry logic for better responses
async function generateAIResponse(chat, systemPrompt, maxRetries = CONFIG.RESPONSE.MAX_RETRIES) {
  let responseText = '';
  let attempts = 0;
  
  while (attempts < maxRetries) {
    attempts++;
    try {
      console.log(`🤖 Generating AI response (attempt ${attempts}/${maxRetries})`);
      
      const result = await chat.sendMessage(systemPrompt);

      // IMPROVED RESPONSE HANDLING WITH VALIDATION
      console.log('🔍 Full Gemini result structure:', JSON.stringify({
        hasResponse: !!result.response,
        responseType: typeof result.response,
        responseKeys: result.response ? Object.keys(result.response) : 'no response',
        hasText: result.response ? typeof result.response.text : 'no response'
      }, null, 2));

      if (result && result.response && typeof result.response.text === 'function') {
        responseText = result.response.text() || '';
      } else {
        console.warn('⚠️ Unexpected response structure:', result);
        responseText = "I apologize, but I'm having trouble processing the response.";
      }
      
      // Additional validation
      if (typeof responseText !== 'string') {
        console.warn('⚠️ Response text is not a string:', typeof responseText);
        responseText = String(responseText || '');
      }
      
      // Check response length and quality
      const responseLength = responseText.trim().length;
      console.log(`📏 Response length: ${responseLength} characters`);
      
      if (!responseText.trim()) {
        console.warn('⚠️ Empty response text after processing');
        responseText = "I apologize, but I couldn't generate a response. Please try again.";
      } else if (responseLength < CONFIG.RESPONSE.MIN_LENGTH && attempts < maxRetries) {
        console.warn(`⚠️ Response too short (${responseLength} chars), retrying...`);
        continue;
      } else {
        console.log('✅ Response generated successfully');
        break;
      }
      
    } catch (responseError) {
      console.error(`❌ Error processing Gemini response (attempt ${attempts}):`, responseError);
      if (attempts === maxRetries) {
        responseText = "I encountered an issue processing your request. Please try again.";
      }
    }
  }

  // Final validation before returning
  if (!responseText || responseText.trim() === '') {
    responseText = "I apologize, but I couldn't generate a proper response. Please try your question again.";
  }

  return responseText;
}

// Enhanced system prompts for better responses
const getEnhancedSystemPrompt = (message, safetyContext, isSafetyRequest, safetyCategory, analysisCity) => {
  if (isSafetyRequest) {
    const cityContext = analysisCity ? ` focusing on ${analysisCity}` : "";
    
    switch (safetyCategory) {
      case 'ROUTE_COMPARISON':
        return `
USER_QUERY: "${message}"
${safetyContext}

You are a comprehensive Route Safety Analysis Assistant. The user wants to compare MULTIPLE ROUTES or DESTINATIONS for safety.

**CRITICAL: Provide EXTREMELY DETAILED responses with comprehensive analysis**

🏆 **OVERALL SAFEST RECOMMENDATION**
- Clearly state which destination/route is safest overall
- Provide detailed comparison of key safety metrics
- Explain why this option is recommended

📊 **DETAILED ROUTE SAFETY COMPARISON**
For EACH destination/route analyzed:
- **Safety Score Breakdown** (0-100 with explanation)
- **Risk Level Analysis** (LOW/MODERATE/HIGH/VERY_HIGH with specific reasons)
- **Incident Analysis**: Number and types of incidents along route
- **High-Risk Areas**: Specific locations to avoid with details
- **Travel Metrics**: Time, distance, and efficiency factors
- **Step-by-Step Safety**: Analysis of each major route segment

🛡️ **COMPREHENSIVE SAFETY BREAKDOWN BY ROUTE**
- Detailed analysis of safety challenges for each route
- Specific high-risk areas identified with locations
- Incident types encountered and their implications
- Time-of-day considerations for each route
- Weather and environmental factors if relevant

🚨 **ACTIONABLE SAFETY RECOMMENDATIONS**
- **Primary Recommendation**: Safest route with detailed justification
- **Alternative Options**: Other viable routes with pros/cons
- **Time-Specific Advice**: Best/worst times to travel each route
- **Emergency Preparedness**: Specific steps for each route
- **Communication Plan**: Who to notify and when

📍 **DESTINATION SAFETY OVERVIEW**
- **Safety at Each Destination**: Detailed area assessment
- **Local Risks**: Specific risks unique to each location
- **Safe Zones**: Recommended safe areas at each destination
- **Emergency Resources**: Local contacts and facilities

**RESPONSE REQUIREMENTS:**
- Minimum 5-7 key points for each major section
- Use specific data from incident analysis when available
- Provide practical, actionable advice
- Include both immediate and preventative measures
- Use clear headings and bullet points for readability
- Engage the user with follow-up questions

Provide comprehensive, data-driven analysis to help the user make informed safety decisions.
`;

      case 'SAFE_ROUTE':
        return `
USER_QUERY: "${message}"
${safetyContext}

You are a comprehensive Safety Analysis Assistant. The user is asking for SAFE ROUTE guidance${cityContext}.

**CRITICAL: Provide EXTREMELY DETAILED route safety analysis**

🗺️ **COMPREHENSIVE ROUTE SAFETY ASSESSMENT${cityContext ? ` IN ${analysisCity.toUpperCase()}` : ''}**

📍 **CURRENT LOCATION SAFETY ANALYSIS**
- Detailed safety assessment of starting point
- Recent incident history in immediate area
- Specific risks and safety measures for current location
- Emergency resources near starting point

🎯 **DESTINATION SAFETY ANALYSIS**
- Comprehensive safety assessment of destination
- Area-specific risks and considerations
- Safe zones and areas to avoid at destination
- Local emergency contacts and facilities

🚶 **DETAILED ROUTE RECOMMENDATIONS**
- **Primary Route**: Safest path with step-by-step guidance
- **Alternative Routes**: 2-3 backup options with comparisons
- **Risk Mitigation**: Specific strategies for each route segment
- **Navigation Tips**: Landmarks and verification points

⚠️ **COMPREHENSIVE RISK ANALYSIS${cityContext ? ` FOR ${analysisCity.toUpperCase()}` : ''}**
- **Known Incident Hotspots**: Specific locations and times
- **Time-Dependent Risks**: How safety changes throughout day
- **Environmental Factors**: Lighting, visibility, terrain issues
- **Social Factors**: Crowd levels, neighborhood characteristics

🛡️ **TRAVEL SAFETY PROTOCOLS**
- **Transportation Safety**: Vehicle/pedestrian specific advice
- **Communication Plan**: Who to update and when
- **Emergency Procedures**: Step-by-step emergency response
- **Safety Equipment**: Recommended tools and apps

📱 **REAL-TIME SAFETY MONITORING**
- How to monitor safety during travel
- Warning signs to watch for
- When to alter route or seek help
- Emergency contact procedures

**RESPONSE REQUIREMENTS:**
- Provide minimum 4-6 detailed points for each section
- Include specific, actionable advice
- Reference incident data when available
- Consider time, weather, and personal factors
- Offer multiple contingency plans

Provide thorough, practical route guidance that prioritizes safety above all else.
`;

      case 'CURRENT_SAFETY':
        return `
USER_QUERY: "${message}"
${safetyContext}

You are a comprehensive Safety Analysis Assistant. The user is asking about their CURRENT LOCATION SAFETY${cityContext}.

**CRITICAL: Provide EXTREMELY DETAILED safety assessment**

🛡️ **COMPREHENSIVE SAFETY ASSESSMENT**: [SAFE/MODERATELY_SAFE/CAUTION_ADVISED/HIGH_RISK]

📍 **DETAILED LOCATION ANALYSIS${cityContext ? ` - ${analysisCity.toUpperCase()}` : ''}**
- **Area Safety Overview**: Comprehensive analysis of recent safety trends
- **Incident Patterns**: Types and frequency of recent incidents
- **Time-Based Risks**: How safety varies throughout day/night
- **Environmental Factors**: Lighting, visibility, accessibility issues
- **Community Safety**: Local initiatives and watch programs

📊 **IN-DEPTH INCIDENT ANALYSIS**
- **Recent Incident Summary**: Detailed breakdown of nearby incidents
- **Incident Types**: Categorization and risk levels of each type
- **Geographic Distribution**: Hotspots and safe zones in area
- **Temporal Patterns**: When incidents are most/least likely
- **Trend Analysis**: Improving or worsening safety trends

🚨 **IMMEDIATE SAFETY MEASURES**
- **Urgent Actions**: 3-5 specific safety measures to implement now
- **Area Avoidance**: Specific locations and routes to avoid
- **Emergency Preparedness**: Immediate contact and escape planning
- **Personal Security**: Specific protective measures for current location

💡 **PROACTIVE SAFETY STRATEGIES**
- **Daily Safety Practices**: 5-7 routines for ongoing safety
- **Environmental Awareness**: How to assess and use surroundings
- **Communication Protocols**: Who to contact and when
- **Technology Tools**: Safety apps and devices to use

🏠 **LOCATION-SPECIFIC SECURITY${cityContext ? ` FOR ${analysisCity.toUpperCase()}` : ''}**
- **Home/Work Security**: Specific measures for current location type
- **Neighborhood Resources**: Local safety contacts and facilities
- **Community Engagement**: How to connect with local safety networks
- **Infrastructure Safety**: Public transportation, lighting, etc.

**RESPONSE REQUIREMENTS:**
- Provide 5-8 detailed points for each major section
- Use specific incident data when available
- Offer both immediate and long-term strategies
- Include practical, actionable advice
- Consider personal circumstances and preferences

Base your response strictly on the provided incident data${cityContext}. If no location data is available, provide comprehensive general safety guidance while politely asking for location specifics.
`;

      case 'EMERGENCY_TIPS':
        return `
USER_QUERY: "${message}"
${safetyContext}

You are a comprehensive Safety Analysis Assistant. The user is asking for EMERGENCY TIPS and SAFETY GUIDANCE${cityContext}.

**CRITICAL: Provide EXTREMELY DETAILED emergency preparedness information**

🚨 **COMPREHENSIVE EMERGENCY PREPAREDNESS${cityContext ? ` FOR ${analysisCity.toUpperCase()}` : ''}**

📱 **IMMEDIATE EMERGENCY RESPONSE PROTOCOLS**
- **Emergency Contact List**: Specific numbers and when to use each
- **Quick Escape Planning**: Step-by-step evacuation procedures
- **Communication Strategies**: How to communicate during emergencies
- **Shelter-in-Place Procedures**: When and how to secure location
- **First Response Actions**: What to do in first 5 minutes of emergency

🛡️ **DETAILED PERSONAL SAFETY MEASURES**
- **Situational Awareness**: 7-10 specific techniques for different environments
- **Personal Security Practices**: Physical and digital safety measures
- **Risk Avoidance Strategies**: How to identify and avoid dangerous situations
- **Self-Defense Preparedness**: Legal and practical considerations
- **Property Security**: Securing home, vehicle, and personal items

🏠 **LOCATION-SPECIFIC SAFETY PROTOCOLS${cityContext ? ` FOR ${analysisCity.toUpperCase()}` : ''}**
- **Area-Specific Risks**: Detailed analysis of local emergency scenarios
- **Community Resources**: Local emergency services and facilities
- **Evacuation Routes**: Multiple options with detailed instructions
- **Safe Locations**: Designated safe zones and shelters
- **Local Emergency Procedures**: Specific protocols for area

📞 **EMERGENCY COMMUNICATION & RESOURCES**
- **Contact Hierarchy**: Who to contact in different scenarios
- **Information Sharing**: What details to provide emergency services
- **Backup Communication**: Alternative methods if primary fails
- **Document Preparation**: What information to have ready
- **Support Networks**: How to establish and use safety networks

🔧 **SAFETY EQUIPMENT & TECHNOLOGY**
- **Essential Safety Gear**: Detailed list with usage instructions
- **Safety Applications**: Specific apps and how to use them effectively
- **Emergency Kits**: Comprehensive checklist and maintenance
- **Communication Devices**: Backup options and power solutions

**RESPONSE REQUIREMENTS:**
- Provide 6-10 detailed points for each major section
- Include step-by-step procedures for common emergencies
- Offer both prevention and response strategies
- Consider different scenarios and environments
- Provide practical, immediately actionable advice

Remember to provide comprehensive, detailed emergency guidance that can be immediately implemented.
`;

      default:
        return `
USER_QUERY: "${message}"
${safetyContext}

You are a comprehensive Safety Analysis Assistant. The user has a safety-related question${cityContext}.

**CRITICAL: Provide EXTREMELY DETAILED, COMPREHENSIVE responses**

Provide a thorough, professional response focusing on safety aspects with this structure:

🔍 **QUERY ANALYSIS**
- Detailed understanding of the user's safety concern
- Identification of both stated and potential unstated concerns
- Context analysis based on available location data

📊 **COMPREHENSIVE SAFETY ASSESSMENT**
- Detailed analysis of relevant safety factors
- Data-driven insights from available incident information
- Risk assessment based on current context
- Consideration of environmental and temporal factors

🛡️ **DETAILED SAFETY RECOMMENDATIONS**
- 5-7 specific, actionable safety measures
- Both immediate and preventative strategies
- Alternative approaches for different scenarios
- Personalized considerations based on available context

💡 **PROACTIVE SAFETY PLANNING**
- Long-term safety strategies
- Environmental adaptation techniques
- Community and resource engagement
- Continuous safety improvement methods

📋 **IMPLEMENTATION GUIDANCE**
- Step-by-step action plans
- Priority-based task organization
- Progress monitoring suggestions
- Success measurement criteria

**RESPONSE REQUIREMENTS:**
- Minimum 4-6 detailed points for each section
- Use specific examples and scenarios
- Provide practical, actionable advice
- Include both general and location-specific guidance
- Engage user with thoughtful follow-up questions

If location data is available, incorporate it naturally throughout the response. If not, provide comprehensive general safety advice while suggesting how location-specific data could enhance the guidance.
`;
    }
  } else {
    // General conversation - encourage detailed, engaging responses
    return `
USER_QUERY: "${message}"

You are a friendly, helpful, and highly engaging assistant. The user is having a general conversation.

**CRITICAL: Provide WARM, DETAILED, and THOUGHTFUL responses**

💬 **CONVERSATION APPROACH:**
- Be genuinely curious and interested in the user
- Provide comprehensive, thoughtful answers
- Ask engaging follow-up questions
- Share relevant insights and perspectives
- Maintain a warm, conversational tone

🌟 **RESPONSE QUALITY:**
- Aim for detailed, substantial responses (minimum 3-5 key points)
- Provide examples and personal insights when relevant
- Show empathy and understanding
- Offer practical advice or suggestions
- Encourage continued conversation

🎯 **ENGAGEMENT STRATEGY:**
- Reference previous conversation context when available
- Ask open-ended questions to learn more about the user
- Share relevant personal experiences or analogies
- Provide multiple perspectives on topics
- Suggest related topics of interest

**AVOID:**
- Short, generic responses
- Yes/no answers without elaboration
- Abrupt topic changes
- Overly technical language without explanation

If the user seems to be asking about safety but wasn't clear, gently explore this while providing comprehensive general response. Always aim to create meaningful, engaging dialogue that makes the user feel heard and valued.
`;
  }
};

// Enhanced main chat controller
export const chatWithGemini = async (req, res) => {
  try {
    console.log('📱 Incoming chat request:', {
      timestamp: new Date().toISOString(),
      hasUserLocation: !!req.body.userLocation,
      hasDestination: !!req.body.destinationLocation,
      hasMultipleDestinations: !!req.body.multipleDestinations,
      userId: req.user?._id
    });

    // Log raw body for debugging
    console.log('📱 Raw request body:', JSON.stringify({
      message: req.body.message ? `${req.body.message.substring(0, 50)}...` : 'MISSING',
      userLocation: req.body.userLocation ? 'PRESENT' : 'MISSING',
      destinationLocation: req.body.destinationLocation ? 'PRESENT' : 'MISSING',
      multipleDestinations: req.body.multipleDestinations ? `PRESENT (${req.body.multipleDestinations.length})` : 'MISSING'
    }));

    // Validate input with better error handling
    let validatedBody;
    try {
      validatedBody = ChatUtils.validateInput(req.body, validationSchemas.chat);
    } catch (validationError) {
      console.error('❌ Validation error details:', validationError.message);
      return res.status(400).json({
        error: 'Invalid input data',
        details: JSON.parse(validationError.message.replace('Validation failed: ', '')),
        receivedBody: {
          message: req.body.message ? 'PRESENT' : 'MISSING',
          userLocation: req.body.userLocation ? 'PRESENT' : 'MISSING',
          destinationLocation: req.body.destinationLocation ? 'PRESENT' : 'MISSING',
          multipleDestinations: req.body.multipleDestinations ? 'PRESENT' : 'MISSING'
        }
      });
    }

    const { message, userLocation, destinationLocation, multipleDestinations, routePreferences } = validatedBody;
    
    const userId = req.user?._id;
    if (!userId) {
      throw new Error('Authentication required - user ID missing');
    }

    // Cleanup old messages (async - don't await)
    cleanupOldMessages(userId).catch(console.error);

    // Save user message
    const userMessage = await ChatMessage.create({
      user: userId,
      role: 'user',
      content: message,
      metadata: {
        userLocation,
        destinationLocation,
        multipleDestinations,
        routePreferences,
        timestamp: new Date().toISOString()
      }
    });

    // Get chat history
    const historyDocs = await ChatMessage.find({ user: userId })
      .sort({ createdAt: 1 })
      .limit(CONFIG.CHAT.MAX_HISTORY_MESSAGES);

    console.log('💬 Chat history count:', historyDocs.length);

    const history = historyDocs.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));

    // Enhanced query analysis
    const isSafetyRequest = isSafetyQuery(message);
    const safetyCategory = getSafetyCategory(message);
    const requestedCity = extractRequestedCity(message);
    const mentionedDestinations = extractMultipleDestinations(message);
    
    console.log('🔍 Enhanced Query Analysis:', {
      isSafetyRequest,
      safetyCategory,
      requestedCity,
      mentionedDestinations,
      messageLength: message.length
    });

    let safetyContext = "";
    let safetyAnalysis = null;
    let routeAnalysis = null;
    let incidentsData = null;
    let analysisCity = requestedCity;

    // Only fetch incidents data for safety-related queries
    if (isSafetyRequest) {
      // If no specific city requested but we have user location, try to detect city
      if (!analysisCity && userLocation) {
        analysisCity = extractCityFromLocation(userLocation);
      }
      
      incidentsData = await fetchIncidentsData(analysisCity);
      console.log('📊 Incidents data received for safety query:', {
        city: analysisCity || 'all cities',
        count: incidentsData?.length || 0
      });

      // Analyze current location safety if provided
      if (userLocation) {
        console.log('🔍 Analyzing current location safety...');
        safetyAnalysis = analyzeLocationSafety(
          userLocation.latitude, 
          userLocation.longitude, 
          incidentsData
        );
        
        safetyContext = `CURRENT_LOCATION_SAFETY: ${JSON.stringify(safetyAnalysis)}. `;
        console.log('📍 Current location safety analysis:', safetyAnalysis.safe);
      }

      // Analyze destination safety if provided
      if (destinationLocation) {
        console.log('🔍 Analyzing destination safety...');
        const destinationAnalysis = analyzeLocationSafety(
          destinationLocation.latitude, 
          destinationLocation.longitude, 
          incidentsData
        );
        
        safetyContext += `DESTINATION_SAFETY: ${JSON.stringify(destinationAnalysis)}. `;
        console.log('🎯 Destination safety analysis:', destinationAnalysis.safe);
      }

      // Enhanced route analysis for multiple destinations
      if (multipleDestinations && multipleDestinations.length > 0) {
        console.log('🔄 Analyzing multiple destinations:', multipleDestinations.length);
        
        if (userLocation) {
          const travelMode = routePreferences?.travelMode || 'driving';
          routeAnalysis = {
            destinations: [],
            bestRoute: null,
            travelMode
          };

          // Analyze routes to each destination
          for (const destination of multipleDestinations) {
            try {
              const routes = await getGoogleRoutes(userLocation, destination, travelMode);
              
              const analyzedRoutes = routes.map(route => 
                analyzeRouteSafety(route, incidentsData)
              );

              // Find safest route
              const safestRoute = analyzedRoutes.reduce((safest, current) => 
                current.safetyScore > safest.safetyScore ? current : safest
              );

              routeAnalysis.destinations.push({
                destination: destination.name || `Destination ${routeAnalysis.destinations.length + 1}`,
                coordinates: destination,
                routes: analyzedRoutes,
                safestRoute: safestRoute
              });
            } catch (routeError) {
              console.error(`❌ Error analyzing route to ${destination.name}:`, routeError);
              routeAnalysis.destinations.push({
                destination: destination.name,
                coordinates: destination,
                error: 'Could not analyze route'
              });
            }
          }

          // Determine overall best route
          if (routeAnalysis.destinations.length > 0) {
            const allSafestRoutes = routeAnalysis.destinations
              .filter(dest => dest.safestRoute)
              .map(dest => dest.safestRoute);

            if (allSafestRoutes.length > 0) {
              routeAnalysis.bestRoute = allSafestRoutes.reduce((best, current) => 
                current.safetyScore > best.safetyScore ? current : best
              );
            }
          }

          safetyContext += `ROUTE_ANALYSIS: ${JSON.stringify(routeAnalysis)}. `;
        }
      }
      
      // Add city context to safety context
      if (analysisCity) {
        safetyContext += `ANALYSIS_CITY: ${analysisCity}. `;
      }
    }

    // Use enhanced system prompt
    const systemPrompt = getEnhancedSystemPrompt(
      message, 
      safetyContext, 
      isSafetyRequest, 
      safetyCategory, 
      analysisCity
    );

    console.log('🤖 Using system prompt for:', safetyCategory);
    console.log('City filter applied:', analysisCity || 'none');
    console.log('Route analysis available:', !!routeAnalysis);

    // Enhanced model configuration for better responses
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: isSafetyRequest ? 0.3 : 0.8, // Increased for more varied responses
        maxOutputTokens: 2000, // Increased token limit
        topP: 0.9,
        topK: 40,
      }
    });

    const chat = model.startChat({ history });
    
    // Use enhanced response generation with retry logic
    const responseText = await generateAIResponse(chat, systemPrompt);

    console.log('🤖 Final response from Gemini:', {
      length: responseText.length,
      preview: responseText.substring(0, 100) + '...',
      isSafetyRequest,
      safetyCategory
    });

    const modelMessage = await ChatMessage.create({
      user: userId,
      role: 'model',
      content: responseText,
      metadata: {
        isSafetyRequest,
        safetyCategory,
        safetyAnalysis,
        routeAnalysis,
        analysisCity,
        incidentsUsed: incidentsData ? incidentsData.length : 0,
        multipleDestinationsCount: multipleDestinations ? multipleDestinations.length : 0,
        responseTimestamp: new Date().toISOString(),
        responseLength: responseText.length,
        generationAttempts: 1 // Could track actual attempts if needed
      }
    });

    return res.status(200).json({
      response: responseText,
      messages: [userMessage, modelMessage],
      safetyAnalysis: isSafetyRequest ? safetyAnalysis : null,
      routeAnalysis: isSafetyRequest ? routeAnalysis : null,
      isSafetyRequest,
      safetyCategory,
      analysisCity,
      incidentsDataAvailable: !!incidentsData,
      multipleDestinations: multipleDestinations ? multipleDestinations.length : 0,
      cacheUsed: incidentsCache.timestamp ? Date.now() - incidentsCache.timestamp < CONFIG.SAFETY.CACHE_DURATION_MS : false,
      responseMetrics: {
        length: responseText.length,
        hasDetailedContent: responseText.length > CONFIG.RESPONSE.MIN_LENGTH
      }
    });
  } catch (error) {
    return ChatUtils.handleError(res, error, 'Gemini Chat');
  }
};

// Get chat history with validation
export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const messages = await ChatMessage.find({ user: userId })
      .sort({ createdAt: 1 })
      .limit(50);

    res.status(200).json({
      messages,
      total: messages.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    ChatUtils.handleError(res, error, 'Get Chat History');
  }
};

// Clear chat history
export const clearChatHistory = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await ChatMessage.deleteMany({ user: userId });
    
    res.status(200).json({
      message: 'Chat history cleared successfully',
      deletedCount: result.deletedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    ChatUtils.handleError(res, error, 'Clear Chat History');
  }
};

// Get system status
export const getSystemStatus = async (req, res) => {
  try {
    const status = {
      service: 'operational',
      timestamp: new Date().toISOString(),
      cache: {
        hasData: !!incidentsCache.data,
        age: incidentsCache.timestamp ? Date.now() - incidentsCache.timestamp : null,
        city: incidentsCache.city,
        itemCount: incidentsCache.data?.length || 0
      },
      routes: {
        cachedRoutes: routesCache.size
      },
      config: {
        supportedCities: CONFIG.CITIES.SUPPORTED,
        analysisRadius: CONFIG.SAFETY.ANALYSIS_RADIUS_KM,
        cacheDuration: CONFIG.SAFETY.CACHE_DURATION_MS,
        googleMaps: !!CONFIG.GOOGLE.MAPS_API_KEY,
        responseSettings: {
          minLength: CONFIG.RESPONSE.MIN_LENGTH,
          targetLength: CONFIG.RESPONSE.TARGET_LENGTH,
          maxRetries: CONFIG.RESPONSE.MAX_RETRIES
        }
      }
    };

    res.status(200).json(status);
  } catch (error) {
    ChatUtils.handleError(res, error, 'Get System Status');
  }
};
export const listModels = async (req, res) => {
  try {
    const models = await genAI.listModels();
    res.status(200).json(models);
  } catch (error) {
    ChatUtils.handleError(res, error, 'List Models');
  }
};