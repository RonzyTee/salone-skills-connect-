import { Timestamp } from 'firebase/firestore';

// Defines the structure for a Job in your 'jobs' collection
export interface Job {
  jobId: string; // The Firestore document ID
  organizationId: string; // The manager's user UID
  organizationName: string; // The manager's organization name
  organizationLogoUrl?: string; // The org logo

  jobTitle: string;
  jobType: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  location: 'On-site' | 'Remote' | 'Hybrid';
  salaryRange?: string; // e.g., "$500 - $700 / month"
  
  jobDescription: string;
  requiredSkills: string[]; // An array of skill strings
  
  createdAt: Timestamp;
  applicationDeadline?: Timestamp;
  
  status: 'Open' | 'Closed'; // To manage if the job is active
  
  // This is the crucial part for your "see applicants" feature
  applicants: Array<{
    uid: string; // The youth's UID
    name: string;
    profilePictureUrl?: string;
    appliedAt: Timestamp;
    // You could add more here, like a cover letter or resume link
  }>;
}