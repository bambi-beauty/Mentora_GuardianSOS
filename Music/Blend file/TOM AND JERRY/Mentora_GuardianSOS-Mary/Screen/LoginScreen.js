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

  const GoToSignUp = () => {
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

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const handleLogin = async () => {
    if (loggingIn) return;
    setLoggingIn(true);
    navigation.reset({ index: 0, routes: [{ name: "MainApp" }] });
    return;
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

  const handleForgotPassword = () => {
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

          {/* Social Login Buttons (non-functional) */}
          <TouchableOpacity
            style={styles.socialButtonLight}
            onPress={() => Alert.alert("Google login", "Google login triggered")}
          >
            <View style={styles.buttonContent}>
              <Icon name="google" size={20} color="#000" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialButtonDark}
            onPress={() => Alert.alert("Apple login", "Apple login triggered")}
          >
            <View style={styles.buttonContent}>
              <Icon name="apple" size={20} color="#fff" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialButtonBlue}
            onPress={() => Alert.alert("Facebook login", "Facebook login triggered")}
          >
            <View style={styles.buttonContent}>
              <Icon name="facebook" size={20} color="#fff" />
            </View>
          </TouchableOpacity>

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
    paddingVertical: 60,
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
    marginTop: -40,
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

  // 🌍 Social Buttons
  socialButtonLight: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#E5E7EB",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
    justifyContent: "center",
    elevation: Platform.OS === "android" ? 2 : 0,
  },
  socialButtonDark: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
    justifyContent: "center",
    elevation: Platform.OS === "android" ? 2 : 0,
  },
  socialButtonBlue: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1877F2",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 24,
    justifyContent: "center",
    elevation: Platform.OS === "android" ? 2 : 0,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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