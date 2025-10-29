import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  StyleSheet
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useContacts } from '../ContactsContext/ContactsContext';

const Adding_Emergency_Contacts = ({ navigation }) => {
  const { addEmergencyContacts } = useContacts();
  const [contacts, setContacts] = useState([
    { name: '', phone: '', relationship: '' }
  ]);

  const relationshipOptions = [
    'Parent',
    'Sibling',
    'Spouse',
    'Friend',
    'Colleague',
    'Other'
  ];

  // Update a specific field of a contact
  const updateContact = (index, field, value) => {
    const updatedContacts = [...contacts];
    updatedContacts[index][field] = value;
    setContacts(updatedContacts);
  };

  // Add a new empty contact form
  const addContact = () => {
    setContacts([...contacts, { name: '', phone: '', relationship: '' }]);
  };

  // Remove a contact form
  const removeContact = (index) => {
    const updatedContacts = contacts.filter((_, i) => i !== index);
    setContacts(updatedContacts);
  };

  // Save contacts to context
  const handleSaveContacts = async () => {
    if (contacts.some(c => !c.name || !c.phone || !c.relationship)) {
      Alert.alert('Incomplete Information', 'Please fill out all contact fields.');
      return;
    }

    try {
      addEmergencyContacts(contacts);
      Alert.alert('Success', 'Emergency contacts saved successfully!');
      navigation.navigate('Add_Image');
    } catch (error) {
      console.error('Error saving contacts:', error);
      Alert.alert('Error', 'Failed to save contacts.');
    }
  };

  // Skip to next page
  const handleSkip = () => {
    navigation.navigate('Add_Image');
  };

  // Function to render each contact input card
  const renderContactField = (contact, index) => (
    <View key={index} style={styles.contactCard}>
      <View style={styles.contactHeader}>
        <Text style={styles.contactNumber}>Contact {index + 1}</Text>
        {contacts.length > 1 && (
          <TouchableOpacity onPress={() => removeContact(index)} style={styles.removeButton}>
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>

      <TextInput
        placeholder="Full Name"
        value={contact.name}
        onChangeText={(text) => updateContact(index, 'name', text)}
        style={styles.input}
      />

      <TextInput
        placeholder="Phone Number"
        value={contact.phone}
        onChangeText={(text) => updateContact(index, 'phone', text)}
        keyboardType="phone-pad"
        style={styles.input}
      />

      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Relationship</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={contact.relationship}
            onValueChange={(value) => updateContact(index, 'relationship', value)}
            style={styles.picker}
          >
            {relationshipOptions.map((option, i) => (
              <Picker.Item key={i} label={option} value={option} />
            ))}
          </Picker>
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text style={styles.title}>Add Emergency Contacts</Text>

        {contacts.map((contact, index) => renderContactField(contact, index))}

        <TouchableOpacity style={styles.addButton} onPress={addContact}>
          <Text style={styles.addButtonText}>+ Add Another Contact</Text>
        </TouchableOpacity>

        <View style={styles.bottomButtonsContainer}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveContacts}>
            <Text style={styles.saveButtonText}>Save Contacts</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Adding_Emergency_Contacts;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAF2FB',
    padding: 20
  },
  scrollView: {
    paddingBottom: 60
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A3C6E',
    textAlign: 'center',
    marginBottom: 20
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  contactNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A3C6E'
  },
  removeButton: {
    backgroundColor: '#E74C3C',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: '600'
  },
  input: {
    borderWidth: 1,
    borderColor: '#B0C4DE',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    fontSize: 16
  },
  pickerContainer: {
    marginBottom: 10
  },
  pickerLabel: {
    color: '#1A3C6E',
    fontWeight: '600',
    marginBottom: 5
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#B0C4DE',
    borderRadius: 10
  },
  picker: {
    height: 45,
    width: '100%'
  },
  addButton: {
    backgroundColor: '#2C5AA0',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  bottomButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10
  },
  saveButton: {
    backgroundColor: '#1A3C6E',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginLeft: 10
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700'
  },
  skipButton: {
    backgroundColor: 'transparent',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginRight: 10
  },
  skipButtonText: {
    color: '#1A3C6E',
    fontSize: 16,
    fontWeight: '600'
  }
});