// /api/auth/session/route.ts
import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { cookies } from 'next/headers'; // Import cookies

// Initialize Firebase Admin SDK
// This block should only run once
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('✅ Firebase Admin SDK Initialized Successfully.');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
  }
}

// --- Your POST Function (Unchanged) ---
export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
    }
    
    // Check if the app is initialized
    if (!admin.apps.length) {
        throw new Error('Firebase Admin SDK is not initialized.');
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    if (decodedToken.revocationTime) {
      return NextResponse.json({ error: 'ID token has been revoked.' }, { status: 401 });
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });
    
    const cookieOptions = {
      name: '__session',
      value: sessionCookie,
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax' as const,
    };

    const response = NextResponse.json({ status: 'success' }, { status: 200 });
    response.cookies.set(cookieOptions);
    return response;

  } catch (error) {
    console.error('❌ Session POST error:', error);
    return NextResponse.json({ error: 'Failed to create session.' }, { status: 401 });
  }
}

// --- UPDATED DELETE Function ---
export async function DELETE() {
  const sessionCookie = cookies().get('__session')?.value || '';

  // 1. Create a response to clear the cookie
  const response = NextResponse.json({ status: 'success' }, { status: 200 });
  response.cookies.delete('__session');

  // 2. If a session cookie exists, revoke all user tokens
  if (sessionCookie) {
    try {
      // Check if the app is initialized
      if (!admin.apps.length) {
          throw new Error('Firebase Admin SDK is not initialized.');
      }
      
      const decodedToken = await admin.auth().verifySessionCookie(sessionCookie);
      const uid = decodedToken.uid;
      
      // THIS IS THE KEY STEP: Revokes all refresh tokens for the user
      await admin.auth().revokeRefreshTokens(uid);
      
      console.log(`✅ All refresh tokens revoked for user ${uid}`);
    } catch (error: any) {
      // Don't block the sign-out if this fails, just log it
      console.warn(`⚠️ Failed to revoke tokens on sign-out: ${error.message}`);
    }
  }

  // 3. Return the response that clears the cookie
  return response;
}