import { auth } from "../config/firebaseConfig";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useUser } from "../Users/useContext";

export default function LoginScreen({ navigation }) {
  const { login, user, token, loading, getOnboardingStatus } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [navigationHandled, setNavigationHandled] = useState(false);

  const GoToSignUp = () => {
    navigation.navigate("Signup");
  };

  useEffect(() => {
    console.log("🔄 Auth state check:", { 
      loading, 
      token: !!token, 
      user: !!user,
      navigationHandled
    });
    
    // Only proceed when loading is complete and we haven't already handled navigation
    if (!loading && !navigationHandled) {
      if (token && user) {
        console.log("✅ User authenticated, checking onboarding status...");
        
        // Check onboarding status for both new and existing accounts
        const onboardingStatus = getOnboardingStatus();
        
        console.log("📋 Onboarding status:", {
          email: user.email,
          hasEmergencyContacts: onboardingStatus.steps.emergency_contacts,
          hasProfileImage: onboardingStatus.steps.profile_image,
          completed: onboardingStatus.completed,
          missingSteps: onboardingStatus.missingSteps
        });
        
        setNavigationHandled(true);
        
        setTimeout(() => {
          if (onboardingStatus.completed) {
            console.log("🚀 Onboarding completed - Navigating to MainApp");
            navigation.reset({ index: 0, routes: [{ name: "MainApp" }] });
          } else {
            console.log("📋 Onboarding incomplete - Missing steps:", onboardingStatus.missingSteps);
            
            // Navigate to Onboarding flow instead of individual screens
            console.log("🚀 Navigating to Onboarding flow");
            navigation.reset({ 
              index: 0, 
              routes: [{ 
                name: "Onboarding",
                params: { 
                  initialStep: onboardingStatus.missingSteps[0] || "profile_image" 
                }
              }] 
            });
          }
        }, 100);
      } else {
        console.log("❌ No valid authentication found");
        setNavigationHandled(false);
      }
    }
  }, [loading, token, user, navigation, getOnboardingStatus, navigationHandled]);

  // Reset navigation handled when user logs out or token changes
  useEffect(() => {
    if (!token || !user) {
      setNavigationHandled(false);
    }
  }, [token, user]);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  // ✅ Login handler
  const handleLogin = async () => {
    if (loggingIn) return;
    
    // Basic validation
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoggingIn(true);
    setNavigationHandled(false);
    
    try {
      console.log("🔐 Starting login process...");
      const loggedInUser = await login(email, password, rememberMe);
      
      if (!loggedInUser) {
        throw new Error("Login failed - no user returned");
      }
      
      console.log("✅ Login successful:", {
        email: loggedInUser.email,
        emergencyContacts: loggedInUser.emergencyContacts?.length || 0,
        profileImage: !!loggedInUser.profileImage,
        userId: loggedInUser._id
      });
      
      // Clear form
      setEmail("");
      setPassword("");
      
    } catch (error) {
      console.error("❌ Login error:", error);
      Alert.alert("Login Failed", error.message || "Invalid email or password");
    } finally {
      setLoggingIn(false);
    }
  };

  const toggleRememberMe = () => setRememberMe(prev => !prev);

  const handleForgotPassword = () => {
    navigation.navigate('Forgot_Password');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
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
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
          
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChangeText={(text) => setEmail(text.trim())}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor="#888"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#888"
          />

          <View style={styles.rememberMeContainer}>
            <Switch
              value={rememberMe}
              onValueChange={setRememberMe}
              trackColor={{ false: "#ccc", true: "#3b82f6" }}
              thumbColor={"#fff"}
            />
            <Text style={styles.rememberMeText}>Remember Me</Text>
          </View>

          <TouchableOpacity
            style={[styles.signInButton, loggingIn && styles.disabledButton]}
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={loggingIn}
          >
            <Text style={styles.buttonText}>
              {loggingIn ? "Signing In..." : "Sign In"}
            </Text>
          </TouchableOpacity>

          <View style={styles.bottomLinksContainer}>
            <Text style={styles.CA1}>
              New User?{" "}
              <Text style={styles.CreateAccount} onPress={GoToSignUp}>
                Create Account
              </Text>
            </Text>

            <Text
              style={[styles.CreateAccount, { marginTop: 14, textAlign: "center" }]}
              onPress={handleForgotPassword}
            >
              Forgot Password?
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
// work from here
const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "#F9FAFB", 
  },

  topSection: {
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    borderBottomLeftRadius: 120,
    borderBottomRightRadius: 120,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  brand: {
    fontSize: 30,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 15,
    color: "#e0f2fe",
    marginTop: 4,
    fontWeight: "400",
  },

  // ⚪ Form Section
  bottomSection: {
    flex: 1,
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: -50,
    borderRadius: 16,
    padding: 24,
    paddingBottom: 50,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },

  // ✉️ Inputs
  label: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 6,
    marginTop: 10,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1.2,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    padding: 12,
    color: "#111",
    backgroundColor: "#F9FAFB",
    fontSize: 15,
    marginBottom: 14,
  },

  // 🔘 Buttons
  signInButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    elevation: 3,
    shadowColor: "#2563EB",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  disabledButton: {
    backgroundColor: "#9CA3AF",
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  // 🐛 Debug Button
  debugButton: {
    backgroundColor: "#F59E0B",
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  debugText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  // 🧠 Remember Me
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 15,
  },
  rememberMeText: {
    marginLeft: 8,
    color: "#374151",
    fontSize: 14,
    fontWeight: "500",
  },
  
  // Social buttons 
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  socialButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  socialButtonGoogle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#E5E7EB",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    justifyContent: "center",
    elevation: Platform.OS === "android" ? 2 : 0,
  },
  socialButtonFacebook: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#E5E7EB",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    justifyContent: "center",
    elevation: Platform.OS === "android" ? 2 : 0,
  },
  socialButtonText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '500',
    color: '#000', 
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  
  // 🧭 Bottom Text Links
  bottomLinksContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  CA1: {
    textAlign: "center",
    fontSize: 15,
    color: "#4B5563",
  },
  CreateAccount: {
    color: "#2563EB",
    fontWeight: "600",
  },
});