import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Linking,
  Image,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import styles from './CommunityStyles';
import IncidentModal from './IncidentModel';
import NeighborhoodWatchScreen from './NeighborhoodWatch';
import { useUser } from '../../Users/useContext';
import { usePosts } from '../../postContext/postContext';

// ✅ NEW IMPORT
import NewsScreen from './NewsScreen';

const CommunityScreen = () => {
  const { user, selectedCity } = useUser();
  const {
    posts,
    createPost,
    updatePost,
    deletePost,
    likePost,
    addComment,
    updateComment,
    deleteComment,
  } = usePosts();

  const [hamburgerVisible, setHamburgerVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(300));
  const [activeMenu, setActiveMenu] = useState('Community');

  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [editingPost, setEditingPost] = useState(null);

  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [editingComment, setEditingComment] = useState(null);

  const [incidentModalVisible, setIncidentModalVisible] = useState(false);
  const [weatherData, setWeatherData] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need media access to upload images.');
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled) setPostImage(result.assets[0].uri);
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const fetchWeather = async () => {
    try {
      const apiKey = 'a6e19322fac004f86582b7b948ee41cc';
      const city = selectedCity || 'Johannesburg';
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
      );
      const data = await response.json();
      setWeatherData(data);
    } catch (error) {
      setWeatherData({ main: { temp: 22 }, weather: [{ description: 'clear sky' }] });
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  const handleSubmitPost = async () => {
    if (!postText.trim() && !postImage)
      return Alert.alert('Empty Post', 'Add text or an image before posting.');

    if (editingPost) {
      await updatePost(editingPost._id, postText, postImage);
      setEditingPost(null);
    } else {
      await createPost(postText, postImage);
    }
    setPostText('');
    setPostImage(null);
  };

  const handleDeletePost = async (id) => {
    Alert.alert('Delete Post', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePost(id) },
    ]);
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setPostText(post.text);
    setPostImage(post.image || null);
  };

  const handleLike = async (postId) => {
    await likePost(postId);
  };

  const openComments = (post) => {
    setSelectedPost(post);
    setCommentText('');
    setEditingComment(null);
    setCommentModalVisible(true);
  };

  useEffect(() => {
    if (selectedPost) {
      const updated = posts.find((p) => p._id === selectedPost._id);
      if (updated) setSelectedPost(updated);
    }
  }, [posts]);

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;

    if (editingComment) {
      await updateComment(selectedPost._id, editingComment._id, commentText);
      setEditingComment(null);
    } else {
      await addComment(selectedPost._id, commentText);
    }
    setCommentText('');
  };

  const handleEditComment = (comment) => {
    setEditingComment(comment);
    setCommentText(comment.text);
  };

  const handleDeleteComment = async (commentId) => {
    await deleteComment(selectedPost._id, commentId);
  };

  const toggleHamburger = () => {
    if (!hamburgerVisible) {
      setHamburgerVisible(true);
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 300, duration: 300, useNativeDriver: true }).start(() =>
        setHamburgerVisible(false)
      );
    }
  };

  const renderPost = ({ item }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.user?.name ? item.user.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <View>
            <Text style={styles.postUser}>{item.user?.name || 'Unknown User'}</Text>
            <Text style={styles.postTime}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        {user?._id === item.user?._id && (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={() => handleEditPost(item)}>
              <FontAwesome name="edit" size={18} color="#2A5B8C" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeletePost(item._id)}>
              <FontAwesome name="trash" size={18} color="red" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={styles.postText}>{item.text}</Text>
      {item.image && <Image source={{ uri: item.image }} style={styles.postImage} />}

      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(item._id)}>
          <FontAwesome
            name={item.likes?.includes(user?._id) ? 'thumbs-up' : 'thumbs-o-up'}
            size={16}
            color={item.likes?.includes(user?._id) ? '#2A5B8C' : '#666'}
          />
          <Text style={styles.actionText}>{item.likes?.length || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => openComments(item)}>
          <FontAwesome name="comment" size={16} color="#666" />
          <Text style={styles.actionText}>{item.comments?.length || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => setIncidentModalVisible(true)}>
          <FontAwesome name="exclamation-triangle" size={16} color="#E74C3C" />
          <Text style={styles.actionText}>Report</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={{ alignSelf: 'flex-end', margin: 15 }} onPress={toggleHamburger}>
        <FontAwesome name="bars" size={24} color="#2A5B8C" />
      </TouchableOpacity>

      {/* 🏠 Community Tab */}
      {activeMenu === 'Community' && (
        <ScrollView>
          {weatherData && (
            <View style={styles.weatherBanner}>
              <Text style={styles.weatherIcon}>🌤</Text>
              <Text style={styles.weatherMessage}>
                {weatherData.main.temp}°C, {weatherData.weather[0].description}
              </Text>
            </View>
          )}

          <View style={styles.createPostSection}>
            <Text style={styles.sectionTitle}>{editingPost ? 'Edit Post' : 'Create Post'}</Text>
            <TextInput
              style={styles.postInput}
              placeholder="Share an update..."
              value={postText}
              onChangeText={setPostText}
              multiline
            />
            {postImage && <Image source={{ uri: postImage }} style={styles.previewImage} />}

            <View style={styles.postActionsRow}>
              <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                <FontAwesome name="image" size={20} color="#2A5B8C" />
                <Text style={styles.buttonText}>Add Image</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.submitPostButton} onPress={handleSubmitPost}>
                <FontAwesome name="send" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>{editingPost ? 'Update' : 'Post'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {posts.map((p) => (
            <View key={p._id}>{renderPost({ item: p })}</View>
          ))}
        </ScrollView>
      )}

      {/* 🛡 Neighborhood Tab */}
      {activeMenu === 'Neighborhood' && <NeighborhoodWatchScreen />}

      {/* 📰 News Tab */}
      {activeMenu === 'News' && <NewsScreen />}

      {/* 💬 Comment Modal */}
      <Modal visible={commentModalVisible} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Comments</Text>
            <TouchableOpacity onPress={() => setCommentModalVisible(false)}>
              <FontAwesome name="times" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView>
            {selectedPost?.comments?.map((c) => (
              <View key={c._id} style={styles.commentCard}>
                <Text style={styles.commentUser}>{c.user?.name || 'User'}</Text>
                <Text style={styles.commentText}>{c.text}</Text>
                {c.user?._id === user?._id && (
                  <View style={styles.commentActions}>
                    <TouchableOpacity onPress={() => handleEditComment(c)}>
                      <FontAwesome name="edit" size={16} color="#2A5B8C" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteComment(c._id)}>
                      <FontAwesome name="trash" size={16} color="red" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          <View style={styles.commentInputContainer}>
            <TextInput
              placeholder="Write a comment..."
              value={commentText}
              onChangeText={setCommentText}
              style={styles.commentInput}
            />
            <TouchableOpacity style={styles.commentSendBtn} onPress={handleCommentSubmit}>
              <FontAwesome name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* 🚨 Incident Modal */}
      <IncidentModal
        visible={incidentModalVisible}
        onClose={() => setIncidentModalVisible(false)}
        user={user}
      />

      {/* 🍔 Hamburger Menu */}
      {hamburgerVisible && (
        <Animated.View style={[styles.hamburgerMenu, { transform: [{ translateX: slideAnim }] }]}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Welcome, {user?.name || 'User'}!</Text>
          </View>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setActiveMenu('Community');
              toggleHamburger();
            }}
          >
            <FontAwesome name="users" size={20} color="#2A5B8C" />
            <Text style={styles.menuText}>Community</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setActiveMenu('Neighborhood');
              toggleHamburger();
            }}
          >
            <FontAwesome name="shield" size={20} color="#2A5B8C" />
            <Text style={styles.menuText}>Neighborhood Watch</Text>
          </TouchableOpacity>

          {/* 📰 NEW Get News Menu Item */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setActiveMenu('News');
              toggleHamburger();
            }}
          >
            <FontAwesome name="newspaper-o" size={20} color="#2A5B8C" />
            <Text style={styles.menuText}>Get News</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setIncidentModalVisible(true);
              toggleHamburger();
            }}
          >
            <FontAwesome name="exclamation-triangle" size={20} color="#E74C3C" />
            <Text style={styles.menuText}>Report Incident</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Linking.openURL('mailto:support@neighborhoodapp.com')}
          >
            <FontAwesome name="envelope" size={20} color="#2A5B8C" />
            <Text style={styles.menuText}>Contact Support</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Coming Soon', 'Settings will be available soon!')}
          >
            <FontAwesome name="cog" size={20} color="#2A5B8C" />
            <Text style={styles.menuText}>Settings</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

