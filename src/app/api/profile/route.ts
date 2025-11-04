// /app/api/profile/route.ts
import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { cookies } from 'next/headers';

// Ensure Firebase Admin is initialized (keep as is)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error: any) { console.error('Firebase admin init error', error.stack); }
}

const db = admin.firestore();

// [MODIFIED] Update allowed fields
const ALLOWED_FIELDS_TO_UPDATE = [
  'fullName',
  'bio',
  'location',
  'phoneNumber',
  'whatsappNumber',
  'githubUrl',
  'linkedinUrl',
  'goal',
  'careerObjective',
  'primarySkill',
  'selectedSkills',
  'profilePictureUrl', // <-- FIX: Added image URL
  'coverPhotoUrl',     // <-- FIX: Added image URL
];

export async function PUT(request: Request) {
  try {
    const sessionCookie = (await cookies()).get('__session')?.value || '';
    if (!sessionCookie) return new NextResponse('Unauthorized', { status: 401 });

    const decodedToken = await admin.auth().verifySessionCookie(sessionCookie, true);
    const uid = decodedToken.uid;

    const body = await request.json();
    const dataToUpdate: { [key: string]: any } = {};

    // Sanitize the input
    for (const field of ALLOWED_FIELDS_TO_UPDATE) {
      // Handle skills array specifically, ensure it's an array
      if (field === 'selectedSkills') {
         if (Array.isArray(body[field])) {
           dataToUpdate[field] = body[field];
         }
      } else if (body[field] !== undefined) {
         // Allow empty strings to clear optional fields, but treat null/undefined as not provided
         dataToUpdate[field] = body[field] === null ? '' : body[field];
      }
    }


    if (Object.keys(dataToUpdate).length === 0) {
// This is the error old users were getting when only updating a photo
        return new NextResponse('No valid fields to update', { status: 400 });
    }

    const userDocRef = db.collection('users').doc(uid);
    await userDocRef.update({
      ...dataToUpdate,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error("Error updating profile:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}