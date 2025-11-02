// addContacts.js
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
  ActivityIndicator,
  StatusBar,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as Contacts from 'expo-contacts';
import { useUser } from '../Users/useContext';

export default function AddContacts({ navigation }) { 
  const { 
    user, 
    token, 
    emergencyContacts, 
    addContacts, 
    updateContacts, 
    deleteContact,
    refreshEmergencyContacts 
  } = useUser();
  
  const [deviceContacts, setDeviceContacts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [selectedRelationship, setSelectedRelationship] = useState('Other');
  const [isEmergency, setIsEmergency] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [savedContacts, setSavedContacts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const relationshipOptions = [
    'Family', 'Friend', 'Partner', 'Colleague', 'Doctor', 'Lawyer', 'Other'
  ];

  // Fetch contacts from backend using context
  const fetchContacts = async () => {
    if (!user?._id || !token) {
      console.log('❌ No user ID or token available');
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔄 Fetching contacts for user:', user._id);
      
      const contacts = await refreshEmergencyContacts();
      console.log('✅ Contacts fetched via context:', contacts?.length || 0);
      
      if (Array.isArray(contacts)) {
        setSavedContacts(contacts);
      } else {
        console.warn('⚠️ Contacts data is not an array:', contacts);
        setSavedContacts([]);
      }
    } catch (error) {
      console.error('❌ Error fetching contacts:', error);
      Alert.alert('Error', 'Failed to fetch contacts');
      setSavedContacts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh contacts when screen focuses
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('👀 Screen focused, fetching contacts...');
      fetchContacts();
    });
    
    fetchContacts();
    
    return unsubscribe;
  }, [navigation, user, token]);

  // Sync with context's emergencyContacts
  useEffect(() => {
    if (Array.isArray(emergencyContacts)) {
      setSavedContacts(emergencyContacts);
    }
  }, [emergencyContacts]);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchContacts();
  };

  // Get contact stats
  const getContactStats = () => {
    const total = savedContacts.length;
    const emergency = savedContacts.filter(contact => contact.isEmergency).length;
    return { total, emergency };
  };

  // Check for duplicate phone numbers
  const isDuplicatePhone = (phone, excludeId = null) => {
    const normalizedPhone = normalizePhone(phone);
    return savedContacts.some(contact => {
      const contactId = contact._id || contact.id;
      const contactPhone = contact.phoneNumber || contact.phone;
      return contactId !== excludeId && normalizePhone(contactPhone) === normalizedPhone;
    });
  };

  // Normalize phone number
  function normalizePhone(p) {
    return (p || '').replace(/[^0-9+]/g, '');
  }

  // Fetch device contacts
  async function fetchDeviceContacts() {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Allow contacts permission to import from phone.');
        return;
      }

      setLoading(true);
      const { data } = await Contacts.getContactsAsync({ 
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Relationships] 
      });
      
      const withPhones = data
        .map((c) => {
          const phone = (c.phoneNumbers && c.phoneNumbers[0] && c.phoneNumbers[0].number) || null;
          const relationship = (c.relationships && c.relationships[0] && c.relationships[0].name) || null;
          
          return {
            id: c.id,
            name: c.name || (c.firstName || '') + ' ' + (c.lastName || ''),
            phone,
            relationship: relationship || 'Other'
          };
        })
        .filter((c) => c.phone);

      setDeviceContacts(withPhones);
      setModalVisible(true);
      console.log('📱 Device contacts loaded:', withPhones.length);
    } catch (e) {
      console.warn('Error fetching contacts', e);
      Alert.alert('Error', 'Could not fetch contacts from device.');
    } finally {
      setLoading(false);
    }
  }

  // Reset form
  const resetForm = () => {
    setNameInput('');
    setPhoneInput('');
    setSelectedRelationship('Other');
    setIsEmergency(false);
    setEditingContact(null);
  };

  // Add contact using context function - FIXED VERSION
  const handleSaveContact = async () => {
    try {
      const trimmedName = nameInput.trim();
      const trimmedPhone = phoneInput.trim();
      
      if (!trimmedPhone) {
        Alert.alert('Phone required', 'Please enter a phone number.');
        return;
      }

      // Validate phone format
      const normalizedPhone = normalizePhone(trimmedPhone);
      if (normalizedPhone.length < 10) {
        Alert.alert('Invalid Phone', 'Please enter a valid phone number.');
        return;
      }

      // Check for duplicates
      const excludeId = editingContact ? (editingContact._id || editingContact.id) : null;
      if (isDuplicatePhone(trimmedPhone, excludeId)) {
        Alert.alert('Duplicate Contact', 'This phone number is already in your contacts.');
        return;
      }

      setSaveLoading(true);

      const contactData = {
        name: trimmedName || trimmedPhone,
        phoneNumber: trimmedPhone,
        relationship: selectedRelationship,
        isEmergency: isEmergency
      };

      console.log('💾 Saving contact data:', contactData);

      let result;
      if (editingContact) {
        // Update existing contact
        const contactId = editingContact._id || editingContact.id;
        result = await updateContacts(contactId, contactData);
        console.log('✅ Contact updated via context:', contactId);
        Alert.alert('Success', 'Contact updated successfully!');
      } else {
        // Add new contact
        result = await addContacts(user._id, [contactData]);
        console.log('✅ Contact added via context');
        Alert.alert('Success', 'Contact added successfully!');
      }
      
      // Refresh contacts list
      await fetchContacts();
      resetForm();
      
    } catch (error) {
      console.error('❌ Error saving contact:', error);
      const errorMessage = error.message || 'Failed to save contact. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setSaveLoading(false);
    }
  };

  // Import device contact using context function
  async function importDeviceContact(contact) {
    try {
      // Check for duplicates
      if (isDuplicatePhone(contact.phone)) {
        Alert.alert('Already added', `${contact.name} is already in your list.`);
        return;
      }

      setSaveLoading(true);
      const newContact = {
        name: contact.name,
        phoneNumber: contact.phone,
        relationship: contact.relationship || 'Other',
        isEmergency: false
      };

      await addContacts(user._id, [newContact]);
      
      // Refresh the contacts list
      await fetchContacts();
      setModalVisible(false);
      Alert.alert('Success', 'Contact imported successfully!');
    } catch (error) {
      console.error('❌ Error importing contact:', error);
      Alert.alert('Error', error.message || 'Failed to import contact.');
    } finally {
      setSaveLoading(false);
    }
  }

  // Edit contact
  const handleEditContact = (contact) => {
    console.log('✏️ Editing contact:', contact);
    setEditingContact(contact);
    setNameInput(contact.name || contact.contactName || '');
    setPhoneInput(contact.phoneNumber || contact.phone || '');
    setSelectedRelationship(contact.relationship || 'Other');
    setIsEmergency(contact.isEmergency || false);
  };

  // Cancel edit
  const handleCancelEdit = () => {
    resetForm();
  };

  // Remove contact using context function
  async function handleRemoveContact(contact) {
    const contactId = contact._id || contact.id;
    const contactName = contact.name || contact.contactName || 'this contact';
    
    Alert.alert('Remove contact', `Remove ${contactName} from list?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Remove', 
        style: 'destructive', 
        onPress: async () => {
          try {
            setLoading(true);
            await deleteContact(contactId);
            // Refresh the list after deletion
            await fetchContacts();
            Alert.alert('Success', 'Contact removed successfully!');
          } catch (error) {
            console.error('❌ Error removing contact:', error);
            Alert.alert('Error', error.message || 'Failed to remove contact.');
          } finally {
            setLoading(false);
          }
        }
      },
    ]);
  }

  // Toggle emergency status using context function
  const toggleEmergencyStatus = async (contact) => {
    const contactId = contact._id || contact.id;
    try {
      setLoading(true);
      await updateContacts(contactId, { 
        isEmergency: !contact.isEmergency 
      });
      // Refresh the list to show updated status
      await fetchContacts();
      Alert.alert('Success', `Contact ${!contact.isEmergency ? 'added to' : 'removed from'} emergency contacts!`);
    } catch (error) {
      console.error('❌ Error updating emergency status:', error);
      Alert.alert('Error', error.message || 'Failed to update emergency status.');
    } finally {
      setLoading(false);
    }
  };

  // Call contact
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

  const renderSavedItem = ({ item }) => {
    const contactName = item.name || item.contactName || 'No Name';
    const phoneNumber = item.phoneNumber || item.phone || 'No Phone';
    const relationship = item.relationship || 'Other';
    const isEmergencyContact = item.isEmergency || false;
    const contactId = item._id || item.id;

    return (
      <View style={styles.contactCard}>
        <View style={styles.contactHeader}>
          <View style={styles.contactAvatar}>
            <Text style={styles.avatarText}>
              {contactName ? contactName.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>{contactName}</Text>
            <Text style={styles.contactPhone}>{phoneNumber}</Text>
            <View style={styles.contactMeta}>
              {relationship && relationship !== 'Other' && (
                <View style={styles.relationshipBadge}>
                  <Text style={styles.relationshipText}>{relationship}</Text>
                </View>
              )}
              {isEmergencyContact && (
                <View style={styles.emergencyBadge}>
                  <Text style={styles.emergencyBadgeText}>🚨 Emergency</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.contactActions}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.emergencyBtn, isEmergencyContact && styles.emergencyActive]}
            onPress={() => toggleEmergencyStatus(item)}
            disabled={loading}
          >
            <Text style={[styles.actionBtnText, isEmergencyContact && styles.emergencyBtnTextActive]}>
              {isEmergencyContact ? 'Remove Emergency' : 'Make Emergency'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionBtn, styles.callBtn]} 
            onPress={() => callContact(phoneNumber)}
          >
            <Text style={[styles.actionBtnText, styles.callBtnText]}>Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionBtn, styles.editBtn]} 
            onPress={() => handleEditContact(item)}
          >
            <Text style={[styles.actionBtnText, styles.editBtnText]}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionBtn, styles.removeBtn]} 
            onPress={() => handleRemoveContact(item)}
          >
            <Text style={[styles.actionBtnText, styles.removeBtnText]}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderDeviceItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.deviceCard} 
      onPress={() => importDeviceContact(item)}
      disabled={saveLoading}
    >
      <View style={styles.deviceContactInfo}>
        <View style={styles.deviceAvatar}>
          <Text style={styles.deviceAvatarText}>
            {item.name ? item.name.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <View>
          <Text style={styles.deviceName}>{item.name}</Text>
          <Text style={styles.devicePhone}>{item.phone}</Text>
          {item.relationship && item.relationship !== 'Other' && (
            <Text style={styles.deviceRelationship}>{item.relationship}</Text>
          )}
        </View>
      </View>
      {saveLoading ? (
        <ActivityIndicator size="small" color="#6366F1" />
      ) : (
        <View style={styles.addButton}>
          <Text style={styles.addText}>Add</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const contactStats = getContactStats();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      <View style={styles.header}>
        <Text style={styles.title}>My Contacts</Text>
        <Text style={styles.subtitle}>
          {contactStats.total} total contacts • {contactStats.emergency} emergency
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6366F1']}
            tintColor="#6366F1"
          />
        }
      >
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>
            {editingContact ? 'Edit Contact' : 'Add New Contact'}
          </Text>
          
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name (optional)</Text>
              <TextInput
                placeholder="Enter contact name"
                value={nameInput}
                onChangeText={setNameInput}
                style={styles.input}
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput
                placeholder="Enter phone number"
                value={phoneInput}
                onChangeText={setPhoneInput}
                keyboardType={Platform.OS === 'ios' ? 'phone-pad' : 'numeric'}
                style={styles.input}
                placeholderTextColor="#94A3B8"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Relationship</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedRelationship}
                  onValueChange={(value) => setSelectedRelationship(value)}
                  style={styles.picker}
                  dropdownIconColor="#6366F1"
                >
                  {relationshipOptions.map((option, index) => (
                    <Picker.Item key={index} label={option} value={option} />
                  ))}
                </Picker>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.emergencyToggle, isEmergency && styles.emergencyToggleActive]}
              onPress={() => setIsEmergency(!isEmergency)}
            >
              <View style={[styles.emergencyToggleCircle, isEmergency && styles.emergencyToggleCircleActive]}>
                {isEmergency && <Text style={styles.emergencyToggleCheck}>✓</Text>}
              </View>
              <Text style={[styles.emergencyToggleLabel, isEmergency && styles.emergencyToggleLabelActive]}>
                Mark as Emergency Contact
              </Text>
            </TouchableOpacity>

            <View style={styles.formButtons}>
              {editingContact ? (
                <>
                  <TouchableOpacity 
                    style={[styles.button, styles.cancelButton]} 
                    onPress={handleCancelEdit}
                    disabled={saveLoading}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.button, styles.saveButton]} 
                    onPress={handleSaveContact}
                    disabled={saveLoading}
                  >
                    {saveLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.saveButtonText}>Update Contact</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity 
                    style={[styles.button, styles.saveButton]} 
                    onPress={handleSaveContact}
                    disabled={saveLoading}
                  >
                    {saveLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.saveButtonText}>Add Contact</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.button, styles.importButton]} 
                    onPress={fetchDeviceContacts}
                    disabled={loading}
                  >
                    <Text style={styles.importButtonText}>📱 Import from Phone</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={styles.listContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Saved Contacts</Text>
            <Text style={styles.sectionSubtitle}>
              {savedContacts.length} contacts
              {contactStats.emergency > 0 && ` • ${contactStats.emergency} emergency`}
            </Text>
          </View>
          
          {loading && !refreshing ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color="#6366F1" />
              <Text style={styles.loadingText}>Loading contacts...</Text>
            </View>
          ) : savedContacts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>No contacts yet</Text>
              <Text style={styles.emptyText}>Add a contact manually or import from your phone</Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={fetchDeviceContacts}
              >
                <Text style={styles.emptyButtonText}>Import from Phone</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.contactsList}>
              {savedContacts.map((item) => (
                <View key={item._id || item.id}>
                  {renderSavedItem({ item })}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Import Contacts</Text>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>Select a contact to import</Text>

          {deviceContacts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📱</Text>
              <Text style={styles.emptyTitle}>No contacts found</Text>
              <Text style={styles.emptyText}>No contacts with phone numbers found on this device</Text>
            </View>
          ) : (
            <FlatList 
              data={deviceContacts} 
              keyExtractor={(item) => item.id} 
              renderItem={renderDeviceItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalListContent}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  formContainer: {
    padding: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  form: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F8FAFC',
    color: '#1E293B',
  },
  pickerWrapper: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  picker: {
    height: 52,
  },
  emergencyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginBottom: 24,
    backgroundColor: '#F8FAFC',
  },
  emergencyToggleActive: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  emergencyToggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#94A3B8',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  emergencyToggleCircleActive: {
    borderColor: '#EF4444',
    backgroundColor: '#EF4444',
  },
  emergencyToggleCheck: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emergencyToggleLabel: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  emergencyToggleLabelActive: {
    color: '#EF4444',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  saveButton: {
    backgroundColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#64748B',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  importButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  importButtonText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  contactsList: {
    gap: 12,
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  contactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 8,
  },
  contactMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  relationshipBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  relationshipText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '600',
  },
  emergencyBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emergencyBadgeText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  contactActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  emergencyBtn: {
    backgroundColor: '#F3F4F6',
  },
  emergencyActive: {
    backgroundColor: '#FEE2E2',
  },
  emergencyBtnTextActive: {
    color: '#DC2626',
  },
  callBtn: {
    backgroundColor: '#10B981',
  },
  callBtnText: {
    color: '#FFFFFF',
  },
  editBtn: {
    backgroundColor: '#3B82F6',
  },
  editBtnText: {
    color: '#FFFFFF',
  },
  removeBtn: {
    backgroundColor: '#EF4444',
  },
  removeBtnText: {
    color: '#FFFFFF',
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: 'bold',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginVertical: 16,
  },
  modalListContent: {
    padding: 16,
  },
  deviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  deviceContactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deviceAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deviceAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  devicePhone: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  deviceRelationship: {
    fontSize: 12,
    color: '#8B5CF6',
    marginTop: 2,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});