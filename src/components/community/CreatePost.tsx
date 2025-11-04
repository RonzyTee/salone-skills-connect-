'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FaPaperPlane, FaSpinner } from 'react-icons/fa';

export function CreatePost() {
  const { user, userProfile } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user?.uid) return;

    setIsSubmitting(true);
    setError(null);
    const formData = new FormData();
    formData.append('content', content);
    formData.append('authorUid', user.uid);

    try {
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        // This will now throw the specific error from the backend
        throw new Error(errorData.message || 'An unknown error occurred');
      }

      setContent('');
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      setError(err.message); // Display the specific error to the user
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userProfile) return null;

  return (
    // STYLE: Updated to match the unified dark theme of PostCard
    <div className="bg-[#242526] p-4 rounded-xl shadow">
      <div className="flex items-start space-x-4">
        <img
          src={userProfile.profilePictureUrl || '/images/default-avatar.png'}
          alt="My Avatar"
          className="w-12 h-12 rounded-full object-cover"
        />
        <form onSubmit={handleSubmit} className="w-full">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-2 bg-[#3A3B3C] border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder={`What's on your mind, ${userProfile.fullName?.split(' ')[0]}?`}
          />
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <div className="flex justify-end items-center mt-4">
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="bg-blue-600 text-white font-semibold px-5 py-2 rounded-full disabled:bg-slate-700 disabled:text-slate-400 hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              {isSubmitting ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
              Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
