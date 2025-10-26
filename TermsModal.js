import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

const TermsModal = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Terms of Service</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="times" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.modalContent}
            showsVerticalScrollIndicator={true}
          >
            <Text style={styles.termsHeading}>Welcome to GuardianSOS</Text>
            
            <Text style={styles.termsText}>
              By using GuardianSOS, you agree to these Terms of Service. Please read them carefully.
            </Text>

            <Text style={styles.termsSection}>1. Acceptance of Terms</Text>
            <Text style={styles.termsText}>
              By accessing and using GuardianSOS, you accept and agree to be bound by these Terms of Service.
            </Text>

            <Text style={styles.termsSection}>2. Safety Features</Text>
            <Text style={styles.termsText}>
              GuardianSOS provides emergency alert and community safety features. While we strive to provide reliable service, we cannot guarantee uninterrupted access or immediate response in emergencies.
            </Text>

            <Text style={styles.termsSection}>3. User Responsibilities</Text>
            <Text style={styles.termsText}>
              You are responsible for maintaining the confidentiality of your account and password. You agree to provide accurate information and use the service lawfully.
            </Text>

            <Text style={styles.termsSection}>4. Privacy</Text>
            <Text style={styles.termsText}>
              Your privacy is important to us. We collect and use your data as described in our Privacy Policy to provide and improve our safety services.
            </Text>

            <Text style={styles.termsSection}>5. Community Guidelines</Text>
            <Text style={styles.termsText}>
              You agree not to misuse the community features. Harassment, false reports, or inappropriate content may result in account suspension.
            </Text>

            <Text style={styles.termsText}>
              These terms may be updated periodically. Continued use of GuardianSOS constitutes acceptance of any changes.
            </Text>
          </ScrollView>

          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={onClose}
          >
            <Text style={styles.modalCloseText}>I Understand</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: screenWidth * 0.9,
    maxHeight: screenHeight * 0.75,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    marginBottom: 20,
    },
  termsHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 12,
    textAlign: 'center',
  },
  termsSection: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  termsText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
    marginBottom: 12,
  },
  modalCloseButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TermsModal;