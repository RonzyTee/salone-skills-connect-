import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  query,
  orderBy,
  Timestamp,
  doc,
  getDoc,
  getDocs,
} from 'firebase/firestore';
import { PostAuthor } from '@/types/community';

// GET: Fetch all posts
export async function GET() {
  // ... (GET function remains the same)
  try {
    const postsQuery = query(collection(db, 'community-posts'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(postsQuery);
    const posts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(posts);
  } catch (error) {
    console.error('[API_POSTS_GET] Error fetching posts:', error);
    return NextResponse.json({ message: 'Failed to fetch posts' }, { status: 500 });
  }
}


// POST: Create a new post (with improved error handling)
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const content = formData.get('content') as string;
    const authorUid = formData.get('authorUid') as string;
    const imageFile = formData.get('image') as File | null;

    if (!content || !authorUid) {
      return NextResponse.json({ message: 'Missing content or author information.' }, { status: 400 });
    }

    // **CRITICAL FIX**: Check for the API key first
    const imgbbApiKey = process.env.IMGBB_API_KEY;
    if (!imgbbApiKey) {
      console.error('[API_POSTS_POST] IMGBB_API_KEY is not defined in .env.local');
      return NextResponse.json({ message: 'Server configuration error: Image hosting is not set up.' }, { status: 500 });
    }

    let imageUrl: string | undefined = undefined;

    if (imageFile) {
      const imgbbFormData = new FormData();
      imgbbFormData.append('image', imageFile);
      
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
        method: 'POST',
        body: imgbbFormData,
      });

      const result = await response.json();

      if (!result.success) {
        console.error('[API_POSTS_POST] ImgBB upload failed:', result.error.message);
        return NextResponse.json({ message: `Image upload failed: ${result.error.message}` }, { status: 500 });
      }
      imageUrl = result.data.url;
    }

    const userDocRef = doc(db, 'users', authorUid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return NextResponse.json({ message: 'Author user profile not found.' }, { status: 404 });
    }
    const userData = userDoc.data();

    const author: PostAuthor = {
      uid: authorUid,
      name: userData.fullName || 'Anonymous',
      headline: userData.primarySkill || 'Platform Member',
      imageUrl: userData.profilePictureUrl || null,
      role: userData.userType === 'youth' ? 'Talent' : userData.userType === 'manager' ? 'Manager' : 'User',
      isVerified: userData.oivpStatus?.tier0 === 'verified',
    };

    const postData = {
      author,
      content,
      imageUrl,
      createdAt: Timestamp.now(),
      stats: { reactions: 0, comments: 0 },
    };

    const docRef = await addDoc(collection(db, 'community-posts'), postData);

    return NextResponse.json({ id: docRef.id, ...postData }, { status: 201 });

  } catch (error) {
    console.error('[API_POSTS_POST] Unhandled error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}