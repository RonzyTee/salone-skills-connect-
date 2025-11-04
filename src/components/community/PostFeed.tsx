'use client';

import React, { useState, useEffect } from 'react';
import { PostCard } from './PostCard';
import { CommunityPost } from '@/types/community';
import { FaSpinner } from 'react-icons/fa';

export function PostFeed() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/community/posts');
      if (!response.ok) {
        throw new Error('Failed to fetch posts from the server.');
      }
      // FIX: Explicitly type the data from the API response to avoid 'any' type.
      const data: CommunityPost[] = await response.json();
      setPosts(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-10 bg-[#242526] rounded-xl shadow">
        <FaSpinner className="animate-spin h-8 w-8 text-slate-400" />
      </div>
    );
  }

  if (error) {
     return (
      <div className="text-center py-10 bg-[#242526] rounded-xl shadow border border-red-500/30">
          <p className="text-red-400">Error: {error}</p>
        </div>
     )
  }

  return (
    <div className="space-y-6">
      {posts.length > 0 ? (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      ) : (
        <div className="text-center py-10 bg-[#242526] rounded-xl shadow">
          <p className="text-slate-400">No posts yet. Be the first to share something!</p>
        </div>
      )}
    </div>
  );
}
