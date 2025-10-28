import * as Facebook from 'expo-facebook';
import { auth } from "../config/firebaseConfig";
import { FacebookAuthProvider, signInWithCredential } from 'firebase/auth';

async function loginWithFacebook() {
  try {
    await Facebook.initializeAsync({
      appId: '1114350687129940',
    });
    const { type, token } = await Facebook.logInWithReadPermissionsAsync({
      permissions: ['public_profile', 'email'],
    });
    if (type === 'success' && token) {
      const credential = FacebookAuthProvider.credential(token);
      await signInWithCredential(auth, credential);
      console.log('Logged in with Facebook!');
    } else {
      console.log('Facebook login cancelled');
    }
  } catch ({ message }) {
    alert(`Facebook login error: ${message}`);
  }
}
