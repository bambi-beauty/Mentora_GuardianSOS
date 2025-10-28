import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../Users/useContext"; // adjust path

export default function EditContactScreen({ navigation }) {
  const { user, updateUser } = useUser();
  const [contact, setContact] = useState(user?.phoneNumber || "");

  const handleSave = async () => {
    // ✅ Validate input
    if (!contact.trim()) return Alert.alert("Error", "Phone number cannot be empty");

    try {
      await updateUser({ phoneNumber: contact });
      Alert.alert("Success", "Profile updated!");
      navigation.goBack();
    } catch (err) {
      console.error("❌ Update failed:", err);
      Alert.alert("Error", "Failed to update profile");
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <StatusBar barStyle="light-content" backgroundColor="#2A5B8C" />
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back-outline" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Contact</Text>
        </View>
      </View>

      {/* BODY */}
      <View style={styles.body}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your phone number"
          placeholderTextColor="#999"
          value={contact}
          onChangeText={setContact}
          keyboardType="phone-pad"
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f8fc" },

  header: {
    backgroundColor: "#2A5B8C",
    paddingTop: (StatusBar.currentHeight || 40) + 5, 
    paddingBottom: 18,
    paddingHorizontal: 15,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 10,
  },

  body: { padding: 20 },
  label: { fontSize: 16, fontWeight: "600", color: "#000", marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#2A5B8C",
    borderRadius: 10,
    padding: 12,
    color: "#000",
    backgroundColor: "#fff",
    marginBottom: 30,
  },
  saveButton: {
    backgroundColor: "#2A5B8C",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
