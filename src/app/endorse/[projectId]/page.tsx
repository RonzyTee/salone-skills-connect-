'use client';

import { useParams, useSearchParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { db } from '@/lib/firebase'; // Import your Firebase config
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore'; // Import Firestore functions
import { FaSpinner, FaExclamationCircle, FaStar, FaLayerGroup, FaCheckCircle } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

// --- Type definition for the project ---
interface Project {
  id: string;
  title: string;
  description: string;
  mainImageUrl: string;
  skills: string[];
  endorsementStatus?: 'none' | 'pending' | 'endorsed';
  // Add other fields if needed
}

// --- Star Rating Component ---
const StarRating = ({ rating, setRating }: { rating: number; setRating: (rating: number) => void }) => {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <FaStar
          key={star}
          className={`cursor-pointer text-3xl transition-all ${
            rating >= star ? 'text-yellow-400' : 'text-slate-600 hover:text-slate-500'
          }`}
          onClick={() => setRating(star)}
        />
      ))}
    </div>
  );
};

export default function EndorsementPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  // State
  const [projectId, setProjectId] = useState<string | null>(null);
  const [clientEmail, setClientEmail] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [rating, setRating] = useState(0);
  const [testimonial, setTestimonial] = useState('');
  
  // Status states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // --- 1. Get IDs from URL ---
  useEffect(() => {
    const pid = params.projectId as string;
    const clientQuery = searchParams.get('client');
    
    if (!pid) {
      setError("Invalid link. No project ID found.");
      setIsLoading(false);
      return;
    }

    setProjectId(pid);

    if (clientQuery) {
      try {
        const decodedEmail = atob(clientQuery); // Decode from Base64
        setClientEmail(decodedEmail);
      } catch (e) {
        console.error("Error decoding client email:", e);
        setError("Invalid link. Client information is corrupted.");
        setIsLoading(false);
      }
    } else {
      setError("Invalid link. Missing client information.");
      setIsLoading(false);
    }
  }, [params, searchParams]);

  // --- 2. Fetch Project from Firestore ---
  useEffect(() => {
    if (!projectId) return;

    const fetchProject = async () => {
      try {
        const projectRef = doc(db, 'projects', projectId);
        const docSnap = await getDoc(projectRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setProject({ id: docSnap.id, ...data } as Project);

          // Check if already endorsed
          if (data.endorsementStatus === 'endorsed') {
             setError("This project has already been endorsed.");
          }

        } else {
          setError("Project not found. This link may be broken or the project was deleted.");
        }
      } catch (err) {
        console.error("Error fetching project:", err);
        setError("An error occurred while loading the project.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  // --- 3. Handle Form Submission ---
  const handleSubmitEndorsement = async () => {
    if (rating === 0) {
      alert("Please select a star rating.");
      return;
    }
    if (!testimonial.trim()) {
      alert("Please write a short testimonial.");
      return;
    }
    if (!projectId || !clientEmail) {
        alert("Error: Missing project or client data.");
        return;
    }

    setIsSubmitting(true);
    try {
      const projectRef = doc(db, 'projects', projectId);
      
      // Update the project document
      await updateDoc(projectRef, {
        endorsementStatus: 'endorsed',
        endorsement: {
          clientEmail: clientEmail,
          rating: rating,
          testimonial: testimonial,
          endorsedAt: Timestamp.now(),
        }
      });

      setIsSuccess(true); // Show success message
    } catch (err) {
      console.error("Error submitting endorsement:", err);
      alert("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDER STATES ---

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <FaSpinner className="animate-spin text-4xl" />
        <span className="ml-4 text-2xl">Loading Project...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-red-400 p-8 text-center">
        <FaExclamationCircle className="text-5xl mb-4" />
        <h1 className="text-2xl font-bold">Link Error</h1>
        <p className="text-lg">{error}</p>
      </div>
    );
  }

  // --- Success State ---
  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-green-400 p-8 text-center">
        <FaCheckCircle className="text-7xl mb-6" />
        <h1 className="text-4xl font-bold mb-4">Thank You!</h1>
        <p className="text-xl text-slate-300">Your endorsement has been submitted successfully.</p>
        <p className="text-lg text-slate-400 mt-2">You can now close this window.</p>
      </div>
    );
  }

  // --- Main Form Render ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-4">Endorse Project</h1>
        <p className="text-lg text-slate-400 mb-6">
          You are leaving a review for the project <span className="font-bold text-white">"{project?.title || '...'}"</span> as <span className="font-bold text-white">{clientEmail}</span>.
        </p>

        {/* Project Details Card */}
        <div className="bg-slate-900 p-6 rounded-lg shadow-lg border border-slate-800 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative w-full h-56 md:w-56 md:h-56 flex-shrink-0 rounded-lg overflow-hidden bg-slate-800">
              {project?.mainImageUrl ? (
                <Image
                  src={project.mainImageUrl}
                  alt={project.title}
                  layout="fill"
                  objectFit="cover"
                  unoptimized={true}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <FaLayerGroup className="text-5xl text-slate-700" />
                </div>
              )}
            </div>
            <div className="flex-grow">
              <h2 className="text-2xl font-bold text-white mb-2">{project?.title}</h2>
              <p className="text-slate-400 line-clamp-4 mb-4">{project?.description}</p>
              <div className="flex flex-wrap gap-2">
                {project?.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="bg-blue-900/50 text-blue-300 border-blue-500/20">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Endorsement Form */}
        <div className="bg-slate-900 p-6 rounded-lg shadow-lg border border-slate-800">
          <h2 className="text-2xl font-bold text-white mb-6">Your Review</h2>
          
          <div className="mb-6">
            <label className="block text-lg font-medium text-slate-300 mb-3">1. How would you rate this work?</label>
            <StarRating rating={rating} setRating={setRating} />
          </div>
          
          <div className="mb-6">
            <label htmlFor="testimonial" className="block text-lg font-medium text-slate-300 mb-3">
              2. Please provide a short testimonial
            </label>
            <Textarea
              id="testimonial"
              className="bg-slate-800 border-slate-700 text-white min-h-[120px] focus:ring-blue-500"
              placeholder="e.g., 'The project was delivered on time and exceeded all my expectations. Highly recommended!'"
              value={testimonial}
              onChange={(e) => setTestimonial(e.target.value)}
            />
          </div>
          
          <Button
            onClick={handleSubmitEndorsement}
            disabled={isSubmitting}
            className="w-full text-lg py-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold"
          >
            {isSubmitting ? <FaSpinner className="animate-spin" /> : 'Submit Endorsement'}
          </Button>
        </div>
      </div>
    </div>
  );
}