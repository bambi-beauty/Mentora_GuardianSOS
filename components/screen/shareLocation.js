import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';

const ShareLocation = ({ visible, onClose }) => {
  const [contacts, setContacts] = useState([ ]);
  
  const [customContact, setCustomContact] = useState('');
  const [location, setLocation] = useState(null);
  const [sharingMethod, setSharingMethod] = useState('sms'); 

  useEffect(() => {
    if (visible) {
      getCurrentLocation();
    }
  }, [visible]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to share your location.');
        return;
      }

      const locationData = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      setLocation(locationData.coords);
      
      // Get address for the location
      getReverseGeocoding(locationData.coords);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  const toggleContactSelection = (id) => {
    setContacts(contacts.map(contact =>
      contact.id === id ? { ...contact, selected: !contact.selected } : contact
    ));
  };

  const addCustomContact = () => {
    if (customContact.trim() === '') {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    // Basic phone number validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(customContact.replace(/[\s\-\(\)]/g, ''))) {
      Alert.alert('Invalid Number', 'Please enter a valid phone number');
      return;
    }

    const newContact = {
      id: Date.now(),
      name: 'Custom Contact',
      phone: customContact.trim(),
      selected: true,
    };
    
    setContacts([...contacts, newContact]);
    setCustomContact('');
  };

  const getReverseGeocoding = async (coords) => {
    try {
      const address = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      
      if (address.length > 0) {
        const firstAddress = address[0];
        const addressParts = [];
        
        if (firstAddress.street) addressParts.push(firstAddress.street);
        if (firstAddress.city) addressParts.push(firstAddress.city);
        if (firstAddress.region) addressParts.push(firstAddress.region);
        if (firstAddress.postalCode) addressParts.push(firstAddress.postalCode);
        if (firstAddress.country) addressParts.push(firstAddress.country);
        
        const addressString = addressParts.join(', ');
        setLocation(prev => ({ ...prev, address: addressString }));
      }
    } catch (error) {
      console.error('Error getting address:', error);
    }
  };

  const generateLocationMessage = () => {
    if (!location) return '';
    
    const googleMapsLink = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    const appleMapsLink = `http://maps.apple.com/?ll=${location.latitude},${location.longitude}`;
    
    let message = `🚨 Guardian SOS Location Share 🚨

My current location:
📍 Latitude: ${location.latitude.toFixed(6)}
📍 Longitude: ${location.longitude.toFixed(6)}`;

    if (location.accuracy) {
      message += `\n📍 Accuracy: ${location.accuracy.toFixed(2)} meters`;
    }
    message += `\n
🗺️ Google Maps: ${googleMapsLink}
🗺️ Apple Maps: ${appleMapsLink}`;

    if (location.address) {
      message += `\n\n🏠 Address: ${location.address}`;
    }

    message += `\n
⏰ Shared at: ${new Date().toLocaleString()}

This location was shared via Guardian SOS for safety purposes.`;

    return message;
  };

  const shareViaSMS = async () => {
    try {
      const selectedContacts = contacts.filter(contact => contact.selected);
      
      if (selectedContacts.length === 0) {
        Alert.alert('No contacts selected', 'Please select at least one contact to share your location with.');
        return;
      }

      const phoneNumbers = selectedContacts.map(contact => contact.phone);
      const message = generateLocationMessage();

      // Check if SMS is available
      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('SMS not available', 'SMS is not available on this device.');
        return;
      }

      const { result } = await SMS.sendSMSAsync(phoneNumbers, message);
      
      if (result === 'sent') {
        Alert.alert('Success', `Location shared successfully with ${selectedContacts.length} contact(s)!`);
        onClose();
      } else if (result === 'cancelled') {
        Alert.alert('Cancelled', 'SMS was cancelled');
      } else {
        Alert.alert('Failed', 'Failed to send SMS. Please try again.');
      }
    } catch (error) {
      console.error('Error sharing location via SMS:', error);
      Alert.alert('Error', 'Failed to share location via SMS');
    }
  };

  const shareViaApps = async () => {
    try {
      if (!location) {
        Alert.alert('Location unavailable', 'Please wait while we get your current location.');
        await getCurrentLocation();
        return;
      }

      const message = generateLocationMessage();
      
      // Use Linking to open share sheet
      const result = await Linking.openURL(
        `whatsapp://send?text=${encodeURIComponent(message)}`
      ).catch(() => {
        Linking.openURL(`sms:?body=${encodeURIComponent(message)}`);
      });

    } catch (error) {
      console.error('Error sharing via apps:', error);
      Linking.openURL(`sms:?body=${encodeURIComponent(message)}`);
    }
  };

  const shareToWhatsApp = async () => {
    try {
      const message = generateLocationMessage();
      const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
      
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'WhatsApp not installed',
          'Would you like to share via another method?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Share via SMS', onPress: () => Linking.openURL(`sms:?body=${encodeURIComponent(message)}`) }
          ]
        );
      }
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
      Alert.alert('Error', 'Failed to share to WhatsApp');
    }
  };

  const shareToMessenger = async () => {
    try {
      const message = generateLocationMessage();
      Alert.alert(
        'Share to Messenger',
        'Copy your location details to share in Messenger:',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Copy Details', 
            onPress: () => {
              //Clipboard here, install expo-clipboard
              Alert.alert('Copied!', 'Location details copied to clipboard. You can now paste them in Messenger.');
            }
          },
          { 
            text: 'Share via SMS', 
            onPress: () => Linking.openURL(`sms:?body=${encodeURIComponent(message)}`) 
          }
        ]
      );
    } catch (error) {
      console.error('Error sharing to Messenger:', error);
    }
  };

  const shareToOtherApps = () => {
    const message = generateLocationMessage();
    
    // For general app sharing
    Linking.openURL(`sms:?body=${encodeURIComponent(message)}`)
      .catch(() => {
        Alert.alert('Error', 'Unable to open share dialog');
      });
  };

  const shareLocation = async () => {
    if (!location) {
      Alert.alert('Location unavailable', 'Please wait while we get your current location.');
      await getCurrentLocation();
      return;
    }

    if (sharingMethod === 'sms') {
      await shareViaSMS();
    } else {
      // For app sharing, show options
      Alert.alert(
        'Share Location',
        'Choose how to share your location:',
        [
          { text: 'WhatsApp', onPress: shareToWhatsApp },
          { text: 'Other Apps', onPress: shareToOtherApps },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const selectAllContacts = () => {
    setContacts(contacts.map(contact => ({ ...contact, selected: true })));
  };

  const clearAllContacts = () => {
    setContacts(contacts.map(contact => ({ ...contact, selected: false })));
  };

  const renderContactItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.contactItem, item.selected && styles.contactItemSelected]}
      onPress={() => toggleContactSelection(item.id)}
    >
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactPhone}>{item.phone}</Text>
      </View>
      <View style={[styles.checkbox, item.selected && styles.checkboxSelected]}>
        {item.selected && <Icon name="check" size={12} color="white" />}
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Share Location</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="times" size={24} color="#2A5B8C" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Location Preview */}
          <View style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <Icon name="map-marker-alt" size={20} color="#FF5757" />
              <Text style={styles.locationTitle}>Current Location</Text>
            </View>
            {location ? (
              <View style={styles.locationDetails}>
                <Text style={styles.coordinate}>
                  📍 Lat: {location.latitude.toFixed(6)}
                </Text>
                <Text style={styles.coordinate}>
                  📍 Lng: {location.longitude.toFixed(6)}
                </Text>
                {location.accuracy && (
                  <Text style={styles.accuracy}>
                    🎯 Accuracy: {location.accuracy.toFixed(2)} meters
                  </Text>
                )}
                {location.address && (
                  <Text style={styles.address}>
                    🏠 {location.address}
                  </Text>
                )}
              </View>
            ) : (
              <Text style={styles.loadingText}>Getting your location...</Text>
            )}
            <TouchableOpacity style={styles.refreshButton} onPress={getCurrentLocation}>
              <Icon name="refresh" size={16} color="#2A5B8C" />
              <Text style={styles.refreshText}>Refresh Location</Text>
            </TouchableOpacity>
          </View>

          {/* Sharing Method */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sharing Method</Text>
            <View style={styles.methodButtons}>
              <TouchableOpacity
                style={[styles.methodButton, sharingMethod === 'sms' && styles.methodButtonSelected]}
                onPress={() => setSharingMethod('sms')}
              >
                <Icon name="comment" size={20} color={sharingMethod === 'sms' ? 'white' : '#2A5B8C'} />
                <Text style={[styles.methodText, sharingMethod === 'sms' && styles.methodTextSelected]}>
                  SMS
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.methodButton, sharingMethod === 'apps' && styles.methodButtonSelected]}
                onPress={() => setSharingMethod('apps')}
              >
                <Icon name="share-alt" size={20} color={sharingMethod === 'apps' ? 'white' : '#2A5B8C'} />
                <Text style={[styles.methodText, sharingMethod === 'apps' && styles.methodTextSelected]}>
                  Other Apps
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Contact Selection only for SMS */}
          {sharingMethod === 'sms' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Select Contacts</Text>
                <View style={styles.contactActions}>
                  <TouchableOpacity onPress={selectAllContacts} style={styles.contactAction}>
                    <Text style={styles.contactActionText}>Select All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={clearAllContacts} style={styles.contactAction}>
                    <Text style={styles.contactActionText}>Clear All</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <FlatList
                data={contacts}
                renderItem={renderContactItem}
                keyExtractor={item => item.id.toString()}
                scrollEnabled={false}
              />
              
              {/* Add Custom Contact */}
              <View style={styles.customContactContainer}>
                <TextInput
                  style={styles.contactInput}
                  value={customContact}
                  onChangeText={setCustomContact}
                  placeholder="Enter phone number (e.g., +1234567890)"
                  keyboardType="phone-pad"
                  placeholderTextColor="#999"
                />
                <TouchableOpacity style={styles.addButton} onPress={addCustomContact}>
                  <Icon name="plus" size={16} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* App Sharing Options (only for apps) */}
          {sharingMethod === 'apps' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Share Via</Text>
              <View style={styles.appButtons}>
                <TouchableOpacity style={styles.appButton} onPress={shareToWhatsApp}>
                  <Icon name="whatsapp" size={24} color="#25D366" />
                  <Text style={styles.appButtonText}>WhatsApp</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.appButton} onPress={shareToOtherApps}>
                  <Icon name="share-square-o" size={24} color="#2A5B8C" />
                  <Text style={styles.appButtonText}>Other Apps</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Preview Message */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Message Preview</Text>
            <View style={styles.messagePreview}>
              <Text style={styles.messageText}>{generateLocationMessage()}</Text>
            </View>
          </View>
        </ScrollView>

        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.footer}
        >
          <TouchableOpacity style={styles.shareButton} onPress={shareLocation}>
            <Icon name="share-square-o" size={20} color="white" />
            <Text style={styles.shareButtonText}>
              {sharingMethod === 'sms' ? 'Share via SMS' : 'Share Location'}
            </Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A5B8C',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  locationCard: {
    backgroundColor: '#F8FAFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#2A5B8C',
  },
  locationDetails: {
    marginBottom: 10,
  },
  coordinate: {
    fontSize: 14,
    color: '#1A2C3D',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  accuracy: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#2A5B8C',
    fontWeight: '500',
    marginTop: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#718096',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  refreshText: {
    fontSize: 14,
    color: '#2A5B8C',
    marginLeft: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2C3D',
  },
  methodButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A5B8C',
    marginHorizontal: 5,
  },
  methodButtonSelected: {
    backgroundColor: '#2A5B8C',
  },
  methodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A5B8C',
    marginLeft: 8,
  },
  methodTextSelected: {
    color: 'white',
  },
  contactActions: {
    flexDirection: 'row',
  },
  contactAction: {
    marginLeft: 15,
  },
  contactActionText: {
    fontSize: 14,
    color: '#2A5B8C',
    fontWeight: '500',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    marginBottom: 8,
  },
  contactItemSelected: {
    backgroundColor: '#F0F5FF',
    borderColor: '#2A5B8C',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2C3D',
  },
  contactPhone: {
    fontSize: 14,
    color: '#718096',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#2A5B8C',
    borderColor: '#2A5B8C',
  },
  customContactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  contactInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#2A5B8C',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  appButton: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '45%',
  },
  appButtonText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#2A5B8C',
  },
  messagePreview: {
    backgroundColor: '#F8FAFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxHeight: 200,
  },
  messageText: {
    fontSize: 12,
    color: '#1A2C3D',
    lineHeight: 16,
  },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  shareButton: {
    backgroundColor: '#2A5B8C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ShareLocation;