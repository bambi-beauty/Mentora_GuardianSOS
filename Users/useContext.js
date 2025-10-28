import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  // 🧱 State
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [streets, setStreets] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedStreet, setSelectedStreet] = useState('');
  const [locationLoading, setLocationLoading] = useState({
    countries: false,
    states: false,
    cities: false,
    streets: false,
  });

  const API_BASE_URL = 'https://getlocations.onrender.com';
  const backendBaseUrl = 'https://baroscopical-natosha-overrigid.ngrok-free.dev';

  // ✅ Token Validation
  const isValidToken = (t) => {
    try {
      if (!t || typeof t !== 'string' || t.trim() === '') {
        console.log('❌ Token: Invalid format');
        return false;
      }

      const parts = t.split('.');
      if (parts.length !== 3) {
        console.log('❌ Token: Not a valid JWT structure');
        return false;
      }

      const decoded = jwtDecode(t);
      const currentTime = Date.now() / 1000;
      const isExpired = decoded.exp < currentTime;
      
      console.log('🔐 Token validation:', { 
        hasToken: !!t, 
        expires: new Date(decoded.exp * 1000).toISOString(),
        currentTime: new Date().toISOString(),
        isExpired 
      });
      
      if (isExpired) {
        console.log('❌ Token expired');
        return false;
      }
      
      console.log('✅ Token is valid');
      return true;
    } catch (error) {
      console.error('❌ Token validation error:', error);
      return false;
    }
  };

  // ✅ Load user from storage
  useEffect(() => {
    let mounted = true;

    const loadAuthData = async () => {
      try {
        console.log('🔄 Checking stored auth data...');
        
        const [storedUser, storedToken] = await Promise.all([
          AsyncStorage.getItem('user'),
          AsyncStorage.getItem('token'),
        ]);

        console.log('📦 Stored data found:', { 
          hasUser: !!storedUser, 
          hasToken: !!storedToken
        });

        if (!mounted) return;

        if (storedUser && storedToken) {
          const tokenValid = isValidToken(storedToken);
          
          if (tokenValid) {
            const parsedUser = JSON.parse(storedUser);
            console.log('✅ Valid token found, auto-login user:', { 
              email: parsedUser.email,
              onboardingCompleted: parsedUser.onboardingCompleted,
              userId: parsedUser._id,
              hasEmergencyContacts: parsedUser.emergencyContacts?.length > 0,
              hasProfileImage: !!parsedUser.profileImage
            });
            
            setUser(parsedUser);
            setToken(storedToken);

            if (parsedUser?.location?.city) {
              setSelectedCity(parsedUser.location.city);
            }
          } else {
            console.log('❌ Token invalid or expired, clearing storage');
            await AsyncStorage.multiRemove(['user', 'token']);
            setUser(null);
            setToken(null);
          }
        } else {
          console.log('❌ No auth data found in storage');
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        console.error('❌ Failed to load user:', err);
        if (mounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          console.log('🏁 Auth loading complete');
        }
      }
    };

    loadAuthData();

    return () => {
      mounted = false;
    };
  }, []);

  // ✅ Keep selectedCity updated if user changes
  useEffect(() => {
    if (user?.location?.city && !selectedCity) {
      setSelectedCity(user.location.city);
    }
  }, [user]);

  // ✅ COMPREHENSIVE ONBOARDING FUNCTIONS

  // Check if user has completed all onboarding steps
  const hasCompletedOnboarding = () => {
    if (!user) return false;
    
    const hasBasicInfo = user.onboardingCompleted || 
                        (user.name && user.email && user.phoneNumber);
    const hasContacts = user.emergencyContacts && user.emergencyContacts.length > 0;
    const hasProfileImage = !!user.profileImage;
    
    const completed = hasBasicInfo && hasContacts && hasProfileImage;
    
    console.log('🔍 Onboarding completion check:', {
      hasUser: !!user,
      hasBasicInfo,
      hasContacts,
      hasProfileImage,
      completed
    });
    
    return completed;
  };

  // Get detailed onboarding status
  const getOnboardingStatus = () => {
    if (!user) {
      return { 
        completed: false, 
        missingSteps: ['all'],
        progress: 0 
      };
    }
    
    const steps = {
      basic_info: !!user.onboardingCompleted || !!(user.name && user.email && user.phoneNumber),
      emergency_contacts: !!(user.emergencyContacts && user.emergencyContacts.length > 0),
      profile_image: !!user.profileImage
    };
    
    const missingSteps = Object.entries(steps)
      .filter(([_, completed]) => !completed)
      .map(([step]) => step);
    
    const completedCount = Object.values(steps).filter(Boolean).length;
    const progress = (completedCount / Object.keys(steps).length) * 100;
    
    return {
      completed: missingSteps.length === 0,
      missingSteps,
      progress: Math.round(progress),
      steps
    };
  };

  // Mark specific onboarding step as complete
  const completeOnboardingStep = async (step, data = {}) => {
    try {
      if (!user) {
        console.error('❌ No user found to update onboarding');
        return false;
      }

      let updatedUser = { ...user };

      switch (step) {
        case 'emergency_contacts':
          updatedUser.emergencyContacts = data.contacts || [];
          console.log('✅ Emergency contacts step completed:', updatedUser.emergencyContacts.length, 'contacts');
          break;
          
        case 'profile_image':
          updatedUser.profileImage = data.imageUrl || user.profileImage;
          console.log('✅ Profile image step completed');
          break;
          
        case 'basic_info':
          updatedUser.onboardingCompleted = true;
          if (data.userInfo) {
            updatedUser = { ...updatedUser, ...data.userInfo };
          }
          console.log('✅ Basic info step completed');
          break;
          
        default:
          console.warn('❌ Unknown onboarding step:', step);
          return false;
      }

      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      console.log(`✅ Onboarding step "${step}" completed successfully`);
      return true;
      
    } catch (err) {
      console.error(`❌ Error completing onboarding step "${step}":`, err);
      return false;
    }
  };

  // Check if user needs to complete onboarding
  const requiresOnboarding = () => {
    if (!user) return true;
    const status = getOnboardingStatus();
    return !status.completed;
  };

  // ✅ Update user data generically
const updateUser = async (newData) => {
  try {
    const currentUser = user || {};
    const updated = { ...currentUser, ...newData };
    setUser(updated);
    await AsyncStorage.setItem('user', JSON.stringify(updated));
    console.log('✅ User updated successfully:', updated);
  } catch (err) {
    console.error('❌ Error updating user:', err);
    Alert.alert('Error', 'Failed to update user data');
  }
};


  // ✅ Update completeOnboarding function
  const completeOnboarding = async (userInfo = {}) => {
    try {
      if (!user) {
        console.error('❌ No user found to complete onboarding');
        return;
      }

      const updatedUser = { 
        ...user, 
        ...userInfo, 
        onboardingCompleted: true 
      };
      
      console.log('✅ Completing onboarding:', {
        previousOnboarding: user.onboardingCompleted,
        newOnboarding: updatedUser.onboardingCompleted,
        userId: user._id
      });
      
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

      if (userInfo?.location?.city) {
        setSelectedCity(userInfo.location.city);
      }

      console.log('✅ Onboarding completed successfully');
    } catch (err) {
      console.error('❌ Error completing onboarding:', err);
      Alert.alert('Error', 'Failed to complete onboarding');
    }
  };

  // ✅ IMPROVED LOGIN
  const login = async (email, password, rememberMe = false) => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return null;
    }

    try {
      console.log('🔐 Attempting login:', { email: email.trim().toLowerCase() });

      const res = await fetch(`${backendBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const text = await res.text();
      console.log('🔍 Raw response from backend:', text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error('❌ Backend did not return JSON:', text);
        Alert.alert(
          'Server Error',
          'Unexpected response from server.\nCheck your backend URL or network connection.'
        );
        return null;
      }

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      console.log('✅ Login successful, storing data...', {
        user: data.user,
        onboardingCompleted: data.user.onboardingCompleted,
        userId: data.user._id,
        tokenPresent: !!data.token
      });
      
      await AsyncStorage.multiSet([
        ['user', JSON.stringify(data.user)],
        ['token', data.token]
      ]);
      
      setUser(data.user);
      setToken(data.token);

      if (data.user?.location?.city) {
        setSelectedCity(data.user.location.city);
      }

      console.log('✅ Login complete - data stored in AsyncStorage and state updated');
      return data.user;
    } catch (err) {
      console.error('❌ Login error:', err.message);
      Alert.alert('Login Failed', err.message);
      return null;
    }
  };

  // ✅ IMPROVED LOGOUT
  const logout = async () => {
    console.log('🚪 Logging out...');
    try {
      await AsyncStorage.multiRemove(['user', 'token']);
      setUser(null);
      setToken(null);
      setSelectedCity('');
      console.log('✅ Logout complete - all data cleared');
    } catch (err) {
      console.error('❌ Logout error:', err);
      setUser(null);
      setToken(null);
    }
  };

  const signUp = async (name, email, password, phoneNumber, agreeToTerms, location = {}) => {
    try {
      console.log('👤 Attempting signup:', { email: email.trim().toLowerCase() });

      const res = await fetch(`${backendBaseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phoneNumber, agreeToTerms, location }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      Alert.alert('Success', 'Signup successful! Please verify your email.');
      
      if (location?.city) {
        setSelectedCity(location.city);
      }
      
      if (data.user) {
        setUser(data.user);
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
        console.log('✅ User stored after signup:', { userId: data.user._id });
      }
      
      return data;
    } catch (err) {
      console.error('❌ Signup error:', err.message);
      Alert.alert('Signup Error', err.message);
      return null;
    }
  };

  const deleteUser = async () => {
    try {
      if (!token) {
        Alert.alert('Error', 'No authentication token found');
        return;
      }

      const res = await fetch(`${backendBaseUrl}/api/auth/deleteuser`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete account');
      }
      
      Alert.alert('Success', 'Account deleted successfully');
      await logout();
    } catch (err) {
      console.error('❌ Delete user error:', err.message);
      Alert.alert('Error', err.message);
    }
  };

  // 🌍 LOCATION FETCHING
  const fetchData = async (url, setState, key) => {
    setLocationLoading((prev) => ({ ...prev, [key]: true }));
    try {
      console.log(`🌍 Fetching ${key} from:`, url);
      const res = await fetch(url);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data[key] || data.data?.[key] || [];
      setState(list);
      console.log(`✅ Fetched ${list.length} ${key}`);
    } catch (err) {
      console.error(`❌ Fetch ${key} error:`, err);
    } finally {
      setLocationLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const fetchCountries = () => fetchData(`${API_BASE_URL}/countries`, setCountries, 'countries');
  const fetchStates = (country) =>
    fetchData(`${API_BASE_URL}/states?country=${encodeURIComponent(country)}`, setStates, 'states');
  const fetchCities = (country, state) =>
    fetchData(
      `${API_BASE_URL}/cities?country=${encodeURIComponent(country)}&state=${encodeURIComponent(state)}`,
      setCities,
      'cities'
    );
  const fetchStreets = (country, city) =>
    fetchData(`${API_BASE_URL}/streets?country=${country}&city=${city}`, setStreets, 'streets');

  // 👥 CONTACTS - UPDATED WITH ONBOARDING INTEGRATION
  const addContacts = async (userId, contacts) => {
    if (!token) {
      Alert.alert('Not Authorized', 'Please log in again');
      return null;
    }

    try {
      console.log('📞 Adding contacts for user:', userId);
      console.log('📋 Contacts to add:', contacts);

      const endpoint = `${backendBaseUrl}/api/contacts`;
      console.log('🔗 Calling endpoint:', endpoint);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          userId, 
          contacts 
        }),
      });

      console.log('🔍 Response status:', res.status);
      
      const responseText = await res.text();
      console.log('📄 Raw response:', responseText);

      if (!res.ok) {
        console.error('❌ Server error response:', responseText);
        
        if (res.status === 400) {
          throw new Error('Invalid contact data. Please check all fields.');
        } else if (res.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else {
          throw new Error(`Server error: ${res.status} - ${responseText}`);
        }
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        throw new Error('Server returned invalid JSON format');
      }

      // ✅ Mark emergency contacts step as complete
      await completeOnboardingStep('emergency_contacts', { contacts: data.contacts || contacts });
      
      console.log('✅ Contacts added and onboarding step completed:', data);
      Alert.alert('Success', 'Emergency contacts added successfully!');
      return data;

    } catch (err) {
      console.error('❌ Add contacts error:', err.message);
      Alert.alert('Error', err.message);
      return null;
    }
  };

  const getContactsByUser = async () => {
    try {
      if (!user?._id || !token) {
        console.log('❌ Missing user ID or token');
        return [];
      }

      const endpoint = `${backendBaseUrl}/api/contacts/${user._id}`;
      console.log('🔗 Fetching contacts from:', endpoint);

      const res = await fetch(endpoint, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      console.log('🔍 Get contacts response status:', res.status);

      if (res.ok) {
        const data = await res.json();
        console.log('✅ Contacts fetched successfully:', data.contacts?.length || 0, 'contacts');
        return data.contacts || [];
      } else {
        const errorText = await res.text();
        console.error('❌ Get contacts error:', errorText);
        return [];
      }
    } catch (error) {
      console.error('❌ Get contacts network error:', error);
      return [];
    }
  };

  const updateContacts = async (contactId, updatedFields) => {
    try {
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      console.log('📝 Updating contact:', contactId);
      
      const res = await fetch(`${backendBaseUrl}/api/contacts/update/${contactId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(updatedFields),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update contact');
      }
      
      Alert.alert('Success', 'Contact updated successfully');
      return data;
    } catch (err) {
      console.error('❌ Update contacts error:', err.message);
      Alert.alert('Error', err.message);
    }
  };

  // COMMUNITY POSTS
  const fetchCommunityPosts = async () => {
    try {
      console.log('📝 Fetching community posts');
      const res = await fetch(`${backendBaseUrl}/api/posts`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      const data = await res.json();
      
      if (res.ok) {
        console.log('✅ Fetched community posts:', data.length || 0);
        return data;
      } else {
        console.error('❌ Failed to fetch posts:', data.message);
        return [];
      }
    } catch (error) {
      console.error('❌ Fetch posts network error:', error);
      return [];
    }
  };

  const createCommunityPost = async (text, image = null, type = 'post') => {
    if (!text.trim() && !image) {
      Alert.alert('Error', 'Post cannot be empty');
      return null;
    }

    try {
      console.log('📝 Creating community post');
      
      const res = await fetch(`${backendBaseUrl}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text, image, type }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create post');
      }
      
      console.log('✅ Post created successfully');
      return data;
    } catch (err) {
      console.error('❌ Create post error:', err.message);
      Alert.alert('Post Error', err.message);
      return null;
    }
  };

  const likeCommunityPost = async (postId) => {
    try {
      if (!token) {
        console.log('❌ No token for like action');
        return null;
      }

      console.log('❤️ Liking post:', postId);
      
      const res = await fetch(`${backendBaseUrl}/api/posts/${postId}/like`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await res.json();
      
      if (res.ok) {
        console.log('✅ Post liked successfully');
        return data;
      } else {
        console.error('❌ Like failed:', data.message);
        return null;
      }
    } catch (err) {
      console.error('❌ Like error:', err);
      return null;
    }
  };

  const updateCommunityPost = async (postId, text, image) => {
    try {
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return null;
      }

      console.log('📝 Updating post:', postId);
      
      const res = await fetch(`${backendBaseUrl}/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text, image }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update post');
      }
      
      console.log('✅ Post updated successfully');
      return data;
    } catch (err) {
      console.error('❌ Update post error:', err.message);
      Alert.alert('Update Error', err.message);
      return null;
    }
  };

  const deleteCommunityPost = async (postId) => {
    try {
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return false;
      }

      console.log('🗑️ Deleting post:', postId);
      
      const res = await fetch(`${backendBaseUrl}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete post');
      }
      
      console.log('✅ Post deleted successfully');
      return true;
    } catch (err) {
      console.error('❌ Delete post error:', err.message);
      Alert.alert('Delete Error', err.message);
      return false;
    }
  };

  const submitCommunityFeedback = async (text) => {
    if (!text.trim()) {
      Alert.alert('Error', 'Feedback cannot be empty');
      return;
    }

    try {
      console.log('📝 Submitting feedback');
      
      const res = await fetch(`${backendBaseUrl}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit feedback');
      }
      
      Alert.alert('Success', 'Feedback submitted successfully');
    } catch (err) {
      console.error('❌ Feedback error:', err.message);
      Alert.alert('Feedback Error', err.message);
    }
  };

  // 🖼️ Upload Profile Image - UPDATED WITH ONBOARDING INTEGRATION
  const uploadImage = async (userId, imageUri) => {
    try {
      if (!userId) {
        Alert.alert('Error', 'User ID missing');
        return null;
      }

      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return null;
      }

      console.log('🖼️ Uploading profile image for user:', userId);

      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        name: 'profile.jpg',
        type: 'image/jpeg',
      });

      const response = await fetch(`${backendBaseUrl}/api/users/${userId}/images`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Upload failed');
      }

      const data = await response.json();
      console.log('✅ Image upload successful');

      // ✅ Mark profile image step as complete
      await completeOnboardingStep('profile_image', { imageUrl: data.image?.imageUrl });

      Alert.alert('Success', 'Profile image updated successfully!');
      return data;

    } catch (err) {
      console.error('❌ Upload error:', err.message);
      Alert.alert('Upload Error', err.message);
      return null;
    }
  };

  // ✅ Update emergency contacts in user data
  const updateUserEmergencyContacts = async (contacts) => {
    try {
      if (!user) {
        console.error('❌ No user found to update contacts');
        return;
      }

      const updatedUser = {
        ...user,
        emergencyContacts: contacts
      };
      
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      console.log('✅ Emergency contacts updated in user data:', contacts.length);
    } catch (err) {
      console.error('❌ Error updating emergency contacts:', err);
    }
  };

  // ✅ Update profile image in user data
  const updateUserProfileImage = async (imageUrl) => {
    try {
      if (!user) {
        console.error('❌ No user found to update profile image');
        return;
      }

      const updatedUser = {
        ...user,
        profileImage: imageUrl
      };
      
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      console.log('✅ Profile image updated in user data');
    } catch (err) {
      console.error('❌ Error updating profile image:', err);
    }
  };

  // ✅ Context Provider
  return (
    <UserContext.Provider
      value={{
        // Auth
        user,
        token,
        loading,
        setUser,
        setToken,
        login,
        logout,
        signUp,
        deleteUser,
        uploadImage,
        completeOnboarding,
        updateUser,
        
        // Onboarding Functions
        hasCompletedOnboarding,
        getOnboardingStatus,
        completeOnboardingStep,
        requiresOnboarding,
        updateUserEmergencyContacts,
        updateUserProfileImage,
        
        // Location
        countries,
        states,
        cities,
        streets,
        selectedCountry,
        setSelectedCountry,
        selectedState,
        setSelectedState,
        selectedCity,
        setSelectedCity,
        selectedStreet,
        setSelectedStreet,
        locationLoading,
        fetchCountries,
        fetchStates,
        fetchCities,
        fetchStreets,
        
        // Contacts
        addContacts,
        getContactsByUser,
        updateContacts,
        
        // Community
        fetchCommunityPosts,
        createCommunityPost,
        likeCommunityPost,
        updateCommunityPost,
        deleteCommunityPost,
        submitCommunityFeedback,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};



export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
// User/useContext.js
// import React, { createContext, useContext, useEffect, useState } from 'react';
// import { Alert } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import jwtDecode from 'jwt-decode';

// const UserContext = createContext();

// export const UserProvider = ({ children }) => {
//   // 🧱 State
//   const [user, setUser] = useState(null);
//   const [token, setToken] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const [countries, setCountries] = useState([]);
//   const [states, setStates] = useState([]);
//   const [cities, setCities] = useState([]);
//   const [streets, setStreets] = useState([]);
//   const [selectedCountry, setSelectedCountry] = useState('');
//   const [selectedState, setSelectedState] = useState('');
//   const [selectedCity, setSelectedCity] = useState('');
//   const [selectedStreet, setSelectedStreet] = useState('');
//   const [locationLoading, setLocationLoading] = useState({
//     countries: false,
//     states: false,
//     cities: false,
//     streets: false,
//   });

//   // 🛠️ Backend
//   const API_BASE_URL = 'https://getlocations.onrender.com';
//   const backendBaseUrl = 'https://thisprojectbackend1-1.onrender.com';

//   const isValidToken = (t) => {
//     try {
//       const decoded = jwtDecode(t);
//       return decoded.exp * 1000 > Date.now();
//     } catch {
//       return false;
//     }
//   };

//   useEffect(() => {
//     (async () => {
//       try {
//         const storedUser = await AsyncStorage.getItem('user');
//         const storedToken = await AsyncStorage.getItem('token');

//         if (storedUser && storedToken && isValidToken(storedToken)) {
//           setUser(JSON.parse(storedUser));
//           setToken(storedToken);
//         } else {
//           await AsyncStorage.multiRemove(['user', 'token']);
//           setUser(null);
//           setToken(null);
//         }
//       } catch (err) {
//         console.error('Failed to load user:', err);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, []);

//   // New updateUser function
//   const updateUser = async (updatedFields) => {
//     try {
//       const updatedUser = { ...user, ...updatedFields };
//       setUser(updatedUser);
//       await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
//     } catch (err) {
//       console.error('Failed to update user:', err);
//     }
//   };

//   // 🧱 AUTH SECTION
//   const login = async (email, password, rememberMe = false) => {
//     if (!email || !password) return Alert.alert('Error', 'Please fill all fields');
//     try {
//       const res = await fetch(`${backendBaseUrl}/api/auth/login`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message || 'Login failed');

//       setUser(data.user);
//       setToken(data.token);

//       if (rememberMe) {
//         await AsyncStorage.setItem('user', JSON.stringify(data.user));
//         await AsyncStorage.setItem('token', data.token);
//       }

//       return data.user;
//     } catch (err) {
//       console.error('Login error:', err.message);
//       Alert.alert('Login Failed', err.message);
//       return null;
//     }
//   };

//   const logout = async () => {
//     await AsyncStorage.multiRemove(['user', 'token']);
//     setUser(null);
//     setToken(null);
//   };

//   const signUp = async (name, email, password, phoneNumber, agreeToTerms, location = {}) => {
//     try {
//       const res = await fetch(`${backendBaseUrl}/api/auth/signup`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ name, email, password, phoneNumber, agreeToTerms, location }),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message);
//       Alert.alert('Success', 'Signup successful! Please verify your email.');
//       return data;
//     } catch (err) {
//       Alert.alert('Signup Error', err.message);
//     }
//   };

//   const deleteUser = async () => {
//     try {
//       const res = await fetch(`${backendBaseUrl}/api/auth/deleteuser`, {
//         method: 'DELETE',
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message);
//       Alert.alert('Account deleted');
//       await logout();
//     } catch (err) {
//       Alert.alert('Error', err.message);
//     }
//   };

//   // 🌍 LOCATION FETCHING
//   const fetchData = async (url, setState, key) => {
//     setLocationLoading((prev) => ({ ...prev, [key]: true }));
//     try {
//       const res = await fetch(url);
//       const data = await res.json();
//       const list = Array.isArray(data) ? data : data[key] || data.data?.[key] || [];
//       setState(list);
//     } catch (err) {
//       console.error(`Fetch ${key} error:`, err);
//     } finally {
//       setLocationLoading((prev) => ({ ...prev, [key]: false }));
//     }
//   };

//   const fetchCountries = () => fetchData(`${API_BASE_URL}/countries`, setCountries, 'countries');
//   const fetchStates = (country) =>
//     fetchData(`${API_BASE_URL}/states?country=${encodeURIComponent(country)}`, setStates, 'states');
//   const fetchCities = (country, state) =>
//     fetchData(
//       `${API_BASE_URL}/cities?country=${encodeURIComponent(country)}&state=${encodeURIComponent(state)}`,
//       setCities,
//       'cities'
//     );
//   const fetchStreets = (country, city) =>
//     fetchData(`${API_BASE_URL}/streets?country=${country}&city=${city}`, setStreets, 'streets');

//   // 👥 CONTACTS
//   const addContacts = async (userId, contacts) => {
//     if (!token) return Alert.alert('Not Authorized');
//     try {
//       const res = await fetch(`${backendBaseUrl}/api/contacts/contacts`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ userId, contacts }),
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message);
//       Alert.alert('Success', 'Contacts added');
//     } catch (err) {
//       Alert.alert('Error', err.message);
//     }
//   };

//   const getContactsByUser = async () => {
//     try {
//       const res = await fetch(`${backendBaseUrl}/api/contacts/${user?._id}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       const data = await res.json();
//       return res.ok ? data.contacts : [];
//     } catch {
//       return [];
//     }
//   };

//   const updateContacts = async (contactId, updatedFields) => {
//     try {
//       const res = await fetch(`${backendBaseUrl}/api/contacts/update/${contactId}`, {
//         method: 'PUT',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//         body: JSON.stringify(updatedFields),
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message);
//       Alert.alert('Contact updated');
//     } catch (err) {
//       Alert.alert('Error', err.message);
//     }
//   };

//   // 🧱 COMMUNITY POSTS
//   const fetchCommunityPosts = async () => {
//     try {
//       const res = await fetch(`${backendBaseUrl}/api/posts`, {
//         headers: token ? { Authorization: `Bearer ${token}` } : {},
//       });
//       const data = await res.json();
//       return res.ok ? data : [];
//     } catch {
//       return [];
//     }
//   };

//   const createCommunityPost = async (text, image = null, type = 'post') => {
//     if (!text.trim() && !image) return Alert.alert('Empty post');
//     try {
//       const res = await fetch(`${backendBaseUrl}/api/posts`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           ...(token ? { Authorization: `Bearer ${token}` } : {}),
//         },
//         body: JSON.stringify({ text, image, type }),
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message);
//       return data;
//     } catch (err) {
//       Alert.alert('Post Error', err.message);
//     }
//   };

//   const likeCommunityPost = async (postId) => {
//     try {
//       const res = await fetch(`${backendBaseUrl}/api/posts/${postId}/like`, {
//         method: 'PATCH',
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       const data = await res.json();
//       return res.ok ? data : null;
//     } catch (err) {
//       console.error('Like error:', err);
//     }
//   };

//   const updateCommunityPost = async (postId, text, image) => {
//     try {
//       const res = await fetch(`${backendBaseUrl}/api/posts/${postId}`, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ text, image }),
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message);
//       return data;
//     } catch (err) {
//       Alert.alert('Update Error', err.message);
//     }
//   };

