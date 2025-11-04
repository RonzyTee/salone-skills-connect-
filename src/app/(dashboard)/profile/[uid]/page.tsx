// /app/profile/[uid]/page.tsx
'use client';

/*
 * --- DESIGN NOTE (Font Pairing) ---
 * (Design note unchanged)
 */

// --- 1. Imports ---
// (Imports unchanged)
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  query,
  getDocs,
} from 'firebase/firestore';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  FaUserCheck,
  FaTools,
  FaStar,
  FaLock,
  FaCheckCircle,
  FaHourglassHalf,
  FaMapMarkerAlt,
  FaGithub,
  FaLinkedin,
  FaWhatsapp,
  FaCode,
  FaPalette,
  FaVial,
  FaDatabase,
  FaFilm,
  FaShieldAlt,
  FaCloud,
  FaMobileAlt,
  FaLayerGroup,
  FaUserPlus,
  FaEnvelope,
  FaEdit,
  FaSpinner,
  FaProjectDiagram,
  FaAddressCard,
  FaExternalLinkAlt,
} from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// --- 2. Types & Constants ---

interface Project {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  liveUrl?: string;
  githubUrl?: string;
  tags?: string[];
}

// {/* --- CHANGED --- Added hover:-translate-y-1 for a "lift" effect */}
const glassCardClasses =
  'border-0 bg-slate-900/60 backdrop-blur-md transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-1';

const skillMap: { [key: string]: { icon: React.ReactNode; color: string } } = {
  // (skillMap unchanged)
  'full-stack development': { icon: <FaCode />, color: 'text-blue-400' },
  'ui/ux design': { icon: <FaPalette />, color: 'text-pink-400' },
  'software testing and qa': { icon: <FaVial />, color: 'text-emerald-400' },
  'database management': { icon: <FaDatabase />, color: 'text-amber-400' },
  'motion graphics': { icon: <FaFilm />, color: 'text-red-400' },
  cybersecurity: { icon: <FaShieldAlt />, color: 'text-cyan-400' },
  'cloud architecture': { icon: <FaCloud />, color: 'text-sky-400' },
  'mobile development': { icon: <FaMobileAlt />, color: 'text-indigo-400' },
  react: { icon: <FaCode />, color: 'text-sky-300' },
  'node.js': { icon: <FaCode />, color: 'text-green-400' },
  python: { icon: <FaCode />, color: 'text-yellow-400' },
  javascript: { icon: <FaCode />, color: 'text-yellow-300' },
  html5: { icon: <FaCode />, color: 'text-orange-400' },
  css3: { icon: <FaCode />, color: 'text-blue-300' },
  figma: { icon: <FaPalette />, color: 'text-purple-400' },
  docker: { icon: <FaCloud />, color: 'text-blue-500' },
  aws: { icon: <FaCloud />, color: 'text-orange-500' },
};

