import React, { useState, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { LinearGradient } from 'expo-linear-gradient';
import HandwritingSVGText from './HandwritingSVGText'; // The component from above

SplashScreen.preventAutoHideAsync();

const SplashScreenComponent = ({ navigation }) => {
  const [handwritingDone, setHandwritingDone] = useState(false);
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    if (handwritingDone) {
      Animated.sequence([
        Animated.parallel([
          Animated.spring(logoScale, {
            toValue: 1,
            friction: 4,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        setTimeout(async () => {
          await SplashScreen.hideAsync();
          navigation.replace('Login');
        }, 30000);
      });
    }
  }, [handwritingDone]);

  return (
    <LinearGradient
      colors={['#0d47a1', '#1976d2', '#42a5f5']}
      style={styles.container}
    >
      <View style={styles.centeredContainer}>
        {!handwritingDone ? (
          <HandwritingSVGText
            text="GuardianSOS"
            onAnimationEnd={() => setHandwritingDone(true)}
          />
        ) : (
          <>
            <Animated.View
              style={[
                styles.logoContainer,
                { opacity: logoOpacity, transform: [{ scale: logoScale }] },
              ]}
            >
              <Image
                source={require('../assets/logoIcon.png')}
                style={styles.icon}
                resizeMode="contain"
              />
            </Animated.View>
            <Animated.Text style={styles.tagline}>
              Your Safety, One Tap Away.
            </Animated.Text>
          </>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  centeredContainer: { justifyContent: 'center', alignItems: 'center' },
  logoContainer: { marginTop: 20 },
  icon: { width: 90, height: 90 },
  tagline: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
    fontWeight: '600',
  },
});

export default SplashScreenComponent;


//npm install react-native-svg react-native-svg-animations