//   const deleteCommunityPost = async (postId) => {
//     try {
//       const res = await fetch(`${backendBaseUrl}/api/posts/${postId}`, {
//         method: 'DELETE',
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message);
//       return true;
//     } catch (err) {
//       Alert.alert('Delete Error', err.message);
//       return false;
//     }
//   };

//   const submitCommunityFeedback = async (text) => {
//     if (!text.trim()) return Alert.alert('Empty feedback');
//     try {
//       const res = await fetch(`${backendBaseUrl}/api/feedback`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           ...(token ? { Authorization: `Bearer ${token}` } : {}),
//         },
//         body: JSON.stringify({ text }),
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message);
//       Alert.alert('Thank you!', 'Feedback submitted.');
//     } catch (err) {
//       Alert.alert('Error', err.message);
//     }
//   };

//   // 🚨 INCIDENTS
//   const fetchIncidents = async () => {
//     try {
//       const res = await fetch(`${backendBaseUrl}/api/incidents`, {
//         headers: token ? { Authorization: `Bearer ${token}` } : {},
//       });
//       const data = await res.json();
//       return Array.isArray(data) ? data : [];
//     } catch {
//       return [];
//     }
//   };

//   const uploadImage = async (userId, imageUri) => {
//     try {
//       if (!userId) {
//         Alert.alert("User ID missing");
//         return;
//       }

