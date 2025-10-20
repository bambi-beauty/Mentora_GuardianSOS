import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../../Users/useContext";

const backendBaseUrl = "http://192.168.57.209:3000";

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useUser();

  const handleNotifications = () => navigation.navigate("NotificationScreen");
  const handlePrivacy = () => navigation.navigate("Privacy");
  const handleSecurity = () => navigation.navigate("Safety");
  const handleHelpCenter = () => navigation.navigate("HelpCenterScreen");
  const handleContact = () => navigation.navigate("ContactUsScreen");
  const handleTerms = () => navigation.navigate("TermsOfService");
  const handlePolicy = () => navigation.navigate("PrivacyPolicy");
  const handleDeleteAcc =()=> navigation.navigate("DeleteAcc")

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

  
  const avatarUri = user?.imageUrl
    ? user.imageUrl.startsWith("http")
      ? user.imageUrl
      : `${backendBaseUrl}${user.imageUrl}`
    : null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileContainer}>
        {/* <Image
          source={
            avatarUri
              ? { uri: avatarUri }
              : require("../assets/avatar-placeholder.png")
          }
          style={styles.avatar}
        /> */}
        <Text style={styles.name}>{user?.name || "User"}</Text>

        <TouchableOpacity
          onPress={() => navigation.navigate("ProfileDetailsScreen")}
        >
          <Text style={styles.viewProfile}>View Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity style={styles.item} onPress={handleNotifications}>
          <Ionicons
            name="notifications-outline"
            size={20}
            color="#2171B5"
            style={styles.icon}
          />
          <Text style={styles.itemText}>Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={handlePrivacy}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color="#2171B5"
            style={styles.icon}
          />
          <Text style={styles.itemText}>Privacy</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={handleSecurity}>
          <Ionicons
            name="shield-checkmark-outline"
            size={20}
            color="#2171B5"
            style={styles.icon}
          />
          <Text style={styles.itemText}>Safety</Text>
        </TouchableOpacity>

         <TouchableOpacity style={styles.item} onPress={handleDeleteAcc}>
          <Ionicons
            name="double-cross"
            size={20}
            color="#2171B5"
            style={styles.icon}
          />
          <Text style={styles.itemText}>Delete Account</Text>
        </TouchableOpacity>



      </View>
      

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>

        <TouchableOpacity style={styles.item} onPress={handleHelpCenter}>
          <Ionicons
            name="help-circle-outline"
            size={20}
            color="#2171B5"
            style={styles.icon}
          />
          <Text style={styles.itemText}>Help Center</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={handleContact}>
          <Ionicons
            name="mail-outline"
            size={20}
            color="#2171B5"
            style={styles.icon}
          />
          <Text style={styles.itemText}>Contact Us</Text>
        </TouchableOpacity>
      </View>

      
      <View style={[styles.section, { marginBottom: 30 }]}>
        <TouchableOpacity style={styles.item} onPress={handleLogout}>
          <Ionicons
            name="log-out-outline"
            size={20}
            color="red"
            style={styles.icon}
          />
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
  profileContainer: {
    alignItems: "center",
    paddingVertical: 30,
    backgroundColor: "#2171B5",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 10,
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
  },
  viewProfile: {
    fontSize: 14,
    color: "#BDD7E7",
    marginTop: 5,
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
    color: "#2171B5",
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
