// App.js (Updated)
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Platform,
  Alert,
  StyleSheet,
  Linking,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { useContacts } from '../ContactsContext/ContactsContext'; // Import the context
import { useUser } from '../Users/useContext';

export default function App({ navigation }) { // Add navigation prop
  const { 
    savedContacts, 
    addContact, 
    removeContact, 
    refreshContacts 
  } = useContacts();
  
  const [deviceContacts, setDeviceContacts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');

  // Refresh contacts when screen focuses
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshContacts();
    });
    return unsubscribe;
  }, [navigation]);

  // Fetch device contacts (same as before)
  async function fetchDeviceContacts() {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow contacts permission to import from phone.');
      return;
    }

    try {
      const { data } = await Contacts.getContactsAsync({ fields: [Contacts.Fields.PhoneNumbers] });
      const withPhones = data
        .map((c) => {
          const phone = (c.phoneNumbers && c.phoneNumbers[0] && c.phoneNumbers[0].number) || null;
          return {
            id: c.id,
            name: c.name || (c.firstName || '') + ' ' + (c.lastName || ''),
            phone,
          };
        })
        .filter((c) => c.phone);

      setDeviceContacts(withPhones);
      setModalVisible(true);
    } catch (e) {
      console.warn('Error fetching contacts', e);
      Alert.alert('Error', 'Could not fetch contacts from device.');
    }
  }

  // Add manual contact - UPDATED to use context
  function addManualContact() {
    const trimmedName = nameInput.trim();
    const trimmedPhone = phoneInput.trim();
    if (!trimmedPhone) return Alert.alert('Phone required', 'Please enter a phone number.');

    const newContact = {
      name: trimmedName || trimmedPhone,
      phone: trimmedPhone,
      relationship: 'Manual'
    };

    addContact(newContact);
    setNameInput('');
    setPhoneInput('');
    Alert.alert('Success', 'Contact added successfully!');
  }

  // Import device contact - UPDATED to use context
  function importDeviceContact(contact) {
    const exists = savedContacts.some((c) => normalizePhone(c.phone) === normalizePhone(contact.phone));
    if (exists) {
      Alert.alert('Already added', `${contact.name} is already in your list.`);
      return;
    }

    const newContact = {
      name: contact.name,
      phone: contact.phone,
      relationship: 'Imported'
    };

    addContact(newContact);
    setModalVisible(false);
    Alert.alert('Success', 'Contact imported successfully!');
  }

  function normalizePhone(p) {
    return (p || '').replace(/[^0-9+]/g, '');
  }

  // Remove contact - UPDATED to use context
  function handleRemoveContact(id) {
    Alert.alert('Remove contact', 'Remove this contact from list?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeContact(id) },
    ]);
  }

  // Call contact (same as before)
  async function callContact(phone) {
    const phoneNumber = `tel:${phone}`;
    try {
      const supported = await Linking.canOpenURL(phoneNumber);
      if (!supported) {
        Alert.alert('Unsupported', 'Calling is not supported on this device.');
        return;
      }
      await Linking.openURL(phoneNumber);
    } catch (error) {
      Alert.alert('Error', 'Unable to make the call.');
    }
  }

  // Navigate to emergency contacts screen
  function navigateToEmergencyContacts() {
    navigation.navigate('Adding_Emergency_Contacts');
  }

  const renderSavedItem = ({ item }) => (
    <View style={styles.contactRow}>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactPhone}>{item.phone}</Text>
        {item.relationship && (
          <Text style={styles.contactRelationship}>{item.relationship}</Text>
        )}
        {item.isEmergency && (
          <View style={styles.emergencyBadge}>
            <Text style={styles.emergencyBadgeText}>🚨 Emergency</Text>
          </View>
        )}
      </View>

      <View style={styles.contactButtons}>
        <TouchableOpacity style={styles.callBtn} onPress={() => callContact(item.phone)}>
          <Text style={styles.callBtnText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveContact(item.id)}>
          <Text style={styles.removeBtnText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDeviceItem = ({ item }) => (
    <TouchableOpacity style={styles.deviceRow} onPress={() => importDeviceContact(item)}>
      <View>
        <Text style={styles.deviceName}>{item.name}</Text>
        <Text style={styles.devicePhone}>{item.phone}</Text>
      </View>
      <Text style={styles.addText}>Add</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Contacts</Text>
        <Text style={styles.subtitle}>Add manually, import from phone, or set emergency contacts</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          placeholder="Name (optional)"
          value={nameInput}
          onChangeText={setNameInput}
          style={styles.input}
          placeholderTextColor="#9CA3AF"
        />
        <TextInput
          placeholder="Phone number"
          value={phoneInput}
          onChangeText={setPhoneInput}
          keyboardType={Platform.OS === 'ios' ? 'phone-pad' : 'numeric'}
          style={styles.input}
          placeholderTextColor="#9CA3AF"
        />
        <View style={styles.rowButtons}>
          <TouchableOpacity style={styles.primaryBtn} onPress={addManualContact}>
            <Text style={styles.primaryBtnText}>Add Contact</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.ghostBtn} onPress={fetchDeviceContacts}>
            <Text style={styles.ghostBtnText}>Import from Phone</Text>
          </TouchableOpacity>
        </View>
        
        
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>
          Saved Contacts ({savedContacts.length})
          {savedContacts.filter(c => c.isEmergency).length > 0 && 
            ` • ${savedContacts.filter(c => c.isEmergency).length} Emergency`
          }
        </Text>
        {savedContacts.length === 0 ? (
          <Text style={styles.emptyText}>No contacts yet — add one or import from your phone.</Text>
        ) : (
          <FlatList 
            data={savedContacts} 
            keyExtractor={(item) => item.id} 
            renderItem={renderSavedItem} 
          />
        )}
      </View>

      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select a contact to import</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
          </View>

          {deviceContacts.length === 0 ? (
            <Text style={styles.emptyText}>No contacts with phone numbers found on this device.</Text>
          ) : (
            <FlatList data={deviceContacts} keyExtractor={(item) => item.id} renderItem={renderDeviceItem} />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// Updated styles with navy blue theme
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 20,
    backgroundColor: '#1E3A8A',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#E2E8F0',
    lineHeight: 20,
  },
  form: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 12,
    color: '#1E293B',
  },
  rowButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#1E3A8A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  ghostBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1E3A8A',
  },
  ghostBtnText: {
    color: '#1E3A8A',
    fontWeight: '600',
    fontSize: 16,
  },
  emergencyBtn: {
    backgroundColor: '#DC2626',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  emergencyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 16,
    marginTop: 40,
    lineHeight: 24,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2.22,
    elevation: 3,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 2,
  },
  contactRelationship: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  callBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  callBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  removeBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  removeBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  emergencyBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  emergencyBadgeText: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1E3A8A',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalClose: {
    fontSize: 16,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  deviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 4,
  },
  devicePhone: {
    fontSize: 14,
    color: '#64748B',
  },
  addText: {
    color: '#1E3A8A',
    fontWeight: '600',
    fontSize: 16,
  },
});