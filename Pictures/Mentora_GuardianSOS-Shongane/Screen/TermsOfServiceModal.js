// components/TermsOfServiceModal.js
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

const TermsOfServiceModal = ({ visible, onClose }) => {
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
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#2A5B8C" />
          </TouchableOpacity>
          <Text style={styles.title}>Terms of Service</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#2A5B8C" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</Text>
          
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By accessing and using this application, you accept and agree to be bound by the terms and provision of this agreement.
          </Text>

          <Text style={styles.sectionTitle}>2. Use License</Text>
          <Text style={styles.paragraph}>
            Permission is granted to temporarily use this application for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
          </Text>

          <Text style={styles.sectionTitle}>3. User Account</Text>
          <Text style={styles.paragraph}>
            When you create an account with us, you must provide accurate information. You are responsible for safeguarding the password and for all activities that occur under your account.
          </Text>

          <Text style={styles.sectionTitle}>4. User Responsibilities</Text>
          <Text style={styles.paragraph}>
            You agree not to use the service to:
            {'\n'}• Upload or transmit viruses or any malicious code
            {'\n'}• Violate any applicable laws or regulations
            {'\n'}• Infringe upon intellectual property rights
            {'\n'}• Harass, abuse, or harm other users
          </Text>

          <Text style={styles.sectionTitle}>5. Content</Text>
          <Text style={styles.paragraph}>
            Our service allows you to post, link, store, share and otherwise make available certain information. You are responsible for the content that you post.
          </Text>

          <Text style={styles.sectionTitle}>6. Termination</Text>
          <Text style={styles.paragraph}>
            We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms of Service or is harmful to other users.
          </Text>

          <Text style={styles.sectionTitle}>7. Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We reserve the right to modify these terms at any time. We will notify users of any changes by posting the new Terms of Service on this page.
          </Text>

          <Text style={styles.sectionTitle}>8. Contact Information</Text>
          <Text style={styles.paragraph}>
            If you have any questions about these Terms, please contact us at support@yourapp.com
          </Text>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By using our application, you acknowledge that you have read and understood these Terms of Service.
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
  backButton: {
    padding: 5,
  },
  closeButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A5B8C',
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

export default TermsOfServiceModal;