// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   ScrollView,
//   TextInput,
//   TouchableOpacity,
//   Modal,
//   Linking,
//   Image,
//   Alert,
//   Animated,
//   ActivityIndicator,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { FontAwesome } from '@expo/vector-icons';
// import * as ImagePicker from 'expo-image-picker';
// import styles from './CommunityStyles';
// import IncidentModal from './IncidentModel';
// import NeighborhoodWatchScreen from './NeighborhoodWatch';
// import { useUser } from '../../Users/useContext';
// import { usePosts } from '../../postContext/postContext';
// import NewsScreen from './NewsScreen';

// const CommunityScreen = () => {
//   const { user, selectedCity } = useUser();
//   const {
//     posts,
//     createPost,
//     updatePost,
//     deletePost,
//     likePost,
//     addComment,
//     updateComment,
//     deleteComment,
//   } = usePosts();

//   const [hamburgerVisible, setHamburgerVisible] = useState(false);
//   const [slideAnim] = useState(new Animated.Value(300));
//   const [activeMenu, setActiveMenu] = useState('Community');

//   const [postText, setPostText] = useState('');
//   const [postImage, setPostImage] = useState(null);
//   const [editingPost, setEditingPost] = useState(null);

//   const [commentModalVisible, setCommentModalVisible] = useState(false);
//   const [selectedPost, setSelectedPost] = useState(null);
//   const [commentText, setCommentText] = useState('');
//   const [editingComment, setEditingComment] = useState(null);

//   const [incidentModalVisible, setIncidentModalVisible] = useState(false);
//   const [weatherData, setWeatherData] = useState(null);

//   useEffect(() => {
//     (async () => {
//       const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//       if (status !== 'granted') {
//         Alert.alert('Permission required', 'We need media access to upload images.');
//       }
//     })();
//   }, []);

//   const pickImage = async () => {
//     try {
//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsEditing: true,
//         aspect: [4, 3],
//         quality: 0.8,
//       });
//       if (!result.canceled) setPostImage(result.assets[0].uri);
//     } catch (error) {
//       Alert.alert('Error', 'Failed to pick image');
//     }
//   };

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
//       setWeatherData({ main: { temp: 22 }, weather: [{ description: 'clear sky' }] });
//     }
//   };

//   useEffect(() => {
//     fetchWeather();
//   }, []);

//   const handleSubmitPost = async () => {
//     if (!postText.trim() && !postImage)
//       return Alert.alert('Empty Post', 'Add text or an image before posting.');

//     if (editingPost) {
//       await updatePost(editingPost._id, postText, postImage);
//       setEditingPost(null);
//     } else {
//       await createPost(postText, postImage);
//     }
//     setPostText('');
//     setPostImage(null);
//   };

//   const handleDeletePost = async (id) => {
//     Alert.alert('Delete Post', 'Are you sure?', [
//       { text: 'Cancel' },
//       { text: 'Delete', style: 'destructive', onPress: () => deletePost(id) },
//     ]);
//   };

//   const handleEditPost = (post) => {
//     setEditingPost(post);
//     setPostText(post.text);
//     setPostImage(post.image || null);
//   };

//   const handleLike = async (postId) => {
//     await likePost(postId);
//   };

//   const openComments = (post) => {
//     setSelectedPost(post);
//     setCommentText('');
//     setEditingComment(null);
//     setCommentModalVisible(true);
//   };

//   useEffect(() => {
//     if (selectedPost) {
//       const updated = posts.find((p) => p._id === selectedPost._id);
//       if (updated) setSelectedPost(updated);
//     }
//   }, [posts]);

//   const handleCommentSubmit = async () => {
//     if (!commentText.trim()) return;

//     if (editingComment) {
//       await updateComment(selectedPost._id, editingComment._id, commentText);
//       setEditingComment(null);
//     } else {
//       await addComment(selectedPost._id, commentText);
//     }
//     setCommentText('');
//   };

//   const handleEditComment = (comment) => {
//     setEditingComment(comment);
//     setCommentText(comment.text);
//   };

