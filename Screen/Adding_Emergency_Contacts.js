import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useUser } from '../Users/useContext'; 

const Adding_Emergency_Contacts = ({ navigation, route }) => {
  const { user, addContacts, completeOnboardingStep } = useUser();
  
  const [contacts, setContacts] = useState([
    { name: '', phone: '', relationship: 'Family' },
    { name: '', phone: '', relationship: 'Friend' },
  ]);
  const [loading, setLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Relationship options for the picker
  const relationshipOptions = [
    'Family',
    'Friend', 
    'Spouse',
    'Parent',
    'Sibling',
    'Child',
    'Relative',
    'Colleague',
    'Neighbor',
    'Doctor',
    'Other'
  ];

  // Check if contacts already exist
  useEffect(() => {
    if (user?.emergencyContacts && user.emergencyContacts.length > 0) {
      setIsCompleted(true);
      // Pre-fill with existing contacts
      const existingContacts = user.emergencyContacts.slice(0, 2);
      const filledContacts = [
        ...existingContacts,
        ...Array(2 - existingContacts.length).fill({ name: '', phone: '', relationship: 'Family' })
      ].slice(0, 2);
      setContacts(filledContacts);
    }
  }, [user]);

  // Format South African phone number
  const formatSouthAfricanPhone = (text) => {
    // Remove all non-digit characters except +
    const cleaned = text.replace(/[^\d+]/g, '');
    
    // If starts with +27, format as +27 XX XXX XXXX
    if (cleaned.startsWith('+27') && cleaned.length > 3) {
      const rest = cleaned.slice(3);
      if (rest.length <= 2) return `+27 ${rest}`;
      if (rest.length <= 5) return `+27 ${rest.slice(0, 2)} ${rest.slice(2)}`;
      return `+27 ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5, 9)}`;
    }
    
    // If starts with 27, format as 27 XX XXX XXXX
    if (cleaned.startsWith('27') && cleaned.length > 2) {
      const rest = cleaned.slice(2);
      if (rest.length <= 2) return `27 ${rest}`;
      if (rest.length <= 5) return `27 ${rest.slice(0, 2)} ${rest.slice(2)}`;
      return `27 ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5, 9)}`;
    }
    
    // If starts with 0, format as 0XX XXX XXXX
    if (cleaned.startsWith('0') && cleaned.length > 1) {
      const rest = cleaned.slice(1);
      if (rest.length <= 2) return `0${rest}`;
      if (rest.length <= 5) return `0${rest.slice(0, 2)} ${rest.slice(2)}`;
      return `0${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5, 9)}`;
    }
    
    return cleaned;
  };

  const updateContact = (index, field, value) => {
    const updatedContacts = [...contacts];
    
    if (field === 'phone') {
      // Format phone number when updating
      updatedContacts[index] = {
        ...updatedContacts[index],
        [field]: formatSouthAfricanPhone(value)
      };
    } else {
      updatedContacts[index] = {
        ...updatedContacts[index],
        [field]: value
      };
    }
    
    setContacts(updatedContacts);
  };

  const addAnotherContact = () => {
    if (contacts.length < 5) {
      setContacts([...contacts, { name: '', phone: '', relationship: 'Family' }]);
    } else {
      Alert.alert('Limit Reached', 'You can add up to 5 emergency contacts.');
    }
  };

  const removeContact = (index) => {
    if (contacts.length > 1) {
      const updatedContacts = contacts.filter((_, i) => i !== index);
      setContacts(updatedContacts);
    } else {
      Alert.alert('Minimum Required', 'You need at least one emergency contact.');
    }
  };

  const validateContacts = () => {
    const validContacts = contacts.filter(contact => 
      contact.name.trim() && contact.phone.trim() && contact.relationship.trim()
    );

    if (validContacts.length === 0) {
      Alert.alert('Required', 'Please add at least one emergency contact with all fields filled.');
      return false;
    }

    // Validate South African phone numbers
    for (let contact of validContacts) {
      // Remove all spaces and special characters except +
      const cleanedPhone = contact.phone.replace(/[\s\-\(\)]/g, '');
      
      // South African phone number regex
      // Formats: +27XXXXXXXXX or 27XXXXXXXXX or 0XXXXXXXXX
      const southAfricanPhoneRegex = /^(\+?27|0)[6-8][0-9]{8}$/;
      
      if (!southAfricanPhoneRegex.test(cleanedPhone)) {
        Alert.alert(
          'Invalid Phone Number', 
          `Please enter a valid South African phone number for ${contact.name || 'contact'}.\n\nValid formats:\n• +27761234567\n• 27761234567\n• 0761234567\n\nMust start with:\n• +27 or 27 or 0\n• Followed by 7 or 8\n• And 7-8 more digits`
        );
        return false;
      }
    }

    return validContacts;
  };

  const handleSaveContacts = async () => {
    try {
      setLoading(true);

      const validContacts = validateContacts();
      if (!validContacts) return;

      console.log('💾 Saving emergency contacts:', validContacts);

      // Save contacts to backend
      const result = await addContacts(user._id, validContacts);
      
      if (result) {
        // Mark this onboarding step as complete
        await completeOnboardingStep('emergency_contacts', { contacts: validContacts });
        
        setIsCompleted(true);
        
        Alert.alert(
          'Success!', 
          'Emergency contacts saved successfully.',
          [
            {
              text: 'Continue',
              onPress: () => {
                // Call the completion callback if provided
                if (route.params?.onComplete) {
                  route.params.onComplete();
                }
                // Navigate back or to next screen
                navigation.goBack();
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Error saving contacts:', error);
      Alert.alert('Error', 'Failed to save emergency contacts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Emergency Contacts?',
      'You can add emergency contacts later in settings. Are you sure you want to skip?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: () => navigation.navigate('Add_Image')
        }
      ]
    );
  };

  const renderContactField = (contact, index) => (
    <View key={index} style={styles.contactCard}>
      <View style={styles.contactHeader}>
        <Text style={styles.contactNumber}>Contact #{index + 1}</Text>
        {contacts.length > 1 && (
          <TouchableOpacity 
            onPress={() => removeContact(index)}
            style={styles.removeButton}
          >
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Full Name *"
        value={contact.name}
        onChangeText={(text) => updateContact(index, 'name', text)}
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Phone Number * (e.g., +27 76 123 4567)"
        value={contact.phone}
        onChangeText={(text) => updateContact(index, 'phone', text)}
        keyboardType="phone-pad"
        editable={!loading}
      />

      {/* Picker for Relationship */}
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Relationship</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={contact.relationship}
            onValueChange={(value) => updateContact(index, 'relationship', value)}
            style={styles.picker}
            enabled={!loading}
            dropdownIconColor="#6C757D"
          >
            {relationshipOptions.map((option) => (
              <Picker.Item 
                key={option} 
                label={option} 
                value={option} 
              />
            ))}
          </Picker>
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Emergency Contacts</Text>
          <Text style={styles.subtitle}>
            Add people who should be contacted in case of emergency
          </Text>
          
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>✓ Completed</Text>
            </View>
          )}
        </View>

        {/* Contacts List */}
        <View style={styles.contactsList}>
          {contacts.map((contact, index) => renderContactField(contact, index))}
        </View>

        {/* Add Another Contact Button */}
        {contacts.length < 5 && (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={addAnotherContact}
            disabled={loading}
          >
            <Text style={styles.addButtonText}>+ Add Another Contact</Text>
          </TouchableOpacity>
        )}

        {/* Requirements */}
        <View style={styles.requirements}>
          <Text style={styles.requirementsTitle}>Requirements:</Text>
          <Text style={styles.requirement}>• At least one contact required</Text>
          <Text style={styles.requirement}>• All fields must be filled</Text>
          <Text style={styles.requirement}>• Valid South African phone number</Text>
          <Text style={styles.requirement}>• Formats: +27..., 27..., or 0...</Text>
          <Text style={styles.requirement}>• Maximum 5 contacts</Text>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={loading}
        >
          <Text style={styles.skipButtonText}>
            {isCompleted ? 'Back' : 'Skip for now'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.saveButton,
            (loading || isCompleted) && styles.saveButtonDisabled
          ]}
          onPress={handleSaveContacts}
          disabled={loading || isCompleted}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isCompleted ? '✓ Completed' : 'Save Contacts'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 22,
  },
  completedBadge: {
    marginTop: 10,
    backgroundColor: '#28A745',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completedBadgeText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  contactsList: {
    marginBottom: 20,
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
  removeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeButtonText: {
    color: '#DC3545',
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  pickerContainer: {
    marginBottom: 8,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 6,
  },
  pickerWrapper: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  addButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  requirements: {
    backgroundColor: '#E7F3FF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0056B3',
    marginBottom: 8,
  },
  requirement: {
    fontSize: 14,
    color: '#0056B3',
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    backgroundColor: '#FFFFFF',
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  skipButtonText: {
    color: '#6C757D',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#6C757D',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Adding_Emergency_Contacts;