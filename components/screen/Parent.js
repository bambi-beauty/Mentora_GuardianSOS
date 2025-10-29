// ParentScreen.js
import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import CommunityScreen from './CommunityScreen';

export default function ParentScreen() {
  const [hamburgerVisible, setHamburgerVisible] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      {/* 🔘 Header with hamburger button */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          top: 50,
          left: 20,
          zIndex: 100,
          backgroundColor: '#fff',
          padding: 8,
          borderRadius: 6,
          elevation: 2
        }}
        onPress={() => setHamburgerVisible(true)}
      >
        <FontAwesome name="bars" size={24} color="#333" />
      </TouchableOpacity>

      {/* 🔗 Pass both props to CommunityScreen */}
      <CommunityScreen
        hamburgerVisible={hamburgerVisible}
        setHamburgerVisible={setHamburgerVisible}
      />
    </View>
  );
}
