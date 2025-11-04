
import admin from 'firebase-admin';

// This file should only be imported in server-side code (API routes, server components).

// Check if the app is already initialized to prevent errors during hot-reloading in development.
if (!admin.apps.length) {
  try {
    // Initialize the app with credentials from environment variables.
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // The private key needs to have its newlines correctly formatted.
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

// Export the initialized Firestore database instance for use in API routes.
export const adminDb = admin.firestore();
