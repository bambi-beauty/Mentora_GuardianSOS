import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Text as SvgText } from 'react-native-svg';

const HandwritingSVGText = ({ text, onAnimationEnd }) => {
  const dashOffsetAnim = useRef(new Animated.Value(1000)).current; 

  useEffect(() => {
    Animated.timing(dashOffsetAnim, {
      toValue: 0,
      duration: 4000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => {
      if (onAnimationEnd) onAnimationEnd();
    });
  }, [dashOffsetAnim]);

  return (
    <Svg height="80" width="300" viewBox="0 0 300 80">
      <SvgText
        fill="none"
        stroke="white"
        strokeWidth="1"
        fontSize="48"
        fontWeight="700"
        fontFamily="Dancing Script"
        x="10"
        y="60"
        strokeDasharray="1000"
        strokeDashoffset={dashOffsetAnim}
      >
        {text}
      </SvgText>
    </Svg>
  );
};

export default HandwritingSVGText;
