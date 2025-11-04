
// /app/organization/[uid]/page.tsx
'use client';

// --- 1. Imports ---
import React, { useState, useEffect } from 'react';
// FIX: The 'router' object was unused, and 'useRouter' was causing an import error.
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  FaBuilding,
  FaBriefcase,
  FaCheckCircle,
  FaLock,
  FaHourglassHalf,
  FaMapMarkerAlt,
  FaLinkedin,
  FaLink,
  FaUserPlus,
  FaSpinner,
  FaUsers,
  FaEye,
  FaExternalLinkAlt,
  FaInfoCircle,
} from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
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

// Adapted UserProfile for Organizations
interface OrganizationProfile {
  uid: string;
  userType: 'manager';
  organizationName?: string;
  organizationLogoUrl?: string;
  coverPhotoUrl?: string;
  industry?: string;
  location?: string;
  teamSize?: string;
  bio?: string;
  organizationSocialLinks?: {
    website?: string;
    linkedin?: string;
  };
  oivpStatus?: {
    tier0?: 'verified' | 'pending' | 'unverified' | 'locked';
    tier1?: 'verified' | 'pending' | 'unverified' | 'locked';
  };
  followers?: string[];
  jobsPostedCount?: number;
  profileViews?: number;
}

interface Job {
  id: string;
  title: string;
  description: string;
  location?: string;
  jobType?: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  tags?: string[];
  createdAt: Timestamp;
  organizationUid: string;
}

const glassCardClasses =
  'border-0 bg-slate-900/60 backdrop-blur-md transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-1';

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