//   const handleDeleteComment = async (commentId) => {
//     await deleteComment(selectedPost._id, commentId);
//   };

//   const toggleHamburger = () => {
//     if (!hamburgerVisible) {
//       setHamburgerVisible(true);
//       Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
//     } else {
//       Animated.timing(slideAnim, { toValue: 300, duration: 300, useNativeDriver: true }).start(() =>
//         setHamburgerVisible(false)
//       );
//     }
//   };

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
//               {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//             </Text>
//           </View>
//         </View>

//         {user?._id === item.user?._id && (
//           <View style={{ flexDirection: 'row', gap: 10 }}>
//             <TouchableOpacity onPress={() => handleEditPost(item)}>
//               <FontAwesome name="edit" size={18} color="#2A5B8C" />
//             </TouchableOpacity>
//             <TouchableOpacity onPress={() => handleDeletePost(item._id)}>
//               <FontAwesome name="trash" size={18} color="red" />
//             </TouchableOpacity>
//           </View>
//         )}
//       </View>

//       <Text style={styles.postText}>{item.text}</Text>
//       {item.image && <Image source={{ uri: item.image }} style={styles.postImage} />}

//       <View style={styles.postActions}>
//         <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(item._id)}>
//           <FontAwesome
//             name={item.likes?.includes(user?._id) ? 'thumbs-up' : 'thumbs-o-up'}
//             size={16}
//             color={item.likes?.includes(user?._id) ? '#2A5B8C' : '#666'}
//           />
//           <Text style={styles.actionText}>{item.likes?.length || 0}</Text>
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.actionBtn} onPress={() => openComments(item)}>
//           <FontAwesome name="comment" size={16} color="#666" />
//           <Text style={styles.actionText}>{item.comments?.length || 0}</Text>
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.actionBtn} onPress={() => setIncidentModalVisible(true)}>
//           <FontAwesome name="exclamation-triangle" size={16} color="#E74C3C" />
//           <Text style={styles.actionText}>Report</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.container}>
//       <TouchableOpacity style={{ alignSelf: 'flex-end', margin: 15 }} onPress={toggleHamburger}>
//         <FontAwesome name="bars" size={24} color="#2A5B8C" />
//       </TouchableOpacity>

//       {/* 🏠 Community Tab */}
//       {activeMenu === 'Community' && (
//         <ScrollView>
//           {weatherData && (
//             <View style={styles.weatherBanner}>
//               <Text style={styles.weatherIcon}>🌤</Text>
//               <Text style={styles.weatherMessage}>
//                 {weatherData.main.temp}°C, {weatherData.weather[0].description}
//               </Text>
//             </View>
//           )}

//           <View style={styles.createPostSection}>
//             <Text style={styles.sectionTitle}>{editingPost ? 'Edit Post' : 'Create Post'}</Text>
//             <TextInput
//               style={styles.postInput}
//               placeholder="Share an update..."
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

//               <TouchableOpacity style={styles.submitPostButton} onPress={handleSubmitPost}>
//                 <FontAwesome name="send" size={20} color="#fff" />
//                 <Text style={styles.submitButtonText}>{editingPost ? 'Update' : 'Post'}</Text>
//               </TouchableOpacity>
//             </View>
//           </View>

//           {posts.map((p) => (
//             <View key={p._id}>{renderPost({ item: p })}</View>
//           ))}
//         </ScrollView>
//       )}

//       {/* 🛡 Neighborhood Tab */}
//       {activeMenu === 'Neighborhood' && <NeighborhoodWatchScreen />}

//       {/* 📰 News Tab */}
//       {activeMenu === 'News' && <NewsScreen />}

//       {/* 💬 Comment Modal */}
//       <Modal visible={commentModalVisible} animationType="slide">
//         <SafeAreaView style={styles.modalContainer}>
//           <View style={styles.modalHeader}>
//             <Text style={styles.modalTitle}>Comments</Text>
//             <TouchableOpacity onPress={() => setCommentModalVisible(false)}>
//               <FontAwesome name="times" size={24} color="#333" />
//             </TouchableOpacity>
//           </View>

