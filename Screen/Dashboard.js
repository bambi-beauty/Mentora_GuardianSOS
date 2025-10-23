// import React, { useState, useEffect } from 'react';
// import {
//   StyleSheet,
//   View,
//   Text,
//   ScrollView,
//   SafeAreaView,
//   StatusBar,
//   TouchableOpacity,
//   Alert,
//   TextInput,
//   Modal,
//   FlatList,
//   KeyboardAvoidingView,
//   Platform,
//   Linking,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/FontAwesome';
// import Constants from 'expo-constants';
// import * as Notifications from 'expo-notifications';
// import { useUser } from '../Users/useContext';


// const GuardianSOSApp = ({ navigation }) => {
//   const [chatbotVisible, setChatbotVisible] = useState(false);
//   const [currentTime, setCurrentTime] = useState('');
//   const [contactsCount, setContactsCount] = useState(0);
//   const [message, setMessage] = useState('');
//   const [chatMessages, setChatMessages] = useState([
//     {
//       id: 1,
//       text: "Hello! I'm your Guardian SOS assistant. How can I help you today?",
//       sender: 'bot',
//       time: '21:10',
//     },
//   ]);

//   const { user, token, selectedCity, loading } = useUser();

//   // returns Current Time
//   useEffect(() => {
//     const interval = setInterval(() => {
//       const now = new Date();
//       const timeString = now.toLocaleTimeString([], {
//         hour: '2-digit',
//         minute: '2-digit',
//       });
//       setCurrentTime(timeString);
//     }, 1000);

//     return () => clearInterval(interval);
//   }, []);

//   // returns Contacts count added by the user.
//   useEffect(() => {
//   const fetchContactsCount = async () => {
//     if (!user?._id || !token) {
//       console.warn('Missing user ID or token');
//       return;
//     }

//     try {
//       const res = await fetch(`http://192.168.57.209:3000/api/contacts/${user._id}`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       const data = await res.json();

//       if (res.ok && Array.isArray(data.contacts)) {
//         setContactsCount(data.contacts.length);
//       } else {
//         console.warn('Unexpected response format or status');
//         setContactsCount(0);
//       }
//     } catch (error) {
//       console.error('❌ Error fetching contacts count:', error);
//       setContactsCount(0);
//     }
//   };
//   fetchContactsCount();
// }, [user, token]);



//   const enableNotifications = async () => {
//     if (!Constants.isDevice) {
//       Alert.alert('Error', 'Must use a physical device for Push Notifications');
//       return;
//     }

//     const { status: existingStatus } = await Notifications.getPermissionsAsync();
//     let finalStatus = existingStatus;

//     if (existingStatus !== 'granted') {
//       const { status } = await Notifications.requestPermissionsAsync();
//       finalStatus = status;
//     }

//     if (finalStatus !== 'granted') {
//       Alert.alert('Permission Denied', 'Enable notifications in settings');
//       return;
//     }

//     const tokenData = await Notifications.getExpoPushTokenAsync();
//     const expoPushToken = tokenData.data;

//     Alert.alert('Push Notifications Enabled', `Token: ${expoPushToken}`);
//     console.log('Expo Push Token:', expoPushToken);

//     if (Platform.OS === 'android') {
//       await Notifications.setNotificationChannelAsync('default', {
//         name: 'default',
//         importance: Notifications.AndroidImportance.MAX,
//         vibrationPattern: [0, 250, 250, 250],
//         lightColor: '#FF231F7C',
//       });
//     }
//   };

//   useEffect(() => {
//     const notificationListener = Notifications.addNotificationReceivedListener(notification => {
//       console.log('Notification received:', notification);
//     });

//     const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
//       console.log('Notification clicked:', response);
//     });

//     return () => {
//       notificationListener.remove();
//       responseListener.remove();
//     };
//   }, []);

//   const handleSOSPress = () => {
//     Alert.alert(
//       'Emergency SOS',
//       'Are you sure you want to activate emergency SOS?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { text: 'Activate SOS', onPress: () => activateSOS(), style: 'destructive' },
//       ]
//     );
//   };

//   const activateSOS = () => {
//     Alert.alert(
//       'SOS Activated',
//       'Help is on the way! Your location has been shared with emergency services and your contacts.'
//     );
//   };

//   const handleCallHelp = () => {
//     Linking.openURL('tel:10111');
//   };

//   const handleActionPress = (action) => {
//     if (action === 'AI Assistant') {
//       setChatbotVisible(true);
//     } else if (action === 'Call Help') {
//       handleCallHelp();
//     } 
//   };

//   const sendMessage = async () => {
//     if (!message.trim()) return;

