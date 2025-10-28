import React, { useState, useEffect } from 'react';
import { View,Text,TouchableOpacity,ScrollView,Linking,Modal,Alert} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import styles from '../screen/CommunityStyles';

const safetyResources = [
  { id: 1, label: 'Emergency Police', contact: '10111', type: 'phone' },
  { id: 2, label: 'Fire Department', contact: '10112', type: 'phone' },
  { id: 3, label: 'Medical Emergency / Ambulance', contact: '10177', type: 'phone' },
  { id: 4, label: 'Netcare 911', contact: '082911', type: 'phone' },
  { id: 5, label: 'ER24', contact: '084124', type: 'phone' },
  { id: 6, label: 'Local Health Clinic', contact: '011-2345678', type: 'phone' },
  { id: 7, label: 'Safety Guidelines', contact: '', type: 'info' },
  { id: 8, label: 'Emergency Procedures', contact: '', type: 'info' },
  { id: 9, label: 'First Aid Tips', contact: '', type: 'firstAid' },
];

const firstAidTips = [
  "Minor Cuts & Scrapes: Wash with clean water, apply antiseptic, and cover with a sterile bandage.",
  "Burns (First Degree): Run cool (not cold) water over the burn for 10–20 minutes. Do NOT apply butter, oils, or Vaseline.",
  "Nosebleeds: Sit upright, lean slightly forward, and pinch the soft part of the nose until it stops.",
  "Choking: If someone can't breathe, perform the Heimlich maneuver or back blows if trained. Call emergency services.",
  "Sprains: Rest, ice, compression, and elevate the injured area (R.I.C.E method).",
  "Severe Bleeding: Apply firm pressure with a clean cloth, elevate the wound if possible, and call emergency services.",
  "Shock: Keep the person lying down, cover with a blanket, and monitor breathing until help arrives.",
  "Head Injuries: Keep the person still, calm, and seek medical help immediately.",
  "Fractures: Immobilize the limb, apply a splint if available, and get professional help.",
  "Burns (Second or Third Degree): Call emergency services immediately, cover with a clean cloth, and avoid removing clothing stuck to the burn.",
  "Fainting: Lay the person down, elevate legs slightly, and loosen tight clothing.",
  "Seizures: Protect the person from injury, do NOT put anything in their mouth, and call for medical help if prolonged.",
  "Allergic Reactions: Use an epinephrine auto-injector if available and call emergency services.",
  "Snake Bites: Keep the person calm and still, immobilize the affected limb, and get medical help quickly.",
  "Electric Shock: Ensure the power source is off before touching the person. Check for breathing and pulse, and call emergency services.",
  "Smoke Inhalation: Move the person to fresh air immediately. Seek medical attention if breathing is difficult.",
  "Heat Exhaustion: Move to a cool place, give water, and loosen clothing. Seek medical help if symptoms worsen.",
  "Cold Exposure: Move to a warm area, remove wet clothing, and warm the person gradually."
];

const SafetyResources = () => {
  const [currentTip, setCurrentTip] = useState('');
  const [firstAidModalVisible, setFirstAidModalVisible] = useState(false);

  const getRandomTip = () => {
    const randomIndex = Math.floor(Math.random() * firstAidTips.length);
    setCurrentTip(firstAidTips[randomIndex]);
  };

  useEffect(() => {
    getRandomTip();
  }, []);

  const handleContact = (item) => {
    if (item.type === 'phone' && item.contact) {
      Linking.openURL(`tel:${item.contact}`);
    } else if (item.type === 'info') {
      if (item.label === 'Safety Guidelines') {
        Alert.alert(
          '🚨 Safety Guidelines',
          `BE AWARE
• Stay alert to surroundings
• Trust your instincts  
• Plan routes in new areas

STAY CONNECTED
• Share location with contacts  
• Save emergency numbers
• Keep phone charged

COMMUNITY SAFETY
• Report suspicious activities
• Verify info before sharing  
• Use app safety features`,
          [{ text: 'Got It' }]
        );
      } else if (item.label === 'Emergency Procedures') {
        Alert.alert(
          '🆘 EMERGENCY STEPS',
          `1. 🧘 STAY CALM
   Assess the situation

2. 📞 CALL EMERGENCY
   Dial the right number

3. 📍 GIVE LOCATION
   Be clear and specific

4. 👂 FOLLOW INSTRUCTIONS
   Listen to operators

5. 👥 ALERT CONTACTS
   Notify your emergency list

6. 📱 USE APP
   Activate safety features

7. 🏃 MOVE TO SAFETY
   If possible and safe

8. 📞 STAY ON CALL
   Until help arrives

💡 Your safety comes first!`,
          [{ text: 'GOT IT' }]
        );
      }
    } else if (item.type === 'firstAid') {
      getRandomTip();
      setFirstAidModalVisible(true);
    }
  };

  const renderResource = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.resourceCard}
      onPress={() => handleContact(item)}
    >
      <View style={styles.resourceHeader}>
        <View style={styles.resourceIcon}>
          <FontAwesome
            name={
              item.type === 'phone' ? 'phone' : 
              item.type === 'firstAid' ? 'medkit' : 'info-circle'
            }
            size={20}
            color="#2A5B8C"
          />
        </View>
        <View style={styles.resourceInfo}>
          <Text style={styles.resourceLabel}>{item.label}</Text>
          {item.contact ? (
            <Text style={styles.resourceContact}>{item.contact}</Text>
          ) : (
            <Text style={styles.resourceDescription}>
              {item.type === 'firstAid' ? 'Tap for random first aid tip' : 'Tap to view information'}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView contentContainerStyle={styles.listContent}>
      <View style={styles.communityWelcome}>
        <Text style={styles.welcomeTitle}>Safety Resources</Text>
        <Text style={styles.safetyDescription}>
          Quick access to emergency contacts and safety information. Tap numbers to call directly, or view guidelines and first aid tips for informational purposes.
        </Text>
      </View>

      {safetyResources.map(renderResource)}

      <Modal
        visible={firstAidModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFirstAidModalVisible(false)}
        >
        <View style={styles.firstAidModalOverlay}>
            <View style={styles.firstAidModalContainer}>
            <View style={styles.firstAidModalHeader}>
                <Text style={styles.firstAidModalTitle}>🩹 First Aid Tip</Text>
                <TouchableOpacity onPress={() => setFirstAidModalVisible(false)}>
                <FontAwesome name="times" size={24} color="#666" />
                </TouchableOpacity>
            </View>

            <View style={styles.firstAidModalDivider} />

            <View style={styles.firstAidTipContent}>
                <Text style={styles.firstAidTipText}>{currentTip}</Text>
            </View>

            <View style={styles.firstAidModalDivider} />

            <View style={styles.firstAidDisclaimerContainer}>
                <Text style={styles.firstAidDisclaimerText}>
                ⚠️ These are general first aid suggestions for informational purposes only. Always seek professional medical help in emergencies.
                </Text>
            </View>

            <View style={styles.firstAidModalButtons}>
                <TouchableOpacity 
                style={[styles.firstAidModalButton, styles.firstAidNextTipButton]}
                onPress={getRandomTip}
                >
                <Text style={styles.firstAidNextTipText}>Next Tip</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                style={[styles.firstAidModalButton, styles.firstAidGotItButton]}
                onPress={() => setFirstAidModalVisible(false)}
                >
                <Text style={styles.firstAidGotItText}>Got It</Text>
                </TouchableOpacity>
            </View>
            </View>
        </View>
        </Modal>
    </ScrollView>
  );
};

export default SafetyResources;