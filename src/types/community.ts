import { Timestamp } from 'firebase/firestore';

// A simplified author profile, stored within each post
export interface PostAuthor {
  uid: string;
  name: string | null;
  headline: string | null;
  imageUrl: string | null;
  role: 'Talent' | 'Manager' | 'User'; // Or your specific user types
  isVerified: boolean;
}

// The structure for a single post document in Firestore
export interface CommunityPost {
  id: string; // Document ID
  author: PostAuthor;
  content: string;
  imageUrl?: string; // URL from ImgBB
  createdAt: Timestamp;
  stats: {
    reactions: number;
    comments: number;
  };
}