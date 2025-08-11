// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCVSLYG2-4kByi7K5IxiP4o240LRa1YphI",
  authDomain: "korsify-app.firebaseapp.com",
  projectId: "korsify-app",
  storageBucket: "korsify-app.firebasestorage.app",
  messagingSenderId: "171712092792",
  appId: "1:171712092792:web:a3160bf28dfe4746a9eb8d",
  measurementId: "G-W7B0X9LS6Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Google Provider
export const googleProvider = new GoogleAuthProvider();

// Sign in with Google using popup
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    const user = result.user;
    
    // Get the ID token
    const idToken = await user.getIdToken();
    
    return {
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      },
      idToken,
      accessToken: token
    };
  } catch (error: any) {
    console.error("Error signing in with Google:", error);
    // Provide helpful error message for unauthorized domain
    if (error.code === 'auth/unauthorized-domain') {
      throw new Error('This domain is not authorized for Firebase authentication. Please add it to the authorized domains in Firebase Console.');
    }
    throw error;
  }
};

// Sign in with Google using redirect (for mobile)
export const signInWithGoogleRedirect = async () => {
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error: any) {
    console.error("Error initiating Google sign-in redirect:", error);
    throw error;
  }
};

// Handle redirect result
export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      const user = result.user;
      
      // Get the ID token
      const idToken = await user.getIdToken();
      
      return {
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        },
        idToken,
        accessToken: token
      };
    }
    return null;
  } catch (error: any) {
    console.error("Error handling redirect result:", error);
    throw error;
  }
};

// Initialize Analytics only in production
let analytics;
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  analytics = getAnalytics(app);
}

export { analytics };