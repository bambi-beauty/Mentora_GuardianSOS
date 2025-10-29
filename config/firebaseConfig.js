import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyAzYJK532UB3BCnShvEQjGEJMadyKhIDfw",
  authDomain: "guardiansos-1a52b.firebaseapp.com",
  projectId: "guardiansos-1a52b",
  storageBucket: "guardiansos-1a52b.firebasestorage.app",
  messagingSenderId: "124134869029",
  appId: "1:124134869029:web:f3dca1c7d1802e28e597cc",
  measurementId: "G-4F5XPH5TQN"
};


const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (err) {
}

export { auth };
