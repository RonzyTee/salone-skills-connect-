'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FaEdit, FaTimes, FaCheckCircle, FaMapMarkerAlt } from 'react-icons/fa';
import { formatFollowerCount } from './common';

interface ProfileHeaderProps {
  userProfile: any;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ userProfile, isEditing, setIsEditing }) => {
  const displaySkill = userProfile.primarySkill || userProfile.selectedSkills?.[0] || 'Your Profession';
  const isVerified = userProfile.oivpStatus?.tier0 === 'verified';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-transparent shadow-xl overflow-hidden border border-slate-700">
        <div className="h-48 md:h-64 relative bg-slate-800">
          {userProfile.coverPhotoUrl ? (
            <img src={userProfile.coverPhotoUrl} alt="Cover photo" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900" />
          )}
        </div>

        <div className="p-6 flex flex-col md:flex-row items-center md:items-end -mt-20 md:-mt-24">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 120 }}
          >
            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-slate-950 shadow-lg">
              <AvatarImage src={userProfile.profilePictureUrl} alt={userProfile.fullName || 'User avatar'} className="object-cover" />
              <AvatarFallback className="text-4xl bg-slate-700 text-white">
                {userProfile.fullName ? userProfile.fullName.charAt(0) : 'U'}
              </AvatarFallback>
            </Avatar>
          </motion.div>

          <div className="md:ml-6 mt-4 md:mt-0 w-full flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold text-white flex items-center justify-center md:justify-start gap-2">
                {userProfile.fullName || 'SkillsLink User'}
                {isVerified && <FaCheckCircle className="text-blue-400 text-xl" title="Identity Verified" />}
              </h1>
              <p className="text-lg text-slate-300 font-medium">{displaySkill}</p>
              {userProfile.location && (
                <p className="text-sm text-slate-400 flex items-center justify-center md:justify-start mt-1">
                  <FaMapMarkerAlt className="mr-1.5 text-slate-500" />
                  {userProfile.location}
                </p>
              )}
            </div>

            <div className="flex flex-col items-center md:items-end gap-3">
              <div className="flex flex-wrap justify-center gap-3">
                <div className="flex flex-col items-center px-3 py-1 bg-slate-800 rounded-lg">
                  <span className="text-xl font-bold text-blue-400">{userProfile.projectsCount ?? 0}</span>
                  <span className="text-xs text-slate-400">Projects</span>
                </div>
                <div className="flex flex-col items-center px-3 py-1 bg-slate-800 rounded-lg">
                  <span className="text-xl font-bold text-green-400">{userProfile.endorsementsCount ?? 0}</span>
                  <span className="text-xs text-slate-400">Endorsements</span>
                </div>
                <div className="flex flex-col items-center px-3 py-1 bg-slate-800 rounded-lg">
                  <span className="text-xl font-bold text-purple-400">{formatFollowerCount(userProfile.followers?.length ?? 0)}</span>
                  <span className="text-xs text-slate-400">Followers</span>
                </div>
              </div>
              
              <div className="flex gap-3">
                {isEditing ? (
                   <Button variant="outline" className="text-gray-300 border-gray-600 hover:bg-gray-700/50" onClick={() => setIsEditing(false)}>
                    <FaTimes className="mr-2" /> Cancel
                  </Button>
                ) : (
                  <Button variant="default" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIsEditing(true)}>
                    <FaEdit className="mr-2" /> Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
