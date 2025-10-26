import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import TermsModal from './TermsModal';
import Checkbox from 'expo-checkbox';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useUser } from '../Users/useContext';
import { formatPhoneNumber } from '../utils/formatPhoneNumber';
import { Picker } from '@react-native-picker/picker'; // Add this if you don't have it installed
import { useGoogleAuth } from '../Users/authFunctions';
import AsyncStorage from '@react-native-async-storage/async-storage';


const SignupScreen = ({ navigation }) => {
  const [isSelected, setSelection] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [cellphoneNum, setCellphoneNum] = useState('');
  const [loading, setLoading] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [showPasswordHint, setShowPasswordHint] = useState(false);
  const [passwordRules, setPasswordRules] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
  });

 const {
  signUp,
  countries,
  states,
  cities,
  streets,
  fetchCountries,
  fetchStates,
  fetchCities,
  fetchStreets,
  locationLoading,
  // Removed these to avoid naming conflicts:
  // setSelectedCountry,
  // setSelectedState,
  // setSelectedCity,
  // setSelectedStreet,
  setUser,  // Keep if you plan to update user context after signup
} = useUser();

// Local state for selected location in SignupScreen
const [selectedCountry, setSelectedCountry] = useState('');
const [selectedState, setSelectedState] = useState('');
const [selectedCity, setSelectedCity] = useState('');
const [selectedStreet, setSelectedStreet] = useState('');

// Text inputs for state, city, street + filtered suggestions
const [stateInput, setStateInput] = useState('');
const [filteredStates, setFilteredStates] = useState([]);

const [cityInput, setCityInput] = useState('');
const [filteredCities, setFilteredCities] = useState([]);

const [streetInput, setStreetInput] = useState('');
const [filteredStreets, setFilteredStreets] = useState([]);

useEffect(() => {
  fetchCountries();
}, []);

useEffect(() => {
  if (selectedCountry) {
    fetchStates(selectedCountry);
  }
  setSelectedState('');
  setStateInput('');
  setFilteredStates([]);
  setSelectedCity('');
  setCityInput('');
  setFilteredCities([]);
  setSelectedStreet('');
  setStreetInput('');
  setFilteredStreets([]);
}, [selectedCountry]);

useEffect(() => {
  if (selectedCountry && selectedState) {
    fetchCities(selectedCountry, selectedState);
  }
  setSelectedCity('');
  setCityInput('');
  setFilteredCities([]);
  setSelectedStreet('');
  setStreetInput('');
  setFilteredStreets([]);
}, [selectedState]);

useEffect(() => {
  if (selectedCountry && selectedCity) {
    fetchStreets(selectedCountry, selectedCity);
  }
  setSelectedStreet('');
  setStreetInput('');
  setFilteredStreets([]);
}, [selectedCity]);

// Filter states list based on stateInput
useEffect(() => {
  if (!stateInput) {
    setFilteredStates(states);
  } else {
    const filtered = states.filter((state) =>
      state.toLowerCase().includes(stateInput.toLowerCase())
    );
    setFilteredStates(filtered);
  }
}, [stateInput, states]);

// Filter cities list based on cityInput
useEffect(() => {
  if (!cityInput) {
    setFilteredCities(cities);
  } else {
    const filtered = cities.filter((city) =>
      city.toLowerCase().includes(cityInput.toLowerCase())
    );
    setFilteredCities(filtered);
  }
}, [cityInput, cities]);

