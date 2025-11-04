
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; // Import the initialized admin DB
import admin from 'firebase-admin';

/**
 * API Route to create a user document in Firestore after successful Firebase Authentication.
 */
export async function POST(request: Request) {
  try {
    const { uid, email } = await request.json();

    // Basic validation to ensure we have the necessary data.
    if (!uid || !email) {
      return NextResponse.json({ message: 'Missing UID or email in request body.' }, { status: 400 });
    }

    // Get a reference to the document for the new user.
    const userRef = adminDb.collection('users').doc(uid);

    // Set the initial data for the user in Firestore.
    await userRef.set({
      uid: uid,
      email: email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(), // Use server timestamp for accuracy
      profileCompleted: false, // A flag to track onboarding status
      role: null, // Role can be set in a later step (e.g., 'talent' or 'manager')
    });

    return NextResponse.json({ message: 'User document created successfully in Firestore.' }, { status: 201 });

  } catch (error: any) {
    // Log the detailed error on the server for debugging purposes.
    console.error('Backend Error in /api/auth/create-user:', error);
    
    // Return a generic error message to the client.
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
