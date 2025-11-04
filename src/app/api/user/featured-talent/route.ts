// /app/api/users/featured-talent/route.ts
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
    // Get 8 youth users who have completed their profile
    const q = usersRef
      .where('userType', '==', 'youth')
      .where('profileCompleted', '==', true)
      .limit(8);
      
    const snapshot = await q.get();
    const talent = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        fullName: data.fullName,
        headline: data.bio?.substring(0, 50) + '...' || 'Salone SkillsLink Member',
        profilePictureUrl: data.profilePictureUrl,
        identityStatus: data.identityStatus,
        selectedSkills: data.selectedSkills?.slice(0, 3) || [], // Get top 3 skills
      };
    });

    return NextResponse.json(talent);
  } catch (error) {
    console.error("Error fetching featured talent:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}