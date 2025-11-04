'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  doc,
  onSnapshot,
  setDoc,
  getDoc,
  serverTimestamp,
  Timestamp,
  updateDoc, // <-- IMPORT updateDoc FOR PRESENCE
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =========================================================
// 2. AuthProvider Component
// =========================================================
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Effect for handling Authentication State and User Profile fetching
  useEffect(() => {
    let unsubscribeProfile: () => void = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      unsubscribeProfile(); // Clean up old profile listener

      if (currentUser) {
        // User is LOGGED IN
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
                userType: 'youth',
                oivpStatus: { tier0: 'unverified' },
                projectsCount: 0,
                endorsementsCount: 0,
                followers: [],
                following: [],
                selectedSkills: [],
                createdAt: serverTimestamp() as Timestamp,
              };
              try {
                await setDoc(userDocRef, newUserProfileData, { merge: true });
                setUserProfile(newUserProfileData);
              } catch (error) {
                console.error('Failed to create user profile:', error);
                setUserProfile(null);
              }
            }
            setLoading(false);
          },
          (error) => {
            console.error('Error listening to user profile:', error);
            setUserProfile(null);
            setLoading(false);
          }
        );
      } else {
        // User is LOGGED OUT
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile();
    };
  }, []);

  // --- [THE FIX IS HERE] ---
  // Centralized Presence Management Hook
  useEffect(() => {
    // Only run this logic if a user is logged in.
    if (!user?.uid) {
      return;
    }

    const userStatusRef = doc(db, 'users', user.uid);

    // Set online immediately when the user is authenticated.
    updateDoc(userStatusRef, { isOnline: true });

    // Function to handle when the user's tab is not visible.
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

    // Function to handle when the user closes the tab/browser.
    const handleBeforeUnload = () => {
      updateDoc(userStatusRef, {
        isOnline: false,
        lastSeen: serverTimestamp(),
      });
    };

    // Add event listeners for browser events.
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // This cleanup function runs when the user logs out.
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // Set offline one last time when the component unmounts or user logs out.
      updateDoc(userStatusRef, {
        isOnline: false,
        lastSeen: serverTimestamp(),
      });
    };
  }, [user?.uid]); // The dependency on `user.uid` is crucial for this to work correctly.
  // --- [END OF FIX] ---

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

  const value = { user, userProfile, loading, refreshUserProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// =========================================================
// 3. Custom Hook
// =========================================================
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};