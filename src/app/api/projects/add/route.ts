// src/app/api/projects/add/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin'; // Ensure you have firebaseAdmin configured
import * as admin from 'firebase-admin';

// --- HELPER FUNCTION TO UPLOAD A FILE TO IMGBB ---
// (This should be the same function from your other API route)
async function uploadToImgBB(file: File, apiKey: string): Promise<string | null> {
    const formData = new FormData();
    const imageBuffer = await file.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
    formData.append('image', imageBase64);

    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();

        // Check for success from ImgBB API
        if (!response.ok || !result.success) {
            console.error("ImgBB Upload Error:", result.error?.message || 'Unknown ImgBB error');
            return null;
        }

        return result.data.url;
    } catch (error) {
        console.error("Network error while trying to upload to ImgBB:", error);
        return null;
    }
}


// --- MAIN API ROUTE HANDLER ---
export async function POST(req: NextRequest) {
  try {
    // 1. Get the ImgBB API Key
    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
      console.error("FATAL: IMGBB_API_KEY is not defined in environment variables.");
      // This is a server configuration error
      return NextResponse.json({ message: "Server configuration error: Image upload service is not configured." }, { status: 500 });
    }

    const formData = await req.formData();

    // 2. Extract and validate required fields
    const userId = formData.get('userId') as string;
    const title = formData.get('title') as string;
    const mainImageFile = formData.get('mainImage') as File | null;

    if (!userId || !title || !mainImageFile) {
      return NextResponse.json({ message: 'Missing required fields. User ID, Title, and a Main Image are required.' }, { status: 400 });
    }

    // 3. Extract other form data
    const description = formData.get('description') as string;
    const skillCategory = formData.get('skillCategory') as string;
    const skills = JSON.parse(formData.get('skills') as string);
    const galleryFiles = formData.getAll('galleryFiles') as File[];

    // 4. Upload all images concurrently
    const mainImagePromise = uploadToImgBB(mainImageFile, apiKey);
    const galleryImagePromises = galleryFiles.map(file => uploadToImgBB(file, apiKey));

    const [mainImageUrl, ...galleryImageUrls] = await Promise.all([mainImagePromise, ...galleryImagePromises]);

    // The main image is REQUIRED. If it fails, the whole operation fails.
    if (!mainImageUrl) {
      throw new Error("Failed to upload the main project image. The project cannot be saved.");
    }

    // 5. Assemble the final data object for Firestore
    const dataToSave: any = {
        userId,
        title,
        description,
        skills,
        skillCategory,
        mainImageUrl: mainImageUrl, // The URL from ImgBB
        // Filter out any gallery uploads that might have failed
        galleryImageUrls: galleryImageUrls.filter(url => url !== null),
        verificationStatus: "unverified",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Add optional, category-specific fields if they exist in the form data
    if (formData.has('liveDemoUrl')) dataToSave.liveDemoUrl = formData.get('liveDemoUrl');
    if (formData.has('githubUrl')) dataToSave.githubUrl = formData.get('githubUrl');
    if (formData.has('portfolioUrl')) dataToSave.portfolioUrl = formData.get('portfolioUrl');
    if (formData.has('videoAudioUrl')) dataToSave.videoAudioUrl = formData.get('videoAudioUrl');

    // 6. --- START OF UPDATED LOGIC ---
    // Use a Firestore Batch to perform two operations at once (atomically):
    // 1. Create the new project document.
    // 2. Atomically increment the projectsCount on the user's document.
    
    // Get a reference to the user's document
    const userRef = adminDb.collection('users').doc(userId);
    
    // Get a reference for the new project (generate a new ID)
    const projectRef = adminDb.collection('projects').doc();
    
    // Create a batch
    const batch = adminDb.batch();

    // Operation 1: Create the new project
    batch.set(projectRef, dataToSave);

    // Operation 2: Update the user's project count
    batch.update(userRef, {
        // Use the admin FieldValue.increment() to safely add 1
        projectsCount: admin.firestore.FieldValue.increment(1)
    });

    // Commit both operations
    await batch.commit();
    // --- END OF UPDATED LOGIC ---
    
    

    console.log(`Backend: Project created with ID: ${projectRef.id} and user ${userId} count incremented.`);
    return NextResponse.json({ message: 'Project created and count updated!', projectId: projectRef.id }, { status: 201 });

  } catch (error: any) {
    console.error("Backend Error in /api/projects/add:", error);
    return NextResponse.json({ message: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}