// context/ImageContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "../Users/useContext";

const ImageContext = createContext();

export const useImage = () => {
  const context = useContext(ImageContext);
  if (!context) {
    throw new Error("useImage must be used within an ImageProvider");
  }
  return context;
};

export const ImageProvider = ({ children }) => {
  const { user } = useUser();
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const backendBaseUrl = "https://baroscopical-natosha-overrigid.ngrok-free.dev";

  // Fetch profile image from backend
  const fetchProfileImage = async (userId) => {
    if (!userId) {
      setProfileImageUrl(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setImageError(false);

      const response = await fetch(`${backendBaseUrl}/api/users/${userId}/profile-image`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      if (data.profileImage) {
        // Add cache-busting query param
        setProfileImageUrl(`${data.profileImage}?t=${Date.now()}`);
      } else {
        setProfileImageUrl(null);
      }
    } catch (error) {
      console.error("Error fetching profile image:", error);
      setProfileImageUrl(null);
      setImageError(true);
    } finally {
      setLoading(false);
    }
  };

  // Refresh image manually
  const refreshProfileImage = async () => {
    if (user?._id) {
      await fetchProfileImage(user._id);
    }
  };

  // Update profile image instantly
  const updateProfileImage = (newImageUrl) => {
    if (newImageUrl) {
      setProfileImageUrl(`${newImageUrl}?t=${Date.now()}`);
      setImageError(false);
    }
  };

  // Clear profile image
  const clearProfileImage = () => {
    setProfileImageUrl(null);
    setImageError(false);
  };

  // Fetch profile image when user changes
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

  return <ImageContext.Provider value={value}>{children}</ImageContext.Provider>;
};
