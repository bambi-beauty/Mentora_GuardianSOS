import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../Users/useContext';

export default function Add_Image({ navigation }) {
  const [showUploader, setShowUploader] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { user, uploadImage } = useUser();

  const handleYes = () => setShowUploader(true);
  const handleSkip = () => navigation.navigate('MainApp');

  const pickImageFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Please grant gallery access to continue.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Could not pick image from gallery.');
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Please grant camera access to continue.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 1,
      });
      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Could not take photo.');
    }
  };

  const openImageOptions = () => {
    Alert.alert(
      "Upload Image",
      "Choose an option",
      [
        { text: "Take Photo", onPress: takePhoto },
        { text: "Choose from Gallery", onPress: pickImageFromGallery },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      Alert.alert('No Image Selected', 'Please select an image to upload.');
      return;
    }
    if (!user?._id) {
      Alert.alert('User Error', 'User not found. Please login again.');
      return;
    }
    try {
      setUploading(true);
      await uploadImage(user._id, selectedImage);
      Alert.alert('Success', 'Image uploaded successfully!');
      navigation.navigate('MainApp');
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Upload Failed', error.message || 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header Section */}
        <View style={styles.topSection}>
          <Text style={styles.brand}>GuardianSOS</Text>
          <Text style={styles.tagline}>Your safety, our priority</Text>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <Image
            source={require('../assets/Add_Image1.jpg')}
            style={styles.imageBanner}
            resizeMode="contain"
          />

          <Text style={styles.title}>Upload Profile Image</Text>
          <Text style={styles.subtitle}>Do you want to upload a profile image?</Text>

          {!showUploader && (
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.button} onPress={handleYes}>
                <Text style={styles.buttonText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleSkip}>
                <Text style={styles.buttonText}>Skip</Text>
              </TouchableOpacity>
            </View>
          )}

          {showUploader && (
            <>
              <View style={styles.imageContainer}>
                {selectedImage ? (
                  <Image source={{ uri: selectedImage }} style={styles.uploadedImage} />
                ) : (
                  <View style={styles.placeholder}>
                    <Ionicons name="person-circle-outline" size={100} color="#ccc" />
                  </View>
                )}
                <TouchableOpacity style={styles.iconOverlay} onPress={openImageOptions}>
                  <Ionicons name="camera" size={28} color="#fff" />
                </TouchableOpacity>
              </View>

              <Text style={styles.helperText}>Tap the camera icon to upload an image</Text>

              {selectedImage && (
                <TouchableOpacity
                  style={[styles.submitButton, uploading && { backgroundColor: '#999' }]}
                  onPress={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Upload</Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  topSection: {
    minHeight: 180,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
    paddingTop: 40,
  },
  brand: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  tagline: {
    fontSize: 16,
    color: '#fff',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  imageBanner: {
    width: '100%',
    height: 200,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#000',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    width: '100%',
  },
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 10,
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  iconOverlay: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#007BFF',
    borderRadius: 20,
    padding: 6,
  },
  helperText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#007BFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