//     const userMessage = {
//       id: Date.now(),
//       text: message,
//       sender: 'user',
//     };
//     setChatMessages((prevMessages) => [...prevMessages, userMessage]);

//     try {
//       const response = await fetch('http://192.168.52.251/api/chat', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ message }),
//       });

//       const data = await response.json();

//       if (data.reply) {
//         const aiMessage = {
//           id: Date.now() + 1,
//           text: data.reply,
//           sender: 'ai',
//         };

//         setChatMessages((prevMessages) => [...prevMessages, aiMessage]);
//       } else {
//         console.error('No reply from AI');
//       }
//     } catch (error) {
//       console.error('Error talking to AI backend:', error);
//     }

//     setMessage('');
//   };

//   const quickActions = [
//     { id: 1, text: 'Share my location', icon: 'location-arrow' },
//     { id: 2, text: 'Nearest safe place', icon: 'map-marker' },
//     { id: 3, text: 'Contact emergency', icon: 'phone' },
//     { id: 4, text: 'Safety tips', icon: 'lightbulb-o' },
//   ];

//   const handleQuickAction = (action) => {
//     setMessage(action.text);
//     sendMessage();
//   };

//   const renderMessage = ({ item }) => (
//     <View
//       style={[
//         styles.messageBubble,
//         item.sender === 'user' ? styles.userMessage : styles.botMessage,
//       ]}
//     >
//       <Text
//         style={item.sender === 'user' ? styles.userMessageText : styles.botMessageText}
//       >
//         {item.text}
//       </Text>
//       {item.time && <Text style={styles.messageTime}>{item.time}</Text>}
//     </View>
//   );

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.loadingContainer}>
//         <Text style={styles.loadingText}>Loading...</Text>
//       </SafeAreaView>
//     );
//   }

//   const getDisplayValue = (value, fallback) => {
//   return value?.trim() ? value.trim() : fallback;
// };


//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#2A5B8C" />

//       {/* Header */}
//       <View style={styles.header}>
//         <View style={styles.logo}>
//           <Icon name="shield" size={29} color="white" />
//           <Text style={styles.logoText}>Guardian SOS</Text>
//         </View>
//         <View style={styles.headerActions}>
//           <Icon name="search" size={20} color="white" style={styles.headerIcon} />
//           <Icon name="bell" size={20} color="white" style={styles.headerIcon} />
//         </View>
//       </View>

//       <ScrollView style={styles.scrollView}>
//         {/* Welcome Message */}
//         <View style={styles.userWelcome}>
//           <Text style={styles.welcomeTitle}>
//             Welcome back, {user?.name || 'Guest'}
//           </Text>
//           <Text style={styles.welcomeText}>
//             You're in a safe zone. Your location is being monitored and emergency contacts are notified of your status.
//           </Text>
//           <View style={styles.locationTime}>
//             <Icon name="map-pin" size={14} color="white" />
//             <Text style={styles.locationText}>
//              {getDisplayValue(user?.location?.city, 'Unknown City')} Safe Zone • {currentTime}
//             </Text>
//           </View>
//         </View>

//         {/* Stats Grid */}
//         <View style={styles.statsGrid}>
//           <View style={[styles.statCard, styles.safetyScore]}>
//             <Text style={[styles.statValue, styles.safetyScoreValue]}>95%</Text>
//             <Text style={[styles.statLabel, styles.safetyScoreLabel]}>Excellent safety rating</Text>
//           </View>
//           <View style={styles.statCard}>
//             <Text style={styles.statValue}>{contactsCount}</Text>
//             <Text style={styles.statLabel}>Emergency Contacts</Text>
//           </View>
//           <View style={styles.statCard}>
//             <Text style={styles.statValue}>23</Text>
//             <Text style={styles.statLabel}>Community</Text>
//           </View>
//           <View style={styles.statCard}>
//             <Text style={styles.statValue}>2.1 min</Text>
//             <Text style={styles.statLabel}>Response Time</Text>
//           </View>
//         </View>

//         {/* Emergency Actions */}
//         <View style={styles.section}>
//           <View style={styles.sectionTitle}>
//             <Icon name="bolt" size={16} color="#2A5B8C" />
//             <Text style={styles.sectionTitleText}>Emergency Actions</Text>
//           </View>
//           <View style={styles.actionButtons}>
//             <TouchableOpacity 
//               style={[styles.actionBtn, styles.emergencyBtn]}
//               onPress={() => handleSOSPress()}
//             >
//               <Icon name="bell" size={24} color="white" />
//               <Text style={styles.emergencyBtnText}>Emergency SOS</Text>
//             </TouchableOpacity>
//             <TouchableOpacity 
//               style={styles.actionBtn}
//               onPress={() => handleActionPress('Call Help')} 
//             >
//               <Icon name="phone" size={24} color="#2A5B8C" />
//               <Text style={styles.actionBtnText}>Call Help</Text>
//             </TouchableOpacity>

