import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TextInput,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import LottieView from "lottie-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useUser } from "../Users/useContext";

const { width } = Dimensions.get("window");

const slides = [
  {
    id: 1,
    title: "Welcome to GuardianSOS",
    description: "Your safety, our priority. Stay connected and protected 24/7.",
    animation: require("../assets/Amimation1.gif"),
    gradient: ["#3b82f6", "#60a5fa", "#93c5fd"],
  },
  {
    id: 2,
    title: "Instant Alerts",
    description: "Send SOS alerts to your emergency contacts with one tap.",
    // animation: require("../assets/animations/alert.json"),
    gradient: ["#2563eb", "#4f46e5", "#818cf8"],
  },
  {
    id: 3,
    title: "Live Location Sharing",
    description: "Share your real-time location with trusted friends or family.",
    // animation: require("../assets/animations/location.json"),
    gradient: ["#1e3a8a", "#3b82f6", "#60a5fa"],
  },
];

const OnboardingScreen = ({ navigation }) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef();
  const { completeOnboarding } = useUser();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [formVisible, setFormVisible] = useState(false);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleScroll = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const nextSlide = () => {
    if (currentIndex < slides.length - 1) {
      scrollRef.current.scrollTo({ x: (currentIndex + 1) * width, animated: true });
    } else {
      setFormVisible(true);
    }
  };

  const skipOnboarding = () => setFormVisible(true);

  const handleFinish = async () => {
    if (!name.trim() || !phoneNumber.trim()) {
      alert("Please enter your name and phone number.");
      return;
    }
    await completeOnboarding({ name, phoneNumber });
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  const progressWidth = scrollX.interpolate({
    inputRange: [0, (slides.length - 1) * width],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {!formVisible ? (
        <View style={{ flex: 1 }}>
          {/* Skip Button */}
          <TouchableOpacity style={styles.skipButton} onPress={skipOnboarding}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>

          <Animated.ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false, listener: handleScroll }
            )}
            scrollEventThrottle={16}
          >
            {slides.map((slide) => (
              <LinearGradient key={slide.id} colors={slide.gradient} style={styles.slide}>
                {slide.animation && (
                  <LottieView
                    source={slide.animation}
                    autoPlay
                    loop
                    style={styles.lottie}
                  />
                )}
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.description}>{slide.description}</Text>
              </LinearGradient>
            ))}
          </Animated.ScrollView>

          {/* Pagination Dots */}
          <View style={styles.pagination}>
            {slides.map((_, i) => {
              const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
              const dotWidth = scrollX.interpolate({
                inputRange,
                outputRange: [8, 20, 8],
                extrapolate: "clamp",
              });
              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.3, 1, 0.3],
                extrapolate: "clamp",
              });
              return (
                <Animated.View
                  key={i}
                  style={[styles.dot, { width: dotWidth, opacity }]}
                />
              );
            })}
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
          </View>

          {/* Next Button */}
          <TouchableOpacity style={styles.nextButton} onPress={nextSlide}>
            <Text style={styles.nextText}>
              {currentIndex === slides.length - 1 ? "Get Started" : "Next"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.formContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.formTitle}>Let’s set up your profile</Text>
          <Text style={styles.formSubtitle}>
            We’ll need some basic info to personalize your experience.
          </Text>

          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />

          <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
            <Text style={styles.finishText}>Finish Setup</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  skipButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  skipText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  slide: {
    width,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  lottie: {
    width: width * 0.7,
    height: width * 0.7,
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: "#f1f5f9",
    textAlign: "center",
    paddingHorizontal: 30,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
    marginHorizontal: 5,
  },
  progressBarContainer: {
    height: 4,
    width: "80%",
    backgroundColor: "rgba(255,255,255,0.3)",
    alignSelf: "center",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#fff",
  },
  nextButton: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    alignSelf: "center",
    paddingHorizontal: 50,
    borderRadius: 30,
    marginBottom: 50,
    marginTop: 20,
  },
  nextText: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "700",
  },
  formContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
    marginBottom: 10,
  },
  formSubtitle: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 24,
  },
  label: {
    color: "#333",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    color: "#000",
    marginBottom: 16,
  },
  finishButton: {
    backgroundColor: "#3b82f6",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  finishText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default OnboardingScreen;


//https://lottiefiles.com/free-animation/login-4rLqu2p6Td