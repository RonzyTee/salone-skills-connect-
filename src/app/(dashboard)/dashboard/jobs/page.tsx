'use client';

import { useState, useEffect } from 'react';
import { FaSpinner, FaMapMarkerAlt, FaBuilding } from 'react-icons/fa';
import { RiBriefcase4Fill } from 'react-icons/ri'; // Icon for the page title

// --- Job Interface ---
// We define a new type for what a 'Job' looks like
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  skills: string[]; // For "skills required"
  category: string;
  logoUrl: string; // To show a company logo
}

// --- Categories from your list ---
const CATEGORIES = [
  'Agile Methodologies',
  'API Development',
  'Cloud Architecture',
  'Cloud Computing',
  'Cybersecurity',
  'Database Management',
  'Data Visualization',
  'DevOps Engineering',
];

// --- Dummy Data Generation for Jobs ---
const allSkills = ['React', 'Node.js', 'Python', 'Docker', 'AWS', 'Javascript', 'Terraform', 'SQL', 'NoSQL', 'CI/CD', 'Kubernetes', 'Go', 'Next.js', 'Security Auditing', 'Penetration Testing', 'Figma', 'PowerBI', 'Tableau', 'Scrum', 'Kanban'];
const allJobTitles = ['Software Engineer', 'Product Manager', 'Cloud Architect', 'DevOps Engineer', 'Security Analyst', 'Database Administrator', 'Data Analyst', 'Frontend Developer', 'Backend Developer', 'Full-Stack Developer'];
const allCompanies = ['TechCorp', 'DataSolutions', 'Cloudify', 'SecureNet', 'Innovatech', 'CodeBase', 'NextGen AI', 'QuantumSys'];
const allLocations = ['Remote', 'New York, NY', 'San Francisco, CA', 'Austin, TX', 'London, UK'];
// Using a service to get real company logos for a better look
const DUMMY_LOGOS = [
  'https://logo.clearbit.com/google.com',
  'https://logo.clearbit.com/meta.com',
  'https://logo.clearbit.com/amazon.com',
  'https://logo.clearbit.com/microsoft.com',
  'https://logo.clearbit.com/salesforce.com',
  'https://logo.clearbit.com/netflix.com',
  'https://logo.clearbit.com/spotify.com',
  'https://logo.clearbit.com/github.com',
];

// Helper to get random items
const getRandomItems = (arr: string[], count: number) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Helper to get a single random item
const getRandomItem = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

// Helper to generate all dummy jobs
const generateDummyJobs = (): Job[] => {
  const jobs: Job[] = [];
  let idCounter = 1;

  CATEGORIES.forEach(category => {
    // Generate 5 jobs per category, as requested
    for (let i = 0; i < 5; i++) { 
      jobs.push({
        id: `job_${idCounter++}`,
        title: `${getRandomItem(allJobTitles)}`,
        company: getRandomItem(allCompanies),
        location: getRandomItem(allLocations),
        logoUrl: getRandomItem(DUMMY_LOGOS),
        skills: getRandomItems(allSkills, Math.floor(Math.random() * 3) + 3), // 3-5 skills
        category: category,
      });
    }
  });
  return jobs;
};
// --- End of Dummy Data ---

// --- Apply Button Component (with Tooltip) ---
// This component handles the "disabled" state and the "Coming Soon" hover effect.
const DisabledApplyButton = () => {
  return (
    // 'group' utility class allows us to show the tooltip when hovering the wrapper div
    <div className="relative group inline-block mt-4 w-full">
      {/* The disabled button */}
      <button
        disabled
        className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg opacity-50 cursor-not-allowed w-full"
      >
        Apply Now
      </button>
      
      {/* The "Coming Soon" tooltip */}
      <div 
        className="absolute hidden group-hover:block 
                   bg-gray-800 text-white text-xs rounded 
                   py-1 px-3 
                   bottom-full left-1/2 -translate-x-1/2 mb-2
                   whitespace-nowrap
                   pointer-events-none" // Prevents tooltip from interfering with hover
      >
        Coming Soon
        {/* Tooltip arrow */}
        <svg className="absolute text-gray-800 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255">
          <polygon className="fill-current" points="0,0 127.5,127.5 255,0"/>
        </svg>
      </div>
    </div>
  );
};


// --- Job Card Component ---
// This replaces your 'ProductCard'. It's designed to display Job data.
interface JobCardProps {
  job: Job;
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
  return (
    <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden flex flex-col h-full p-5 text-left">
      {/* Card Header: Logo, Title, Company */}
      <div className="flex items-center mb-4">
        <img src={job.logoUrl} alt={`${job.company} logo`} className="w-12 h-12 rounded-full mr-4 bg-white p-1" />
        <div>
          <h3 className="text-lg font-bold text-white truncate" title={job.title}>{job.title}</h3>
          <p className="text-sm text-slate-400 flex items-center">
            <FaBuilding className="mr-2 flex-shrink-0" /> {job.company}
          </p>
        </div>
      </div>

      {/* Location */}
      <p className="text-sm text-slate-300 flex items-center mb-4">
        <FaMapMarkerAlt className="mr-2 flex-shrink-0" /> {job.location}
      </p>

      {/* Skills (flex-grow ensures this section fills available space) */}
      <div className="flex-grow">
        <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Skills Required</h4>
        <div className="flex flex-wrap gap-2">
          {job.skills.map(skill => (
            <span
              key={skill}
              className="bg-slate-700 text-blue-300 text-xs font-medium px-2.5 py-0.5 rounded-full"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
      
      {/* Disabled Apply Button (at the bottom) */}
      <DisabledApplyButton />
    </div>
  );
};

// --- Job Category Row Component ---
// This replaces your 'CategoryRow'
interface JobCategoryRowProps {
  title: string;
  jobs: Job[];
}

const JobCategoryRow: React.FC<JobCategoryRowProps> = ({ title, jobs }) => {
  if (jobs.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <div>
        {/* Using your responsive grid, but changed max columns to 5 for better card fit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {jobs.map(job => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Main Job Search Page Component ---
// This replaces your 'MarketplacePage'
export default function JobSearchPage() {
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate a small network delay for the loading spinner
    setTimeout(() => {
      const jobs = generateDummyJobs();
      setAllJobs(jobs);
      setIsLoading(false);
    }, 500); // 500ms delay
  }, []);

  if (isLoading) {
    return (
      <div className="flex w-full min-h-screen bg-slate-950 items-center justify-center p-10">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white p-6 md:p-8 space-y-12">
      <h1 className="text-4xl font-bold tracking-tight text-white flex items-center">
        <RiBriefcase4Fill className="mr-3 text-blue-400" />
        Job Board
      </h1>

      {/* Render a row for each category */}
      {CATEGORIES.map(category => {
        const jobsForCategory = allJobs.filter(
          j => j.category === category
        );
        return (
          <JobCategoryRow
            key={category}
            title={category}
            jobs={jobsForCategory}
          />
        );
      })}
    </div>
  );
}