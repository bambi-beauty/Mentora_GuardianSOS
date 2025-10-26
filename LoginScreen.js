import { auth } from "../config/firebaseConfig";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { loginWithFacebook } from '../Users/authFunctions';
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
import Icon from "react-native-vector-icons/FontAwesome";

 export default function LoginScreen({ navigation }) {
  const { login, user, token, loading } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  const GoToSignUp=()=>{
    navigation.navigate("Signup")
  }
  useEffect(() => {
    if (!loading && token && user) {
      if (user.onboardingCompleted) {
        navigation.reset({ index: 0, routes: [{ name: "MainApp" }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: "EmergencyContacts" }] });
      }
    }
  }, [loading, token, user]);

  WebBrowser.maybeCompleteAuthSession();

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId:  "124134869029-51j7cif66par7nf4n059cj8k4mq8v7hp.apps.googleusercontent.com", 
    iosClientId: "124134869029-p774bi194qcjgfosvjd333rtdhp0g9rh.apps.googleusercontent.com", 
    androidClientId: "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com", // for Android
  });


  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);

      signInWithCredential(auth, credential)
        .then(() => {
          console.log("✅ Logged in with Google!");
          navigation.reset({ index: 0, routes: [{ name: "MainApp" }] });
        })
        .catch((error) => {
          console.error("Google sign-in error:", error);
          Alert.alert("Google Sign-In Failed", error.message);
        });
    }
  }, [response]);
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const handleLogin = async () => {
    if (loggingIn) return;
    setLoggingIn(true);
    try {
      const loggedInUser = await login(email, password, rememberMe);
      if (!loggedInUser) {
        throw new Error("User not returned from login.");
      }
      setEmail("");
      setPassword("");
      
    } catch (error) {
      Alert.alert("Login Failed", error.message || "Invalid email or password");
    } finally {
      setLoggingIn(false);
    }
  };
  const toggleRememberMe = () => setRememberMe(prev => !prev);

  const handleForgotPassword=()=>{
    navigation.navigate('Forgot_Password')
  }
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

        {/* Email Login Form */}
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
          style={styles.signInButton}
          onPress={handleLogin}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Login Buttons - SIDE BY SIDE */}
        <View style={styles.socialButtonsRow}>
          <TouchableOpacity
            style={styles.socialButtonGoogle}
            onPress={() => promptAsync()} 
          >
            <View style={styles.buttonContent}>
              <Icon name="google" size={20} color="#000" />
              <Text style={styles.socialButtonText}>Google</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialButtonFacebook}
            onPress={loginWithFacebook}
          >
            <View style={styles.buttonContent}>
              <Icon name="facebook" size={20} color="#1877F2" />
              <Text style={styles.socialButtonText}>Facebook</Text>
            </View>
          </TouchableOpacity>
        </View>

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

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "#F9FAFB", 
  },

  topSection: {
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80, // Increased from 60 to 80
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
    marginTop: -50, // Increased from -40 to -50
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
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.5,
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