// --- 3. Helper Functions ---
const formatFollowerCount = (count: number): string => {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}m`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
};

// --- 4. Sub-Components ---

const StatusTierRow = ({
  icon,
  title,
  status,
}: {
  icon: React.ReactNode;
  title: string;
  status?: 'verified' | 'pending' | 'unverified' | 'locked';
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
      text: 'Incomplete',
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
      </div>
      <div className="text-xl">{statusConfig[currentStatus].icon}</div>
    </div>
  );
};

const StickySidebar = ({ profile }: { profile: OrganizationProfile }) => {
  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Company Details Card */}
      <motion.div variants={itemVariants}>
        <Card className={glassCardClasses}>
          <CardHeader>
            <CardTitle className="text-xl text-white">Company Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
             <div className="flex items-center gap-3">
                <FaBuilding className="h-4 w-4 text-slate-400"/>
                <span className="text-slate-300">{profile.industry || 'Industry not specified'}</span>
            </div>
             <div className="flex items-center gap-3">
                <FaUsers className="h-4 w-4 text-slate-400"/>
                <span className="text-slate-300">Team Size: {profile.teamSize || 'Not specified'}</span>
            </div>
             <div className="flex items-center gap-3">
                <FaMapMarkerAlt className="h-4 w-4 text-slate-400"/>
                <span className="text-slate-300">{profile.location || 'Location not specified'}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Verification Status Card */}
      <motion.div variants={itemVariants}>
        <Card className={glassCardClasses}>
          <CardHeader>
            <CardTitle className="text-xl text-white">
              Organization Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <StatusTierRow
              icon={<FaBuilding />}
              title="Tier 0: Organization Verified"
              status={profile?.oivpStatus?.tier0}
            />
            <StatusTierRow
              icon={<FaBriefcase />}
              title="Tier 1: Posted a Job"
              status={profile?.oivpStatus?.tier1}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Socials Card */}
      <motion.div variants={itemVariants}>
        <Card className={glassCardClasses}>
          <CardHeader>
            <CardTitle className="text-xl text-white">Official Links</CardTitle>
          </CardHeader>
          <CardContent>
            <TooltipProvider delayDuration={0}>
              <div className="flex flex-wrap gap-3">
                {profile.organizationSocialLinks?.website && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a href={profile.organizationSocialLinks.website} target="_blank" rel="noopener noreferrer" aria-label="Website"
                         className="flex items-center justify-center h-10 w-10 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-all duration-200 active:scale-90">
                        <FaLink className="h-5 w-5" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent><p>Website</p></TooltipContent>
                  </Tooltip>
                )}
                {profile.organizationSocialLinks?.linkedin && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                        <a href={profile.organizationSocialLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
                           className="flex items-center justify-center h-10 w-10 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-all duration-200 active:scale-90">
                          <FaLinkedin className="h-5 w-5" />
                        </a>
                    </TooltipTrigger>
                    <TooltipContent><p>LinkedIn</p></TooltipContent>
                  </Tooltip>
                )}
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

const ProfileHeader = ({
  profile,
  isFollowing,
  handleFollow,
  isOwnProfile,
  followerCount
}: {
  profile: OrganizationProfile;
  isFollowing: boolean;
  handleFollow: () => void;
  isOwnProfile: boolean;
  followerCount: number;
}) => {
  return (
    <motion.div variants={itemVariants}>
      <Card className={`${glassCardClasses} overflow-hidden`}>
        <div className="relative h-48 md:h-64 bg-slate-800">
          {profile.coverPhotoUrl ? (
            <img src={profile.coverPhotoUrl} alt="Cover Photo" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-blue-900/50"></div>
          )}
          <div className="absolute -bottom-16 left-8">
            <Avatar className="h-32 w-32 border-4 border-slate-900/80">
              <AvatarImage src={profile.organizationLogoUrl} alt={profile.organizationName} />
              <AvatarFallback className="text-4xl bg-slate-700 text-white">
                {profile.organizationName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        <CardHeader className="pt-20 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <CardTitle className="text-3xl font-bold text-white">{profile.organizationName}</CardTitle>
              <CardDescription className="text-slate-400 mt-1">
                {profile.industry} • {profile.location}
              </CardDescription>
            </div>
            {!isOwnProfile && (
              <Button onClick={handleFollow} variant={isFollowing ? 'secondary' : 'default'}>
                <FaUserPlus className="mr-2 h-4 w-4" /> {isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
            {isOwnProfile && (
                <Button asChild variant="outline">
                    <Link href="/dashboard/settings">Edit Profile</Link>
                </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
            <div className="flex items-center gap-6 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                    <FaUsers className="text-slate-400" />
                    <span><span className="font-bold text-white">{formatFollowerCount(followerCount)}</span> Followers</span>
                </div>
                <div className="flex items-center gap-2">
                    <FaEye className="text-slate-400" />
                    <span><span className="font-bold text-white">{profile.profileViews || 0}</span> Views</span>
                </div>
                 <div className="flex items-center gap-2">
                    <FaBriefcase className="text-slate-400" />
                    <span><span className="font-bold text-white">{profile.jobsPostedCount || 0}</span> Jobs Posted</span>
                </div>
            </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const JobsTab = ({ jobs }: { jobs: Job[] }) => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {jobs.length > 0 ? (
        jobs.map((job) => (
          <motion.div key={job.id} variants={itemVariants}>
            <Card className={glassCardClasses}>
              <CardHeader>
                <CardTitle className="text-lg text-blue-400 hover:text-blue-300">
                  <Link href={`/jobs/${job.id}`}>{job.title}</Link>
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  {job.jobType} • {job.location} • Posted on {job.createdAt.toDate().toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 line-clamp-2 text-sm">
                  {job.description}
                </p>
              </CardContent>
               <CardFooter className="flex justify-between items-center">
                  <div className="flex flex-wrap gap-2">
                      {job.tags?.slice(0, 3).map(tag => (
                          <span key={tag} className="px-2 py-1 text-xs bg-slate-800 text-slate-300 rounded-full">{tag}</span>
                      ))}
                  </div>
                  <Button variant="ghost" asChild className="text-blue-400 hover:text-blue-300">
                      <Link href={`/jobs/${job.id}`}>
                          View Job <FaExternalLinkAlt className="ml-2 h-3 w-3" />
                      </Link>
                  </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))
      ) : (
        <Card className={glassCardClasses}>
          <CardContent className="p-8 text-center text-slate-400">
            <FaInfoCircle className="mx-auto h-8 w-8 mb-4"/>
            <p>This organization has not posted any jobs yet.</p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );

// --- 5. Main Page Component ---
export default function OrganizationProfilePage() {
  const params = useParams();
  const { user } = useAuth();
  const uid = params.uid as string;

  const [profile, setProfile] = useState<OrganizationProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  const isOwnProfile = user?.uid === uid;

  useEffect(() => {
    if (!uid) return;

    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        // Fetch organization profile
        const profileDocRef = doc(db, 'users', uid);
        const profileDocSnap = await getDoc(profileDocRef);

        if (profileDocSnap.exists() && profileDocSnap.data().userType === 'manager') {
          const profileData = profileDocSnap.data() as OrganizationProfile;
          setProfile(profileData);
          
          // Increment profile views if not own profile
          if (!isOwnProfile && user) {
            await updateDoc(profileDocRef, {
              profileViews: (profileData.profileViews || 0) + 1
            });
          }

          // Check following status
          if (user && profileData.followers?.includes(user.uid)) {
            setIsFollowing(true);
          }
          setFollowerCount(profileData.followers?.length || 0);

          // Fetch jobs posted by the organization
          const jobsCollectionRef = collection(db, 'jobs');
          const q = query(jobsCollectionRef, where('organizationUid', '==', uid));
          const jobsSnapshot = await getDocs(q);
          const jobsData = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Job[];
          setJobs(jobsData.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));

        } else {
          console.error("Organization not found or user is not a manager");
        }
      } catch (error) {
        console.error("Error fetching organization profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [uid, user, isOwnProfile]);


  const handleFollow = async () => {
    if (!user || isOwnProfile) return;

    const profileDocRef = doc(db, 'users', uid);
    try {
      if (isFollowing) {
        await updateDoc(profileDocRef, {
          followers: arrayRemove(user.uid),
        });
        setFollowerCount(prev => prev - 1);
      } else {
        await updateDoc(profileDocRef, {
          followers: arrayUnion(user.uid),
        });
        setFollowerCount(prev => prev + 1);
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error("Error updating follow status:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
        <FaSpinner className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
            <h1 className="text-2xl font-bold">Organization Not Found</h1>
            <p className="text-slate-400 mt-2">The profile you are looking for does not exist or is not an organization.</p>
            <Button asChild className="mt-6">
                <Link href="/">Go Home</Link>
            </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 md:p-8">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="sticky top-24">
              <StickySidebar profile={profile} />
            </div>
          </aside>
          <main className="lg:col-span-8 xl:col-span-9 space-y-6">
            <motion.div
              className="space-y-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <ProfileHeader 
                profile={profile}
                isFollowing={isFollowing}
                handleFollow={handleFollow}
                isOwnProfile={isOwnProfile}
                followerCount={followerCount}
              />
              
              <motion.div variants={itemVariants}>
                 <Tabs defaultValue="about" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-900/60 border-0 text-slate-300">
                        <TabsTrigger value="about">About</TabsTrigger>
                        <TabsTrigger value="jobs">Jobs ({jobs.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="about" className="mt-6">
                         <Card className={glassCardClasses}>
                            <CardHeader>
                                <CardTitle className="text-xl text-white">About {profile.organizationName}</CardTitle>
                            </CardHeader>
                            <CardContent className="prose prose-invert prose-slate max-w-none text-slate-300">
                                <p>{profile.bio || 'No bio available.'}</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="jobs" className="mt-6">
                        <JobsTab jobs={jobs} />
                    </TabsContent>
                </Tabs>
              </motion.div>
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}