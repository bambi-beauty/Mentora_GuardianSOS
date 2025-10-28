import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Svg, Circle } from 'react-native-svg'; // Import from react-native-svg

const AnimatedCircularProgress = ({ 
  percentage, 
  size = 120, 
  strokeWidth = 10, 
  duration = 1500 
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayPercentage, setDisplayPercentage] = useState(0);
  const halfCircle = size + strokeWidth;
  const circleCircumference = 2 * Math.PI * (size / 2);

  useEffect(() => {
    // Animate the percentage value
    Animated.timing(animatedValue, {
      toValue: percentage,
      duration: duration,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();

    // Update display percentage for counter animation
    animatedValue.addListener((v) => {
      setDisplayPercentage(Math.floor(v.value));
    });

    return () => {
      animatedValue.removeAllListeners();
    };
  }, [percentage]);

  const getColor = (percent) => {
    if (percent >= 80) return '#4CAF50'; // Green
    if (percent >= 60) return '#FFC107'; // Yellow
    if (percent >= 40) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const strokeDashoffset = circleCircumference - (circleCircumference * percentage) / 100;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background Circle */}
      <View style={styles.backgroundCircle}>
        <Svg height={size} width={size} viewBox={`0 0 ${halfCircle * 2} ${halfCircle * 2}`}>
          <Circle
            cx="50%"
            cy="50%"
            r={size / 2}
            stroke="#e6e6e6"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
        </Svg>
      </View>
      
      {/* Progress Circle */}
      <View style={styles.progressCircle}>
        <Svg height={size} width={size} viewBox={`0 0 ${halfCircle * 2} ${halfCircle * 2}`}>
          <Circle
            cx="50%"
            cy="50%"
            r={size / 2}
            stroke={getColor(percentage)}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circleCircumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${halfCircle} ${halfCircle})`}
          />
        </Svg>
      </View>
      
      {/* Percentage Text */}
      <View style={styles.textContainer}>
        <Text style={[styles.percentageText, { color: getColor(percentage) }]}>
          {displayPercentage}%
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundCircle: {
    position: 'absolute',
  },
  progressCircle: {
    position: 'absolute',
  },
  textContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default AnimatedCircularProgress;  