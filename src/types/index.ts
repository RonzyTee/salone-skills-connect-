// This interface is designed to be compatible with Firebase Timestamps
// which have a toDate() method, but also works with standard JS Date objects.
export interface FirebaseTimestamp {
  toDate: () => Date;
}

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  fullNameLastUpdatedAt?: FirebaseTimestamp | Date;
  profilePictureUrl?: string;
  coverPhotoUrl?: any; // For 'youth' users
  userType: 'youth' | 'manager';
  location?: string; // For 'youth' users
  bio?: string; // For 'youth' users

  oivpStatus?: {
    tier0?: 'verified' | 'pending' | 'unverified' | 'locked';
    tier1?: 'verified' | 'pending' | 'unverified' | 'locked';
    tier2?: 'verified' | 'pending' | 'unverified' | 'locked';
  };
  projectsCount?: number;
  endorsementsCount?: number;
  primarySkill?: string;
  selectedSkills?: string[];

  githubUrl?: string;
  linkedinUrl?: string;
  whatsappNumber?: string;
  socialLinks?: {
    github?: string;
    linkedin?: string;
    website?: string;
  };

  followers?: string[];
  following?: string[];

  // --- FIELDS FOR 'manager' ---
  organizationName?: string;
  organizationLogoUrl?: string;
  organizationCoverPhotoUrl?: string;
  industry?: string;
  aboutOrganization?: string;
  physicalAddress?: string;
  businessEmail?: string;
  phoneNumber?: string;
  businessRegDocUrl?: string;
  organizationWebsite?: string;
  teamSize?: string; // Added from your dashboard code
  jobsPostedCount?: number; // Added from your dashboard code
  profileViews?: number; // Added from your dashboard code
  
  organizationSocialLinks?: {
    website?: string;
    linkedin?: string;
  };
  // --- END OF MANAGER FIELDS ---

  createdAt?: FirebaseTimestamp | Date;
}

// --- NEW TYPE ADDED ---
// This is used by your RecentMessagesCard
export interface ChatParticipant {
  uid: string;
  fullName?: string;
  profilePictureUrl?: string;
  organizationName?: string;
  organizationLogoUrl?: string;
  userType: 'youth' | 'manager';
  oivpStatus?: {
    tier0?: 'verified' | 'pending' | 'unverified';
    tier1?: 'verified' | 'pending' | 'unverified';
    tier2?: 'verified' | 'pending' | 'unverified';
  };
}


export interface Post {
  id: string;
  content: string;
  author: Pick<UserProfile, 'uid' | 'fullName' | 'profilePictureUrl'>;
  createdAt: FirebaseTimestamp | Date;
  repliesCount: number;
}
