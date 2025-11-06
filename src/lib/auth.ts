import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile
} from "firebase/auth";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  createdAt: Timestamp;
  lastLogin?: Timestamp;
  likings?: string[];
  searchedKeywords?: string[];
}

export const authService = {
  // User registration
  async registerUser(email: string, password: string, displayName: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update display name
      await updateProfile(user, { displayName });

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName,
        role: 'user',
        createdAt: Timestamp.now(),
        lastLogin: Timestamp.now(),
        likings: [],
        searchedKeywords: []
      };

      await setDoc(doc(db, "users", user.uid), userProfile);

      return { user, profile: userProfile };
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // User login
  async loginUser(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update last login
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { lastLogin: Timestamp.now() }, { merge: true });

      // Get user profile
      const userDoc = await getDoc(userRef);
      const profile = userDoc.data() as UserProfile;

      return { user, profile };
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Admin login
  async loginAdmin(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if user has admin role
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const profile = userDoc.data() as UserProfile;
        if (profile.role === 'admin') {
          // Update last login
          await setDoc(userRef, { lastLogin: Timestamp.now() }, { merge: true });
          return { user, profile };
        } else {
          await signOut(auth);
          throw new Error("Access denied. Admin privileges required.");
        }
      } else {
        await signOut(auth);
        throw new Error("Admin account not found.");
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Logout
  async logout() {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Get current user profile
  async getCurrentUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error("Error getting user profile:", error);
      return null;
    }
  },

  // Auth state observer
  onAuthStateChange(callback: (user: User | null, profile: UserProfile | null) => void) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await this.getCurrentUserProfile(user.uid);
        callback(user, profile);
      } else {
        callback(null, null);
      }
    });
  }
};