import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../Users/useContext";

export default function ProfileDetailsScreen({ navigation }) {
  const { user } = useUser();

  const handleEditName = () => navigation.navigate("EditNameScreen");
  const handleEditContact = () => navigation.navigate("EditContactScreen");
  const handleEditEmail = () => navigation.navigate("EditEmailScreen");

  return (
    <ScrollView style={styles.container}>
      {/* BLUE HEADER */}
      <View style={styles.header}>
        <StatusBar barStyle="light-content" backgroundColor="#2A5B8C" />
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Personal info</Text>
        </View>
      </View>

      {/* Avatar Section */}
      <View style={styles.profileCard}>
        <View style={styles.avatarPlaceholder}>
          <TouchableOpacity style={styles.addIcon}>
            <Ionicons name="add" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.addPhotoText}>
          Add a profile photo so responders can recognise you
        </Text>
        <Text style={styles.photoHelpText}>
          When can someone see my photo?
        </Text>
      </View>

      {/* Personal Info Section */}
      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Ionicons name="person-outline" size={20} color="#555" />
          <Text style={styles.infoText}>{user?.name || "Guest User"}</Text>
          <TouchableOpacity onPress={handleEditName}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="call-outline" size={20} color="#555" />
          <Text style={styles.infoText}>{user?.phoneNumber || "Not added"}</Text>
          <TouchableOpacity onPress={handleEditContact}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="mail-outline" size={20} color="#555" />
          <Text style={styles.infoText}>{user?.email || "Not added"}</Text>
          <TouchableOpacity onPress={handleEditEmail}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    backgroundColor: "#2A5B8C",
    paddingTop: (StatusBar.currentHeight || 40) + 5, // lower arrow slightly
    paddingBottom: 20,
    paddingHorizontal: 15,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    paddingVertical: 5,
    paddingRight: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 5,
  },

  profileCard: {
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 25,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#E6E6E6",
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    backgroundColor: "#fff",
  },
  addIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2A5B8C",
    borderRadius: 10,
    padding: 2,
  },
  addPhotoText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
    textAlign: "center",
    marginTop: 10,
  },
  photoHelpText: {
    fontSize: 13,
    color: "#2A5B8C",
    textAlign: "center",
    marginTop: 4,
  },
  infoContainer: {
    marginHorizontal: 20,
    marginTop: 25,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E6E6E6",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#333",
  },
  editText: {
    color: "#2A5B8C",
    fontWeight: "600",
  },
});

