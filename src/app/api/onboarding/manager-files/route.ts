import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin'; 

/**
 * Uploads a file to ImgBB and returns the URL.
 */
async function uploadToImgBB(file: File): Promise<string> {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    throw new Error("IMGBB_API_KEY environment variable is not set.");
  }

  const imgbbFormData = new FormData();
  imgbbFormData.append('image', file);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: imgbbFormData,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    console.error("ImgBB Upload Failed:", data);
    throw new Error(`ImgBB upload failed: ${data?.error?.message || 'Unknown error'}`);
  }
  return data.data.url;
}


export async function POST(req: Request) {
  try {
    const db = adminDb;

    const formData = await req.formData();
    const uid = formData.get('uid') as string;

    if (!uid) {
      return NextResponse.json({ message: 'UID is required.' }, { status: 400 });
    }

    const firestoreUpdateData: Record<string, string> = {};

    const processFile = async (formKey: string) => {
      const file = formData.get(formKey) as File | null;
      if (file && file.size > 0) {
        try {
          const url = await uploadToImgBB(file);
          firestoreUpdateData[formKey + 'Url'] = url;
        } catch (uploadError: any) {
          console.error(`Failed to upload ${formKey}:`, uploadError.message);
          throw new Error(`Failed to upload ${formKey}: ${uploadError.message}`);
        }
      }
    };

    await Promise.all([
      processFile('businessRegDoc'),
      processFile('organizationLogo'),
      processFile('organizationCoverPhoto')
    ]);

    if (!firestoreUpdateData.businessRegDocUrl) {
       const regDocFile = formData.get('businessRegDoc') as File | null;
       if (!regDocFile || regDocFile.size === 0) {
          return NextResponse.json({ message: 'Business registration document is required.' }, { status: 400 });
       }
    }

    firestoreUpdateData['profileCompleted'] = 'true';

    // --- THIS IS THE FIX ---
    // Save to the 'users' collection to update the existing user
    await db.collection('users').doc(uid).set(firestoreUpdateData, { merge: true });

    return NextResponse.json(
      { message: 'Files uploaded and URLs saved successfully.' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('FILE_UPLOAD_API_ERROR:', error);
    if (error instanceof TypeError && error.message.includes("reading 'collection'")) {
        console.error("Critical Error: 'adminDb' is undefined. Check firebaseAdmin.ts logs.");
         return NextResponse.json(
            { message: 'Server initialization error. Check logs.' },
            { status: 500 }
         );
    }
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}