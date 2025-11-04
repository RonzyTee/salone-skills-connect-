import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// This block ensures the app is only initialized once.
if (!admin.apps.length) {
  try {
    // It's recommended to use environment variables for security
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // The replace call is important for handling the private key from an env variable
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.message);
  }
}

const db = admin.firestore();

export async function POST(request: Request) {
  try {
    const { uid, userType } = await request.json();

    // --- Validation ---
    if (!uid || typeof uid !== 'string') {
      return NextResponse.json({ error: 'User ID (uid) is required and must be a string.' }, { status: 400 });
    }
    if (userType !== 'youth' && userType !== 'manager') {
      return NextResponse.json({ error: 'Invalid userType. Must be "youth" or "manager".' }, { status: 400 });
    }

    // --- Firestore Operation ---
    const userRef = db.collection('users').doc(uid);

    // --- MODIFIED: Using .set() with merge:true ---
    // This is more robust than .update(). It will create the document if it doesn't exist,
    // or update the userType field if the document already exists, without overwriting other data.
    await userRef.set({
      userType: userType,
    }, { merge: true });

    console.log(`Successfully set role for user ${uid} to ${userType}`);
    return NextResponse.json({ success: true, message: `Role set to ${userType}` }, { status: 200 });

  } catch (error: any) {
    console.error('Error setting user role in Firestore:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

