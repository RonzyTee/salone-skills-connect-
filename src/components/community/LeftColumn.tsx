'use client'
import { useAuth } from '@/context/AuthContext';

export function LeftColumn() {
  const { userProfile } = useAuth();

  if (!userProfile) {
    // A placeholder for when the profile is loading, matching the new theme
    return (
        <div className="bg-[#242526] p-4 rounded-xl shadow animate-pulse h-48"></div>
    );
  }

  return (
    // STYLE: Matched card styling to PostCard for consistency
    <div className="bg-[#242526] p-4 rounded-xl shadow text-center text-white">
        <img src={userProfile.profilePictureUrl || '/images/default-avatar.png'} alt="My Profile" className="w-20 h-20 rounded-full mx-auto object-cover" />
        <h3 className="font-bold mt-2">{userProfile.fullName}</h3>
        <p className="text-sm text-slate-400">{userProfile.primarySkill}</p>
    </div>
  );
}
