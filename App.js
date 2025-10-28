import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";

import LoginScreen from "./Screen/LoginScreen";
import SignupScreen from "./Screen/SignupScreen";
import Email_Verification_Screen from "./Screen/Email_Verification_Screen";
import Add_Image from "./Screen/Add_Image";
import EmergencyContacts from "./Screen/Adding_Emergency_Contacts";
import ContactUsScreen from "./Screen/ContactUsScreen";
import EditProfileScreen from "./Screen/EditProfileScreen";
import EditNameScreen from "./Screen/EditNameScreen";
import EditContactScreen from "./Screen/EditContactScreen";
import EditEmailScreen from "./Screen/EditEmailScreen";
import ProfileDetailsScreen from "./Screen/ProfileDetailsScreen";
import SafetyScreen from "./Screen/SafetyScreen";
import HelpCenterScreen from "./Screen/HelpCenterScreen";
import NotificationsScreen from "./Screen/NotificationsScreen";
import LocationSelectorSimple from "./Screen/getUserLocations";
import MainApp from "./components/MainApp";
import ForgotPasswordScreen from "./Screen/Forgot_Password";
import DeleteAccount from "./Screen/DeleteAccount";
import SplashScreenComponent from './Screen/SplashScreen';
import OnboardingScreen from "./Screen/OnboardingScreen";
import TermsOfServiceModal from "./Screen/TermsOfServiceModal";
import PrivacyPolicyModal from "./Screen/PrivacyPolicyModal";

import { UserProvider } from "./Users/useContext";
import { ChatProvider } from "./ChatContext/ChatContext";
import { PostProvider } from './postContext/postContext';
import { GroupsProvider } from "./groupContext/groupContext";
import { SafetyProvider } from "./components/safetyContext";
import { ImageProvider } from "./context/ImageContext"; // Import the ImageProvider

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <UserProvider>
      <ChatProvider>
        <PostProvider>
          <GroupsProvider>
            <SafetyProvider>
              <ImageProvider> {/* Wrap with ImageProvider */}
                <NavigationContainer>
                  <Stack.Navigator
                    initialRouteName="splash"
                    screenOptions={{ headerShown: false }}
                  >
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Signup" component={SignupScreen} />
                    <Stack.Screen name="Email_Verification_Screen" component={Email_Verification_Screen} />
                    <Stack.Screen name="MainApp" component={MainApp} />
                    <Stack.Screen name="EmergencyContacts" component={EmergencyContacts} />
                    <Stack.Screen name="Add_Image" component={Add_Image} />
                    <Stack.Screen name="SafetyScreen" component={SafetyScreen} />
                    <Stack.Screen name="ContactUsScreen" component={ContactUsScreen} />
                    <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
                    <Stack.Screen name="ProfileDetailsScreen" component={ProfileDetailsScreen} />
                    <Stack.Screen name="NotificationScreen" component={NotificationsScreen} />
                    <Stack.Screen name="EditNameScreen" component={EditNameScreen}/>
                    <Stack.Screen name="EditContactScreen" component={EditContactScreen}/>
                    <Stack.Screen name="EditEmailScreen" component={EditEmailScreen}/>
                    <Stack.Screen name="LocationSelectorSimple" component={LocationSelectorSimple} />
                    <Stack.Screen name="HelpCenterScreen" component={HelpCenterScreen} />
                    <Stack.Screen name="Forgot_Password" component={ForgotPasswordScreen} />
                    <Stack.Screen name="DeleteAccount" component={DeleteAccount} />
                    <Stack.Screen name="splash" component={SplashScreenComponent} />
                    <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                    <Stack.Screen name="TermsOfService" component={TermsOfServiceModal} />
                    <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyModal} />
                  </Stack.Navigator>
                </NavigationContainer>
              </ImageProvider>
            </SafetyProvider>
          </GroupsProvider>
        </PostProvider>
      </ChatProvider>
    </UserProvider>
  );
}