//       const formData = new FormData();
//       formData.append('image', {
//         uri: imageUri,
//         name: 'profile.jpg',
//         type: 'image/jpeg',
//       });

//       const response = await fetch(`${backendBaseUrl}/api/users/${userId}/images`, {
//         method: 'POST',
//         headers: {
//           ...(token ? { Authorization: `Bearer ${token}` } : {}),
//         },
//         body: formData,
//       });

//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(errorText);
//       }

//       const data = await response.json();

//       Alert.alert('Upload Successful', 'Profile image updated.');

//       setUser(prev => ({
//         ...prev,
//         profileImage: data.image?.imageUrl || prev.profileImage,
//       }));

//       await AsyncStorage.setItem('user', JSON.stringify({
//         ...user,
//         profileImage: data.image?.imageUrl || user.profileImage,
//       }));

//       return data;
//     } catch (err) {
//       console.error('Upload error:', err.message);
//       throw err;
//     }
//   };

//   return (
//     <UserContext.Provider
//       value={{
//         user,
//         token,
//         loading,
//         locationLoading,
//         countries,
//         states,
//         cities,
//         streets,
//         uploadImage,
//         selectedCountry,
//         selectedState,
//         selectedCity,
//         selectedStreet,
//         setSelectedCountry,
//         setSelectedState,
//         setSelectedCity,
//         setSelectedStreet,
//         setUser,
//         setToken,
//         updateUser,  // <-- added here
//         // Auth
//         login,
//         logout,
//         signUp,
//         deleteUser,
//         // Location
//         fetchCountries,
//         fetchStates,
//         fetchCities,
//         fetchStreets,
//         // Contacts
//         addContacts,
//         updateContacts,
//         getContactsByUser,
//         // Community
//         fetchCommunityPosts,
//         createCommunityPost,
//         likeCommunityPost,
//         updateCommunityPost,
//         deleteCommunityPost,
//         submitCommunityFeedback,
//         // Incidents
//         fetchIncidents,
//       }}
//     >
//       {children}
//     </UserContext.Provider>
//   );
// };

// export const useUser = () => useContext(UserContext);
