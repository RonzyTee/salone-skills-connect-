// src/app/(dashboard)/portfolio/add/page.tsx
"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FaArrowLeft, FaPlus, FaTimes, FaUpload, FaSpinner, FaCheckCircle, FaExternalLinkAlt, FaFileImage, FaChevronDown, FaVideo, FaLink } from "react-icons/fa";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
// Corrected: useRouter is imported from 'next/navigation' for the App Router.
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import toast from 'react-hot-toast';


// Interface for a single uploaded file
interface StagedFile {
  id: string;
  file: File;
  name: string;
  thumbnailUrl: string; // Local URL for preview
  error: string | null;
}

// Pre-defined skills for the new selector
const SKILL_DATA: Record<string, string[]> = {
  'Tech': ['React', 'Node.js', 'Python', 'Docker', 'AWS', 'JavaScript', 'TypeScript', 'SQL', 'MongoDB', 'Next.js', 'Vue', 'Angular', 'Go', 'Rust', 'Kubernetes'],
  'Languages & Tools': ['Git', 'Jira', 'Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'Blender', 'Unity', 'Unreal Engine'],
  'Creative': ['UI/UX Design', 'Graphic Design', 'Videography', 'Copywriting', 'Motion Graphics', '3D Modeling', 'Animation', 'Sound Design'],
  'Crafts': ['Baking', 'Carpentry', 'Welding', 'Sewing', 'Pottery', 'Jewelry Making', 'Leatherworking'],
  'Services': ['Tutoring', 'Fitness Coaching', 'Hair Styling', 'Event Planning', 'Consulting', 'Digital Marketing']
};

// Reusable component for displaying a staged file
const FilePreview = ({ fileName, thumbnailUrl, onRemove, error, isMainImage = false }: {
  fileName: string,
  thumbnailUrl?: string,
  onRemove: () => void,
  error: string | null,
  isMainImage?: boolean
}) => (
  <div className={`flex items-center space-x-3 p-2 border rounded-md mb-2 bg-gray-800 ${error ? 'border-red-600' : 'border-gray-700'}`}>
    {thumbnailUrl ? (
      <Image src={thumbnailUrl} alt="preview" width={isMainImage ? 80 : 40} height={isMainImage ? 80 : 40} className="rounded-sm object-cover" />
    ) : (
      <FaFileImage className={`flex-shrink-0 ${isMainImage ? 'h-20 w-20' : 'h-10 w-10'} text-gray-600`} />
    )}
    <div className="flex-grow min-w-0">
      <p className="text-sm text-gray-300 truncate">{fileName}</p>
      {error ? (
        <p className="text-xs text-red-500 mt-0.5">Error: {error}</p>
      ) : (
        <p className="text-xs text-green-500 mt-0.5 flex items-center">
          <FaCheckCircle className="mr-1" /> Ready for upload
        </p>
      )}
    </div>
    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-400 flex-shrink-0" onClick={onRemove}>
      <FaTimes className="h-3 w-3" />
    </Button>
  </div>
);


export default function AddPortfolioPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  // --- FORM STATE ---
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillCategory, setSkillCategory] = useState<'tech' | 'design' | 'craft' | 'performance' | 'service' | ''>('');
  const [openAccordion, setOpenAccordion] = useState<string | null>('Tech');


  // File Staging
  const [mainImage, setMainImage] = useState<StagedFile | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<StagedFile[]>([]);
  const [mediaFile, setMediaFile] = useState<StagedFile | null>(null); // For video/audio upload
  const [mediaUploadMethod, setMediaUploadMethod] = useState<'url' | 'upload'>('url');

  // Category-specific fields
  const [techLiveDemoUrl, setTechLiveDemoUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [designPortfolioUrl, setDesignPortfolioUrl] = useState('');
  const [videoAudioUrl, setVideoAudioUrl] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  // --- VALIDATION STATE ---
  const [errors, setErrors] = useState<Record<string, string>>({});


  // --- FILE HANDLING ---
  const handleFileStaging = (
    files: FileList | null,
    isGallery: boolean,
    isMedia: boolean = false
  ) => {
    if (!files || files.length === 0) return;

    const targetErrorKey = isMedia ? 'mediaFile' : (isGallery ? 'galleryFiles' : 'mainImage');
    setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[targetErrorKey];
        return newErrors;
    });

    const processFile = (file: File): StagedFile | null => {
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const allowedMediaTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
      
      const isValidType = isMedia 
        ? allowedMediaTypes.some(type => file.type.startsWith(type.split('/')[0]))
        : allowedImageTypes.includes(file.type);

      if (!isValidType) {
        setErrors(prev => ({ ...prev, [targetErrorKey]: isMedia ? 'Only video/audio files allowed.' : 'Only image files are allowed.' }));
        return null;
      }
      return {
        id: `${file.name}-${file.lastModified}`,
        file,
        name: file.name,
        // Only create object URLs for images to avoid browser issues with large media files
        thumbnailUrl: isMedia ? '' : URL.createObjectURL(file), 
        error: null,
      };
    };

    if (isMedia) {
      const newFile = processFile(files[0]);
      if(newFile) {
        setMediaFile(newFile);
      }
    } else if (isGallery) {
      const newFiles = Array.from(files).map(processFile).filter(Boolean) as StagedFile[];
      setGalleryFiles(prev => [...prev, ...newFiles]);
    } else {
      const newFile = processFile(files[0]);
      if (newFile) {
        if (mainImage) URL.revokeObjectURL(mainImage.thumbnailUrl);
        setMainImage(newFile);
      }
    }
  };

  const removeMainImage = () => {
    if (mainImage) URL.revokeObjectURL(mainImage.thumbnailUrl);
    setMainImage(null);
  };

  const removeGalleryFile = (fileId: string) => {
    const fileToRemove = galleryFiles.find(f => f.id === fileId);
    if (fileToRemove) URL.revokeObjectURL(fileToRemove.thumbnailUrl);
    setGalleryFiles(prev => prev.filter(f => f.id !== fileId));
  };
  
  const removeMediaFile = () => {
    setMediaFile(null);
  };


  // --- SKILLS HANDLING ---
  const handleSkillToggle = (skill: string) => {
    setSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
    if (errors.skills && skills.length >= 0) {
        setErrors(prev => ({...prev, skills: ''}));
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };


  // --- FORM SUBMISSION ---
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = 'Project title is required.';
    if (!description.trim()) newErrors.description = 'Description is required.';
    if (skills.length === 0) newErrors.skills = 'Please select at least one skill.';
    if (!skillCategory) newErrors.skillCategory = 'Please select a skill category.';
    if (!mainImage) newErrors.mainImage = 'A main project visual is required.';

    if (skillCategory === 'tech') {
      if (!techLiveDemoUrl.trim()) newErrors.techLiveDemoUrl = 'Live Demo URL is required.';
      if (!githubUrl.trim()) newErrors.githubUrl = 'GitHub URL is required.';
    } else if (skillCategory === 'craft' || skillCategory === 'performance' || skillCategory === 'service') {
      const requiredMsg = skillCategory === 'craft' ? 'A video of your hands-on work is required.' : 'A video/audio proof is required.';
      if (mediaUploadMethod === 'url' && !videoAudioUrl.trim()) {
        newErrors.videoAudioUrl = `${requiredMsg} Please provide a valid URL.`;
      } else if (mediaUploadMethod === 'upload' && !mediaFile) {
        newErrors.mediaFile = `${requiredMsg} Please upload a file.`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
        toast.error("Please fix the errors before submitting.");
        return;
    }

    if (!user || userProfile?.userType !== 'youth') {
      toast.error('You must be logged in as a "youth" to add a project.');
      return;
    }

    setIsSaving(true);
    const formData = new FormData();
    formData.append('userId', user.uid);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('skills', JSON.stringify(skills));
    formData.append('skillCategory', skillCategory);
    if (mainImage) formData.append('mainImage', mainImage.file);

    if (skillCategory === 'tech') {
        formData.append('liveDemoUrl', techLiveDemoUrl);
        formData.append('githubUrl', githubUrl);
    } else if (skillCategory === 'design') {
        if (designPortfolioUrl.trim()) formData.append('portfolioUrl', designPortfolioUrl);
        galleryFiles.forEach(gf => formData.append('galleryFiles', gf.file));
    } else if (skillCategory === 'craft' || skillCategory === 'performance' || skillCategory === 'service') {
        formData.append('mediaUploadMethod', mediaUploadMethod);
        if (mediaUploadMethod === 'url') {
            formData.append('videoAudioUrl', videoAudioUrl);
        } else if (mediaFile) {
            formData.append('mediaFile', mediaFile.file);
        }
    }

    try {
        const response = await fetch('/api/projects/add', { method: 'POST', body: formData });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Failed to save project.');

        toast.success('Project saved successfully!');
        router.push('/dashboard/portfolio');
    } catch (error: any) {
        console.error("Error saving project:", error);
        toast.error(error.message || 'An unexpected error occurred.');
    } finally {
        setIsSaving(false);
    }
  };

  const videoUrlDetails = useMemo(() => {
    if (skillCategory === 'craft') {
        return {
            label: "Proof of Work Video URL",
            placeholder: "e.g., https://youtu.be/your-woodworking-video",
            description: "A video showing your hands-on work is required. Paste a link from a site like YouTube."
        };
    }
    return {
        label: "Video/Audio URL",
        placeholder: "https://youtu.be/yourvideo",
        description: "Link to a performance or service demonstration."
    };
  }, [skillCategory]);

  const previewImageUrl = mainImage?.thumbnailUrl || '/placeholder.svg';
  const displayTitle = title || 'Your Project Title Here';
  const displaySkills = skills.length > 0 ? skills : ['Skill 1', 'Skill 2'];

  return (
    <div className="min-h-screen text-gray-100 pb-12">
      <div className="max-w-7xl mx-auto px-6 pt-8">
        
        <div className="flex items-center mb-4">
            <Link href="/dashboard/portfolio" className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800 transition-colors">
                <FaArrowLeft className="h-5 w-5" />
            </Link>
        </div>
        <div className="mb-10">
            <h1 className="text-4xl font-extrabold text-white mb-2">Add New Project</h1>
            <p className="text-gray-400 text-lg">Showcase your work to potential employers and get it verified.</p>
        </div>

        {authLoading ? (
          <div className="text-center text-blue-400 text-lg"><FaSpinner className="animate-spin inline-block mr-2" /> Loading user data...</div>
        ) : !user ? (
          <div className="text-center text-red-400 text-lg">You must be logged in to add a project. <Link href="/auth/login" className="text-blue-400 hover:underline ml-2">Log In</Link></div>
        ) : userProfile?.userType !== 'youth' ? (
          <div className="text-center text-red-400 text-lg">Only "youth" users can add portfolio projects. Your role is: {userProfile?.userType || 'undefined'}.</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              
              {/* [A] PROJECT DETAILS FORM - NOW IN SECTIONS */}
              <div className="space-y-8">
                
                {/* Section 1: Core Details */}
                <Card className="bg-gray-900/50 border-gray-800 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-xl text-white">Step 1: Core Details</CardTitle>
                    <CardDescription>Start with the basics. What is your project called and what is it about?</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">Project Title</label>
                      <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Mobile App for Local Delivery Service" className={`bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 ${errors.title ? 'border-red-500' : ''}`} />
                      {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                    </div>
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                      <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="The Problem: What challenge did you solve?&#10;The Solution: How did you solve it?&#10;Your Role: What was your specific contribution?" rows={6} className={`bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 ${errors.description ? 'border-red-500' : ''}`} />
                      {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                    </div>
                  </CardContent>
                </Card>

                {/* Section 2: Skills & Disciplines */}
                <Card className="bg-gray-900/50 border-gray-800 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-xl text-white">Step 2: Skills & Disciplines</CardTitle>
                    <CardDescription>Categorize your project and select the skills you used.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                     <div>
                        <label htmlFor="skillCategory" className="block text-sm font-medium text-gray-300 mb-2">Primary Discipline</label>
                        <Select value={skillCategory} onValueChange={(value: any) => setSkillCategory(value)}>
                            <SelectTrigger className={`w-full bg-gray-800 border-gray-700 text-white focus:ring-blue-500 focus:border-blue-500 ${errors.skillCategory ? 'border-red-500' : ''}`}>
                            <SelectValue placeholder="Select the main category" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700 text-white">
                            <SelectItem value="tech">Tech (e.g., Web Dev, Software)</SelectItem>
                            <SelectItem value="design">Design (e.g., Graphic, Fashion)</SelectItem>
                            <SelectItem value="craft">Crafts (e.g., Baking, Carpentry)</SelectItem>
                            <SelectItem value="performance">Performance & Media (e.g., Music, Video)</SelectItem>
                            <SelectItem value="service">Services (e.g., Tutoring, Fitness)</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.skillCategory && <p className="text-red-500 text-xs mt-1">{errors.skillCategory}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Select Skills</label>
                         {skills.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-800/50 border border-gray-700 rounded-md">
                                {skills.map((skill) => (
                                <Badge key={skill} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full flex items-center gap-1 cursor-default">
                                    {skill}
                                    <button type="button" onClick={() => removeSkill(skill)} className="ml-1 -mr-1 text-blue-200 hover:text-white"><FaTimes className="h-3 w-3" /></button>
                                </Badge>
                                ))}
                            </div>
                        )}
                        <div className="border border-gray-700 rounded-md">
                            {Object.entries(SKILL_DATA).map(([category, skillList]) => (
                                <div key={category} className="border-b border-gray-700 last:border-b-0">
                                    <button type="button" onClick={() => setOpenAccordion(openAccordion === category ? null : category)} className="w-full flex justify-between items-center p-3 text-left font-medium text-gray-300 hover:bg-gray-800/50">
                                        <span>{category}</span>
                                        <FaChevronDown className={`h-4 w-4 transition-transform ${openAccordion === category ? 'rotate-180' : ''}`} />
                                    </button>
                                    {openAccordion === category && (
                                        <div className="p-3 bg-gray-800/30 flex flex-wrap gap-2">
                                            {skillList.map(skill => (
                                                <button type="button" key={skill} onClick={() => handleSkillToggle(skill)} className={`px-3 py-1 text-sm rounded-full transition-colors ${skills.includes(skill) ? 'bg-blue-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}>{skill}</button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        {errors.skills && <p className="text-red-500 text-xs mt-1">{errors.skills}</p>}
                    </div>
                  </CardContent>
                </Card>

                {/* Section 3: Project Visuals & Links */}
                <Card className="bg-gray-900/50 border-gray-800 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-xl text-white">Step 3: Project Visuals & Links</CardTitle>
                        <CardDescription>Upload images and add relevant links to your project.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Main Project Visual</label>
                            <div className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-800/50 ${errors.mainImage ? 'border-red-500' : 'border-gray-700'}`}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => { e.preventDefault(); handleFileStaging(e.dataTransfer.files, false, false); }}
                                onClick={() => document.getElementById('main-image-upload-input')?.click()}>
                                <input id="main-image-upload-input" type="file" className="hidden" onChange={(e) => handleFileStaging((e.target as HTMLInputElement).files, false, false)} accept="image/*" />
                                <FaUpload className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                                <p className="text-gray-400">Drag & drop an image here, or <span className="text-blue-400">click to browse</span></p>
                                <p className="text-xs text-gray-500 mt-1">Recommended size: 1200x800px. Max: 10MB.</p>
                            </div>
                            {errors.mainImage && <p className="text-red-500 text-xs mt-1">{errors.mainImage}</p>}
                            {mainImage && <div className="mt-4"><FilePreview fileName={mainImage.name} thumbnailUrl={mainImage.thumbnailUrl} onRemove={removeMainImage} error={mainImage.error} isMainImage /></div>}
                        </div>
                        
                        {/* --- Conditional Fields --- */}
                        {skillCategory === 'tech' && (
                            <>
                                <div>
                                <label htmlFor="techLiveDemoUrl" className="block text-sm font-medium text-gray-300 mb-2">Live Demo URL</label>
                                <Input id="techLiveDemoUrl" type="url" value={techLiveDemoUrl} onChange={(e) => setTechLiveDemoUrl(e.target.value)} placeholder="https://www.my-live-demo.com" className={`bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 ${errors.techLiveDemoUrl ? 'border-red-500' : ''}`} />
                                {errors.techLiveDemoUrl && <p className="text-red-500 text-xs mt-1">{errors.techLiveDemoUrl}</p>}
                                </div>
                                <div>
                                <label htmlFor="githubUrl" className="block text-sm font-medium text-gray-300 mb-2">GitHub Repository URL</label>
                                <Input id="githubUrl" type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/yourusername/yourproject" className={`bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 ${errors.githubUrl ? 'border-red-500' : ''}`} />
                                {errors.githubUrl && <p className="text-red-500 text-xs mt-1">{errors.githubUrl}</p>}
                                </div>
                            </>
                        )}

                        {skillCategory === 'design' && (
                            <>
                                <div>
                                <label htmlFor="designPortfolioUrl" className="block text-sm font-medium text-gray-300 mb-2">Project Portfolio URL (Optional)</label>
                                <Input id="designPortfolioUrl" type="url" value={designPortfolioUrl} onChange={(e) => setDesignPortfolioUrl(e.target.value)} placeholder="https://www.my-design-portfolio.com/project" className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Project Image Gallery <span className="text-gray-500 text-xs">(Optional)</span></label>
                                    <div className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-800/50 ${errors.galleryFiles ? 'border-red-500' : 'border-gray-700'}`}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => { e.preventDefault(); handleFileStaging(e.dataTransfer.files, true, false); }}
                                        onClick={() => document.getElementById('gallery-file-upload-input')?.click()}>
                                        <input id="gallery-file-upload-input" type="file" multiple className="hidden" onChange={(e) => handleFileStaging((e.target as HTMLInputElement).files, true, false)} accept="image/*" />
                                        <FaUpload className="mx-auto h-10 w-10 text-gray-500 mb-3" />
                                        <p className="text-gray-400">Add more images</p>
                                    </div>
                                    {errors.galleryFiles && <p className="text-red-500 text-xs mt-1">{errors.galleryFiles}</p>}
                                    <div className="mt-4 space-y-2">{galleryFiles.map((file) => <FilePreview key={file.id} fileName={file.name} thumbnailUrl={file.thumbnailUrl} onRemove={() => removeGalleryFile(file.id)} error={file.error} />)}</div>
                                </div>
                            </>
                        )}
                        
                        {(skillCategory === 'craft' || skillCategory === 'performance' || skillCategory === 'service') && (
                           <div>
                               <label className="block text-sm font-medium text-gray-300 mb-2">Proof of Work</label>
                               <div className="flex rounded-md bg-gray-800 border border-gray-700 p-1 mb-4">
                                   <button type="button" onClick={() => setMediaUploadMethod('url')} className={`w-1/2 px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors ${mediaUploadMethod === 'url' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}><FaLink /> Provide URL</button>
                                   <button type="button" onClick={() => setMediaUploadMethod('upload')} className={`w-1/2 px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors ${mediaUploadMethod === 'upload' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}><FaUpload /> Upload File</button>
                               </div>

                               {mediaUploadMethod === 'url' && (
                                   <div>
                                       <label htmlFor="videoAudioUrl" className="block text-sm font-medium text-gray-300 mb-1">{videoUrlDetails.label}</label>
                                       <p className="text-xs text-gray-400 mb-2">{videoUrlDetails.description}</p>
                                       <Input id="videoAudioUrl" type="url" value={videoAudioUrl} onChange={(e) => setVideoAudioUrl(e.target.value)} placeholder={videoUrlDetails.placeholder} className={`bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 ${errors.videoAudioUrl ? 'border-red-500' : ''}`} />
                                       {errors.videoAudioUrl && <p className="text-red-500 text-xs mt-1">{errors.videoAudioUrl}</p>}
                                   </div>
                               )}
                               
                               {mediaUploadMethod === 'upload' && (
                                   <div>
                                       <label className="block text-sm font-medium text-gray-300 mb-2">Upload Video or Audio File</label>
                                       <div className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-800/50 ${errors.mediaFile ? 'border-red-500' : 'border-gray-700'}`}
                                           onDragOver={(e) => e.preventDefault()}
                                           onDrop={(e) => { e.preventDefault(); handleFileStaging(e.dataTransfer.files, false, true); }}
                                           onClick={() => document.getElementById('media-file-upload-input')?.click()}>
                                           <input id="media-file-upload-input" type="file" className="hidden" onChange={(e) => handleFileStaging((e.target as HTMLInputElement).files, false, true)} accept="video/*,audio/*" />
                                           <FaVideo className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                                           <p className="text-gray-400">Drag & drop a file here, or <span className="text-blue-400">click to browse</span></p>
                                           <p className="text-xs text-gray-500 mt-1">Video (MP4, WEBM) or Audio (MP3, WAV) supported.</p>
                                       </div>
                                       {errors.mediaFile && <p className="text-red-500 text-xs mt-1">{errors.mediaFile}</p>}
                                       {mediaFile && <div className="mt-4"><FilePreview fileName={mediaFile.name} onRemove={removeMediaFile} error={mediaFile.error} /></div>}
                                   </div>
                               )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300" disabled={isSaving}>
                  {isSaving ? (<><FaSpinner className="mr-2 h-4 w-4 animate-spin" /> Saving...</>) : (<><FaPlus className="mr-2 h-5 w-5" /> Save Project</>)}
                </Button>
              </div>

              {/* [B] LIVE PREVIEW */}
              <div className="sticky top-6 lg:h-fit">
                <h2 className="text-2xl font-bold text-white mb-6">Live Project Card Preview</h2>
                <Card className="bg-gray-800 border-gray-700 rounded-xl overflow-hidden shadow-xl">
                  <CardHeader className="p-0">
                    <div className="relative h-48 w-full bg-gray-700 flex items-center justify-center">
                      {previewImageUrl === '/placeholder.svg' ? (<span className="text-gray-500 text-sm">Project Visual Here</span>) : (<Image src={previewImageUrl} alt="Project Preview" layout="fill" objectFit="cover" />)}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <CardTitle className="text-2xl font-bold mb-2 text-gray-50">{displayTitle}</CardTitle>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {displaySkills.map((skill, index) => (<Badge key={index} className="bg-blue-700/50 text-blue-300 px-2 py-0.5 rounded-full text-xs">{skill}</Badge>))}
                    </div>
                    <p className="text-gray-400 text-sm line-clamp-3">{description || 'This is where your project description summary will appear.'}</p>
                  </CardContent>
                  <CardFooter className="p-6 flex flex-col sm:flex-row justify-between items-center border-t border-gray-700 gap-4 sm:gap-0">
                    <Button variant="ghost" className="text-blue-400 hover:text-blue-300 w-full sm:w-auto" disabled><FaExternalLinkAlt className="mr-2 h-4 w-4" /> Get Verified</Button>
                    <Button variant="ghost" className="text-gray-400 hover:text-gray-300 w-full sm:w-auto" disabled>Edit</Button>
                  </CardFooter>
                </Card>
                <p className="text-gray-500 text-sm mt-4 text-center">Your project card will look like this to hiring managers.</p>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}