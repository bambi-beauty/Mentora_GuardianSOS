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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#2A5B8C" />
          </TouchableOpacity>
          <Text style={styles.title}>Privacy Policy</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</Text>
          
          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.paragraph}>
            We collect information you provide directly to us, including:
            {'\n'}• Personal information (name, email, phone number)
            {'\n'}• Profile information and photos
            {'\n'}• Location data for safety features
            {'\n'}• Emergency contact information
            {'\n'}• Communication content
          </Text>

          <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            We use the information we collect to:
            {'\n'}• Provide, maintain, and improve our services
            {'\n'}• Send you safety alerts and notifications
            {'\n'}• Respond to your comments and questions
            {'\n'}• Monitor and analyze usage patterns
            {'\n'}• Personalize your experience
          </Text>

          <Text style={styles.sectionTitle}>3. Information Sharing</Text>
          <Text style={styles.paragraph}>
            We do not sell your personal information. We may share your information only in these circumstances:
            {'\n'}• With emergency contacts when you activate safety features
            {'\n'}• With law enforcement when required by law
            {'\n'}• With service providers who assist our operations
            {'\n'}• In connection with a business transfer
          </Text>

          <Text style={styles.sectionTitle}>4. Data Security</Text>
          <Text style={styles.paragraph}>
            We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.
          </Text>

          <Text style={styles.sectionTitle}>5. Your Rights</Text>
          <Text style={styles.paragraph}>
            You have the right to:
            {'\n'}• Access and update your personal information
            {'\n'}• Delete your account and associated data
            {'\n'}• Opt-out of promotional communications
            {'\n'}• Request data portability
          </Text>

          <Text style={styles.sectionTitle}>6. Location Data</Text>
          <Text style={styles.paragraph}>
            We collect location data to provide safety features and emergency assistance. You can control location sharing through your device settings.
          </Text>

          <Text style={styles.sectionTitle}>7. Children's Privacy</Text>
          <Text style={styles.paragraph}>
            Our services are not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13.
          </Text>

          <Text style={styles.sectionTitle}>8. Changes to This Policy</Text>
          <Text style={styles.paragraph}>
            We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.
          </Text>

          <Text style={styles.sectionTitle}>9. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have any questions about this Privacy Policy, please contact us at:
            {'\n'}Email: privacy@yourapp.com
            {'\n'}Address: [Your Company Address]
          </Text>

          <View style={styles.footer}>
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
  },
  closeButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A5B8C',
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginVertical: 15,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A5B8C',
    marginTop: 20,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    marginBottom: 10,
  },
  footer: {
    marginTop: 30,
    marginBottom: 40,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
});

export default PrivacyPolicyModal;