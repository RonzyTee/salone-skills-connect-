'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import {
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import {
  doc,
  onSnapshot,
  setDoc,
  getDoc,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserProfile } from '@/types';

// =========================================================
// 1. AuthContextType Interface
// =========================================================
interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  refreshUserProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =========================================================
// 2. AuthProvider Component
// =========================================================
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true); // Start as true to check auth status initially

  // Effect for handling Authentication State and User Profile fetching
  useEffect(() => {
    let unsubscribeProfile: () => void = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      unsubscribeProfile(); // Clean up old profile listener

      if (currentUser) {
        // User is LOGGED IN
        // When a user logs in or is already logged in, we set loading to true
        // until their profile is fetched.
        setLoading(true);
        setUser(currentUser);

        const userDocRef = doc(db, 'users', currentUser.uid);

        unsubscribeProfile = onSnapshot(
          userDocRef,
          async (docSnap) => {
            if (docSnap.exists()) {
              setUserProfile(docSnap.data() as UserProfile);
            } else {
              // Profile doesn't exist, create it
              const newUserProfileData: UserProfile = {
                uid: currentUser.uid,
                email: currentUser.email || '',
                fullName: currentUser.displayName || 'New User',
                userType: 'youth', // Default userType
                oivpStatus: { tier0: 'unverified' },
                projectsCount: 0,
                endorsementsCount: 0,
                followers: [],
                following: [],
                selectedSkills: [],
                createdAt: serverTimestamp() as Timestamp,
                isOnline: true,
                lastSeen: serverTimestamp() as Timestamp,
              };
              try {
                await setDoc(userDocRef, newUserProfileData, { merge: true });
                setUserProfile(newUserProfileData);
              } catch (error) {
                console.error('Failed to create user profile:', error);
                setUserProfile(null);
              }
            }
            setLoading(false); // Profile fetched/created, stop loading
          },
          (error) => {
            console.error('Error listening to user profile:', error);
            setUserProfile(null);
            setLoading(false); // Stop loading even if there's an error
          }
        );
      } else {
        // User is LOGGED OUT
        setUser(null);
        setUserProfile(null);
        setLoading(false); // Auth state determined as logged out, stop loading
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile();
    };
  }, []);

  // Centralized Presence Management Hook
  useEffect(() => {
    if (!user?.uid) {
      // Don't run presence logic if no user is logged in
      return;
    }

    const userStatusRef = doc(db, 'users', user.uid);

    // Set online status when component mounts (user logs in or refreshes page)
    updateDoc(userStatusRef, { isOnline: true, lastSeen: serverTimestamp() });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        updateDoc(userStatusRef, {
          isOnline: false,
          lastSeen: serverTimestamp(),
        });
      } else {
        updateDoc(userStatusRef, { isOnline: true });
      }
    };

    const handleBeforeUnload = () => {
      // Use navigator.sendBeacon for more reliable updates on page unload
      // This is an advanced technique, a simple updateDoc might still be prone to race conditions
      // but is generally "good enough" for many cases.
      // For more robust presence, consider Firebase Realtime Database and custom cloud functions.
      updateDoc(userStatusRef, {
        isOnline: false,
        lastSeen: serverTimestamp(),
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // Attempt to set offline one last time when component unmounts (e.g., user logs out)
      // This might not always fire reliably depending on browser behavior.
      updateDoc(userStatusRef, {
        isOnline: false,
        lastSeen: serverTimestamp(),
      });
    };
  }, [user?.uid]); // Re-run effect if user UID changes

  // Function to manually refresh profile data
  const refreshUserProfile = useCallback(async () => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as UserProfile);
      } else {
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Error manually refreshing user profile:', error);
    }
  }, [user]);

  // Logout function
  const logout = async () => {
    setLoading(true); // <--- IMPORTANT CHANGE: Immediately set loading to true
    try {
      // Optional: Set user offline in Firestore *before* signing out
      // This part ensures a more immediate offline status if the user closes the tab immediately after logging out.
      if (user) {
        const userStatusRef = doc(db, 'users', user.uid);
        await updateDoc(userStatusRef, {
          isOnline: false,
          lastSeen: serverTimestamp(),
        });
      }
      await signOut(auth); // This triggers the onAuthStateChanged listener
      // The onAuthStateChanged listener will then detect the null user,
      // update user/userProfile to null, and finally set setLoading(false).
    } catch (error) {
      console.error('Error signing out: ', error);
      setLoading(false); // <--- IMPORTANT CHANGE: Ensure loading is set to false even if signOut fails
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    refreshUserProfile,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// =========================================================
// 3. Custom Hook to consume AuthContext
// =========================================================
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};