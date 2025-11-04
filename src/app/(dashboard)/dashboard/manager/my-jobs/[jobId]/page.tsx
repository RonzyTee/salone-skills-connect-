'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Job } from '@/types/jobs'
import { useParams, useRouter } from 'next/navigation';
import Loader from '@/components/ui/loader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { FaArrowLeft, FaUsers, FaCalendarAlt } from 'react-icons/fa';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function JobApplicantsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { jobId } = params;
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId || !user) return;

    const fetchJobData = async () => {
      try {
        const jobRef = doc(db, 'jobs', jobId as string);
        const jobSnap = await getDoc(jobRef);

        if (jobSnap.exists()) {
          const jobData = jobSnap.data() as Job;
          // Security Check: Ensure the logged-in user owns this job
          if (jobData.organizationId === user.uid) {
            setJob(jobData);
          } else {
            toast.error("You don't have permission to view this job.");
            router.push('/dashboard/manager/my-jobs');
          }
        } else {
          toast.error('Job not found.');
          router.push('/dashboard/manager/my-jobs');
        }
      } catch (error) {
        console.error("Error fetching job:", error);
        toast.error('Failed to load job data.');
      }
      setLoading(false);
    };

    if (!authLoading) {
      fetchJobData();
    }
  }, [jobId, user, authLoading, router]);

  if (authLoading || loading) {
    return <Loader />;
  }

  if (!job) {
    return (
      <div className="text-center text-slate-400">
        Job not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push('/dashboard/manager/my-jobs')} className="mb-4">
        <FaArrowLeft className="mr-2 h-4 w-4" /> Back to My Jobs
      </Button>

      {/* Job Details Card */}
      <Card className="bg-slate-900 border-slate-800 text-white">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">{job.jobTitle}</CardTitle>
          <div className="flex flex-wrap gap-4 pt-2">
            <Badge>{job.jobType}</Badge>
            <Badge variant="secondary">{job.location}</Badge>
            {job.salaryRange && <Badge variant="outline">{job.salaryRange}</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          <h4 className="font-semibold text-lg mb-2">Job Description</h4>
          <p className="text-slate-300 whitespace-pre-wrap">{job.jobDescription}</p>
          <h4 className="font-semibold text-lg mt-6 mb-2">Required Skills</h4>
          <div className="flex flex-wrap gap-2">
            {job.requiredSkills.map(skill => (
              <Badge key={skill} variant="default">{skill}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Applicants List Card */}
      <Card className="bg-slate-900 border-slate-800 text-white">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-3">
            <FaUsers /> Applicants ({job.applicants.length})
          </CardTitle>
          <CardDescription>
            Review the talent who have applied for this position.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {job.applicants.length > 0 ? (
            <div className="space-y-4">
              {job.applicants.map(applicant => (
                <div key={applicant.uid} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={applicant.profilePictureUrl} alt={applicant.name} />
                      <AvatarFallback>{applicant.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-white">{applicant.name}</h3>
                      <p className="text-sm text-slate-400 flex items-center gap-2">
                        <FaCalendarAlt className="h-3 w-3" />
                        Applied {format(applicant.appliedAt.toDate(), 'PPP')}
                      </D>
                    </div>
                  </div>
                  <Button asChild className="w-full sm:w-auto flex-shrink-0">
                    <Link href={`/profile/${applicant.uid}`}>View Profile</Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500">
              <p>You don't have any applicants for this job yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}