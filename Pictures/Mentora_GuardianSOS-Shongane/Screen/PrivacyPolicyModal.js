// components/PrivacyPolicyModal.js
import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PrivacyPolicyModal = ({ visible, onClose }) => {
  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Enhanced Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#2A5B8C" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Privacy Policy</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Enhanced Content */}
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.lastUpdatedContainer}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</Text>
          </View>
          
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>1</Text>
              </View>
              <Text style={styles.sectionTitle}>Information We Collect</Text>
            </View>
            <Text style={styles.paragraph}>
              We collect information you provide directly to us, including:
            </Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Personal information (name, email, phone number)</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Profile information and photos</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Location data for safety features</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Emergency contact information</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Communication content</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>2</Text>
              </View>
              <Text style={styles.sectionTitle}>How We Use Your Information</Text>
            </View>
            <Text style={styles.paragraph}>
              We use the information we collect to:
            </Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Provide, maintain, and improve our services</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Send you safety alerts and notifications</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Respond to your comments and questions</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Monitor and analyze usage patterns</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Personalize your experience</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>3</Text>
              </View>
              <Text style={styles.sectionTitle}>Information Sharing</Text>
            </View>
            <Text style={styles.paragraph}>
              We do not sell your personal information. We may share your information only in these circumstances:
            </Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>With emergency contacts when you activate safety features</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>With law enforcement when required by law</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>With service providers who assist our operations</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>In connection with a business transfer</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>4</Text>
              </View>
              <Text style={styles.sectionTitle}>Data Security</Text>
            </View>
            <Text style={styles.paragraph}>
              We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>5</Text>
              </View>
              <Text style={styles.sectionTitle}>Your Rights</Text>
            </View>
            <Text style={styles.paragraph}>
              You have the right to:
            </Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Access and update your personal information</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Delete your account and associated data</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Opt-out of promotional communications</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Request data portability</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>6</Text>
              </View>
              <Text style={styles.sectionTitle}>Location Data</Text>
            </View>
            <Text style={styles.paragraph}>
              We collect location data to provide safety features and emergency assistance. You can control location sharing through your device settings.
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>7</Text>
              </View>
              <Text style={styles.sectionTitle}>Children's Privacy</Text>
            </View>
            <Text style={styles.paragraph}>
              Our services are not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13.
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>8</Text>
              </View>
              <Text style={styles.sectionTitle}>Changes to This Policy</Text>
            </View>
            <Text style={styles.paragraph}>
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>9</Text>
              </View>
              <Text style={styles.sectionTitle}>Contact Us</Text>
            </View>
            <Text style={styles.paragraph}>
              If you have any questions about this Privacy Policy, please contact us at:
            </Text>
            <View style={styles.contactInfo}>
              <View style={styles.contactItem}>
                <Ionicons name="mail-outline" size={16} color="#2A5B8C" />
                <Text style={styles.contactText}>Email: mentora@gmail.com</Text>
              </View>
              <View style={styles.contactItem}>
                <Ionicons name="location-outline" size={16} color="#2A5B8C" />
                <Text style={styles.contactText}>Address:Mentora Founders</Text>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.footerIcon}>
              <Ionicons name="shield-checkmark" size={24} color="#2A5B8C" />
            </View>
            <Text style={styles.footerText}>
              By using our application, you consent to our Privacy Policy and agree to its terms.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f8f9fa',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  backText: {
    fontSize: 16,
    color: '#2A5B8C',
    marginLeft: 2,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A5B8C',
  },
  headerRight: {
    width: 70,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  lastUpdatedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2A5B8C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2A5B8C',
    flex: 1,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    marginBottom: 12,
  },
  bulletList: {
    marginLeft: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2A5B8C',
    marginTop: 8,
    marginRight: 12,
  },
  bulletText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    flex: 1,
  },
  contactInfo: {
    marginTop: 8,
    marginLeft: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  footer: {
    marginTop: 30,
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#2A5B8C',
  },
  footerIcon: {
    marginBottom: 10,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PrivacyPolicyModal;