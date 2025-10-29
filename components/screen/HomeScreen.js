import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Linking,
  Vibration,
  StyleSheet,
  AppState
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as Location from 'expo-location';
import { useUser } from '../../Users/useContext';
import { useChat } from '../../ChatContext/ChatContext';
import * as Sharing from 'expo-sharing';
import ShareLocation from './shareLocation';
import SafetyCard from '../SafetyCard';
import { useSafety } from '../safetyContext';

const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 5);

const POLICE_NUMBER = '10111';
const GOOGLE_API_KEY = 'AIzaSyATiDjrJwlS_pqvgxKHDCLAjBdPA4YIKxg';

 
const isValidCoordinate = (lat, lng) => {
  return lat !== null && 
         lat !== undefined && 
         lng !== null && 
         lng !== undefined &&
         !isNaN(Number(lat)) && 
         !isNaN(Number(lng)) &&
         Math.abs(lat) <= 90 && 
         Math.abs(lng) <= 180;
};

const safeCoordinate = (lat, lng, fallbackLat = -26.2041, fallbackLng = 28.0473) => {
  if (isValidCoordinate(lat, lng)) {
    return {
      latitude: Number(lat),
      longitude: Number(lng)
    };
  }
  return {
    latitude: fallbackLat,
    longitude: fallbackLng
  };
};