// Filter streets list based on streetInput
useEffect(() => {
  if (!streetInput) {
    setFilteredStreets(streets);
  } else {
    const filtered = streets.filter((street) =>
      street.toLowerCase().includes(streetInput.toLowerCase())
    );
    setFilteredStreets(filtered);
  }
}, [streetInput, streets]);

  // Password validation rules
  useEffect(() => {
    const rules = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    setPasswordRules(rules);
  }, [password]);

  const isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const GoToNextPage = async () => {
  if (!name || !email || !cellphoneNum || !password) {
    Alert.alert('Please fill in all fields');
    return;
  }

  if (!isValidEmail(email)) {
    Alert.alert('Invalid Email', 'Please enter a valid email address');
    return;
  }

  if (!Object.values(passwordRules).every(Boolean)) {
    Alert.alert('Weak Password', 'Please follow the password requirements');
    return;
  }

  if (!isSelected) {
    Alert.alert('You must agree to the Terms of Service');
    return;
  }

  if (!selectedCountry) {
    Alert.alert('Please select your country');
    return;
  }

  if (selectedState && !states.includes(selectedState)) {
    Alert.alert('Invalid State', 'Please select a valid state from suggestions.');
    return;
  }

  if (selectedCity && !cities.includes(selectedCity)) {
    Alert.alert('Invalid City', 'Please select a valid city from suggestions.');
    return;
  }

  if (selectedStreet && !streets.includes(selectedStreet)) {
    Alert.alert('Invalid Street', 'Please select a valid street from suggestions.');
    return;
  }

  const formattedPhone = formatPhoneNumber(cellphoneNum);

  const location = {
    country: selectedCountry,
    state: selectedState || '',
    city: selectedCity || '',
    street: selectedStreet || '',
  };

  try {
    setLoading(true);
    await signUp(name, email, password, formattedPhone, isSelected, location);
    setLoading(false);

    // Save selected location to context
    setSelectedCountry(selectedCountry);
    setSelectedState(selectedState);
    setSelectedCity(selectedCity);
    setSelectedStreet(selectedStreet);

    // Save updated user (with location) to AsyncStorage and context
    const updatedUser = {
      name,
      email,
      phoneNumber: formattedPhone,
      location,
      agreeToTerms: isSelected,
      onboardingCompleted: false,
    };

    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);

    navigation.navigate('Email_Verification_Screen', { email });
  } catch (error) {
    setLoading(false);
    Alert.alert('Signup Error', error?.message || 'An unexpected error occurred. Please try again.');
  }
};

  const GoToLogin = () => {
    navigation.navigate('Login');
  };
 
