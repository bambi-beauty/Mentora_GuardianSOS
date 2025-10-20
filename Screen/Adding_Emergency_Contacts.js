import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useUser } from '../Users/useContext';

export default function EmergencyContacts({ navigation }) {
  const [showInputs, setShowInputs] = useState(false);

  const [contact1Name, setContact1Name] = useState('');
  const [contact1Number, setContact1Number] = useState('');
  const [contact1Relationship, setContact1Relationship] = useState('');

  const [contact2Name, setContact2Name] = useState('');
  const [contact2Number, setContact2Number] = useState('');
  const [contact2Relationship, setContact2Relationship] = useState('');

  const { user, addContacts } = useUser();

  const skip = () => {
    navigation.navigate('Add_Image');
  };

  const handleYes = () => {
    setShowInputs(true);
  };

  const saveContacts = async () => {
    if (!contact1Name || !contact1Number || !contact2Name || !contact2Number) {
      Alert.alert('Missing Info', 'Please fill in both names and numbers');
      return;
    }

    const userId = user?._id;
    if (!userId) {
      Alert.alert('User Error', 'User ID is missing.');
      return;
    }

    const contacts = [
      {
        name: contact1Name.trim(),
        phoneNumber: contact1Number.trim(),
        relationship: contact1Relationship.trim() || '',
      },
      {
        name: contact2Name.trim(),
        phoneNumber: contact2Number.trim(),
        relationship: contact2Relationship.trim() || '',
      }
    ];

    try {
      await addContacts(userId, contacts);
      Alert.alert('Success', 'Emergency contacts saved!');
      navigation.navigate('Add_Image');
    } catch (error) {
      console.error('Error saving contacts:', error.message);
      Alert.alert('Error', error.message || 'Failed to save contacts');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header */}
          <View style={styles.topSection}>
            <Text style={styles.brand}>GuardianSOS</Text>
            <Text style={styles.tagline}>Your safety, our priority</Text>
          </View>

          {/* Main Content */}
          <View style={styles.content}>
            <Image
              source={require('../assets/bg.png')}
              style={styles.image}
              resizeMode="contain"
            />

            <Text style={styles.title}>Add Emergency Contacts</Text>
            <Text style={styles.subtitle}>
              Do you want to add at least 2 emergency contacts?
            </Text>

            {/* Show Yes/Skip buttons only if inputs not visible */}
            {!showInputs && (
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.button} onPress={handleYes}>
                  <Text style={styles.buttonText}>Yes</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={skip}>
                  <Text style={styles.buttonText}>Skip</Text>
                </TouchableOpacity>
              </View>
            )}

            {showInputs && (
              <View style={styles.inputsContainer}>
                {/* Contact 1 */}
                <Text style={styles.label}>Contact 1 Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Name"
                  value={contact1Name}
                  onChangeText={setContact1Name}
                />

                <Text style={styles.label}>Contact 1 Relationship</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={contact1Relationship}
                    onValueChange={(itemValue) => setContact1Relationship(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="-- Select Relationship --" value="" />
                    <Picker.Item label="Parent" value="Parent" />
                    <Picker.Item label="Sibling" value="Sibling" />
                    <Picker.Item label="Friend" value="Friend" />
                    <Picker.Item label="Spouse" value="Spouse" />
                    <Picker.Item label="Guardian" value="Guardian" />
                  </Picker>
                </View>

                <Text style={styles.label}>Contact 1 Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Phone Number"
                  keyboardType="phone-pad"
                  value={contact1Number}
                  onChangeText={setContact1Number}
                />

                {/* Contact 2 */}
                <Text style={styles.label}>Contact 2 Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Name"
                  value={contact2Name}
                  onChangeText={setContact2Name}
                />

                <Text style={styles.label}>Contact 2 Relationship</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={contact2Relationship}
                    onValueChange={(itemValue) => setContact2Relationship(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="-- Select Relationship --" value="" />
                    <Picker.Item label="Parent" value="Parent" />
                    <Picker.Item label="Sibling" value="Sibling" />
                    <Picker.Item label="Friend" value="Friend" />
                    <Picker.Item label="Spouse" value="Spouse" />
                    <Picker.Item label="Guardian" value="Guardian" />
                  </Picker>
                </View>

                <Text style={styles.label}>Contact 2 Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Phone Number"
                  keyboardType="phone-pad"
                  value={contact2Number}
                  onChangeText={setContact2Number}
                />

                <TouchableOpacity style={styles.submitButton} onPress={saveContacts}>
                  <Text style={styles.submitButtonText}>Save Contacts</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  topSection: {
    minHeight: 180,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
    paddingTop: 40,
  },
  brand: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  tagline: {
    fontSize: 16,
    color: '#fff',
  },
  content: {
    padding: 20,
  },
  image: {
    width: '100%',
    height: 200,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#000',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  inputsContainer: {
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 6,
    marginTop: 5,
  },
  submitButton: {
    backgroundColor: '#007BFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
});
