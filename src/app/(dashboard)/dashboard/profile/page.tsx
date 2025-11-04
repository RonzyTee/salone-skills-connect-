// /app/dashboard/profile/page.tsx
'use client';

// --- 1. Imports ---
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

// --- Icons ---
import {
  FaEdit,
  FaGithub,
  FaLinkedin,
  FaSave,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaWhatsapp,
  FaMapMarkerAlt,
  FaTools,
  FaPlus,
  FaTimes,
  FaSpinner,
  FaAddressCard,
  FaCamera,
  FaShareAlt,
  FaQrcode,
  FaCheckCircle,
  FaProjectDiagram,
  FaUserCheck,
  FaStar,
  FaHourglassHalf,
  FaLock,
  FaImage,
} from 'react-icons/fa';
import { MdOutlineWork } from 'react-icons/md';

// --- Libraries ---
import {
  FacebookShareButton,
  LinkedinShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  WhatsappIcon,
} from 'react-share';
import { QRCodeCanvas } from 'qrcode.react';
import { motion, Variants } from 'framer-motion';

// --- UI Components ---
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// --- 2. Schema and Types ---
const profileSchema = z.object({
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
type ProfileFormValues = z.infer<typeof profileSchema>;

// --- 3. Constants and Animations ---

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

// --- 4. Helper Functions ---

// [FIXED] Added this interface definition
interface InfoFieldProps {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  isLink?: boolean;
  linkPrefix?: string;
}

const InfoField: React.FC<InfoFieldProps> = ({
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
          <Link href={href} className="text-xs text-blue-400 hover:underline">
            {actionText}
          </Link>
        )}
      </div>
      <div className="text-xl">{statusConfig[currentStatus].icon}</div>
    </div>
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

// --- 5. [NEW] View Mode Components ---

const SkillsCardView = ({ skills }: { skills: string[] }) => (
  <Card className={glassCardClasses}>
    <CardHeader>
      <CardTitle className="text-xl text-white">Skills & Expertise</CardTitle>
    </CardHeader>
    <CardContent className="flex flex-wrap gap-2">
      {skills && skills.length > 0 ? (
        skills.map((skill) => (
          <span
            key={skill}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full shadow-sm text-white text-sm font-medium"
          >
            {skill}
          </span>
        ))
      ) : (
        <p className="text-slate-400 text-sm">No skills added yet.</p>
      )}
    </CardContent>
  </Card>
);

const VerificationCardView = ({ oivpStatus }: { oivpStatus: any }) => (
  <Card className={glassCardClasses}>
    <CardHeader>
      <CardTitle className="text-xl text-white">Verification Status</CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <StatusTierRow
        icon={<FaUserCheck />}
        title="Tier 0: Identity Confirmed"
        status={oivpStatus?.tier0}
        actionText="Complete your identity verification."
        href="/onboarding"
      />
      <StatusTierRow
        icon={<FaTools />}
        title="Tier 1: Work Authenticated"
        status={oivpStatus?.tier1}
        actionText="Add a project to prove your skill."
        href="/dashboard/portfolio/add"
      />
      <StatusTierRow
        icon={<FaStar />}
        title="Tier 2: Skill Endorsed"
        status={oivpStatus?.tier2}
        actionText="Get a real client to endorse your work."
        href="/dashboard/portfolio"
      />
    </CardContent>
  </Card>
);

const SocialsCardView = ({ userProfile }: { userProfile: any }) => (
  <Card className={glassCardClasses}>
    <CardHeader>
      <CardTitle className="text-xl text-white">Social Presence</CardTitle>
    </CardHeader>
    <CardContent className="flex flex-wrap gap-3">
      {userProfile.githubUrl && (
        <a
          href={userProfile.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub Profile"
          className="flex items-center justify-center h-10 w-10 text-slate-400 hover:text-white
                     bg-slate-800 hover:bg-slate-700 rounded-full transition-all duration-200 active:scale-90"
        >
          <FaGithub className="h-5 w-5" />
        </a>
      )}
      {userProfile.linkedinUrl && (
        <a
          href={userProfile.linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn Profile"
          className="flex items-center justify-center h-10 w-10 text-blue-500 hover:text-blue-400
                     bg-slate-800 hover:bg-slate-700 rounded-full transition-all duration-200 active:scale-90"
        >
          <FaLinkedin className="h-5 w-5" />
        </a>
      )}
      {!userProfile.githubUrl && !userProfile.linkedinUrl && (
        <p className="text-slate-400 text-sm">No social links provided.</p>
      )}
    </CardContent>
  </Card>
);

// [FIXED] Changed prop type from `string` to `string | undefined | null`
const AboutCardView = ({ bio }: { bio: string | undefined | null }) => (
  <Card className={glassCardClasses}>
    <CardHeader>
      <CardTitle className="text-xl text-white">About Me</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-slate-300 text-base leading-relaxed whitespace-pre-wrap break-words">
        {bio || 'No bio provided. Click "Edit Profile" to add one.'}
      </p>
    </CardContent>
  </Card>
);

const DetailsCardView = ({ userProfile }: { userProfile: any }) => (
  <Card className={glassCardClasses}>
    <CardHeader>
      <CardTitle className="text-xl text-white">Details</CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <InfoField
        icon={<MdOutlineWork size={20} />}
        label="Career Objective"
        value={userProfile.careerObjective}
      />
      <InfoField
        icon={<FaEnvelope size={20} />}
        label="Email Address"
        value={userProfile.email}
      />
      <InfoField
        icon={<FaPhone size={20} />}
        label="Phone Number"
        value={userProfile.phoneNumber}
      />
      <InfoField
        icon={<FaWhatsapp size={20} />}
        label="WhatsApp"
        value={userProfile.whatsappNumber}
      />
    </CardContent>
  </Card>
);

// --- 6. [MODIFIED] Edit Mode Component ---
interface EditModeProfileProps {
  userProfile: any;
  refreshUserProfile: () => Promise<void>;
}

const EditModeProfile: React.FC<EditModeProfileProps> = ({
  userProfile,
  refreshUserProfile,
}) => {
  // --- State and Form Hooks (Unchanged) ---
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [currentSkills, setCurrentSkills] = useState<string[]>(
    userProfile.selectedSkills || []
  );

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: 'onBlur',
    defaultValues: {
      fullName: userProfile.fullName || '',
      profilePictureUrl: userProfile.profilePictureUrl || '',
      coverPhotoUrl: userProfile.coverPhotoUrl || '',
      bio: userProfile.bio || '',
      location: userProfile.location || '',
      phoneNumber: userProfile.phoneNumber || '',
      whatsappNumber: userProfile.whatsappNumber || '',
      githubUrl: userProfile.githubUrl || '',
      linkedinUrl: userProfile.linkedinUrl || '',
      careerObjective: userProfile.careerObjective || '',
      primarySkill: userProfile.primarySkill || '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = form;

  const profilePicturePreview = watch('profilePictureUrl');
  const coverPhotoPreview = watch('coverPhotoUrl');

  // --- Effects (Unchanged) ---
  useEffect(() => {
    reset({
      fullName: userProfile.fullName || '',
      profilePictureUrl: userProfile.profilePictureUrl || '',
      coverPhotoUrl: userProfile.coverPhotoUrl || '',
      bio: userProfile.bio || '',
      location: userProfile.location || '',
      phoneNumber: userProfile.phoneNumber || '',
      whatsappNumber: userProfile.whatsappNumber || '',
      githubUrl: userProfile.githubUrl || '',
      linkedinUrl: userProfile.linkedinUrl || '',
      careerObjective: userProfile.careerObjective || '',
      primarySkill: userProfile.primarySkill || '',
    });
    setCurrentSkills(userProfile.selectedSkills || []);
  }, [userProfile, reset]);

  // --- Handlers (Unchanged) ---
  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    const uploadPromise = fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    toast.promise(uploadPromise, {
      loading: 'Uploading image...',
      success: (response) => {
        if (!response.ok) {
          throw new Error('Upload failed. Please try again.');
        }
        return response.json();
      },
      error: (err) => `Upload failed: ${err.message}`,
    });

    try {
      const response = await uploadPromise;
      const data = await response.json();

      if (data.url) {
        setValue('profilePictureUrl', data.url, { shouldValidate: true });
        toast.success('Profile picture updated!');
      } else {
        throw new Error(data.error || 'Failed to get image URL.');
      }
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsUploadingImage(false);
      event.target.value = '';
    }
  };

  const handleCoverImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    const formData = new FormData();
    formData.append('image', file);

    const uploadPromise = fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    toast.promise(uploadPromise, {
      loading: 'Uploading cover photo...',
      success: (response) => {
        if (!response.ok) {
          throw new Error('Upload failed. Please try again.');
        }
        return response.json();
      },
      error: (err) => `Upload failed: ${err.message}`,
    });

    try {
      const response = await uploadPromise;
      const data = await response.json();

      if (data.url) {
        setValue('coverPhotoUrl', data.url, { shouldValidate: true });
        toast.success('Cover photo updated!');
      } else {
        throw new Error(data.error || 'Failed to get image URL.');
      }
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsUploadingCover(false);
      event.target.value = '';
    }
  };

  const addSkill = useCallback(() => {
    const trimmedSkill = newSkill.trim();
    if (trimmedSkill && !currentSkills.includes(trimmedSkill)) {
      setCurrentSkills((prev) => [...prev, trimmedSkill]);
      setNewSkill('');
    } else if (trimmedSkill && currentSkills.includes(trimmedSkill)) {
      toast.warning('Skill already exists', {
        description: "You've already added this skill.",
      });
    }
  }, [newSkill, currentSkills]);

  const removeSkill = useCallback((skillToRemove: string) => {
    setCurrentSkills((prev) => prev.filter((skill) => skill !== skillToRemove));
  }, []);

  const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    setIsSaving(true);
    try {
      const payload = {
        ...data,
        selectedSkills: currentSkills,
      };
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }
      await refreshUserProfile();
      toast.success('Profile Updated!', {
        description: 'Your profile has been successfully saved.',
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Update Failed', {
        description:
          error.message ||
          'There was an error saving your profile. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // --- [MODIFIED] Render ---
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information Section */}
        {/* [FIXED] Removed `as="section"` */}
        <Card className={`${glassCardClasses} p-6`}>
          <CardHeader className="p-0 pb-6">
            <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
              <FaUser /> Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-6">
            {/* Profile Picture Upload */}
            <div>
              <Label className="text-base text-slate-400 mb-2 block">
                Profile Picture
              </Label>
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20 border-2 border-slate-700">
                  <AvatarImage src={profilePicturePreview} alt="Profile preview" />
                  <AvatarFallback className="bg-slate-700 text-3xl">
                    {userProfile.fullName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <Input
                  id="profilePictureInput"
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('profilePictureInput')?.click()}
                  disabled={isUploadingImage}
                  className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
                >
                  {isUploadingImage ? (
                    <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FaCamera className="mr-2" />
                  )}
                  {isUploadingImage ? 'Uploading...' : 'Change Picture'}
                </Button>
              </div>
              <input type="hidden" {...register('profilePictureUrl')} />
              {errors.profilePictureUrl && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.profilePictureUrl.message}
                </p>
              )}
            </div>

            {/* Cover Photo Upload */}
            <div>
              <Label className="text-base text-slate-400 mb-2 block">
                Cover Photo
              </Label>
              <div className="flex items-center gap-4">
                <div className="w-32 h-20 rounded-md border-2 border-slate-700 bg-slate-800 overflow-hidden">
                  {coverPhotoPreview ? (
                    <img src={coverPhotoPreview} alt="Cover preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-700 to-indigo-800" />
                  )}
                </div>
                <Input
                  id="coverPhotoInput"
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleCoverImageChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('coverPhotoInput')?.click()}
                  disabled={isUploadingCover}
                  className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
                >
                  {isUploadingCover ? (
                    <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FaImage className="mr-2" />
                  )}
                  {isUploadingCover ? 'Uploading...' : 'Change Cover'}
                </Button>
              </div>
              <input type="hidden" {...register('coverPhotoUrl')} />
              {errors.coverPhotoUrl && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.coverPhotoUrl.message}
                </p>
              )}
            </div>

            {/* Name and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="fullName" className="text-base text-slate-400 mb-2 block">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  {...register('fullName')}
                  className="p-3 bg-slate-800 border-slate-700 text-white focus:border-blue-500"
                />
                {errors.fullName && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.fullName.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="location" className="text-base text-slate-400 mb-2 block">
                  Location (City, Country)
                </Label>
                <Input
                  id="location"
                  {...register('location')}
                  className="p-3 bg-slate-800 border-slate-700 text-white focus:border-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Details Section */}
        {/* [FIXED] Removed `as="section"` */}
        <Card className={`${glassCardClasses} p-6`}>
          <CardHeader className="p-0 pb-6">
            <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
              <MdOutlineWork /> Professional Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-6">
            <div>
              <Label htmlFor="primarySkill" className="text-base text-slate-400 mb-2 block">
                Primary Skill / Title
              </Label>
              <Input
                id="primarySkill"
                {...register('primarySkill')}
                placeholder="e.g., Full-Stack Developer, UI/UX Designer"
                className="p-3 bg-slate-800 border-slate-700 text-white focus:border-blue-500"
              />
            </div>
            
            <div>
              <Label htmlFor="bio" className="text-base text-slate-400 mb-2 block">
                About Me (Bio)
              </Label>
              <Textarea
                id="bio"
                {...register('bio')}
                rows={5}
                className="p-3 bg-slate-800 border-slate-700 text-white focus:border-blue-500"
                placeholder="Write a short summary about your professional experience..."
              />
              {errors.bio && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.bio.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="careerObjective" className="text-base text-slate-400 mb-2 block">
                Career Objective
              </Label>
              <Textarea
                id="careerObjective"
                {...register('careerObjective')}
                rows={3}
                className="p-3 bg-slate-800 border-slate-700 text-white focus:border-blue-500"
                placeholder="What are you looking for in your next role?"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact & Socials Section */}
        {/* [FIXED] Removed `as="section"` */}
        <Card className={`${glassCardClasses} p-6`}>
            <CardHeader className="p-0 pb-6">
              <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
                <FaAddressCard /> Contact & Socials
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="phoneNumber" className="text-base text-slate-400 mb-2 block">
                    Phone Number
                  </Label>
                  <Input
                    id="phoneNumber"
                    {...register('phoneNumber')}
                    className="p-3 bg-slate-800 border-slate-700 text-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="whatsappNumber" className="text-base text-slate-400 mb-2 block">
                    WhatsApp Number
                  </Label>
                  <Input
                    id="whatsappNumber"
                    {...register('whatsappNumber')}
                    className="p-3 bg-slate-800 border-slate-700 text-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="githubUrl" className="text-base text-slate-400 mb-2 block">
                    GitHub URL
                  </Label>
                  <Input
                    id="githubUrl"
                    {...register('githubUrl')}
                    className="p-3 bg-slate-800 border-slate-700 text-white focus:border-blue-500"
                  />
                    {errors.githubUrl && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.githubUrl.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="linkedinUrl" className="text-base text-slate-400 mb-2 block">
                    LinkedIn URL
                  </Label>
                  <Input
                    id="linkedinUrl"
                    {...register('linkedinUrl')}
                    className="p-3 bg-slate-800 border-slate-700 text-white focus:border-blue-500"
                  />
                  {errors.linkedinUrl && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.linkedinUrl.message}
                    </p>
                  )}
                </div>
            </CardContent>
        </Card>

        {/* Skills Section */}
        {/* [FIXED] Removed `as="section"` */}
        <Card className={`${glassCardClasses} p-6`}>
          <CardHeader className="p-0 pb-6">
            <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
              <FaTools /> Skills & Expertise
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <div className="flex gap-2">
              <Input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="Add a skill (e.g., React, Figma)"
                className="flex-1 p-3 bg-slate-800 border-slate-700 text-white focus:border-blue-500"
              />
              <Button
                type="button"
                onClick={addSkill}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <FaPlus /> Add
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-3 pt-3">
              {currentSkills.length > 0 ? (
                currentSkills.map((skill) => (
                  <span
                    key={skill}
                    className="flex items-center gap-2 bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-full"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <FaTimes />
                    </button>
                  </span>
                ))
              ) : (
                <p className="text-slate-500">No skills added yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Form Footer */}
        <div className="flex justify-end gap-4 p-0 pt-6 border-t border-slate-700 mt-8">
          <Button
            type="submit"
            size="lg"
            disabled={isSaving}
            className="text-base px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white
                       transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 active:scale-95"
          >
            {isSaving ? (
              <>
                <FaSpinner className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <FaSave className="mr-2" /> Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

// --- 7. [MODIFIED] Share and Connect Component ---
interface ShareAndConnectProps {
  userProfile: any;
}

const ShareAndConnect: React.FC<ShareAndConnectProps> = ({ userProfile }) => {
  const [pageUrl, setPageUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && userProfile.uid) {
      const publicProfileUrl = `${window.location.origin}/profile/${userProfile.uid}`;
      setPageUrl(publicProfileUrl);
    }
  }, [userProfile.uid]);

  const shareTitle = `Check out ${userProfile.fullName}'s Profile`;

  if (!pageUrl) {
    return null;
  }

  return (
    <Card className={`${glassCardClasses} max-w-lg mx-auto`}>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
          <FaShareAlt /> Share & Connect
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-5">
        <div className="bg-white p-3 rounded-lg border-4 border-slate-700">
          <QRCodeCanvas
            value={pageUrl}
            size={128}
            bgColor="#ffffff"
            fgColor="#0f172a" // slate-900
            level="Q"
          />
        </div>
        <p className="text-sm text-slate-400 text-center">
          Share this QR code or use the links below to send your public profile.
        </p>
          <Input
            type="text"
            readOnly
            value={pageUrl}
            className="w-full bg-slate-800 border-slate-700 text-slate-300"
            onFocus={(e) => e.target.select()}
          />
        <div className="flex justify-center items-center gap-3 w-full pt-4 border-t border-slate-800">
          <TwitterShareButton url={pageUrl} title={shareTitle} aria-label="Share on Twitter">
            <TwitterIcon size={40} round />
          </TwitterShareButton>
          <LinkedinShareButton url={pageUrl} title={shareTitle} aria-label="Share on LinkedIn">
            <LinkedinIcon size={40} round />
          </LinkedinShareButton>
          <WhatsappShareButton url={pageUrl} title={shareTitle} separator=":: " aria-label="Share on WhatsApp">
            <WhatsappIcon size={40} round />
          </WhatsappShareButton>
          <FacebookShareButton url={pageUrl} aria-label="Share on Facebook">
            <FacebookIcon size={40} round />
          </FacebookShareButton>
        </div>
      </CardContent>
    </Card>
  );
};

// --- 8. [REBUILT] Main Profile Page Component ---
export default function ProfilePage() {
  const { userProfile, loading, refreshUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-950">
        <FaSpinner className="text-blue-500 text-4xl animate-spin" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-white">
        <h2 className="text-2xl mb-4">Profile Not Found</h2>
        <p className="text-slate-400">
          Please ensure you are logged in and your profile exists.
        </p>
      </div>
    );
  }

  const displaySkill =
    userProfile.primarySkill || userProfile.selectedSkills?.[0] || 'Your Profession';
  const isVerified = userProfile.oivpStatus?.tier0 === 'verified';

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white p-4 md:px-8 lg:px-12 xl:px-16 lg:py-12 xl:py-16 relative overflow-hidden">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[100rem] h-[100rem]
                 bg-gradient-to-br from-blue-900/30 to-purple-900/30
                 rounded-full blur-[150px] opacity-30 pointer-events-none
                 animate-[spin_25s_linear_infinite]"
        aria-hidden="true"
      />

      <div className="max-w-screen-2xl mx-auto space-y-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className={`${glassCardClasses} overflow-hidden group`}>
            {/* Cover Photo */}
            <div className="h-48 md:h-64 relative bg-slate-800 overflow-hidden">
              {userProfile.coverPhotoUrl ? (
                <img 
                  src={userProfile.coverPhotoUrl} 
                  alt="Cover photo" 
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

            {/* Avatar & Info */}
            <div className="p-6 flex flex-col md:flex-row items-center md:items-end -mt-20 md:-mt-24 relative z-10">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 120 }}
              >
                <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-slate-900 shadow-lg">
                  <AvatarImage
                    src={userProfile.profilePictureUrl}
                    alt={userProfile.fullName || 'User avatar'}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-4xl bg-slate-700 text-white">
                    {userProfile.fullName ? userProfile.fullName.charAt(0) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </motion.div>

              {/* Name, Stats, Buttons */}
              <div className="md:ml-6 mt-4 md:mt-0 w-full flex flex-col md:flex-row items-center justify-between">
                <div className="text-center md:text-left">
                  <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                    {userProfile.fullName || 'SkillsLink User'}
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
                  {userProfile.location && (
                    <p className="text-sm text-slate-400 flex items-center justify-center md:justify-start mt-1.5">
                      <FaMapMarkerAlt className="mr-1.5 text-blue-500" />
                      {userProfile.location}
                    </p>
                  )}
                </div>

                {/* Stats & Buttons */}
                <div className="flex flex-col items-center md:items-end mt-4 md:mt-0 space-y-3">
                  <div className="flex flex-wrap justify-center gap-3">
                    <div className="flex flex-col items-center px-3 py-1.5 bg-slate-800/70 rounded-lg">
                      <span className="text-xl font-bold text-blue-400">
                        {userProfile.projectsCount ?? 0}
                      </span>
                      <span className="text-xs text-slate-400">Projects</span>
                    </div>
                    <div className="flex flex-col items-center px-3 py-1.5 bg-slate-800/70 rounded-lg">
                      <span className="text-xl font-bold text-green-400">
                        {userProfile.endorsementsCount ?? 0}
                      </span>
                      <span className="text-xs text-slate-400">Endorsements</span>
                    </div>
                    <div className="flex flex-col items-center px-3 py-1.5 bg-slate-800/70 rounded-lg">
                      <span className="text-xl font-bold text-purple-400">
                        {formatFollowerCount(userProfile.followers?.length ?? 0)}
                      </span>
                      <span className="text-xs text-slate-400">Followers</span>
                    </div>
                  </div>
                  
                  {/* Edit/Cancel Buttons */}
                  <div className="flex gap-3">
                    {isEditing ? (
                        <Button
                        variant="outline"
                        className="text-gray-300 border-gray-600 hover:bg-gray-700/50
                                   transition-all duration-300 active:scale-95"
                        onClick={() => setIsEditing(false)}
                      >
                        <FaTimes className="mr-2" /> Cancel
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white
                                   transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 active:scale-95"
                        onClick={() => setIsEditing(true)}
                      >
                        <FaEdit className="mr-2" /> Edit Profile
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* --- Animated Tabs --- */}
        <Tabs
          defaultValue="profile"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList
            className="grid w-full grid-cols-3 bg-slate-800/90 shadow-md backdrop-blur-sm relative"
          >
            <TabsTrigger
              value="profile"
              className="relative data-[state=active]:text-blue-900 font-medium text-slate-300 hover:text-blue-300 transition-colors z-10"
            >
              <FaAddressCard className="mr-2" /> Profile
            </TabsTrigger>
            <TabsTrigger
              value="projects"
              className="relative data-[state=active]:text-blue-900 font-medium text-slate-300 hover:text-blue-300 transition-colors z-10"
            >
              <FaProjectDiagram className="mr-2" /> Portfolio
            </TabsTrigger>
            <TabsTrigger
              value="share"
              className="relative data-[state=active]:text-blue-900 font-medium text-slate-300 hover:text-blue-300 transition-colors z-10"
            >
              <FaShareAlt className="mr-2" /> Share & Connect
            </TabsTrigger>

            <motion.div
              layoutId="activeTabIndicator"
              className="absolute inset-0 h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-md z-0"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                width: '33.33%',
                left:
                  activeTab === 'profile'
                    ? '0%'
                    : activeTab === 'projects'
                    ? '33.33%'
                    : '66.66%',
              }}
            />
          </TabsList>

          {/* --- Profile Tab Content (Now conditional) --- */}
          <TabsContent value="profile" className="mt-6">
            <motion.div
              key={isEditing ? 'edit' : 'view'} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {isEditing ? (
                <EditModeProfile
                  userProfile={userProfile}
                  refreshUserProfile={refreshUserProfile}
                />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                  {/* Left Sticky Column */}
                  <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24 h-fit">
                    <SkillsCardView skills={userProfile.selectedSkills || []} />
                    <VerificationCardView oivpStatus={userProfile.oivpStatus} />
                    <SocialsCardView userProfile={userProfile} />
                  </div>
                  {/* Right Main Column */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* [FIXED] Passing userProfile.bio which can be undefined */}
                    <AboutCardView bio={userProfile.bio} />
                    <DetailsCardView userProfile={userProfile} />
                  </div>
                </div>
              )}
            </motion.div>
          </TabsContent>
          
          {/* --- Projects Tab Content --- */}
          <TabsContent value="projects" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className={glassCardClasses}>
                <CardHeader>
                  <CardTitle className="text-white text-xl">My Portfolio</CardTitle>
                  <CardDescription className="text-slate-400">
                    Manage your projects and endorsements to showcase your work.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300">Your project gallery will be displayed here.</p>
                  <Link href="/dashboard/portfolio" className="mt-4 inline-block">
                    <Button 
                      variant="outline" 
                      className="text-blue-400 border-blue-600 hover:bg-blue-600/20 hover:text-blue-300
                                 transition-all duration-300 shadow-lg shadow-blue-600/10 active:scale-95"
                    >
                      Manage My Portfolio
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* --- Share Tab Content --- */}
          <TabsContent value="share" className="mt-6">
             <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ShareAndConnect userProfile={userProfile} />
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}