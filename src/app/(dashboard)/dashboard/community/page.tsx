'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/types';
import {
  collection,
  query,
  where,
  limit,
  getDocs,
  orderBy,
  Timestamp,
  addDoc,
  serverTimestamp,
  startAfter,
  doc,
  writeBatch,
  arrayUnion,
  arrayRemove,
  updateDoc, // --- ADDED ---
  increment, // --- ADDED ---
  onSnapshot, // --- ADDED ---
  getDoc, // --- ADDED ---
} from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';

// --- UI & Icons ---
import {
  Image as ImageIcon,
  MessageCircle,
  Heart,
  User,
  Users,
  Loader2,
  CheckCircle,
  Hash,
  Send,
  MoreHorizontal,
  UserPlus,
  UserCheck,
  X,
  CornerDownRight, // --- ADDED ---
} from 'lucide-react';
import {
  FaUserPlus as FaFollowerIcon,
  FaCode,
  FaPalette,
  FaVial,
  FaDatabase,
  FaFilm,
  FaShieldAlt,
  FaCloud,
  FaMobileAlt,
  FaLayerGroup,
  FaReact,
  FaNodeJs,
  FaPython,
  FaJsSquare,
  FaHtml5,
  FaCss3Alt,
  FaFigma,
  FaDocker,
  FaAws,
} from 'react-icons/fa';
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
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
// --- ADDED: Select for Post Type ---
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Image from 'next/image';

// --- Types ---
type PostReaction = 'like' | 'celebrate' | 'support' | 'insightful';
type CommentReaction = 'like';

interface ReactionMap {
  [userId: string]: PostReaction | CommentReaction;
}

interface Post {
  id: string;
  authorId: string;
  authorFullName: string;
  authorHeadline: string;
  authorProfilePictureUrl?: string;
  authorUserType: 'youth' | 'manager';
  isVerified: boolean;
  subject?: string;
  content: string;
  mediaUrls?: string[];
  linkPreview?: object;
  postType: 'General' | 'Showcase' | 'Question';
  createdAt: Timestamp;
  reactions: ReactionMap; // --- UPDATED ---
  commentsCount: number;
}

// --- ADDED: Comment Type ---
interface Comment {
  id: string;
  authorId: string;
  authorFullName: string;
  authorHeadline: string;
  authorProfilePictureUrl?: string;
  content: string;
  createdAt: Timestamp;
  reactions: ReactionMap;
  replyToCommentId: string | null;
  replies?: Comment[]; // For client-side nesting
}