//             {/*share location button*/}
//             <TouchableOpacity 
//               style={styles.actionBtn}
//               onPress={() => setShareLocationVisible(true)}
//             >
//               <Icon name="location-arrow" size={24} color="#2A5B8C" />
//               <Text style={styles.actionBtnText}>Share Location</Text>
//             </TouchableOpacity>
            

//             <TouchableOpacity 
//               style={styles.actionBtn}
//               onPress={() => handleActionPress('AI Assistant')}
//             >
//               <Icon name="comments" size={24} color="#2A5B8C" />
//               <Text style={styles.actionBtnText}>AI Assistant</Text>
//             </TouchableOpacity>
//             <TouchableOpacity 
//               style={styles.actionBtn}
//               onPress={() => handleActionPress('Check-in with Family')}
//             >
//               <Icon name="users" size={24} color="#2A5B8C" />
//               <Text style={styles.actionBtnText}>Check-in with Family</Text>
//             </TouchableOpacity>
//           </View>
//         </View>

        
//         {/* Recent Alerts */}
// <View style={styles.section}>
//   <View style={styles.sectionTitle}>
//     <Icon name="bell" size={16} color="#2A5B8C" />
//     <Text style={styles.sectionTitleText}>Recent Alerts</Text>
//   </View>

//   <View style={styles.alertList}>
//     {/* Alert 1 */}
//     <View style={styles.alertItem}>
//       <View style={styles.alertIcon}>
//         <Icon name="map-marker-alt" size={16} color="#2A5B8C" />
//       </View>
//       <View style={styles.alertContent}>
//         <Text style={styles.alertTitle}>Safety Zone Update</Text>
//         <Text style={styles.alertText}>
//           You've entered a high-safety area near Downtown Mall
//         </Text>
//         <Text style={styles.alertTime}>10 min ago</Text>
//       </View>
//     </View>
//     {/* Alert 2 */}
//     <View style={styles.alertItem}>
//       <View style={styles.alertIcon}>
//         <Icon name="users" size={16} color="#2A5B8C" />
//       </View>
//       <View style={styles.alertContent}>
//         <Text style={styles.alertTitle}>Community Alert</Text>
//         <Text style={styles.alertText}>
//           New safety tips shared by your neighborhood watch
//         </Text>
//         <Text style={styles.alertTime}>45 min ago</Text>
//       </View>
//     </View>

//     {/* Alert 3 */}
//     <View style={styles.alertItem}>
//       <View style={styles.alertIcon}>
//         <Icon name="user-plus" size={16} color="#2A5B8C" />
//       </View>
//       <View style={styles.alertContent}>
//         <Text style={styles.alertTitle}>Emergency Contact Updated</Text>
//         <Text style={styles.alertText}>
//           Jennifer was added as your emergency contact
//         </Text>
//         <Text style={styles.alertTime}>2 hours ago</Text>
//       </View>
//     </View>
//   </View>
// </View>

// </ScrollView>
      

// {/* Chatbot Modal */} 
//  <Modal
//   animationType="slide"
//   transparent={false}
//   visible={chatbotVisible}
//   onRequestClose={() => setChatbotVisible(false)}
// >
//   <SafeAreaView style={styles.modalContainer}>
//     {/* Modal Header */}
//     <View style={styles.modalHeader}>
//       <Text style={styles.modalTitle}>AI Assistant</Text>
//       <TouchableOpacity onPress={() => setChatbotVisible(false)}>
//         <Icon name="times" size={24} color="#2A5B8C" />
//       </TouchableOpacity>
//     </View>

//     {/* Chat Messages */}
//     <FlatList
//       data={chatMessages}
//       renderItem={renderMessage}
//       keyExtractor={(item) => item.id.toString()}
//       style={styles.chatContainer}
//       contentContainerStyle={styles.chatContent}
//     />
//     {/* Quick Actions */}
//     <ScrollView
//       horizontal
//       showsHorizontalScrollIndicator={false}
//       style={styles.quickActionsContainer}
//     >
//       {quickActions.map((action) => (
//         <TouchableOpacity
//           key={action.id}
//           style={styles.quickActionButton}
//           onPress={() => handleQuickAction(action)}
//         >
//           <Icon name={action.icon} size={16} color="#2A5B8C" />
//           <Text style={styles.quickActionText}>{action.text}</Text>
//         </TouchableOpacity>
//       ))}
//     </ScrollView>

