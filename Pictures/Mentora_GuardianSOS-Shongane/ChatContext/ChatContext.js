// Updated ChatContext.js - Enhanced with multi-location support
import React, { createContext, useContext, useState, useEffect } from "react";
import { useUser } from "../Users/useContext";
import { Alert } from "react-native";
import * as Location from 'expo-location';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { token } = useUser();
  const [chatMessages, setChatMessages] = useState([
    {
      id: "1",
      role: "model",
      content: "🔒 Hello! I'm your Safety Analysis Assistant. I can analyze your current location safety, compare multiple destinations, and provide safe route recommendations using real incident data."
    }
  ]);
  const [userLocation, setUserLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationPermission, setLocationPermission] = useState(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [multipleDestinations, setMultipleDestinations] = useState([]);

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermission(status);
      console.log('📍 Location permission status:', status);
    } catch (error) {
      console.error('❌ Error checking location permission:', error);
      setLocationPermission('undetermined');
    }
  };

  const getCurrentLocation = async () => {
    if (isGettingLocation) {
      console.log('📍 Location request already in progress');
      return null;
    }

    try {
      setIsGettingLocation(true);
      console.log('📍 Starting Expo location request...');

      let { status } = await Location.getForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('📍 Requesting location permission...');
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        status = newStatus;
        
        if (status !== 'granted') {
          console.warn('📍 Location permission denied by user');
          Alert.alert(
            "Location Permission Required", 
            "This app needs location access to provide accurate safety analysis. Please enable location permissions in your device settings.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => Location.getForegroundPermissionsAsync() }
            ]
          );
          return null;
        }
      }

      console.log('📍 Location permission granted, getting current position...');
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 15000,
      });

      console.log('📍 Location obtained successfully via Expo');
      const locationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude,
        altitudeAccuracy: location.coords.altitudeAccuracy,
        heading: location.coords.heading,
        speed: location.coords.speed,
        timestamp: new Date().toISOString()
      };
      
      setUserLocation(locationData);
      setLocationPermission('granted');
      
      console.log('📍 User location details:', {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy + ' meters'
      });
      
      return locationData;
      
    } catch (error) {
      console.error('❌ Error getting location with Expo:', error);
      
      let errorMessage = "Unable to get your current location. ";
      
      if (error.code === 'PERMISSION_DENIED') {
        errorMessage += "Location permission was denied. Please enable location services in your device settings.";
      } else if (error.code === 'LOCATION_UNAVAILABLE') {
        errorMessage += "Location services are unavailable. Please check your GPS and try again.";
      } else if (error.code === 'TIMEOUT') {
        errorMessage += "Location request timed out. Please try again in an area with better GPS signal.";
      } else {
        errorMessage += "Please check your location services and try again.";
      }
      
      Alert.alert("Location Error", errorMessage);
      return null;
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Enhanced sendMessage function with multi-destination support
  const sendMessage = async (messageText, destinationLocation = null, routePreferences = {}) => {
    if (!messageText.trim()) {
      console.warn('⚠️ Attempted to send empty message');
      return;
    }

    if (!token) {
      console.error('❌ No authentication token available');
      Alert.alert("Authentication Error", "No token found. Please log in again.");
      return;
    }

    if (isSendingMessage) {
      console.warn('⚠️ Message already being sent');
      return;
    }

    console.log('💬 Sending message:', messageText);

    // Add user's message to chat immediately
    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date().toISOString()
    };
    setChatMessages((prev) => [...prev, userMessage]);
    setIsSendingMessage(true);

    try {
      // Get current location if not already available
      let currentLocation = userLocation;
      if (!currentLocation) {
        console.log('📍 Getting current location for message...');
        currentLocation = await getCurrentLocation();
        
        if (!currentLocation) {
          console.log('📍 Location not available, sending message without location data');
          currentLocation = null;
        }
      } else {
        console.log('📍 Using cached location:', {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude
        });
      }

      // Create enhanced payload with multiple destinations
      const requestPayload = { 
        message: messageText.trim(),
        routePreferences: {
          avoidHighCrimeAreas: true,
          preferWellLitRoutes: true,
          avoidIsolatedAreas: true,
          travelMode: 'driving',
          ...routePreferences
        }
      };

      // Only include location if available and has required fields
      if (currentLocation && currentLocation.latitude && currentLocation.longitude) {
        requestPayload.userLocation = {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy,
          altitude: currentLocation.altitude,
          altitudeAccuracy: currentLocation.altitudeAccuracy,
          heading: currentLocation.heading,
          speed: currentLocation.speed
        };
      }

      // Handle single destination
      if (destinationLocation && destinationLocation.latitude && destinationLocation.longitude) {
        requestPayload.destinationLocation = {
          latitude: destinationLocation.latitude,
          longitude: destinationLocation.longitude,
          accuracy: destinationLocation.accuracy,
          altitude: destinationLocation.altitude,
          altitudeAccuracy: destinationLocation.altitudeAccuracy,
          heading: destinationLocation.heading,
          speed: destinationLocation.speed,
          locationName: destinationLocation.locationName
        };
      }

      // Handle multiple destinations
      if (multipleDestinations.length > 0) {
        requestPayload.multipleDestinations = multipleDestinations.map((dest, index) => ({
          name: dest.name || `Destination ${index + 1}`,
          latitude: dest.latitude,
          longitude: dest.longitude,
          locationName: dest.locationName
        }));
      }

      console.log('📤 Sending enhanced chat request with payload:', {
        message: messageText,
        hasUserLocation: !!requestPayload.userLocation,
        hasDestination: !!requestPayload.destinationLocation,
        multipleDestinations: requestPayload.multipleDestinations?.length || 0,
        routePreferences: requestPayload.routePreferences
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout for route analysis

      const res = await fetch("https://baroscopical-natosha-overrigid.ngrok-free.dev/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestPayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Enhanced response handling
      console.log('📤 Response status:', res.status);
      
      const contentType = res.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
        console.log('✅ Received JSON response from server:', {
          hasResponse: !!data.response,
          isSafetyRequest: data.isSafetyRequest,
          safetyCategory: data.safetyCategory,
          hasRouteAnalysis: !!data.routeAnalysis,
          multipleDestinations: data.multipleDestinations
        });
      } else {
        const textResponse = await res.text();
        console.error("❌ Non-JSON chat response received:", textResponse.substring(0, 200));
        
        // Try to parse as JSON anyway in case content-type is wrong
        try {
          data = JSON.parse(textResponse);
          console.log('✅ Parsed response despite content-type issue');
        } catch (e) {
          throw new Error(`Server returned invalid response: ${textResponse.substring(0, 100)}`);
        }
      }

      if (!res.ok) {
        console.error('❌ Chat API returned error status:', res.status);
        console.error('❌ Error data:', data);
        
        // Handle validation errors specifically
        if (res.status === 400 && data.details) {
          throw new Error(`Validation error: ${JSON.stringify(data.details)}`);
        }
        
        throw new Error(data.error || data.message || `Safety analysis failed (${res.status})`);
      }

      console.log('✅ Chat API success - Safety assessment:', data.safetyAnalysis?.safe);
      if (data.routeAnalysis) {
        console.log('🗺️ Route analysis completed:', {
          destinations: data.routeAnalysis.destinations?.length,
          bestRouteScore: data.routeAnalysis.bestRoute?.safetyScore
        });
      }

      const replyText = data.response || "I apologize, but I couldn't complete the safety analysis. Please try again.";

      const botMessage = {
        id: Date.now().toString() + "_bot",
        role: "model",
        content: replyText,
        timestamp: new Date().toISOString(),
        metadata: {
          isSafetyRequest: data.isSafetyRequest,
          safetyAnalysis: data.safetyAnalysis,
          safetyCategory: data.safetyCategory,
          routeAnalysis: data.routeAnalysis,
          multipleDestinations: data.multipleDestinations
        }
      };

      setChatMessages((prev) => [...prev, botMessage]);

      // Enhanced safety alerts
      if (data.safetyAnalysis) {
        if (data.safetyAnalysis.safe === "HIGH_RISK") {
          Alert.alert(
            "🚨 HIGH RISK ALERT", 
            data.safetyAnalysis.message || "This area has significant safety concerns. Please exercise extreme caution.",
            [{ text: "OK", style: "destructive" }]
          );
        } else if (data.safetyAnalysis.safe === "CAUTION_ADVISED") {
          Alert.alert(
            "⚠️ Safety Advisory", 
            data.safetyAnalysis.message || "This area has moderate safety concerns. Please review the recommendations.",
            [{ text: "OK", style: "default" }]
          );
        }
      }

      // Route analysis summary alert
      if (data.routeAnalysis && data.routeAnalysis.bestRoute) {
        const bestRoute = data.routeAnalysis.bestRoute;
        Alert.alert(
          "🏆 Safest Route Found",
          `Safety Score: ${bestRoute.safetyScore}/100\nRisk Level: ${bestRoute.riskLevel}\nDistance: ${bestRoute.totalDistance?.text || 'N/A'}`,
          [{ text: "View Details", style: "default" }]
        );
      }

    } catch (err) {
      console.error("❌ Safety analysis error:", {
        message: err.message,
        stack: err.stack
      });
      
      let userFriendlyMessage = err.message;
      let botErrorMessage = "⚠️ Unable to perform safety analysis. ";

      // Handle specific error cases
      if (err.message.includes('Validation error')) {
        userFriendlyMessage = "There was an issue with the data sent to the server. Please try again.";
        botErrorMessage += "Data validation failed.";
      } else if (err.message.includes('Location permission') || err.message.includes('PERMISSION_DENIED')) {
        userFriendlyMessage = "Location access is required for safety analysis. Please enable location permissions in your device settings.";
        botErrorMessage += "Location access denied.";
      } else if (err.message.includes('Network request failed') || err.name === 'AbortError') {
        userFriendlyMessage = "Network connection failed or request timed out. Please check your internet connection.";
        botErrorMessage += "Network connection issue.";
      } else if (err.message.includes('Server returned invalid')) {
        userFriendlyMessage = "The safety analysis service is temporarily unavailable. Please try again later.";
        botErrorMessage += "Service temporarily unavailable.";
      } else {
        botErrorMessage += err.message;
      }
      
      Alert.alert("Analysis Error", userFriendlyMessage);
      
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "_error",
          role: "model",
          content: botErrorMessage,
          timestamp: new Date().toISOString(),
          isError: true
        },
      ]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Enhanced safety analysis functions
  const analyzeCurrentLocation = async () => {
    console.log('🔍 Analyzing current location safety...');
    const location = await getCurrentLocation();
    if (location) {
      await sendMessage("Analyze the safety of my current location using recent incident data.");
    } else {
      Alert.alert("Location Required", "Unable to access your location for safety analysis. Please check your location permissions.");
    }
  };

  const analyzeDestinationSafety = async (destinationName, destinationCoords = null, routePreferences = {}) => {
    console.log('🎯 Analyzing destination safety:', destinationName);
    
    let destinationLocation = destinationCoords;
    
    if (!destinationCoords && destinationName) {
      Alert.alert("Info", "Please provide coordinates for accurate destination safety analysis.");
      return;
    }

    await sendMessage(
      `Analyze safety for destination: ${destinationName}. Provide route safety recommendations and area assessment.`,
      destinationLocation,
      routePreferences
    );
  };

  // NEW: Compare multiple destinations
  const compareMultipleDestinations = async (destinations = [], routePreferences = {}) => {
    if (destinations.length < 2) {
      Alert.alert("Multiple Destinations Required", "Please provide at least 2 destinations to compare.");
      return;
    }

    console.log('🔄 Comparing multiple destinations:', destinations.length);
    
    const location = await getCurrentLocation();
    if (!location) {
      Alert.alert("Location Required", "Unable to access your current location for comparison.");
      return;
    }

    // Store destinations for the API call
    setMultipleDestinations(destinations);

    const destinationNames = destinations.map(d => d.name || `Location ${destinations.indexOf(d) + 1}`).join(', ');
    
    await sendMessage(
      `Compare safety for these destinations: ${destinationNames}. Analyze routes from my current location and recommend the safest option.`,
      null,
      routePreferences
    );
  };

  // NEW: Add destination to comparison list
  const addDestinationToCompare = (destination) => {
    if (!destination.latitude || !destination.longitude) {
      Alert.alert("Invalid Destination", "Please provide valid coordinates for the destination.");
      return;
    }

    const newDestinations = [...multipleDestinations, {
      ...destination,
      name: destination.name || `Destination ${multipleDestinations.length + 1}`
    }];

    setMultipleDestinations(newDestinations);
    
    Alert.alert(
      "Destination Added", 
      `Added "${destination.name || 'New Destination'}" to comparison list. Total: ${newDestinations.length} destinations.`,
      [
        { text: "Compare Now", onPress: () => compareMultipleDestinations(newDestinations) },
        { text: "Add More", style: "cancel" }
      ]
    );
  };

  // NEW: Clear comparison list
  const clearDestinationComparison = () => {
    setMultipleDestinations([]);
    Alert.alert("Comparison Cleared", "All destinations have been removed from the comparison list.");
  };

  // Fixed manual location setting
  const setManualLocation = (latitude, longitude, locationName = null) => {
    const manualLocation = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      accuracy: 100,
      isManual: true,
      locationName: locationName,
      timestamp: new Date().toISOString()
    };
    setUserLocation(manualLocation);
    console.log('📍 Manual location set:', manualLocation);
    Alert.alert(
      "Location Set", 
      `Manual location has been set successfully.${locationName ? `\n\n${locationName}` : ''}`
    );
  };

  // Clear chat history
  const clearChat = () => {
    console.log('🗑️ Clearing chat history');
    setChatMessages([
      {
        id: "1",
        role: "model",
        content: "🔒 Hello! I'm your Safety Analysis Assistant. I can analyze your current location safety, compare multiple destinations, and provide safe route recommendations using real incident data."
      }
    ]);
    setUserLocation(null);
    setMultipleDestinations([]);
  };

  // Refresh location
  const refreshLocation = async () => {
    console.log('🔄 Refreshing location...');
    const newLocation = await getCurrentLocation();
    if (newLocation) {
      Alert.alert("Location Updated", "Your location has been refreshed successfully.");
    }
    return newLocation;
  };

  // Get location permission status
  const getLocationPermissionStatus = () => {
    return locationPermission;
  };

  // Add message directly (for testing or pre-populating)
  const addMessage = (role, content, metadata = {}) => {
    const message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date().toISOString(),
      ...metadata
    };
    setChatMessages(prev => [...prev, message]);
  };

  return (
    <ChatContext.Provider value={{ 
      chatMessages, 
      sendMessage, 
      analyzeCurrentLocation,
      analyzeDestinationSafety,
      compareMultipleDestinations,
      addDestinationToCompare,
      clearDestinationComparison,
      multipleDestinations,
      userLocation,
      getCurrentLocation,
      setManualLocation,
      refreshLocation,
      clearChat,
      isGettingLocation,
      isSendingMessage,
      locationPermission,
      getLocationPermissionStatus,
      addMessage
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};