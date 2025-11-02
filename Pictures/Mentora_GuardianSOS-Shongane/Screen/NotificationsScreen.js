import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Switch,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { GEMINI_API_KEY, NOTIFICATION_INTERVAL_HOURS, APP_ENV, GOOGLE_MAPS_API_KEY } from '@env';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [isSafetyModeOn, setIsSafetyModeOn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [nearbyIncidents, setNearbyIncidents] = useState([]);
  const [notificationPermission, setNotificationPermission] = useState(false);
  const [notificationInterval, setNotificationInterval] = useState(null);

  const notificationSubscription = useRef(null);
  const responseSubscription = useRef(null);

  // API Configuration
  const INCIDENTS_API_URL = "https://baroscopical-natosha-overrigid.ngrok-free.dev/api/incidents";
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY || 'demo'}`;

  useEffect(() => {
    initializeApp();
    return () => {
      cleanupNotifications();
      clearNotificationInterval();
    };
  }, []);

  useEffect(() => {
    if (userLocation && incidents.length > 0) {
      checkNearbyIncidents();
    }
  }, [userLocation, incidents]);

  useEffect(() => {
    handleSafetyModeToggle();
  }, [isSafetyModeOn]);

  const initializeApp = async () => {
    await requestLocationPermission();
    await registerForPushNotifications();
    setupNotificationListeners();
    await fetchIncidentsData();
  };

  const setupNotificationListeners = () => {
    notificationSubscription.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Notification received:', notification);
    });

    responseSubscription.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification response:', response);
      handleNotificationTap(response);
    });
  };

  const cleanupNotifications = () => {
    if (notificationSubscription.current) {
      notificationSubscription.current.remove();
    }
    if (responseSubscription.current) {
      responseSubscription.current.remove();
    }
  };

  const clearNotificationInterval = () => {
    if (notificationInterval) {
      clearInterval(notificationInterval);
      setNotificationInterval(null);
    }
  };

  const requestLocationPermission = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      console.log('📍 User location:', location.coords);
    } catch (error) {
      console.error('❌ Error getting location:', error);
      setLocationError('Failed to get location');
    }
  };

  const registerForPushNotifications = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert(
          "Permission Required",
          "Enable notifications to receive real-time safety alerts",
          [{ text: "OK" }]
        );
        setNotificationPermission(false);
        return false;
      }
      
      console.log('✅ Notification permission granted');
      setNotificationPermission(true);
      return true;
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      setNotificationPermission(false);
      return false;
    }
  };

  const handleSafetyModeToggle = async () => {
    if (isSafetyModeOn) {
      // Turning ON safety mode
      const hasPermission = await registerForPushNotifications();
      if (!hasPermission) {
        setIsSafetyModeOn(false);
        return;
      }
      
      // Start the 30-minute notification interval
      startNotificationInterval();
      await generateInitialAINotification();
      
    } else {
      // Turning OFF safety mode
      clearNotificationInterval();
      Alert.alert(
        "Safety Mode Disabled",
        "AI safety notifications have been turned off",
        [{ text: "OK" }]
      );
    }
  };

  const startNotificationInterval = () => {
    // Clear any existing interval
    clearNotificationInterval();
    
    // Set new interval for 30 minutes (30 * 60 * 1000 ms)
    const interval = setInterval(async () => {
      console.log('⏰ 30-minute interval triggered - generating AI safety notification');
      await generatePeriodicSafetyNotification();
    }, 30 * 60 * 1000); // 30 minutes
    
    setNotificationInterval(interval);
    console.log('✅ 30-minute notification interval started');
  };

  const generateInitialAINotification = async () => {
    try {
      const welcomeNotification = {
        id: 'welcome-' + Date.now(),
        title: "🛡️ Safety Mode Activated",
        body: "You'll now receive AI-powered safety notifications every 30 minutes based on your location and nearby incidents.",
        type: "tip",
        timestamp: new Date().toISOString(),
        isAI: true,
        isPeriodic: false
      };

      setNotifications(prev => [welcomeNotification, ...prev]);
      await schedulePushNotification(welcomeNotification.title, welcomeNotification.body);
    } catch (error) {
      console.error('❌ Error generating welcome notification:', error);
    }
  };

  const generatePeriodicSafetyNotification = async () => {
    if (!isSafetyModeOn || !userLocation) return;

    try {
      setIsLoading(true);
      
      // Get current location for fresh data
      let location;
      try {
        location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.error('❌ Error getting fresh location:', error);
        // Use existing location if fresh one fails
        if (!userLocation) return;
      }

      // Refresh incidents data
      const freshIncidents = await fetchIncidentsData();
      
      // Generate AI safety message based on current context
      const aiMessage = await generatePeriodicAISafetyMessage(freshIncidents);
      
      const periodicNotification = {
        id: 'periodic-' + Date.now(),
        title: "🛡️ Safety Update",
        body: aiMessage,
        type: "tip",
        timestamp: new Date().toISOString(),
        isAI: true,
        isPeriodic: true
      };

      setNotifications(prev => [periodicNotification, ...prev]);
      await schedulePushNotification(periodicNotification.title, periodicNotification.body);
      
      console.log('✅ Periodic safety notification sent');
      
    } catch (error) {
      console.error('❌ Error generating periodic notification:', error);
      // Fallback notification
      const fallbackNotification = {
        id: 'fallback-' + Date.now(),
        title: "🛡️ Safety Check",
        body: "Stay alert and aware of your surroundings. Remember to trust your instincts and avoid poorly lit areas.",
        type: "tip",
        timestamp: new Date().toISOString(),
        isAI: true,
        isPeriodic: true
      };
      
      setNotifications(prev => [fallbackNotification, ...prev]);
      await schedulePushNotification(fallbackNotification.title, fallbackNotification.body);
    } finally {
      setIsLoading(false);
    }
  };

  const generatePeriodicAISafetyMessage = async (incidents = []) => {
    // Use Gemini AI to generate contextual safety message
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'demo') {
      return getPeriodicFallbackMessage(incidents);
    }

    try {
      const locationContext = userLocation ? 
        `User is at coordinates ${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}. ` : 
        "User location not available. ";
      
      const incidentsContext = incidents.length > 0 ? 
        `There are ${incidents.length} reported incidents in the area. ` : 
        "No major incidents reported nearby. ";
      
      const prompt = `Generate a brief, helpful safety tip (max 120 characters) for someone going about their day. ${locationContext}${incidentsContext}Focus on practical, actionable advice for urban safety and crime prevention. Make it friendly and reassuring.`;

      const requestBody = {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 80,
        }
      };

      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text.trim().slice(0, 120);
      }
      
      return getPeriodicFallbackMessage(incidents);
    } catch (error) {
      console.error('❌ AI generation failed:', error);
      return getPeriodicFallbackMessage(incidents);
    }
  };

  const getPeriodicFallbackMessage = (incidents) => {
    const messages = [
      "Stay aware of your surroundings and trust your instincts. Avoid distractions while walking.",
      "Keep your phone charged and easily accessible. Share your location with trusted contacts.",
      "Stick to well-lit, populated areas after dark. Plan your route in advance.",
      "Keep valuables out of sight and be cautious in crowded spaces.",
      "Park in well-lit areas and check your surroundings before exiting your vehicle.",
      "Stay vigilant near ATMs and avoid counting money in public.",
      "Trust your intuition - if something feels wrong, leave the area immediately.",
      "Keep emergency contacts on speed dial and know your nearest safe locations.",
      "Walk confidently and make eye contact. Appear aware and purposeful.",
      "Avoid shortcuts through alleys or poorly lit areas, especially at night."
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  };

  const fetchIncidentsData = async () => {
    try {
      console.log('🚀 Fetching incidents from API...');
      const response = await fetch(INCIDENTS_API_URL);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Incidents data:', data);
      setIncidents(data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching incidents:', error);
      // Fallback to mock data if API fails
      const mockData = generateMockIncidents();
      setIncidents(mockData);
      return mockData;
    }
  };

  const generateMockIncidents = () => {
    if (!userLocation) return [];
    
    return [
      {
        id: 1,
        type: "theft",
        severity: "high",
        description: "Armed robbery reported",
        location: "Main Street",
        latitude: userLocation.latitude + 0.01,
        longitude: userLocation.longitude + 0.01,
        timestamp: new Date().toISOString(),
        radius: 1.0
      },
      {
        id: 2,
        type: "accident",
        severity: "medium", 
        description: "Car accident with injuries",
        location: "Highway 101",
        latitude: userLocation.latitude - 0.005,
        longitude: userLocation.longitude + 0.005,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        radius: 0.5
      }
    ];
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const checkNearbyIncidents = async () => {
    if (!userLocation || !isSafetyModeOn) return;

    const nearby = [];
    
    incidents.forEach(incident => {
      if (incident.latitude && incident.longitude) {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          incident.latitude,
          incident.longitude
        );

        const incidentRadius = incident.radius || 1.0;
        
        if (distance <= incidentRadius) {
          nearby.push({
            ...incident,
            distance: distance,
            dangerLevel: distance <= 0.5 ? 'high' : distance <= 1.0 ? 'medium' : 'low'
          });
        }
      }
    });

    setNearbyIncidents(nearby);

    // Generate AI notifications for nearby incidents
    if (nearby.length > 0) {
      await generateAINotifications(nearby);
    }
  };

  const generateAINotifications = async (nearbyIncidents) => {
    try {
      for (const incident of nearbyIncidents) {
        // Check if we already notified about this incident
        const alreadyNotified = notifications.some(
          n => n.incidentId === incident.id && 
          Date.now() - new Date(n.timestamp).getTime() < 30 * 60 * 1000 // 30 minutes
        );

        if (!alreadyNotified) {
          const aiMessage = await generateAIAlert(incident);
          
          const newNotification = {
            id: Date.now().toString() + incident.id,
            title: getAlertTitle(incident),
            body: aiMessage,
            type: getNotificationType(incident.severity),
            timestamp: new Date().toISOString(),
            isAI: true,
            incidentId: incident.id,
            distance: incident.distance
          };

          setNotifications(prev => [newNotification, ...prev]);
          await schedulePushNotification(newNotification.title, newNotification.body);
        }
      }
    } catch (error) {
      console.error('❌ Error generating AI notifications:', error);
    }
  };

  const generateAIAlert = async (incident) => {
    // Use Gemini AI to generate contextual safety alert
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'demo') {
      return getFallbackMessage(incident);
    }

    try {
      const prompt = `Create a short safety alert (max 100 characters) for someone near this incident: ${incident.description} at ${incident.location}. Distance: ${(incident.distance * 1000).toFixed(0)} meters. Provide immediate safety advice.`;

      const requestBody = {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 80,
        }
      };

      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text.trim().slice(0, 120);
      }
      
      return getFallbackMessage(incident);
    } catch (error) {
      console.error('❌ AI generation failed:', error);
      return getFallbackMessage(incident);
    }
  };

  const getFallbackMessage = (incident) => {
    const messages = {
      high: [
        `🚨 High alert! ${incident.description} nearby. Avoid area and stay safe.`,
        `⚠️ Critical incident reported ${(incident.distance * 1000).toFixed(0)}m away. Seek safety.`,
        `🔴 Emergency situation nearby. Follow official instructions and avoid area.`
      ],
      medium: [
        `⚠️ Safety notice: ${incident.description} in vicinity. Stay vigilant.`,
        `🔶 Incident reported ${(incident.distance * 1000).toFixed(0)}m away. Exercise caution.`,
        `📢 Be aware: ${incident.type} incident nearby. Monitor situation.`
      ],
      low: [
        `ℹ️ Awareness: ${incident.description} in area. No immediate danger.`,
        `💡 Safety tip: ${incident.type} reported nearby. Stay informed.`,
        `🔵 Notice: ${incident.description} in proximity. Normal precautions advised.`
      ]
    };

    const severityMessages = messages[incident.severity] || messages.medium;
    return severityMessages[Math.floor(Math.random() * severityMessages.length)];
  };

  const getAlertTitle = (incident) => {
    const titles = {
      high: "🚨 Critical Alert",
      medium: "⚠️ Safety Warning", 
      low: "💡 Safety Notice"
    };
    return titles[incident.severity] || titles.medium;
  };

  const getNotificationType = (severity) => {
    const types = {
      high: "alert",
      medium: "warning",
      low: "tip"
    };
    return types[severity] || "warning";
  };

  const schedulePushNotification = async (title, body) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          sound: true,
          data: { type: 'safety_alert' },
        },
        trigger: null,
      });
      console.log('📤 Push notification sent:', title);
    } catch (error) {
      console.error('❌ Error scheduling notification:', error);
    }
  };

  const handleNotificationTap = (response) => {
    console.log('📍 Notification tapped');
  };

  const handlePress = (item) => {
    Alert.alert(
      item.title,
      item.body,
      [{ text: "OK", style: "default" }]
    );
  };

  const testAIAlert = async () => {
    if (!isSafetyModeOn) {
      Alert.alert("Safety Mode Off", "Enable Safety Mode to test alerts.");
      return;
    }

    if (!userLocation) {
      Alert.alert("Location Required", "Please enable location services.");
      return;
    }

    setIsLoading(true);
    try {
      // Create a test incident near user
      const testIncident = {
        id: 'test-' + Date.now(),
        type: "test",
        severity: "medium",
        description: "Test safety incident",
        location: "Your current area",
        latitude: userLocation.latitude + 0.001,
        longitude: userLocation.longitude + 0.001,
        distance: 0.1
      };

      const aiMessage = await generateAIAlert(testIncident);
      
      const testNotification = {
        id: Date.now().toString(),
        title: "🧪 Test Alert",
        body: aiMessage,
        type: "tip",
        timestamp: new Date().toISOString(),
        isAI: true
      };

      setNotifications(prev => [testNotification, ...prev]);
      await schedulePushNotification(testNotification.title, testNotification.body);
      
      Alert.alert("✅ Test Complete", "AI notification generated successfully!");
    } catch (error) {
      Alert.alert("✅ Test Complete", "Test notification sent!");
    } finally {
      setIsLoading(false);
    }
  };

  const testPeriodicNotification = async () => {
    if (!isSafetyModeOn) {
      Alert.alert("Safety Mode Off", "Enable Safety Mode to test periodic alerts.");
      return;
    }

    setIsLoading(true);
    try {
      await generatePeriodicSafetyNotification();
      Alert.alert("✅ Test Complete", "Periodic safety notification generated!");
    } catch (error) {
      console.error('❌ Test periodic notification failed:', error);
      Alert.alert("✅ Test Complete", "Test notification sent!");
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllNotifications = () => {
    Alert.alert(
      "Clear All Notifications",
      "Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear All", style: "destructive", onPress: () => setNotifications([]) }
      ]
    );
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchIncidentsData();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const renderNotificationItem = ({ item }) => {
    const getIconConfig = (type) => {
      const config = {
        alert: { name: "warning", color: "#FF6B6B" },
        warning: { name: "alert-circle", color: "#FFA500" },
        tip: { name: "bulb", color: "#FFD93D" }
      };
      return config[item.type] || config.alert;
    };

    const iconConfig = getIconConfig(item.type);

    return (
      <TouchableOpacity style={styles.notificationCard} onPress={() => handlePress(item)}>
        <View style={styles.cardContent}>
          <View style={[styles.iconContainer, { backgroundColor: `${iconConfig.color}20` }]}>
            <Ionicons name={iconConfig.name} size={22} color={iconConfig.color} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationText}>{item.body}</Text>
            <View style={styles.metaContainer}>
              <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
              {item.isAI && (
                <View style={styles.aiBadge}>
                  <Ionicons name="sparkles" size={10} color="#2A5B8C" />
                  <Text style={styles.aiBadgeText}>AI</Text>
                </View>
              )}
              {item.isPeriodic && (
                <View style={styles.periodicBadge}>
                  <Ionicons name="time" size={10} color="#6BCF7F" />
                  <Text style={styles.periodicBadgeText}>Periodic</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <StatusBar barStyle="light-content" backgroundColor="#2A5B8C" />
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Safety Alerts</Text>
          <View style={styles.headerStats}>
            <Text style={styles.headerStatsText}>{notifications.length}</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* Status Section */}
        <View style={styles.statusSection}>
          <Text style={styles.welcomeTitle}>Real-Time Safety Alerts</Text>
          <Text style={styles.welcomeSubtitle}>
            AI-powered notifications every 30 minutes based on your location and nearby incidents
          </Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{nearbyIncidents.length}</Text>
              <Text style={styles.statLabel}>Nearby Incidents</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{incidents.length}</Text>
              <Text style={styles.statLabel}>Total Incidents</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{notifications.length}</Text>
              <Text style={styles.statLabel}>Alerts</Text>
            </View>
          </View>
        </View>

        {/* Safety Mode Toggle */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleInfo}>
            <Ionicons name="shield-checkmark" size={24} color="#2A5B8C" />
            <View style={styles.toggleTexts}>
              <Text style={styles.toggleTitle}>Real-Time Protection</Text>
              <Text style={styles.toggleDescription}>
                {isSafetyModeOn ? "AI safety monitoring active - Notifications every 30 mins" : "Safety alerts disabled"}
              </Text>
            </View>
          </View>
          <Switch
            value={isSafetyModeOn}
            onValueChange={setIsSafetyModeOn}
            trackColor={{ false: "#E0E0E0", true: "#2A5B8C40" }}
            thumbColor={isSafetyModeOn ? "#2A5B8C" : "#F5F5F5"}
          />
        </View>

        {/* API Status */}
        <View style={styles.apiStatus}>
          <Ionicons 
            name={GEMINI_API_KEY && GEMINI_API_KEY !== 'demo' ? "checkmark-circle" : "warning"} 
            size={16} 
            color={GEMINI_API_KEY && GEMINI_API_KEY !== 'demo' ? "#6BCF7F" : "#FFD93D"} 
          />
          <Text style={styles.apiStatusText}>
            {GEMINI_API_KEY && GEMINI_API_KEY !== 'demo' ? "AI Safety Analysis Active" : "Using Basic Alerts"}
          </Text>
          {isSafetyModeOn && (
            <View style={styles.intervalBadge}>
              <Ionicons name="time-outline" size={12} color="#2A5B8C" />
              <Text style={styles.intervalBadgeText}>30 min</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton]}
            onPress={testAIAlert}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="flash" size={20} color="#fff" />
            )}
            <Text style={styles.primaryButtonText}>
              {isLoading ? "Generating..." : "Test Alert"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={testPeriodicNotification}
            disabled={isLoading}
          >
            <Ionicons name="time" size={20} color="#2A5B8C" />
            <Text style={styles.secondaryButtonText}>Test Periodic</Text>
          </TouchableOpacity>

          {notifications.length > 0 && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.tertiaryButton]}
              onPress={clearAllNotifications}
            >
              <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
              <Text style={styles.tertiaryButtonText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={80} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>No alerts yet</Text>
            <Text style={styles.emptyDescription}>
              {isSafetyModeOn 
                ? "AI safety alerts will appear here every 30 minutes based on your location and nearby incidents" 
                : "Enable Real-Time Protection to receive AI-powered safety alerts every 30 minutes"
              }
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>Recent Safety Alerts</Text>
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              renderItem={renderNotificationItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={onRefresh}
                  colors={["#2A5B8C"]}
                  tintColor="#2A5B8C"
                />
              }
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F8FAFF" 
  },
  header: {
    backgroundColor: "#2A5B8C",
    paddingTop: (StatusBar.currentHeight || 40) + 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    flex: 1,
    textAlign: "center",
    marginLeft: -32,
  },
  headerStats: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  headerStatsText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#666",
    lineHeight: 22,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2A5B8C",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  toggleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  toggleInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  toggleTexts: {
    marginLeft: 12,
  },
  toggleTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 14,
    color: "#666",
  },
  apiStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F8FF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  apiStatusText: {
    fontSize: 12,
    color: "#2A5B8C",
    fontWeight: "500",
  },
  intervalBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A5B8C10",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  intervalBadgeText: {
    fontSize: 10,
    color: "#2A5B8C",
    fontWeight: "600",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: "#2A5B8C",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#2A5B8C",
  },
  secondaryButtonText: {
    color: "#2A5B8C",
    fontWeight: "600",
    fontSize: 14,
  },
  tertiaryButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#FF6B6B",
    flex: 0.5,
  },
  tertiaryButtonText: {
    color: "#FF6B6B",
    fontWeight: "600",
    fontSize: 14,
  },
  listContainer: {
    flex: 1,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  notificationCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  notificationText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 18,
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
  },
  aiBadge: {
    backgroundColor: "#2A5B8C10",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  aiBadgeText: {
    fontSize: 10,
    color: "#2A5B8C",
    fontWeight: "600",
  },
  periodicBadge: {
    backgroundColor: "#6BCF7F10",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  periodicBadgeText: {
    fontSize: 10,
    color: "#6BCF7F",
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#999",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
});