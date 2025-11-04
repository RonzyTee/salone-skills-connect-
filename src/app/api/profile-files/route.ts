// src/app/api/profile-files/route.ts
import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { cookies } from 'next/headers';

// Ensure Firebase Admin is initialized (copy from your profile route)
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

// Function to upload a single image to ImgBB
async function uploadToImgBB(imageFile: File): Promise<string | null> {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    console.error('ImgBB API key is not configured');
    return null;
  }

  const formData = new FormData();
  formData.append('image', imageFile);

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('ImgBB API error:', data);
      return null;
    }
    return data.data.url; // Return the URL
  } catch (error) {
    console.error('Error uploading to ImgBB:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate User
    const sessionCookie = (await cookies()).get('__session')?.value || '';
    if (!sessionCookie) return new NextResponse('Unauthorized', { status: 401 });
    const decodedToken = await admin.auth().verifySessionCookie(sessionCookie, true);
    const uid = decodedToken.uid;

    // 2. Get FormData
    const formData = await request.formData();
    const profilePictureFile = formData.get('profilePicture') as File | null;
    const coverPhotoFile = formData.get('coverPhoto') as File | null;

    if (!profilePictureFile && !coverPhotoFile) {
      return new NextResponse('No image files provided', { status: 400 });
    }

    const updates: { [key: string]: string } = {};
    let uploadError = false;

    // 3. Upload Profile Picture (if present)
    if (profilePictureFile) {
      console.log(`Uploading profile picture for UID: ${uid}`);
      const profilePicUrl = await uploadToImgBB(profilePictureFile);
      if (profilePicUrl) {
        updates.profilePictureUrl = profilePicUrl;
      } else {
        uploadError = true;
        console.error(`Failed to upload profile picture for UID: ${uid}`);
      }
    }

    // 4. Upload Cover Photo (if present)
    if (coverPhotoFile) {
       console.log(`Uploading cover photo for UID: ${uid}`);
      const coverPhotoUrl = await uploadToImgBB(coverPhotoFile);
      if (coverPhotoUrl) {
        updates.coverPhotoUrl = coverPhotoUrl;
      } else {
        uploadError = true;
        console.error(`Failed to upload cover photo for UID: ${uid}`);
      }
    }

    // 5. Update Firestore if any uploads were successful
    if (Object.keys(updates).length > 0) {
      const userDocRef = db.collection('users').doc(uid);
      await userDocRef.update({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`Successfully updated image URLs for UID: ${uid}`, updates);
    }

    if (uploadError && Object.keys(updates).length === 0) {
         return new NextResponse('Failed to upload any images', { status: 500 });
    }
    if (uploadError) {
         return NextResponse.json({ message: 'Profile updated, but one or more images failed to upload.', partialSuccess: true, updatedFields: updates });
    }

    return NextResponse.json({ message: 'Profile images updated successfully', updatedFields: updates });

  } catch (error) {
    console.error("Error processing profile files:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}