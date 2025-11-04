'use client';

// --- 1. Imports ---
import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import {
  FaUserCheck,
  FaLock,
  FaCheckCircle,
  FaHourglassHalf,
  FaMapMarkerAlt,
  FaLinkedin,
  FaEnvelope,
  FaEdit,
  FaSpinner,
  FaGlobe,
  FaPhone,
  FaFileAlt,
} from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { UserProfile } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import Loader from '@/components/ui/loader';

// --- 2. Types & Constants ---

const glassCardClasses =
  'border-0 bg-slate-900/60 backdrop-blur-md transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
    },
  },
};

// --- 3. Sub-Components ---

/**
 * Renders a single row in the Verification Status card.
 */
const StatusTierRow = ({
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
    verified: {
      icon: <FaCheckCircle className="text-green-500" />,
      text: 'Verified',
      color: 'text-green-500',
    },
    pending: {
      icon: <FaHourglassHalf className="text-yellow-500" />,
      text: 'Pending Review',
      color: 'text-yellow-500',
    },
    locked: {
      icon: <FaLock className="text-slate-500" />,
      text: 'Locked',
      color: 'text-slate-500',
    },
    unverified: {
      icon: <FaLock className="text-slate-500" />,
      text: 'Not Verified',
      color: 'text-slate-500',
    },
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
          <p className="text-xs text-slate-500">{actionText}</p>
        )}
      </div>
      <div className="text-xl">{statusConfig[currentStatus].icon}</div>
    </div>
  );
};

/**
 * Renders the sticky left sidebar for the organization.
 */
