
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/types';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  writeBatch,
  arrayUnion,
  arrayRemove,
  orderBy,
  QueryOrderByConstraint,
} from '@firebase/firestore';
import { FaSearch, FaSpinner, FaRandom, FaChevronDown, FaArrowLeft } from 'react-icons/fa';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TalentProfileCard } from '@/components/talent/TalentProfileCard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


// --- Define Your Categories ---
const CATEGORY_GROUPS = [
  {
    groupTitle: 'Tech Roles & Disciplines',
    skills: [
      'Agile Methodologies', 'API Development', 'Cloud Architecture', 'Cloud Computing',
      'Cybersecurity', 'Database Management', 'Data Visualization', 'DevOps Engineering',
      'Full-Stack Development', 'Machine Learning', 'Mobile Development', 'Motion Graphics',
      'Project Management', 'Software Testing and QA', 'Technical Writing', 'UI/UX Design',
    ],
  },
  {
    groupTitle: 'Programming Languages & Tools',
    skills: ['AWS', 'CSS3', 'Docker', 'Figma', 'HTML5', 'Javascript', 'Node.js', 'Python', 'React'],
  },
  {
    groupTitle: 'Creative & Performance',
    skills: ['Design (Graphic, Fashion, Interior)', 'Painting', 'Performance & Media (Music, Videography, Acting)'],
  },
  {
    groupTitle: 'Crafts & Vocational',
    skills: ['Baking', 'Carpentry', 'Mechanics', 'Plumbing', 'Tailoring', 'Welding'],
  },
  {
    groupTitle: 'Services & Instruction',
    skills: ['Fitness', 'Hair Styling', 'Tutoring'],
  },
];

// --- Skills for the Quick Filter bar ---
const QUICK_FILTER_SKILLS = [
    'UI/UX Design', 'React', 'Node.js', 'Python', 'Full-Stack Development', 'Figma', 'DevOps Engineering', 'Videography', 'Music'
];


// --- Helper function to create scroll-friendly IDs ---
const createAnchorId = (title: string) => title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();

