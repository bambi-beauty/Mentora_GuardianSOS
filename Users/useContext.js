import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';

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

  // New onboarding state
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  // 🛠️ Backend
  const API_BASE_URL = 'https://getlocations.onrender.com';
  const backendBaseUrl = 'http://192.168.137.1:3000'; // ✅ fixed

  const isValidToken = (t) => {
    try {
      const decoded = jwtDecode(t);
      return decoded.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  };

  // 🔁 Load user from storage
  useEffect(() => {
    (async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const storedToken = await AsyncStorage.getItem('token');
        const onboardingFlag = await AsyncStorage.getItem('onboardingComplete');

        if (storedUser && storedToken && isValidToken(storedToken)) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setToken(storedToken);

          // ✅ Automatically set selected city if user has location info
          if (parsedUser?.location?.city) {
            setSelectedCity(parsedUser.location.city);
          }
        } else {
          await AsyncStorage.multiRemove(['user', 'token']);
          setUser(null);
          setToken(null);
        }

        if (onboardingFlag === 'true') setOnboardingComplete(true);
      } catch (err) {
        console.error('Failed to load user:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ✅ Keep selectedCity updated if user changes
  useEffect(() => {
    if (user?.location?.city && !selectedCity) {
      setSelectedCity(user.location.city);
    }
  }, [user]);

  // ✅ Mark onboarding complete
  const completeOnboarding = async (userInfo) => {
    try {
      setUser((prev) => ({ ...prev, ...userInfo }));
      setOnboardingComplete(true);
      await AsyncStorage.setItem('onboardingComplete', 'true');

      if (user) {
        await AsyncStorage.setItem('user', JSON.stringify({ ...user, ...userInfo }));
      }

      // ✅ If onboarding provides city, store it
      if (userInfo?.location?.city) {
        setSelectedCity(userInfo.location.city);
      }
    } catch (err) {
      console.error('Error completing onboarding:', err);
    }
  };

  // 🧱 AUTH SECTION
  const login = async (email, password, rememberMe = false) => {
    if (!email || !password) return Alert.alert('Error', 'Please fill all fields');
    try {
      const res = await fetch(`${backendBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      setUser(data.user);
      setToken(data.token);

      // ✅ Automatically set selectedCity on login
      if (data.user?.location?.city) {
        setSelectedCity(data.user.location.city);
      }

      if (rememberMe) {
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        await AsyncStorage.setItem('token', data.token);
      }

      return data.user;
    } catch (err) {
      console.error('Login error:', err.message);
      Alert.alert('Login Failed', err.message);
      return null;
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['user', 'token']);
    setUser(null);
    setToken(null);
    setSelectedCity(''); // ✅ reset city
  };

  const signUp = async (name, email, password, phoneNumber, agreeToTerms, location = {}) => {
    try {
      const res = await fetch(`${backendBaseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phoneNumber, agreeToTerms, location }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      Alert.alert('Success', 'Signup successful! Please verify your email.');

      // ✅ If location provided during signup, save it
      if (location?.city) {
        setSelectedCity(location.city);
      }

      return data;
    } catch (err) {
      Alert.alert('Signup Error', err.message);
    }
  };

  const deleteUser = async () => {
    try {
      const res = await fetch(`${backendBaseUrl}/api/auth/deleteuser`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      Alert.alert('Account deleted');
      await logout();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  // 🌍 LOCATION FETCHING
  const fetchData = async (url, setState, key) => {
    setLocationLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await fetch(url);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data[key] || data.data?.[key] || [];
      setState(list);
    } catch (err) {
      console.error(`Fetch ${key} error:`, err);
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

  // 👥 CONTACTS
  const addContacts = async (userId, contacts) => {
    if (!token) return Alert.alert('Not Authorized');
    try {
      const res = await fetch(`${backendBaseUrl}/api/contacts/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId, contacts }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      Alert.alert('Success', 'Contacts added');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const getContactsByUser = async () => {
    try {
      const res = await fetch(`${backendBaseUrl}/api/contacts/${user?._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      return res.ok ? data.contacts : [];
    } catch {
      return [];
    }
  };

  const updateContacts = async (contactId, updatedFields) => {
    try {
      const res = await fetch(`${backendBaseUrl}/api/contacts/update/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updatedFields),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      Alert.alert('Contact updated');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  // 🧱 COMMUNITY POSTS
  const fetchCommunityPosts = async () => {
    try {
      const res = await fetch(`${backendBaseUrl}/api/posts`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      return res.ok ? data : [];
    } catch {
      return [];
    }
  };

  const createCommunityPost = async (text, image = null, type = 'post') => {
    if (!text.trim() && !image) return Alert.alert('Empty post');
    try {
      const res = await fetch(`${backendBaseUrl}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text, image, type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      return data;
    } catch (err) {
      Alert.alert('Post Error', err.message);
    }
  };

  const likeCommunityPost = async (postId) => {
    try {
      const res = await fetch(`${backendBaseUrl}/api/posts/${postId}/like`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      return res.ok ? data : null;
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const updateCommunityPost = async (postId, text, image) => {
    try {
      const res = await fetch(`${backendBaseUrl}/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text, image }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      return data;
    } catch (err) {
      Alert.alert('Update Error', err.message);
    }
  };

  const deleteCommunityPost = async (postId) => {
    try {
      const res = await fetch(`${backendBaseUrl}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      return true;
    } catch (err) {
      Alert.alert('Delete Error', err.message);
      return false;
    }
  };

  const submitCommunityFeedback = async (text) => {
    if (!text.trim()) return Alert.alert('Empty feedback');
    try {
      const res = await fetch(`${backendBaseUrl}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      Alert.alert('Feedback submitted');
    } catch (err) {
      Alert.alert('Feedback Error', err.message);
    }
  };

  // 🖼️ Upload Profile Image
  const uploadImage = async (userId, imageUri) => {
    try {
      if (!userId) {
        Alert.alert('User ID missing');
        return;
      }

      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        name: 'profile.jpg',
        type: 'image/jpeg',
      });

      const response = await fetch(`${backendBaseUrl}/api/users/${userId}/images`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const data = await response.json();
      Alert.alert('Upload Successful', 'Profile image updated.');

      setUser((prev) => ({
        ...prev,
        profileImage: data.image?.imageUrl || prev.profileImage,
      }));

      await AsyncStorage.setItem(
        'user',
        JSON.stringify({
          ...user,
          profileImage: data.image?.imageUrl || user.profileImage,
        })
      );

      return data;
    } catch (err) {
      console.error('Upload error:', err.message);
      throw err;
    }
  };

  // ✅ Context Provider
  return (
    <UserContext.Provider
      value={{
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
        addContacts,
        getContactsByUser,
        updateContacts,
        fetchCommunityPosts,
        createCommunityPost,
        likeCommunityPost,
        updateCommunityPost,
        deleteCommunityPost,
        submitCommunityFeedback,
        onboardingComplete,
        completeOnboarding,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);


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
