import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin'; 

export async function POST(req: Request) {
  try {
    const db = adminDb; 

    const body = await req.json();
    const { uid, ...profileData } = body;

    if (!uid) {
      return NextResponse.json(
        { message: 'User ID (uid) is required.' },
        { status: 400 }
      );
    }

    // --- THIS IS THE FIX ---
    // Save to the 'users' collection to update the existing user
    await db.collection('users').doc(uid).set({
      ...profileData,
      uid: uid,
      createdAt: new Date().toISOString(), // This will be merged/overwritten if it exists
      status: 'pending_review',
      profileCompleted: false, // This will be set to 'true' by the file upload API
    }, { merge: true });

    return NextResponse.json(
      { message: 'Basic profile created successfully.' },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('MANAGER_BASIC_API_ERROR:', error);
    if (error instanceof TypeError && error.message.includes("reading 'collection'")) {
        console.error("Critical Error: 'adminDb' is undefined. Check firebaseAdmin.ts logs.");
         return NextResponse.json(
            { message: 'Server initialization error. Check logs.' },
            { status: 500 }
         );
    }
    return NextResponse.json(
      { message: `Internal Server Error: ${error.message}` },
      { status: 500 }
    );
  }
}