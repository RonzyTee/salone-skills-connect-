// src/lib/firebaseAdmin.ts
import * as admin from 'firebase-admin';

// --- Initialize the App ---
// (Your existing initialization logic is great)
if (!admin.apps.length) {
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    console.error("Firebase Admin SDK environment variables are not fully set.");
    console.error("Please check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.");
    console.error("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID ? "SET" : "NOT SET");
    console.error("FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL ? "SET" : "NOT SET");
    console.error("FIREBASE_PRIVATE_KEY:", process.env.FIREBASE_PRIVATE_KEY ? "SET" : "NOT SET");
  } else {
    try {
      console.log("Attempting to initialize Firebase Admin SDK...");
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Your .replace() is correct and crucial
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), 
        }),
      });
      console.log("Firebase Admin SDK initialized successfully.");
    } catch (error: any) { 
      console.error("Error initializing Firebase Admin SDK:", error.message);
      if (error.code) console.error("Error Code:", error.code);
    }
  }
} else {
  console.log("Firebase Admin SDK already initialized.");
}


// --- EXPORT THE SERVICES ---
// 
// THIS IS THE MISSING PIECE:
// Get the Firestore instance from the (now initialized) default app
//
const adminDb = admin.firestore();

// Export it using the name your API route expects
export { adminDb }; 

// You can also export the main admin object if you need it for Auth, etc.
export default admin;