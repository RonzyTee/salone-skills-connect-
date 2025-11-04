'use client'; 

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FaPlus, FaEdit, FaTrash, FaSpinner, FaLayerGroup, FaCheckCircle, FaHourglassHalf, FaExclamationCircle, FaEye, FaStar, FaAward } from "react-icons/fa";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from 'date-fns';

// Firebase imports
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc, orderBy, Timestamp, updateDoc } from 'firebase/firestore'; // Import updateDoc
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

// Import the new modal
import EndorsementRequestModal from '@/components/EndorsementRequestModal';

// --- TYPE DEFINITIONS ---
interface Project {
  id: string;
  userId: string;
  title: string;
  url: string;
  description: string;
  skills: string[];
  visuals: string[];
  createdAt: Timestamp;
  verificationStatus: 'verified' | 'pending_review' | 'unverified';
  endorsementStatus: 'none' | 'pending' | 'endorsed';
}

interface FirestoreProject {
    userId: string;
    title: string;
    description: string;
    skills: string[];
    mainImageUrl: string;
    liveDemoUrl?: string;
    githubUrl?: string;
    createdAt: Timestamp;
    verificationStatus: 'verified' | 'pending_review' | 'unverified';
    endorsementStatus?: 'none' | 'pending' | 'endorsed';
}

// --- HELPER COMPONENTS & FUNCTIONS ---

const getStatusInfo = (status: Project['verificationStatus']) => {
  switch (status) {
    case 'verified': 
      return { 
        badgeClass: 'bg-green-500/20 text-green-300 border border-green-500/30', 
        text: 'Verified', 
        icon: <FaCheckCircle className="mr-1" /> 
      };
    case 'pending_review': 
      return { 
        badgeClass: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30', 
        text: 'Pending', 
        icon: <FaHourglassHalf className="mr-1" /> 
      };
    case 'unverified': 
      return { 
        badgeClass: 'bg-red-500/20 text-red-300 border border-red-500/30', 
        text: 'Needs Attention', 
        icon: <FaExclamationCircle className="mr-1" /> 
      };
    default: 
      return { 
        badgeClass: 'bg-gray-500/20 text-gray-300 border border-gray-500/30', 
        text: 'Unknown', 
        icon: <FaLayerGroup className="mr-1" /> 
      };
  }
};

const IconButton = ({ onClick, href, icon, title, className = '' }: { onClick?: () => void; href?: string; icon: React.ReactNode; title: string; className?: string }) => {
  const commonClasses = "p-2 rounded-full text-slate-300 hover:bg-slate-700 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500";
  
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" title={title} className={`${commonClasses} ${className}`}>
        {icon}
      </a>
    );
  }
  
  return (
    <button onClick={onClick} title={title} className={`${commonClasses} ${className}`}>
      {icon}
    </button>
  );
};

// Endorsement Button Component
const EndorsementButton = ({ status, onClick }: { status: Project['endorsementStatus'], onClick: () => void }) => {
  switch (status) {
    case 'endorsed':
      return (
        <Button variant="ghost" className="w-full justify-start text-green-400 hover:text-green-400 cursor-default px-2">
          <FaAward className="mr-2 h-4 w-4" /> Client Endorsed
        </Button>
      );
    case 'pending':
      return (
        <Button variant="ghost" className="w-full justify-start text-yellow-400 hover:text-yellow-400 cursor-wait px-2">
          <FaHourglassHalf className="mr-2 h-4 w-4" /> Pending Client
        </Button>
      );
    case 'none':
    default:
      return (
        <Button 
          variant="ghost" 
          className="w-full justify-start text-slate-400 hover:bg-slate-800 hover:text-blue-300 px-2"
          onClick={onClick}
        >
          <FaStar className="mr-2 h-4 w-4" /> Request Endorsement
        </Button>
      );
  }
};

