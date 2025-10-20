import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCwuBu_DzJs9OcrQZfsnQZay7-SG3bJKus",
  authDomain: "profileapp-8235f.firebaseapp.com",
  projectId: "profileapp-8235f",
  storageBucket: "profileapp-8235f.appspot.com",
  messagingSenderId: "367197289532",
  appId: "1:367197289532:web:245e9bc4297ba3fb2c1739",
  measurementId: "G-1D8P8SKZX8"
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);
export { auth };