export default CommunityScreen;


// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   TextInput,
//   TouchableOpacity,
//   ScrollView,
//   Modal,
//   Linking,
//   Image,
//   Alert,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { FontAwesome } from '@expo/vector-icons';
// import * as ImagePicker from 'expo-image-picker';
// import styles from './CommunityStyles';
// import IncidentModal from './IncidentModel';
// import NeighborhoodWatchScreen from './NeighborhoodWatch';
// import { useUser } from '../../Users/useContext';
// import { usePosts } from '../../postContext/postContext';

// const CommunityScreen = () => {
//   const { user, token, selectedCity } = useUser();
//   const {
//     posts,
//     createPost,
//     likePost,
//     fetchPosts,
//     loadingPosts,
//   } = usePosts();

//   const [hamburgerVisible, setHamburgerVisible] = useState(false);
//   const [postText, setPostText] = useState('');
//   const [postImage, setPostImage] = useState(null);
//   const [weatherData, setWeatherData] = useState(null);
//   const [feedbackList, setFeedbackList] = useState([]);
//   const [incidentModalVisible, setIncidentModalVisible] = useState(false);
//   const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
//   const [feedbackText, setFeedbackText] = useState('');
//   const [activeMenu, setActiveMenu] = useState('Community');

//   // 🔑 Request permission for image picker
//   useEffect(() => {
//     (async () => {
//       const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//       if (status !== 'granted') {
//         Alert.alert(
//           'Permission required',
//           'Sorry, we need camera roll permissions to upload images.'
//         );
//       }
//     })();
//   }, []);

