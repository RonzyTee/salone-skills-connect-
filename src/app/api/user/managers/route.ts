// /app/api/users/managers/route.ts
import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

const db = admin.firestore();

export async function GET() {
  try {
    const managersRef = db.collection('users');
    const q = managersRef.where('userType', '==', 'manager').limit(5);
    
    const querySnapshot = await q.get();
    const managers = querySnapshot.docs.map(doc => ({
      id: doc.id,
      fullName: doc.data().fullName || 'A Manager',
      companyName: doc.data().companyName || 'An Organization',
    }));

    return NextResponse.json(managers);
  } catch (error) {
    console.error("Error fetching managers:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}