// --- HELPER: Format Follower Count ---
const formatFollowerCount = (count: number): string => {
  // ... (no changes)
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

// --- HELPER: Map skill names to Icons ---
const skillMap: { [key: string]: { icon: React.ReactNode; color: string } } = {
  // ... (no changes)
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

const getSkillData = (skillName: string) => {
  // ... (no changes)
  const normalizedSkill = skillName.toLowerCase().trim();
  return (
    skillMap[normalizedSkill] || {
      icon: <FaLayerGroup />,
      color: 'text-slate-400',
    }
  );
};

/**
 * =========================================================================
 * 1. LEFT COLUMN COMPONENTS
 * =========================================================================
 */

const MyProfileSnippet = ({ profile }: { profile: UserProfile }) => {
  return (
    <Card className="bg-slate-900 border-slate-800 text-white">
      <CardContent className="p-4 text-center">
        <Avatar className="h-16 w-16 mx-auto mb-2 border-2 border-slate-700">
          <AvatarImage src={profile.profilePictureUrl} alt={profile.fullName} />
          <AvatarFallback>
            {profile.fullName ? profile.fullName.charAt(0) : <User />}
          </AvatarFallback>
        </Avatar>
        <h3 className="font-semibold text-white">{profile.fullName}</h3>
        {/* --- UPDATED: Removed "No headline provided" --- */}
        <p className="text-sm text-slate-400 h-5">
          {profile.professionalHeadline || ''}
        </p>
        <div className="flex items-center justify-center gap-1.5 mt-2">
          <Users className="h-4 w-4 text-green-400" />
          <span className="text-sm text-slate-400 whitespace-nowrap">
            <span className="font-semibold text-white">
              {formatFollowerCount(profile.followers?.length ?? 0)}
            </span>
            {' '}Followers
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

const FeedFilters = ({
  activeFilter,
  onFilterChange,
}: {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}) => {
  // ... (no changes)
  const filters = [
    { key: 'all', label: 'All Posts' },
    { key: 'managers', label: 'From Managers Only' },
    { key: 'talent', label: 'From Talent Only' },
    { key: 'showcase', label: 'Showcase' },
    { key: 'questions', label: 'Questions' },
  ];

  return (
    <Card className="bg-slate-900 border-slate-800 text-white">
      <CardHeader>
        <CardTitle className="text-lg">Feed Filters</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col space-y-2">
        {filters.map((filter) => (
          <Button
            key={filter.key}
            variant={activeFilter === filter.key ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => onFilterChange(filter.key)}
          >
            {filter.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

/**
 * =========================================================================
 * 2. RIGHT COLUMN COMPONENTS
 * =========================================================================
 */

const FollowButton = ({ targetUserId }: { targetUserId: string }) => {
  // ... (no changes)
  const { user, userProfile, loading } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && userProfile) {
      setIsFollowing(userProfile.following?.includes(targetUserId) || false);
    }
  }, [loading, userProfile, targetUserId]);

  const handleFollow = async () => {
    if (!user?.uid || isLoading || loading) return;
    if (user.uid === targetUserId) return;

    setIsLoading(true);
    const currentUserId = user.uid;
    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);

    try {
      const batch = writeBatch(db);
      if (isFollowing) {
        batch.update(currentUserRef, { following: arrayRemove(targetUserId) });
        batch.update(targetUserRef, { followers: arrayRemove(currentUserId) });
      } else {
        batch.update(currentUserRef, { following: arrayUnion(targetUserId) });
        batch.update(targetUserRef, { followers: arrayUnion(currentUserId) });
      }
      await batch.commit();
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Failed to update follow status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-28 rounded-md p-[2px] animated-glitter-border">
      <Button
        size="sm"
        variant="ghost"
        className={`
          text-xs self-start flex-shrink-0 w-full h-full justify-center rounded-[4px]
          transition-colors duration-200
          ${
            isFollowing
              ? 'bg-slate-800 hover:bg-slate-700 text-white'
              : 'bg-slate-900 hover:bg-slate-800 text-white'
          }
        `}
        onClick={handleFollow}
        disabled={isLoading || loading}
      >
        {isFollowing ? (
          <UserCheck className="mr-1.5 h-3 w-3" />
        ) : (
          <UserPlus className="mr-1.5 h-3 w-3" />
        )}

        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : isFollowing ? (
          'Following'
        ) : (
          'Follow'
        )}
      </Button>
    </div>
  );
};

const WhoToConnectWith = ({
  users,
  isLoading,
}: {
  users: UserProfile[];
  isLoading: boolean;
}) => {
  return (
    <Card className="bg-slate-900 border-slate-800 text-white">
      <CardHeader>
        <CardTitle className="text-lg">Who to Connect With</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading &&
          [...Array(4)].map((_, i) => (
            // ... (no changes)
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}

        {!isLoading &&
          users.map((user) => (
            <div key={user.uid} className="flex items-start gap-3">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={user.profilePictureUrl} alt={user.fullName} />
                <AvatarFallback>
                  {user.fullName ? user.fullName.charAt(0) : <User />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user.fullName}</p>
                {/* --- UPDATED: Removed "No headline provided" --- */}
                <p className="text-xs text-slate-400 truncate h-4">
                  {user.professionalHeadline || ''}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Users className="h-3 w-3 text-slate-500" />
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    <span className="font-semibold text-slate-200">
                      {formatFollowerCount(user.followers?.length ?? 0)}
                    </span>
                    {' '}Followers
                  </span>
                </div>
                <div className="flex flex-nowrap items-center gap-2 mt-2">
                  {user.selectedSkills
                    ?.slice(0, 4)
                    .map((skill: string, idx: number) => {
                      const { icon, color } = getSkillData(skill);
                      return (
                        <div
                          key={idx}
                          title={skill}
                          className={`flex items-center justify-center ${color} text-base`}
                        >
                          {icon}
                        </div>
                      );
                    })}
                </div>
              </div>
              <FollowButton targetUserId={user.uid} />
            </div>
          ))}

        {!isLoading && users.length === 0 && (
          <p className="text-sm text-slate-400">No suggestions right now.</p>
        )}
      </CardContent>
    </Card>
  );
};

const TrendingTopics = ({
  topics,
  isLoading,
}: {
  topics: string[];
  isLoading: boolean;
}) => {
  // ... (no changes)
  return (
    <Card className="bg-slate-900 border-slate-800 text-white">
      <CardHeader>
        <CardTitle className="text-lg">Trending Topics</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex flex-wrap gap-2">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-20 rounded-full" />
            ))}
          </div>
        )}

        {!isLoading && topics.length === 0 && (
          <p className="text-sm text-slate-400">No trending topics yet.</p>
        )}

        {!isLoading && topics.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {topics.map((topic) => (
              <Badge key={topic} variant="secondary" className="cursor-pointer">
                <Hash className="h-3 w-3 mr-1" />
                {topic}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * =========================================================================
 * 3. CENTER COLUMN COMPONENTS
 * =========================================================================
 */

// --- 3a. Create Post ---
const CreatePost = ({
  userProfile,
  onPostCreated,
}: {
  userProfile: UserProfile;
  onPostCreated: (newPost: Post) => void;
}) => {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  // --- UPDATED: Added Post Type state ---
  const [postType, setPostType] = useState<'General' | 'Showcase' | 'Question'>('General');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // ... (no changes)
    const file = e.target.files?.[0];
    if (!file) return;

    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
    if (!apiKey) {
      console.error(
        'ImgBB API key is missing. Please set NEXT_PUBLIC_IMGBB_API_KEY in .env.local'
      );
      alert('Image upload is not configured. API key missing.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(
        `https://api.imgbb.com/1/upload?key=${apiKey}`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const result = await response.json();
      if (result.success) {
        setImageUrl(result.data.url);
      } else {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error('Error uploading to ImgBB:', error);
      alert('Image upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async () => {
    // ... (no changes other than adding new fields)
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const newPostData = {
        authorId: userProfile.uid,
        authorFullName: userProfile.fullName,
        authorHeadline: userProfile.professionalHeadline || '',
        authorProfilePictureUrl: userProfile.profilePictureUrl || '',
        authorUserType: userProfile.userType,
        isVerified: userProfile.oivpStatus?.tier0 === 'verified',
        subject: subject.trim(),
        content: content,
        postType: postType, // --- UPDATED ---
        createdAt: serverTimestamp(),
        reactions: {}, // --- ADDED ---
        commentsCount: 0, // --- ADDED ---
        mediaUrls: imageUrl ? [imageUrl] : [],
      };

      const docRef = await addDoc(collection(db, 'posts'), newPostData);
      const finalNewPost: Post = {
        ...newPostData,
        id: docRef.id,
        createdAt: Timestamp.now(),
      };

      onPostCreated(finalNewPost);
      setSubject('');
      setContent('');
      setImageUrl(null);
      setPostType('General'); // Reset post type
    } catch (error) {
      console.error('Error creating post: ', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800 text-white">
      <CardContent className="p-4 space-y-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={userProfile.profilePictureUrl}
              alt={userProfile.fullName}
            />
            <AvatarFallback>
              {userProfile.fullName ? userProfile.fullName.charAt(0) : <User />}
            </AvatarFallback>
          </Avatar>
          <div className="w-full space-y-2">
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What's the subject? (Optional)"
              className="bg-slate-800 border-slate-700 font-medium"
            />
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts or ask a question..."
              className="bg-slate-800 border-slate-700 min-h-[80px]"
            />
          </div>
        </div>

        {/* --- ADDED: Post Type Selector --- */}
        <div className="flex justify-between items-center">
          <Select 
            value={postType} 
            onValueChange={(value: 'General' | 'Showcase' | 'Question') => setPostType(value)}
          >
            <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-slate-300">
              <SelectValue placeholder="Post type" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 text-white border-slate-700">
              <SelectItem value="General">General Post</SelectItem>
              <SelectItem value="Showcase">Showcase Project</SelectItem>
              <SelectItem value="Question">Ask a Question</SelectItem>
            </SelectContent>
          </Select>
        </div>


        {imageUrl && (
          // ... (no changes)
          <div className="relative w-full h-40 rounded-lg overflow-hidden">
            <Image
              src={imageUrl}
              alt="Uploaded preview"
              layout="fill"
              objectFit="cover"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6"
              onClick={() => setImageUrl(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="flex gap-1">
            <input
              type="file"
              id="image-upload"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isUploading}
            />

            <Tooltip>
              <TooltipTrigger asChild>
                <label
                  htmlFor="image-upload"
                  className={`inline-flex items-center justify-center rounded-md text-sm font-medium h-10 w-10 text-slate-400 ${
                    isUploading
                      ? 'cursor-not-allowed'
                      : 'hover:bg-slate-800 hover:text-slate-100 cursor-pointer'
                  }`}
                >
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ImageIcon className="h-5 w-5" />
                  )}
                </label>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-800 text-white border-slate-700">
                <p>{isUploading ? 'Uploading...' : 'Add image'}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* --- UPDATED: New Professional Post Button --- */}
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting || isUploading}
            className="
              font-semibold
              bg-gradient-to-r from-blue-500 to-purple-600
              hover:from-blue-500 hover:to-purple-500
              hover:shadow-lg hover:shadow-purple-500/30
              text-white
              transition-all duration-200
              disabled:opacity-50
            "
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Post
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// --- 3b. Post Card (The main feed item) ---
const PostCard = ({ post }: { post: Post }) => {
  const { user } = useAuth();
  const [showCommentBox, setShowCommentBox] = useState(false);
  const postDate = post.createdAt?.toDate ? post.createdAt.toDate() : new Date();

  // --- ADDED: Reaction State ---
  const [reactions, setReactions] = useState<ReactionMap>(post.reactions || {});
  const isLiked = useMemo(() => user?.uid ? !!reactions[user.uid] : false, [reactions, user]);
  const likeCount = useMemo(() => Object.keys(reactions).length, [reactions]);

  // --- ADDED: Handle Reaction Function ---
  const handleReact = async () => {
    if (!user?.uid) return;
    const postRef = doc(db, 'posts', post.id);
    const newReactions = { ...reactions };
    
    if (isLiked) {
      delete newReactions[user.uid];
    } else {
      newReactions[user.uid] = 'like';
    }

    setReactions(newReactions); // Optimistic update
    await updateDoc(postRef, { reactions: newReactions });
  };

  return (
    <Card className="bg-slate-900 border-slate-800 text-white">
      <CardHeader className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={post.authorProfilePictureUrl}
              alt={post.authorFullName}
            />
            <AvatarFallback>
              {post.authorFullName ? post.authorFullName.charAt(0) : <User />}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-white">{post.authorFullName}</p>
              {post.authorUserType === 'youth' ? (
                <Badge
                  variant="outline"
                  className="text-blue-400 border-blue-400"
                >
                  Talent
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-purple-400 border-purple-400"
                >
                  Manager
                </Badge>
              )}
              {post.isVerified && (
                <CheckCircle
                  className="h-4 w-4 text-blue-500"
                  title="Verified"
                />
              )}
            </div>
            {/* --- UPDATED: Removed "No headline provided" --- */}
            <p className="text-xs text-slate-400 h-4">
              {post.authorHeadline || ''}
            </p>
            <p className="text-xs text-slate-500">
              {formatDistanceToNow(postDate, { addSuffix: true })}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Report Post</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        {post.subject && (
          <h3 className="text-lg font-semibold text-white mb-2">
            {post.subject}
          </h3>
        )}
        <p className="whitespace-pre-wrap">{post.content}</p>

        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <div className="relative w-full h-80 rounded-lg overflow-hidden mt-4 border border-slate-800">
            <Image
              src={post.mediaUrls[0]}
              alt={post.subject || 'Post image'}
              layout="fill"
              objectFit="cover"
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex flex-col items-start gap-3">
        <div className="flex gap-4 text-sm text-slate-400">
          {/* --- UPDATED: Use likeCount state --- */}
          <p>{likeCount} Reactions</p>
          <p>{post.commentsCount} Comments</p>
        </div>

        <Separator className="bg-slate-800" />
        {/* --- UPDATED: grid-cols-2 after removing bookmark --- */}
        <div className="w-full grid grid-cols-2 gap-2">
          {/* --- UPDATED: Functional React Button --- */}
          <Button 
            variant="ghost" 
            className={`
              ${isLiked ? 'text-red-500' : 'text-slate-300'}
            `}
            onClick={handleReact}
          >
            <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-red-500' : ''}`} />
            React
          </Button>
          <Button
            variant="ghost"
            className="text-slate-300"
            onClick={() => setShowCommentBox(!showCommentBox)}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Comment
          </Button>
          {/* --- REMOVED: Bookmark Button --- */}
        </div>

        {/* --- ADDED: Comment Section --- */}
        {showCommentBox && (
          <CommentSection postId={post.id} authorProfile={post} />
        )}
      </CardFooter>
    </Card>
  );
};

// --- ADDED: 3c. Comment Section ---
const CommentSection = ({ postId, authorProfile }: { postId: string, authorProfile: Post }) => {
  const { user, userProfile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  // Fetch top-level comments
  useEffect(() => {
    const q = query(
      collection(db, 'posts', postId, 'comments'),
      where('replyToCommentId', '==', null),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      setComments(fetchedComments);
      setIsLoadingComments(false);
    });

    return () => unsubscribe();
  }, [postId]);

  const handlePostComment = async () => {
    if (!newComment.trim() || !user || !userProfile) return;

    setIsPostingComment(true);
    try {
      const commentData = {
        authorId: user.uid,
        authorFullName: userProfile.fullName,
        authorHeadline: userProfile.professionalHeadline || '',
        authorProfilePictureUrl: userProfile.profilePictureUrl || '',
        content: newComment,
        createdAt: serverTimestamp(),
        reactions: {},
        replyToCommentId: null,
      };
      
      // Add the new comment
      await addDoc(collection(db, 'posts', postId, 'comments'), commentData);
      
      // Increment the commentsCount on the post
      await updateDoc(doc(db, 'posts', postId), {
        commentsCount: increment(1)
      });
      
      setNewComment('');
    } catch (error) {
      console.error("Error posting comment: ", error);
    } finally {
      setIsPostingComment(false);
    }
  };

  return (
    <div className="w-full pt-2 space-y-4">
      {/* New Comment Input */}
      <div className="flex gap-2">
        <Avatar className="h-9 w-9">
          <AvatarImage src={userProfile?.profilePictureUrl} />
          <AvatarFallback>
            {userProfile?.fullName ? userProfile.fullName.charAt(0) : <User />}
          </AvatarFallback>
        </Avatar>
        <Input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="bg-slate-800 border-slate-700"
          disabled={isPostingComment}
        />
        <Button size="icon" className="flex-shrink-0" onClick={handlePostComment} disabled={isPostingComment || !newComment.trim()}>
          {isPostingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>

      {/* Existing Comments */}
      <div className="space-y-4">
        {isLoadingComments && <Loader2 className="h-5 w-5 animate-spin mx-auto" />}
        {comments.map(comment => (
          <CommentCard key={comment.id} comment={comment} postId={postId} />
        ))}
      </div>
    </div>
  );
};

// --- ADDED: 3d. Comment Card (for individual comments and replies) ---
const CommentCard = ({ comment, postId }: { comment: Comment, postId: string }) => {
  const { user, userProfile } = useAuth();
  const [replies, setReplies] = useState<Comment[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [newReply, setNewReply] = useState('');
  const [isPostingReply, setIsPostingReply] = useState(false);

  const [reactions, setReactions] = useState<ReactionMap>(comment.reactions || {});
  const isLiked = useMemo(() => user?.uid ? !!reactions[user.uid] : false, [reactions, user]);
  const likeCount = useMemo(() => Object.keys(reactions).length, [reactions]);
  
  const commentDate = comment.createdAt?.toDate ? comment.createdAt.toDate() : new Date();

  // Fetch replies for this comment
  useEffect(() => {
    // Only fetch replies for top-level comments
    if (comment.replyToCommentId === null) {
      setIsLoadingReplies(true);
      const q = query(
        collection(db, 'posts', postId, 'comments'),
        where('replyToCommentId', '==', comment.id),
        orderBy('createdAt', 'asc')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedReplies = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Comment[];
        setReplies(fetchedReplies);
        setIsLoadingReplies(false);
      });

      return () => unsubscribe();
    }
  }, [postId, comment.id, comment.replyToCommentId]);

  const handleLikeComment = async () => {
    if (!user?.uid) return;
    const commentRef = doc(db, 'posts', postId, 'comments', comment.id);
    const newReactions = { ...reactions };
    
    if (isLiked) {
      delete newReactions[user.uid];
    } else {
      newReactions[user.uid] = 'like';
    }

    setReactions(newReactions); // Optimistic update
    await updateDoc(commentRef, { reactions: newReactions });
  };

  const handlePostReply = async () => {
    if (!newReply.trim() || !user || !userProfile) return;

    setIsPostingReply(true);
    try {
      const replyData = {
        authorId: user.uid,
        authorFullName: userProfile.fullName,
        authorHeadline: userProfile.professionalHeadline || '',
        authorProfilePictureUrl: userProfile.profilePictureUrl || '',
        content: newReply,
        createdAt: serverTimestamp(),
        reactions: {},
        replyToCommentId: comment.id, // --- This makes it a reply ---
      };
      
      await addDoc(collection(db, 'posts', postId, 'comments'), replyData);
      
      // Also increment the main post's comment count
      await updateDoc(doc(db, 'posts', postId), {
        commentsCount: increment(1)
      });

      setNewReply('');
      setShowReplyBox(false);
    } catch (error) {
      console.error("Error posting reply: ", error);
    } finally {
      setIsPostingReply(false);
    }
  };


  return (
    <div className="flex gap-2">
      <Avatar className="h-9 w-9">
        <AvatarImage src={comment.authorProfilePictureUrl} />
        <AvatarFallback>
          {comment.authorFullName ? comment.authorFullName.charAt(0) : <User />}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="font-semibold text-sm text-white">{comment.authorFullName}</p>
          <p className="text-xs text-slate-400 h-4">{comment.authorHeadline || ''}</p>
          <p className="text-sm text-slate-200 mt-1">{comment.content}</p>
        </div>
        <div className="flex items-center gap-2 pl-3">
          <span className="text-xs text-slate-500">{formatDistanceToNow(commentDate, { addSuffix: true })}</span>
          <Button variant="link" className="text-xs h-auto p-0 text-slate-400" onClick={handleLikeComment}>
            {isLiked ? 'Unlike' : 'Like'} ({likeCount})
          </Button>
          {/* Only allow replying to top-level comments */}
          {comment.replyToCommentId === null && (
            <Button variant="link" className="text-xs h-auto p-0 text-slate-400" onClick={() => setShowReplyBox(!showReplyBox)}>
              Reply
            </Button>
          )}
        </div>

        {/* --- Render Replies --- */}
        {replies.length > 0 && (
          <div className="space-y-2 pt-2">
            {replies.map(reply => (
              // This renders the same component, but it won't fetch its own replies
              <CommentCard key={reply.id} comment={reply} postId={postId} />
            ))}
          </div>
        )}
        {isLoadingReplies && <Loader2 className="h-4 w-4 animate-spin" />}

        {/* --- Reply Input Box --- */}
        {showReplyBox && (
          <div className="flex gap-2 pt-2">
            <Avatar className="h-9 w-9">
              <AvatarImage src={userProfile?.profilePictureUrl} />
              <AvatarFallback>
                {userProfile?.fullName ? userProfile.fullName.charAt(0) : <User />}
              </AvatarFallback>
            </Avatar>
            <Input
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              placeholder={`Reply to ${comment.authorFullName}...`}
              className="bg-slate-800 border-slate-700 h-9"
              disabled={isPostingReply}
            />
            <Button size="icon" className="h-9 w-9 flex-shrink-0" onClick={handlePostReply} disabled={isPostingReply || !newReply.trim()}>
              {isPostingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};


/**
 * =========================================================================
 * 4. MAIN PAGE COMPONENT
 * =========================================================================
 */

export default function CommunityPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [activeFilter, setActiveFilter] = useState('all');

  // --- Data States ---
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);

  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // --- Data Fetching ---
  useEffect(() => {
    // --- UPDATED: fetchPosts (Now filters) ---
    const fetchPosts = async () => {
      setIsLoadingPosts(true);
      try {
        const basePostsQuery = collection(db, 'posts');
        let postsQuery;

        // Apply filters
        switch (activeFilter) {
          case 'managers':
            postsQuery = query(
              basePostsQuery,
              where('authorUserType', '==', 'manager'),
              orderBy('createdAt', 'desc'),
              limit(20)
            );
            break;
          case 'talent':
            postsQuery = query(
              basePostsQuery,
              where('authorUserType', '==', 'youth'),
              orderBy('createdAt', 'desc'),
              limit(20)
            );
            break;
          case 'showcase':
            postsQuery = query(
              basePostsQuery,
              where('postType', '==', 'Showcase'),
              orderBy('createdAt', 'desc'),
              limit(20)
            );
            break;
          case 'questions':
            postsQuery = query(
              basePostsQuery,
              where('postType', '==', 'Question'),
              orderBy('createdAt', 'desc'),
              limit(20)
            );
            break;
          case 'all':
          default:
            postsQuery = query(
              basePostsQuery,
              orderBy('createdAt', 'desc'),
              limit(20)
            );
        }
        
        // Use onSnapshot to listen for real-time updates (e.g., new reactions/comments)
        const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
          const postsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Post[];
          setPosts(postsData);
          setIsLoadingPosts(false);
        }, (error) => {
          console.error('Error fetching posts:', error);
          setIsLoadingPosts(false);
        });

        return () => unsubscribe(); // Detach listener on cleanup

      } catch (error) {
        console.error('Error fetching posts:', error);
        setIsLoadingPosts(false);
      }
    };

    const fetchTopics = async () => {
      // ... (no changes)
      setIsLoadingTopics(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setTrendingTopics(['React', 'SierraLeone', 'Hiring', 'UIUX', 'Jobs']);
      } catch (error) {
        console.error('Error fetching topics:', error);
      } finally {
        setIsLoadingTopics(false);
      }
    };

    const fetchUsers = async () => {
      // ... (no changes)
      if (!user) return;
      setIsLoadingUsers(true);
      try {
        const usersLimit = 4;
        const allUsersQuery = query(
          collection(db, 'users'),
          where('uid', '!=', user.uid)
        );
        const allUsersSnapshot = await getDocs(allUsersQuery);
        const totalUsersCount = allUsersSnapshot.size;

        if (totalUsersCount === 0) {
          setSuggestedUsers([]);
          setIsLoadingUsers(false);
          return;
        }

        let randomStartPoint = 0;
        if (totalUsersCount > usersLimit) {
          randomStartPoint = Math.floor(
            Math.random() * (totalUsersCount - usersLimit)
          );
        }

        const baseQuery = query(
          collection(db, 'users'),
          where('uid', '!=', user.uid),
          orderBy('createdAt', 'desc')
        );

        let startAfterDoc = null;
        if (randomStartPoint > 0) {
          const skipQuery = query(baseQuery, limit(randomStartPoint));
          const skipSnapshot = await getDocs(skipQuery);
          if (!skipSnapshot.empty) {
            startAfterDoc = skipSnapshot.docs[skipSnapshot.docs.length - 1];
          }
        }

        let finalUsersQuery;
        if (startAfterDoc) {
          finalUsersQuery = query(
            baseQuery,
            startAfter(startAfterDoc),
            limit(usersLimit)
          );
        } else {
          finalUsersQuery = query(baseQuery, limit(usersLimit));
        }

        const snapshot = await getDocs(finalUsersQuery);
        let usersData = snapshot.docs.map(
          (doc) => doc.data() as UserProfile
        );

        if (usersData.length < usersLimit && totalUsersCount >= usersLimit) {
          const fillQuery = query(baseQuery, limit(usersLimit));
          const fillSnapshot = await getDocs(fillQuery);
          usersData = fillSnapshot.docs.map(
            (doc) => doc.data() as UserProfile
          );
        }

        setSuggestedUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
        const fallbackQuery = query(
          collection(db, 'users'),
          where('uid', '!=', user.uid),
          limit(4)
        );
        const fallbackSnapshot = await getDocs(fallbackQuery);
        setSuggestedUsers(
          fallbackSnapshot.docs.map((doc) => doc.data() as UserProfile)
        );
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchPosts();
    fetchTopics();
    fetchUsers();
  }, [activeFilter, user]);

  // --- Handlers ---
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
  };

  const handlePostCreated = (newPost: Post) => {
    // No longer needed, onSnapshot will add the post
    // setPosts([newPost, ...posts]); 
  };

  // --- Render Logic ---
  if (authLoading || !userProfile) {
    // ... (no changes)
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-white" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="bg-slate-950 min-h-screen text-white p-4 md:p-8">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight">Community Hub</h1>
            <p className="text-lg text-slate-400">
              Connect, share, and learn from other professionals.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* --- LEFT COLUMN --- */}
            <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-24 h-fit">
              <MyProfileSnippet profile={userProfile} />
              <FeedFilters
                activeFilter={activeFilter}
                onFilterChange={handleFilterChange}
              />
            </aside>

            {/* --- CENTER COLUMN --- */}
            <main className="lg:col-span-2 space-y-6 lg:order-none order-last">
              <CreatePost
                userProfile={userProfile}
                onPostCreated={handlePostCreated}
              />

              <Separator className="bg-slate-800" />

              {/* Feed Skeletons */}
              {isLoadingPosts && (
                <div className="space-y-6">
                  <Skeleton className="h-64 w-full rounded-lg bg-slate-900" />
                  <Skeleton className="h-48 w-full rounded-lg bg-slate-900" />
                </div>
              )}

              {/* Empty Feed */}
              {!isLoadingPosts && posts.length === 0 && (
                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-10 text-center text-slate-400">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white">
                      It's quiet in here...
                    </h3>
                    <p>Be the first to start a conversation!</p>
                  </CardContent>
                </Card>
              )}

              {/* The Real Feed */}
              {!isLoadingPosts && posts.length > 0 && (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                  {/* TODO: Add a "Load More" button or infinite scroll observer */}
                </div>
              )}
            </main>

            {/* --- RIGHT COLUMN --- */}
            <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-24 h-fit">
              <WhoToConnectWith
                users={suggestedUsers}
                isLoading={isLoadingUsers}
              />
              <TrendingTopics
                topics={trendingTopics}
                isLoading={isLoadingTopics}
              />
            </aside>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}