//   // 📷 Pick an image
//   const pickImage = async () => {
//     try {
//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsEditing: true,
//         aspect: [4, 3],
//         quality: 0.8,
//       });
//       if (!result.canceled) {
//         setPostImage(result.assets[0].uri);
//       }
//     } catch (error) {
//       Alert.alert('Error', 'Failed to pick image');
//     }
//   };

//   // 🌦 Fetch weather data
//   const fetchWeather = async () => {
//     try {
//       const apiKey = 'a6e19322fac004f86582b7b948ee41cc';
//       const city = selectedCity || 'Johannesburg';
//       const response = await fetch(
//         `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
//       );
//       const data = await response.json();
//       setWeatherData(data);
//     } catch (error) {
//       console.error('Weather API error:', error);
//       setWeatherData({
//         main: { temp: 22 },
//         weather: [{ main: 'Clear', description: 'clear sky' }],
//       });
//     }
//   };

//   useEffect(() => {
//     fetchWeather();
//   }, []);

//   const safetyResources = [
//     { id: 1, label: 'Emergency Police', contact: '10111', type: 'phone' },
//     { id: 2, label: 'Fire Department', contact: '10112', type: 'phone' },
//     { id: 3, label: 'Medical Emergency', contact: '10113', type: 'phone' },
//     { id: 4, label: 'Local Health Clinic', contact: '011-2345678', type: 'phone' },
//     { id: 5, label: 'Safety Guidelines', contact: '', type: 'info' },
//     { id: 6, label: 'Emergency Procedures', contact: '', type: 'info' },
//   ];

