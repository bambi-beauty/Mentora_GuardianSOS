// context/ImageContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useUser } from '../Users/useContext';

const ImageContext = createContext();

export const useImage = () => {
  const context = useContext(ImageContext);
  if (!context) {
    throw new Error('useImage must be used within an ImageProvider');
  }
  return context;
};

export const ImageProvider = ({ children }) => {
  const { user } = useUser();
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const backendBaseUrl = "https://baroscopical-natosha-overrigid.ngrok-free.dev";

  // Fetch user profile image
  const fetchProfileImage = async (userId) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setImageError(false);
      setLoading(true);
      
      const response = await fetch(
        `${backendBaseUrl}/api/users/${userId}/profile-image`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.profileImage) {
        // Add cache busting parameter to avoid cached images
        const cacheBustedUrl = `${data.profileImage}?t=${Date.now()}`;
        setProfileImageUrl(cacheBustedUrl);
        console.log('Profile image loaded:', cacheBustedUrl);
      } else {
        setProfileImageUrl(null);
        console.log('No profile image found');
      }
    } catch (error) {
      console.error('Error fetching profile image:', error);
      setProfileImageUrl(null);
      setImageError(true);
    } finally {
      setLoading(false);
    }
  };

  // Refresh profile image
  const refreshProfileImage = async () => {
    if (user?._id) {
      await fetchProfileImage(user._id);
    }
  };

  // Update profile image immediately
  const updateProfileImage = (newImageUrl) => {
    if (newImageUrl) {
      const cacheBustedUrl = `${newImageUrl}?t=${Date.now()}`;
      setProfileImageUrl(cacheBustedUrl);
      setImageError(false);
    }
  };

  // Clear profile image
  const clearProfileImage = () => {
    setProfileImageUrl(null);
    setImageError(false);
  };

  // Fetch image when user changes
  useEffect(() => {
    if (user?._id) {
      fetchProfileImage(user._id);
    } else {
      setProfileImageUrl(null);
      setLoading(false);
    }
  }, [user?._id]);

  const value = {
    profileImageUrl,
    loading,
    imageError,
    refreshProfileImage,
    updateProfileImage,
    clearProfileImage,
    fetchProfileImage: () => user?._id && fetchProfileImage(user._id),
  };

  return (
    <ImageContext.Provider value={value}>
      {children}
    </ImageContext.Provider>
  );
};