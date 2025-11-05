// lib/adminStatus.ts
import { doc, updateDoc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; // Ensure this path is correct for your Firebase initialization

const ADMIN_STATUS_DOC_ID = "mainAdminStatus"; // A fixed ID for the admin's status document

// Function to set admin online
export const setAdminOnline = async () => {
  const adminStatusRef = doc(db, "adminStatuses", ADMIN_STATUS_DOC_ID);
  try {
    await setDoc(adminStatusRef, {
      isOnline: true,
      lastOnline: serverTimestamp(),
    }, { merge: true }); // Use merge: true to avoid overwriting other fields
    console.log("Admin status set to online.");
  } catch (error) {
    console.error("Error setting admin online status:", error);
  }
};

// Function to set admin offline
export const setAdminOffline = async () => {
  const adminStatusRef = doc(db, "adminStatuses", ADMIN_STATUS_DOC_ID);
  try {
    await updateDoc(adminStatusRef, {
      isOnline: false,
      lastOnline: serverTimestamp(),
    });
    console.log("Admin status set to offline.");
  } catch (error) {
    console.error("Error setting admin offline status:", error);
  }
};

// Function to listen for admin's online status
// This is primarily for other clients (e.g., users) to see if the admin is online,
// but can also be used by the admin panel itself if needed.
export const listenForAdminOnlineStatus = (callback: (isOnline: boolean) => void) => {
  const adminStatusRef = doc(db, "adminStatuses", ADMIN_STATUS_DOC_ID);
  return onSnapshot(adminStatusRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(!!docSnap.data().isOnline);
    } else {
      // If the document doesn't exist, assume offline
      callback(false);
    }
  }, (error) => {
    console.error("Error listening for admin online status:", error);
    callback(false); // Default to offline on error
  });
};