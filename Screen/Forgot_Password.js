import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome'; // Or your icon lib

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordReset = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    // TODO: Implement your password reset logic here (API call)

    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Password Reset',
        'If this email is registered, you will receive a reset link shortly.'
      );
      navigation.goBack(); // Or navigate to login
    }, 1500);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topSection}>
          <Text style={styles.brand}>GuardianSOS</Text>
          <Text style={styles.tagline}>Your safety, our priority</Text>
        </View>

        <View style={styles.bottomSection}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your email to receive a password reset link.
          </Text>

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={(text) => setEmail(text.trim())}
            placeholderTextColor="#888"
          />

          <TouchableOpacity
            style={styles.resetButton}
            onPress={handlePasswordReset}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backToLoginContainer}
          >
            <Text style={styles.backToLoginText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#fff',
  },
  topSection: {
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
    marginTop: 28,
  },
  brand: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#e0f2fe',
  },
  bottomSection: {
    padding: 24,
    paddingBottom: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    color: '#444',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 24,
    color: '#000',
  },
  resetButton: {
    backgroundColor: '#3b82f6',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backToLoginContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  backToLoginText: {
    color: '#3b82f6',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default ForgotPasswordScreen;
