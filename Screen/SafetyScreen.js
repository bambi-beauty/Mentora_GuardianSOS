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
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";
import { useUser } from "../Users/useContext";

export default function SafetyScreen() {
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
        // Update contact in backend
        await updateContacts(editingContactId, contactData);

        // Update in local state
        setContacts((prev) =>
          prev.map((contact) =>
            contact.id === editingContactId
              ? { ...contact, ...contactData }
              : contact
          )
        );
        Alert.alert("Success", "Contact updated successfully.");
      } else {
      
        const created = await addContacts(
          contactData.name,
          contactData.lastname,
          contactData.phoneNumber
        );

      
        setContacts((prev) => [
          ...prev,
          {
            id: Date.now().toString(), 
            ...contactData,
          },
        ]);

        Alert.alert("Success", "Contact added successfully.");
      }

      resetForm();
      setModalVisible(false);
    } catch (error) {
      console.error("Contact save error:", error);
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
    if (success) {
      setContacts((prev) => prev.filter((contact) => contact.id !== id));
    }
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

      if (!contact) return;

      const phones = contact.phoneNumbers;
      if (!phones || phones.length === 0) {
        Alert.alert("No Phone Number", "Selected contact has no phone number.");
        return;
      }

      const imported = {
        id: contact.id || Date.now().toString(),
        firstName: contact.firstName || "",
        lastName: contact.lastName || "",
        phoneNumber: phones[0].number,
      };

      setContacts([...contacts, imported]);
    } catch (error) {
      console.log("Error picking contact: ", error);
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

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Safety</Text>
      <Text style={styles.subHeading}>
        Add trusted contacts who can be reached in case of emergency.
      </Text>

      <TouchableOpacity
        style={styles.openFormButton}
        onPress={() => {
          resetForm();
          setModalVisible(true);
        }}
      >
        <Ionicons name="add-circle" size={28} color="#2171B5" />
        <Text style={styles.openFormText}>Add Contact Manually</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.importBtn} onPress={pickContact}>
        <Ionicons name="person-add-outline" size={24} color="#2171B5" />
        <Text style={styles.importBtnText}>Import from Phone</Text>
      </TouchableOpacity>

      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.contactCard}>
            <Ionicons name="person-circle" size={28} color="#2171B5" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.contactText}>
                {item.firstName || item.name} {item.lastName || item.lastname}
              </Text>
              <Text style={styles.phoneText}>{item.phoneNumber}</Text>
            </View>

            <TouchableOpacity style={styles.pencil} onPress={() => editContact(item)}>
              <Ionicons name="pencil" size={24} color="blue" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => removeContact(item.id)}>
              <Ionicons name="trash" size={24} color="red" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No trusted contacts added yet</Text>
        }
      />

      {/* Modal for manual add/edit */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingContactId ? "Edit Contact" : "Add New Contact"}
            </Text>

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
                <Text style={styles.buttonText}>
                  {editingContactId ? "Update" : "Save"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  resetForm();
                  setModalVisible(false);
                }}
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
  container: {
    flex: 1,
    backgroundColor: "#EFF3FF",
    padding: 20,
    marginTop: Platform.OS === "android" ? 30 : 0,
  },
  heading: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#2171B5",
    marginBottom: 5,
  },
  subHeading: {
    fontSize: 14,
    color: "#555",
    marginBottom: 20,
  },
  openFormButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  openFormText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#2171B5",
  },
  importBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  importBtnText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#2171B5",
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contactText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  phoneText: {
    fontSize: 14,
    color: "#777",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 14,
    color: "#777",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "85%",
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2171B5",
    marginBottom: 15,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 15,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  saveButton: {
    backgroundColor: "#2171B5",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: "#aaa",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  pencil:{
    marginRight:20
  }
});
