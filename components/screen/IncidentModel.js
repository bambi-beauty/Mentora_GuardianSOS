import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Switch,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native'; 
import styles from './CommunityStyles';
import { useUser } from '../../Users/useContext';

const { width } = Dimensions.get('window');
const API_BASE_URL = 'https://baroscopical-natosha-overrigid.ngrok-free.dev/api/incidents';
const GOOGLE_MAPS_API_KEY = 'AIzaSyATiDjrJwlS_pqvgxKHDCLAjBdPA4YIKxg';
const MAX_INCIDENTS_PER_AREA = 2;
const AREA_RADIUS_KM = 0.5;

const IncidentModal = ({ visible, onClose, onIncidentCreated }) => {
  const { token } = useUser();
  const navigation = useNavigation();

  const [incident, setIncident] = useState({
    type: '',
    location: '',
    description: '',
    anonymous: false,
    coordinates: null,
  });

  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [existingIncidents, setExistingIncidents] = useState([]);

  const incidentTypes = [
    { type: 'Theft/Burglary', icon: 'shield' },
    { type: 'Vandalism', icon: 'building' },
    { type: 'Suspicious Activity', icon: 'eye' },
    { type: 'Safety Hazard', icon: 'exclamation-triangle' },
    { type: 'Medical Emergency', icon: 'medkit' },
    { type: 'Accident', icon: 'car' },
    { type: 'Fire', icon: 'fire' },
    { type: 'Harassment', icon: 'user-times' },
    { type: 'Other', icon: 'question-circle' },
  ];

  // 🔹 Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  // 🔹 Check if area has too many incidents
  const checkAreaIncidentCount = (currentLat, currentLng, incidents) => {
    const nearbyIncidents = incidents.filter(incident => {
      if (!incident.coordinates) return false;
      
      const distance = calculateDistance(
        currentLat, 
        currentLng, 
        incident.coordinates.lat, 
        incident.coordinates.lng
      );
      
      return distance <= AREA_RADIUS_KM;
    });
    
    return nearbyIncidents.length;
  };

  useEffect(() => {
    if (visible) {
      fetchExistingIncidents();
    } else {
      setIncident({
        type: '',
        location: '',
        description: '',
        anonymous: false,
        coordinates: null,
      });
      setExistingIncidents([]);
    }
  }, [visible]);

  const fetchExistingIncidents = async () => {
    if (!token) return;

    try {
      const response = await fetch(API_BASE_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setExistingIncidents(data.data || []);
        }
      }
    } catch (error) {
      console.warn('Failed to fetch existing incidents:', error);
    }
  };

  useEffect(() => {
    if (visible && token) {
      (async () => {
        setGettingLocation(true);
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Location permission is required to autofill location.');
            setGettingLocation(false);
            return;
          }

          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          const { latitude, longitude } = loc.coords;

          const incidentCount = checkAreaIncidentCount(latitude, longitude, existingIncidents);
          if (incidentCount >= MAX_INCIDENTS_PER_AREA) {
            Alert.alert(
              'Area Already Reported',
              `This area already has ${incidentCount} reported incidents. Please report from a different location.`,
              [{ text: 'OK' }]
            );
            setGettingLocation(false);
            return;
          }

          const address = await reverseGeocode(latitude, longitude);

          setIncident((prev) => ({
            ...prev,
            location: address || '',
            coordinates: { lat: latitude, lng: longitude },
          }));
        } catch (error) {
          console.warn('Failed to get location:', error);
        } finally {
          setGettingLocation(false);
        }
      })();
    }
  }, [visible, existingIncidents]);

  // 🔹 Convert coordinates to a readable address
  const reverseGeocode = async (lat, lng) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results?.length > 0) {
        return data.results[0].formatted_address;
      } else {
        console.warn('Reverse geocode failed:', data.status);
        return '';
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
      return '';
    }
  };

  // 🔹 Submit new incident with area validation - THIS IS THE MISSING FUNCTION
  const handleSubmit = async () => {
    if (!incident.type || !incident.description || !incident.location) {
      Alert.alert('Missing Information', 'Please fill out all fields before submitting.');
      return;
    }

    if (!token) {
      Alert.alert('Unauthorized', 'Please log in to report an incident.');
      return;
    }

    // Final check before submission
    if (incident.coordinates) {
      const incidentCount = checkAreaIncidentCount(
        incident.coordinates.lat, 
        incident.coordinates.lng, 
        existingIncidents
      );
      
      if (incidentCount >= MAX_INCIDENTS_PER_AREA) {
        Alert.alert(
          'Area Already Reported',
          `This area already has ${incidentCount} reported incidents. Please report from a different location.`,
          [{ text: 'OK' }]
        );
        return;
      }
    }

    try {
      setLoading(true);

      const incidentData = {
        type: incident.type,
        description: incident.description,
        locationText: incident.location,
        anonymous: incident.anonymous,
        coordinates: incident.coordinates,
      };

      console.log('Sending incident data:', incidentData);

      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(incidentData),
      });

      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok && data.success) {
        Alert.alert('Success', 'Incident reported successfully!');

        // ✅ Trigger map refresh immediately
        if (onIncidentCreated) {
          onIncidentCreated(data.data);
        }

        // ✅ If you're using React Navigation, return to MapScreen
        try {
          navigation.navigate('Map');
        } catch (err) {
          // ignore if modal isn't inside a navigation stack
        }

        // ✅ Reset modal fields
        setIncident({
          type: '',
          location: '',
          description: '',
          anonymous: false,
          coordinates: null,
        });

        onClose(); // close after refresh
      } else {
        throw new Error(data.message || 'Failed to report incident');
      }
    } catch (error) {
      console.error('Incident submission error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      animationType="slide" 
      visible={visible} 
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        {/* Enhanced Header */}
        <View style={styles.modalHeader}>
          <View style={styles.headerContent}>
            <MaterialIcons name="warning" size={28} color="#E74C3C" />
            <View style={styles.headerTextContainer}>
              <Text style={styles.modalTitle}>Report Incident</Text>
              <Text style={styles.modalSubtitle}>Help keep your community safe</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
          >
            <FontAwesome name="times" size={22} color="#7F8C8D" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Instructions Card */}
          <View style={styles.instructionsCard}>
            <MaterialIcons name="info" size={20} color="#3498DB" />
            <Text style={styles.instructionsText}>
              Report safety incidents or concerns in your community. Your report helps keep everyone informed and safe.
            </Text>
          </View>

          {/* Area Limit Notice */}
          <View style={styles.limitNotice}>
            <MaterialIcons name="location-off" size={16} color="#E67E22" />
            <Text style={styles.limitNoticeText}>
              Limited to {MAX_INCIDENTS_PER_AREA} incidents per {AREA_RADIUS_KM}km area
            </Text>
          </View>

          {/* Type Selector Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Incident Type</Text>
              <Text style={styles.required}>Required</Text>
            </View>
            <Text style={styles.sectionDescription}>Select the most relevant category</Text>
            
            <View style={styles.typeGrid}>
              {incidentTypes.map((item) => (
                <TouchableOpacity
                  key={item.type}
                  style={[
                    styles.typeCard,
                    incident.type === item.type && styles.typeCardSelected,
                  ]}
                  onPress={() => setIncident({ ...incident, type: item.type })}
                >
                  <View style={[
                    styles.iconContainer,
                    incident.type === item.type && styles.iconContainerSelected,
                  ]}>
                    <FontAwesome 
                      name={item.icon} 
                      size={16} 
                      color={incident.type === item.type ? '#FFF' : '#3498DB'} 
                    />
                  </View>
                  <Text
                    style={[
                      styles.typeCardText,
                      incident.type === item.type && styles.typeCardTextSelected,
                    ]}
                    numberOfLines={2}
                  >
                    {item.type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Location Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Location</Text>
              <Text style={styles.required}>Required</Text>
            </View>
            
            <View style={styles.locationContainer}>
              <MaterialIcons name="location-on" size={20} color="#7F8C8D" style={styles.inputIcon} />
              {gettingLocation ? (
                <View style={styles.locationLoading}>
                  <ActivityIndicator size="small" color="#3498DB" />
                  <Text style={styles.locationLoadingText}>Getting your location...</Text>
                </View>
              ) : (
                <TextInput
                  style={styles.inputField}
                  placeholder="Incident location address"
                  placeholderTextColor="#95A5A6"
                  value={incident.location}
                  onChangeText={(text) => setIncident({ ...incident, location: text })}
                />
              )}
            </View>
          </View>

          {/* Description Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.required}>Required</Text>
            </View>
            <Text style={styles.sectionDescription}>Provide details about what happened</Text>
            
            <TextInput
              style={[styles.inputField, styles.textArea]}
              placeholder="Describe the incident with as much detail as possible..."
              placeholderTextColor="#95A5A6"
              value={incident.description}
              onChangeText={(text) => setIncident({ ...incident, description: text })}
              multiline
              textAlignVertical="top"
              numberOfLines={6}
            />
            <Text style={styles.charCount}>
              {incident.description.length}/500 characters
            </Text>
          </View>

          {/* Anonymous Section */}
          <View style={styles.anonymousSection}>
            <View style={styles.anonymousContent}>
              <MaterialIcons name="visibility-off" size={20} color="#7F8C8D" />
              <View style={styles.anonymousTextContainer}>
                <Text style={styles.anonymousTitle}>Report Anonymously</Text>
                <Text style={styles.anonymousDescription}>
                  Your name and profile will not be shown to other users
                </Text>
              </View>
            </View>
            <Switch
              value={incident.anonymous}
              onValueChange={(val) => setIncident({ ...incident, anonymous: val })}
              trackColor={{ false: '#BDC3C7', true: '#3498DB' }}
              thumbColor={incident.anonymous ? '#FFF' : '#FFF'}
            />
          </View>

          {/* Submit Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!incident.type || !incident.description || !incident.location || loading) && 
                styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!incident.type || !incident.description || !incident.location || loading || gettingLocation}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <View style={styles.submitButtonContent}>
                  <MaterialIcons name="send" size={18} color="#FFF" />
                  <Text style={styles.submitButtonText}>Submit Report</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <Text style={styles.footerNote}>
              Your report will be reviewed and visible to community members
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default IncidentModal;