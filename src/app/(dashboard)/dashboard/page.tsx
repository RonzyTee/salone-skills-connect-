'use client';

// Fix: Import `React` to resolve namespace errors for `React.ReactNode`.
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  limit,
  getDocs,
  orderBy,
  startAfter,
  doc,
  // Fix: Import `getDoc` from `firebase/firestore` to resolve an undefined function call.
  getDoc,
  writeBatch,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import {
  FaUserCheck,
  FaTools,
  FaStar,
  FaLock,
  FaCheckCircle,
  FaHourglassHalf,
  FaSearch,
  FaArrowRight,
  FaSpinner,
  FaMapMarkerAlt,
  FaLink,
  FaGithub,
  FaLinkedin,
  FaUser,
  FaProjectDiagram,
  FaTimesCircle,
  FaWhatsapp,
  FaEnvelope,
  // --- Skill Icons ---
  FaCode, // Full-Stack
  FaPalette, // UI/UX
  FaVial, // QA
  FaDatabase, // DB
  FaFilm, // Motion Graphics
  FaShieldAlt, // Cybersecurity
  FaCloud, // Cloud
  FaMobileAlt, // Mobile Dev
  FaLayerGroup, // Generic Fallback
  // --- Specific Tech Icons ---
  FaReact,
  FaNodeJs,
  FaPython,
  FaJsSquare,
  FaHtml5,
  FaCss3Alt,
  FaFigma,
  FaDocker,
  FaAws,
  FaUserPlus,
  // --- NEW ICONS FOR ORG CARD ---
  FaBuilding,
  FaBriefcase,
  FaUsers,
  // --- NEW ICONS FOR MANAGER DASH ---
  FaBullhorn,
  FaEye,
} from 'react-icons/fa';
import { SiMinutemailer } from 'react-icons/si';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Loader from '@/components/ui/loader'; // <-- Make sure to import your Loader

// --- Types ---
// FIX: Defined a comprehensive UserProfile type to resolve property errors.
interface UserProfile {
  uid: string;
  userType: 'youth' | 'manager';
  fullName?: string;
  profilePictureUrl?: string;
  organizationName?: string;
  organizationLogoUrl?: string;
  industry?: string;
  teamSize?: string;
  location?: string;
  organizationSocialLinks?: {
    website?: string;
    linkedin?: string;
  };
  oivpStatus?: {
    tier0?: 'verified' | 'pending' | 'unverified' | 'locked';
    tier1?: 'verified' | 'pending' | 'unverified' | 'locked';
    tier2?: 'verified' | 'pending' | 'unverified' | 'locked';
  };
  following?: string[];
  followers?: string[];
  jobsPostedCount?: number;
  profileViews?: number;
  createdAt?: Timestamp; // From firestore
  // Youth specific
  primarySkill?: string;
  selectedSkills?: string[];
  projectsCount?: number;
  endorsementsCount?: number;
  githubUrl?: string;
  linkedinUrl?: string;
  whatsappNumber?: string;
}

interface ChatParticipant {
  uid: string;
  fullName?: string;
  profilePictureUrl?: string;
  organizationName?: string; // Add this for managers
  organizationLogoUrl?: string; // Add this for managers
  userType: 'youth' | 'manager'; // Add this to know what to display
  oivpStatus?: { // <-- ADD THIS OIVP STATUS
    tier0?: 'verified' | 'pending' | 'unverified';
    tier1?: 'verified' | 'pending' | 'unverified';
    tier2?: 'verified' | 'pending' | 'unverified';
  };
}
interface DashboardChat {
  chatId: string;
  otherParticipant: ChatParticipant;
  lastMessage: {
    text: string;
    timestamp: Date | null; // Changed from Timestamp to handle processed dates
  };
  unreadCount: number;
}

// --- HELPER: Map skill names to Icons AND Colors ---

const skillMap: { [key: string]: { icon: React.ReactNode; color: string } } = {
  'full-stack development': { icon: <FaCode />, color: 'text-blue-400' },
  'ui/ux design': { icon: <FaPalette />, color: 'text-pink-400' },
  'software testing and qa': { icon: <FaVial />, color: 'text-emerald-400' },
  'database management': { icon: <FaDatabase />, color: 'text-amber-400' },
  'motion graphics': { icon: <FaFilm />, color: 'text-red-400' },
  cybersecurity: { icon: <FaShieldAlt />, color: 'text-cyan-400' },
  'cloud architecture': { icon: <FaCloud />, color: 'text-sky-400' },
  'mobile development': { icon: <FaMobileAlt />, color: 'text-indigo-400' },
  react: { icon: <FaReact />, color: 'text-sky-300' },
  'node.js': { icon: <FaNodeJs />, color: 'text-green-400' },
  python: { icon: <FaPython />, color: 'text-yellow-400' },
  javascript: { icon: <FaJsSquare />, color: 'text-yellow-300' },
  html5: { icon: <FaHtml5 />, color: 'text-orange-400' },
  css3: { icon: <FaCss3Alt />, color: 'text-blue-300' },
  figma: { icon: <FaFigma />, color: 'text-purple-400' },
  docker: { icon: <FaDocker />, color: 'text-blue-500' },
  aws: { icon: <FaAws />, color: 'text-orange-500' },
};

const techSkillSet = new Set(Object.keys(skillMap));

const skillDropdownList = Object.keys(skillMap);

const getSkillData = (skillName: string) => {
  const normalizedSkill = skillName.toLowerCase().trim();
  return (
    skillMap[normalizedSkill] || {
      icon: <FaLayerGroup />,
      color: 'text-slate-400',
    }
  );
};

// --- HELPER: Format Follower Count ---
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

const truncateText = (text: string, maxLength: number) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

const toDate = (timestamp: any): Date | null => {
  if (!timestamp) {
    return null;
  }
  // Firestore Timestamp object
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  // Already a JS Date object
  if (timestamp instanceof Date) {
    return timestamp;
  }
  // Plain object from serialization
  if (
    typeof timestamp === 'object' &&
    timestamp !== null &&
    typeof timestamp.seconds === 'number'
  ) {
    return new Date(timestamp.seconds * 1000);
  }
  console.warn('Unsupported timestamp format:', timestamp);
  return null;
};

// --- HELPER & SKELETON COMPONENTS ---

// --- MODIFIED: Professional Snapshot Stat Row ---
const SnapshotStat = ({
  icon,
  label,
  value,
  iconColor,
}: {
  // Fix: The `icon` prop type is changed to `React.ReactElement<any>` to allow `React.cloneElement` to add a `className` without causing a TypeScript error.
  icon: React.ReactElement<any>;
  label: string;
  value: string | number;
  iconColor: string;
}) => (
  <div className="flex items-center gap-4">
    <div
      className={`flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-slate-800 ${iconColor}`}
    >
      {React.cloneElement(icon, { className: 'h-5 w-5' })}
    </div>
    <div className="flex-1">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  </div>
);