//           <ScrollView>
//             {selectedPost?.comments?.map((c) => (
//               <View key={c._id} style={styles.commentCard}>
//                 <Text style={styles.commentUser}>{c.user?.name || 'User'}</Text>
//                 <Text style={styles.commentText}>{c.text}</Text>
//                 {c.user?._id === user?._id && (
//                   <View style={styles.commentActions}>
//                     <TouchableOpacity onPress={() => handleEditComment(c)}>
//                       <FontAwesome name="edit" size={16} color="#2A5B8C" />
//                     </TouchableOpacity>
//                     <TouchableOpacity onPress={() => handleDeleteComment(c._id)}>
//                       <FontAwesome name="trash" size={16} color="red" />
//                     </TouchableOpacity>
//                   </View>
//                 )}
//               </View>
//             ))}
//           </ScrollView>

//           <View style={styles.commentInputContainer}>
//             <TextInput
//               placeholder="Write a comment..."
//               value={commentText}
//               onChangeText={setCommentText}
//               style={styles.commentInput}
//             />
//             <TouchableOpacity style={styles.commentSendBtn} onPress={handleCommentSubmit}>
//               <FontAwesome name="send" size={20} color="#fff" />
//             </TouchableOpacity>
//           </View>
//         </SafeAreaView>
//       </Modal>

//       {/* 🚨 Incident Modal */}
//       <IncidentModal
//         visible={incidentModalVisible}
//         onClose={() => setIncidentModalVisible(false)}
//         user={user}
//       />

//       {/* 🍔 Hamburger Menu */}
//       {hamburgerVisible && (
//         <Animated.View style={[styles.hamburgerMenu, { transform: [{ translateX: slideAnim }] }]}>
//           <View style={styles.welcomeContainer}>
//             <Text style={styles.welcomeText}>Welcome, {user?.name || 'User'}!</Text>
//           </View>

//           <TouchableOpacity
//             style={styles.menuItem}
//             onPress={() => {
//               setActiveMenu('Community');
//               toggleHamburger();
//             }}
//           >
//             <FontAwesome name="users" size={20} color="#2A5B8C" />
//             <Text style={styles.menuText}>Community</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.menuItem}
//             onPress={() => {
//               setActiveMenu('Neighborhood');
//               toggleHamburger();
//             }}
//           >
//             <FontAwesome name="shield" size={20} color="#2A5B8C" />
//             <Text style={styles.menuText}>Neighborhood Watch</Text>
//           </TouchableOpacity>

//           {/* 📰 NEW Get News Menu Item */}
//           <TouchableOpacity
//             style={styles.menuItem}
//             onPress={() => {
//               setActiveMenu('News');
//               toggleHamburger();
//             }}
//           >
//             <FontAwesome name="newspaper-o" size={20} color="#2A5B8C" />
//             <Text style={styles.menuText}>Get News</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.menuItem}
//             onPress={() => {
//               setIncidentModalVisible(true);
//               toggleHamburger();
//             }}
//           >
//             <FontAwesome name="exclamation-triangle" size={20} color="#E74C3C" />
//             <Text style={styles.menuText}>Report Incident</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.menuItem}
//             onPress={() => Linking.openURL('mailto:support@neighborhoodapp.com')}
//           >
//             <FontAwesome name="envelope" size={20} color="#2A5B8C" />
//             <Text style={styles.menuText}>Contact Support</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.menuItem}
//             onPress={() => Alert.alert('Coming Soon', 'Settings will be available soon!')}
//           >
//             <FontAwesome name="cog" size={20} color="#2A5B8C" />
//             <Text style={styles.menuText}>Settings</Text>
//           </TouchableOpacity>
//         </Animated.View>
//       )}
//     </SafeAreaView>
//   );
// };

// export default CommunityScreen;


