
// src/app/(dashboard)/portfolio/edit/[projectId]/page.tsx
"use client";

// Fix: Import `React` to resolve namespace errors for `React.ChangeEvent` and `React.FormEvent`.
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { FaArrowLeft, FaSave, FaTimes, FaUpload, FaSpinner, FaExternalLinkAlt, FaTools, FaCode, FaPaintBrush, FaDraftingCompass, FaHandshake, FaPlus } from "react-icons/fa";
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import FileUploadProgress from '@/components/FileUploadProgress';

// --- DATA ---
const skillCategories = {
    "Tech Roles & Disciplines": {
        icon: <FaTools className="mr-2 h-4 w-4 text-blue-400" />,
        skills: ["Agile Methodologies", "API Development", "Cloud Architecture", "Cloud Computing", "Cybersecurity", "Database Management", "Data Visualization", "DevOps Engineering", "Full-Stack Development", "Machine Learning", "Mobile Development", "Motion Graphics", "Project Management", "Software Testing and QA", "Technical Writing", "UI/UX Design", "Data Science / Analytics", "Network Engineering", "Embedded Systems", "Business Analysis (BA)"]
    },
    "Programming Languages & Tools": {
        icon: <FaCode className="mr-2 h-4 w-4 text-green-400" />,
        skills: ["AWS", "CSS3", "Docker", "Figma", "HTML5", "Javascript", "Node.js", "Python", "React", "SQL / Postgre", "C# / .NET", "Go (Golang)", "Terraform / Ansible"]
    },
    "Creative & Performance": {
        icon: <FaPaintBrush className="mr-2 h-4 w-4 text-purple-400" />,
        skills: ["Design (Graphic, Fashion, Interior)", "Painting", "Performance & Media (Music, Videography, Acting)", "Photography", "Illustration", "Sound Engineering / Production"]
    },
    "Crafts & Vocational": {
        icon: <FaDraftingCompass className="mr-2 h-4 w-4 text-orange-400" />,
        skills: ["Baking", "Carpentry", "Mechanics", "Plumbing", "Tailoring", "Welding", "Architecture", "Masonry / Bricklaying", "Electrical Wiring", "Refrigeration & HVAC"]
    },
    "Services & Instruction": {
        icon: <FaHandshake className="mr-2 h-4 w-4 text-yellow-400" />,
        skills: ["Fitness", "Hair Styling", "Tutoring", "Accounting / Bookkeeping", "Translation / Interpretation", "Security (Physical)"]
    }
};

interface UploadedFile {
  id: string;
  file?: File;
  name: string;
  progress: number;
  thumbnailUrl: string;
  base64Data?: string;
  isUploading: boolean;
  error: string | null;
  isNew: boolean;
  isDeleted: boolean;
}

