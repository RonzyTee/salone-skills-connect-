// src/app/api/onboarding/youth-basic/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; // CORRECTED: Import path now matches the file name 'firebase-admin.ts'
import * as admin from 'firebase-admin';

export async function POST(req: NextRequest) {
  try {
    // 1. Parse the incoming request as JSON
    // We destructure uid and selectedSkills directly for easier handling,
    // and collect other fields into 'data'.
    const { uid, selectedSkills, ...data } = await req.json(); 
    
    // 2. Validate that UID is present
    if (!uid) {
      return NextResponse.json({ message: 'User ID (uid) is missing.' }, { status: 400 });
    }

    // 3. Prepare data for Firestore
    const dataToUpdate = {
      ...data, // Contains fullName, cityLocation, phoneNumber, bio, goal, idType, linkedinUrl, githubUrl, whatsappNumber
      selectedSkills: selectedSkills, // This should already be an array from the frontend
      profileCompleted: false, // Explicitly set to false initially
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      // Add createdAt for new profiles. If the profile already exists, merge will handle it.
      // We use serverTimestamp for creation to ensure consistency.
      createdAt: admin.firestore.FieldValue.serverTimestamp(), 
    };

    // 4. Get a reference to the user's document
    const userRef = adminDb.collection('users').doc(uid);

    // 5. Use set with { merge: true } to create the document if it doesn't exist,
    // or update it if it does, without overwriting unrelated fields.
    await userRef.set(dataToUpdate, { merge: true });

    console.log(`Backend: Basic profile created/updated for user ${uid}.`);
    return NextResponse.json({ message: 'Basic profile created/updated successfully' }, { status: 200 });

  } catch (error: any) {
    console.error("Backend Error in youth-basic API:", error);
    // Return a generic error message for security, but log details on the server
    return NextResponse.json({ message: error.message || 'An internal server error occurred during basic profile update.' }, { status: 500 });
  }
}

// Optional: Add a GET handler if you ever need to retrieve basic user data
/*
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ message: 'User ID (uid) is missing.' }, { status: 400 });
    }

    const userDoc = await adminDb.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return NextResponse.json({ message: 'User profile not found.' }, { status: 404 });
    }

    const userData = userDoc.data();
    // Filter out sensitive data or large fields if not needed on the client
    const { idFileUrl, profilePictureUrl, ...basicData } = userData || {};

    return NextResponse.json(basicData, { status: 200 });

  } catch (error: any) {
    console.error("Backend Error in youth-basic GET API:", error);
    return NextResponse.json({ message: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}
*/