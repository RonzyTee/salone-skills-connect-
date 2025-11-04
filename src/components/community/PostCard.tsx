import React from 'react';
import { CommunityPost } from "@/types/community";
import { formatDistanceToNow } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { FaCheck } from 'react-icons/fa';

interface PostCardProps {
  post: CommunityPost;
}

const toDate = (timestamp: any): Date | null => {
    // ... (toDate function remains the same as the previous fix)
    if (!timestamp) return null;
    if (timestamp instanceof Timestamp) return timestamp.toDate();
    if (typeof timestamp.seconds === 'number') return new Date(timestamp.seconds * 1000);
    return null;
};

export function PostCard({ post }: PostCardProps) {
  const postDate = toDate(post.createdAt);
  let timeAgo = 'just now';
  if (postDate && !isNaN(postDate.getTime())) {
    timeAgo = formatDistanceToNow(postDate, { addSuffix: true });
  }

  return (
    // STYLE: Matched card styling from screenshot
    <div className="bg-[#242526] p-4 rounded-xl shadow text-white">
      <header className="flex items-center space-x-3">
        <img
          src={post.author.imageUrl || '/images/default-avatar.png'}
          alt={post.author.name || 'User'}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold">{post.author.name || 'Anonymous User'}</p>
            {/* STYLE: Added verification checkmark */}
            {post.author.isVerified && (
              <span className="bg-blue-600 rounded-full h-4 w-4 flex items-center justify-center">
                <FaCheck className="text-white text-xs" />
              </span>
            )}
            {/* STYLE: Added role badges */}
            {post.author.role === 'Talent' && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500/30 text-green-300">
                Talent
              </span>
            )}
            {post.author.role === 'Manager' && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-300">
                Manager
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">
            {post.author.headline || 'Community Member'} · {timeAgo}
          </p>
        </div>
      </header>

      <div className="mt-3 text-gray-200">
        <p className="whitespace-pre-wrap">{post.content}</p>
      </div>

      <div className="mt-3 flex justify-between text-sm text-gray-400">
        <span>{post.stats?.reactions ?? 0} Reactions</span>
        <span>{post.stats?.comments ?? 0} Comments</span>
      </div>
    </div>
  );
}
