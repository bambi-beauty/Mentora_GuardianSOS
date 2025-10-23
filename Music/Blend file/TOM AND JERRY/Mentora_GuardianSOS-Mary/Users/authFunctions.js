// Users/authFunctions.js

import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect } from 'react';
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './config';

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: '857626667996-6si7bvnkrd9vcgmetcfqhs8n2r6g7o5e.apps.googleusercontent.com',
    iosClientId: '857626667996-6si7bvnkrd9vcgmetcfqhs8n2r6g7o5e.apps.googleusercontent.com',
    androidClientId: '857626667996-6si7bvnkrd9vcgmetcfqhs8n2r6g7o5e.apps.googleusercontent.com',
    webClientId: '857626667996-6si7bvnkrd9vcgmetcfqhs8n2r6g7o5e.apps.googleusercontent.com', // (same as expo)
  });

  const signInWithGoogle = async () => {
    if (response?.type === 'success') {
      const { authentication } = response;

      const credential = GoogleAuthProvider.credential(
        authentication.idToken,
        authentication.accessToken
      );

      const result = await signInWithCredential(auth, credential);
      return result.user;
    }
  };

  return { request, response, promptAsync, signInWithGoogle };
};
