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
  StyleSheet,
  Animated,
  Dimensions
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useUser } from '../Users/useContext';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const Adding_Emergency_Contacts = ({ navigation }) => {
  const { user, addContacts, completeOnboardingStep } = useUser();
  const [contacts, setContacts] = useState([
    { name: '', phoneNumber: '', relationship: '' }
  ]);
  const [saving, setSaving] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const relationshipOptions = [
    'Parent',
    'Sibling',
    'Spouse',
    'Friend',
    'Colleague',
    'Other'
  ];

  const updateContact = (index, field, value) => {
    const updatedContacts = [...contacts];
    updatedContacts[index][field] = value;
    setContacts(updatedContacts);
  };

  const addContact = () => {
    setContacts([...contacts, { name: '', phoneNumber: '', relationship: '' }]);
  };

  const removeContact = (index) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      const updatedContacts = contacts.filter((_, i) => i !== index);
      setContacts(updatedContacts);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleSaveContacts = async () => {
    // Validate contacts - now checking for phoneNumber instead of phone
    const validContacts = contacts.filter(c => c.name && c.phoneNumber && c.relationship);
    
    if (validContacts.length === 0) {
      Alert.alert('No Contacts', 'Please add at least one emergency contact with all fields filled.');
      return;
    }

    // Check for partially filled contacts
    const hasPartialContacts = contacts.some(c => 
      (!c.name || !c.phoneNumber || !c.relationship) && 
      (c.name || c.phoneNumber || c.relationship)
    );

    if (hasPartialContacts) {
      Alert.alert('Incomplete Information', 'Please fill out all fields for each contact or remove incomplete ones.');
      return;
    }

    if (!user?._id) {
      Alert.alert('Error', 'User not found. Please try logging in again.');
      return;
    }

    setSaving(true);
    try {
      console.log('📞 Saving emergency contacts:', validContacts);
      
      // The contacts are already in the correct format with phoneNumber field
      const result = await addContacts(user._id, validContacts);
      
      if (result) {
        console.log('✅ Contacts saved successfully');
        await completeOnboardingStep('emergency_contacts', { contacts: validContacts });
        
        Alert.alert('Success', 'Emergency contacts saved successfully!', [
          {
            text: 'Continue',
            onPress: () => navigation.navigate('Add_Image')
          }
        ]);
      } else {
        throw new Error('Failed to save contacts');
      }
    } catch (error) {
      console.error('❌ Error saving contacts:', error);
      Alert.alert('Error', error.message || 'Failed to save contacts. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    navigation.navigate('Add_Image');
  };

  const renderContactField = (contact, index) => (
    <Animated.View 
      key={index} 
      style={[
        styles.contactCard,
        {
          opacity: fadeAnim,
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            }),
          }],
        },
      ]}
    >
      <View style={styles.contactHeader}>
        <View style={styles.contactNumberContainer}>
          <View style={styles.contactIcon}>
            <Icon name="contact-phone" size={20} color="#1A3C6E" />
          </View>
          <Text style={styles.contactNumber}>Emergency Contact {index + 1}</Text>
        </View>
        {contacts.length > 1 && (
          <TouchableOpacity 
            onPress={() => removeContact(index)} 
            style={styles.removeButton}
          >
            <Icon name="delete-outline" size={20} color="#E74C3C" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Icon name="person-outline" size={20} color="#666" style={styles.inputIcon} />
        <TextInput
          placeholder="Full Name"
          placeholderTextColor="#999"
          value={contact.name}
          onChangeText={(text) => updateContact(index, 'name', text)}
          style={styles.input}
        />
      </View>

      <View style={styles.inputContainer}>
        <Icon name="phone-iphone" size={20} color="#666" style={styles.inputIcon} />
        <TextInput
          placeholder="Phone Number"
          placeholderTextColor="#999"
          value={contact.phoneNumber}
          onChangeText={(text) => updateContact(index, 'phoneNumber', text)}
          keyboardType="phone-pad"
          style={styles.input}
        />
      </View>

      <View style={styles.pickerContainer}>
        <View style={styles.pickerLabelContainer}>
          <Icon name="relationship" size={20} color="#666" />
          <Text style={styles.pickerLabel}>Relationship</Text>
        </View>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={contact.relationship}
            onValueChange={(value) => updateContact(index, 'relationship', value)}
            style={styles.picker}
            dropdownIconColor="#1A3C6E"
          >
            <Picker.Item label="Select Relationship" value="" color="#999" />
            {relationshipOptions.map((option, i) => (
              <Picker.Item key={i} label={option} value={option} color="#333" />
            ))}
          </Picker>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <LinearGradient
      colors={['#EAF2FB', '#F8FBFF', '#FFFFFF']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#1A3C6E', '#2C5AA0']}
                style={styles.headerIcon}
              >
                <Icon name="emergency" size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Emergency Contacts</Text>
            <Text style={styles.subtitle}>
              Add trusted contacts who can be notified in case of emergencies
            </Text>
          </View>

          {/* Contacts List */}
          <View style={styles.contactsSection}>
            {contacts.map((contact, index) => renderContactField(contact, index))}
          </View>

          {/* Add Contact Button */}
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={addContact}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#2C5AA0', '#1A3C6E']}
              style={styles.addButtonGradient}
            >
              <Icon name="add-circle-outline" size={24} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add Another Contact</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.bottomButtonsContainer}>
            <TouchableOpacity 
              style={styles.skipButton} 
              onPress={handleSkip}
              disabled={saving}
              activeOpacity={0.7}
            >
              <Text style={styles.skipButtonText}>Skip for Now</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.saveButton,
                saving && styles.saveButtonDisabled
              ]} 
              onPress={handleSaveContacts}
              disabled={saving}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={saving ? ['#B0C4DE', '#A0B4CE'] : ['#1A3C6E', '#0D2C5A']}
                style={styles.saveButtonGradient}
              >
                {saving ? (
                  <Icon name="hourglass-empty" size={20} color="#FFFFFF" />
                ) : (
                  <Icon name="save" size={20} color="#FFFFFF" />
                )}
                <Text style={styles.saveButtonText}>
                  {saving ? 'Saving...' : 'Save Contacts'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '33%' }]} />
            </View>
            <Text style={styles.progressText}>Step 2 of 3</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default Adding_Emergency_Contacts;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    padding: 25,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  iconContainer: {
    marginBottom: 15,
  },
  headerIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1A3C6E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A3C6E',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '90%',
    fontWeight: '500',
  },
  contactsSection: {
    marginBottom: 20,
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#1A3C6E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2C5AA0',
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  contactNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAF2FB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A3C6E',
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFE6E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FBFF',
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E1E8F0',
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  pickerContainer: {
    marginBottom: 5,
  },
  pickerLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  pickerLabel: {
    color: '#1A3C6E',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#E1E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FBFF',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#333',
  },
  addButton: {
    borderRadius: 16,
    marginVertical: 10,
    shadowColor: '#2C5AA0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 8,
  },
  bottomButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 15,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#1A3C6E',
    marginRight: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#1A3C6E',
    fontSize: 16,
    fontWeight: '700',
  },
  saveButton: {
    flex: 1.5,
    borderRadius: 16,
    shadowColor: '#1A3C6E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    marginLeft: 12,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  saveButtonDisabled: {
    shadowOpacity: 0.2,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginLeft: 8,
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E1E8F0',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2C5AA0',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
});