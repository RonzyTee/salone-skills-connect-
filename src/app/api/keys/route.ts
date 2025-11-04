import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth'; // Your auth helper
// --- FIX 1: Corrected import path and variable names ---
import admin, { adminDb } from '@/lib/firebaseAdmin'; 
import * as crypto from 'crypto';
import bcrypt from 'bcryptjs';

// --- GET /api/keys ---
// Fetches all API keys (safe data only) for the current user
export async function GET(request: Request) {
  try {
    const session = await getSession(request);
    if (!session?.uid || (session.role !== 'manager' && session.role !== 'admin')) {
      // Assuming 'manager' or 'admin' can create keys
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const keysSnapshot = await adminDb // --- FIX 1: Use adminDb ---
      .collection('apiKeys')
      .where('userId', '==', session.uid)
      .orderBy('createdAt', 'desc') // Show newest first
      .get();

    // --- FIX 3: Added explicit type for 'doc' ---
    const keys = keysSnapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        prefix: data.prefix,
        scopes: data.scopes,
        createdAt: data.createdAt.toDate().toISOString(),
        lastUsed: data.lastUsed ? data.lastUsed.toDate().toISOString() : null,
      };
    });

    return NextResponse.json({ keys });
  } catch (error) {
    console.error('GET /api/keys error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// --- POST /api/keys ---
// Generates a new API key for the current user
export async function POST(request: Request) {
  try {
    const session = await getSession(request);
    if (!session?.uid || (session.role !== 'manager' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, scopes } = await request.json();

    if (!name || !scopes || !Array.isArray(scopes) || scopes.length === 0) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // 1. Generate the key
    const prefix = 'ssl_live_';
    const randomPart = crypto.randomBytes(24).toString('hex');
    const apiKey = prefix + randomPart;

    // 2. Hash the key for storage
    const salt = await bcrypt.genSalt(10);
    const keyHash = await bcrypt.hash(apiKey, salt);

    // 3. Save to Firestore
    const newKeyDoc = {
      userId: session.uid,
      name: name,
      keyHash: keyHash,
      prefix: prefix,
      scopes: scopes, // e.g., ['talent:read', 'jobs:write']
      createdAt: new Date(),
      lastUsed: null,
    };

    // --- FIX 1: Use adminDb ---
    const docRef = await adminDb.collection('apiKeys').add(newKeyDoc);

    // 5. Return the *full* key to the user ONCE
    return NextResponse.json({ apiKey: apiKey, id: docRef.id });
  } catch (error) {
    console.error('POST /api/keys error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// --- DELETE /api/keys ---
// Revokes (deletes) an API key owned by the current user
export async function DELETE(request: Request) {
  try {
    const session = await getSession(request);
    if (!session?.uid || (session.role !== 'manager' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('keyId');

    if (!keyId) {
      return NextResponse.json({ error: 'Key ID is required' }, { status: 400 });
    }

    // --- FIX 1: Use adminDb ---
    const keyRef = adminDb.collection('apiKeys').doc(keyId);
    const keyDoc = await keyRef.get();

    if (!keyDoc.exists) {
      return NextResponse.json({ error: 'Key not found' }, { status: 404 });
    }

    // CRITICAL: Verify the user owns this key before deleting
    if (keyDoc.data()?.userId !== session.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Delete the key
    await keyRef.delete();

    return NextResponse.json({ success: true, message: 'Key revoked' });
  } catch (error) {
    console.error('DELETE /api/keys error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

