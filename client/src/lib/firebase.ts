import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  getRedirectResult,
  User,
  UserCredential
} from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: "", // Optional
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Debug configuration
console.log("Firebase config (without sensitive data):", {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? "[API KEY PRESENT]" : "[API KEY MISSING]",
  appId: firebaseConfig.appId ? "[APP ID PRESENT]" : "[APP ID MISSING]",
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google provider with additional parameters for Replit environment
googleProvider.setCustomParameters({
  prompt: 'select_account',
  // Allow redirect to Replit domain
  redirect_uri: window.location.origin
});

// Authentication functions
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    console.log("Attempting sign in with Google popup...");
    // In Replit, popup may be blocked, so we'll try popup first, then fall back to redirect
    return await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Error in signInWithGoogle popup:", error);
    
    // Check if this is a popup blocked error
    if (error instanceof Error && error.message.includes('popup')) {
      console.log("Popup blocked, falling back to redirect...");
      // If popup is blocked, try redirect flow instead
      signInWithGoogleRedirect();
      // This function won't return as the page will redirect
      throw new Error("Redirecting to Google authentication. Please wait...");
    }
    
    // Re-throw other errors
    throw error;
  }
};

export const signInWithGoogleRedirect = () => {
  console.log("Using redirect method for Google sign-in");
  return signInWithRedirect(auth, googleProvider);
};

export const emailSignIn = async (email: string, password: string): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const emailSignUp = async (email: string, password: string): Promise<UserCredential> => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const resetPassword = async (email: string): Promise<void> => {
  return sendPasswordResetEmail(auth, email);
};

export const logOut = async (): Promise<void> => {
  return signOut(auth);
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// This function should be called on app initialization to handle redirect results
export const handleAuthRedirect = async (): Promise<UserCredential | null> => {
  try {
    console.log("Checking for redirect result...");
    const result = await getRedirectResult(auth);
    if (result) {
      console.log("Received redirect result:", result.user.email);
      return result;
    }
    console.log("No redirect result found");
    return null;
  } catch (error) {
    console.error("Error processing redirect result:", error);
    throw error;
  }
};

export { auth, onAuthStateChanged };
export type { User, UserCredential };