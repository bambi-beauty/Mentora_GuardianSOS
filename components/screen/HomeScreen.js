import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
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
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as Location from 'expo-location';
import { useUser } from '../../Users/useContext';
import { useChat } from '../../ChatContext/ChatContext';
import * as Sharing from 'expo-sharing';
import ShareLocation from './shareLocation';


// Helper function to generate unique IDs
const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 5);

export default function HomeScreen() {
  const { user, token, selectedCity, loading } = useUser();
  const { chatMessages, sendMessage } = useChat();

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

  const [dangerZones] = useState([
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

  // Location setup
  useEffect(() => {
    let subscription;
    const initLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Location permission not granted');
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (loc?.coords) {
          setLocation(loc.coords);
          setRegion({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }

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
      } catch (err) {
        console.warn('Home location error:', err);
      }
    };

    initLocation();
    return () => {
      subscription?.remove();
      homeWatcher?.removeAsync?.();
    };
  }, []);

  // Fetch contacts count
  useEffect(() => {
    const fetchContactsCount = async () => {
      if (!user?._id || !token) return;
      try {
        const res = await fetch(`http://192.168.50.236:3000/api/contacts/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (res.ok && Array.isArray(data.contacts)) {
          setContactsCount(data.contacts.length);
        } else {
          console.warn('Unexpected contacts response:', data);
          setContactsCount(0);
        }
      } catch (error) {
        console.error('Error fetching contacts:', error);
        setContactsCount(0);
      }
    };
    fetchContactsCount();
  }, [user, token]);

  // SOS Handlers
  const handleSOSPress = () => {
    Alert.alert(
      'Emergency SOS',
      'Are you sure you want to activate emergency SOS? Authorities and your emergency contacts will be notified.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Activate SOS', onPress: activateSOS, style: 'destructive' },
      ]
    );
  };

  const activateSOS = () => {
    Alert.alert('SOS Activated', 'Your location has been shared. Help is on the way.');
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

  const getDangerZoneColor = (level) => {
    const colors = {
      high: 'rgba(255, 87, 87, 0.3)',
      medium: 'rgba(255, 152, 0, 0.3)',
      low: 'rgba(255, 230, 105, 0.3)',
    };
    return colors[level] || colors.high;
  };

  const getDangerZoneBorderColor = (level) => {
    const colors = {
      high: 'rgba(255, 87, 87, 0.7)',
      medium: 'rgba(255, 152, 0, 0.7)',
      low: 'rgba(255, 230, 105, 0.7)',
    };
    return colors[level] || colors.high;
  };

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
            You're in a safe zone. Your location is being monitored and emergency contacts are
            notified of your status.
          </Text>

          <View style={styles.locationTime}>
            <Icon name="map-marker" size={14} color="white" />
            <Text style={styles.locationText}>
              { selectedCity || 'Unknown City'} •{' '}
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.safetyScore]}>
            <Text style={[styles.statValue, styles.safetyScoreValue]}>95%</Text>
            <Text style={[styles.statLabel, styles.safetyScoreLabel]}>
              Excellent safety rating
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{contactsCount}</Text>
            <Text style={styles.statLabel}>Emergency Contacts</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>23</Text>
            <Text style={styles.statLabel}>Community</Text>
          </View>

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
          </View>

          <View style={styles.mapContainer}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              region={region}
              onRegionChangeComplete={(newRegion) => setRegion(newRegion)}
            >
              {location ? (
                <>
                  <Marker
                    coordinate={{
                      latitude: location.latitude,
                      longitude: location.longitude,
                    }}
                    title="Your Location"
                    description="Current position"
                  />
                  {location.accuracy > 0 && (
                    <Circle
                      center={{
                        latitude: location.latitude,
                        longitude: location.longitude,
                      }}
                      radius={location.accuracy}
                      fillColor="rgba(42,91,140,0.1)"
                      strokeColor="rgba(42,91,140,0.2)"
                    />
                  )}
                </>
              ) : (
                <Marker
                  coordinate={{ latitude: -26.2041, longitude: 28.0473 }}
                  title="Default Location"
                  description="Johannesburg, South Africa"
                />
              )}

              {dangerZones.map((zone) => (
                <Circle
                  key={zone.id}
                  center={{ latitude: zone.latitude, longitude: zone.longitude }}
                  radius={zone.radius}
                  fillColor={getDangerZoneColor(zone.dangerLevel)}
                  strokeColor={getDangerZoneBorderColor(zone.dangerLevel)}
                  strokeWidth={2}
                />
              ))}
            </MapView>

            <View style={styles.mapOverlay}>
              <Icon name="check-circle" size={14} color="#4CAF50" />
              <Text style={styles.mapOverlayText}>You're in a safe zone</Text>
            </View>
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
              style={[styles.actionBtn, styles.emergencyBtn]}
              onPress={handleSOSPress}
            >
              <Icon name="bell" size={24} color="white" />
              <Text style={styles.emergencyBtnText}>Emergency SOS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleActionPress('Call Help')}
            >
              <Icon name="phone" size={24} color="#2A5B8C" />
              <Text style={styles.actionBtnText}>Call Help</Text>
            </TouchableOpacity>
            {/* Share Location Button */}
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => setShareLocationVisible(true)}
            >
              <Icon name="location-arrow" size={24} color="#2A5B8C" />
              <Text style={styles.actionBtnText}>Share Location</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleActionPress('AI Assistant')}
            >
              <Icon name="comments" size={24} color="#2A5B8C" />
              <Text style={styles.actionBtnText}>AI Assistant</Text>
            </TouchableOpacity>

          
          </View>
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
                  You’ve entered a high-safety area near Sandton City
                </Text>
                <Text style={styles.alertTime}>10 min ago</Text>
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

      {/* Chat Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={chatbotVisible}
        onRequestClose={() => setChatbotVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>AI Assistant</Text>
            <TouchableOpacity onPress={() => setChatbotVisible(false)}>
              <Icon name="times" size={24} color="#2A5B8C" />
            </TouchableOpacity>
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
              placeholder="Type your message here..."
              placeholderTextColor="#999"
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
              <Icon name="paper-plane" size={20} color="white" />
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* SOS Floating Button */}
      <TouchableOpacity style={styles.sosButton} onPress={handleSOSPress}>
        <Text style={styles.sosButtonText}>SOS</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// (Your styles remain unchanged)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 18, color: '#444' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#2A5B8C' },
  logo: { flexDirection: 'row', alignItems: 'center' },
  logoText: { color: 'white', fontSize: 20, marginLeft: 8 },
  headerActions: { flexDirection: 'row' },
  headerIcon: { marginLeft: 16 },
  scrollView: { flex: 1 },
  userWelcome: { padding: 16, backgroundColor: '#2A5B8C', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  welcomeTitle: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  welcomeText: { color: 'white', marginTop: 8 },
  locationTime: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  locationText: { color: 'white', marginLeft: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, justifyContent: 'space-between' },
  statCard: { width: '48%', backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8, marginVertical: 8 },
  safetyScore: { backgroundColor: '#2A5B8C' },
  statValue: { fontSize: 20, fontWeight: 'bold' },
  statLabel: { marginTop: 4, fontSize: 12, color: '#666' },
  safetyScoreValue: { color: 'white' },
  safetyScoreLabel: { color: 'white', fontSize: 12 },
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitleText: { marginLeft: 8, fontSize: 16, fontWeight: 'bold', color: '#2A5B8C' },
  mapContainer: { height: 250, borderRadius: 12, overflow: 'hidden' },
  map: { flex: 1 },
  mapOverlay: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', padding: 4, borderRadius: 4 },
  mapOverlayText: { marginLeft: 4 },
  actionButtons: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionBtn: { width: '48%', flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8, marginBottom: 12 },
  emergencyBtn: { backgroundColor: '#e63946' },
  emergencyBtnText: { color: 'white', marginLeft: 8 },
  actionBtnText: { marginLeft: 8, color: '#2A5B8C', fontWeight: '500' },
  alertList: { marginTop: 12 },
  alertItem: { flexDirection: 'row', marginBottom: 12 },
  alertIcon: { width: 32, alignItems: 'center' },
  alertContent: { flex: 1, paddingLeft: 8 },
  alertTitle: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  alertText: { marginTop: 2, color: '#555' },
  alertTime: { marginTop: 4, color: '#999', fontSize: 12 },
  modalContainer: { flex: 1, backgroundColor: 'white' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#ddd' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  chatContainer: { flex: 1, padding: 16 },
  chatContent: { paddingBottom: 16 },
  messageBubble: { marginVertical: 4, padding: 12, borderRadius: 8, maxWidth: '80%' },
  userMessage: { backgroundColor: '#2A5B8C', alignSelf: 'flex-end' },
  botMessage: { backgroundColor: '#ddd', alignSelf: 'flex-start' },
  userMessageText: { color: 'white' },
  botMessageText: { color: 'black' },
  messageTime: { marginTop: 4, fontSize: 10, color: '#666', alignSelf: 'flex-end' },
  quickActionsContainer: { marginVertical: 12, paddingHorizontal: 16 },
  quickActionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', padding: 8, borderRadius: 6, marginRight: 12 },
  quickActionText: { marginLeft: 6, fontSize: 12, color: '#2A5B8C' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1, borderColor: '#ddd' },
  textInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 },
  sendButton: { padding: 10, backgroundColor: '#2A5B8C', borderRadius: 8 },
  sosButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#e63946',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 50,
    elevation: 4
  },
  sosButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});
