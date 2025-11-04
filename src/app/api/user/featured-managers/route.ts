// /app/api/users/featured-managers/route.ts
import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Ensure Firebase Admin is initialized
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

export async function GET() {
  try {
    const usersRef = db.collection('users');
    // Get 8 manager users
    const q = usersRef
      .where('userType', '==', 'manager')
      .limit(8);
      
    const snapshot = await q.get();
    const managers = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        companyName: data.fullName, // As per our data, manager's name is their org name
        industry: data.industry || 'Tech & Innovation', // Add an 'industry' field in your profile
        logoUrl: data.profilePictureUrl,
        tagline: data.bio?.substring(0, 50) + '...' || 'Hiring on Salone SkillsLink',
      };
    });

    return NextResponse.json(managers);
  } catch (error) {
    console.error("Error fetching featured managers:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
// /app/api/users/featured-managers/route.ts
import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Ensure Firebase Admin is initialized
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

export async function GET() {
  try {
    const usersRef = db.collection('users');
    // Get 8 manager users who have completed their profile
    const q = usersRef
      .where('userType', '==', 'manager')
      .where('profileCompleted', '==', true) // Added check for completed profile
      .limit(8);
      
    const snapshot = await q.get();
    const managers = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        // --- CORRECTED FIELD NAMES ---
        companyName: data.organizationName || 'Unnamed Organization', // Use organizationName
        industry: data.industry || 'Various Industries',          // Use industry
        logoUrl: data.logoUrl,                                     // Use logoUrl
        tagline: data.aboutOrganization?.substring(0, 50) + '...' || 'Hiring on Salone SkillsLink', // Use aboutOrganization
        // --- END OF CORRECTIONS ---
      };
    });

    return NextResponse.json(managers);
  } catch (error) {
    console.error("Error fetching featured managers:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}