//   const getWeatherIcon = (condition) => {
//     const lower = condition.toLowerCase();
//     if (lower.includes('clear')) return '☀';
//     if (lower.includes('rain')) return '🌧';
//     if (lower.includes('cloud')) return '☁';
//     if (lower.includes('storm')) return '⛈';
//     if (lower.includes('snow')) return '❄';
//     return '🌤';
//   };

//   const getWeatherStyle = (weather) => {
//     const lower = weather.toLowerCase();
//     if (lower.includes('clear')) return styles.weatherSunny;
//     if (lower.includes('rain')) return styles.weatherRainy;
//     if (lower.includes('storm')) return styles.weatherStormy;
//     if (lower.includes('snow')) return styles.weatherSnowy;
//     return styles.weatherDefault;
//   };

//   const handleMenuAction = (menuItem) => {
//     setHamburgerVisible(false);
//     switch (menuItem) {
//       case 'Incident Reporting':
//         setIncidentModalVisible(true);
//         setActiveMenu('Community');
//         break;
//       case 'Safety Resources':
//         setActiveMenu('Safety');
//         break;
//       case 'Neighborhood Watch':
//         setActiveMenu('Neighborhood');
//         break;
//       case 'Feedback':
//         setFeedbackModalVisible(true);
//         setActiveMenu('Community');
//         break;
//       default:
//         setActiveMenu('Community');
//     }
//   };

//   // 📝 Submit new post (real-time via PostContext)
//   const submitPost = async () => {
//     if (!postText.trim() && !postImage) {
//       Alert.alert('Empty post', 'Please add text or an image to share.');
//       return;
//     }
//     await createPost(postText, postImage);
//     setPostText('');
//     setPostImage(null);
//   };

//   // ❤️ Like post in real-time
//   const handleLike = async (postId) => {
//     await likePost(postId);
//   };

//   // 💬 Submit feedback
//   const submitFeedback = () => {
//     if (!feedbackText.trim()) {
//       Alert.alert('Empty feedback', 'Please write your feedback before submitting.');
//       return;
//     }
//     const newFeedback = {
//       id: Date.now(),
//       text: feedbackText,
//       timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//       date: new Date().toLocaleDateString(),
//     };
//     setFeedbackList([newFeedback, ...feedbackList]);
//     setFeedbackText('');
//     setFeedbackModalVisible(false);
//     Alert.alert('Thank you!', 'Your feedback has been submitted to the administrators.');
//   };

//   // 📞 Call contacts
//   const handleCallContact = (contact) => {
//     if (contact) Linking.openURL(`tel:${contact}`);
//   };

//   // 🧾 Render post
//   const renderPost = ({ item }) => (
//     <View style={styles.postCard}>
//       <View style={styles.postHeader}>
//         <View style={styles.userInfo}>
//           <View style={styles.avatar}>
//             <Text style={styles.avatarText}>
//               {item.user?.name ? item.user.name.charAt(0).toUpperCase() : 'U'}
//             </Text>
//           </View>
//           <View>
//             <Text style={styles.postUser}>{item.user?.name || 'Unknown User'}</Text>
//             <Text style={styles.postTime}>
//               {item.createdAt
//                 ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
//                 : item.timestamp || '--:--'}
//             </Text>
//           </View>
//         </View>

//         {item.type === 'incident' && (
//           <View style={styles.incidentBadge}>
//             <FontAwesome name="exclamation-triangle" size={12} color="#FFFFFF" />
//             <Text style={styles.incidentBadgeText}>Incident</Text>
//           </View>
//         )}
//       </View>