// --- HORIZONTAL PROJECT CARD ---
const ProjectCard = ({ 
  project, 
  onDelete,
  onEndorse 
}: { 
  project: Project; 
  onDelete: (id: string) => void | Promise<void>; 
  onEndorse: (project: Project) => void; // Updated to pass full project
}) => {
  const router = useRouter();
  const statusInfo = getStatusInfo(project.verificationStatus);
  
  return (
    <Card className="bg-slate-900 border-slate-800 rounded-lg shadow-lg transition-all duration-300 ease-in-out hover:shadow-blue-500/20 hover:border-slate-700 w-full">
      {/* CARD HEIGHT REDUCED: p-4 -> p-3 */}
      <CardContent className="p-3 flex flex-row items-center gap-4">
        
        {/* 1. Picture - SIZE REDUCED */}
        <div className="relative w-20 h-20 md:w-28 md:h-28 flex-shrink-0 rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center">
          {project.visuals && project.visuals.length > 0 ? (
            <Image
              src={project.visuals[0]}
              alt={project.title}
              layout="fill"
              objectFit="cover"
              unoptimized={true}
            />
          ) : (
            <FaLayerGroup className="text-4xl text-slate-700" />
          )}
          <Badge className={`absolute top-1 right-1 flex items-center text-xs px-2 py-0.5 rounded-full shadow-lg ${statusInfo.badgeClass}`}>
            {statusInfo.icon}
            <span className="hidden sm:inline">{statusInfo.text}</span>
          </Badge>
        </div>

        {/* 2. Small Description (Title, Desc, Timestamp) */}
        <div className="flex-grow min-w-0">
          <h4 className="text-lg font-bold text-white truncate" title={project.title}>{project.title}</h4>
          <p className="text-sm text-slate-400 line-clamp-2 mt-1">{project.description}</p>
          <p className="text-xs text-slate-500 mt-2">
            {project.createdAt ? formatDistanceToNow(project.createdAt.toDate(), { addSuffix: true }) : ''}
          </p>
        </div>

        {/* 3. Skills - HEIGHT REDUCED */}
        <div className="hidden lg:block w-48 flex-shrink-0 px-4">
          <div className="flex flex-wrap gap-1.5 h-14 overflow-hidden">
            {project.skills.slice(0, 4).map((skill, index) => (
              <Badge key={index} variant="secondary" className="bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded-full text-xs font-medium border-blue-500/20">
                {skill}
              </Badge>
            ))}
            {project.skills.length > 4 && (
              <Badge variant="secondary" className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full text-xs font-medium border-slate-600">
                +{project.skills.length - 4} more
              </Badge>
            )}
          </div>
        </div>

        {/* 4. Endorsement Button */}
        <div className="hidden md:block w-48 flex-shrink-0 px-4">
          <EndorsementButton 
            status={project.endorsementStatus}
            onClick={() => onEndorse(project)} // Updated
          />
        </div>

        {/* 5. Preview, Edit, Delete Actions */}
        <div className="flex items-center gap-1 flex-shrink-0 pl-2">
          {project.url && (
            <IconButton href={project.url} icon={<FaEye className="h-4 w-4" />} title="View Live Project" />
          )}
          <IconButton onClick={() => router.push(`/dashboard/portfolio/edit/${project.id}`)} icon={<FaEdit className="h-4 w-4" />} title="Edit Project" />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button title="Delete Project" className="p-2 rounded-full text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500">
                <FaTrash className="h-4 w-4" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-slate-800 border-slate-700 text-slate-100">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  This action cannot be undone. This will permanently delete your project.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-slate-600 hover:bg-slate-500 border-none">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(project.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};


// --- MAIN PAGE COMPONENT ---
export default function PortfolioPage() {
  const { user, loading: authLoading, userProfile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // --- MODAL STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  // UPDATED: Store the full project object
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  // -------------------

  useEffect(() => {
    const fetchUserProjects = async () => {
      if (!user) {
        setLoadingProjects(false);
        setProjects([]);
        setError('Please log in to view your portfolio.');
        return;
      }

      setLoadingProjects(true);
      setError(null);
      try {
        const projectsRef = collection(db, 'projects');
        const q = query(
          projectsRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        
        const fetchedProjects: Project[] = querySnapshot.docs.map(doc => {
          const data = doc.data() as FirestoreProject;
          return {
            id: doc.id,
            ...data,
            visuals: data.mainImageUrl ? [data.mainImageUrl] : [],
            url: data.liveDemoUrl || data.githubUrl || '',
            skills: data.skills || [],
            endorsementStatus: data.endorsementStatus || 'none', 
          };
        });
        setProjects(fetchedProjects);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError('Failed to load projects. Please try again.');
      } finally {
        setLoadingProjects(false);
      }
    };

    if (!authLoading) {
      fetchUserProjects();
    }
  }, [user, authLoading]);

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteDoc(doc(db, 'projects', projectId));
      setProjects(prevProjects => prevProjects.filter(project => project.id !== projectId));
    } catch (err) {
      console.error("Error deleting project:", err);
      alert('Failed to delete project. Check console for details.');
    }
  };

  // --- MODAL FUNCTIONS ---
  // UPDATED: Function now accepts the full project object
  const handleRequestEndorsement = (project: Project) => {
    console.log("Requesting endorsement for project:", project.id);
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  // UPDATED: Reset the correct state variable
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  const handleSendEndorsementRequest = async (projectId: string, clientEmail: string) => {
    console.log(`Endorsement request sent for ${projectId} to ${clientEmail}`);
    // This function is called by the modal *after* the email has been sent.
    // We just need to update Firestore.

    try {
      // 1. Update Firestore
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        endorsementStatus: 'pending',
        clientEmailForEndorsement: clientEmail // Good to store for reference
      });

      // 2. Optimistically update local state
      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, endorsementStatus: 'pending' } : p
      ));

      alert(`Endorsement request sent to ${clientEmail}! The project status is now 'pending'.`);
      handleModalClose();

    } catch (err) {
      console.error("Error updating project for endorsement:", err);
      alert("Failed to update project status. Please try again.");
    }
  };
  // -----------------------

  type ProjectFilterStatus = 'all' | 'verified' | 'pending' | 'needs-attention';

  const filteredProjects = useMemo(() => {
    return (status: ProjectFilterStatus) => {
        if (status === 'all') return projects;
        const statusMap: { [key in Exclude<ProjectFilterStatus, 'all'>]: Project['verificationStatus'] } = {
            'verified': 'verified',
            'pending': 'pending_review',
            'needs-attention': 'unverified'
        };
        return projects.filter(project => project.verificationStatus === statusMap[status]);
    };
  }, [projects]);


  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-blue-400">
        <FaSpinner className="animate-spin text-4xl mr-3" /> Loading your world-class portfolio...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-6">
        <p className="text-xl text-red-400 mb-4">You must be logged in to view your portfolio.</p>
        <Link href="/auth/login" passHref>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">Log In</Button>
        </Link>
      </div>
    );
  }
  
  if (userProfile && userProfile.userType !== 'youth') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-6 text-center">
        <FaExclamationCircle className="text-5xl text-red-500 mb-4"/>
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-lg text-slate-400 mb-6">Only users with the "youth" role can manage a portfolio.</p>
        <p className="text-sm text-slate-500">Your current role is: <span className="font-semibold text-slate-300">{userProfile.userType || 'Undefined'}</span></p>
        <Link href="/dashboard" passHref>
            <Button className="mt-6 bg-blue-600 hover:bg-blue-700 text-white">Go to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8"> 
      <div className="w-full max-w-screen-2xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">My Portfolio</h1>
                <p className="text-slate-400 mt-1">Showcase your best work to the world.</p>
            </div>
          <Link href="/dashboard/portfolio/add" passHref>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 whitespace-nowrap flex items-center gap-2">
                <FaPlus className="h-5 w-5" /> <span>Launch New Project</span>
            </Button>
          </Link>
        </div>
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full max-w-lg grid-cols-2 sm:grid-cols-4 bg-slate-800/70 p-1.5 rounded-xl shadow-inner mb-8">
            <TabsTrigger
              value="all"
              className="flex items-center justify-center gap-2 transition-all data-[state=active]:text-slate-900 data-[state=inactive]:text-slate-300 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-slate-700/50"
            >
              <FaLayerGroup className="h-4 w-4" />
              All Projects
            </TabsTrigger>
            
            <TabsTrigger
              value="verified"
              className="flex items-center justify-center gap-2 transition-all data-[state=active]:text-slate-900 data-[state=inactive]:text-slate-300 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-slate-700/50"
            >
              <FaCheckCircle className="h-4 w-4" />
              Verified
            </TabsTrigger>
            
            <TabsTrigger
              value="pending"
              className="flex items-center justify-center gap-2 transition-all data-[state=active]:text-slate-900 data-[state=inactive]:text-slate-300 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-slate-700/50"
            >
              <FaHourglassHalf className="h-4 w-4" />
              Pending
            </TabsTrigger>
            
            <TabsTrigger
              value="needs-attention"
              className="flex items-center justify-center gap-2 transition-all data-[state=active]:text-slate-900 data-[state=inactive]:text-slate-300 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-slate-700/50"
            >
              <FaExclamationCircle className="h-4 w-4" />
              Needs Attention
            </TabsTrigger>
          </TabsList>

          {(['all', 'verified', 'pending', 'needs-attention'] as ProjectFilterStatus[]).map(tabValue => (
            <TabsContent key={tabValue} value={tabValue} className="focus-visible:ring-0">
              
              {loadingProjects ? (
                <div className="flex flex-col gap-4 animate-pulse">
                  {/* Reduced height of pulse */}
                  {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-slate-800 rounded-lg"></div>)}
                </div>
              ) : error ? (
                <div className="text-center text-red-400 text-lg mt-10">{error}</div>
              ) : filteredProjects(tabValue).length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 bg-slate-900 border border-slate-800 rounded-xl shadow-inner text-slate-500 text-center">
                  <FaLayerGroup className="text-5xl mb-4" />
                  <p className="text-xl font-semibold text-slate-300 mb-2">No projects found for this category.</p>
                  <p className="text-base mb-6">Let's change that. Add your first project now!</p>
                  <Link href="/dashboard/portfolio/add" passHref>
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                      <FaPlus className="mr-2 h-4 w-4" /> Add New Project
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {filteredProjects(tabValue).map((project) => (
                    <ProjectCard 
                        key={project.id} 
                        project={project} 
                        onDelete={handleDeleteProject}
                        onEndorse={() => handleRequestEndorsement(project)} // UPDATED
                      />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* --- RENDER THE MODAL --- */}
      {/* UPDATED: Pass the correct props to the modal */}
      <EndorsementRequestModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        project={selectedProject ? { id: selectedProject.id, title: selectedProject.title } : null}
        userProfile={userProfile ? { name: userProfile.displayName || 'Salone Skill Talent' } : null}
        onSubmit={handleSendEndorsementRequest}
      />
    </div>
  );
}