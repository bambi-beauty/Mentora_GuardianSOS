import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../../Users/useContext";

const backendBaseUrl = "http://192.168.57.209:3000";

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useUser();

  const handleProfileDetails = () => navigation.navigate("ProfileDetailsScreen");
  const handleNotifications = () => navigation.navigate("NotificationScreen");
  const handlePrivacy = () => navigation.navigate("Privacy");
  const handleSecurity = () => navigation.navigate("Safety");
  const handleSafety = () => navigation.navigate("SafetyScreen");
  const handleHelpCenter = () => navigation.navigate("HelpCenterScreen");
  const handleContact = () => navigation.navigate("ContactUsScreen");
  const handleTerms = () => navigation.navigate("TermsOfService");
  const handlePolicy = () => navigation.navigate("PrivacyPolicy");
  const handleDeleteAcc = () => navigation.navigate("DeleteAcc");

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            await logout();
            navigation.replace("Login");
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.emptyCircle}>
          <Ionicons name="person-outline" size={40} color="#fff" />
        </View>
        <Text style={styles.name}>{user?.name || "User"}</Text>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity style={styles.item} onPress={handleProfileDetails}>
          <Ionicons name="person-outline" size={20} color="#2A5B8C" style={styles.icon} />
          <Text style={styles.itemText}>Personal Info</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={handleNotifications}>
          <Ionicons name="notifications-outline" size={20} color="#2A5B8C" style={styles.icon} />
          <Text style={styles.itemText}>Notifications</Text>
        </TouchableOpacity>


        <TouchableOpacity style={styles.item} onPress={handleSafety}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#2A5B8C" style={styles.icon} />
          <Text style={styles.itemText}>Safety</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={handlePrivacy}>
          <Ionicons name="lock-closed-outline" size={20} color="#2A5B8C" style={styles.icon} />
          <Text style={styles.itemText}>Privacy</Text>
        </TouchableOpacity>


        <TouchableOpacity style={styles.item} onPress={handleDeleteAcc}>
          <Ionicons name="close-circle-outline" size={20} color="#2A5B8C" style={styles.icon} />
          <Text style={styles.itemText}>Delete Account</Text>
        </TouchableOpacity>
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>

        <TouchableOpacity style={styles.item} onPress={handleHelpCenter}>
          <Ionicons name="help-circle-outline" size={20} color="#2A5B8C" style={styles.icon} />
          <Text style={styles.itemText}>Help Center</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={handleContact}>
          <Ionicons name="mail-outline" size={20} color="#2A5B8C" style={styles.icon} />
          <Text style={styles.itemText}>Contact Us</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <View style={[styles.section, { marginBottom: 30 }]}>
        <TouchableOpacity style={styles.item} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="red" style={styles.icon} />
          <Text style={[styles.itemText, { color: "red", fontWeight: "bold" }]}>
            Log Out
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EFF3FF",
  },
  headerContainer: {
    alignItems: "center",
    backgroundColor: "#2A5B8C",
    paddingVertical: 40,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  emptyCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  name: {
    fontSize: 22,
    fontWeight: "600",
    color: "#fff",
  },
  section: {
    marginTop: 25,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2A5B8C",
    marginBottom: 10,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#BDD7E7",
  },
  itemText: {
    fontSize: 15,
    color: "#333",
  },
  icon: {
    marginRight: 10,
  },
});