//     {/* Input Box */}
//     <KeyboardAvoidingView
//       behavior={Platform.OS === "ios" ? "padding" : "height"}
//       style={styles.inputContainer}
//     >
//       <TextInput
//         style={styles.textInput}
//         value={message}
//         onChangeText={setMessage}
//         placeholder="Type your message here..."
//         placeholderTextColor="#999"
//       />
//       <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
//         <Icon name="paper-plane" size={20} color="white" />
//       </TouchableOpacity>
//     </KeyboardAvoidingView>
//   </SafeAreaView>
// </Modal>
      

//       {/* SOS Button */}

//       <TouchableOpacity style={styles.sosButton} onPress={handleSOSPress}>
//         <Text style={styles.sosButtonText}>SOS</Text>
//       </TouchableOpacity>

//    {/* Bottom Navigation*/}


//   <View style={styles.bottomNav}>
//   {/* Home Tab */}
//   <View style={[styles.navItem, styles.navItemActive]}>
//     <Icon name="home" size={20} color="#2A5B8C" />
//     <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
//   </View>

//   {/* Map Tab */}
//   <View style={styles.navItem}>
//     <Icon  name="map" size={20} color="#718096" />
//     <Text style={styles.navText}>Map</Text>
//   </View>

//   {/* Community Tab */}
//   <View style={styles.navItem}>
//     <Icon name="users" size={20} color="#718096" />
//     <Text style={styles.navText}>Community</Text>
//   </View>

//   {/* Profile Tab */}
//   <View style={styles.navItem} >
//     <Icon name="user" size={20} color="#718096" 
//     />
//     <Text style={styles.navText}>Profile</Text>
//   </View>
// </View>
//     </SafeAreaView>
//   );
// };


// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f0f5ff',
//     marginTop:15
//   },
//   header: {
//     backgroundColor: '#2A5B8C',
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 15,
//   },
//   logo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   logoText: {
//     color: 'white',
//     fontWeight: '700',
//     fontSize: 20,
//     marginLeft: 8,
//   },
//   headerActions: {
//     flexDirection: 'row',
//   },
//   headerIcon: {
//     marginLeft: 15,
//   },
//   scrollView: {
//     flex: 1,
//   },
//   userWelcome: {
//     backgroundColor: '#3A7BBC',
//     padding: 20,
//     borderBottomLeftRadius: 15,
//     borderBottomRightRadius: 15,
//     marginBottom: 20,
//   },
//   welcomeTitle: {
//     color: 'white',
//     fontSize: 18,
//     fontWeight: '600',
//     marginBottom: 5,
//   },
//   welcomeText: {
//     color: 'white',
//     fontSize: 14,
//     opacity: 0.9,
//   },
//   locationTime: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 10,
//   },
//   locationText: {
//     color: 'white',
//     fontSize: 13,
//     marginLeft: 5,
//   },
//   statsGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//     paddingHorizontal: 15,
//     marginBottom: 20,
//   },
//   statCard: {
//     backgroundColor: 'white',
//     borderRadius: 12,
//     padding: 15,
//     width: '48%',
//     marginBottom: 12,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   safetyScore: {
//     backgroundColor: '#2A5B8C',
//   },
//   statValue: {
//     fontSize: 24,
//     fontWeight: '700',
//     color: '#2A5B8C',
//     marginBottom: 5,
//   },
//   safetyScoreValue: {
//     color: 'white',
//   },
//   statLabel: {
//     fontSize: 12,
//     color: '#718096',
//     textAlign: 'center',
//   },
//   safetyScoreLabel: {
//     color: 'rgba(255, 255, 255, 0.8)',
//   },
//   section: {
//     paddingHorizontal: 15,
//     marginBottom: 25,
//   },
//   sectionTitle: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 15,
//   },
//   sectionTitleText: {
//     fontSize: 16,
//     fontWeight: '600',
//     marginLeft: 8,
//     color: '#1A2C3D',
//   },
//   actionButtons: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//   },
//   actionBtn: {
//     backgroundColor: 'white',
//     borderRadius: 12,
//     padding: 15,
//     width: '48%',
//     marginBottom: 12,
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 1,
//   },
//   emergencyBtn: {
//     backgroundColor: '#FF5757',
//     width: '100%',
//     flexDirection: 'row',
//     justifyContent: 'center',
//   },
//   emergencyBtnText: {
//     color: 'white',
//     fontWeight: '600',
//     marginLeft: 8,
//   },
//   actionBtnText: {
//     color: '#2A5B8C',
//     fontWeight: '600',
//     marginTop: 5,
//   },
//   alertList: {
//     backgroundColor: 'white',
//     borderRadius: 12,
//     overflow: 'hidden',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 1,
//   },
//   alertItem: {
//     flexDirection: 'row',
//     padding: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: '#E2E8F0',
//   },
//   alertIcon: {
//     backgroundColor: '#F5F9FF',
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 12,
//   },
//   alertContent: {
//     flex: 1,
//   },
//   alertTitle: {
//     fontSize: 14,
//     fontWeight: '600',
//     marginBottom: 4,
//     color: '#1A2C3D',
//   },
//   alertText: {
//     fontSize: 12,
//     color: '#718096',
//   },
//   alertTime: {
//     fontSize: 11,
//     color: '#718096',
//     marginTop: 5,
//   },
//   modalContainer: {
//     flex: 1,
//     backgroundColor: 'white',
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: '#E2E8F0',
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#2A5B8C',
//   },
//   chatContainer: {
//     flex: 1,
//     padding: 10,
//   },
//   chatContent: {
//     paddingBottom: 10,
//   },
//   messageBubble: {
//     maxWidth: '80%',
//     padding: 12,
//     borderRadius: 18,
//     marginBottom: 10,
//   },
//   botMessage: {
//     alignSelf: 'flex-start',
//     backgroundColor: '#F0F5FF',
//     borderBottomLeftRadius: 4,
//   },
//   userMessage: {
//     alignSelf: 'flex-end',
//     backgroundColor: '#2A5B8C',
//     borderBottomRightRadius: 4,
//   },
//   botMessageText: {
//     color: '#1A2C3D',
//     fontSize: 16,
//   },
//   userMessageText: {
//     color: 'white',
//     fontSize: 16,
//   },
//   messageTime: {
//     fontSize: 10,
//     color: '#718096',
//     marginTop: 4,
//     alignSelf: 'flex-end',
//   },
//   quickActionsContainer: {
//     padding: 10,
//     borderTopWidth: 1,
//     borderTopColor: '#E2E8F0',
//   },
//   quickActionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F0F5FF',
//     padding: 10,
//     borderRadius: 20,
//     marginRight: 10,
//   },
//   quickActionText: {
//     marginLeft: 5,
//     color: '#2A5B8C',
//     fontSize: 14,
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     padding: 10,
//     borderTopWidth: 1,
//     borderTopColor: '#E2E8F0',
//     alignItems: 'center',
//   },
//   textInput: {
//     flex: 1,
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//     borderRadius: 20,
//     paddingHorizontal: 15,
//     paddingVertical: 10,
//     marginRight: 10,
//     fontSize: 16,
//   },
//   sendButton: {
//     backgroundColor: '#2A5B8C',
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   sosButton: {
//     position: 'absolute',
//     bottom: 80,
//     right: 20,
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: '#FF5757',
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: '#FF5757',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.4,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   sosButtonText: {
//     color: 'white',
//     fontSize: 18,
//     fontWeight: '700',
//   },
//   bottomNav: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     paddingVertical: 12,
//     backgroundColor: 'white',
//     borderTopWidth: 1,
//     borderTopColor: '#E2E8F0',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   navItem: {
//     alignItems: 'center',
//   },
//   navItemActive: {
//     color: '#2A5B8C',
//   },
//   navText: {
//     fontSize: 12,
//     color: '#718096',
//     marginTop: 4,
//   },
//   navTextActive: {
//     color: '#2A5B8C',
//     fontWeight: '600',
//   },
// });



// export default GuardianSOSApp;


// {/*send Message to the AI*/}
//   const sendMessage = () => {
//     if (message.trim() === '') return;
    
//     const newUserMessage = {
//       id: chatMessages.length + 1,
//       text: message,
//       sender: 'user',
//       time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
//     };
    
//     setChatMessages([...chatMessages, newUserMessage]);
//     setMessage('');
    
//     setTimeout(() => {
//       const responses = [
//         "I understand your concern. Would you like me to contact emergency services?",
//         "I'm here to help. Your safety is my priority.",
//         "I can help you share your location with trusted contacts.",
//         "Based on your current location, you're in a safe zone.",
//         "Would you like me to guide you to the nearest safe location?"
//       ];
      
//       const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
//       const botMessage = {
//         id: chatMessages.length + 2,
//         text: randomResponse,
//         sender: 'bot',
//         time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
//       };
      
//       setChatMessages(prev => [...prev, botMessage]);
//     }, 1000);
//   };