//       <Text style={styles.postText}>{item.text}</Text>
//       {item.image && <Image source={{ uri: item.image }} style={styles.postImage} />}

//       <View style={styles.postActions}>
//         <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(item._id)}>
//           <FontAwesome name="thumbs-up" size={16} color="#666" />
//           <Text style={styles.actionText}>{item.likes?.length || 0}</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.actionBtn}>
//           <FontAwesome name="comment" size={16} color="#666" />
//           <Text style={styles.actionText}>{item.comments?.length || 0}</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.actionBtn}>
//           <FontAwesome name="share" size={16} color="#666" />
//           <Text style={styles.actionText}>Share</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );

//   const renderResource = ({ item }) => (
//     <TouchableOpacity
//       style={styles.resourceCard}
//       onPress={() => (item.type === 'phone' ? handleCallContact(item.contact) : null)}
//     >
//       <View style={styles.resourceHeader}>
//         <View style={styles.resourceIcon}>
//           <FontAwesome
//             name={item.type === 'phone' ? 'phone' : 'info-circle'}
//             size={20}
//             color="#2A5B8C"
//           />
//         </View>
//         <View style={styles.resourceInfo}>
//           <Text style={styles.resourceLabel}>{item.label}</Text>
//           {item.contact ? (
//             <Text style={styles.resourceContact}>{item.contact}</Text>
//           ) : (
//             <Text style={styles.resourceDescription}>Tap to view information</Text>
//           )}
//         </View>
//       </View>
//     </TouchableOpacity>
//   );

//   // 🏡 Render
//   return (
//     <SafeAreaView style={styles.container}>
//       {/* 🍔 Hamburger */}
//       <TouchableOpacity
//         style={{ alignSelf: 'flex-end', margin: 15 }}
//         onPress={() => setHamburgerVisible(true)}
//       >
//         <FontAwesome name="bars" size={24} color="#2A5B8C" />
//       </TouchableOpacity>

//       {/* 📜 Hamburger Menu */}
//       <Modal visible={hamburgerVisible} transparent animationType="fade">
//         <TouchableOpacity
//           style={styles.hamburgerOverlay}
//           activeOpacity={1}
//           onPress={() => setHamburgerVisible(false)}
//         >
//           <View style={styles.hamburgerMenu} onStartShouldSetResponder={() => true}>
//             {['Community Feed', 'Incident Reporting', 'Safety Resources', 'Neighborhood Watch', 'Feedback'].map(
//               (menu, idx) => (
//                 <TouchableOpacity key={idx} style={styles.menuItem} onPress={() => handleMenuAction(menu)}>
//                   <FontAwesome
//                     name={
//                       menu === 'Community Feed'
//                         ? 'home'
//                         : menu === 'Incident Reporting'
//                         ? 'exclamation-triangle'
//                         : menu === 'Safety Resources'
//                         ? 'shield'
//                         : menu === 'Neighborhood Watch'
//                         ? 'binoculars'
//                         : 'comment'
//                     }
//                     size={18}
//                     color="#333"
//                   />
//                   <Text style={styles.menuText}>{menu}</Text>
//                 </TouchableOpacity>
//               )
//             )}
//           </View>
//         </TouchableOpacity>
//       </Modal>

//       {/* 🧭 Active Screens */}
//       {activeMenu === 'Community' && (
//         <ScrollView contentContainerStyle={styles.listContent}>
//           <View style={styles.communityWelcome}>
//             <Text style={styles.welcomeTitle}>Welcome to your community space!</Text>
//             <Text style={styles.welcomeText}>
//               Share updates, ask for help, and stay connected with your neighbors.
//             </Text>
//           </View>

//           {weatherData && (
//             <View style={[styles.weatherBanner, getWeatherStyle(weatherData.weather[0].main)]}>
//               <Text style={styles.weatherIcon}>{getWeatherIcon(weatherData.weather[0].main)}</Text>
//               <View style={styles.weatherInfo}>
//                 <Text style={styles.weatherTitle}>Local Weather</Text>
//                 <Text style={styles.weatherMessage}>
//                   {weatherData.main.temp}°C, {weatherData.weather[0].description}
//                 </Text>
//               </View>
//             </View>
//           )}

