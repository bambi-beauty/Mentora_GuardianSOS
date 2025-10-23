import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  StatusBar,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";
import { useUser } from "../Users/useContext";

export default function SafetyScreen({ navigation }) {
  const [contacts, setContacts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [editingContactId, setEditingContactId] = useState(null);

  const { addContacts, updateContacts, deleteContact } = useUser();

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setPhoneNumber("");
    setEditingContactId(null);
  };

  const saveContactManually = async () => {
    if (!firstName.trim() || !lastName.trim() || !phoneNumber.trim()) {
      Alert.alert("Missing Fields", "Please fill in all fields.");
      return;
    }

    const contactData = {
      name: firstName.trim(),
      lastname: lastName.trim(),
      phoneNumber: phoneNumber.trim(),
    };

    try {
      if (editingContactId) {
        await updateContacts(editingContactId, contactData);
        setContacts((prev) =>
          prev.map((c) => (c.id === editingContactId ? { ...c, ...contactData } : c))
        );
        Alert.alert("Success", "Contact updated successfully.");
      } else {
        await addContacts(contactData.name, contactData.lastname, contactData.phoneNumber);
        setContacts((prev) => [...prev, { id: Date.now().toString(), ...contactData }]);
        Alert.alert("Success", "Contact added successfully.");
      }
      resetForm();
      setModalVisible(false);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Something went wrong. Try again.");
    }
  };

  const removeContact = async (id) => {
    const confirmed = await new Promise((resolve) => {
      Alert.alert("Confirm Delete", "Are you sure you want to delete this contact?", [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        { text: "Delete", style: "destructive", onPress: () => resolve(true) },
      ]);
    });

    if (!confirmed) return;
    const success = await deleteContact(id);
    if (success) setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const pickContact = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Need contacts access to pick a contact");
      return;
    }

    try {
      const contact = await Contacts.presentContactPickerAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });
      if (!contact || !contact.phoneNumbers?.length) {
        Alert.alert("No Phone Number", "Selected contact has no phone number.");
        return;
      }
      setContacts((prev) => [
        ...prev,
        {
          id: contact.id || Date.now().toString(),
          firstName: contact.firstName || "",
          lastName: contact.lastName || "",
          phoneNumber: contact.phoneNumbers[0].number,
        },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not pick contact.");
    }
  };

  const editContact = (contact) => {
    setFirstName(contact.name || contact.firstName);
    setLastName(contact.lastname || contact.lastName);
    setPhoneNumber(contact.phoneNumber);
    setEditingContactId(contact.id);
    setModalVisible(true);
  };

  const renderContactItem = ({ item }) => (
    <View style={styles.contactCard}>
      <Ionicons name="person-circle" size={36} color="#2A5B8C" />
      <View style={styles.contactInfo}>
        <Text style={styles.contactText}>
          {item.firstName || item.name} {item.lastName || item.lastname}
        </Text>
        <Text style={styles.phoneText}>{item.phoneNumber}</Text>
      </View>
      <View style={styles.contactActions}>
        <TouchableOpacity onPress={() => editContact(item)}>
          <Ionicons name="pencil" size={24} color="#2A5B8C" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => removeContact(item.id)} style={{ marginLeft: 15 }}>
          <Ionicons name="trash" size={24} color="#FF5C5C" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <StatusBar barStyle="light-content" backgroundColor="#2A5B8C" />
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back-outline" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Safety</Text>
        </View>
      </View>

      {/* BODY */}
      <Text style={styles.subHeading}>
        Add trusted contacts who can be reached in case of emergency.
      </Text>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.button} onPress={() => { resetForm(); setModalVisible(true); }}>
          <Ionicons name="add-circle" size={28} color="#fff" />
          <Text style={styles.buttonText}>Add Contact Manually</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.importButton]} onPress={pickContact}>
          <Ionicons name="person-add-outline" size={24} color="#fff" />
          <Text style={styles.buttonText}>Import from Phone</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderContactItem}
        ListEmptyComponent={<Text style={styles.emptyText}>No trusted contacts added yet</Text>}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* MODAL */}
      <Modal animationType="slide" transparent visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingContactId ? "Edit Contact" : "Add New Contact"}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="First Name"
              value={firstName}
              onChangeText={setFirstName}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Last Name"
              value={lastName}
              onChangeText={setLastName}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.saveButton} onPress={saveContactManually}>
                <Text style={styles.buttonText}>{editingContactId ? "Update" : "Save"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => { resetForm(); setModalVisible(false); }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EFF3FF", padding: 20, marginTop: Platform.OS === "android" ? 30 : 0 },
  header: { backgroundColor: "#2A5B8C", paddingTop: (Platform.OS === "android" ? StatusBar.currentHeight || 40 : 20) + 5, paddingBottom: 18, paddingHorizontal: 15, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, marginBottom: 15 },
  headerContent: { flexDirection: "row", alignItems: "center" },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#fff", marginLeft: 10 },
  subHeading: { fontSize: 14, color: "#555", marginBottom: 20 },
  actionButtons: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  button: { flexDirection: "row", alignItems: "center", backgroundColor: "#2A5B8C", paddingVertical: 12, paddingHorizontal: 15, borderRadius: 10, flex: 1, justifyContent: "center" },
  importButton: { marginLeft: 10 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16, marginLeft: 8 },
  contactCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 12, borderRadius: 12, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  contactInfo: { flex: 1, marginLeft: 10 },
  contactText: { fontSize: 16, fontWeight: "600", color: "#333" },
  phoneText: { fontSize: 14, color: "#777" },
  contactActions: { flexDirection: "row", alignItems: "center" },
  emptyText: { textAlign: "center", marginTop: 50, fontSize: 14, color: "#777" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", borderRadius: 12, padding: 20, width: "85%", elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#2A5B8C", marginBottom: 15, textAlign: "center" },
  modalInput: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 15 },
  modalButtons: { flexDirection: "row", justifyContent: "space-between" },
  saveButton: { backgroundColor: "#2A5B8C", paddingVertical: 12, paddingHorizontal: 25, borderRadius: 10 },
  cancelButton: { backgroundColor: "#aaa", paddingVertical: 12, paddingHorizontal: 25, borderRadius: 10 },
});

