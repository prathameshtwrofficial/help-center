import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration with fallback values
const firebaseConfig = {
  apiKey: "AIzaSyAJmEzOgiuC6ij8MC4t2QKAnmEDEGLtfRo",
  authDomain: "help-center-bc0d1.firebaseapp.com",
  projectId: "help-center-bc0d1",
  storageBucket: "help-center-bc0d1.firebasestorage.app",
  messagingSenderId: "323572986409",
  appId: "1:323572986409:web:38c6359951eb7c8792a238",
  measurementId: "G-VHHYX7C5DQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics (only in production)
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };
export default app;