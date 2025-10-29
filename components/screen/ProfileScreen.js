import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../../Users/useContext";
import { useImage } from "../../context/ImageContext";

const backendBaseUrl = "https://baroscopical-natosha-overrigid.ngrok-free.dev";

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useUser();
  const {
    profileImageUrl,
    loading,
    imageError,
    refreshProfileImage,
    updateProfileImage,
  } = useImage(); // Use the image context
  
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfileImage();
    setRefreshing(false);
  };

  // Function to handle image loading errors
  const handleImageError = (error) => {
    console.log('Image loading failed:', error.nativeEvent.error);
  };

  const handleProfileDetails = () => navigation.navigate("ProfileDetailsScreen");
  const handleNotifications = () => navigation.navigate("NotificationScreen");
  const handlePrivacy = () => navigation.navigate("Privacy");
  const handleSafety = () => navigation.navigate("SafetyScreen");
  const handleHelpCenter = () => navigation.navigate("HelpCenterScreen");
  const handleContact = () => navigation.navigate("ContactUsScreen");
  const handleTerms = () => navigation.navigate("TermsOfService");
  const handlePolicy = () => navigation.navigate("PrivacyPolicy");
  const handleDeleteAcc = () => navigation.navigate("DeleteAccount");

  const handleEditProfile = () => {
    navigation.navigate("ProfileDetailsScreen");
  };

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

  const handleRetryImage = () => {
    refreshProfileImage();
  };

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#2A5B8C"]}
          tintColor="#2A5B8C"
        />
      }
    >
      {/* Header with Profile Image */}
      <View style={styles.headerContainer}>
        <View style={styles.profileImageSection}>
          <View style={styles.profileImageContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            ) : profileImageUrl && !imageError ? (
              <Image 
                source={{ uri: profileImageUrl }} 
                style={styles.profileImage}
                onError={handleImageError}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderContainer}>
                <Ionicons name="person-outline" size={44} color="#fff" />
                {imageError && (
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={handleRetryImage}
                  >
                    <Ionicons name="reload" size={16} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.editButton}
            onPress={handleEditProfile}
          >
            <Ionicons name="camera" size={20} color="#2A5B8C" />
          </TouchableOpacity>
        </View>

        <Text style={styles.name}>{user?.name || "User"}</Text>
        <Text style={styles.email}>{user?.email || ""}</Text>
        
        {/* Debug info - remove in production */}
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            Status: {loading ? "Loading..." : profileImageUrl ? "Loaded" : "No image"}
          </Text>
          {profileImageUrl && (
            <Text style={styles.debugText}>
              URL: {profileImageUrl.substring(0, 30)}...
            </Text>
          )}
        </View>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity style={styles.item} onPress={handleProfileDetails}>
          <View style={styles.iconContainer}>
            <Ionicons name="person-outline" size={22} color="#2A5B8C" />
          </View>
          <Text style={styles.itemText}>Personal Info</Text>
          <Ionicons name="chevron-forward" size={20} color="#BDD7E7" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={handleNotifications}>
          <View style={styles.iconContainer}>
            <Ionicons name="notifications-outline" size={22} color="#2A5B8C" />
          </View>
          <Text style={styles.itemText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={20} color="#BDD7E7" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={handleSafety}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#2A5B8C" />
          </View>
          <Text style={styles.itemText}>Safety</Text>
          <Ionicons name="chevron-forward" size={20} color="#BDD7E7" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={handlePrivacy}>
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed-outline" size={22} color="#2A5B8C" />
          </View>
          <Text style={styles.itemText}>Privacy</Text>
          <Ionicons name="chevron-forward" size={20} color="#BDD7E7" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.item, styles.lastItem]} onPress={handleDeleteAcc}>
          <View style={styles.iconContainer}>
            <Ionicons name="close-circle-outline" size={22} color="#E74C3C" />
          </View>
          <Text style={[styles.itemText, styles.deleteText]}>Delete Account</Text>
          <Ionicons name="chevron-forward" size={20} color="#BDD7E7" />
        </TouchableOpacity>
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>

        <TouchableOpacity style={styles.item} onPress={handleHelpCenter}>
          <View style={styles.iconContainer}>
            <Ionicons name="help-circle-outline" size={22} color="#2A5B8C" />
          </View>
          <Text style={styles.itemText}>Help Center</Text>
          <Ionicons name="chevron-forward" size={20} color="#BDD7E7" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={handleContact}>
          <View style={styles.iconContainer}>
            <Ionicons name="mail-outline" size={22} color="#2A5B8C" />
          </View>
          <Text style={styles.itemText}>Contact Us</Text>
          <Ionicons name="chevron-forward" size={20} color="#BDD7E7" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={handleTerms}>
          <View style={styles.iconContainer}>
            <Ionicons name="document-text-outline" size={22} color="#2A5B8C" />
          </View>
          <Text style={styles.itemText}>Terms of Service</Text>
          <Ionicons name="chevron-forward" size={20} color="#BDD7E7" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.item, styles.lastItem]} onPress={handlePolicy}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-outline" size={22} color="#2A5B8C" />
          </View>
          <Text style={styles.itemText}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={20} color="#BDD7E7" />
        </TouchableOpacity>
      </View>

      {/* Logout Section */}
      <View style={[styles.section, styles.logoutSection]}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <View style={styles.iconContainer}>
            <Ionicons name="log-out-outline" size={22} color="#E74C3C" />
          </View>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>App Version 1.0.0</Text>
        <Text style={styles.buildText}>Build 1234</Text>
      </View>
    </ScrollView>
  );
}

// Keep your existing styles the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EFF3FF",
  },
  headerContainer: {
    alignItems: "center",
    backgroundColor: "#2A5B8C",
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  profileImageSection: {
    position: "relative",
    marginBottom: 15,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },
  placeholderContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  loadingContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  editButton: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: "#2A5B8C",
  },
  retryButton: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(231, 76, 60, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    fontSize: 26,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 5,
    textAlign: "center",
  },
  email: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "400",
    textAlign: "center",
    marginBottom: 10,
  },
  debugInfo: {
    marginTop: 10,
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 8,
    alignSelf: "stretch",
  },
  debugText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    fontFamily: "monospace",
  },
  section: {
    marginTop: 20,
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2A5B8C",
    marginVertical: 16,
    marginHorizontal: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f8f8",
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  iconContainer: {
    width: 32,
    alignItems: "center",
    marginRight: 12,
  },
  itemText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    flex: 1,
  },
  deleteText: {
    color: "#E74C3C",
  },
  logoutSection: {
    marginBottom: 20,
    borderBottomWidth: 0,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  logoutText: {
    fontSize: 16,
    color: "#E74C3C",
    fontWeight: "600",
    flex: 1,
  },
  versionContainer: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 10,
    paddingHorizontal: 20,
  },
  versionText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "400",
    marginBottom: 2,
  },
  buildText: {
    fontSize: 12,
    color: "#999",
    fontWeight: "400",
  },
});