const StickySidebar = ({ profile }: { profile: UserProfile }) => {
  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Verification Status Card */}
      <motion.div variants={itemVariants}>
        <Card className={glassCardClasses}>
          <CardHeader>
            <CardTitle className="text-xl text-white">
              Verification Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <StatusTierRow
              icon={<FaUserCheck />}
              title="Tier 0: Identity Confirmed"
              status={profile?.oivpStatus?.tier0}
              actionText="Complete verification to post jobs."
              href="#" // You can change this to your verification page link
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Contact & Links Card */}
      <motion.div variants={itemVariants}>
        <Card className={glassCardClasses}>
          <CardHeader>
            <CardTitle className="text-xl text-white">Contact & Links</CardTitle>
          </CardHeader>
          <CardContent>
            <TooltipProvider delayDuration={0}>
              <div className="space-y-4">
                {profile.physicalAddress && (
                  <div className="flex items-start gap-3 text-slate-300">
                    <FaMapMarkerAlt className="h-5 w-5 text-slate-400 flex-shrink-0 mt-1" />
                    <span>{profile.physicalAddress}</span>
                  </div>
                )}
                {profile.businessEmail && (
                  <a
                    href={`mailto:${profile.businessEmail}`}
                    className="flex items-center gap-3 text-slate-300 hover:text-blue-400 transition-colors group"
                  >
                    <FaEnvelope className="h-5 w-5 text-slate-400 group-hover:text-blue-400" />
                    <span>{profile.businessEmail}</span>
                  </a>
                )}
                {profile.phoneNumber && (
                  <div className="flex items-center gap-3 text-slate-300">
                    <FaPhone className="h-5 w-5 text-slate-400" />
                    <span>{profile.phoneNumber}</span>
                  </div>
                )}
                {profile.organizationWebsite && (
                  <a
                    href={profile.organizationWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-slate-300 hover:text-blue-400 transition-colors group"
                  >
                    <FaGlobe className="h-5 w-5 text-slate-400 group-hover:text-blue-400" />
                    <span>Visit Website</span>
                  </a>
                )}
                {profile.linkedinUrl && (
                  <a
                    href={profile.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-slate-300 hover:text-blue-400 transition-colors group"
                  >
                    <FaLinkedin className="h-5 w-5 text-slate-400 group-hover:text-blue-400" />
                    <span>LinkedIn Profile</span>
                  </a>
                )}
                {profile.businessRegDocUrl && (
                  <a
                    href={profile.businessRegDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-slate-300 hover:text-blue-400 transition-colors group"
                  >
                    <FaFileAlt className="h-5 w-5 text-slate-400 group-hover:text-blue-400" />
                    <span>View Registration Doc</span>
                  </a>
                )}
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

// --- 4. Main Page Component ---

export default function OrganizationProfilePage() {
  // --- Hooks ---
  const router = useRouter();
  const { user, userProfile: profile, loading: isLoading } = useAuth();

  // --- Loading / Error States ---
  if (isLoading) {
    return <Loader />;
  }

  if (!user || !profile || profile.userType !== 'manager') {
    router.push('/dashboard');
    return <Loader />;
  }

  // --- Derived State for Render ---
  const isVerified = profile.oivpStatus?.tier0 === 'verified';

  // --- Main Render ---
  return (
    <div className="min-h-screen w-full bg-slate-950 text-white p-4 md:px-8 lg:px-12 xl:px-16 lg:py-12 xl:py-16 relative overflow-hidden">
      {/* Aurora Background */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[100rem] h-[100rem]
                   bg-gradient-to-br from-blue-900/30 to-purple-900/30
                   rounded-full blur-[150px] opacity-30 pointer-events-none
                   animate-[spin_25s_linear_infinite]"
        aria-hidden="true"
      />

      <div className="max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 relative z-10">
        {/* Sticky Left Column */}
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24 h-fit">
          <StickySidebar profile={profile} />
        </div>

        {/* Main Content Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className={`${glassCardClasses} overflow-hidden group`}>
              {/* Cover Photo */}
              <div className="h-48 md:h-64 relative bg-slate-800 overflow-hidden">
                {profile.organizationCoverPhotoUrl ? (
                  <img
                    src={profile.organizationCoverPhotoUrl}
                    alt="Organization cover"
                    className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-blue-700 to-indigo-800" />
                )}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent"
                  aria-hidden="true"
                />
              </div>

              <div className="p-6 flex flex-col md:flex-row items-center md:items-end -mt-20 md:-mt-24 relative z-10">
                {/* Avatar (Logo) */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 120 }}
                >
                  <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-slate-900 shadow-lg">
                    <AvatarImage
                      src={profile.organizationLogoUrl}
                      alt={profile.organizationName || 'Organization logo'}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-4xl bg-slate-700 text-white">
                      {profile.organizationName
                        ? profile.organizationName.charAt(0)
                        : 'O'}
                    {/* --- THIS IS THE FIX --- */}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>

                {/* Name, Stats, Buttons */}
                <div className="md:ml-6 mt-4 md:mt-0 w-full flex flex-col md:flex-row items-center justify-between">
                  {/* Name, Industry, Location */}
                  <div className="text-center md:text-left">
                    <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                      {profile.organizationName || 'My Organization'}
                    </h1>
                    <p className="text-lg text-slate-300 font-medium drop-shadow-md">
                      {profile.industry || 'Industry not set'}
                    </p>
                    {isVerified && (
                      <div
                        className="inline-flex items-center justify-center md:justify-start mt-1.5 px-3 py-1
                                       rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-xs font-bold"
                      >
                        <FaCheckCircle className="mr-1.5" />
                        Identity Verified
                      </div>
                    )}
                    {profile.physicalAddress && (
                      <p className="text-sm text-slate-400 flex items-center justify-center md:justify-start mt-1.5">
                        <FaMapMarkerAlt className="mr-1.5 text-blue-500" />
                        {profile.physicalAddress}
                      </p>
                    )}
                  </div>

                  {/* Buttons (Right side) */}
                  <div className="flex flex-col items-center md:items-end mt-4 md:mt-0 space-y-3">
                    <div className="flex gap-3">
                      <Button asChild>
                        {/* Assumes edit page is here: */}
                        <Link href="/dashboard/organization/edit">
                          <FaEdit className="mr-2" /> Edit Profile
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* "About" Card */}
          <motion.div
            key="about"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <Card className={glassCardClasses}>
              <CardHeader>
                <CardTitle className="text-xl text-white">
                  About Organization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-base leading-relaxed whitespace-pre-wrap break-words">
                  {profile.aboutOrganization
                    ? profile.aboutOrganization
                    : "You haven't added an organization description yet. Click 'Edit Profile' to tell talents what you're all about!"}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
