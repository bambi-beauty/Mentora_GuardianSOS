import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";

import { useUser } from "../Users/useContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function EditProfileScreen({ navigation }) {
  const { user } = useUser();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phoneNumber || "");

  const [loading, setLoading] = useState(true);

  // Location state
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [streets, setStreets] = useState([]);

  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedStreet, setSelectedStreet] = useState("");

  const [locationLoading, setLocationLoading] = useState({
    countries: false,
    states: false,
    cities: false,
    streets: false,
  });

  const API_BASE_URL = "https://getlocations.onrender.com";

  useEffect(() => {
    let isMounted = true;

    const loadUserData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");

        if (storedUser && isMounted) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser?.location?.country) setSelectedCountry(parsedUser.location.country);
          if (parsedUser?.location?.state) setSelectedState(parsedUser.location.state);
          if (parsedUser?.location?.city) setSelectedCity(parsedUser.location.city);
          if (parsedUser?.location?.street) setSelectedStreet(parsedUser.location.street);
        }
      } catch (err) {
        console.error("Failed to load user from storage", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadUserData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch countries once
  useEffect(() => {
    fetchCountries();
  }, []);

  // Fetch dependent states
  useEffect(() => {
    if (selectedCountry) {
      fetchStates(selectedCountry);
    }
  }, [selectedCountry]);

  // Fetch cities
  useEffect(() => {
    if (selectedCountry && selectedState) {
      fetchCities(selectedCountry, selectedState);
    }
  }, [selectedState]);

  // Fetch streets
  useEffect(() => {
    if (selectedCountry && selectedCity) {
      fetchStreets(selectedCountry, selectedCity);
    }
  }, [selectedCity]);

  // Fetch functions
  const fetchCountries = async () => {
    setLocationLoading((prev) => ({ ...prev, countries: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/countries`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.countries || [];
      setCountries(list);
    } catch (err) {
      console.error("Fetch countries error:", err);
    } finally {
      setLocationLoading((prev) => ({ ...prev, countries: false }));
    }
  };

  const fetchStates = async (country) => {
    setLocationLoading((prev) => ({ ...prev, states: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/states?country=${encodeURIComponent(country)}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.states || [];
      setStates(list);
      setSelectedState("");
      setSelectedCity("");
      setSelectedStreet("");
      setCities([]);
      setStreets([]);
    } catch (err) {
      console.error("Fetch states error:", err);
    } finally {
      setLocationLoading((prev) => ({ ...prev, states: false }));
    }
  };

  const fetchCities = async (country, state) => {
    setLocationLoading((prev) => ({ ...prev, cities: true }));
    try {
      const res = await fetch(
        `${API_BASE_URL}/cities?country=${encodeURIComponent(country)}&state=${encodeURIComponent(state)}`
      );
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.cities || [];
      setCities(list);
    } catch (err) {
      console.error("Fetch cities error:", err);
    } finally {
      setLocationLoading((prev) => ({ ...prev, cities: false }));
    }
  };

  const fetchStreets = async (country, city) => {
    setLocationLoading((prev) => ({ ...prev, streets: true }));
    try {
      const res = await fetch(
        `${API_BASE_URL}/streets?country=${encodeURIComponent(country)}&city=${encodeURIComponent(city)}`
      );
      const data = await res.json();
      const list = data?.streets || [];
      setStreets(list);
    } catch (err) {
      console.error("Fetch streets error:", err);
    } finally {
      setLocationLoading((prev) => ({ ...prev, streets: false }));
    }
  };

  // Handle Save
  const handleSave = async () => {
    try {
      const userId = user?.uid || "user_123"; // Replace with real UID logic
      const userRef = doc(db, "users", userId);

      const location = {
        country: selectedCountry,
        state: selectedState,
        city: selectedCity,
        street: selectedStreet,
      };

      await setDoc(userRef, {
        name,
        email,
        phone,
        location,
      });

      Alert.alert("Success", "Profile updated.");
      navigation.goBack();
    } catch (error) {
      console.error("Error saving profile: ", error);
      Alert.alert("Error", "Could not save profile.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      <Text style={styles.label}>Full Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />

      <Text style={styles.label}>Phone</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

      <Text style={styles.sectionTitle}>Location</Text>

      {/* Country */}
      <Text style={styles.label}>Country</Text>
      <TextInput
        style={styles.input}
        value={selectedCountry}
        onChangeText={setSelectedCountry}
        placeholder="Select country"
      />
      {locationLoading.countries && <ActivityIndicator size="small" color="#999" />}

      {/* State */}
      <Text style={styles.label}>State</Text>
      <TextInput
        style={styles.input}
        value={selectedState}
        onChangeText={setSelectedState}
        placeholder="Select state"
      />
      {locationLoading.states && <ActivityIndicator size="small" color="#999" />}

      {/* City */}
      <Text style={styles.label}>City</Text>
      <TextInput
        style={styles.input}
        value={selectedCity}
        onChangeText={setSelectedCity}
        placeholder="Select city"
      />
      {locationLoading.cities && <ActivityIndicator size="small" color="#999" />}

      {/* Street */}
      <Text style={styles.label}>Street</Text>
      <TextInput
        style={styles.input}
        value={selectedStreet}
        onChangeText={setSelectedStreet}
        placeholder="Select street"
      />
      {locationLoading.streets && <ActivityIndicator size="small" color="#999" />}

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    marginTop: 10,
    color: "#555",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
  },
  saveButton: {
    backgroundColor: "#016bffff",
    marginTop: 30,
    padding: 15,
    borderRadius: 8,
  },
  saveButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
});
