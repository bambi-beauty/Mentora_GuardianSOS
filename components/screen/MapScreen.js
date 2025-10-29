import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as Location from 'expo-location';
import { useIsFocused } from '@react-navigation/native';
import { useSafety } from '../safetyContext';

const API_BASE_URL = 'https://baroscopical-natosha-overrigid.ngrok-free.dev/api';
const GOOGLE_MAPS_API_KEY = 'AIzaSyATiDjrJwlS_pqvgxKHDCLAjBdPA4YIKxg';

const SOUTH_AFRICA_COORDINATES = {
  latitude: -26.2041,
  longitude: 28.0473,
  latitudeDelta: 12,
  longitudeDelta: 12,
};

export default function MapScreen() {
  const [region, setRegion] = useState(SOUTH_AFRICA_COORDINATES);
  const [location, setLocation] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [safetyStage, setSafetyStage] = useState(0); // 0 to 4
  const isFocused = useIsFocused();
  const { setSafetyStatus } = useSafety(); // Get setSafetyStatus from context

  // Helper function to convert score to safety status
  const getSafetyStatus = (score) => {
    switch(score) {
      case 0:
        return {
          safe: "HIGH_RISK",
          message: "High risk area detected - multiple incidents nearby",
          color: "#D32F2F"
        };
      case 1:
        return {
          safe: "CAUTION_ADVISED", 
          message: "Exercise caution - recent incidents reported nearby",
          color: "#FF5722"
        };
      case 2:
        return {
          safe: "MODERATELY_SAFE",
          message: "Moderately safe area with some incidents",
          color: "#FFC107"
        };
      case 3:
        return {
          safe: "SAFE",
          message: "Generally safe area with minimal incidents", 
          color: "#CDDC39"
        };
      case 4:
        return {
          safe: "SAFE",
          message: "Very safe area - no recent incidents",
          color: "#4CAF50"
        };
      default:
        return {
          safe: "UNKNOWN",
          message: "Analyzing your location safety...",
          color: "#9E9E9E"
        };
    }
  };

  // Get user location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location access is needed to use this feature.');
          return;
        }

        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setLocation(loc.coords);
        setRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      } catch (err) {
        console.warn('Location error:', err);
      }
    })();
  }, []);

  // Fetch incidents whenever screen gains focus
  useEffect(() => {
    if (isFocused) {
      fetchIncidents();
    }
  }, [isFocused]);

  // Safety calculation whenever incidents or location change
  useEffect(() => {
    if (location && incidents.length > 0) {
      const nearbyIncidents = incidents.filter((incident) => {
        if (!incident.coordinates) return false;
        const distance = getDistance(
          location.latitude,
          location.longitude,
          incident.coordinates.lat,
          incident.coordinates.lng
        );
        return distance <= 2000; // 2 km radius considered "nearby"
      });

      console.log(`Found ${nearbyIncidents.length} nearby incidents within 2km`);

      // Assign danger levels: high=0, medium=1, low=2
      let score = 4; // start fully safe (100%)
      nearbyIncidents.forEach((incident) => {
        switch (incident.dangerLevel) {
          case 'high':
            score = Math.min(score, 0);
            break;
          case 'medium':
            score = Math.min(score, 1);
            break;
          case 'low':
            score = Math.min(score, 2);
            break;
          default:
            score = Math.min(score, 2);
        }
      });

      setSafetyStage(score);
      
      // Update the safety status for HomeScreen
      const status = getSafetyStatus(score);
      setSafetyStatus(status);
      
      console.log(`Safety score: ${score}, Status: ${status.safe}`);
    } else if (location && incidents.length === 0) {
      // No incidents found - assume safe area
      const status = getSafetyStatus(4);
      setSafetyStatus(status);
      setSafetyStage(4);
    }
  }, [location, incidents, setSafetyStatus]);

  // Calculate distance between two lat/lng points in meters
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in meters
  };

  const geocodeLocation = async (locationText) => {
    try {
      const query = `${locationText}, South Africa`;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        query
      )}&key=${GOOGLE_MAPS_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        return { lat, lng };
      } else {
        console.warn('No geocoding results for:', locationText);
        return null;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  const fetchIncidents = async () => {
    try {
      console.log('Fetching incidents...');
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/incidents`);
      const data = await response.json();

      if (!Array.isArray(data)) {
        console.error('Expected array, got:', data);
        setLoading(false);
        return;
      }

      const incidentsWithCoords = await Promise.all(
        data.map(async (incident) => {
          if (incident.coordinates?.lat && incident.coordinates?.lng) {
            return incident;
          }
          const coords = await geocodeLocation(incident.locationText);
          if (coords) {
            return { ...incident, coordinates: { lat: coords.lat, lng: coords.lng } };
          }
          return null;
        })
      );

      const validIncidents = incidentsWithCoords.filter(Boolean);
      setIncidents(validIncidents);
      console.log(`Loaded ${validIncidents.length} incidents with coordinates`);
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDangerZoneColor = (dangerLevel) => {
    switch (dangerLevel) {
      case 'high':
        return 'rgba(255, 87, 87, 0.3)';
      case 'medium':
        return 'rgba(255, 152, 0, 0.3)';
      case 'low':
        return 'rgba(105, 230, 105, 0.3)';
      default:
        return 'rgba(255, 87, 87, 0.3)';
    }
  };

  const getDangerZoneBorderColor = (dangerLevel) => {
    switch (dangerLevel) {
      case 'high':
        return 'rgba(255, 87, 87, 0.7)';
      case 'medium':
        return 'rgba(255, 152, 0, 0.7)';
      case 'low':
        return 'rgba(105, 230, 105, 0.7)';
      default:
        return 'rgba(255, 87, 87, 0.7)';
    }
  };

  // Safety bar colors
  const safetyColors = ['#D32F2F', '#FF5722', '#FFC107', '#CDDC39', '#4CAF50'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoText}>Safety Map</Text>
        {/* Show current safety status in header */}
        {safetyStage !== null && (
          <View style={[styles.headerSafety, { backgroundColor: safetyColors[safetyStage] }]}>
            <Icon 
              name={safetyStage >= 3 ? "check-circle" : "exclamation-triangle"} 
              size={14} 
              color="white" 
            />
            <Text style={styles.headerSafetyText}>
              {safetyStage === 0 ? "High Risk" :
               safetyStage === 1 ? "Caution" :
               safetyStage === 2 ? "Moderate" :
               safetyStage === 3 ? "Safe" : "Very Safe"}
            </Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2A5B8C" />
          <Text>Loading incidents...</Text>
        </View>
      ) : (
        <>
          <MapView provider={PROVIDER_GOOGLE} style={styles.fullMap} region={region}>
            {location && (
              <Marker
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                title="You are here"
              >
                <Icon name="map-marker" size={36} color="#2A5B8C" />
              </Marker>
            )}

            {incidents.map((incident) =>
              incident.coordinates?.lat && incident.coordinates?.lng ? (
                <React.Fragment key={incident._id}>
                  <Marker
                    coordinate={{
                      latitude: incident.coordinates.lat,
                      longitude: incident.coordinates.lng,
                    }}
                    title={incident.type}
                    description={incident.locationText}
                  />
                  <Circle
                    center={{
                      latitude: incident.coordinates.lat,
                      longitude: incident.coordinates.lng,
                    }}
                    radius={2000}
                    fillColor={getDangerZoneColor(incident.dangerLevel)}
                    strokeColor={getDangerZoneBorderColor(incident.dangerLevel)}
                    strokeWidth={2}
                  />
                </React.Fragment>
              ) : null
            )}
          </MapView>

          {/* Bottom safety bar */}
          <View style={styles.safetyBarContainer}>
            {safetyColors.map((color, index) => (
              <View key={index} style={[styles.safetyStage, { backgroundColor: color }]}>
                {index === safetyStage && (
                  <Icon
                    name="check-circle"
                    size={24}
                    color="#000"
                    style={styles.checkIcon}
                  />
                )}
              </View>
            ))}
          </View>

          {/* Safety status info panel */}
          <View style={styles.infoPanel}>
            <Text style={styles.infoTitle}>Current Safety Status</Text>
            <Text style={styles.infoText}>
              {safetyStage === 0 ? "High Risk Area - Multiple dangerous incidents nearby" :
               safetyStage === 1 ? "Caution Advised - Recent incidents reported" :
               safetyStage === 2 ? "Moderate Risk - Some incidents in the area" :
               safetyStage === 3 ? "Generally Safe - Minimal risk" :
               "Very Safe - No recent incidents"}
            </Text>
            <Text style={styles.incidentCount}>
              {incidents.length} total incidents loaded
            </Text>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f5ff' },
  header: {
    backgroundColor: '#2A5B8C',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  logoText: { color: 'white', fontWeight: '700', fontSize: 20 },
  headerSafety: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  headerSafetyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fullMap: { ...StyleSheet.absoluteFillObject },
  safetyBarContainer: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 30,
    borderRadius: 8,
    overflow: 'hidden',
  },
  safetyStage: {
    flex: 1,
    marginHorizontal: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  checkIcon: {
    position: 'absolute',
  },
  infoPanel: {
    position: 'absolute',
    top: 80,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 15,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#2A5B8C',
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  incidentCount: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});