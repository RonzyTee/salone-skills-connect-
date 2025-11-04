'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FaSpinner, FaBriefcase, FaLock } from 'react-icons/fa'; // Import FaLock
import toast from 'react-hot-toast';
import { Job } from '@/types/jobs'
import Loader from '@/components/ui/loader';
import Link from 'next/link'; // Import Link

// 1. Define the validation schema with Zod
const jobFormSchema = z.object({
  jobTitle: z.string().min(5, 'Job title must be at least 5 characters'),
  jobType: z.enum(['Full-time', 'Part-time', 'Contract', 'Internship']),
  location: z.enum(['On-site', 'Remote', 'Hybrid']),
  salaryRange: z.string().optional(),
  jobDescription: z.string().min(50, 'Description must be at least 50 characters'),
  // We'll use a comma-separated string for skills input, then split it.
  requiredSkills: z.string().min(2, 'Please list at least one skill'),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

// --- NEW COMPONENT TO SHOW WHEN NOT VERIFIED ---
const VerificationRequiredCard = () => (
  <Card className="bg-slate-900 border-slate-800 text-white max-w-lg mx-auto">
    <CardHeader>
      <CardTitle className="text-2xl font-bold flex items-center gap-3 text-yellow-400">
        <FaLock /> Verification Required
      </CardTitle>
      <CardDescription className="text-slate-400 pt-2">
        Your organization must be verified (Tier 0) before you can post a job.
        This ensures a safe and trusted environment for all users.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-slate-300 mb-6">
        Please complete your organization's verification to unlock this feature.
      </p>
      <Button asChild>
        {/* Make sure this link is correct for your app */}
        <Link href="/dashboard/organization">
          Go to My Organization
        </Link>
      </Button>
    </CardContent>
  </Card>
);

export default function PostJobPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. Set up the form with react-hook-form
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      jobTitle: '',
      jobType: 'Full-time',
      location: 'On-site',
      salaryRange: '',
      jobDescription: '',
      requiredSkills: '',
    },
  });

  // --- ADD THIS VERIFICATION CHECK ---
  const isVerified = userProfile?.oivpStatus?.tier0 === 'verified';

  // 3. Handle the form submission
  async function onSubmit(values: JobFormValues) {
    // Double-check verification on submit
    if (!isVerified) {
      toast.error('Your organization is not verified.');
      return;
    }
    
    if (!user || !userProfile || userProfile.userType !== 'manager') {
      toast.error('You must be a manager to post a job.');
      return;
    }
    
    setIsSubmitting(true);
    const toastId = toast.loading('Posting your job...');

    try {
      // Create a new document reference in the 'jobs' collection
      const jobCollectionRef = collection(db, 'jobs');
      const newJobRef = doc(jobCollectionRef); // This generates a new unique ID

      // Split the skills string into an array, trim whitespace
      const skillsArray = values.requiredSkills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);

      // 4. Create the new Job data object
      const newJob: Job = {
        jobId: newJobRef.id,
        organizationId: user.uid,
        organizationName: userProfile.organizationName || 'My Organization',
        organizationLogoUrl: userProfile.organizationLogoUrl || '',
        
        jobTitle: values.jobTitle,
        jobType: values.jobType,
        location: values.location,
        salaryRange: values.salaryRange || '',
        jobDescription: values.jobDescription,
        requiredSkills: skillsArray,
        
        createdAt: Timestamp.now(),
        status: 'Open',
        applicants: [], // Start with an empty array of applicants
      };

      // 5. Save the document to Firestore
      await setDoc(newJobRef, newJob);

      toast.success('Job posted successfully!', { id: toastId });
      
      // Navigate to the "My Jobs" list page
      router.push('/dashboard/manager/my-jobs');

    } catch (error) {
      console.error('Error posting job:', error);
      toast.error('Failed to post job. Please try again.', { id: toastId });
      setIsSubmitting(false);
    }
  }

  // Handle loading and permissions
  if (authLoading) {
    return <Loader />;
  }

  if (!user || userProfile?.userType !== 'manager') {
    // This shouldn't happen if your layout routes correctly, but good to have.
    router.push('/dashboard'); // Redirect non-managers
    return <Loader />;
  }
  
  // --- RENDER BLOCKER OR FORM ---
  if (!isVerified) {
    return <VerificationRequiredCard />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-slate-900 border-slate-800 text-white">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-3">
            <FaBriefcase className="text-blue-500" /> Post a New Job
          </CardTitle>
          <CardDescription className="text-slate-400">
            Fill out the details below to find the perfect talent for your team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Junior React Developer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="jobType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Full-time">Full-time</SelectItem>
                          <SelectItem value="Part-time">Part-time</SelectItem>
                          <SelectItem value="Contract">Contract</SelectItem>
                          <SelectItem value="Internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="On-site">On-site</SelectItem>
                          <SelectItem value="Remote">Remote</SelectItem>
                          <SelectItem value="Hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="salaryRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salary Range (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., $500 - $700 / month" {...field} />
                    </FormControl>
                    <FormDescription>
                      Be transparent! This helps attract the right candidates.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requiredSkills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required Skills</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., React, Node.js, Figma, SQL" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter skills separated by a comma ( , ).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jobDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the role, responsibilities, and qualifications..."
                        className="min-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                {isSubmitting ? (
                  <>
                    <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Post Job'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}