//           {/* ✏ Create Post */}
//           <View style={styles.createPostSection}>
//             <Text style={styles.sectionTitle}>Share with Community</Text>
//             <TextInput
//               style={styles.postInput}
//               placeholder="Share a safety tip, update, or question..."
//               value={postText}
//               onChangeText={setPostText}
//               multiline
//             />
//             {postImage && <Image source={{ uri: postImage }} style={styles.previewImage} />}

//             <View style={styles.postActionsRow}>
//               <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
//                 <FontAwesome name="image" size={20} color="#2A5B8C" />
//                 <Text style={styles.buttonText}>Add Image</Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={[
//                   styles.submitPostButton,
//                   (!postText.trim() && !postImage) && styles.submitPostButtonDisabled,
//                 ]}
//                 onPress={submitPost}
//                 disabled={!postText.trim() && !postImage}
//               >
//                 <FontAwesome name="send" size={20} color="white" />
//                 <Text style={styles.submitButtonText}>Post</Text>
//               </TouchableOpacity>
//             </View>
//           </View>

//           <View style={styles.sectionHeader}>
//             <Text style={styles.sectionTitle}>Latest Activity</Text>
//             <Text style={styles.postCount}>{posts.length} posts</Text>
//           </View>

//           {posts.map((post) => (
//             <View key={post._id || post.id}>{renderPost({ item: post })}</View>
//           ))}
//         </ScrollView>
//       )}

//       {activeMenu === 'Safety' && (
//         <FlatList
//           data={safetyResources}
//           renderItem={renderResource}
//           keyExtractor={(item) => item.id.toString()}
//           contentContainerStyle={styles.listContent}
//           showsVerticalScrollIndicator={false}
//         />
//       )}

//       {activeMenu === 'Neighborhood' && <NeighborhoodWatchScreen />}

//       {/* 🚨 Incident Modal */}
//       <IncidentModal
//         visible={incidentModalVisible}
//         onClose={() => setIncidentModalVisible(false)}
//         onSubmit={(report) => {
//           createPost(
//             `Incident Report: ${report.type} at ${report.location}. ${report.description}`,
//             null,
//             'incident'
//           );
//           setIncidentModalVisible(false);
//           Alert.alert('Report Submitted', 'Thank you for reporting this incident.');
//         }}
//       />

//       {/* 💬 Feedback Modal */}
//       <Modal
//         animationType="slide"
//         visible={feedbackModalVisible}
//         onRequestClose={() => setFeedbackModalVisible(false)}
//       >
//         <SafeAreaView style={styles.modalContainer}>
//           <View style={styles.modalHeader}>
//             <Text style={styles.modalTitle}>Submit Feedback</Text>
//             <TouchableOpacity onPress={() => setFeedbackModalVisible(false)}>
//               <FontAwesome name="times" size={24} color="#333" />
//             </TouchableOpacity>
//           </View>

//           <ScrollView style={styles.modalContent}>
//             <TextInput
//               style={[styles.inputField, styles.textArea]}
//               placeholder="Write your feedback here..."
//               value={feedbackText}
//               onChangeText={setFeedbackText}
//               multiline
//             />
//             <TouchableOpacity
//               style={[styles.submitButton, !feedbackText.trim() && styles.submitButtonDisabled]}
//               onPress={submitFeedback}
//               disabled={!feedbackText.trim()}
//             >
//               <Text style={styles.submitButtonText}>Submit Feedback</Text>
//             </TouchableOpacity>
//           </ScrollView>
//         </SafeAreaView>
//       </Modal>
//     </SafeAreaView>
//   );
// };

// export default CommunityScreen;