export default function HomeScreen({ navigation }) {
  const { user, token, selectedCity, loading } = useUser();
  const { chatMessages, sendMessage, analyzeCurrentLocation, analyzeDestinationSafety, userLocation: chatUserLocation } = useChat();
  const { safetyStatus } = useSafety();
  
  // Refs
  const mapRef = useRef(null); 

  // States
  const [activeTab, setActiveTab] = useState('Home');
  const [hamburgerVisible, setHamburgerVisible] = useState(false);
  const [region, setRegion] = useState({
    latitude: -26.2041,
    longitude: 28.0473,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });
  const [chatbotVisible, setChatbotVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState(null);
  const [homeWatcher, setHomeWatcher] = useState(null);
  const [contactsCount, setContactsCount] = useState(0);
  const [userContacts, setUserContacts] = useState([]);
  const [contactsModalVisible, setContactsModalVisible] = useState(false);
  const [safetyModalVisible, setSafetyModalVisible] = useState(false);
  const [policeModalVisible, setPoliceModalVisible] = useState(false);
  const [shareLocationVisible, setShareLocationVisible] = useState(false);
  const [policeStations, setPoliceStations] = useState([]);
  const [nearestPoliceStation, setNearestPoliceStation] = useState(null);
  const [isLoadingPoliceStations, setIsLoadingPoliceStations] = useState(false);
  const [incidents, setIncidents] = useState([]);

  // Volume Button SOS States
  const [volumePressCount, setVolumePressCount] = useState(0);
  const [lastVolumePressTime, setLastVolumePressTime] = useState(0);
  const [isVolumeSOSEnabled, setIsVolumeSOSEnabled] = useState(false);
  const volumeTimeoutRef = useRef(null);

  const [dangerZones, setDangerZones] = useState([
    {
      id: generateId(),
      latitude: -26.2049,
      longitude: 28.0456,
      radius: 800,
      dangerLevel: 'high',
      title: 'High Crime Area',
    },
    {
      id: generateId(),
      latitude: -26.1976,
      longitude: 28.0367,
      radius: 600,
      dangerLevel: 'medium',
      title: 'Recent Incidents Reported',
    },
  ]);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  };

  // Find nearest police station
  const findNearestPoliceStation = (stations, userLat, userLng) => {
    if (!stations.length || !userLat || !userLng) return null;
    
    let nearest = stations[0];
    let shortestDistance = calculateDistance(userLat, userLng, stations[0].geometry.location.lat, stations[0].geometry.location.lng);
    
    stations.forEach(station => {
      const distance = calculateDistance(userLat, userLng, station.geometry.location.lat, station.geometry.location.lng);
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearest = station;
      }
    });
    
    return {
      ...nearest,
      distance: shortestDistance
    };
  };

  // Fetch incidents from your API
  const fetchIncidents = async () => {
    try {
      const response = await fetch('https://baroscopical-natosha-overrigid.ngrok-free.dev/api/incidents');
      if (response.ok) {
        const data = await response.json();
        const validIncidents = data.filter(incident => 
          isValidCoordinate(incident.latitude, incident.longitude)
        );
        setIncidents(validIncidents);
        return validIncidents;
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
    }
    return [];
  };

  // Fetch police stations near user location
  const fetchPoliceStations = async (lat, lng) => {
    if (!GOOGLE_API_KEY || GOOGLE_API_KEY === 'YOUR_GOOGLE_API_KEY_HERE') {
      console.warn('Google API key not configured');
      return;
    }

    setIsLoadingPoliceStations(true);
    try {
      const radius = 5000;
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=police&key=${GOOGLE_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK') {
        setPoliceStations(data.results);
        const nearest = findNearestPoliceStation(data.results, lat, lng);
        setNearestPoliceStation(nearest);
        
        if (nearest) {
          console.log(`Nearest police station: ${nearest.name} (${nearest.distance.toFixed(2)} km away)`);
        }
      } else {
        console.warn('Error fetching police stations:', data.status);
      }
    } catch (error) {
      console.error('Error fetching police stations:', error);
    } finally {
      setIsLoadingPoliceStations(false);
    }
  };

  // Safe location functions to prevent errors
  const getSafeCurrentPosition = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission not granted');
        return null;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return loc?.coords || null;
    } catch (error) {
      console.warn('Error getting current position:', error);
      return null;
    }
  };

  // Volume Button SOS Functions
  const requestVolumeSOSPermission = () => {
    Alert.alert(
      'Volume Button SOS Access',
      'To enable emergency SOS using volume buttons, we need to monitor volume button presses. This feature allows you to trigger SOS by pressing volume up 3 times quickly.\n\nThis will only work when the app is active.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            setIsVolumeSOSEnabled(false);
          }
        },
        {
          text: 'Enable Volume SOS',
          style: 'destructive',
          onPress: () => {
            setIsVolumeSOSEnabled(true);
            setupVolumeListener();
            Alert.alert(
              'Volume SOS Activated',
              'Volume button SOS is now active! Press the volume up button 3 times quickly to trigger emergency SOS.',
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  };

  const setupVolumeListener = () => {
    // For demo purposes - in a real app, you'd use a volume monitoring library
    console.log('Volume SOS monitoring activated');
    // Actual implementation would go here with react-native-volume-manager
  };

  const handleVolumePress = () => {
    if (!isVolumeSOSEnabled) return;

    const now = Date.now();
    
    // Reset count if too much time has passed between presses
    if (now - lastVolumePressTime > 2000) {
      setVolumePressCount(0);
    }

    const newCount = volumePressCount + 1;
    setVolumePressCount(newCount);
    setLastVolumePressTime(now);

    // Provide feedback to user
    if (newCount === 1) {
      Vibration.vibrate(100);
      Alert.alert(
        "SOS Volume Button", 
        "Volume button pressed - 2 more presses will trigger emergency SOS",
        [{ text: "OK" }]
      );
    } else if (newCount === 2) {
      Vibration.vibrate([100, 100]);
      Alert.alert(
        "SOS Volume Button", 
        "Volume button pressed twice - 1 more press will trigger emergency SOS",
        [
          { 
            text: "Cancel", 
            style: 'cancel', 
            onPress: () => {
              setVolumePressCount(0);
              setLastVolumePressTime(0);
            } 
          },
          { text: "Continue" }
        ]
      );
    } else if (newCount >= 3) {
      triggerSOSFromVolumeButtons();
    }

    // Clear previous timeout
    if (volumeTimeoutRef.current) {
      clearTimeout(volumeTimeoutRef.current);
    }

    // Reset count after 2 seconds of inactivity
    volumeTimeoutRef.current = setTimeout(() => {
      setVolumePressCount(0);
      setLastVolumePressTime(0);
    }, 2000);
  };

  const triggerSOSFromVolumeButtons = async () => {
    setVolumePressCount(0);
    setLastVolumePressTime(0);
    
    Vibration.vibrate([500, 300, 500]);
    Alert.alert(
      'SOS Triggered!', 
      'Volume button emergency detected - sending SOS alerts to your contacts and police',
      [{ text: "OK" }]
    );

    let locToSend = location;
    try {
      const latest = await getSafeCurrentPosition();
      if (latest) locToSend = latest;
    } catch (err) {
      console.warn('Unable to get fresh position, using last known', err);
    }

    await sendSOSToContactsAndPolice(locToSend);
  };

  // Location setup
  useEffect(() => {
    let subscription;
    const initLocation = async () => {
      try {
        const loc = await getSafeCurrentPosition();
        if (loc) {
          setLocation(loc);
          setRegion({
            latitude: loc.latitude,
            longitude: loc.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
          
          fetchPoliceStations(loc.latitude, loc.longitude);
          fetchIncidents();
        }

        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          subscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              distanceInterval: 10,
              timeInterval: 1000,
            },
            (locUpdate) => {
              if (locUpdate?.coords) {
                setLocation(locUpdate.coords);
                setRegion((prev) => ({
                  ...prev,
                  latitude: locUpdate.coords.latitude,
                  longitude: locUpdate.coords.longitude,
                }));
              }
            }
          );

          setHomeWatcher(subscription);
        }
      } catch (err) {
        console.warn('Home location error:', err);
      }
    };

    initLocation();
    return () => {
      if (subscription) {
        subscription.remove();
      }
      if (homeWatcher) {
        homeWatcher.remove();
      }
    };
  }, []);

  // Fetch contacts data
  useEffect(() => {
    const fetchContactsData = async () => {
      if (!user?._id || !token) return;
      try {
        const res = await fetch(`https://baroscopical-natosha-overrigid.ngrok-free.dev/api/contacts/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (res.ok && Array.isArray(data.contacts)) {
          setContactsCount(data.contacts.length);
          setUserContacts(data.contacts);
        } else {
          console.warn('Unexpected contacts response:', data);
          setContactsCount(0);
          setUserContacts([]);
        }
      } catch (error) {
        console.error('Error fetching contacts:', error);
        setContactsCount(0);
        setUserContacts([]);
      }
    };
    fetchContactsData();
  }, [user, token]);

  // Build SOS message
  const buildSOSMessage = (loc) => {
    const name = user?.name || 'A user';
    let locText = 'Unknown location';
    if (loc && loc.latitude && loc.longitude) {
      locText = `https://maps.google.com/?q=${loc.latitude},${loc.longitude}`;
    }
    const accuracyText = loc?.accuracy ? ` (accuracy ~${Math.round(loc.accuracy)}m)` : '';
    
    let nearestStationInfo = '';
    if (nearestPoliceStation) {
      nearestStationInfo = ` | Nearest police station: ${nearestPoliceStation.name} (${(nearestPoliceStation.distance * 1000).toFixed(0)}m away)`;
    }
    
    return `${name} needs urgent help. Current location: ${locText}${accuracyText}${nearestStationInfo} — Sent from Guardian SOS app.`;
  };

  const sanitizePhoneForWa = (raw) => {
    if (!raw) return null;
    const digits = raw.replace(/[^\d]/g, '');
    if (!digits) return null;
    return digits;
  };

  const extractPhone = (contact) => {
    if (!contact) return null;
    if (contact.phone) return contact.phone;
    if (contact.number) return contact.number;
    if (contact.mobile) return contact.mobile;
    if (Array.isArray(contact.phones) && contact.phones.length > 0) {
      return contact.phones[0].number || contact.phones[0];
    }
    return null;
  };

  const sendSOSToContactsAndPolice = async (loc) => {
    const messageText = buildSOSMessage(loc);

    let contacts = [];
    try {
      if (!user?._id || !token) throw new Error('User or token missing');
      const res = await fetch(`https://baroscopical-natosha-overrigid.ngrok-free.dev/api/contacts/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.contacts)) {
        contacts = data.contacts;
      } else {
        console.warn('Could not get contacts or unexpected response', data);
      }
    } catch (err) {
      console.warn('Error fetching contacts for SOS:', err);
    }

    const contactsWithPhones = contacts
      .map((c) => {
        const raw = extractPhone(c);
        const phone = sanitizePhoneForWa(raw);
        return { contact: c, phone };
      })
      .filter((c) => !!c.phone);

    if (contactsWithPhones.length === 0) {
      try {
        const waUrl = `whatsapp://send?text=${encodeURIComponent(messageText)}`;
        const canOpen = await Linking.canOpenURL(waUrl);
        if (canOpen) {
          await Linking.openURL(waUrl);
        } else {
          const fallback = `https://wa.me/?text=${encodeURIComponent(messageText)}`;
          await Linking.openURL(fallback);
        }
      } catch (err) {
        console.warn('Unable to open WhatsApp share:', err);
      }
    } else {
      for (let i = 0; i < contactsWithPhones.length; i++) {
        const { contact, phone } = contactsWithPhones[i];
        const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(messageText)}`;
        try {
          const canOpen = await Linking.canOpenURL(waUrl);
          if (canOpen) {
            await Linking.openURL(waUrl);
            await new Promise((r) => setTimeout(r, 700));
          } else {
            const fallback = `whatsapp://send?text=${encodeURIComponent(messageText)}`;
            if (await Linking.canOpenURL(fallback)) {
              await Linking.openURL(fallback);
              break;
            } else {
              await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(messageText)}`);
              break;
            }
          }
        } catch (err) {
          console.warn(`Error opening WhatsApp for ${contact?.name || phone}:`, err);
        }
      }
    }

    const policeClean = sanitizePhoneForWa(POLICE_NUMBER) || POLICE_NUMBER;
    const policeWaUrl = `https://wa.me/${policeClean}?text=${encodeURIComponent(messageText)}`;
    try {
      if (await Linking.canOpenURL(policeWaUrl)) {
        await Linking.openURL(policeWaUrl);
      } else {
        const telUrl = `tel:${policeClean}`;
        if (await Linking.canOpenURL(telUrl)) {
          await Linking.openURL(telUrl);
        } else {
          console.warn('Cannot open tel or wa link for police');
          Alert.alert('SOS', `Unable to open dialer or WhatsApp for police number ${POLICE_NUMBER}.`);
        }
      }
    } catch (err) {
      console.warn('Error attempting police contact:', err);
    }
  };

  // Updated activateSOS function with better user feedback
  const activateSOS = async () => {
    // Immediate visual and haptic feedback
    Vibration.vibrate([500, 200, 500]);
    
    // Show immediate feedback to user
    Alert.alert(
      '🚨 SOS ACTIVATED', 
      'Emergency alerts are being sent to your contacts and police authorities. Help is on the way!',
      [{ text: "OK" }]
    );

    let locToSend = location;
    try {
      const latest = await getSafeCurrentPosition();
      if (latest) locToSend = latest;
    } catch (err) {
      console.warn('Unable to get fresh position before SOS (button), using last known', err);
    }
    
    await sendSOSToContactsAndPolice(locToSend);
    
    // Additional feedback after sending
    setTimeout(() => {
      Alert.alert(
        'SOS Messages Sent',
        'Emergency alerts have been dispatched to all your contacts and local authorities. Stay on the line if police call you back.',
        [{ text: "Understood" }]
      );
    }, 2000);
  };

  // Updated SOS button handler with enhanced permission flow
  const handleSOSPress = () => {
    Alert.alert(
      'Emergency SOS Activation',
      'This will immediately send your location and emergency alert to your contacts and local police. Are you sure you want to activate emergency SOS?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel' 
        },
        { 
          text: 'Volume Button SOS', 
          onPress: () => {
            if (isVolumeSOSEnabled) {
              Alert.alert(
                "Volume SOS Active",
                "Volume button SOS is already active. Press volume up 3 times quickly to trigger emergency.",
                [{ text: "OK" }]
              );
            } else {
              requestVolumeSOSPermission();
            }
          },
          style: 'default'
        },
        { 
          text: 'ACTIVATE SOS NOW', 
          onPress: () => {
            // Double confirmation for immediate activation
            Alert.alert(
              'CONFIRM EMERGENCY SOS',
              '⚠️ This will:\n• Share your live location with emergency contacts\n• Alert nearby police authorities\n• Send emergency messages via WhatsApp\n\nAre you in immediate danger and need help?',
              [
                {
                  text: 'No, Cancel',
                  style: 'cancel'
                },
                {
                  text: 'YES, ACTIVATE SOS',
                  style: 'destructive',
                  onPress: activateSOS
                }
              ]
            );
          }, 
          style: 'destructive' 
        },
      ]
    );
  };

  const handleRefreshPoliceStations = async () => {
    if (location) {
      await fetchPoliceStations(location.latitude, location.longitude);
      Alert.alert('Success', 'Police stations data refreshed');
    } else {
      Alert.alert('Error', 'Unable to get current location');
    }
  };

  const navigateToNearestPoliceStation = () => {
    if (nearestPoliceStation) {
      const { lat, lng } = nearestPoliceStation.geometry.location;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
      Linking.openURL(url).catch(err => {
        Alert.alert('Error', 'Unable to open navigation app');
      });
    } else {
      Alert.alert('Info', 'No police station data available');
    }
  };

  // Chat Handlers
  const handleActionPress = (action) => {
    if (action === 'AI Assistant') setChatbotVisible(true);
  };

  const handleSend = async () => {
    if (message.trim()) {
      await sendMessage(message.trim());
      setMessage('');
    }
  };

  // Quick Actions
  const quickActions = [
    { 
      id: '1', 
      title: '📍 Current Safety', 
      icon: 'map-marker-alt', 
      action: () => analyzeCurrentLocation() 
    },
    { 
      id: '2', 
      title: '🎯 Check Destination', 
      icon: 'bullseye', 
      action: () => {
        Alert.prompt(
          "Check Destination Safety",
          "Enter destination address:",
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Analyze", 
              onPress: (destination) => {
                if (destination) analyzeDestinationSafety(destination);
              }
            }
          ]
        );
      }
    },
    { 
      id: '3', 
      title: '🚨 Emergency Tips', 
      icon: 'exclamation-triangle', 
      action: () => sendMessage("What are important emergency safety tips for my current location?") 
    },
    { 
      id: '4', 
      title: '🛣️ Safe Routes', 
      icon: 'route', 
      action: () => sendMessage("Find safe routes from my current location") 
    },
  ];

  const handleQuickAction = (action) => {
    action.action();
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageBubble,
        item.role === 'user' ? styles.userMessage : styles.botMessage,
      ]}
    >
      <Text style={item.role === 'user' ? styles.userMessageText : styles.botMessageText}>
        {item.content}
      </Text>
    </View>
  );

  // Loading
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  // Main UI
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2A5B8C" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logo}>
          <Icon name="shield" size={24} color="white" />
          <Text style={styles.logoText}>Guardian SOS</Text>
        </View>

        <View style={styles.headerActions}>
          <Icon name="search" size={20} color="white" style={styles.headerIcon} />
          <Icon name="bell" size={20} color="white" style={styles.headerIcon} />
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Welcome Section */}
        <View style={styles.userWelcome}>
          <Text style={styles.welcomeTitle}>Welcome back, {user?.name || 'User'}</Text>
          <Text style={styles.welcomeText}>
            {safetyStatus ? safetyStatus.message : "Analyzing your location safety..."}
          </Text>

          <View style={styles.locationTime}>
            <Icon name="map-marker" size={14} color="white" />
            <Text style={styles.locationText}>
              {selectedCity || 'Unknown City'} •{' '}
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>

          {/* Safety Status Indicator */}
          {safetyStatus && (
            <View style={[styles.safetyStatus, { backgroundColor: safetyStatus.color }]}>
              <Icon 
                name={safetyStatus.safe === "SAFE" ? "check-circle" : 
                      safetyStatus.safe === "MODERATELY_SAFE" ? "exclamation-circle" : 
                      safetyStatus.safe === "CAUTION_ADVISED" ? "exclamation-triangle" : 
                      "exclamation-triangle"} 
                size={14} 
                color="white" 
              />
              <Text style={styles.safetyStatusText}>
                {safetyStatus.safe === "SAFE" ? "Safe Area" :
                 safetyStatus.safe === "MODERATELY_SAFE" ? "Moderate Risk" :
                 safetyStatus.safe === "CAUTION_ADVISED" ? "Caution Advised" : 
                 safetyStatus.safe === "HIGH_RISK" ? "High Risk Area" : "Analyzing..."}
              </Text>
            </View>
          )}

          {/* Volume SOS Status */}
          <View style={[
            styles.volumeSOSIndicator,
            isVolumeSOSEnabled ? styles.volumeSOSEnabled : styles.volumeSOSDisabled
          ]}>
            <Icon 
              name={isVolumeSOSEnabled ? "volume-up" : "volume-off"} 
              size={14} 
              color={isVolumeSOSEnabled ? "#4CAF50" : "#FF6B6B"} 
            />
            <Text style={styles.volumeSOSIndicatorText}>
              {isVolumeSOSEnabled ? "Volume SOS: Active" : "Volume SOS: Inactive"}
            </Text>
            <TouchableOpacity 
              onPress={isVolumeSOSEnabled ? null : requestVolumeSOSPermission}
              style={styles.volumeSOSButton}
            >
              <Text style={styles.volumeSOSButtonText}>
                {isVolumeSOSEnabled ? "✓" : "Enable"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Nearest Police Station Info */}
          {nearestPoliceStation && (
            <View style={styles.policeInfo}>
              <Icon name="building" size={14} color="white" />
              <Text style={styles.policeInfoText}>
                Nearest police: {nearestPoliceStation.name} ({Math.round(nearestPoliceStation.distance * 1000)}m)
              </Text>
            </View>
          )}
        </View>

        {/* Stats Section */}
        <View style={styles.statsGrid}>
          {/* Interactive Safety Card */}
          <TouchableOpacity 
            style={[styles.statCard, styles.safetyScore]}
            onPress={() => setSafetyModalVisible(true)}
            activeOpacity={0.7}
          >
            <SafetyCard safetyStatus={safetyStatus} />
            <Text style={[styles.statValue, styles.safetyScoreValue]}></Text>
            <Text style={[styles.statLabel, styles.safetyScoreLabel]}>
              {safetyStatus ? `${safetyStatus.incidentCount || 0} recent incidents` : 'Safety rating'}
            </Text>
            <Text style={styles.viewHint}>Tap for details</Text>
          </TouchableOpacity>

          {/* Interactive Emergency Contacts Card */}
          <TouchableOpacity 
            style={[styles.statCard, contactsCount === 0 && styles.emptyStatCard]}
            onPress={() => {
              if (contactsCount > 0) {
                setContactsModalVisible(true);
              } else {
                Alert.alert(
                  'No Emergency Contacts',
                  'You haven\'t added any emergency contacts yet. These are crucial for your safety.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Add Contacts', onPress: () => navigation.navigate('AddContacts') }
                  ]
                );
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.statValue}>{contactsCount}</Text>
            <Text style={styles.statLabel}>Emergency Contacts</Text>
            {contactsCount === 0 && (
              <Text style={styles.addHint}>Tap to add</Text>
            )}
            {contactsCount > 0 && (
              <Text style={styles.viewHint}>Tap to view</Text>
            )}
          </TouchableOpacity>

          {/* Interactive Nearby Police Card */}
          <TouchableOpacity 
            style={[styles.statCard, policeStations.length === 0 && styles.emptyStatCard]}
            onPress={() => {
              if (policeStations.length > 0) {
                setPoliceModalVisible(true);
              } else {
                Alert.alert(
                  'No Police Stations Found',
                  'Unable to find nearby police stations. Make sure location services are enabled.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Refresh', onPress: handleRefreshPoliceStations }
                  ]
                );
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.statValue}>{policeStations.length}</Text>
            <Text style={styles.statLabel}>Nearby Police</Text>
            {policeStations.length === 0 && (
              <Text style={styles.addHint}>Tap to refresh</Text>
            )}
            {policeStations.length > 0 && (
              <Text style={styles.viewHint}>Tap to view</Text>
            )}
          </TouchableOpacity>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>2.1 min</Text>
            <Text style={styles.statLabel}>Response Time</Text>
          </View>
        </View>

        {/* Map Section */}
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Icon name="map" size={16} color="#2A5B8C" />
            <Text style={styles.sectionTitleText}>Safety Map</Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={handleRefreshPoliceStations}
              disabled={isLoadingPoliceStations}
            >
              <Icon 
                name="refresh" 
                size={14} 
                color={isLoadingPoliceStations ? '#ccc' : '#2A5B8C'} 
              />
              <Text style={[
                styles.refreshButtonText,
                isLoadingPoliceStations && styles.refreshButtonTextDisabled
              ]}>
                {isLoadingPoliceStations ? 'Loading...' : 'Refresh'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              region={region}
              onRegionChangeComplete={(newRegion) => setRegion(newRegion)}
            >
              {/* User Location Marker */}
              {location ? (
                <>
                  <Marker
                    coordinate={safeCoordinate(location.latitude, location.longitude)}
                    title="Your Location"
                    description="Current position"
                  />
                  {location.accuracy > 0 && (
                    <Circle
                      center={safeCoordinate(location.latitude, location.longitude)}
                      radius={location.accuracy}
                      fillColor="rgba(42,91,140,0.1)"
                      strokeColor="rgba(42,91,140,0.2)"
                    />
                  )}
                </>
              ) : (
                <Marker
                  coordinate={safeCoordinate(-26.2041, 28.0473)}
                  title="Default Location"
                  description="Johannesburg, South Africa"
                />
              )}

              {/* Police Station Markers */}
              {policeStations.map((station, index) => {
                const stationCoord = safeCoordinate(
                  station.geometry?.location?.lat,
                  station.geometry?.location?.lng
                );
                
                return (
                  <Marker
                    key={station.place_id || `police-${index}`}
                    coordinate={stationCoord}
                    title={station.name || 'Police Station'}
                    description={station.vicinity || 'Police station'}
                    pinColor="#FF0000"
                  >
                    <Icon name="building" size={20} color="#FF0000" />
                  </Marker>
                );
              })}

              {/* Incident Markers */}
              {incidents.slice(0, 20).map((incident, index) => {
                const incidentCoord = safeCoordinate(incident.latitude, incident.longitude);
                
                return (
                  <Marker
                    key={incident.id || `incident-${index}`}
                    coordinate={incidentCoord}
                    title={`Incident: ${incident.type || 'Reported'}`}
                    description={incident.description || 'Safety incident'}
                    pinColor="#FF6B6B"
                  >
                    <Icon name="exclamation-triangle" size={16} color="#FF6B6B" />
                  </Marker>
                );
              })}

            </MapView>

            <View style={styles.mapOverlay}>
              <Icon name={safetyStatus?.safe === "SAFE" ? "check-circle" : "exclamation-triangle"} 
                    size={14} 
                    color={safetyStatus?.color || "#4CAF50"} />
              <Text style={styles.mapOverlayText}>
                {safetyStatus ? safetyStatus.message : "Analyzing safety..."}
              </Text>
            </View>

            {/* Police Station Actions */}
            {nearestPoliceStation && (
              <TouchableOpacity 
                style={styles.navigationButton}
                onPress={navigateToNearestPoliceStation}
              >
                <Icon name="location-arrow" size={16} color="white" />
                <Text style={styles.navigationButtonText}>
                  Navigate to Nearest Police
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Emergency Actions */}
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Icon name="bolt" size={16} color="#2A5B8C" />
            <Text style={styles.sectionTitleText}>Emergency Actions</Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleSOSPress}
            >
              <Icon name="phone" size={24} color="#2A5B8C" />
              <Text style={styles.actionBtnText}>Emergency SOS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setShareLocationVisible(true)}
            >
              <Icon name="location-arrow" size={24} color="#2A5B8C" />
              <Text style={styles.actionBtnText}>Share Location</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setChatbotVisible(true)}
            >
              <Icon name="comments" size={24} color="#2A5B8C" />
              <Text style={styles.actionBtnText}>AI Assistant</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Safety Actions */}
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Icon name="rocket" size={16} color="#2A5B8C" />
            <Text style={styles.sectionTitleText}>Quick Safety Analysis</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActionsScroll}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionButton}
                onPress={() => handleQuickAction(action)}
              >
                <Icon name={action.icon} size={20} color="#2A5B8C" />
                <Text style={styles.quickActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recent Alerts */}
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Icon name="bell" size={16} color="#2A5B8C" />
            <Text style={styles.sectionTitleText}>Recent Alerts</Text>
          </View>

          <View style={styles.alertList}>
            <View style={styles.alertItem}>
              <View style={styles.alertIcon}>
                <Icon name="map-marker" size={16} color="#2A5B8C" />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>Safety Zone Update</Text>
                <Text style={styles.alertText}>
                  {safetyStatus ? safetyStatus.message : "Analyzing your current area safety"}
                </Text>
                <Text style={styles.alertTime}>Just now</Text>
              </View>
            </View>

            <View style={styles.alertItem}>
              <View style={styles.alertIcon}>
                <Icon name="users" size={16} color="#2A5B8C" />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>Community Alert</Text>
                <Text style={styles.alertText}>
                  New safety tips shared by your neighborhood watch
                </Text>
                <Text style={styles.alertTime}>45 min ago</Text>
              </View>
            </View>

            <View style={styles.alertItem}>
              <View style={styles.alertIcon}>
                <Icon name="user" size={16} color="#2A5B8C" />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>Emergency Contact Updated</Text>
                <Text style={styles.alertText}>
                  Jennifer was added as your emergency contact
                </Text>
                <Text style={styles.alertTime}>2 hours ago</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Safety Details Modal */}
      <Modal
        visible={safetyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSafetyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Safety Analysis</Text>
              <TouchableOpacity 
                onPress={() => setSafetyModalVisible(false)}
                style={styles.closeButton}
              >
                <Icon name="times" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={[styles.safetyStatusLarge, { backgroundColor: safetyStatus?.color || '#4CAF50' }]}>
                <Icon 
                  name={safetyStatus?.safe === "SAFE" ? "check-circle" : 
                        safetyStatus?.safe === "MODERATELY_SAFE" ? "exclamation-circle" : 
                        safetyStatus?.safe === "CAUTION_ADVISED" ? "exclamation-triangle" : 
                        "exclamation-triangle"} 
                  size={24} 
                  color="white" 
                />
                <Text style={styles.safetyStatusTextLarge}>
                  {safetyStatus?.safe === "SAFE" ? "Safe Area" :
                   safetyStatus?.safe === "MODERATELY_SAFE" ? "Moderate Risk" :
                   safetyStatus?.safe === "CAUTION_ADVISED" ? "Caution Advised" : 
                   safetyStatus?.safe === "HIGH_RISK" ? "High Risk Area" : "Analyzing..."}
                </Text>
              </View>

              <View style={styles.safetyDetails}>
                <Text style={styles.detailTitle}>Safety Overview</Text>
                <Text style={styles.detailText}>
                  {safetyStatus?.message || "Analyzing your current location safety..."}
                </Text>

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{safetyStatus?.incidentCount || 0}</Text>
                    <Text style={styles.statLabel}>Recent Incidents</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{policeStations.length}</Text>
                    <Text style={styles.statLabel}>Nearby Police</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{incidents.length}</Text>
                    <Text style={styles.statLabel}>Total Reports</Text>
                  </View>
                </View>

                <Text style={styles.detailTitle}>Safety Tips</Text>
                {safetyStatus?.safe === "SAFE" && (
                  <Text style={styles.tipText}>
                    • This area appears safe, but always remain aware of your surroundings{'\n'}
                    • Keep emergency contacts updated{'\n'}
                    • Share your location when traveling alone
                  </Text>
                )}
                {safetyStatus?.safe === "MODERATELY_SAFE" && (
                  <Text style={styles.tipText}>
                    • Exercise increased caution in this area{'\n'}
                    • Avoid walking alone at night{'\n'}
                    • Keep your phone charged and accessible
                  </Text>
                )}
                {(safetyStatus?.safe === "CAUTION_ADVISED" || safetyStatus?.safe === "HIGH_RISK") && (
                  <Text style={styles.tipText}>
                    • High alert: Exercise extreme caution{'\n'}
                    • Avoid this area if possible{'\n'}
                    • Keep emergency services on speed dial{'\n'}
                    • Share your live location with trusted contacts
                  </Text>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => {
                  setSafetyModalVisible(false);
                  setChatbotVisible(true);
                }}
              >
                <Icon name="comments" size={16} color="#2A5B8C" />
                <Text style={styles.secondaryButtonText}>Ask AI Assistant</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Police Stations Modal */}
      <Modal
        visible={policeModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPoliceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nearby Police Stations ({policeStations.length})</Text>
              <TouchableOpacity 
                onPress={() => setPoliceModalVisible(false)}
                style={styles.closeButton}
              >
                <Icon name="times" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {nearestPoliceStation && (
                <View style={styles.nearestStation}>
                  <Text style={styles.nearestTitle}>🚨 Nearest Station</Text>
                  <Text style={styles.stationName}>{nearestPoliceStation.name}</Text>
                  <Text style={styles.stationDistance}>
                    {Math.round(nearestPoliceStation.distance * 1000)} meters away
                  </Text>
                  <Text style={styles.stationAddress}>{nearestPoliceStation.vicinity}</Text>
                  <TouchableOpacity 
                    style={styles.navigateButton}
                    onPress={navigateToNearestPoliceStation}
                  >
                    <Icon name="location-arrow" size={16} color="white" />
                    <Text style={styles.navigateButtonText}>Navigate</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={styles.sectionTitleModal}>All Nearby Stations</Text>
              {policeStations.map((station, index) => (
                <View key={station.place_id} style={styles.policeItem}>
                  <View style={styles.policeIcon}>
                    <Icon name="building" size={16} color="#FF0000" />
                  </View>
                  <View style={styles.policeInfo}>
                    <Text style={styles.policeName}>{station.name}</Text>
                    <Text style={styles.policeAddress}>{station.vicinity}</Text>
                    <Text style={styles.policeDistance}>
                      {Math.round(calculateDistance(
                        location?.latitude || -26.2041,
                        location?.longitude || 28.0473,
                        station.geometry.location.lat,
                        station.geometry.location.lng
                      ) * 1000)} meters away
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.smallNavigateButton}
                    onPress={() => {
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${station.geometry.location.lat},${station.geometry.location.lng}&travelmode=driving`;
                      Linking.openURL(url);
                    }}
                  >
                    <Icon name="location-arrow" size={12} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={handleRefreshPoliceStations}
                disabled={isLoadingPoliceStations}
              >
                <Icon name="refresh" size={16} color="#2A5B8C" />
                <Text style={styles.secondaryButtonText}>
                  {isLoadingPoliceStations ? 'Refreshing...' : 'Refresh Data'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Contacts Modal */}
      <Modal
        visible={contactsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setContactsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.contactsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Emergency Contacts ({contactsCount})</Text>
              <TouchableOpacity 
                onPress={() => setContactsModalVisible(false)}
                style={styles.closeButton}
              >
                <Icon name="times" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.contactsList}>
              {userContacts.map((contact, index) => (
                <View key={contact._id || index} style={styles.contactItem}>
                  <View style={styles.contactAvatar}>
                    <Text style={styles.contactInitial}>
                      {contact.name?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactPhone}>{contact.phoneNumber}</Text>
                    {contact.relationship && (
                      <Text style={styles.contactRelationship}>{contact.relationship}</Text>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.addContactButton}
                onPress={() => {
                  setContactsModalVisible(false);
                  navigation.navigate('AddContacts');
                }}
              >
                <Icon name="plus" size={16} color="white" />
                <Text style={styles.addContactButtonText}>Add New Contact</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Chat Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={chatbotVisible}
        onRequestClose={() => setChatbotVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <Text style={styles.modalTitle}>Safety Assistant</Text>
              <View style={styles.locationStatus}>
                <Icon 
                  name={chatUserLocation ? "check-circle" : "location-arrow"} 
                  size={12} 
                  color={chatUserLocation ? "#4CAF50" : "#FF9800"} 
                />
                <Text style={styles.locationStatusText}>
                  {chatUserLocation ? "Location Active" : "Need Location"}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setChatbotVisible(false)}>
              <Icon name="times" size={24} color="#2A5B8C" />
            </TouchableOpacity>
          </View>

          {/* Quick Actions in Chat */}
          <View style={styles.quickActionsContainer}>
            <Text style={styles.quickActionsTitle}>Quick Safety Checks</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.chatQuickAction}
                  onPress={() => handleQuickAction(action)}
                >
                  <Icon name={action.icon} size={14} color="#2A5B8C" />
                  <Text style={styles.chatQuickActionText}>{action.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <FlatList
            data={chatMessages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.chatContainer}
            contentContainerStyle={styles.chatContent}
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.inputContainer}
          >
            <TextInput
              style={styles.textInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Ask about safety in your area..."
              placeholderTextColor="#999"
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
              <Icon name="paper-plane" size={20} color="white" />
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {shareLocationVisible && (
        <ShareLocation
          visible={shareLocationVisible}
          onClose={() => setShareLocationVisible(false)}
          userLocation={location}
          userName={user?.name}
        />
      )}

      {/* Floating SOS Button */}
      <TouchableOpacity style={styles.sosButton} onPress={handleSOSPress}>
        <View style={styles.sosButtonInner}>
          <Text style={styles.sosButtonText}>SOS</Text>
          <View style={styles.sosPermissionIndicator} />
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 18,
    color: '#2A5B8C',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2A5B8C',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerIcon: {
    marginLeft: 15,
  },
  scrollView: {
    flex: 1,
  },
  userWelcome: {
    backgroundColor: '#2A5B8C',
    padding: 20,
  },
  welcomeTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 10,
  },
  locationTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 5,
  },
  safetyStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  safetyStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 5,
  },
  // Volume SOS Indicator Styles
  volumeSOSIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    marginBottom: 10,
  },
  volumeSOSEnabled: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
  },
  volumeSOSDisabled: {
    backgroundColor: 'rgba(255, 107, 107, 0.3)',
  },
  volumeSOSIndicatorText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 5,
    flex: 1,
  },
  volumeSOSButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  volumeSOSButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  policeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  policeInfoText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    width: '48%',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  safetyScore: {
    backgroundColor: '#2A5B8C',
  },
  emptyStatCard: {
    backgroundColor: '#FFEAA7',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2A5B8C',
    marginBottom: 5,
  },
  safetyScoreValue: {
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  safetyScoreLabel: {
    color: 'rgba(255,255,255,0.8)',
  },
  viewHint: {
    fontSize: 10,
    color: '#999',
    marginTop: 5,
  },
  addHint: {
    fontSize: 10,
    color: '#E17055',
    marginTop: 5,
    fontWeight: '500',
  },
  section: {
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2A5B8C',
    marginLeft: 8,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    backgroundColor: 'rgba(42, 91, 140, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  refreshButtonText: {
    fontSize: 12,
    color: '#2A5B8C',
    marginLeft: 5,
  },
  refreshButtonTextDisabled: {
    color: '#ccc',
  },
  mapContainer: {
    height: 250,
    borderRadius: 10,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  mapOverlayText: {
    fontSize: 12,
    color: '#2A5B8C',
    marginLeft: 5,
  },
  navigationButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A5B8C',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  navigationButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionBtn: {
    alignItems: 'center',
    padding: 15,
  },
  actionBtnText: {
    marginTop: 8,
    fontSize: 12,
    color: '#2A5B8C',
    fontWeight: '500',
  },
  quickActionsScroll: {
    marginHorizontal: -5,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(42, 91, 140, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  quickActionText: {
    fontSize: 12,
    color: '#2A5B8C',
    fontWeight: '500',
    marginLeft: 8,
  },
  alertList: {
    marginTop: 10,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  alertIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(42, 91, 140, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2A5B8C',
    marginBottom: 2,
  },
  alertText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 10,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsModal: {
    backgroundColor: 'white',
    borderRadius: 15,
    width: '90%',
    maxHeight: '80%',
  },
  contactsModal: {
    backgroundColor: 'white',
    borderRadius: 15,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A5B8C',
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    padding: 20,
  },
  safetyStatusLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  safetyStatusTextLarge: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  safetyDetails: {
    marginTop: 10,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2A5B8C',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2A5B8C',
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(42, 91, 140, 0.1)',
    padding: 12,
    borderRadius: 10,
  },
  secondaryButtonText: {
    color: '#2A5B8C',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  nearestStation: {
    backgroundColor: 'rgba(255, 0, 0, 0.05)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF0000',
  },
  nearestTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF0000',
    marginBottom: 5,
  },
  stationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2A5B8C',
    marginBottom: 5,
  },
  stationDistance: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  stationAddress: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A5B8C',
    padding: 10,
    borderRadius: 8,
  },
  navigateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  sectionTitleModal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2A5B8C',
    marginBottom: 15,
  },
  policeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  policeIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  policeInfo: {
    flex: 1,
  },
  policeName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2A5B8C',
    marginBottom: 2,
  },
  policeAddress: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  policeDistance: {
    fontSize: 10,
    color: '#999',
  },
  smallNavigateButton: {
    backgroundColor: '#2A5B8C',
    padding: 8,
    borderRadius: 6,
  },
  contactsList: {
    padding: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A5B8C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInitial: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2A5B8C',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  contactRelationship: {
    fontSize: 12,
    color: '#999',
  },
  addContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A5B8C',
    padding: 15,
    borderRadius: 10,
  },
  addContactButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(42, 91, 140, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  locationStatusText: {
    fontSize: 10,
    color: '#2A5B8C',
    marginLeft: 4,
  },
  quickActionsContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2A5B8C',
    marginBottom: 10,
  },
  chatQuickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(42, 91, 140, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    marginRight: 8,
  },
  chatQuickActionText: {
    fontSize: 12,
    color: '#2A5B8C',
    fontWeight: '500',
    marginLeft: 6,
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 15,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 15,
    marginBottom: 10,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#2A5B8C',
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
  },
  userMessageText: {
    color: 'white',
    fontSize: 14,
  },
  botMessageText: {
    color: '#333',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 14,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#2A5B8C',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Updated SOS Button Styles
  sosButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sosButtonInner: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  sosButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sosPermissionIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: 'white',
  },
});