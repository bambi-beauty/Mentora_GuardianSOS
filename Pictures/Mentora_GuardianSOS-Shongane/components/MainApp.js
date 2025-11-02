import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/FontAwesome';


import HomeScreen from './screen/HomeScreen';
import MapScreen from './screen/MapScreen';
import CommunityScreen from './screen/CommunityScreen'; 
import ProfileScreen from './screen/ProfileScreen';



const Tab = createBottomTabNavigator();

function MainApp() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2A5B8C',
        tabBarInactiveTintColor: '#718096',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          paddingVertical: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 5,
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Map" 
        component={MapScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="map" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Community" 
        component={CommunityScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="users" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="user" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

export default MainApp;
