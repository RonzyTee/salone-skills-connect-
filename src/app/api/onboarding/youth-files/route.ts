
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; // CORRECTED: Import path now matches the file name 'firebase-admin.ts'
import * as admin from 'firebase-admin';
import { Buffer } from 'buffer'; // Required for Base64 encoding in Next.js API routes

// HELPER FUNCTION TO UPLOAD A FILE TO IMGBB
// Moved here for self-containment, or you can keep it in a shared lib if preferred
async function uploadToImgBB(file: File, apiKey: string): Promise<string | null> {
    const formData = new FormData();
    const imageBuffer = await file.arrayBuffer();
    // Ensure Buffer is imported if running in a Node.js environment like Next.js API routes
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
    
    formData.append('image', imageBase64); // ImgBB API expects 'image' as the key

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData,
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
        console.error("ImgBB Upload Error:", result.error?.message || 'Unknown ImgBB error', result);
        return null;
    }

    // Return the URL of the uploaded image
    return result.data.url;
}


// MAIN API ROUTE HANDLER
export async function POST(req: NextRequest) {
  try {
    // 1. Get the ImgBB API Key from your environment variables
    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
      throw new Error("IMGBB_API_KEY is not defined in .env.local");
    }

    // 2. Parse the incoming request as FormData
    const formData = await req.formData();

    // 3. Extract files and user ID
    const idFile = formData.get('idFile') as File | null;
    const profilePicture = formData.get('profilePicture') as File | null;
    const coverPhoto = formData.get('coverPhoto') as File | null; // Added coverPhoto
    const uid = formData.get('uid') as string;

    // 4. Validate that required data is present
    if (!uid) {
      return NextResponse.json({ message: 'User ID (uid) is missing for file upload.' }, { status: 400 });
    }
    if (!idFile) {
      return NextResponse.json({ message: 'Identity file is missing for verification.' }, { status: 400 });
    }

    // 5. Upload files to ImgBB concurrently for speed
    const [idFileUrl, profilePictureUrl, coverPhotoUrl] = await Promise.all([
      uploadToImgBB(idFile, apiKey),
      profilePicture ? uploadToImgBB(profilePicture, apiKey) : Promise.resolve(null),
      coverPhoto ? uploadToImgBB(coverPhoto, apiKey) : Promise.resolve(null) // Added coverPhoto upload
    ]);

    // If the required ID file upload failed, stop the process
    if (!idFileUrl) {
        throw new Error("Failed to upload the required identity verification document to ImgBB.");
    }
    
    // 6. Update the user's Firestore document with the new file URLs and set profileCompleted to true
    const userRef = adminDb.collection('users').doc(uid);
    await userRef.update({
      idFileUrl: idFileUrl,
      profilePictureUrl: profilePictureUrl, // This will be null if no picture was provided
      coverPhotoUrl: coverPhotoUrl, // This will be null if no cover photo was provided
      profileCompleted: true, // Now the profile is fully completed with documents
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Backend: Files successfully uploaded and profile finalized for user ${uid}.`);
    return NextResponse.json({ message: 'Documents uploaded and profile finalized successfully' }, { status: 200 });

  } catch (error: any) {
    console.error("Backend Error in youth-files API:", error);
    // Return a generic error message for security, but log details on the server
    return NextResponse.json({ message: error.message || 'An internal server error occurred during file upload and finalization.' }, { status: 500 });
  }
}
