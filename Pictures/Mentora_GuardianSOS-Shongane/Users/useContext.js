// useContext.js
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
  const [emergencyContacts, setEmergencyContacts] = useState([]);


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

  // ✅ Phone number normalization
  const normalizePhone = (phone) => {
    return (phone || '').replace(/[^0-9+]/g, '');
  };

  // ✅ Fetch emergency contacts from backend
  const fetchEmergencyContactsFromAPI = async (userId, authToken) => {
    try {
      if (!userId || !authToken) {
        console.log('❌ Missing user ID or token for fetching contacts');
        return [];
      }

      const endpoint = `${backendBaseUrl}/api/contacts/${userId}`;
      console.log('🔄 Fetching emergency contacts from API:', endpoint);

      const res = await fetch(endpoint, {
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
      });

      console.log('🔍 Contacts API response status:', res.status);

      if (res.ok) {
        const data = await res.json();
        const contacts = data.contacts || [];
        console.log('✅ Emergency contacts fetched from API:', contacts.length, 'contacts found');
        
        setEmergencyContacts(contacts);
        return contacts;
      } else {
        const errorText = await res.text();
        console.error('❌ Fetch contacts API error:', errorText);
        return [];
      }
    } catch (error) {
      console.error('❌ Fetch contacts network error:', error);
      return [];
    }
  };

  // ✅ NEW FUNCTION - Refresh user data from server
  const refreshUserData = async () => {
    if (!token || !user?._id) {
      console.log('❌ Cannot refresh user data: missing token or user ID');
      return null;
    }
    
    try {
      console.log('🔄 Refreshing user data from server...');
      
      const response = await fetch(`${backendBaseUrl}/api/users/${user._id}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        const updatedUserData = await response.json();
        
        console.log('✅ User data refreshed from server:', {
          hasProfileImage: !!updatedUserData.profileImage,
          profileImage: updatedUserData.profileImage,
          email: updatedUserData.email
        });

        // Merge with existing data to preserve any local changes
        const mergedUserData = {
          ...updatedUserData,
          emergencyContacts: user.emergencyContacts || [] // Preserve existing contacts
        };

        // Update state and storage
        setUser(mergedUserData);
        await AsyncStorage.setItem('user', JSON.stringify(mergedUserData));
        
        return mergedUserData;
      } else {
        console.error('❌ Failed to refresh user data:', response.status);
        return null;
      }
    } catch (error) {
      console.error('❌ Error refreshing user data:', error);
      return null;
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
            
            console.log('👤 Loaded user data from storage:', {
              email: parsedUser.email,
              hasProfileImage: !!parsedUser.profileImage,
              profileImage: parsedUser.profileImage || 'None',
              userId: parsedUser._id
            });
            
            // ✅ AUTO-FETCH EMERGENCY CONTACTS ON RELOAD
            const userContacts = await fetchEmergencyContactsFromAPI(parsedUser._id, storedToken);
            
            // ✅ Update user with actual contacts data from API but preserve profileImage
            const updatedUser = {
              ...parsedUser, // This preserves the profileImage from storage
              emergencyContacts: userContacts
            };
            
            console.log('✅ Valid token found, auto-login user:', { 
              email: updatedUser.email,
              userId: updatedUser._id,
              hasEmergencyContacts: userContacts.length > 0,
              hasProfileImage: !!updatedUser.profileImage,
              profileImage: updatedUser.profileImage || 'None'
            });

            setUser(updatedUser);
            setToken(storedToken);
            setEmergencyContacts(userContacts);

            // ✅ Update storage with the merged data
            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

            if (updatedUser?.location?.city) {
              setSelectedCity(updatedUser.location.city);
            }
          } else {
            console.log('❌ Token invalid or expired, clearing storage');
            await AsyncStorage.multiRemove(['user', 'token']);
            setUser(null);
            setToken(null);
            setEmergencyContacts([]);
          }
        } else {
          console.log('❌ No auth data found in storage');
          setUser(null);
          setToken(null);
          setEmergencyContacts([]);
        }
      } catch (err) {
        console.error('❌ Failed to load user:', err);
        if (mounted) {
          setUser(null);
          setToken(null);
          setEmergencyContacts([]);
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

  // ✅ UPDATED: IMPROVED ONBOARDING FUNCTIONS
  const hasCompletedOnboarding = () => {
    if (!user) return false;
    
    const hasContacts = emergencyContacts && emergencyContacts.length > 0;
    const hasProfileImage = !!(user.profileImage && user.profileImage !== 'None' && user.profileImage !== '');
    
    const completed = hasContacts && hasProfileImage;
    
    console.log('🔍 Onboarding completion check:', {
      hasUser: !!user,
      hasContacts,
      hasProfileImage,
      completed,
      contactsCount: emergencyContacts.length,
      profileImage: user.profileImage || 'None'
    });
    
    return completed;
  };

  // Get detailed onboarding status
  const getOnboardingStatus = () => {
    if (!user) {
      return { 
        completed: false, 
        missingSteps: ['emergency_contacts', 'profile_image'],
        progress: 0 
      };
    }
    
    console.log('🔍 Onboarding check - user data:', {
      profileImage: user.profileImage,
      hasProfileImage: !!user.profileImage,
      emergencyContactsCount: emergencyContacts.length
    });
    
    const steps = {
      emergency_contacts: !!(emergencyContacts && emergencyContacts.length > 0),
      profile_image: !!(user.profileImage && user.profileImage !== 'None' && user.profileImage !== '')
    };
    
    const missingSteps = Object.entries(steps)
      .filter(([_, completed]) => !completed)
      .map(([step]) => step);
    
    const completedCount = Object.values(steps).filter(Boolean).length;
    const progress = (completedCount / Object.keys(steps).length) * 100;
    
    const result = {
      completed: missingSteps.length === 0,
      missingSteps,
      progress: Math.round(progress),
      steps
    };
    
    console.log('📊 Onboarding status result:', result);
    return result;
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
          updatedUser.emergencyContacts = data.contacts || emergencyContacts;
          if (data.contacts) {
            setEmergencyContacts(data.contacts);
          }
          console.log('✅ Emergency contacts step completed:', updatedUser.emergencyContacts.length, 'contacts');
          break;
          
        case 'profile_image':
          updatedUser.profileImage = data.imageUrl || user.profileImage;
          console.log('✅ Profile image step completed:', { imageUrl: data.imageUrl });
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
        ...userInfo
      };
      
      console.log('✅ Completing onboarding:', {
        userId: user._id,
        hasContacts: updatedUser.emergencyContacts?.length > 0,
        hasProfileImage: !!updatedUser.profileImage
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

  // ✅ IMPROVED LOGIN - Properly stores complete user data
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

      console.log('🔍 Backend response user data structure:', {
        keys: Object.keys(data.user),
        profileImage: data.user.profileImage,
        hasProfileImage: !!data.user.profileImage,
        fullUser: data.user
      });

      console.log('✅ Login successful, storing data...', {
        userId: data.user._id,
        profileImage: data.user.profileImage || 'None',
        hasProfileImage: !!data.user.profileImage
      });
      
      // ✅ FETCH CONTACTS AFTER LOGIN
      const userContacts = await fetchEmergencyContactsFromAPI(data.user._id, data.token);
      
      // ✅ Create complete user data object with ALL fields from backend
      const userWithContacts = {
        ...data.user, // This should include profileImage if it exists
        emergencyContacts: userContacts,
        // Ensure these fields are preserved
        _id: data.user._id,
        email: data.user.email,
        name: data.user.name || '',
        profileImage: data.user.profileImage || null, // Explicitly include profileImage
        location: data.user.location || {},
        // Include any other fields from your user model
      };
      
      console.log('📦 Complete user data to store:', {
        hasProfileImage: !!userWithContacts.profileImage,
        profileImage: userWithContacts.profileImage,
        emergencyContactsCount: userWithContacts.emergencyContacts.length
      });
      
      // ✅ Store complete user data
      await AsyncStorage.multiSet([
        ['user', JSON.stringify(userWithContacts)],
        ['token', data.token]
      ]);
      
      // ✅ Update state with complete data
      setUser(userWithContacts);
      setToken(data.token);
      setEmergencyContacts(userContacts);

      if (userWithContacts?.location?.city) {
        setSelectedCity(userWithContacts.location.city);
      }

      console.log('✅ Login complete - user should be redirected automatically');
      return userWithContacts;
    } catch (err) {
      console.error('❌ Login error:', err.message);
      Alert.alert('Login Failed', err.message);
      return null;
    }
  };

  // ✅ IMPROVED LOGOUT
  const logout = async () => {
    console.log('🚪 Logging out...');
    console.log('📸 Current profile image before logout:', user?.profileImage);
    
    try {
      // Clear authentication tokens
      await AsyncStorage.multiRemove(['token']);
      // Keep user data for debugging purposes, or remove it completely:
      // await AsyncStorage.multiRemove(['user', 'token']);
      
      setUser(null);
      setToken(null);
      setEmergencyContacts([]);
      setSelectedCity('');
      
      console.log('✅ Logout complete - authentication cleared');
    } catch (err) {
      console.error('❌ Logout error:', err);
      setUser(null);
      setToken(null);
      setEmergencyContacts([]);
    }
  };

  // ✅ SIGNUP FUNCTION
  const signUp = async (name, email, password, phoneNumber, agreeToTerms, location = {}) => {
    try {
      console.log('👤 Attempting signup for NEW user:', { email: email.trim().toLowerCase() });

      const res = await fetch(`${backendBaseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phoneNumber, agreeToTerms, location }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      Alert.alert('Success', 'Signup successful!');
      
      if (location?.city) {
        setSelectedCity(location.city);
      }
      
      if (data.user) {
        const newUser = {
          ...data.user,
          isNewAccount: true
        };
        
        setUser(newUser);
        setToken(data.token);
        setEmergencyContacts([]);
        
        await AsyncStorage.multiSet([
          ['user', JSON.stringify(newUser)],
          ['token', data.token]
        ]);
        
        console.log('✅ New account created and stored:', { userId: data.user._id, isNewAccount: true });
      }
      
      return data;
    } catch (err) {
      console.error('❌ Signup error:', err.message);
      Alert.alert('Signup Error', err.message);
      return null;
    }
  };

  // ✅ DELETE USER
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

  // 👥 CONTACTS - CREATE, READ, UPDATE, DELETE (FIXED)

  // ✅ CREATE CONTACTS (Add new contacts) - FIXED for single contact
 // ✅ CREATE CONTACTS (Add new contacts) - FIXED for single contact
const addContacts = async (userId, contacts) => {
  if (!token) {
    Alert.alert('Not Authorized', 'Please log in again');
    return null;
  }

  try {
    console.log('📞 Adding contacts for user:', userId);
    console.log('📋 Contacts to add:', contacts);

    // Use single contact endpoint that matches your backend
    const endpoint = `${backendBaseUrl}/api/contacts/${userId}`;
    console.log('🔗 Calling endpoint:', endpoint);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(contacts[0]), // Send single contact
    });

    console.log('🔍 Response status:', res.status);
    
    const responseText = await res.text();
    console.log('📄 Raw response:', responseText);

    if (!res.ok) {
      throw new Error(responseText || 'Failed to add contact');
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      throw new Error('Server returned invalid JSON format');
    }

    // ✅ TRACK CONTACT ADDITION FOR RECENT ALERTS
    if (data && data.contact) {
      const newContactAlert = {
        id: generateId(),
        type: 'contact_added',
        title: 'Emergency Contact Added',
        message: `${data.contact.name || 'New contact'} was added to your emergency contacts`,
        contactName: data.contact.name,
        timestamp: new Date().toISOString(),
        icon: 'user-plus'
      };
      
      setContactUpdates(prev => [newContactAlert, ...prev.slice(0, 4)]);
    }

    await fetchEmergencyContactsFromAPI(userId, token);
    
    console.log('✅ Contact added successfully');
    return data;

  } catch (err) {
    console.error('❌ Add contacts error:', err.message);
    Alert.alert('Error', err.message);
    return null;
  }
};

  // ✅ READ CONTACTS (Get all contacts)
  const getContactsByUser = async () => {
    try {
      if (!user?._id || !token) {
        console.log('❌ Missing user ID or token');
        return emergencyContacts;
      }

      const contacts = await fetchEmergencyContactsFromAPI(user._id, token);
      return contacts;
    } catch (error) {
      console.error('❌ Get contacts network error:', error);
      return emergencyContacts;
    }
  };

  // ✅ UPDATE CONTACT (Update specific contact) - FIXED
  const updateContacts = async (contactId, updatedFields) => {
    try {
      if (!token || !user?._id) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      console.log('📝 Updating contact:', contactId, 'with:', updatedFields);
      
      // Use the correct endpoint that matches your backend
      const res = await fetch(`${backendBaseUrl}/api/contacts/${user._id}/${contactId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(updatedFields),
      });
      
      const responseText = await res.text();
      console.log('🔍 Update response:', responseText);

      if (!res.ok) {
        throw new Error(responseText || 'Failed to update contact');
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        throw new Error('Server returned invalid response');
      }
      
      // Refresh contacts from backend
      await fetchEmergencyContactsFromAPI(user._id, token);
      
      console.log('✅ Contact updated successfully');
      return data;
    } catch (err) {
      console.error('❌ Update contacts error:', err.message);
      Alert.alert('Error', err.message);
      throw err;
    }
  };

  // ✅ DELETE CONTACT (Remove specific contact) - FIXED
  const deleteContact = async (contactId) => {
    try {
      if (!token || !user?._id) {
        Alert.alert('Error', 'Authentication required');
        return false;
      }

      console.log('🗑️ Deleting contact:', contactId);
      
      // Use the correct endpoint that matches your backend
      const res = await fetch(`${backendBaseUrl}/api/contacts/${user._id}/${contactId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}` 
        },
      });
      
      const responseText = await res.text();
      console.log('🔍 Delete response:', responseText);

      if (!res.ok) {
        throw new Error(responseText || 'Failed to delete contact');
      }

      // Refresh contacts from backend
      await fetchEmergencyContactsFromAPI(user._id, token);
      
      console.log('✅ Contact deleted successfully');
      return true;
    } catch (err) {
      console.error('❌ Delete contact error:', err.message);
      Alert.alert('Error', err.message);
      throw err;
    }
  };

  // ✅ REPLACE ALL CONTACTS (For bulk operations)
  const replaceAllContacts = async (userId, contacts) => {
    try {
      if (!token) {
        Alert.alert('Not Authorized', 'Please log in again');
        return null;
      }

      console.log('🔄 Replacing all contacts for user:', userId);
      console.log('📋 New contacts set:', contacts);

      // Since your backend doesn't have a bulk replace endpoint, we'll delete all and add new ones
      const currentContacts = await fetchEmergencyContactsFromAPI(userId, token);
      
      // Delete all existing contacts
      for (const contact of currentContacts) {
        await deleteContact(contact._id || contact.id);
      }
      
      // Add new contacts one by one
      const results = [];
      for (const contact of contacts) {
        const result = await addContacts(userId, [contact]);
        if (result) {
          results.push(result);
        }
      }
      
      console.log('✅ All contacts replaced successfully');
      return { contacts: results };
    } catch (error) {
      console.error('❌ Replace contacts error:', error);
      Alert.alert('Error', error.message);
      return null;
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

  // 🖼️ Upload Profile Image
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
      setEmergencyContacts(contacts);
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
      
      console.log('✅ Profile image updated in user data:', imageUrl);
    } catch (err) {
      console.error('❌ Error updating profile image:', err);
    }
  };

  // ✅ Refresh emergency contacts manually
  const refreshEmergencyContacts = async () => {
    if (user?._id && token) {
      return await fetchEmergencyContactsFromAPI(user._id, token);
    }
    return [];
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
        refreshUserData, // ✅ NEW: Add refresh function
        
        // Onboarding Functions
        hasCompletedOnboarding,
        getOnboardingStatus,
        completeOnboardingStep,
        requiresOnboarding,
        updateUserEmergencyContacts,
        updateUserProfileImage,
        
        // Emergency Contacts
        emergencyContacts,
        setEmergencyContacts,
        refreshEmergencyContacts,
        
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
        
        // Contacts - FULL CRUD OPERATIONS (FIXED)
        addContacts,           // CREATE - Now works with single contacts
        getContactsByUser,     // READ  
        updateContacts,        // UPDATE single contact - FIXED endpoints
        deleteContact,         // DELETE single contact - FIXED endpoints
        replaceAllContacts,    // REPLACE all contacts
        
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