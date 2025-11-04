'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { Job } from '@/types/jobs'; // Corrected import path
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Loader from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FaPlus, FaUsers, FaMapPin } from 'react-icons/fa';
import toast from 'react-hot-toast';

// We need to add the document 'id' to the Job type for our links
type JobWithId = Job & { id: string };

export default function MyJobsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [jobs, setJobs] = useState<JobWithId[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login'); // Redirect if not logged in
      return;
    }

    setLoading(true);
    
    // Create the query
    const jobsRef = collection(db, 'jobs');
    const q = query(jobsRef, where("organizationId", "==", user.uid));

    // Use onSnapshot for real-time updates
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userJobs: JobWithId[] = [];
      querySnapshot.forEach((doc) => {
        userJobs.push({ ...(doc.data() as Job), id: doc.id });
      });
      
      // Sort jobs by creation date, newest first (if createdAt exists)
      if (userJobs.length > 0 && userJobs[0].createdAt) {
        userJobs.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
      }
      
      setJobs(userJobs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to load your jobs.");
      setLoading(false);
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();

  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">My Job Postings</h1>
          <p className="text-slate-400">Manage your posted jobs and view applicants.</p>
        </div>
        
        {/* --- LINK MODIFIED HERE --- */}
        <Button onClick={() => router.push('/dashboard/manager/post-job')}>
          <FaPlus className="mr-2 h-4 w-4" /> Post a New Job
        </Button>
      </div>

      {/* Jobs List */}
      {jobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <Card key={job.id} className="bg-slate-900 border-slate-800 text-white flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">{job.jobTitle}</CardTitle>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge>{job.jobType}</Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <FaMapPin className="h-3 w-3" /> {job.location}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-slate-400 line-clamp-3">
                  {job.jobDescription}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-slate-300">
                  <FaUsers />
                  <span>{job.applicants.length} Applicant(s)</span>
                </div>
                <Button asChild variant="outline">
                  <Link href={`/dashboard/manager/my-jobs/${job.id}`}>
                    View Details
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        // Empty State
        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardContent className="p-10 text-center">
            <h3 className="text-xl font-semibold text-white mb-2">No jobs posted yet</h3>
            <p className="text-slate-400 mb-6">
              Start by posting a new job to find the best talent.
            </p>
            
            {/* --- LINK MODIFIED HERE --- */}
            <Button onClick={() => router.push('/dashboard/manager/post-job')}>
              <FaPlus className="mr-2 h-4 w-4" /> Post Your First Job
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}