import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import * as Animatable from 'react-native-animatable';

export default function Email_Verification_Screen({ route, navigation }) {
  const email = route?.params?.email;
  const [code, setCode] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const timerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let interval;

    if (timerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);

      Animated.timing(timerAnim, {
        toValue: 1,
        duration: timer * 1000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    } else {
      timerAnim.setValue(0);
    }

    if (timer === 0) {
      setTimerActive(false);
    }

    return () => clearInterval(interval);
  }, [timer, timerActive]);

  const triggerShake = () => {
    shakeAnimation.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleChangeText = (text, index) => {
    if (/^\d?$/.test(text)) {
      const newCode = [...code];
      newCode[index] = text;
      setCode(newCode);

      if (text && index < inputRefs.current.length - 1) {
        inputRefs.current[index + 1].focus();
      }

      const complete = newCode.every(digit => digit !== '');
      if (complete) {
        setTimeout(() => {
          handleVerify(newCode.join(''));
        }, 100);
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && code[index] === '' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = async (otpFromChange = null) => {
    const otp = otpFromChange || code.join('');
    if (otp.length === 4) {
      setLoading(true);
      try {
        const response = await fetch('https://baroscopical-natosha-overrigid.ngrok-free.dev/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp }),
        });

        const data = await response.json();

        setLoading(false);

        if (response.ok) {
          setSuccess(true);
          Alert.alert('Success', data.message || 'Code verified!');
          setTimeout(() => {
            navigation.navigate('Login');
          }, 1500);
        } else {
          setCode(['', '', '', '']);
          inputRefs.current[0].focus();
          triggerShake();
          Alert.alert('Error', data.message || 'Invalid OTP');
        }
      } catch (err) {
        setLoading(false);
        Alert.alert('Error', 'Network error. Please try again.');
      }
    } else {
      Alert.alert('Error', 'Please enter the full 4-digit code.');
    }
  };

  const handleResend = async () => {
    if (!timerActive) {
      try {
        const response = await fetch('http://192.168.137.1:3000/api/auth/resend-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok) {
          setCode(['', '', '', '']);
          inputRefs.current[0].focus();
          setTimer(30);
          setTimerActive(true);
          Alert.alert('Code Resent', data.message || 'A new code has been sent.');
        } else {
          Alert.alert('Error', data.message || 'Failed to resend code.');
        }
      } catch (err) {
        Alert.alert('Error', 'Network error. Please try again.');
      }
    }
  };

  // Animated style for shaking inputs
  const shakeStyle = {
    transform: [
      {
        translateX: shakeAnimation,
      },
    ],
  };
  const timerWidth = timerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['100%', '0%'],
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.brand}>GuardianSOS</Text>
        <Text style={styles.tagline}>Your safety, our priority</Text>
      </View>

      <Image
        source={require('../assets/EmailBG.png')}
        style={styles.image}
        resizeMode="contain"
      />

      <Text style={styles.title}>Verify Your Email</Text>
      <Text style={styles.subtitle}>
        Enter the 4-digit code sent to your email address
      </Text>

      <Animated.View style={[styles.inputsContainer, shakeStyle]}>
        {code.map((digit, index) => (
          <TextInput
            key={index}
            style={[
              styles.inputBox,
              focusedIndex === index && styles.inputFocused,
            ]}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={text => handleChangeText(text, index)}
            onKeyPress={e => handleKeyPress(e, index)}
            ref={ref => (inputRefs.current[index] = ref)}
            editable={!loading && !success}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex(-1)}
          />
        ))}
      </Animated.View>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginVertical: 20 }} />
      ) : success ? (
        <Animatable.View
          animation="bounceIn"
          iterationCount={1}
          style={styles.successContainer}
        >
          <Text style={styles.successText}>✔ Verified!</Text>
        </Animatable.View>
      ) : (
        <TouchableOpacity style={styles.verifyButton} onPress={() => handleVerify()}>
          <Text style={styles.buttonText}>Verify</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.infoText}>Didn't get the code?</Text>

      <TouchableOpacity disabled={timer > 0} onPress={handleResend}>
        <Text style={[styles.resendText, timer > 0 && styles.disabledText]}>
          {timer > 0 ? `Resend Code in ${timer}s` : 'Resend Code'}
        </Text>

        {timerActive && (
          <Animated.View style={[styles.timerBar, { width: timerWidth }]} />
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    padding:10,
    width:'100%'
  },
   topSection: {
    height: "30%",
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius:120,
    borderBottomRightRadius:120,
    width:'120%',
    marginBottom:10
  },
  brand: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    color: '#e0f2fe',
  },
  image: {
    width: 250,
    height: 160,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 10,
  },
  inputBox: {
    width: 50,
    height: 50,
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
  },
  verifyButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  resendText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  disabledText: {
    color: '#aaa',
  },
});