// --- MODIFIED: Status Tier Row for better alignment and professionalism ---
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
  const currentStatus = status || 'unverified'; // Default to unverified/locked
  const isLocked =
    currentStatus === 'locked' || currentStatus === 'unverified';

  return (
    <div className="flex items-center gap-4">
      <div className="text-2xl text-slate-400 flex-shrink-0">{icon}</div>
      <div className="flex-1">
        <p className="font-semibold text-white">{title}</p>
        <div className="flex items-center gap-1.5">
          <span className={`text-sm ${statusConfig[currentStatus].color}`}>
            {statusConfig[currentStatus].text}
          </span>
          {isLocked && (
            <Link
              href={href}
              className="text-xs text-blue-400 hover:underline ml-1"
            >
              ( {actionText} )
            </Link>
          )}
        </div>
      </div>
      <div className="text-xl ml-auto flex-shrink-0">
        {statusConfig[currentStatus].icon}
      </div>
    </div>
  );
};

const ProfileCardSkeleton = () => (
  <div className="flex-shrink-0 w-80 p-4 flex flex-col items-start gap-4 animate-pulse bg-slate-800 rounded-lg">
    <div className="flex items-center gap-4 w-full">
      <div className="h-14 w-14 rounded-full bg-slate-700"></div>
      <div className="flex-1 space-y-2">
        <div className="h-5 w-3/4 rounded bg-slate-700"></div>
      </div>
    </div>
    <div className="space-y-3 w-full">
      <div className="h-4 w-1/2 rounded bg-slate-700"></div>
      <div className="h-4 w-1/3 rounded bg-slate-700"></div>
    </div>
    <div className="mt-auto w-full h-10 rounded bg-slate-700"></div>
  </div>
);

