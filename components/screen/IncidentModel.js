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
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native'; // 👈 NEW
import styles from './CommunityStyles';
import { useUser } from '../../Users/useContext';

const API_BASE_URL = 'http://192.168.50.236:3000/api/incidents';
const GOOGLE_MAPS_API_KEY = 'AIzaSyATiDjrJwlS_pqvgxKHDCLAjBdPA4YIKxg';

const IncidentModal = ({ visible, onClose, onIncidentCreated }) => {
  const { token } = useUser();
  const navigation = useNavigation(); // 👈 for navigation-based updates

  const [incident, setIncident] = useState({
    type: '',
    location: '',
    description: '',
    anonymous: false,
    coordinates: null,
  });

  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const incidentTypes = [
    'Theft/Burglary',
    'Vandalism',
    'Suspicious Activity',
    'Safety Hazard',
    'Medical Emergency',
    'Accident',
    'Fire',
    'Harassment',
    'Other',
  ];

  // 🔹 Get user’s location & address when modal opens
  useEffect(() => {
    if (visible) {
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
    } else {
      // Reset when modal closes
      setIncident({
        type: '',
        location: '',
        description: '',
        anonymous: false,
        coordinates: null,
      });
    }
  }, [visible]);

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

  // 🔹 Submit new incident
  const handleSubmit = async () => {
    if (!incident.type || !incident.description || !incident.location) {
      Alert.alert('Missing Information', 'Please fill out all fields before submitting.');
      return;
    }

    if (!token) {
      Alert.alert('Unauthorized', 'Please log in to report an incident.');
      return;
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

        // ✅ If you’re using React Navigation, return to MapScreen
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
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Report an Incident</Text>
          <TouchableOpacity onPress={onClose}>
            <FontAwesome name="times" size={24} color="#2A5B8C" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.modalContent}>
          <Text style={styles.instructionsText}>
            Use this form to report safety incidents or concerns in your community. 
            Your report helps keep everyone informed and safe.
          </Text>

          {/* Type Selector */}
          <Text style={styles.label}>Type of Incident</Text>
          <View style={styles.typeButtonContainer}>
            {incidentTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  incident.type === type && styles.typeButtonSelected,
                ]}
                onPress={() => setIncident({ ...incident, type })}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    incident.type === type && styles.typeButtonTextSelected,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Location */}
          <Text style={styles.label}>Location</Text>
          {gettingLocation ? (
            <ActivityIndicator size="small" color="#2A5B8C" />
          ) : (
            <TextInput
              style={styles.inputField}
              placeholder="Enter the location"
              value={incident.location}
              onChangeText={(text) => setIncident({ ...incident, location: text })}
            />
          )}

          {/* Description */}
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.inputField, styles.textArea]}
            placeholder="Describe the incident"
            value={incident.description}
            onChangeText={(text) => setIncident({ ...incident, description: text })}
            multiline
          />

          {/* Anonymous Option */}
          <View style={styles.anonymousContainer}>
            <Switch
              value={incident.anonymous}
              onValueChange={(val) => setIncident({ ...incident, anonymous: val })}
            />
            <Text style={styles.anonymousText}>
              Report anonymously
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={loading || gettingLocation}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Report</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default IncidentModal;
