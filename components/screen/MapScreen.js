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
import { useIsFocused } from '@react-navigation/native'; // 👈 NEW

const API_BASE_URL = 'http://192.168.50.236:3000/api';
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
  const isFocused = useIsFocused(); // 👈 NEW

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

      console.log('Fetched incidents:', data);

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

      setIncidents(incidentsWithCoords.filter(Boolean));
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
        return 'rgba(255, 230, 105, 0.3)';
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
        return 'rgba(255, 230, 105, 0.7)';
      default:
        return 'rgba(255, 87, 87, 0.7)';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoText}>Safety Map</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2A5B8C" />
          <Text>Loading incidents...</Text>
        </View>
      ) : (
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
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f5ff' },
  header: {
    backgroundColor: '#2A5B8C',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  logoText: { color: 'white', fontWeight: '700', fontSize: 20 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fullMap: { ...StyleSheet.absoluteFillObject },
});