export default function EditPortfolioPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const { user, userProfile, loading: authLoading } = useAuth();
  
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const [projectLoadError, setProjectLoadError] = useState<string | null>(null);
  
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const hasPendingUploads = files.some(f => f.isNew && f.isUploading);
  const hasAtLeastOneValidFile = files.filter(f => !f.isDeleted).length > 0;
  const isFormValid = title.trim() !== '' && url.trim() !== '' && description.trim() !== '' && skills.length > 0 && hasAtLeastOneValidFile;
  const canSave = !isLoadingProject && !authLoading && isFormValid && !hasPendingUploads && !isSaving;

  useEffect(() => {
    if (!user || !projectId) {
      setIsLoadingProject(false);
      return;
    }
    const fetchProject = async () => {
      try {
        const projectRef = doc(db, 'projects', projectId);
        const projectSnap = await getDoc(projectRef);
        if (projectSnap.exists()) {
          const data = projectSnap.data();
          if (data.userId !== user.uid) {
            setProjectLoadError("You don't have permission to edit this project.");
            router.push('/dashboard/portfolio');
            return;
          }
          setTitle(data.title || '');
          setUrl(data.liveDemoUrl || data.url || '');
          setDescription(data.description || '');
          setSkills(data.skills || []);
          const existingVisuals: UploadedFile[] = (data.visuals || [data.mainImageUrl]).filter(Boolean).map((base64Data: string, index: number) => ({
            id: `existing-${index}-${Date.now()}`,
            name: `visual-${index + 1}`,
            progress: 100,
            thumbnailUrl: base64Data,
            base64Data: base64Data,
            isUploading: false, error: null, isNew: false, isDeleted: false,
          }));
          setFiles(existingVisuals);
        } else {
          setProjectLoadError("Project not found.");
        }
      } catch (err) {
        console.error("Error fetching project:", err);
        setProjectLoadError("Failed to load project data.");
      } finally {
        setIsLoadingProject(false);
      }
    };
    fetchProject();
  }, [user, projectId, router]);

  const updateFileEntry = useCallback((id: string, updates: Partial<UploadedFile>) => {
    setFiles(prevFiles => prevFiles.map(file => (file.id === id ? { ...file, ...updates } : file)));
  }, []);

  const convertFileToBase64 = useCallback((fileEntry: UploadedFile) => {
    if (!fileEntry.file) return;
    const reader = new FileReader();
    reader.onloadstart = () => updateFileEntry(fileEntry.id, { isUploading: true, error: null, progress: 0 });
    reader.onprogress = (event) => {
        if (event.lengthComputable) updateFileEntry(fileEntry.id, { progress: (event.loaded / event.total) * 100 });
    };
    reader.onloadend = () => updateFileEntry(fileEntry.id, { isUploading: false, progress: 100 });
    reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
            const ONE_MB_LIMIT = 1048576;
            if (e.target.result.length > ONE_MB_LIMIT * 1.5) { // Base64 is ~33% larger
                 updateFileEntry(fileEntry.id, { error: `File is too large (>${(ONE_MB_LIMIT / (1024*1024)).toFixed(0)}MB). Please use an external host.`});
            } else {
                updateFileEntry(fileEntry.id, { base64Data: e.target.result });
            }
        }
    };
    reader.onerror = () => updateFileEntry(fileEntry.id, { error: 'Failed to read file.' });
    reader.readAsDataURL(fileEntry.file);
  }, [updateFileEntry]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    // Fix: Explicitly type `file` as `File` to resolve type inference issues.
    Array.from(event.target.files).forEach((file: File) => {
      if (!file.type.startsWith('image/')) return;
      const newFileEntry: UploadedFile = {
        id: `${file.name}-${Date.now()}`,
        file, name: file.name, progress: 0,
        thumbnailUrl: URL.createObjectURL(file),
        isUploading: true, error: null, isNew: true, isDeleted: false,
      };
      setFiles(prevFiles => [...prevFiles, newFileEntry]);
      convertFileToBase64(newFileEntry);
    });
  };

  const removeFile = (id: string) => {
    setFiles(prevFiles => prevFiles.map(file => {
      if (file.id !== id) return file;
      if (file.isNew) return null;
      return { ...file, isDeleted: true };
    }).filter(Boolean) as UploadedFile[]);
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (title.trim().length < 5) errors.title = 'Title must be at least 5 characters.';
    if (!url.trim().startsWith('http')) errors.url = 'Please enter a valid URL (e.g., https://...).';
    if (description.trim().length < 20) errors.description = 'Description must be at least 20 characters.';
    if (skills.length === 0) errors.skills = 'Please select at least one skill.';
    if (!hasAtLeastOneValidFile) errors.files = 'Please upload at least one project visual.';
    if (hasPendingUploads) errors.files = 'Please wait for new images to finish uploading.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !canSave) return;
    
    setIsSaving(true);
    try {
      const projectRef = doc(db, 'projects', projectId);
      const currentVisuals = files
        .filter(f => !f.isDeleted && f.base64Data)
        .map(f => f.base64Data as string);

      await updateDoc(projectRef, {
        title,
        liveDemoUrl: url, // Using the new field name for consistency
        url: url, // Keep old for backward compatibility if needed
        description,
        skills,
        visuals: currentVisuals,
        mainImageUrl: currentVisuals[0] || '', // Update main image
      });
      router.push('/dashboard/portfolio');
    } catch (error) {
      console.error("Error updating project:", error);
      setFormErrors({ submit: 'Failed to update project. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkillToggle = (skill: string) => {
    setSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };
  
  const previewImageUrl = files.find(f => !f.isDeleted)?.thumbnailUrl || '/placeholder.svg';

  if (authLoading || isLoadingProject) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950"><FaSpinner className="animate-spin text-4xl text-blue-400" /></div>;
  }
  if (projectLoadError) {
    return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-red-400"><p className="text-xl">{projectLoadError}</p><Link href="/dashboard/portfolio" className="mt-4 text-blue-400 hover:underline">Go Back</Link></div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
            <Link href="/dashboard/portfolio" className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors">
                <FaArrowLeft className="mr-2" /> Back to Portfolio
            </Link>
            <h1 className="text-3xl font-bold text-white tracking-tight hidden md:block">Edit Project</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <form onSubmit={handleUpdate} className="lg:col-span-3 space-y-8">
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle>Core Details</CardTitle>
                    <CardDescription>Update the fundamental information about your project.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <Label htmlFor="title">Project Title</Label>
                        <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Mobile App for Local Delivery" />
                        {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
                    </div>
                    <div>
                        <Label htmlFor="url">Project URL</Label>
                        <Input id="url" type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.myproject.com" />
                        {formErrors.url && <p className="text-red-500 text-xs mt-1">{formErrors.url}</p>}
                    </div>
                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the problem, your solution, and your role..." rows={6} />
                        {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle>Skills & Disciplines</CardTitle>
                    <CardDescription>Select the skills and technologies you used for this project.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {skills.map(skill => (
                            <Badge key={skill} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full flex items-center gap-1.5 cursor-pointer" onClick={() => handleSkillToggle(skill)}>
                                {skill} <FaTimes className="h-3 w-3" />
                            </Badge>
                        ))}
                    </div>
                     {formErrors.skills && <p className="text-red-500 text-xs mb-2">{formErrors.skills}</p>}
                    <Accordion type="multiple" className="w-full">
                        {Object.entries(skillCategories).map(([category, { icon, skills: skillList }]) => (
                            <AccordionItem key={category} value={category}>
                                <AccordionTrigger className="hover:no-underline"><span className="flex items-center">{icon} {category}</span></AccordionTrigger>
                                <AccordionContent className="p-2 grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
                                    {skillList.map(skill => (
                                        <div key={skill} className="flex items-center space-x-2">
                                            <Checkbox id={skill} checked={skills.includes(skill)} onCheckedChange={() => handleSkillToggle(skill)} />
                                            <Label htmlFor={skill} className="font-normal cursor-pointer">{skill}</Label>
                                        </div>
                                    ))}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle>Project Visuals</CardTitle>
                    <CardDescription>Add or remove images that showcase your project.</CardDescription>
                </CardHeader>
                <CardContent>
                    <label htmlFor="file-upload-input" className="block border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors bg-slate-900/50 border-slate-700">
                        <input id="file-upload-input" type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*" />
                        <FaUpload className="mx-auto h-8 w-8 text-slate-500 mb-2" />
                        <p className="text-slate-400">Drag & drop or <span className="text-blue-400">click to add more images</span></p>
                        <p className="text-xs text-slate-500 mt-1">Images should be under 1MB.</p>
                    </label>
                    {formErrors.files && <p className="text-red-500 text-xs mt-1">{formErrors.files}</p>}
                    <div className="mt-4 space-y-2">
                      {files.filter(f => !f.isDeleted).map((file) => (
                        <FileUploadProgress key={file.id} fileName={file.name} progress={file.progress} thumbnailUrl={file.thumbnailUrl} onRemove={() => removeFile(file.id)} isUploading={file.isUploading} error={file.error} />
                      ))}
                      {files.filter(f => f.isDeleted).length > 0 && (
                          <p className="text-sm text-yellow-500 mt-2">({files.filter(f => f.isDeleted).length}) file(s) will be removed upon saving.</p>
                      )}
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end items-center gap-4">
                {formErrors.submit && <p className="text-red-500 text-sm">{formErrors.submit}</p>}
                <Button onClick={() => router.push('/dashboard/portfolio')} type="button" variant="outline">Cancel</Button>
                <Button type="submit" disabled={!canSave} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold">
                    {isSaving ? <><FaSpinner className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><FaSave className="mr-2 h-4 w-4" /> Save Changes</>}
                </Button>
            </div>
          </form>

          <div className="lg:col-span-2 sticky top-8 h-fit">
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle>Live Preview</CardTitle>
                    <CardDescription>This is how your project will appear to others.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Card className="group relative bg-slate-800 border-slate-700 rounded-lg overflow-hidden shadow-lg flex flex-col">
                        <div className="relative h-48 w-full bg-slate-700 flex items-center justify-center overflow-hidden">
                            <Image src={previewImageUrl} alt={title || "Project Preview"} layout="fill" objectFit="cover" unoptimized={true} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 p-4">
                                <h3 className="text-lg font-bold text-white drop-shadow-lg">{title || 'Your Project Title'}</h3>
                            </div>
                        </div>
                        <CardContent className="p-4 flex-grow">
                            <div className="flex flex-wrap gap-1.5 mb-3 h-10 overflow-hidden">
                                {(skills.length > 0 ? skills.slice(0, 4) : ['Sample Skill']).map((skill, index) => (
                                    <Badge key={index} variant="secondary" className="bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded-full text-xs font-medium border-blue-500/20">{skill}</Badge>
                                ))}
                            </div>
                            <p className="text-slate-400 text-sm line-clamp-3">{description || 'Your compelling project description will appear here.'}</p>
                        </CardContent>
                        <CardFooter className="p-3 mt-auto flex justify-between items-center border-t border-slate-700 bg-slate-800/50 min-h-[52px]">
                            <p className="text-xs text-slate-500">Just now</p>
                            <div className="flex items-center gap-1 opacity-100">
                                <Button size="icon" variant="ghost" className="h-8 w-8" disabled><FaExternalLinkAlt className="h-4 w-4" /></Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8" disabled><FaTools className="h-4 w-4" /></Button>
                            </div>
                        </CardFooter>
                    </Card>
                </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