import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity,
Modal, Linking, Image, Alert, Animated, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import styles from './CommunityStyles';
import IncidentModal from './IncidentModel';
import NeighborhoodWatchScreen from './NeighborhoodWatch';
import NewsScreen from './NewsScreen';
import SafetyResources from './SafetyResources';
import { useUser } from '../../Users/useContext';
import { usePosts } from '../../postContext/postContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    reportPost,
  } = usePosts();

  const [showWelcome, setShowWelcome] = useState(false);
  useEffect(() => {
    const hasSeenWelcome = async () => {
      try {
        const seen = await AsyncStorage.getItem('hasSeenCommunityWelcome');
        if (!seen) {
          setShowWelcome(true);
          await AsyncStorage.setItem('hasSeenCommunityWelcome', 'true');
        }
      } catch (error) {
        console.error('Error checking welcome status:', error);
      }
    };
    hasSeenWelcome();
  }, []);

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
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [feedbackList, setFeedbackList] = useState([]);

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
      console.error('Weather API error:', error);
      setWeatherData({
        main: { temp: 22 },
        weather: [{ main: 'Clear', description: 'clear sky' }],
      });
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  const getWeatherIcon = (condition) => {
    const lower = condition.toLowerCase();
    if (lower.includes('clear')) return '☀';
    if (lower.includes('rain')) return '🌧';
    if (lower.includes('cloud')) return '☁';
    if (lower.includes('storm')) return '⛈';
    if (lower.includes('snow')) return '❄';
    return '🌤';
  };

  const getWeatherStyle = (weather) => {
    const lower = weather.toLowerCase();
    if (lower.includes('clear')) return styles.weatherSunny;
    if (lower.includes('rain')) return styles.weatherRainy;
    if (lower.includes('storm')) return styles.weatherStormy;
    if (lower.includes('snow')) return styles.weatherSnowy;
    return styles.weatherDefault;
  };
   const toggleHamburger = () => {
    if (!hamburgerVisible) {
      setHamburgerVisible(true);
      Animated.timing(slideAnim, { 
        toValue: 0, 
        duration: 300, 
        useNativeDriver: true 
      }).start();
    } else {
      setHamburgerVisible(false);
      Animated.timing(slideAnim, { 
        toValue: 300, 
        duration: 300, 
        useNativeDriver: true 
      }).start();
    }
  };
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
    if (!commentText.trim()) {
      Alert.alert("Empty Comment", "Please write a comment before submitting.");
      return;
    }
    if (!selectedPost) {
      Alert.alert("Error", "No post selected for commenting.");
      return;
    }
    console.log("💬 Submitting comment to post:", selectedPost._id);
    try {
      let result;
      if (editingComment) {
        result = await updateComment(selectedPost._id, editingComment._id, commentText);
        if (result) {
          Alert.alert("Success", "Comment updated successfully!");
          setEditingComment(null);
        }
      } else {
        result = await addComment(selectedPost._id, commentText);
        if (result) {
          Alert.alert("Success", "Comment added successfully!");
        }
      }
      setCommentText('');
      setTimeout(() => {
        const updatedPost = posts.find(p => p._id === selectedPost._id);
        if (updatedPost) {
          setSelectedPost(updatedPost);
        }
      }, 500);
    } catch (error) {
      console.error("❌ Comment submission error:", error);
      Alert.alert("Error", "Failed to submit comment. Please check your connection.");
    }
  };
  const handleEditComment = (comment) => {
    setEditingComment(comment);
    setCommentText(comment.text);
  };

  const handleDeleteComment = async (commentId) => {
    await deleteComment(selectedPost._id, commentId);
  };
  const handleReportPost = (post) => {
    Alert.alert(
      "Report Post",
      "Why are you reporting this post?",
      [
        {
          text: "Spam or misleading",
          onPress: () => confirmReport(post, "Spam or misleading")
        },
        {
          text: "Harassment or bullying", 
          onPress: () => confirmReport(post, "Harassment or bullying")
        },
        {
          text: "Inappropriate content",
          onPress: () => confirmReport(post, "Inappropriate content")
        },
        {
          text: "False information",
          onPress: () => confirmReport(post, "False information")
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  const confirmReport = async (post, reason) => {
    Alert.alert(
      "Report Confirmation",
      `Are you sure you want to report this post for "${reason}"?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Report",
          style: "destructive",
          onPress: () => submitReport(post, reason)
        }
      ]
    );
  };

  const submitReport = async (post, reason) => {
    try {
      console.log("📢 Reporting post:", {
        postId: post._id,
        reason: reason,
        postContent: post.text?.substring(0, 50) + '...',
        reportedBy: user?.name || "Anonymous"
      });
      const result = await reportPost(post._id, reason);
      if (result) {
        Alert.alert(
          "Report Submitted",
          "Thank you for helping keep our community safe. Our moderators will review this post.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Report error:", error);
      Alert.alert("Error", "Failed to submit report. Please try again.");
    }
  };

const submitFeedback = () => {
  if (!feedbackText.trim()) {
    Alert.alert('Empty feedback', 'Please write your feedback before submitting.');
    return;
  }
    const newFeedback = {
      id: Date.now(),
      text: feedbackText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString(),
    };
    setFeedbackList([newFeedback, ...feedbackList]);
    setFeedbackText('');
    setFeedbackModalVisible(false);
    Alert.alert('Thank you!', 'Your feedback has been submitted to the administrators.');
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

        {user?._id !== item.user?._id && (
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => handleReportPost(item)}
          >
            <FontAwesome name="flag" size={16} color="#666" />
            <Text style={styles.actionText}>Report</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.actionBtn}>
          <FontAwesome name="share" size={16} color="#666" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
    <View style={{
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: 15,
      backgroundColor: '#2A5B8C',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 5,
      zIndex: 10,
      pointerEvents: 'box-none',
    }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'white' }}>Community Hub</Text>
      <TouchableOpacity onPress={toggleHamburger}>
        <FontAwesome name="bars" size={24} color="white" />
      </TouchableOpacity>
    </View>

  {activeMenu === 'Community' && (
    <ScrollView contentContainerStyle={styles.listContent}>

          {weatherData && (
            <View style={[styles.weatherBanner, getWeatherStyle(weatherData.weather[0].main)]}>
              <Text style={styles.weatherIcon}>{getWeatherIcon(weatherData.weather[0].main)}</Text>
              <View style={styles.weatherInfo}>
                <Text style={styles.weatherTitle}>Local Weather</Text>
                <Text style={styles.weatherMessage}>
                  {weatherData.main.temp}°C, {weatherData.weather[0].description}
                </Text>
              </View>
            </View>
          )}

          {/* Create Post Section */}
          <View style={styles.createPostSection}>
            <Text style={styles.sectionTitle}>{editingPost ? 'Edit Post' : 'Share with Community'}</Text>
            <TextInput
              style={styles.postInput}
              placeholder="Share a safety tip, update, or question..."
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

              <TouchableOpacity 
                style={[
                  styles.submitPostButton,
                  (!postText.trim() && !postImage) && styles.submitPostButtonDisabled,
                ]} 
                onPress={handleSubmitPost}
                disabled={!postText.trim() && !postImage}
              >
                <FontAwesome name="send" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>{editingPost ? 'Update' : 'Post'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Community Activity</Text>
            <Text style={styles.postCount}>{posts.length} posts</Text>
          </View>

          {posts.map((p) => (
            <View key={p._id}>{renderPost({ item: p })}</View>
          ))}
        </ScrollView>
      )}

      {/*  Neighborhood Watch Tab */}
      {activeMenu === 'Neighborhood' && <NeighborhoodWatchScreen />}

      {/* 📰 News Tab */}
      {activeMenu === 'News' && <NewsScreen />}

      {/* 🚨 Safety Resources Tab */}
      {activeMenu === 'Safety' && <SafetyResources />}

      {/* 💬 Comment Modal */}
      <Modal visible={commentModalVisible} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedPost ? `Comments on "${selectedPost.text.substring(0, 30)}..."` : 'Comments'}
            </Text>
            <TouchableOpacity onPress={() => {
              setCommentModalVisible(false);
              setCommentText('');
              setEditingComment(null);
            }}>
              <FontAwesome name="times" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.commentsList}>
            {selectedPost?.comments?.length > 0 ? (
              selectedPost.comments.map((c) => (
                <View key={c._id} style={styles.commentCard}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentUser}>{c.user?.name || 'User'}</Text>
                    {c.user?._id === user?._id && (
                      <View style={styles.commentActions}>
                        <TouchableOpacity onPress={() => handleEditComment(c)}>
                          <FontAwesome name="edit" size={14} color="#2A5B8C" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteComment(c._id)}>
                          <FontAwesome name="trash" size={14} color="red" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                  <Text style={styles.commentText}>{c.text}</Text>
                  <Text style={styles.commentTime}>
                    {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.noComments}>
                <FontAwesome name="comment" size={48} color="#CBD5E1" />
                <Text style={styles.noCommentsText}>No comments yet</Text>
                <Text style={styles.noCommentsSubtext}>Be the first to comment!</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.commentInputContainer}>
            <TextInput
              placeholder={editingComment ? "Edit your comment..." : "Write a comment..."}
              value={commentText}
              onChangeText={setCommentText}
              style={styles.commentInput}
              multiline
            />
            <TouchableOpacity 
              style={[styles.commentSendBtn, !commentText.trim() && styles.commentSendBtnDisabled]}
              onPress={handleCommentSubmit}
              disabled={!commentText.trim()}
            >
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

      {/* 💬 Feedback Modal */}
      <Modal
        animationType="slide"
        visible={feedbackModalVisible}
        onRequestClose={() => setFeedbackModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Community Feedback</Text>
            <TouchableOpacity onPress={() => setFeedbackModalVisible(false)}>
              <FontAwesome name="times" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              Share your suggestions to improve our community hub
            </Text>
            <TextInput
              style={[styles.inputField, styles.textArea]}
              placeholder="What can we do better? Share your ideas..."
              value={feedbackText}
              onChangeText={setFeedbackText}
              multiline
              numberOfLines={6}
            />
            <TouchableOpacity
              style={[styles.submitButton, !feedbackText.trim() && styles.submitButtonDisabled]}
              onPress={submitFeedback}
              disabled={!feedbackText.trim()}
            >
              <Text style={styles.submitButtonText}>Submit Feedback</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 🍔 Hamburger Menu */}
      {hamburgerVisible && (
        <View style={styles.hamburgerContainer}>
        <Pressable 
          style={styles.hamburgerBackdrop}
          onPress={toggleHamburger}
        />

        {/* MENU PANEL  */}
        <View style={styles.menuContainer}>
          <Animated.View 
            style={[
              styles.hamburgerMenu, 
              { transform: [{ translateX: slideAnim }] }
            ]}
          >
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
              <FontAwesome name="home" size={20} color="#2A5B8C" />
              <Text style={styles.menuText}>Community Hub</Text>
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
                setActiveMenu('Safety');
                toggleHamburger();
              }}
            >
              <FontAwesome name="phone" size={20} color="#2A5B8C" />
              <Text style={styles.menuText}>Safety Resources</Text>
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
              onPress={() => {
                setFeedbackModalVisible(true);
                toggleHamburger();
              }}
            >
              <FontAwesome name="comment" size={20} color="#2A5B8C" />
              <Text style={styles.menuText}>Give Feedback</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => Linking.openURL('mailto:support@communityapp.com')}
            >
              <FontAwesome name="envelope" size={20} color="#2A5B8C" />
              <Text style={styles.menuText}>Contact Support</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    )}

      {/* Welcome Modal */}
      <Modal
        visible={showWelcome}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.welcomeModalOverlay}>
          <View style={styles.welcomeModal}>
            <Text style={styles.welcomeModalTitle}>Welcome to Community Hub</Text>
            <Text style={styles.welcomeModalText}>
              Connect with your neighbors, share updates, and access helpful resources.
              This space is designed to foster a safe and engaged community.
            </Text>
            <TouchableOpacity 
              style={styles.welcomeModalButton}
              onPress={() => setShowWelcome(false)}
            >
              <Text style={styles.welcomeModalButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default CommunityScreen;