// --- New Messages Component ---
// UPDATED to handle both youth and manager avatars/names
const RecentMessagesCard = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState<DashboardChat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const chatsDataPromises = snapshot.docs.map(async (chatDoc) => {
          const data = chatDoc.data();
          const otherUserId = data.participants.find(
            (p: string) => p !== user.uid
          );

          if (!otherUserId) return null;

          const userDoc = await getDoc(doc(db, 'users', otherUserId));
          if (!userDoc.exists()) return null;

          // Now correctly typed as ChatParticipant
          const otherParticipant = userDoc.data() as ChatParticipant;
          const unreadCount = data.unreadCount?.[user.uid] || 0;
          const lastMessageTimestamp = toDate(data.lastMessage?.timestamp);

          return {
            chatId: chatDoc.id,
            otherParticipant: {
              uid: otherUserId,
              fullName: otherParticipant.fullName,
              profilePictureUrl: otherParticipant.profilePictureUrl,
              organizationName: otherParticipant.organizationName,
              organizationLogoUrl: otherParticipant.organizationLogoUrl,
              userType: otherParticipant.userType,
              oivpStatus: otherParticipant.oivpStatus, // <-- PASS THE STATUS
            },
            lastMessage: {
              text: data.lastMessage?.text || '...',
              timestamp: lastMessageTimestamp,
            },
            unreadCount: unreadCount,
          };
        });

        const resolvedChats = (await Promise.all(chatsDataPromises)).filter(
          (c) => c !== null
        ) as DashboardChat[];

        setChats(resolvedChats);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching recent chats: ', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const MessageItemSkeleton = () => (
    <div className="flex items-center gap-3 p-2 animate-pulse">
      <div className="h-10 w-10 rounded-full bg-slate-700 flex-shrink-0"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded bg-slate-700"></div>
        <div className="h-3 w-1/2 rounded bg-slate-700"></div>
      </div>
    </div>
  );

  return (
    <Card className="bg-transparent border-slate-800">
      <CardHeader>
        <CardTitle className="text-xl text-white">Messages</CardTitle>
        <CardDescription className="text-slate-400">
          Your most recent conversations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <MessageItemSkeleton key={i} />
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <FaEnvelope className="mx-auto h-8 w-8 mb-2" />
            <p>No recent messages.</p>
          </div>
        ) : (
          <ScrollArea className="h-[220px] pr-3 -mr-3">
            <div className="space-y-1">
              {chats.map((chat) => {
                const messageTimestamp = chat.lastMessage?.timestamp;
                const isRecent =
                  messageTimestamp &&
                  new Date().getTime() - messageTimestamp.getTime() <
                    2 * 60 * 60 * 1000;
                const showNotification = chat.unreadCount > 0 && isRecent;

                // --- LOGIC for name, avatar, and verification ---
                const isManager =
                  chat.otherParticipant.userType === 'manager';
                const isVerified = 
                  chat.otherParticipant.oivpStatus?.tier0 === 'verified';
                  
                const displayName = isManager
                  ? chat.otherParticipant.organizationName || 'Organization'
                  : chat.otherParticipant.fullName || 'User';
                const displayAvatar = isManager
                  ? chat.otherParticipant.organizationLogoUrl
                  : chat.otherParticipant.profilePictureUrl;
                const displayFallback = displayName.charAt(0) || 'U';
                const avatarClass = isManager
                  ? 'rounded-md'
                  : 'rounded-full';
                const avatarImgClass = isManager ? 'object-contain p-1' : 'object-cover';

                return (
                  <div
                    key={chat.chatId}
                    onClick={() =>
                      router.push(`/chat/${chat.otherParticipant.uid}`)
                    }
                    className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-800"
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className={`h-10 w-10 ${avatarClass}`}>
                        <AvatarImage
                          src={displayAvatar}
                          alt={displayName}
                          className={avatarImgClass}
                        />
                        <AvatarFallback className={avatarClass}>
                          {displayFallback}
                        </AvatarFallback>
                      </Avatar>
                      {showNotification && (
                        <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-slate-900" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <p
                            className={`font-semibold truncate ${
                              chat.unreadCount > 0
                                ? 'text-white'
                                : 'text-slate-300'
                            }`}
                          >
                            {displayName}
                          </p>
                          {/* --- THIS IS THE NEW BADGE --- */}
                          {isManager && !isVerified && (
                            <span 
                              title="Not Verified"
                              className="flex items-center gap-1 text-xs bg-yellow-900/50 text-yellow-400 px-1.5 py-0.5 rounded-sm"
                            >
                              <FaTimesCircle /> Not Verified
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 flex-shrink-0 ml-2">
                          {messageTimestamp
                            ? formatDistanceToNow(messageTimestamp, {
                                addSuffix: true,
                              })
                            : ''}
                        </p>
                      </div>
                      <p
                        className={`text-sm truncate ${
                          chat.unreadCount > 0
                            ? 'text-slate-200'
                            : 'text-slate-400'
                        }`}
                      >
                        {truncateText(chat.lastMessage?.text || '...', 35)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

// --- NEW PROFESSIONAL ORGANISATION CARD COMPONENT ---
// This is designed to match the Talent Card's size and professionalism
const OrganisationCard = ({
  manager,
  isFollowing,
  onFollow,
  index = 0,
}: {
  manager: UserProfile;
  isFollowing: boolean;
  onFollow: () => void;
  index?: number;
}) => {
  const getSparkleClass = (index: number) => {
    const variations = ['', 'variation-1', 'variation-2'];
    return variations[index % variations.length];
  };

  const isVerified = manager.oivpStatus?.tier0 === 'verified';
  const displayIndustry = manager.industry || 'Industry not specified';
  const teamSize = manager.teamSize || '1-10'; // Default value
  const jobsPosted = manager.jobsPostedCount ?? 0; // Default value

  return (
    <div
      key={manager.uid}
      className={`sparkle-corner ${getSparkleClass(
        index
      )} flex-shrink-0 w-80 flex flex-col p-4 bg-slate-900 border border-slate-700/50 rounded-lg shadow-lg hover:shadow-blue-500/10 transition-shadow duration-300`}
    >
      <div className="flex items-start gap-4 mb-4">
        {/* Use rounded-md for logos */}
        <Avatar className="h-14 w-14 rounded-md border-2 border-slate-700 flex-shrink-0">
          <AvatarImage
            src={manager.organizationLogoUrl}
            alt={manager.organizationName || 'Organization logo'}
            className="object-contain p-1" // Use contain for logos
          />
          <AvatarFallback className="rounded-md">
            {manager.organizationName ? manager.organizationName.charAt(0) : 'O'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center gap-2">
            <p className="font-bold text-lg text-white truncate">
              {manager.organizationName || 'Organization'}
            </p>
            <span title={isVerified ? 'Verified' : 'Not Verified'}>
              {isVerified ? (
                <FaCheckCircle className="h-4 w-4 text-blue-500" />
              ) : (
                <FaTimesCircle className="h-4 w-4 text-slate-500" />
              )}
            </span>
          </div>
          <p className="text-sm text-slate-400 truncate">{displayIndustry}</p>
        </div>
      </div>

      {/* Stats Row (like Talent Card) */}
      <div className="flex items-center justify-between text-sm text-slate-400 mb-3">
        <div className="flex items-center gap-1.5" title="Jobs Posted">
          <FaBriefcase className="h-3.5 w-3.5 text-blue-400" />
          <span className="font-medium">{jobsPosted} Jobs Posted</span>
        </div>
        <div className="flex items-center gap-1.5" title="Team Size">
          <FaUsers className="h-3.5 w-3.5 text-green-400" />
          <span className="font-medium">{teamSize}</span>
        </div>
      </div>

      {/* Location Row (replaces skill icons) */}
      <div className="mb-6 min-h-[28px]">
        {manager.location && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center bg-slate-800 text-slate-400 text-xs font-medium px-2.5 py-1 rounded-full">
              <FaMapMarkerAlt className="mr-1.5 h-3 w-3" />
              {manager.location}
            </span>
          </div>
        )}
      </div>

      {/* Social Links (right-aligned like Talent Card) */}
      <div className="flex items-center justify-end text-sm text-slate-400 mb-3 gap-3 min-h-[20px]">
        {manager.organizationSocialLinks?.website && (
          <a
            href={manager.organizationSocialLinks.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Website"
          >
            <FaLink className="h-5 w-5" />
          </a>
        )}
        {manager.organizationSocialLinks?.linkedin && (
          <a
            href={manager.organizationSocialLinks.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-400 transition-colors"
            aria-label="LinkedIn"
          >
            <FaLinkedin className="h-5 w-5" />
          </a>
        )}
      </div>

      {/* Footer Buttons (like Talent Card) */}
      <div className="mt-auto pt-4 flex items-center justify-between">
        <div className="sparkle-button-container">
          <Link href={`/organization/${manager.uid}`}>
            <Button
              variant="outline"
              size="sm"
              className="bg-slate-900 border-transparent text-blue-400 hover:bg-slate-800/80 hover:text-blue-300 transition-all"
            >
              View Profile
            </Button>
          </Link>
        </div>
        <div className="sparkle-button-container">
          <Button
            variant={isFollowing ? 'secondary' : 'default'}
            size="sm"
            className="text-xs px-3"
            onClick={onFollow}
          >
            <FaUserPlus className="mr-1.5 h-3 w-3" />
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// --- NEW TALENT PROFILE CARD COMPONENT ---
// This is used in both Youth and Manager dashboards for consistency
const TalentProfileCard = ({
  talent,
  isFollowing,
  onFollow,
  index = 0,
}: {
  talent: UserProfile;
  isFollowing: boolean;
  onFollow: (targetId: string) => void;
  index?: number;
}) => {
  const getSparkleClass = (index: number) => {
    const variations = ['', 'variation-1', 'variation-2'];
    return variations[index % variations.length];
  };

  const isVerified = talent.oivpStatus?.tier0 === 'verified';
  const displaySkill =
    talent.primarySkill || talent.selectedSkills?.[0] || 'Skill not listed';

  return (
    <div
      key={talent.uid}
      className={`sparkle-corner ${getSparkleClass(
        index
      )} flex-shrink-0 w-80 flex flex-col p-4 bg-slate-900 border border-slate-700/50 rounded-lg shadow-lg hover:shadow-blue-500/10 transition-shadow duration-300`}
    >
      <div className="flex items-start gap-4 mb-4">
        <Avatar className="h-14 w-14 border-2 border-slate-700 flex-shrink-0">
          <AvatarImage
            src={talent.profilePictureUrl}
            alt={talent.fullName || 'User avatar'}
            className="object-cover"
          />
          <AvatarFallback>
            {talent.fullName ? talent.fullName.charAt(0) : 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center gap-2">
            <p className="font-bold text-lg text-white truncate">
              {talent.fullName?.split(' ')[0] || 'User'}
            </p>
            <span title={isVerified ? 'Verified' : 'Not Verified'}>
              {isVerified ? (
                <FaCheckCircle className="h-4 w-4 text-blue-500" />
              ) : (
                <FaTimesCircle className="h-4 w-4 text-red-500" />
              )}
            </span>
          </div>
          <p className="text-sm text-slate-400 truncate">{displaySkill}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-400 mb-3">
        <div className="flex items-center gap-1.5">
          <FaProjectDiagram className="h-3.5 w-3.5 text-blue-400" />
          <span className="font-medium">
            {talent.projectsCount ?? 0} Projects
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <FaUserPlus className="h-3.5 w-3.5 text-green-400" />
          <span className="font-medium">
            {formatFollowerCount(talent.followers?.length ?? 0)}
          </span>
        </div>
      </div>

      <div className="mb-6 min-h-[28px]">
        <div className="flex flex-wrap items-center gap-2">
          {talent.selectedSkills && talent.selectedSkills.length > 0 ? (
            talent.selectedSkills
              .slice(0, 5)
              .map((skill: string, idx: number) => {
                const { icon, color } = getSkillData(skill);
                return (
                  <div
                    key={idx}
                    title={skill}
                    className={`flex items-center justify-center h-7 w-7 bg-slate-800/80 rounded-full ${color} text-base transition-transform hover:scale-110`}
                  >
                    {icon}
                  </div>
                );
              })
          ) : (
            <span className="bg-slate-800 text-slate-500 text-xs font-medium px-2.5 py-1 rounded-full">
              No skills added
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end text-sm text-slate-400 mb-3 gap-3">
        {talent.githubUrl && (
          <a
            href={talent.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="GitHub"
          >
            <FaGithub className="h-5 w-5" />
          </a>
        )}
        {talent.linkedinUrl && (
          <a
            href={talent.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-400 transition-colors"
            aria-label="LinkedIn"
          >
            <FaLinkedin className="h-5 w-5" />
          </a>
        )}
        {talent.whatsappNumber && (
          <a
            href={`https://wa.me/${talent.whatsappNumber.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-500 hover:text-green-400 transition-colors"
            aria-label="WhatsApp"
          >
            <FaWhatsapp className="h-5 w-5" />
          </a>
        )}
      </div>

      <div className="mt-auto pt-4 flex items-center justify-between">
        <div className="sparkle-button-container">
          <Link href={`/profile/${talent.uid}`}>
            <Button
              variant="outline"
              size="sm"
              className="bg-slate-900 border-transparent text-blue-400 hover:bg-slate-800/80 hover:text-blue-300 transition-all"
            >
              View Profile
            </Button>
          </Link>
        </div>
        <div className="sparkle-button-container">
          <Button
            variant={isFollowing ? 'secondary' : 'default'}
            size="sm"
            className="text-xs px-3"
            onClick={() => onFollow(talent.uid)}
          >
            <FaUserPlus className="mr-1.5 h-3 w-3" />
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
        </div>
      </div>
    </div>
  );
};


const FooterLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <Link
    href={href}
    className="text-slate-400 hover:text-blue-400 transition-colors duration-200 text-sm"
  >
    {children}
  </Link>
);

const Footer = () => {
  return (
    <footer className="bg-slate-900/50 border-t border-slate-800 py-16 px-6 sm:px-8">
      <div className="container mx-auto">
        {/* MODIFIED: Changed to lg:grid-cols-6 to make space for the new contact column */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-10">
          <div className="sm:col-span-2 lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <SiMinutemailer className="h-7 w-7 text-blue-500" />
              <h3 className="text-lg font-bold text-white">
                Salone Skills Connect
              </h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Building a trusted skills economy for Sierra Leone's youth by
              verifying talent and creating opportunities.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-white tracking-wider uppercase text-sm">
              Quick Links
            </h4>
            <div className="flex flex-col space-y-2">
              {/* Fix: Added children to FooterLink components to provide link text and resolve missing property errors. */}
              <FooterLink href="/talent">Find Talent</FooterLink>
              <FooterLink href="/jobs">Find Work</FooterLink>
              <FooterLink href="/about">About Us</FooterLink>
              <FooterLink href="/blog">Blog</FooterLink>
              <FooterLink href="/how-it-works">How It Works</FooterLink>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-white tracking-wider uppercase text-sm">
              Explore
            </h4>
            <div className="flex flex-col space-y-2">
              {/* Fix: Added children to FooterLink components to provide link text and resolve missing property errors. */}
              <FooterLink href="/portfolios">Browse Portfolios</FooterLink>
              <FooterLink href="/success-stories">Success Stories</FooterLink>
              <FooterLink href="/sell-ideas">Sell Your Ideas</FooterLink>
              <FooterLink href="/mentorship">Mentorship</FooterLink>
              <FooterLink href="/events">Events & Workshops</FooterLink>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-white tracking-wider uppercase text-sm">
              Resources
            </h4>
            <div className="flex flex-col space-y-2">
              {/* Fix: Added children to FooterLink components to provide link text and resolve missing property errors. */}
              <FooterLink href="/community">Community Forum</FooterLink>
              <FooterLink href="/resume-builder">Resume Builder</FooterLink>
              <FooterLink href="/support">Support / FAQ</FooterLink>
              <FooterLink href="/terms">Terms of Service</FooterLink>
              <FooterLink href="/privacy">Privacy Policy</FooterLink>
            </div>
          </div>

          {/* --- NEW: Contact Us Column --- */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white tracking-wider uppercase text-sm">
              Get in Touch
            </h4>
            <div className="flex flex-col space-y-3">
              <div className="flex items-start gap-3">
                <FaMapMarkerAlt className="h-4 w-4 text-slate-400 mt-1 flex-shrink-0" />
                <p className="text-sm text-slate-400 leading-relaxed">
                  Freetown, Sierra Leone
                </p>
              </div>

              <div className="flex items-center gap-3">
                <FaWhatsapp className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <a
                  href="https://wa.me/23299761998"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-400 hover:text-blue-400 transition-colors duration-200"
                >
                  +232 99761998
                </a>
              </div>

              <div className="flex items-center gap-3">
                <FaEnvelope className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <a
                  href="mailto:info@saloneskills.sl"
                  className="text-sm text-slate-400 hover:text-blue-400 transition-colors duration-200"
                >
                  info@saloneskills.sl
                </a>
              </div>

              <div className="flex items-center gap-3">
                <FaEnvelope className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <a
                  href="mailto:support@saloneskills.sl"
                  className="text-sm text-slate-400 hover:text-blue-400 transition-colors duration-200"
                >
                  support@saloneskills.sl
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-12 border-t border-slate-800 pt-8">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Salone Skills Connect. All Rights
            Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

// ######################################################################
// ### 1. YOUR OLD COMPONENT, RENAMED TO `YouthDashboard`             ###
// ######################################################################

function YouthDashboard() {
  const { user, userProfile } = useAuth();
  const [talentList, setTalentList] = useState<UserProfile[]>([]);
  const [managerList, setManagerList] = useState<UserProfile[]>([]);
  const [isListLoading, setIsListLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<'all' | 'skill' | 'person'>(
    'all'
  );
  const [followingStatus, setFollowingStatus] = useState<{
    [key: string]: boolean;
  }>({});
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [showTechSkills, setShowTechSkills] = useState(true);

  useEffect(() => {
    if (userProfile && userProfile.following) {
      const initialStatus: { [key: string]: boolean } = {};
      userProfile.following.forEach((followedId: string) => {
        initialStatus[followedId] = true;
      });
      setFollowingStatus(initialStatus);
    }
  }, [userProfile]);

  useEffect(() => {
    if (!user) return;
    const fetchLists = async () => {
      setIsListLoading(true);
      try {
        const totalYouthUsersQuery = query(
          collection(db, 'users'),
          where('userType', '==', 'youth'),
          where('uid', '!=', user.uid)
        );
        const totalYouthSnapshot = await getDocs(totalYouthUsersQuery);
        const totalYouthCount = totalYouthSnapshot.size;

        const talentLimit = 8;

        let randomStartPoint = 0;
        if (totalYouthCount > talentLimit) {
          randomStartPoint = Math.floor(
            Math.random() * (totalYouthCount - talentLimit)
          );
        }
        const baseTalentQuery = query(
          collection(db, 'users'),
          where('userType', '==', 'youth'),
          where('uid', '!=', user.uid),
          orderBy('createdAt', 'desc')
        );
        let startAfterDoc = null;
        if (randomStartPoint > 0) {
          const skipQuery = query(baseTalentQuery, limit(randomStartPoint));
          const skipSnapshot = await getDocs(skipQuery);
          if (!skipSnapshot.empty) {
            startAfterDoc = skipSnapshot.docs[skipSnapshot.docs.length - 1];
          }
        }
        let talentQuery;
        if (startAfterDoc) {
          talentQuery = query(
            baseTalentQuery,
            startAfter(startAfterDoc),
            limit(talentLimit)
          );
        } else {
          talentQuery = query(baseTalentQuery, limit(talentLimit));
        }
        const talentSnapshot = await getDocs(talentQuery);
        let fetchedTalent = talentSnapshot.docs.map(
          (doc) => doc.data() as UserProfile
        );
        if (
          fetchedTalent.length < talentLimit &&
          totalYouthCount >= talentLimit
        ) {
          const remaining = talentLimit - fetchedTalent.length;
          const fillQuery = query(
            collection(db, 'users'),
            where('userType', '==', 'youth'),
            where('uid', '!=', user.uid),
            orderBy('createdAt', 'desc'),
            limit(remaining)
          );
          const fillSnapshot = await getDocs(fillQuery);
          const fillTalent = fillSnapshot.docs
            .map((doc) => doc.data() as UserProfile)
            .filter((ft) => !fetchedTalent.some((et) => et.uid === ft.uid));
          fetchedTalent = [...fetchedTalent, ...fillTalent].slice(
            0,
            talentLimit
          );
        }
        setTalentList(fetchedTalent);

        // Fetch managers (increased to 8 to match talent row)
        const managerQuery = query(
          collection(db, 'users'),
          where('userType', '==', 'manager'),
          limit(8)
        );
        const managerSnapshot = await getDocs(managerQuery);
        setManagerList(
          managerSnapshot.docs.map((doc) => doc.data() as UserProfile)
        );
      } catch (error) {
        console.error('Failed to fetch user lists:', error);
      } finally {
        setIsListLoading(false);
      }
    };
    fetchLists();
  }, [user]);

  const handleFollow = async (targetUserId: string) => {
    if (!user?.uid) return;

    const currentUserId = user.uid;
    const currentUserRef = doc(db, 'users', user.uid);
    const targetUserRef = doc(db, 'users', targetUserId);
    const isCurrentlyFollowing = followingStatus[targetUserId] || false;

    setFollowingStatus((prev) => ({
      ...prev,
      [targetUserId]: !isCurrentlyFollowing,
    }));

    // Optimistic UI update for Talent List
    setTalentList((prevList) =>
      prevList.map((talent) => {
        if (talent.uid === targetUserId) {
          const currentFollowersArray = talent.followers || [];
          let newFollowersArray;

          if (isCurrentlyFollowing) {
            newFollowersArray = currentFollowersArray.filter(
              (uid: string) => uid !== currentUserId
            );
          } else {
            newFollowersArray = [...currentFollowersArray, currentUserId];
          }

          return {
            ...talent,
            followers: newFollowersArray,
          };
        }
        return talent;
      })
    );
    
    // Optimistic UI update for Manager List
    setManagerList((prevList) =>
      prevList.map((manager) => {
        if (manager.uid === targetUserId) {
          const currentFollowersArray = manager.followers || [];
          let newFollowersArray;

          if (isCurrentlyFollowing) {
            newFollowersArray = currentFollowersArray.filter(
              (uid: string) => uid !== currentUserId
            );
          } else {
            newFollowersArray = [...currentFollowersArray, currentUserId];
          }

          return {
            ...manager,
            followers: newFollowersArray,
          };
        }
        return manager;
      })
    );


    try {
      const batch = writeBatch(db);
      if (isCurrentlyFollowing) {
        batch.update(currentUserRef, { following: arrayRemove(targetUserId) });
        batch.update(targetUserRef, { followers: arrayRemove(currentUserId) });
      } else {
        batch.update(currentUserRef, { following: arrayUnion(targetUserId) });
        batch.update(targetUserRef, { followers: arrayUnion(currentUserId) });
      }
      await batch.commit();
    } catch (error) {
      console.error('Failed to update follow status:', error);

      // Rollback UI on error
      setFollowingStatus((prev) => ({
        ...prev,
        [targetUserId]: isCurrentlyFollowing,
      }));

      // Rollback Talent List
      setTalentList((prevList) =>
        prevList.map((talent) => {
          if (talent.uid === targetUserId) {
            const currentFollowersArray = talent.followers || [];
            let revertedFollowersArray;

            if (isCurrentlyFollowing) {
              revertedFollowersArray = [...currentFollowersArray, currentUserId];
            } else {
              revertedFollowersArray = currentFollowersArray.filter(
                (uid: string) => uid !== currentUserId
              );
            }

            return { ...talent, followers: revertedFollowersArray };
          }
          return talent;
        })
      );
      
      // Rollback Manager List
      setManagerList((prevList) =>
        prevList.map((manager) => {
          if (manager.uid === targetUserId) {
            const currentFollowersArray = manager.followers || [];
            let revertedFollowersArray;

            if (isCurrentlyFollowing) {
              revertedFollowersArray = [...currentFollowersArray, currentUserId];
            } else {
              revertedFollowersArray = currentFollowersArray.filter(
                (uid: string) => uid !== currentUserId
              );
            }

            return { ...manager, followers: revertedFollowersArray };
          }
          return manager;
        })
      );
    }
  };

  const getSearchPlaceholder = () => {
    if (searchFilter === 'skill')
      return 'Search by skill (e.g., React, UI/UX Design)';
    if (searchFilter === 'person')
      return 'Search by person name (e.g., John Doe)';
    return 'Search for talent, organizations...';
  };

  const handleSkillSelect = (skillName: string) => {
    setSearchFilter('skill');
    setSearchQuery(skillName);
  };

  const filteredTalent = talentList.filter((talent) => {
    // --- Toggle Filter 1: Verification Status ---
    if (showVerifiedOnly && talent.oivpStatus?.tier0 !== 'verified') {
      return false;
    }

    // --- Toggle Filter 2: Skill Type ---
    const hasSkills = talent.selectedSkills && talent.selectedSkills.length > 0;
    if (hasSkills) {
      if (showTechSkills) {
        const hasTechSkill = talent.selectedSkills!.some((skill) =>
          techSkillSet.has(skill.toLowerCase().trim())
        );
        if (!hasTechSkill) return false;
      } else {
        const hasOtherSkill = talent.selectedSkills!.some(
          (skill) => !techSkillSet.has(skill.toLowerCase().trim())
        );
        if (!hasOtherSkill) return false;
      }
    } else {
      // User has no skills, hide them if any skill filter is on
      return false;
    }

    // --- Search Filter Logic ---
    if (searchQuery.trim() !== '') {
      const queryLower = searchQuery.toLowerCase();

      if (searchFilter === 'person') {
        return talent.fullName?.toLowerCase().includes(queryLower) ?? false;
      }

      if (searchFilter === 'skill') {
        return (
          talent.selectedSkills?.some((skill) =>
            skill.toLowerCase().includes(queryLower)
          ) ?? false
        );
      }

      if (searchFilter === 'all') {
        const nameMatch =
          talent.fullName?.toLowerCase().includes(queryLower) ?? false;
        const skillMatch =
          talent.selectedSkills?.some((skill) =>
            skill.toLowerCase().includes(queryLower)
          ) ?? false;
        return nameMatch || skillMatch;
      }
    }

    // If no filters hide the user, show them
    return true;
  });

  return (
    <div className="bg-slate-950">
      <div className="min-h-screen w-full text-white p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back,{' '}
              <span className="text-white">
                {userProfile?.fullName?.split(' ')[0] ||
                  user?.displayName ||
                  'User'}
              </span>
              !
            </h1>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-full">
              <FaUserPlus className="h-4 w-4 text-green-400" />
              <span className="font-semibold text-sm text-white">
                {formatFollowerCount(userProfile?.followers?.length ?? 0)}
              </span>
              <span className="text-sm text-slate-400">Followers</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8 lg:order-first">
            {/* --- MODIFIED SEARCH AREA --- */}
            <div className="space-y-4">
              {/* 1. Input + Dropdown on one line */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder={getSearchPlaceholder()}
                    className="bg-slate-800 border-slate-700 pl-10 pr-4 py-2 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* --- SKILL DROPDOWN (MOVED) --- */}
                <Select
                  onValueChange={handleSkillSelect}
                  value={searchFilter === 'skill' ? searchQuery : ''}
                >
                  <SelectTrigger className="w-full sm:w-[240px] bg-slate-800 border-slate-700 text-slate-300">
                    <SelectValue placeholder="Quick-select a skill..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    {skillDropdownList.map((skill) => (
                      <SelectItem
                        key={skill}
                        value={skill}
                        className="capitalize hover:bg-slate-700"
                      >
                        {skill}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 2. Filter sections (All/Skills/Person) */}
              <div className="flex items-center gap-4 pt-2">
                <span className="text-sm text-slate-400 my-auto">
                  Filter by:
                </span>
                <div className="flex gap-2 text-sm">
                  <Button
                    type="button"
                    onClick={() => setSearchFilter('all')}
                    className={`flex-1 sm:flex-none ${
                      searchFilter === 'all'
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-slate-700 hover:bg-slate-600'
                    } text-white`}
                  >
                    All
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setSearchFilter('skill')}
                    className={`flex-1 sm:flex-none ${
                      searchFilter === 'skill'
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-slate-700 hover:bg-slate-600'
                    } text-white`}
                  >
                    <FaTools className="mr-2" /> Skills
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setSearchFilter('person')}
                    className={`flex-1 sm:flex-none ${
                      searchFilter === 'person'
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-slate-700 hover:bg-slate-600'
                    } text-white`}
                  >
                    <FaUser className="mr-2" /> Person
                  </Button>
                </div>
              </div>
            </div>
            {/* --- END MODIFIED SEARCH AREA --- */}

            <Card className="bg-transparent border-slate-800">
              <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <CardTitle className="text-white">Featured Talent</CardTitle>

                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
                  {/* Tech/Other Skills Toggle */}
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="skills-toggle"
                      className={`text-sm font-medium transition-colors ${
                        showTechSkills ? 'text-blue-400' : 'text-slate-500'
                      }`}
                    >
                      Tech Skills
                    </Label>
                    <Switch
                      id="skills-toggle"
                      checked={showTechSkills}
                      onCheckedChange={setShowTechSkills}
                    />
                    <Label
                      htmlFor="skills-toggle"
                      className={`text-sm font-medium transition-colors ${
                        showTechSkills ? 'text-slate-500' : 'text-white'
                      }`}
                    >
                      Other Skills
                    </Label>
                  </div>

                  {/* Verified Toggle */}
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="verified-toggle"
                      className={`text-sm font-medium transition-colors ${
                        showVerifiedOnly ? 'text-slate-500' : 'text-white'
                      }`}
                    >
                      All Talent
                    </Label>
                    <Switch
                      id="verified-toggle"
                      checked={showVerifiedOnly}
                      onCheckedChange={setShowVerifiedOnly}
                    />
                    <Label
                      htmlFor="verified-toggle"
                      className={`text-sm font-medium transition-colors ${
                        showVerifiedOnly ? 'text-blue-400' : 'text-slate-500'
                      }`}
                    >
                      Verified Only
                    </Label>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="relative overflow-x-auto pt-6">
                {isListLoading ? (
                  <div className="flex flex-row gap-6 pb-4">
                    {[...Array(8)].map((_, i) => (
                      <ProfileCardSkeleton key={i} />
                    ))}
                  </div>
                ) : filteredTalent.length > 0 ? (
                  <div className="flex flex-row gap-6 pb-4">
                    {filteredTalent.map((talent, index) => (
                      <TalentProfileCard
                        key={talent.uid}
                        talent={talent}
                        isFollowing={followingStatus[talent.uid]}
                        onFollow={handleFollow}
                        index={index}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-400 py-4">
                    No talent to show for the selected filters.
                  </p>
                )}
              </CardContent>
              <CardFooter>
                <Link href="/talent" className="w-full">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-blue-400"
                  >
                    View All Talent <FaArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* --- MODIFIED: ORGANIZATIONS SECTION --- */}
            {/* This now uses the new <OrganisationCard /> component */}
            <Card className="bg-transparent border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">
                  Organizations on SkillsLink
                </CardTitle>
              </CardHeader>
              <CardContent className="relative overflow-x-auto pt-6">
                {isListLoading ? (
                  <div className="flex flex-row gap-6 pb-4">
                    {[...Array(8)].map((_, i) => (
                      <ProfileCardSkeleton key={i} />
                    ))}
                  </div>
                ) : managerList.length > 0 ? (
                  <div className="flex flex-row gap-6 pb-4">
                    {managerList.map((manager, index) => (
                      <OrganisationCard
                        key={manager.uid}
                        manager={manager}
                        isFollowing={followingStatus[manager.uid]}
                        onFollow={() => handleFollow(manager.uid)}
                        index={index}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-400 py-4">
                    No organizations to show right now.
                  </p>
                )}
              </CardContent>
              <CardFooter>
                <Link href="/organizations" className="w-full">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-blue-400 hover:text-blue-300"
                  >
                    View All Organizations{' '}
                    <FaArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-8">
            <RecentMessagesCard />
            <Card className="bg-transparent border-slate-800">
              <CardHeader>
                <CardTitle className="text-xl">My Verification Status</CardTitle>
                <CardDescription>
                  Complete the tiers to build trust with employers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <StatusTierRow
                  icon={<FaUserCheck />}
                  title="Tier 0: Identity Confirmed"
                  status={userProfile?.oivpStatus?.tier0}
                  actionText="Complete verification"
                  href="/onboarding"
                />
                <StatusTierRow
                  icon={<FaTools />}
                  title="Tier 1: Work Authenticated"
                  status={userProfile?.oivpStatus?.tier1}
                  actionText="Add a project"
                  href="/dashboard/portfolio/add"
                />
                <StatusTierRow
                  icon={<FaStar />}
                  title="Tier 2: Skill Endorsed"
                  status={userProfile?.oivpStatus?.tier2}
                  actionText="Request endorsement"
                  href="/dashboard/portfolio"
                />
              </CardContent>
            </Card>

            {/* --- MODIFIED: "My Portfolio Snapshot" Card --- */}
            {/* This is the new, more professional design you requested */}
            <Card className="bg-transparent border-slate-800">
              <CardHeader>
                <CardTitle>My Portfolio Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <SnapshotStat
                  icon={<FaProjectDiagram />}
                  label="Projects Submitted"
                  value={userProfile?.projectsCount ?? 0}
                  iconColor="text-blue-400"
                />
                <SnapshotStat
                  icon={<FaStar />}
                  label="Endorsements Received"
                  value={userProfile?.endorsementsCount ?? 0}
                  iconColor="text-green-400"
                />
                <SnapshotStat
                  icon={<FaUserPlus />}
                  label="Profile Followers"
                  value={formatFollowerCount(
                    userProfile?.followers?.length ?? 0
                  )}
                  iconColor="text-pink-400"
                />
              </CardContent>
              <CardFooter>
                <Link href="/dashboard/portfolio" className="w-full">
                  <Button
                    variant="outline"
                    className="w-full border-slate-700 hover:bg-slate-800"
                  >
                    Manage My Portfolio
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// ######################################################################
// ### 2. UPDATED `ManagerDashboard` COMPONENT                        ###
// ######################################################################

function ManagerDashboard() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  
  // State for the list of talent the manager is following
  const [followedTalent, setFollowedTalent] = useState<UserProfile[]>([]);
  const [isFollowingListLoading, setIsFollowingListLoading] = useState(true);
  const [followingStatus, setFollowingStatus] = useState<{ [key: string]: boolean }>({});

  // Initialize following status from user profile
  useEffect(() => {
    if (userProfile && userProfile.following) {
      const initialStatus: { [key: string]: boolean } = {};
      userProfile.following.forEach((followedId: string) => {
        initialStatus[followedId] = true;
      });
      setFollowingStatus(initialStatus);
    }
  }, [userProfile]);


  // Fetch the full profiles of the talent being followed
  useEffect(() => {
    const fetchFollowedTalent = async () => {
      if (!userProfile?.following || userProfile.following.length === 0) {
        setFollowedTalent([]);
        setIsFollowingListLoading(false);
        return;
      }

      setIsFollowingListLoading(true);
      try {
        const followedUIDs = userProfile.following;
        const userPromises = followedUIDs.map(uid => getDoc(doc(db, 'users', uid)));
        const userDocs = await Promise.all(userPromises);
        
        const talentProfiles = userDocs
          .filter(doc => doc.exists())
          .map(doc => doc.data() as UserProfile);

        setFollowedTalent(talentProfiles);
      } catch (error) {
        console.error("Failed to fetch followed talent:", error);
      } finally {
        setIsFollowingListLoading(false);
      }
    };

    fetchFollowedTalent();
  }, [userProfile?.following]);

  // Handler for following/unfollowing talent
  const handleFollow = async (targetUserId: string) => {
    if (!user?.uid) return;

    const currentUserId = user.uid;
    const currentUserRef = doc(db, 'users', user.uid);
    const targetUserRef = doc(db, 'users', targetUserId);
    const isCurrentlyFollowing = followingStatus[targetUserId] || false;

    // Optimistic UI update
    setFollowingStatus((prev) => ({
      ...prev,
      [targetUserId]: !isCurrentlyFollowing,
    }));
    
    // If unfollowing, remove them from the displayed list immediately
    if (isCurrentlyFollowing) {
        setFollowedTalent(prev => prev.filter(t => t.uid !== targetUserId));
    }

    try {
      const batch = writeBatch(db);
      if (isCurrentlyFollowing) {
        batch.update(currentUserRef, { following: arrayRemove(targetUserId) });
        batch.update(targetUserRef, { followers: arrayRemove(currentUserId) });
      } else {
        batch.update(currentUserRef, { following: arrayUnion(targetUserId) });
        batch.update(targetUserRef, { followers: arrayUnion(currentUserId) });
        // Note: If they re-follow, the user won't reappear until the next data fetch.
        // This is an acceptable trade-off to avoid re-fetching the user profile here.
      }
      await batch.commit();
    } catch (error) {
      console.error('Failed to update follow status:', error);
      // Rollback UI on error
      setFollowingStatus((prev) => ({
        ...prev,
        [targetUserId]: isCurrentlyFollowing,
      }));
      // Re-add the user to the list if the unfollow failed
      if (isCurrentlyFollowing) {
          // You might need to re-fetch the user to add them back correctly.
          // For simplicity, we are not doing that here. The list will correct on refresh.
      }
    }
  };


  return (
    <div className="bg-slate-950">
      <div className="min-h-screen w-full text-white p-6 md:p-8">
        {/* --- 1. MANAGER GREETING --- */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back,{' '}
              <span className="text-white">
                {userProfile?.organizationName || 'Manager'}
              </span>
              !
            </h1>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-full">
              <FaUserPlus className="h-4 w-4 text-green-400" />
              <span className="font-semibold text-sm text-white">
                {formatFollowerCount(userProfile?.followers?.length ?? 0)}
              </span>
              <span className="text-sm text-slate-400">Followers</span>
            </div>
          </div>
          <div className="flex gap-2">
            {/* --- FIX: Added transition and active classes for click feedback --- */}
            <Button onClick={() => router.push('/dashboard/manager/browse')} className="transition-transform active:scale-95">
              <FaSearch className="mr-2 h-4 w-4" />
              Browse Talent
            </Button>
            <Button onClick={() => router.push('/dashboard/manager/post-job')} className="transition-transform active:scale-95">
              <FaBullhorn className="mr-2 h-4 w-4" />
              Post a New Job
            </Button>
          </div>
        </div>

        {/* --- 2. MANAGER CONTENT GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- LEFT COLUMN --- */}
          <div className="lg:col-span-2 space-y-8 lg:order-first">
            
            {/* Placeholder for "My Job Postings" */}
            <Card className="bg-transparent border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">My Job Postings</CardTitle>
                 <CardDescription>
                  Manage your active and expired job listings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="text-center py-12 text-slate-500">
                  <FaBriefcase className="mx-auto h-12 w-12 mb-4" />
                  <p className="text-lg font-semibold mb-2">No active jobs</p>
                  <p className="text-sm mb-4">You have not posted any jobs yet.</p>
                  {/* --- FIX: Added transition and active classes for click feedback --- */}
                  <Button onClick={() => router.push('/dashboard/manager/post-job')} className="transition-transform active:scale-95">
                    <FaBullhorn className="mr-2 h-4 w-4" />
                    Post Your First Job
                  </Button>
                </div>
              </CardContent>
              <CardFooter>
                 <Link href="/dashboard/manager/my-jobs" className="w-full">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-blue-400"
                  >
                    Manage All Jobs <FaArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
            
            {/* --- FIX: DYNAMIC "BOOKMARKED TALENT" SECTION --- */}
            <Card className="bg-transparent border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Bookmarked Talent</CardTitle>
                 <CardDescription>
                  A list of youth profiles you are following.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative overflow-x-auto pt-6">
                {isFollowingListLoading ? (
                  // Loading Skeleton
                  <div className="flex flex-row gap-6 pb-4">
                    {[...Array(3)].map((_, i) => <ProfileCardSkeleton key={i} />)}
                  </div>
                ) : followedTalent.length > 0 ? (
                  // List of Followed Talent
                  <div className="flex flex-row gap-6 pb-4">
                    {followedTalent.map((talent, index) => (
                      <TalentProfileCard
                        key={talent.uid}
                        talent={talent}
                        isFollowing={followingStatus[talent.uid]}
                        onFollow={handleFollow}
                        index={index}
                      />
                    ))}
                  </div>
                ) : (
                  // Empty State Message
                  <div className="text-center py-12 text-slate-500">
                    <FaUserPlus className="mx-auto h-12 w-12 mb-4" />
                    <p className="text-lg font-semibold mb-2">No Bookmarked Talent</p>
                    <p className="text-sm mb-4">Start browsing to find and follow talent.</p>
                    {/* --- FIX: Added transition and active classes for click feedback --- */}
                    <Button onClick={() => router.push('/dashboard/manager/browse')} className="transition-transform active:scale-95">
                      <FaSearch className="mr-2 h-4 w-4" />
                      Browse Talent
                    </Button>
                  </div>
                )}
              </CardContent>
               <CardFooter>
                 <Link href="/dashboard/manager/browse" className="w-full">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-blue-400"
                  >
                    View All Talent <FaArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

          </div>

          {/* --- RIGHT COLUMN --- */}
          <div className="lg:col-span-1 space-y-8">
            <RecentMessagesCard />
            
            {/* Manager Snapshot Card */}
            <Card className="bg-transparent border-slate-800">
              <CardHeader>
                <CardTitle>My Organization Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <SnapshotStat
                  icon={<FaBriefcase />}
                  label="Jobs Posted"
                  value={userProfile?.jobsPostedCount ?? 0}
                  iconColor="text-blue-400"
                />
                <SnapshotStat
                  icon={<FaEye />}
                  label="Profile Views"
                  value={userProfile?.profileViews ?? 0}
                  iconColor="text-green-400"
                />
                <SnapshotStat
                  icon={<FaUserPlus />}
                  label="Organization Followers"
                  value={formatFollowerCount(
                    userProfile?.followers?.length ?? 0
                  )}
                  iconColor="text-pink-400"
                />
              </CardContent>
              <CardFooter>
                <Link href="/dashboard/organization" className="w-full">
                  <Button
                    variant="outline"
                    className="w-full border-slate-700 hover:bg-slate-800"
                  >
                    Manage My Organization
                  </Button>
                </Link>
              </CardFooter>
            </Card>
            
             {/* Verification Status Card */}
            <Card className="bg-transparent border-slate-800">
              <CardHeader>
                <CardTitle className="text-xl">Organization Status</CardTitle>
                <CardDescription>
                  Verify your organization to build trust with talent.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <StatusTierRow
                  icon={<FaBuilding />}
                  title="Tier 0: Organization Verified"
                  status={userProfile?.oivpStatus?.tier0}
                  actionText="Complete verification"
                  href="/onboarding/organization"
                />
                <StatusTierRow
                  icon={<FaBriefcase />}
                  title="Tier 1: Posted a Job"
                  status={userProfile?.oivpStatus?.tier1}
                  actionText="Post a job"
                  href="/dashboard/manager/post-job"
                />
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// ######################################################################
// ### 3. NEW DEFAULT EXPORT THAT CHOOSES WHICH DASHBOARD TO SHOW     ###
// ######################################################################

export default function DashboardPage() {
  const { userProfile, loading } = useAuth();

  if (loading || !userProfile) {
    // Show a full-page loader while we wait for the user profile
    // to determine which dashboard to show.
    return <Loader />;
  }

  // Check the userType and render the correct dashboard
  if (userProfile.userType === 'manager') {
    return <ManagerDashboard />;
  }

  if (userProfile.userType === 'youth') {
    return <YouthDashboard />;
  }

  // Fallback for any other case or during a brief moment of transition
  return <Loader />;
}