const containerVariants: Variants = {
  // (variants unchanged)
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  // (variants unchanged)
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

// --- 3. Helper Functions ---
// (Helper functions getSkillData & formatFollowerCount unchanged)

const getSkillData = (skillName: string) => {
  const normalizedSkill = skillName.toLowerCase().trim();
  return (
    skillMap[normalizedSkill] || {
      icon: <FaLayerGroup />,
      color: 'text-slate-400',
    }
  );
};

const formatFollowerCount = (count: number): string => {
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

// --- 4. Sub-Components ---

/**
 * Renders a single row in the Verification Status card.
 */
const StatusTierRow = ({
  // (StatusTierRow component unchanged)
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
 * Renders the entire sticky left sidebar (Skills, Verification, Socials).
 */
const StickySidebar = ({ profile }: { profile: UserProfile }) => {
  // (StickySidebar component unchanged)
  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Skills Card */}
      <motion.div variants={itemVariants}>
        <Card className={glassCardClasses}>
          <CardHeader>
            <CardTitle className="text-xl text-white">Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.selectedSkills && profile.selectedSkills.length > 0 ? (
                profile.selectedSkills.map((skill: string, idx: number) => {
                  const { icon, color } = getSkillData(skill);
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full shadow-sm
                                 transition-all duration-200 hover:bg-slate-700 hover:-translate-y-0.5"
                    >
                      <span className={`text-lg ${color}`}>{icon}</span>
                      <span className="text-white text-sm font-medium">
                        {skill}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-slate-400 text-sm">No skills listed yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

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
              actionText="User needs to complete verification."
              href="#"
            />
            <StatusTierRow
              icon={<FaTools />}
              title="Tier 1: Work Authenticated"
              status={profile?.oivpStatus?.tier1}
              actionText="User needs work samples."
              href="#"
            />
            <StatusTierRow
              icon={<FaStar />}
              title="Tier 2: Skill Endorsed"
              status={profile?.oivpStatus?.tier2}
              actionText="User needs endorsements."
              href="#"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Socials Card */}
      <motion.div variants={itemVariants}>
        <Card className={glassCardClasses}>
          <CardHeader>
            <CardTitle className="text-xl text-white">Social Presence</CardTitle>
          </CardHeader>
          <CardContent>
            <TooltipProvider delayDuration={0}>
              <div className="flex flex-wrap gap-3">
                {profile.githubUrl && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={profile.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="GitHub Profile"
                        className="flex items-center justify-center h-10 w-10 text-slate-400 hover:text-white
                                   bg-slate-800 hover:bg-slate-700 rounded-full transition-all duration-200 active:scale-90"
                      >
                        <FaGithub className="h-5 w-5" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>GitHub</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {profile.linkedinUrl && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={profile.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="LinkedIn Profile"
                        className="flex items-center justify-center h-10 w-10 text-blue-500 hover:text-blue-400
                                   bg-slate-800 hover:bg-slate-700 rounded-full transition-all duration-200 active:scale-90"
                      >
                        <FaLinkedin className="h-5 w-5" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>LinkedIn</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {profile.whatsappNumber && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={`https://wa.me/${profile.whatsappNumber.replace(
                          /\D/g,
                          ''
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="WhatsApp"
                        className="flex items-center justify-center h-10 w-10 text-green-500 hover:text-green-400
                                   bg-slate-800 hover:bg-slate-700 rounded-full transition-all duration-200 active:scale-90"
                      >
                        <FaWhatsapp className="h-5 w-5" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>WhatsApp</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {!profile.githubUrl &&
                  !profile.linkedinUrl &&
                  !profile.whatsappNumber && (
                    <p className="text-slate-400 text-sm">
                      No social links provided.
                    </p>
                  )}
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

/**
 * Renders a single project card for the "Projects" tab.
 */
const ProjectCard = ({ project }: { project: Project }) => {
  // (ProjectCard component unchanged)
  return (
    <Card
      className={`${glassCardClasses} overflow-hidden flex flex-col`}
    >
      <CardHeader className="p-0">
        <div className="aspect-video w-full bg-slate-800 flex items-center justify-center overflow-hidden">
          {project.imageUrl ? (
            <img
              src={project.imageUrl}
              alt={project.title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <FaProjectDiagram className="w-12 h-12 text-slate-600" />
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <h3 className="text-lg font-semibold text-white mb-1">
          {project.title}
        </h3>
        <p className="text-sm text-slate-400 line-clamp-2">
          {project.description}
        </p>
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {project.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded-full text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 bg-slate-800/50 flex justify-end gap-3">
        {project.githubUrl && (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Repository"
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm"
          >
            <FaGithub /> GitHub
          </a>
        )}
        {project.liveUrl && (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Live Demo"
            className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium"
          >
            <FaExternalLinkAlt /> Live Demo
          </a>
        )}
      </CardFooter>
    </Card>
  );
};

// --- 5. Main Page Component ---

export default function UserProfilePage() {
  // --- Hooks ---
  // (Hooks and State definitions unchanged)
  const router = useRouter();
  const params = useParams();
  const uid = params.uid as string;
  const { user, userProfile: currentUserProfile } = useAuth();

  // --- State ---
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'projects'>('about');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);

  // --- Derived State ---
  const isOwner = user?.uid === uid;

  // --- Data Fetching Effects ---
  // (useEffect blocks for fetching profile and projects unchanged)
  useEffect(() => {
    if (!uid) {
      return;
    }
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const profileData = docSnap.data() as UserProfile;
          setProfile(profileData);
          if (currentUserProfile?.following?.includes(profileData.uid)) {
            setIsFollowing(true);
          } else {
            setIsFollowing(false);
          }
        } else {
          router.push('/404');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        router.push('/error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [uid, currentUserProfile?.following, router]);

  useEffect(() => {
    if (!uid) return;
    const fetchProjects = async () => {
      setIsProjectsLoading(true);
      try {
        const projectsRef = collection(db, 'users', uid, 'projects');
        const projectsQuery = query(projectsRef);
        const querySnapshot = await getDocs(projectsQuery);
        const fetchedProjects: Project[] = [];
        querySnapshot.forEach((doc) => {
          fetchedProjects.push({ id: doc.id, ...doc.data() } as Project);
        });
        setProjects(fetchedProjects);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setIsProjectsLoading(false);
      }
    };
    fetchProjects();
  }, [uid]);

  // --- Event Handlers ---
  // (handleFollow logic unchanged, though I recommend the optimistic update from the previous answer)
  const handleFollow = async () => {
    if (!user?.uid || !profile?.uid) return;

    const currentUserId = user.uid;
    const targetUserId = profile.uid;
    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);

    // Optimistic UI update
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setProfile((prev) => {
      if (!prev) return prev;
      const currentFollowers = prev.followers || [];
      const newFollowers = wasFollowing
        ? currentFollowers.filter((fuid) => fuid !== currentUserId)
        : [...currentFollowers, currentUserId];
      return { ...prev, followers: newFollowers };
    });

    try {
      if (wasFollowing) {
        // Unfollow
        await updateDoc(currentUserRef, { following: arrayRemove(targetUserId) });
        await updateDoc(targetUserRef, { followers: arrayRemove(currentUserId) });
      } else {
        // Follow
        await updateDoc(currentUserRef, { following: arrayUnion(targetUserId) });
        await updateDoc(targetUserRef, { followers: arrayUnion(currentUserId) });
      }
    } catch (error) {
      console.error('Failed to update follow status:', error);
      // Revert optimistic update on failure
      setIsFollowing(wasFollowing);
      setProfile((prev) => {
        if (!prev) return prev;
        const currentFollowers = prev.followers || [];
        const revertedFollowers = wasFollowing
          ? [...currentFollowers, currentUserId]
          : currentFollowers.filter((fuid) => fuid !== currentUserId);
        return { ...prev, followers: revertedFollowers };
      });
    }
  };

  // --- Loading / Error States ---
  // (Loading and Error states unchanged)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
        <p className="ml-3 text-lg">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <p className="text-lg">Profile not found.</p>
      </div>
    );
  }

  // --- Derived State for Render ---
  const isVerified = profile.oivpStatus?.tier0 === 'verified';
  const displaySkill =
    profile.primarySkill || profile.selectedSkills?.[0] || 'Skill not listed';

  // --- Main Render ---
  return (
    // {/* --- CHANGED --- Added responsive vertical padding (py-*) for better height scaling */}
    <div className="min-h-screen w-full bg-slate-950 text-white p-4 md:px-8 lg:px-12 xl:px-16 lg:py-12 xl:py-16 relative overflow-hidden">
      {/* --- CHANGED --- Made Aurora larger and added slow spin animation */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[100rem] h-[100rem]
                 bg-gradient-to-br from-blue-900/30 to-purple-900/30
                 rounded-full blur-[150px] opacity-30 pointer-events-none
                 animate-[spin_25s_linear_infinite]"
        aria-hidden="true"
      />

      {/* --- CHANGED --- Increased max-w- from 7xl to screen-2xl for larger monitors */}
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
            {/* --- CHANGED --- Added 'group' for hover effect on cover photo */}
            <Card className={`${glassCardClasses} overflow-hidden group`}>
              {/* --- CHANGED --- Added 'overflow-hidden' to clip zooming image */}
              <div className="h-48 md:h-64 relative bg-slate-800 overflow-hidden">
                {profile.coverPhotoUrl ? (
                  <img
                    src={profile.coverPhotoUrl}
                    alt="Cover photo"
                    // {/* --- CHANGED --- Added transition and group-hover:scale-110 */}
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
                {/* Avatar */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 120 }}
                >
                  <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-slate-900 shadow-lg">
                    <AvatarImage
                      src={profile.profilePictureUrl}
                      alt={profile.fullName || 'User avatar'}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-4xl bg-slate-700 text-white">
                      {profile.fullName ? profile.fullName.charAt(0) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>

                {/* Name, Stats, Buttons */}
                <div className="md:ml-6 mt-4 md:mt-0 w-full flex flex-col md:flex-row items-center justify-between">
                  {/* Name, Skill, Location */}
                  <div className="text-center md:text-left">
                    <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                      {profile.fullName || 'SkillsLink User'}
                    </h1>
                    <p className="text-lg text-slate-300 font-medium drop-shadow-md">
                      {displaySkill}
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
                    {profile.location && (
                      <p className="text-sm text-slate-400 flex items-center justify-center md:justify-start mt-1.5">
                        <FaMapMarkerAlt className="mr-1.5 text-blue-500" />
                        {profile.location}
                      </p>
                    )}
                  </div>

                  {/* Stats & Buttons (Right side) */}
                  <div className="flex flex-col items-center md:items-end mt-4 md:mt-0 space-y-3">
                    {/* Stats */}
                    {/* (Stats section unchanged) */}
                    <div className="flex flex-wrap justify-center gap-3">
                      <div
                        className="flex flex-col items-center px-3 py-1.5 bg-slate-800/70
                                   rounded-lg transition-all hover:bg-slate-700/90"
                      >
                        <span className="text-xl font-bold text-blue-400">
                          {profile.projectsCount ?? 0}
                        </span>
                        <span className="text-xs text-slate-400">Projects</span>
                      </div>
                      <div
                        className="flex flex-col items-center px-3 py-1.5 bg-slate-800/70
                                   rounded-lg transition-all hover:bg-slate-700/90"
                      >
                        <span className="text-xl font-bold text-green-400">
                          {profile.endorsementsCount ?? 0}
                        </span>
                        <span className="text-xs text-slate-400">
                          Endorsements
                        </span>
                      </div>
                      <div
                        className="flex flex-col items-center px-3 py-1.5 bg-slate-800/70
                                   rounded-lg transition-all hover:bg-slate-700/90"
                      >
                        <span className="text-xl font-bold text-purple-400">
                          {formatFollowerCount(profile.followers?.length ?? 0)}
                        </span>
                        <span className="text-xs text-slate-400">
                          Followers
                        </span>
                      </div>
                    </div>

                    {/* Buttons */}
                    {/* (Buttons section unchanged) */}
                    <div className="flex gap-3">
                      {isOwner ? (
                        <Link href="/dashboard/profile">
                          <Button
                            variant="outline"
                            className="text-blue-400 border-blue-600 hover:bg-blue-600/20 hover:text-blue-300
                                       transition-all duration-300 shadow-lg shadow-blue-600/10 active:scale-95"
                          >
                            <FaEdit className="mr-2" /> Edit My Profile
                          </Button>
                        </Link>
                      ) : (
                        <>
                          <Button
                            onClick={() => router.push(`/chat/${profile.uid}`)}
                            variant="default"
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white
                                       transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 active:scale-95"
                            disabled={!user}
                          >
                            <FaEnvelope className="mr-2" /> Message
                          </Button>
                          <Button
                            variant={isFollowing ? 'secondary' : 'outline'}
                            onClick={handleFollow}
                            className={
                              isFollowing
                                ? 'bg-slate-700 hover:bg-slate-600 transition-all duration-300 active:scale-95'
                                : 'text-green-400 border-green-600 hover:bg-green-600/20 hover:text-green-300 \
                                   transition-all duration-300 shadow-lg shadow-green-600/10 active:scale-95'
                            }
                            disabled={!user}
                          >
                            <FaUserPlus className="mr-2" />
                            {isFollowing ? 'Following' : 'Follow'}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* --- Animated Tabs --- */}
          {/* (Tabs component structure unchanged) */}
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'about' | 'projects')}
            className="w-full"
          >
            <TabsList
              className="grid w-full grid-cols-2 bg-slate-800/90 shadow-md backdrop-blur-sm relative"
            >
              <TabsTrigger
                value="about"
                className="relative data-[state=active]:text-blue-900 font-medium text-slate-300 hover:text-blue-300 transition-colors z-10"
              >
                <FaAddressCard className="mr-2" /> About
              </TabsTrigger>
              <TabsTrigger
                value="projects"
                className="relative data-[state=active]:text-blue-900 font-medium text-slate-300 hover:text-blue-300 transition-colors z-10"
              >
                <FaProjectDiagram className="mr-2" /> Projects (
                {profile.projectsCount ?? projects.length})
              </TabsTrigger>

              <motion.div
                layoutId="activeTabIndicator"
                className="absolute inset-0 h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-md z-0"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{
                  width: '50%',
                  left: activeTab === 'about' ? '0%' : '50%',
                }}
              />
            </TabsList>

            {/* "About" Tab Content */}
            <TabsContent value="about" className="mt-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key="about"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className={glassCardClasses}>
                    <CardHeader>
                      <CardTitle className="text-xl text-white">
                        About Me
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* --- CHANGED --- Smarter empty state for bio */}
                      <p className="text-slate-300 text-base leading-relaxed whitespace-pre-wrap break-words">
                        {profile.bio
                          ? profile.bio
                          : isOwner
                          ? "You haven't added a bio yet. Click 'Edit My Profile' to introduce yourself!"
                          : "This user hasn't added a bio yet."}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>
            </TabsContent>

            {/* "Projects" Tab Content */}
            <TabsContent value="projects" className="mt-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key="projects"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {isProjectsLoading ? (
                    <div
                      className={`${glassCardClasses} flex items-center justify-center p-12`}
                    >
                      <FaSpinner className="animate-spin text-2xl text-blue-500" />
                      <p className="ml-2 text-slate-300">Loading projects...</p>
                    </div>
                  ) : projects.length === 0 ? (
                    <Card className={glassCardClasses}>
                      {/* --- CHANGED --- Smarter empty state for projects */}
                      <CardContent className="p-6 text-center">
                        <FaProjectDiagram className="mx-auto text-4xl text-slate-600 mb-3" />
                        <p className="text-slate-400">
                          {isOwner
                            ? "You haven't added any projects yet. Go to your dashboard to show off your work!"
                            : "This user hasn't added any projects yet."}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {projects.map((project, i) => (
                        <motion.div
                          key={project.id}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          transition={{
                            delay: i * 0.1,
                            type: 'spring',
                            stiffness: 100,
                          }}
                        >
                          <ProjectCard project={project} />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}