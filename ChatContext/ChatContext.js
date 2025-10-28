// Updated ChatContext.js - Using Expo Location
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
      content: "🔒 Hello! I'm your Safety Analysis Assistant. I can analyze your current location and destination safety using real incident data. Please share your location for accurate safety assessment."
    }
  ]);
  const [userLocation, setUserLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationPermission, setLocationPermission] = useState(null);

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
        speed: location.coords.speed
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

  const sendMessage = async (messageText, destinationLocation = null) => {
    if (!messageText.trim()) {
      console.warn('⚠️ Attempted to send empty message');
      return;
    }

    if (!token) {
      console.error('❌ No authentication token available');
      Alert.alert("Authentication Error", "No token found. Please log in again.");
      return;
    }

    console.log('💬 Sending message:', messageText);

    // Add user's message to chat immediately
    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
    };
    setChatMessages((prev) => [...prev, userMessage]);

    try {
      // Get current location if not already available
      let currentLocation = userLocation;
      if (!currentLocation) {
        console.log('📍 Getting current location for message...');
        currentLocation = await getCurrentLocation();
        
        if (!currentLocation) {
          // If location is not available, send message without location data
          console.log('📍 Location not available, sending message without location data');
          currentLocation = null;
        }
      } else {
        console.log('📍 Using cached location:', {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude
        });
      }

      const requestPayload = { 
        message: messageText,
        userLocation: currentLocation,
        destinationLocation: destinationLocation
      };

      console.log('📤 Sending chat request with payload:', {
        message: messageText,
        hasUserLocation: !!currentLocation,
        hasDestination: !!destinationLocation
      });

      const res = await fetch("https://baroscopical-natosha-overrigid.ngrok-free.dev/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestPayload),
      });

      // Check response content type
      const contentType = res.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
        console.log('✅ Received JSON response from server');
      } else {
        const textResponse = await res.text();
        console.error("❌ Non-JSON chat response received:", textResponse.substring(0, 200));
        throw new Error("Server returned invalid response format");
      }

      if (!res.ok) {
        console.error('❌ Chat API returned error status:', res.status);
        console.error('❌ Error data:', data);
        throw new Error(data.error || data.message || `Safety analysis failed (${res.status})`);
      }

      console.log('✅ Chat API success - Safety assessment:', data.safetyAnalysis?.safe);

      const replyText = data.response || data.reply || "I apologize, but I couldn't complete the safety analysis. Please try again.";

      const botMessage = {
        id: Date.now().toString() + "_bot",
        role: "model",
        content: replyText,
      };

      setChatMessages((prev) => [...prev, botMessage]);

      // Show safety alert if high risk detected
      if (replyText.includes("HIGH_RISK") || replyText.includes("CAUTION_ADVISED")) {
        console.warn('🚨 Safety alert triggered');
        Alert.alert(
          "🚨 Safety Alert", 
          "This area has safety concerns. Please review the safety recommendations.",
          [{ text: "OK", style: "default" }]
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
      if (err.message.includes('Location permission') || err.message.includes('PERMISSION_DENIED')) {
        userFriendlyMessage = "Location access is required for safety analysis. Please enable location permissions in your device settings.";
        botErrorMessage += "Location access denied.";
      } else if (err.message.includes('Network request failed')) {
        userFriendlyMessage = "Network connection failed. Please check your internet connection.";
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
        },
      ]);
    }
  };

  // Specialized safety analysis functions
  const analyzeCurrentLocation = async () => {
    console.log('🔍 Analyzing current location safety...');
    const location = await getCurrentLocation();
    if (location) {
      await sendMessage("Analyze the safety of my current location using recent incident data.");
    } else {
      Alert.alert("Location Required", "Unable to access your location for safety analysis. Please check your location permissions.");
    }
  };

  const analyzeDestinationSafety = async (destinationName, destinationCoords = null) => {
    console.log('🎯 Analyzing destination safety:', destinationName);
    
    let destinationLocation = destinationCoords;
    
    if (!destinationCoords && destinationName) {
      Alert.alert("Info", "Please provide coordinates for accurate destination safety analysis.");
      return;
    }

    await sendMessage(
      `Analyze safety for destination: ${destinationName}. Compare with my current location and provide route safety recommendations.`,
      destinationLocation
    );
  };

  // Manual location setting (fallback when GPS fails)
  const setManualLocation = (latitude, longitude, locationName = null) => {
    const manualLocation = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longongitude),
      accuracy: 100,
      isManual: true,
      locationName: locationName
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
        content: "🔒 Hello! I'm your Safety Analysis Assistant. I can analyze your current location and destination safety using real incident data. Please share your location for accurate safety assessment."
      }
    ]);
    setUserLocation(null);
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

  return (
    <ChatContext.Provider value={{ 
      chatMessages, 
      sendMessage, 
      analyzeCurrentLocation,
      analyzeDestinationSafety,
      userLocation,
      getCurrentLocation,
      setManualLocation,
      refreshLocation,
      clearChat,
      isGettingLocation,
      locationPermission,
      getLocationPermissionStatus
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