import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '../Users/useContext'; 

const Add_image = ({ navigation, route }) => {
  const { user, uploadImage, completeOnboardingStep } = useUser();
  
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Check if user already has a profile image and automatically redirect to MainApp
  useEffect(() => {
    if (user?.profileImage) {
      setImage(user.profileImage);
      setIsCompleted(true);
      
      // Always redirect to MainApp if user already has profile image
      console.log('✅ User already has profile image, redirecting to MainApp');
      setShouldRedirect(true);
    }
  }, [user]);

  // Handle the redirection with a slight delay
  useEffect(() => {
    if (shouldRedirect) {
      const timer = setTimeout(() => {
        navigation.replace('MainApp');
      }, 800); // Slightly longer delay to show the completed state
      
      return () => clearTimeout(timer);
    }
  }, [shouldRedirect, navigation]);

  // Request camera roll permissions
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        setHasPermission(status === 'granted');
        
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Sorry, we need camera roll permissions to upload profile pictures!'
          );
        }
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      if (hasPermission === false) {
        Alert.alert(
          'Permission Denied',
          'Please enable photo library permissions in your device settings.'
        );
        return;
      }

      setLoading(true);

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      console.log('📸 Image picker result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        setImage(result.assets[0].uri);
        console.log('✅ Image selected:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('❌ Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera permissions to take photos!'
        );
        return;
      }

      setLoading(true);

      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      console.log('📷 Camera result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        setImage(result.assets[0].uri);
        console.log('✅ Photo taken:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('❌ Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const uploadProfileImage = async () => {
    if (!image) {
      Alert.alert('No Image', 'Please select or take a photo first.');
      return;
    }

    if (!user?._id) {
      Alert.alert('Error', 'User not found. Please try logging in again.');
      return;
    }

    try {
      setUploading(true);
      console.log('🖼️ Uploading profile image...');

      const result = await uploadImage(user._id, image);
      
      if (result) {
        // Mark this onboarding step as complete
        await completeOnboardingStep('profile_image', { 
          imageUrl: result.image?.imageUrl || image 
        });
        
        setIsCompleted(true);
        
        Alert.alert(
          'Success!', 
          'Profile picture updated successfully.',
          [
            {
              text: 'Continue',
              onPress: () => {
                // Call the completion callback if provided
                if (route.params?.onComplete) {
                  route.params.onComplete();
                }
                
                // Always navigate to MainApp after successful upload
                console.log('✅ Profile image set, navigating to MainApp');
                navigation.replace('MainApp');
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      Alert.alert('Upload Error', 'Failed to upload profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Profile Picture?',
      'You can add a profile picture later in settings. Are you sure you want to skip?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: () => {
            // Always navigate to MainApp when skipping
            console.log('🚫 Skipping profile image, going to MainApp');
            navigation.replace('MainApp');
          }
        }
      ]
    );
  };

  const removeImage = () => {
    Alert.alert(
      'Remove Photo?',
      'Are you sure you want to remove your profile picture?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setImage(null);
            setIsCompleted(false);
            setShouldRedirect(false); // Cancel any pending redirect
          }
        }
      ]
    );
  };

  // Show loading state while preparing to redirect
  if (shouldRedirect) {
    return (
      <View style={[styles.container, styles.redirectContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.redirectText}>
          Profile picture found!{'\n'}
          Redirecting to app...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile Picture</Text>
          <Text style={styles.subtitle}>
            Add a profile picture so others can recognize you
          </Text>
          
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>✓ Completed</Text>
            </View>
          )}
        </View>

        {/* Image Preview */}
        <View style={styles.imageSection}>
          <View style={styles.imageContainer}>
            {image ? (
              <>
                <Image 
                  source={{ uri: image }} 
                  style={styles.profileImage}
                />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={removeImage}
                  disabled={uploading}
                >
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderText}>No Image</Text>
                <Text style={styles.placeholderSubtext}>Tap below to add one</Text>
              </View>
            )}
          </View>

          <Text style={styles.imageRequirements}>
            • Square image recommended{'\n'}
            • Max file size: 5MB{'\n'}
            • Supported formats: JPG, PNG
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[
              styles.actionButton,
              styles.galleryButton,
              loading && styles.buttonDisabled
            ]}
            onPress={pickImage}
            disabled={loading || uploading}
          >
            {loading ? (
              <ActivityIndicator color="#007AFF" size="small" />
            ) : (
              <>
                <Text style={styles.galleryButtonText}>📁 Choose from Gallery</Text>
                <Text style={styles.buttonSubtext}>Select existing photo</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.actionButton,
              styles.cameraButton,
              loading && styles.buttonDisabled
            ]}
            onPress={takePhoto}
            disabled={loading || uploading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.cameraButtonText}>📷 Take Photo</Text>
                <Text style={styles.buttonSubtext}>Use camera</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Tips for a great profile picture:</Text>
          <Text style={styles.tip}>• Face the camera directly</Text>
          <Text style={styles.tip}>• Use good lighting</Text>
          <Text style={styles.tip}>• Smile! 😊</Text>
          <Text style={styles.tip}>• Avoid group photos</Text>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={uploading}
        >
          <Text style={styles.skipButtonText}>
            {isCompleted ? 'Back' : 'Skip for now'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.uploadButton,
            (!image || uploading || isCompleted) && styles.uploadButtonDisabled
          ]}
          onPress={uploadProfileImage}
          disabled={!image || uploading || isCompleted}
        >
          {uploading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.uploadButtonText}>
              {isCompleted ? '✓ Completed' : 'Upload Picture'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  redirectContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  redirectText: {
    marginTop: 20,
    fontSize: 18,
    color: '#007AFF',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 24,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 22,
  },
  completedBadge: {
    marginTop: 10,
    backgroundColor: '#28A745',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completedBadgeText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  imageContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(220, 53, 69, 0.9)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  placeholderContainer: {
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    color: '#6C757D',
    fontWeight: '600',
    marginBottom: 4,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#ADB5BD',
    textAlign: 'center',
  },
  imageRequirements: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionButtons: {
    marginBottom: 30,
  },
  actionButton: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  galleryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  cameraButton: {
    backgroundColor: '#007AFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  galleryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  cameraButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  buttonSubtext: {
    fontSize: 14,
    color: '#6C757D',
  },
  tipsContainer: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  tip: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    backgroundColor: '#FFFFFF',
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  skipButtonText: {
    color: '#6C757D',
    fontSize: 16,
    fontWeight: '500',
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 140,
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    backgroundColor: '#6C757D',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Add_image;