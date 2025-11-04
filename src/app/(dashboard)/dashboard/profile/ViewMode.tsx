'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoField, StatusTierRow, containerVariants, itemVariants } from './common';
import {
  FaEnvelope, FaPhone, FaWhatsapp, FaGithub, FaLinkedin, FaUserCheck, FaTools, FaStar
} from 'react-icons/fa';
import { MdOutlineWork } from 'react-icons/md';

interface ViewModeProps {
  userProfile: any;
}

export const ViewMode: React.FC<ViewModeProps> = ({ userProfile }) => (
  <motion.div
    className="grid grid-cols-1 lg:grid-cols-3 gap-6"
    variants={containerVariants}
    initial="hidden"
    animate="visible"
  >
    {/* Left Column */}
    <div className="lg:col-span-1 space-y-6">
      <motion.div variants={itemVariants}>
        <Card className="bg-transparent shadow-md border border-slate-700">
          <CardHeader>
            <CardTitle className="text-xl text-white">Skills & Expertise</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {userProfile.selectedSkills && userProfile.selectedSkills.length > 0 ? (
              userProfile.selectedSkills.map((skill: string) => (
                <span key={skill} className="bg-slate-700 text-slate-200 text-sm font-medium px-4 py-2 rounded-full">
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-slate-400">No skills added yet.</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="bg-transparent shadow-md border border-slate-700">
          <CardHeader>
            <CardTitle className="text-xl text-white">Social Presence</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {userProfile.githubUrl && <a href={userProfile.githubUrl} target="_blank" rel="noopener noreferrer" aria-label="GitHub Profile" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors p-2 rounded-md bg-slate-800 hover:bg-slate-700"><FaGithub className="h-5 w-5" /><span className="font-medium text-sm hidden sm:inline">GitHub</span></a>}
            {userProfile.linkedinUrl && <a href={userProfile.linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn Profile" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors p-2 rounded-md bg-slate-800 hover:bg-slate-700"><FaLinkedin className="h-5 w-5 text-[#0A66C2]" /><span className="font-medium text-sm hidden sm:inline">LinkedIn</span></a>}
            {!userProfile.githubUrl && !userProfile.linkedinUrl && <p className="text-slate-400">No social links added.</p>}
          </CardContent>
        </Card>
      </motion.div>
    </div>

    {/* Right Column */}
    <div className="lg:col-span-2 space-y-6">
      <motion.div variants={itemVariants}>
        <Card className="bg-transparent shadow-md border border-slate-700">
          <CardHeader>
            <CardTitle className="text-xl text-white">About Me</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 text-base leading-relaxed break-words">{userProfile.bio || 'No bio provided.'}</p>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <Card className="bg-transparent shadow-md border border-slate-700">
          <CardHeader>
            <CardTitle className="text-xl text-white">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <InfoField icon={<MdOutlineWork size={20} />} label="Career Objective" value={userProfile.careerObjective} />
            <InfoField icon={<FaEnvelope size={20} />} label="Email Address" value={userProfile.email} />
            <InfoField icon={<FaPhone size={20} />} label="Phone Number" value={userProfile.phoneNumber} />
            <InfoField icon={<FaWhatsapp size={20} />} label="WhatsApp" value={userProfile.whatsappNumber} />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="bg-transparent shadow-md border border-slate-700">
          <CardHeader>
            <CardTitle className="text-xl text-white">Verification Status (OIVP)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <StatusTierRow icon={<FaUserCheck />} title="Tier 0: Identity Confirmed" status={userProfile?.oivpStatus?.tier0} actionText="Complete your identity verification." href="/onboarding" />
            <StatusTierRow icon={<FaTools />} title="Tier 1: Work Authenticated" status={userProfile?.oivpStatus?.tier1} actionText="Add a project to prove your skill." href="/dashboard/portfolio/add" />
            <StatusTierRow icon={<FaStar />} title="Tier 2: Skill Endorsed" status={userProfile?.oivpStatus?.tier2} actionText="Get a real client to endorse your work." href="/dashboard/portfolio" />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  </motion.div>
);
