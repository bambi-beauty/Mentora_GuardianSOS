import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useUser } from "../Users/useContext";

export default function ProfileDetailsScreen({ navigation }) {
  const { user, uploadImage } = useUser();
  const [imageLoading, setImageLoading] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission denied",
          "Allow access to photos to update your profile image"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setImageLoading(true);
        
        // Upload image using the uploadImage function from UserContext
        const uploadResult = await uploadImage(user._id, uri);
        
        if (uploadResult) {
          // Success - the image URL is already stored in user.profileImage via UserContext
          Alert.alert("Success", "Profile image updated successfully!");
        } else {
          Alert.alert("Error", "Failed to upload profile image");
        }
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to pick image");
    } finally {
      setImageLoading(false);
    }
  };

  // Handle image loading errors
  const handleImageError = () => {
    setImageError(true);
  };

  // Handle image loading
  const handleImageLoad = () => {
    setImageError(false);
  };

  const handleEditName = () => navigation.navigate("EditNameScreen");
  const handleEditContact = () => navigation.navigate("EditContactScreen");
  const handleEditEmail = () => navigation.navigate("EditEmailScreen");

  return (
    <ScrollView style={styles.container}>
      {/* BLUE HEADER */}
      <View style={styles.header}>
        <StatusBar barStyle="light-content" backgroundColor="#2A5B8C" />
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back-outline" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Personal info</Text>
        </View>
      </View>

      {/* Avatar Section */}
      <View style={styles.profileCard}>
        <TouchableOpacity
          style={styles.avatarPlaceholder}
          onPress={pickImage}
          activeOpacity={0.8}
          disabled={imageLoading}
        >
          {user?.profileImage && !imageError ? (
            <Image
              source={{ uri: `${user.profileImage}?t=${Date.now()}` }}
              style={styles.avatarImage}
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
          ) : (
            <View style={styles.placeholderContent}>
              <Ionicons name="person-outline" size={50} color="#ccc" />
              {imageLoading && (
                <View style={styles.loadingOverlay}>
                  <Ionicons name="cloud-upload" size={24} color="#2A5B8C" />
                </View>
              )}
            </View>
          )}
          <View style={styles.addIcon}>
            <Ionicons name="camera" size={18} color="#fff" />
          </View>
        </TouchableOpacity>

        <Text style={styles.addPhotoText}>
          Add a profile photo so responders can recognise you
        </Text>
        <TouchableOpacity>
          <Text style={styles.photoHelpText}>When can someone see my photo?</Text>
        </TouchableOpacity>

        {/* Debug info - remove in production */}
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            Status: {imageLoading ? "Uploading..." : user?.profileImage ? "Image exists" : "No image"}
          </Text>
          {user?.profileImage && (
            <Text style={styles.debugText}>
              URL: {user.profileImage.substring(0, 30)}...
            </Text>
          )}
        </View>
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
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    backgroundColor: "#2A5B8C",
    paddingTop: (StatusBar.currentHeight || 40) + 5,
    paddingBottom: 20,
    paddingHorizontal: 15,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  headerContent: { flexDirection: "row", alignItems: "center" },
  backButton: { paddingVertical: 5, paddingRight: 10 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#fff", marginLeft: 5 },

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
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    backgroundColor: "#fff",
  },
  avatarImage: { 
    width: "100%", 
    height: "100%", 
    borderRadius: 50 
  },
  placeholderContent: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 50,
  },
  addIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2A5B8C",
    borderRadius: 12,
    padding: 4,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
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
  debugInfo: {
    marginTop: 10,
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 8,
    alignSelf: "stretch",
  },
  debugText: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
    fontFamily: "monospace",
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
    color: "#333" 
  },
  editText: { 
    color: "#2A5B8C", 
    fontWeight: "600" 
  },
});