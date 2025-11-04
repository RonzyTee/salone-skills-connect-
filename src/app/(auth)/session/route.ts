// src/app/api/auth/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers'; // Make sure you're importing 'cookies' from 'next/headers'

// Import the initialized Firebase Admin SDK from your lib file
import { firebaseAdmin } from '@/lib/firebaseAdmin'; // Adjust the path if your lib directory structure is different

// This assumes your session cookie is named 'session'
const SESSION_COOKIE_NAME = 'session'; 

export async function POST(req: NextRequest) {
  const { idToken } = await req.json();

  // Ensure Firebase Admin SDK is initialized before proceeding
  if (!firebaseAdmin) {
    console.error("⛔ POST /api/auth/session: Firebase Admin SDK not initialized. Cannot create session.");
    return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
  }
  // Ensure the auth service is available
  if (!firebaseAdmin.auth()) {
    console.error("⛔ POST /api/auth/session: Firebase Admin Auth service is not available.");
    return NextResponse.json({ message: 'Server authentication service error' }, { status: 500 });
  }

  try {
    console.log("➡️ POST /api/auth/session: Attempting to verify ID token and create session cookie.");
    // Verify the ID token with Firebase Admin SDK
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    
    // Create session cookie with appropriate expiry
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days in milliseconds
    const sessionCookie = await firebaseAdmin.auth().createSessionCookie(idToken, { expiresIn });

    const response = NextResponse.json({ message: 'Session created' }, { status: 200 });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      maxAge: expiresIn / 1000, // maxAge in seconds
      path: '/',
      sameSite: 'lax', // Recommended for CSRF protection
    });
    console.log("✅ POST /api/auth/session: Session cookie created successfully.");
    return response;

  } catch (error: any) { // Use ': any' for better error property access
    console.error("❌ POST /api/auth/session: Error creating session.");
    console.error("Error Message:", error.message);
    if (error.code) console.error("Error Code:", error.code);
    if (error.stack) console.error("Error Stack:", error.stack);
    return NextResponse.json({ message: 'Failed to create session' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  // Corrected way to access cookies to avoid the Next.js warning
  const cookieStore = cookies();
  const sessionCookie = (await cookieStore).get(SESSION_COOKIE_NAME)?.value;

  // Ensure Firebase Admin SDK is initialized before proceeding
  if (!firebaseAdmin) {
    console.error("⛔ DELETE /api/auth/session: Firebase Admin SDK not initialized. Cannot process DELETE request.");
    return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
  }
  // Ensure the auth service is available
  if (!firebaseAdmin.auth()) {
    console.error("⛔ DELETE /api/auth/session: Firebase Admin Auth service is not available.");
    return NextResponse.json({ message: 'Server authentication service error' }, { status: 500 });
  }

  if (!sessionCookie) {
    console.log("ℹ️ DELETE /api/auth/session: No active session cookie found on client. Responding as logged out.");
    // If no session cookie found, still respond as successful logout from client perspective
    return NextResponse.json({ message: 'No active session to clear' }, { status: 200 });
  }

  // If a session cookie exists, attempt to revoke tokens and clear the cookie
  try {
    console.log("➡️ DELETE /api/auth/session: Attempting to verify session cookie and revoke refresh tokens.");
    const decodedClaims = await firebaseAdmin.auth().verifySessionCookie(sessionCookie);
    await firebaseAdmin.auth().revokeRefreshTokens(decodedClaims.sub);
    console.log(`✅ DELETE /api/auth/session: All refresh tokens revoked for user ${decodedClaims.sub}`);
    
    // Clear the session cookie from the client
    const response = NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });
    response.cookies.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0, // Set maxAge to 0 to expire the cookie immediately
      path: '/',
      sameSite: 'lax',
    });
    console.log("✅ DELETE /api/auth/session: Session cookie cleared successfully.");
    return response;

  } catch (error: any) { // Use ': any' for better error property access
    console.error("❌ DELETE /api/auth/session: Error during logout process (revoking session or clearing cookie).");
    console.error("Error Message:", error.message);
    if (error.code) console.error("Error Code:", error.code);
    if (error.stack) console.error("Error Stack:", error.stack);

    // Even if there's an error revoking Firebase token, we should still try to clear the client's cookie
    const response = NextResponse.json({ message: 'Logout failed partially, cookie cleared' }, { status: 500 });
    response.cookies.set(SESSION_COOKIE_NAME, '', { // Ensure cookie is cleared even on server error
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
      path: '/',
      sameSite: 'lax',
    });
    console.log("⚠️ DELETE /api/auth/session: Attempted to clear cookie on client despite server error.");
    return response;
  }
}