// --- Sidebar Component ---
const CategorySidebar: React.FC<{ categoryGroups: typeof CATEGORY_GROUPS }> = ({ categoryGroups }) => {
  return (
    <aside className="hidden lg:block w-64 flex-shrink-0 h-full overflow-y-auto p-4 pr-6 border-r border-slate-800 custom-scrollbar">
        <h3 className="text-lg font-semibold text-white mb-4 sticky top-0 bg-slate-950 py-2">Categories</h3>
        <nav className="space-y-4 text-sm">
            {categoryGroups.map(group => (
                <div key={group.groupTitle}>
                    <h4 className="font-bold text-slate-300 mb-2">{group.groupTitle}</h4>
                    <ul className="space-y-1 pl-2">
                        {group.skills.map(skill => (
                            <li key={skill}>
                                <a href={`#${createAnchorId(skill)}`} className="text-slate-400 hover:text-blue-400 transition-colors">
                                    {skill}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </nav>
    </aside>
  );
};


// --- Talent Category Row Component ---
interface TalentCategoryRowProps {
  title: string;
  talents: UserProfile[];
  followingStatus: { [key: string]: boolean };
  onFollow: (targetUserId: string) => void;
  isFeatured?: boolean;
}

const TalentCategoryRow: React.FC<TalentCategoryRowProps> = ({ title, talents, followingStatus, onFollow, isFeatured = false }) => {
  if (talents.length === 0) {
    return null; // Don't render empty categories
  }

  return (
    <div className="space-y-4 scroll-mt-24" id={!isFeatured ? createAnchorId(title) : undefined}>
      <h2 className={`text-2xl font-bold text-white ${isFeatured ? 'text-yellow-400' : ''}`}>
        {title}
      </h2>
      <div className="relative">
        <div className="flex flex-row gap-6 overflow-x-auto pb-4 custom-scrollbar">
          {talents.map((talent, index) => (
            <TalentProfileCard
              key={talent.uid}
              talent={talent}
              isFollowing={followingStatus[talent.uid]}
              onFollow={onFollow}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Main Talent Page Component ---
export default function TalentPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [allTalent, setAllTalent] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [followingStatus, setFollowingStatus] = useState<{ [key: string]: boolean }>({});
  const [sortBy, setSortBy] = useState<'createdAt' | 'followers'>('createdAt');
  const [activeSkillFilters, setActiveSkillFilters] = useState<string[]>([]);

  // Fetch all talent on load
  useEffect(() => {
    const fetchAllTalent = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const orderConstraint: QueryOrderByConstraint = sortBy === 'createdAt' 
          ? orderBy('createdAt', 'desc') 
          : orderBy('followerCount', 'desc');

        const talentQuery = query(
          collection(db, 'users'), 
          where('userType', '==', 'youth'),
          where('uid', '!=', user.uid),
          orderConstraint
        );

        const snapshot = await getDocs(talentQuery);
        let talents = snapshot.docs.map(doc => doc.data() as UserProfile);

        if (sortBy === 'followers' && !snapshot.docs.some(doc => 'followerCount' in doc.data())) {
            talents.sort((a, b) => (b.followers?.length || 0) - (a.followers?.length || 0));
        }

        setAllTalent(talents);
      } catch (error) {
        console.error('Failed to fetch all talent:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllTalent();
  }, [user, sortBy]);

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

  // --- Search & Filter Logic ---
  const filteredTalent = useMemo(() => {
    const query = searchQuery.toLowerCase();
    
    return allTalent
      .filter(talent => { // Text search filter
        if (!query) return true;
        return (
          talent.fullName?.toLowerCase().includes(query) ||
          talent.primarySkill?.toLowerCase().includes(query) ||
          talent.selectedSkills?.some(skill => skill.toLowerCase().includes(query))
        );
      })
      .filter(talent => { // Active skill filters (AND logic)
        if (activeSkillFilters.length === 0) return true;
        const userSkills = new Set([
          talent.primarySkill,
          ...(talent.selectedSkills || [])
        ].filter(Boolean));
        return activeSkillFilters.every(filterSkill => userSkills.has(filterSkill));
      });
  }, [searchQuery, allTalent, activeSkillFilters]);

  const featuredTalent = useMemo(() => {
    const baseListForFeatured = (searchQuery || activeSkillFilters.length > 0) ? filteredTalent : allTalent;
    return [...baseListForFeatured].sort(() => 0.5 - Math.random()).slice(0, 10);
  }, [filteredTalent, allTalent, searchQuery, activeSkillFilters]);

  const handleSkillFilterToggle = (skillToToggle: string) => {
    setActiveSkillFilters(prev => 
      prev.includes(skillToToggle)
        ? prev.filter(s => s !== skillToToggle)
        // Ensure no duplicates if skill is somehow added again
        : [...new Set([...prev, skillToToggle])]
    );
  };


  // --- Shuffle Logic ---
  const handleShuffle = () => {
    setAllTalent(prevTalent => [...prevTalent].sort(() => Math.random() - 0.5));
  };

  // --- Follow/Unfollow Logic ---
  const handleFollow = async (targetUserId: string) => {
    if (!user?.uid) return;

    const currentUserId = user.uid;
    const currentUserRef = doc(db, 'users', user.uid);
    const targetUserRef = doc(db, 'users', targetUserId);
    const isCurrentlyFollowing = followingStatus[targetUserId] || false;

    setFollowingStatus(prev => ({ ...prev, [targetUserId]: !isCurrentlyFollowing }));

    try {
      const batch = writeBatch(db);
      if (isCurrentlyFollowing) {
        batch.update(currentUserRef, { following: arrayRemove(targetUserId) });
        batch.update(targetUserRef, { followers: arrayRemove(currentUserId), followerCount: (allTalent.find(t=>t.uid===targetUserId)?.followers?.length || 1) - 1 });
      } else {
        batch.update(currentUserRef, { following: arrayUnion(targetUserId) });
        batch.update(targetUserRef, { followers: arrayUnion(currentUserId), followerCount: (allTalent.find(t=>t.uid===targetUserId)?.followers?.length || 0) + 1 });
      }
      await batch.commit();
      
      setAllTalent(prevList =>
        prevList.map(talent => {
          if (talent.uid === targetUserId) {
            const currentFollowers = talent.followers || [];
            return {
              ...talent,
              followers: isCurrentlyFollowing
                ? currentFollowers.filter(uid => uid !== currentUserId)
                : [...currentFollowers, currentUserId],
            };
          }
          return talent;
        })
      );

    } catch (error) {
      console.error('Failed to update follow status:', error);
      setFollowingStatus(prev => ({ ...prev, [targetUserId]: isCurrentlyFollowing })); // Revert on failure
    }
  };

  if (isLoading) {
    return (
      <div className="flex w-full h-screen items-center justify-center bg-slate-950">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-var(--header-height,4rem))] w-full bg-slate-950 text-white">
      <CategorySidebar categoryGroups={CATEGORY_GROUPS} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
          {/* --- Sticky Header --- */}
          <div className="flex-shrink-0 p-4 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Explore Talent
              </h1>
              <Button 
                variant="outline" 
                className="h-10 bg-slate-800 border-slate-700 hover:bg-slate-700"
                onClick={() => router.push('/dashboard')}
              >
                <FaArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>

            {/* --- Controls Section --- */}
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="relative flex-1 max-w-lg">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search by name, skill, or role..."
                  className="bg-slate-800 border-slate-700 pl-10 pr-4 py-2 h-12"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-12 bg-slate-800 border-slate-700 hover:bg-slate-700 flex-shrink-0">
                    Sort by: {sortBy === 'createdAt' ? 'Newest' : 'Most Followers'}
                    <FaChevronDown className="ml-2 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-slate-800 border-slate-700 text-white">
                  <DropdownMenuItem onSelect={() => setSortBy('createdAt')}>Newest Members</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setSortBy('followers')}>Most Followers</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button 
                variant="outline" 
                className="h-12 bg-slate-800 border-slate-700 hover:bg-slate-700 flex-shrink-0"
                onClick={handleShuffle}
              >
                <FaRandom className="mr-2 h-4 w-4 text-blue-400" />
                Shuffle
              </Button>
            </div>

            {/* --- Advanced Quick Filters --- */}
            <div className="flex flex-wrap gap-2 mt-4 items-center">
                <span className="text-sm font-semibold mr-2 text-slate-300">Quick Filters:</span>
                 <Badge
                    variant={activeSkillFilters.length === 0 ? 'default' : 'secondary'}
                    onClick={() => setActiveSkillFilters([])}
                    className="cursor-pointer transition-colors"
                >
                    All
                </Badge>
                {QUICK_FILTER_SKILLS.map(skill => (
                    <Badge
                        key={skill}
                        variant={activeSkillFilters.includes(skill) ? 'default' : 'secondary'}
                        onClick={() => handleSkillFilterToggle(skill)}
                        className="cursor-pointer transition-colors"
                    >
                        {skill}
                    </Badge>
                ))}
            </div>

          </div>

          {/* --- Scrollable Content --- */}
          <div className="flex-1 overflow-y-auto px-6 md:px-8 py-8">
            <div className="space-y-12">
              <TalentCategoryRow
                title="✨ Featured Talent"
                talents={featuredTalent}
                followingStatus={followingStatus}
                onFollow={handleFollow}
                isFeatured
              />

              {CATEGORY_GROUPS.map(group => {
                const hasTalentInGroup = group.skills.some(skillName => 
                  filteredTalent.some(talent => talent.primarySkill === skillName || talent.selectedSkills?.includes(skillName))
                );

                if ((searchQuery || activeSkillFilters.length > 0) && !hasTalentInGroup) {
                  return null;
                }

                return (
                  <div key={group.groupTitle} className="space-y-8">
                    <h2 className="text-3xl font-bold text-white border-b border-slate-700 pb-2">
                      {group.groupTitle}
                    </h2>
                    
                    {!hasTalentInGroup && !searchQuery && activeSkillFilters.length === 0 && (
                      <p className="text-slate-500 pl-2">No talent listed in this category yet.</p>
                    )}

                    {group.skills.map(skillName => {
                      const talentsForSkill = filteredTalent.filter(talent => 
                          talent.selectedSkills?.includes(skillName) ||
                          talent.primarySkill === skillName
                      );
                      
                      return (
                        <TalentCategoryRow
                          key={skillName}
                          title={skillName}
                          talents={talentsForSkill}
                          followingStatus={followingStatus}
                          onFollow={handleFollow}
                        />
                      );
                    })}
                  </div>
                );
              })}

              {filteredTalent.length === 0 && !isLoading && (
                <div className="text-center text-slate-400 text-lg py-20">
                  <p className="text-2xl mb-2">No talent found.</p>
                  <p>Try adjusting your search or filter criteria.</p>
                </div>
              )}
            </div>
          </div>
      </main>
    </div>
  );
}
