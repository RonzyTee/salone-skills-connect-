'use client';

import React from 'react';
import Link from 'next/link';
import * as z from 'zod';
import { FaCheckCircle, FaHourglassHalf, FaLock } from 'react-icons/fa';
// FIX: Changed import to 'import type' for Variants, as it's a type-only import. This resolves module resolution errors for framer-motion props.
import type { Variants } from 'framer-motion';

// --- ZOD SCHEMA ---
export const profileSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  profilePictureUrl: z.string().url().optional().or(z.literal('')),
  coverPhotoUrl: z.string().url().optional().or(z.literal('')),
  bio: z.string().max(500, 'Bio must be 500 characters or less').optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  phoneNumber: z.string().optional().or(z.literal('')),
  whatsappNumber: z.string().optional().or(z.literal('')),
  githubUrl: z.string().url('Please enter a valid URL').or(z.literal('')).optional(),
  linkedinUrl: z.string().url('Please enter a valid URL').or(z.literal('')).optional(),
  careerObjective: z.string().optional().or(z.literal('')),
  primarySkill: z.string().optional().or(z.literal('')),
});
export type ProfileFormValues = z.infer<typeof profileSchema>;

// --- SHARED UI COMPONENTS ---
interface InfoFieldProps {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  isLink?: boolean;
  linkPrefix?: string;
}
export const InfoField: React.FC<InfoFieldProps> = ({
  icon,
  label,
  value,
  isLink = false,
  linkPrefix = '',
}) => (
  <div className="flex items-start gap-4">
    <div className="text-slate-400 mt-1">{icon}</div>
    <div className="flex-1">
      <h3 className="text-sm font-medium text-slate-500">{label}</h3>
      {isLink && value ? (
        <a
          href={`${linkPrefix}${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lg text-blue-400 hover:underline break-all"
        >
          {value.replace(/^(https?:\/\/)?(www\.)?/, '')}
        </a>
      ) : (
        <p className="text-lg text-white break-words">{value || 'Not provided'}</p>
      )}
    </div>
  </div>
);

export const StatusTierRow = ({
  icon,
  title,
  status,
  actionText,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  status?: 'verified' | 'pending' | 'unverified' | 'locked';
  actionText: string;
  href: string;
}) => {
  const statusConfig = {
    verified: { icon: <FaCheckCircle className="text-green-500" />, text: 'Verified', color: 'text-green-500' },
    pending: { icon: <FaHourglassHalf className="text-yellow-500" />, text: 'Pending Review', color: 'text-yellow-500' },
    locked: { icon: <FaLock className="text-slate-500" />, text: 'Locked', color: 'text-slate-500' },
    unverified: { icon: <FaLock className="text-slate-500" />, text: 'Not Verified', color: 'text-slate-500' },
  };
  const currentStatus = status || 'locked';
  return (
    <div className="flex items-center gap-4">
      <div className="text-2xl text-slate-400">{icon}</div>
      <div className="flex-1">
        <p className="font-semibold text-white">{title}</p>
        <p className={`text-sm ${statusConfig[currentStatus].color}`}>
          {statusConfig[currentStatus].text}
        </p>
        {(currentStatus === 'locked' || currentStatus === 'unverified') && (
          <Link href={href} className="text-xs text-blue-400 hover:underline">
            {actionText}
          </Link>
        )}
      </div>
      <div className="text-xl">{statusConfig[currentStatus].icon}</div>
    </div>
  );
};

// --- ANIMATION VARIANTS ---
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

export const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 },
  },
};

// --- HELPER FUNCTIONS ---
export const formatFollowerCount = (count: number): string => {
  if (!count) return '0';
  if (count >= 1000000) {
    const num = count / 1000000;
    return `${num % 1 === 0 ? num : num.toFixed(1)}m`;
  }
  if (count >= 1000) {
    const num = count / 1000;
    return `${num % 1 === 0 ? num : num.toFixed(1)}k`;
  }
  return count.toString();
};