useEffect(() => {
  console.log('Terms modal visibility:', termsModalVisible);
}, [termsModalVisible]);

 return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Blue Section */}
        <View style={styles.topSection}>
          <Text style={styles.brand}>GuardianSOS</Text>
          <Text style={styles.tagline}>Your safety, our priority</Text>
        </View>

        {/* Bottom Form Section */}
        <View style={styles.bottomSection}>
          {loading ? (
            <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
          ) : (
            <>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join GuardianSOS for enhanced safety</Text>

              {/* Form Fields */}
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                placeholderTextColor="#888"
              />

              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email address"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#888"
              />

              <Text style={styles.label}>Cellphone Number</Text>
              <TextInput
                style={styles.input}
                value={cellphoneNum}
                onChangeText={setCellphoneNum}
                placeholder="e.g. +27831234567"
                keyboardType="phone-pad"
                autoCapitalize="none"
                placeholderTextColor="#888"
              />
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password"
                  secureTextEntry={!passwordVisible}
                  value={password}
                  onChangeText={setPassword}
                  placeholderTextColor="#888"
                  onFocus={() => setShowPasswordHint(true)} 
                />
                <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
                  <Icon
                    name={passwordVisible ? 'eye' : 'eye-slash'}
                    size={20}
                    color="#666"
                    style={{ marginLeft: 10 }}
                  />
                </TouchableOpacity>
              </View>
              {/* Password Rules Hint */}
              {password.length > 0 && (
                <View style={styles.passwordHintContainer}>
                  <Text style={styles.passwordHintHeader}>Password must include:</Text>
                  {[
                    { label: 'At least 8 characters', key: 'length' },
                    { label: 'One uppercase letter (A-Z)', key: 'uppercase' },
                    { label: 'One lowercase letter (a-z)', key: 'lowercase' },
                    { label: 'One number (0-9)', key: 'number' },
                    { label: 'One special character (!@#$%^&*)', key: 'specialChar' },
                  ].map((rule) => (
                    <View style={styles.passwordRuleItem} key={rule.key}>
                      <Icon
                        name={passwordRules[rule.key] ? 'check' : 'close'}
                        size={14}
                        color={passwordRules[rule.key] ? 'green' : 'red'}
                        style={styles.ruleIcon}
                      />
                      <Text style={styles.passwordRuleText}>{rule.label}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Country Picker */}
               <View style={styles.pickerWrapper}>
                <Text style={styles.label}>Country</Text>
                {locationLoading.countries ? (
                  <ActivityIndicator size="small" color="#3b82f6" />
                ) : (
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={selectedCountry}
                      onValueChange={(itemValue) => setSelectedCountry(itemValue)}
                      mode="dropdown"
                      style={styles.picker}
                      dropdownIconColor="#3b82f6" // Android dropdown arrow color
                    >
                      <Picker.Item label="Select Country" value="" enabled={false} />
                      {countries.map((country) => (
                        <Picker.Item key={country} label={country} value={country} />
                      ))}
                    </Picker>
                  </View>
                )}
              </View>

              {/* State Input */}
              {selectedCountry && (
                <View style={styles.autocompleteContainer}>
                  <Text style={styles.label}>State/Province</Text>
                  {locationLoading.states ? (
                    <ActivityIndicator size="small" color="#3b82f6" />
                  ) : (
                    <>
                      <TextInput
                        style={styles.input}
                        placeholder="Type state"
                        value={stateInput}
                        onChangeText={(text) => {
                          setStateInput(text);
                          setSelectedState('');
                        }}
                        placeholderTextColor="#888"
                      />
                      {filteredStates.length > 0 && (
                        <ScrollView
                          style={styles.suggestionsContainer}
                          keyboardShouldPersistTaps="handled"
                        >
                          {filteredStates.map((state) => (
                            <TouchableOpacity
                              key={state}
                              onPress={() => {
                                setSelectedState(state);
                                setStateInput(state);
                              }}
                              style={styles.suggestionItem}
                            >
                              <Text>{state}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </>
                  )}
                </View>
              )}

              {/* City Input */}
              {selectedState && (
                <View style={styles.autocompleteContainer}>
                  <Text style={styles.label}>City</Text>
                  {locationLoading.cities ? (
                    <ActivityIndicator size="small" color="#3b82f6" />
                  ) : (
                    <>
                      <TextInput
                        style={styles.input}
                        placeholder="Type city"
                        value={cityInput}
                        onChangeText={(text) => {
                          setCityInput(text);
                          setSelectedCity('');
                        }}
                        placeholderTextColor="#888"
                      />
                      {filteredCities.length > 0 && (
                        <ScrollView
                          style={styles.suggestionsContainer}
                          keyboardShouldPersistTaps="handled"
                        >
                          {filteredCities.map((city) => (
                            <TouchableOpacity
                              key={city}
                              onPress={() => {
                                setSelectedCity(city);
                                setCityInput(city);
                              }}
                              style={styles.suggestionItem}
                            >
                              <Text>{city}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </>
                  )}
                </View>
              )}

              {/* Street Input (optional) */}
              {selectedCity && (
                <View style={styles.autocompleteContainer}>
                  <Text style={styles.label}>Street (optional)</Text>
                  {locationLoading.streets ? (
                    <ActivityIndicator size="small" color="#3b82f6" />
                  ) : (
                    <>
                      <TextInput
                        style={styles.input}
                        placeholder="Type street"
                        value={streetInput}
                        onChangeText={(text) => {
                          setStreetInput(text);
                          setSelectedStreet('');
                        }}
                        placeholderTextColor="#888"
                      />
                      {filteredStreets.length > 0 && (
                        <ScrollView
                          style={styles.suggestionsContainer}
                          keyboardShouldPersistTaps="handled"
                        >
                          {filteredStreets.map((street) => (
                            <TouchableOpacity
                              key={street}
                              onPress={() => {
                                setSelectedStreet(street);
                                setStreetInput(street);
                              }}
                              style={styles.suggestionItem}
                            >
                              <Text>{street}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </>
                  )}
                </View>
              )}

              {/* Terms Checkbox */}
              <View style={styles.checkboxContainer}>
                <Checkbox
                  value={isSelected}
                  onValueChange={setSelection}
                  color={isSelected ? '#3b82f6' : undefined}
                />
                <Text style={styles.checkboxLabel}>
                  I agree to the{' '}
                  <Text style={styles.linkText} onPress={() => {
                    console.log('Terms link clicked');
                    setTermsModalVisible(true);
                  }}>
                    Terms of Service
                  </Text>

                </Text>
              </View>

              {/* Sign Up Button */}
              <TouchableOpacity style={styles.signInButton} onPress={GoToNextPage}>
                <Text style={styles.buttonText}>Sign Up</Text>
              </TouchableOpacity>

              {/* Login Link */}
              <TouchableOpacity onPress={GoToLogin} style={styles.loginLinkContainer}>
                <Text style={styles.loginText}>Already have an account? Login</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        
        
      </ScrollView>
      <TermsModal 
          visible={termsModalVisible}
          onClose={() => setTermsModalVisible(false)}
        />
    </KeyboardAvoidingView>
  );
};
const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "#F3F4F6",
  },

  topSection: {
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 70,
    borderBottomLeftRadius: 80,
    borderBottomRightRadius: 80,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  brand: {
    fontSize: 34,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: "#dbeafe",
    marginTop: 6,
    fontWeight: "400",
  },

  bottomSection: {
    flex: 1,
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: -50,
    borderRadius: 24,
    padding: 24,
    paddingBottom: 60,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
  },

  label: {
    fontSize: 15,
    color: "#374151",
    marginBottom: 6,
    marginTop: 12,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    color: "#111827",
    backgroundColor: "#F9FAFB",
    fontSize: 15,
    marginBottom: 14,
  },

  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    paddingVertical: 12,
  },

  passwordHintContainer: {
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  passwordHintHeader: {
    fontWeight: "600",
    fontSize: 14,
    color: "#1E3A8A",
    marginBottom: 6,
  },
  passwordRuleItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  ruleIcon: {
    marginRight: 6,
  },
  passwordRuleText: {
    fontSize: 13,
    color: "#1E40AF",
  },

  pickerWrapper: {
    marginTop: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
  },
  picker: {
    width: "100%",
    color: "#111827",
  },

  autocompleteContainer: {
    position: "relative",
    marginBottom: 12,
  },
  suggestionsContainer: {
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    backgroundColor: "#fff",
    marginTop: -10,
    paddingHorizontal: 6,
    elevation: 2,
  },
  suggestionItem: {
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },

  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
  },
  checkboxLabel: {
    marginLeft: 10,
    fontSize: 14,
    color: "#374151",
  },
  linkText: {
    color: "#2563EB",
    fontWeight: "600",
    textDecorationLine: "underline",
  },

  signInButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    elevation: 3,
    shadowColor: "#2563EB",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  loginLinkContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  loginText: {
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "600",
  },

  socialButtonLight: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  socialButtonDark: {
    backgroundColor: "#000",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  socialButtonBlue: {
    backgroundColor: "#1877F2",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  socialTextLight: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginLeft: 8,
  },
  socialText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 8,
  },
});


// const styles = StyleSheet.create({
//   scrollContainer: {
//     flexGrow: 1,
//     backgroundColor: '#fff',
//   },
//   topSection: {
//     backgroundColor: '#3b82f6',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 40,
//     borderBottomLeftRadius: 100,
//     borderBottomRightRadius: 100,
//     marginTop: 28,
//   },
//   brand: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#fff',
//     marginBottom: 8,
//   },
//   tagline: {
//     fontSize: 16,
//     color: '#e0f2fe',
//   },
//   bottomSection: {
//     padding: 24,
//     paddingBottom: 60,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: '600',
//     color: '#111',
//     marginBottom: 4,
//     textAlign: 'center',
//   },
//   subtitle: {
//     fontSize: 14,
//     color: '#555',
//     marginBottom: 24,
//     textAlign: 'center',
//   },
//   label: {
//     fontSize: 14,
//     color: '#444',
//     marginBottom: 6,
//     marginTop: 10,
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#ccc',
//     borderRadius: 10,
//     padding: 12,
//     marginBottom: 16,
//     color: '#000',
//   },

//   passwordInputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#ccc',
//     borderRadius: 10,
//     paddingHorizontal: 12,
//     marginBottom: 16,
//   },
//   passwordInput: {
//     flex: 1,
//     paddingVertical: 12,
//     color: '#000',
//   },

//   // Social Buttons
//   socialButtonLight: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//     borderColor: '#ddd',
//     borderWidth: 1,
//     borderRadius: 8,
//     paddingVertical: 12,
//     paddingHorizontal: 20,
//     marginBottom: 12,
//     justifyContent: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   socialButtonDark: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#000',
//     borderRadius: 8,
//     paddingVertical: 12,
//     paddingHorizontal: 20,
//     marginBottom: 12,
//     justifyContent: 'center',
//     elevation: 2,
//   },
//   socialButtonBlue: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#1877F2',
//     borderRadius: 8,
//     paddingVertical: 12,
//     paddingHorizontal: 20,
//     marginBottom: 24,
//     justifyContent: 'center',
//     elevation: 2,
//   },
//   buttonContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   socialText: {
//     fontSize: 16,
//     color: '#fff',
//     marginLeft: 10,
//     fontWeight: '500',
//   },
//   socialTextLight: {
//     fontSize: 16,
//     color: '#000',
//     marginLeft: 10,
//     fontWeight: '500',
//   },

//   // Password Rules Hint
//   passwordHintContainer: {
//     marginBottom: 16,
//     backgroundColor: '#f3f4f6',
//     borderRadius: 8,
//     padding: 12,
//   },
//   passwordHintHeader: {
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 8,
//   },
//   passwordRuleItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 4,
//   },
//   ruleIcon: {
//     marginRight: 8,
//   },
//   passwordRuleText: {
//     fontSize: 13,
//     color: '#555',
//   },

//   pickerWrapper: {
//     marginBottom: 16,
//   },
//   pickerContainer: {
//     borderWidth: 1,
//     borderColor: '#ccc',
//     borderRadius: 10,
//     overflow: 'hidden',
//   },
//   pickerAndroid: {
//     height: 40,
//     color: '#000',
//   },
//   pickerIOS: {
//     height: 150,
//     color: '#000',
//   },

//   autocompleteContainer: {
//     marginBottom: 16,
//   },
//   suggestionsContainer: {
//     maxHeight: 100,
//     borderWidth: 1,
//     borderColor: '#ccc',
//     borderRadius: 10,
//     backgroundColor: '#fff',
//   },
//   suggestionItem: {
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },

//   checkboxContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   checkboxLabel: {
//     marginLeft: 8,
//     color: '#000',
//     fontSize: 14,
//   },
//   linkText: {
//     color: '#3b82f6',
//     fontWeight: '600',
//   },

//   signInButton: {
//     backgroundColor: '#3b82f6',
//     padding: 14,
//     borderRadius: 10,
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },

//   loginLinkContainer: {
//     alignItems: 'center',
//     marginTop: 10,
//   },
//   loginText: {
//     color: '#3b82f6',
//     fontWeight: '600',
//     fontSize: 14,
//   },
// });

 export default SignupScreen;