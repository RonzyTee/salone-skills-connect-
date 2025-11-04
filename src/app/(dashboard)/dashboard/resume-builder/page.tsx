// src/app/(dashboard)/resume-builder/page.tsx
'use client';

import React, { useState, useRef } from 'react';
import { FaPlus, FaTrash, FaMagic, FaFilePdf, FaImage, FaFileWord, FaSpinner } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from '@/context/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';

// Imports for exporting functionality
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- Type Definitions ---
interface PersonalDetails {
  fullName: string;
  phone: string;
  email: string;
  linkedin: string;
  website: string;
  location: string;
}

interface ExperienceEntry {
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  responsibilities: string;
}

interface EducationEntry {
  degree: string;
  school: string;
  location: string;
  gradDate: string;
}

interface ResumeData {
  personalDetails: PersonalDetails;
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string;
  resumeTitle: string;
}

interface AIButtonProps {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  children: React.ReactNode;
  loading: boolean;
  loadingText?: string;
}

// --- Helper Components ---

const AIButton = ({ onClick, children, loading, loadingText = "Generating..." }: AIButtonProps) => (
  <Button onClick={onClick} variant="outline" className="text-sm text-blue-400 border-blue-400 hover:bg-blue-900/50 hover:text-blue-300 disabled:opacity-50" disabled={loading}>
    {loading ? (
      <>
        <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
        {loadingText}
      </>
    ) : (
      <>
        <FaMagic className="mr-2 h-4 w-4" />
        {children}
      </>
    )}
  </Button>
);

// --- High-Quality PDF Generation ---

const generateModernPDF = (resumeData: ResumeData) => {
    const { personalDetails, summary, experience, education, skills, resumeTitle } = resumeData;
    // jsPDF uses 'pt' units by default. A4 is 595.28 x 841.89 pts.
    const doc = new jsPDF('p', 'pt', 'a4'); 
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    let cursorY = margin;

    // --- Helper Colors ---
    const primaryColor = '#2563EB'; // tailwind blue-600
    const textColor = '#111827'; // tailwind slate-900
    const lightTextColor = '#4B5563'; // tailwind slate-600

    doc.setTextColor(textColor);

    // --- Header ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.text(personalDetails.fullName, margin, cursorY);
    cursorY += 28;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(lightTextColor);
    const contactInfo = [
        personalDetails.location,
        personalDetails.phone,
        personalDetails.email,
        personalDetails.linkedin,
        personalDetails.website,
    ].filter(Boolean).join('  |  ');
    doc.text(contactInfo, margin, cursorY);
    cursorY += 40;

    // --- Summary ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('PROFESSIONAL SUMMARY', margin, cursorY);
    doc.setDrawColor(primaryColor);
    doc.setLineWidth(1.5);
    doc.line(margin, cursorY + 6, pageWidth - margin, cursorY + 6);
    cursorY += 25;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textColor);
    const summaryLines = doc.splitTextToSize(summary, pageWidth - margin * 2);
    doc.text(summaryLines, margin, cursorY);
    cursorY += summaryLines.length * 10 + 20;

    // --- Work Experience ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('WORK EXPERIENCE', margin, cursorY);
    doc.line(margin, cursorY + 6, pageWidth - margin, cursorY + 6);
    cursorY += 25;

    experience.forEach((exp: ExperienceEntry) => {
        if (!exp.title) return;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(textColor);
        doc.text(exp.title, margin, cursorY);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`${exp.startDate} - ${exp.endDate}`, pageWidth - margin, cursorY, { align: 'right' });
        cursorY += 14;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(lightTextColor);
        doc.text(exp.company, margin, cursorY);
        doc.text(exp.location, pageWidth - margin, cursorY, { align: 'right' });
        cursorY += 18;

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textColor);
        const responsibilities = exp.responsibilities.split('\n').filter((line: string) => line.trim() !== '');
        responsibilities.forEach((line: string) => {
            const cleanedLine = line.replace(/^-/, '').trim();
            const bulletPointLines = doc.splitTextToSize(cleanedLine, pageWidth - margin * 2 - 20);
            doc.text(`•`, margin + 5, cursorY);
            doc.text(bulletPointLines, margin + 20, cursorY);
            cursorY += bulletPointLines.length * 12;
        });
        cursorY += 15;
    });

    // --- Education ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('EDUCATION', margin, cursorY);
    doc.line(margin, cursorY + 6, pageWidth - margin, cursorY + 6);
    cursorY += 25;

    education.forEach((edu: EducationEntry) => {
        if (!edu.degree) return;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(textColor);
        doc.text(edu.degree, margin, cursorY);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(edu.gradDate, pageWidth - margin, cursorY, { align: 'right' });
        cursorY += 14;
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(lightTextColor);
        doc.text(`${edu.school}, ${edu.location}`, margin, cursorY);
        cursorY += 25;
    });

    // --- Skills ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('SKILLS', margin, cursorY);
    doc.line(margin, cursorY + 6, pageWidth - margin, cursorY + 6);
    cursorY += 25;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textColor);
    const skillsText = skills.replace(/--- AI Suggestions ---/g, '').replace(/\n/g, ' ');
    const skillsLines = doc.splitTextToSize(skillsText, pageWidth - margin * 2);
    doc.text(skillsLines, margin, cursorY);

    doc.save(`${resumeTitle.replace(/\s/g, '_') || 'resume'}.pdf`);
};


// --- Main Resume Builder Component ---

export default function ResumeBuilderPage() {
  const { user } = useAuth();
  const [resumeTitle, setResumeTitle] = useState("Untitled Software Engineer Resume");
  const resumePreviewRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  // State for resume data with pre-filled example data
  const [personalDetails, setPersonalDetails] = useState<PersonalDetails>({
    fullName: 'Jane Doe',
    phone: '123-456-7890',
    email: 'jane.doe@email.com',
    linkedin: 'linkedin.com/in/janedoe',
    website: 'github.com/janedoe',
    location: 'San Francisco, CA',
  });
  const [summary, setSummary] = useState('Results-driven Senior Software Engineer with 5+ years of experience in designing, developing, and deploying scalable web applications. Proficient in full-stack development with expertise in React, Node.js, and cloud-native technologies on AWS. Proven ability to lead projects, mentor junior developers, and deliver high-quality software solutions that drive business growth.');
  const [experience, setExperience] = useState<ExperienceEntry[]>([
    { title: 'Senior Software Engineer', company: 'Tech Solutions Inc.', location: 'Remote', startDate: '01/2022', endDate: 'Present', responsibilities: '- Led the architecture and development of a new microservices-based platform, improving system scalability and reducing latency by 30%.\n- Mentored a team of 4 junior engineers, fostering a culture of code quality and continuous learning through regular code reviews and pair programming sessions.\n- Optimized application performance by implementing advanced caching strategies and refactoring critical code paths, resulting in a 20% improvement in response times.' },
    { title: 'Software Engineer', company: 'Web Innovations', location: 'New York, NY', startDate: '06/2019', endDate: '12/2021', responsibilities: '- Developed and maintained client-side features for a high-traffic e-commerce website using React and Redux, contributing to a 15% increase in user engagement.\n- Collaborated with UX/UI designers to implement responsive and accessible designs, ensuring a seamless user experience across all devices.\n- Wrote comprehensive unit and integration tests using Jest and React Testing Library, achieving over 90% code coverage.' },
  ]);
  const [education, setEducation] = useState<EducationEntry[]>([
    { degree: 'B.S. in Computer Science', school: 'State University', location: 'CA', gradDate: '05/2019' },
  ]);
  const [skills, setSkills] = useState('React, TypeScript, Node.js, Express, Python, AWS (EC2, S3, Lambda), Docker, Kubernetes, CI/CD, PostgreSQL, MongoDB, REST APIs, GraphQL, Agile Methodologies');

  // State for AI interactions
  const [aiLoadingTask, setAiLoadingTask] = useState<string | null>(null);
  const [isTailorModalOpen, setIsTailorModalOpen] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [tailoringSuggestions, setTailoringSuggestions] = useState('');


  // --- Central AI API Caller ---
  const callAIAssistant = async (task: string, payload: object) => {
      try {
          const response = await fetch('/api/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ task, payload }),
          });

          if (!response.ok) {
              const errorBody = await response.json();
              throw new Error(errorBody.error || "An unknown error occurred");
          }

          const result = await response.json();
          return result.data;
      } catch (error: unknown) {
          console.error(`Error during AI task '${task}':`, error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          toast.error(`AI Assistant Error: ${errorMessage}`);
          return null;
      }
  };


  // --- Data Handlers ---

  const handlePersonalDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPersonalDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleExperienceChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newExperience = experience.map((item, i) => {
      if (i === index) {
        return { ...item, [name]: value };
      }
      return item;
    });
    setExperience(newExperience);
  };

  const addExperience = () => {
    setExperience([...experience, { title: '', company: '', location: '', startDate: '', endDate: '', responsibilities: '' }]);
  };

  const removeExperience = (index: number) => {
    setExperience(experience.filter((_, i) => i !== index));
  };
  
  const handleEducationChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newEducation = education.map((item, i) => {
      if (i === index) {
        return { ...item, [name]: value };
      }
      return item;
    });
    setEducation(newEducation);
  };

  const addEducation = () => {
    setEducation([...education, { degree: '', school: '', location: '', gradDate: '' }]);
  };

  const removeEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };
  
  // --- AI-Powered Functions ---

  const generateSummary = async () => {
    setAiLoadingTask('summary');
    const jobTitles = experience.map(exp => exp.title).filter(Boolean);
    const data = await callAIAssistant('generate-summary', { jobTitles, skills });
    if (data) {
        setSummary(data);
        toast.success("AI has generated a new summary!");
    }
    setAiLoadingTask(null);
  };

  const enhanceBulletPoints = async (index: number) => {
    const currentExperience = experience[index];
    if (!currentExperience.responsibilities) {
        toast.error("Please enter some responsibilities first.");
        return;
    }
    setAiLoadingTask(`bullets-${index}`);
    const data = await callAIAssistant('enhance-bullets', { 
      jobTitle: currentExperience.title,
      bulletPoints: currentExperience.responsibilities
    });

    if (data) {
        const newExperience = experience.map((item, i) => {
          if (i === index) {
            return { ...item, responsibilities: data };
          }
          return item;
        });
        setExperience(newExperience);
        toast.success(`Bullet points for "${currentExperience.title}" enhanced!`);
    }
    setAiLoadingTask(null);
  };

  const suggestSkills = async () => {
    setAiLoadingTask('skills');
    const jobTitles = experience.map(exp => exp.title).filter(Boolean);
    const data = await callAIAssistant('suggest-skills', { jobTitles });
    if (data) {
      const newSkills = skills ? `${skills}\n\n--- AI Suggestions ---\n${data}` : data;
      setSkills(newSkills);
      toast.success("AI has suggested new skills!");
    }
    setAiLoadingTask(null);
  };

  const tailorForJob = async () => {
    if (!jobDescription) {
        toast.error("Please paste a job description first.");
        return;
    }
    setAiLoadingTask('tailor');
    setTailoringSuggestions('');
    const resumeData = { personalDetails, summary, experience, education, skills };
    const data = await callAIAssistant('tailor-resume', { resumeData, jobDescription });
    if (data) {
        setTailoringSuggestions(data);
        toast.success("AI has generated tailoring suggestions!");
    }
    setAiLoadingTask(null);
  };
  
  // --- Firestore Save ---
  const saveResume = async () => {
    if (!user) {
        toast.error("You must be logged in to save.");
        return;
    }
    const resumeId = resumeTitle.toLowerCase().replace(/\s+/g, '-');
    if (!resumeId) {
        toast.error("Please provide a title for the resume.");
        return;
    }
    const resumeRef = doc(db, 'artifacts', 'resume-builder', 'users', user.uid, 'resumes', resumeId);
    const resumeData = { title: resumeTitle, lastUpdated: new Date().toISOString(), personalDetails, summary, experience, education, skills, };
    try {
        await setDoc(resumeRef, resumeData, { merge: true });
        toast.success(`Resume "${resumeTitle}" saved successfully!`);
    } catch (error: unknown) {
        console.error("Error saving resume: ", error);
        toast.error("Failed to save resume.");
    }
  };

  // --- Export Functions ---
  const handleDownloadPdf = async () => {
    setIsDownloading('pdf');
    toast.loading('Generating PDF...');
    try {
        const resumeData = { personalDetails, summary, experience, education, skills, resumeTitle };
        // This is a fire-and-forget call; the save dialog is handled inside the function.
        generateModernPDF(resumeData);
        toast.dismiss();
        toast.success('PDF Downloaded!');
    } catch (error: unknown) {
        console.error("Error generating PDF:", error);
        toast.dismiss();
        toast.error('Failed to generate PDF.');
    } finally {
        setIsDownloading(null);
    }
  };

  const handleDownloadImage = async () => {
    const previewElement = resumePreviewRef.current;
    if (!previewElement) return;

    setIsDownloading('image');
    toast.loading('Generating Image...');
    
    try {
      const canvas = await html2canvas(previewElement, { 
        scale: 3, 
        backgroundColor: '#ffffff'
      });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `${resumeTitle.replace(/\s/g, '_') || 'resume'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.dismiss();
      toast.success('Image Downloaded!');
    } catch (error: unknown) {
      console.error("Error generating image:", error);
      toast.dismiss();
      toast.error('Failed to generate image.');
    } finally {
      setIsDownloading(null);
    }
  };


  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-900 text-slate-100 font-sans">
      {/* Left Pane: Editor */}
      <div className="w-1/2 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
            <Input 
              type="text"
              value={resumeTitle}
              onChange={(e) => setResumeTitle(e.target.value)}
              className="text-2xl font-bold bg-transparent border-0 ring-0 focus:ring-0 px-0 text-slate-100"
              aria-label="Resume Title"
            />
            <Button onClick={saveResume}>Save Resume</Button>
        </div>
        
        <Accordion type="single" collapsible className="w-full space-y-4" defaultValue="item-1">
          {/* Personal Details */}
          <AccordionItem value="item-1" className="bg-slate-800 rounded-lg border-slate-700">
            <AccordionTrigger className="text-lg font-semibold px-6">Personal Details</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4 px-6 pb-6">
              <Input name="fullName" placeholder="Full Name" value={personalDetails.fullName} onChange={handlePersonalDetailsChange} />
              <div className="grid grid-cols-2 gap-4">
                <Input name="phone" placeholder="Phone Number" value={personalDetails.phone} onChange={handlePersonalDetailsChange} />
                <Input name="email" placeholder="Email Address" value={personalDetails.email} onChange={handlePersonalDetailsChange} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input name="linkedin" placeholder="LinkedIn URL" value={personalDetails.linkedin} onChange={handlePersonalDetailsChange} />
                <Input name="website" placeholder="Portfolio/Website URL" value={personalDetails.website} onChange={handlePersonalDetailsChange} />
              </div>
              <Input name="location" placeholder="City, State" value={personalDetails.location} onChange={handlePersonalDetailsChange} />
            </AccordionContent>
          </AccordionItem>

          {/* Professional Summary */}
          <AccordionItem value="item-2" className="bg-slate-800 rounded-lg border-slate-700">
            <AccordionTrigger className="text-lg font-semibold px-6">Professional Summary</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4 px-6 pb-6">
              <Textarea placeholder="Write a brief summary of your career highlights..." rows={5} value={summary} onChange={(e) => setSummary(e.target.value)} />
              <AIButton onClick={generateSummary} loading={aiLoadingTask === 'summary'}>Auto-Generate Summary</AIButton>
            </AccordionContent>
          </AccordionItem>
          
          {/* Work Experience */}
          <AccordionItem value="item-3" className="bg-slate-800 rounded-lg border-slate-700">
             <AccordionTrigger className="text-lg font-semibold px-6">Work Experience</AccordionTrigger>
             <AccordionContent className="space-y-6 pt-4 px-6 pb-6">
                {experience.map((exp, index) => (
                    <div key={index} className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg space-y-3 relative">
                         <button onClick={() => removeExperience(index)} className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors" aria-label="Remove experience"><FaTrash /></button>
                         <Input name="title" placeholder="Job Title" value={exp.title} onChange={(e) => handleExperienceChange(index, e)} />
                         <Input name="company" placeholder="Company Name" value={exp.company} onChange={(e) => handleExperienceChange(index, e)} />
                         <Input name="location" placeholder="Location" value={exp.location} onChange={(e) => handleExperienceChange(index, e)} />
                         <div className="grid grid-cols-2 gap-4">
                            <Input name="startDate" placeholder="Start Date (MM/YYYY)" value={exp.startDate} onChange={(e) => handleExperienceChange(index, e)} />
                            <Input name="endDate" placeholder="End Date (MM/YYYY or Present)" value={exp.endDate} onChange={(e) => handleExperienceChange(index, e)} />
                         </div>
                         <Textarea name="responsibilities" placeholder="Bullet points describing your responsibilities and achievements..." rows={5} value={exp.responsibilities} onChange={(e) => handleExperienceChange(index, e)} />
                         <AIButton onClick={() => enhanceBulletPoints(index)} loading={aiLoadingTask === `bullets-${index}`}>Enhance Bullet Points</AIButton>
                    </div>
                ))}
                <Button variant="secondary" onClick={addExperience}><FaPlus className="mr-2" /> Add Experience</Button>
             </AccordionContent>
          </AccordionItem>
          
           {/* Education */}
           <AccordionItem value="item-4" className="bg-slate-800 rounded-lg border-slate-700">
             <AccordionTrigger className="text-lg font-semibold px-6">Education</AccordionTrigger>
             <AccordionContent className="space-y-6 pt-4 px-6 pb-6">
                {education.map((edu, index) => (
                    <div key={index} className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg space-y-3 relative">
                         <button onClick={() => removeEducation(index)} className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors" aria-label="Remove education"><FaTrash /></button>
                         <Input name="degree" placeholder="Degree (e.g., B.S. in Computer Science)" value={edu.degree} onChange={(e) => handleEducationChange(index, e)} />
                         <Input name="school" placeholder="School/University" value={edu.school} onChange={(e) => handleEducationChange(index, e)} />
                         <Input name="location" placeholder="Location" value={edu.location} onChange={(e) => handleEducationChange(index, e)} />
                         <Input name="gradDate" placeholder="Graduation Date (MM/YYYY)" value={edu.gradDate} onChange={(e) => handleEducationChange(index, e)} />
                    </div>
                ))}
                <Button variant="secondary" onClick={addEducation}><FaPlus className="mr-2" /> Add Education</Button>
             </AccordionContent>
           </AccordionItem>
          
           {/* Skills */}
          <AccordionItem value="item-5" className="bg-slate-800 rounded-lg border-slate-700">
            <AccordionTrigger className="text-lg font-semibold px-6">Skills</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4 px-6 pb-6">
              <Textarea placeholder="List your technical and soft skills, separated by commas (e.g., React, Node.js, Team Leadership)" rows={4} value={skills} onChange={(e) => setSkills(e.target.value)} />
              <AIButton onClick={suggestSkills} loading={aiLoadingTask === 'skills'}>Suggest Skills</AIButton>
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </div>

      {/* Right Pane: Preview & Tools */}
      <div className="w-1/2 p-8 bg-slate-950 flex flex-col">
          {/* Controls */}
          <div className="flex-shrink-0 mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Tools &amp; Export</h3>
                 <Dialog open={isTailorModalOpen} onOpenChange={setIsTailorModalOpen}>
                    <DialogTrigger asChild>
                      {/* FIX: Added the required 'loading' prop to the AIButton component to match its type definition. Since this button only triggers a dialog, it's not in a loading state. */}
                      <AIButton onClick={() => { setTailoringSuggestions(''); setJobDescription(''); }} loading={false}>Tailor for Job Description</AIButton>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[625px] bg-slate-900 border-slate-700 text-white">
                        <DialogHeader>
                          <DialogTitle>AI Tailoring Assistant</DialogTitle>
                          <DialogDescription>
                            Paste a job description below. The AI will analyze your current resume and provide suggestions to make it a better fit.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <Textarea 
                              placeholder="Paste the full job description here..." 
                              rows={10} 
                              className="bg-slate-800"
                              value={jobDescription}
                              onChange={(e) => setJobDescription(e.target.value)}
                            />
                            {tailoringSuggestions && (
                                <div className="p-4 bg-black rounded-md border border-slate-700 max-h-48 overflow-y-auto">
                                  <h4 className="font-semibold mb-2">Suggestions:</h4>
                                  <pre className="text-sm whitespace-pre-wrap font-sans">{tailoringSuggestions}</pre>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                          <AIButton onClick={tailorForJob} loading={aiLoadingTask === 'tailor'} loadingText="Analyzing...">
                            Generate Suggestions
                          </AIButton>
                        </DialogFooter>
                    </DialogContent>
                  </Dialog>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-900 rounded-lg">
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60" onClick={handleDownloadPdf} disabled={isDownloading !== null}>
                    {isDownloading === 'pdf' ? <FaSpinner className="mr-2 animate-spin"/> : <FaFilePdf className="mr-2"/>}
                    {isDownloading === 'pdf' ? 'Generating...' : 'Download PDF'}
                  </Button>
                   <Button className="flex-1 bg-slate-600 hover:bg-slate-700 disabled:opacity-60" onClick={handleDownloadImage} disabled={isDownloading !== null}>
                    {isDownloading === 'image' ? <FaSpinner className="mr-2 animate-spin"/> : <FaImage className="mr-2"/>}
                    {isDownloading === 'image' ? 'Generating...' : 'Download Image'}
                   </Button>
                   <Button className="flex-1 bg-slate-800 text-slate-500 cursor-not-allowed" disabled>
                    <FaFileWord className="mr-2"/> Download Word (Soon)
                   </Button>
              </div>
          </div>
          
          {/* Live Preview */}
          <div className="flex-1 bg-slate-800/50 p-4 rounded-lg overflow-y-auto">
              <div ref={resumePreviewRef} className="bg-white p-10 mx-auto w-full font-sans" style={{ aspectRatio: '8.5 / 11', backgroundColor: '#ffffff', color: '#0f172a' }}>
                  <header className="text-center mb-8">
                      <h1 className="text-4xl font-bold tracking-tight" style={{ color: '#1e293b' }}>{personalDetails.fullName || "Your Name"}</h1>
                      <div className="mt-2 text-sm flex justify-center items-center gap-x-3 flex-wrap" style={{ color: '#64748b' }}>
                          <span>{personalDetails.location}</span>
                          <span className="hidden sm:inline" style={{ color: '#cbd5e1' }}>|</span>
                          <a href={`tel:${personalDetails.phone}`} className="hover:underline" style={{ color: '#2563eb' }}>{personalDetails.phone}</a>
                          <span className="hidden sm:inline" style={{ color: '#cbd5e1' }}>|</span>
                          <a href={`mailto:${personalDetails.email}`} className="hover:underline" style={{ color: '#2563eb' }}>{personalDetails.email}</a>
                      </div>
                      <div className="mt-1 text-sm flex justify-center items-center gap-x-3 flex-wrap" style={{ color: '#64748b' }}>
                          <a href={`https://${personalDetails.linkedin}`} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: '#2563eb' }}>{personalDetails.linkedin}</a>
                          <span className="hidden sm:inline" style={{ color: '#cbd5e1' }}>|</span>
                          <a href={`https://${personalDetails.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: '#2563eb' }}>{personalDetails.website}</a>
                      </div>
                  </header>

                  <main>
                      <section className="mb-6">
                          <h2 className="text-sm font-bold uppercase tracking-widest pb-1 mb-3" style={{ color: '#2563eb', borderBottom: '2px solid #2563eb' }}>Professional Summary</h2>
                          <p className="text-sm leading-relaxed" style={{ color: '#334155' }}>{summary || "Your professional summary will appear here."}</p>
                      </section>

                      <section className="mb-6">
                          <h2 className="text-sm font-bold uppercase tracking-widest pb-1 mb-3" style={{ color: '#2563eb', borderBottom: '2px solid #2563eb' }}>Work Experience</h2>
                          <div className="space-y-5">
                              {experience.map((exp, index) => exp.title && (
                                  <div key={index}>
                                      <div className="flex justify-between items-baseline">
                                          <h3 className="font-semibold text-base" style={{ color: '#1e293b' }}>{exp.title}</h3>
                                          <p className="text-xs font-medium" style={{ color: '#64748b' }}>{exp.startDate} – {exp.endDate}</p>
                                      </div>
                                      <div className="flex justify-between items-baseline mt-1">
                                          <p className="text-sm font-medium" style={{ color: '#475569' }}>{exp.company}</p>
                                          <p className="text-xs font-medium" style={{ color: '#64748b' }}>{exp.location}</p>
                                      </div>
                                      <ul className="list-disc list-outside mt-2 ml-4 text-sm space-y-1 leading-relaxed" style={{ color: '#334155' }}>
                                          {exp.responsibilities.split('\n').map((line, i) => line && <li key={i}>{line.replace(/^-/, '').trim()}</li>)}
                                      </ul>
                                  </div>
                              ))}
                          </div>
                      </section>

                      <section className="mb-6">
                          <h2 className="text-sm font-bold uppercase tracking-widest pb-1 mb-3" style={{ color: '#2563eb', borderBottom: '2px solid #2563eb' }}>Education</h2>
                          <div className="space-y-3">
                              {education.map((edu, index) => edu.degree && (
                                  <div key={index}>
                                      <div className="flex justify-between items-baseline">
                                          <h3 className="font-semibold text-base" style={{ color: '#1e293b' }}>{edu.degree}</h3>
                                          <p className="text-xs font-medium" style={{ color: '#64748b' }}>{edu.gradDate}</p>
                                      </div>
                                      <p className="text-sm font-medium" style={{ color: '#475569' }}>{edu.school}, {edu.location}</p>
                                  </div>
                              ))}
                          </div>
                      </section>

                      <section>
                          <h2 className="text-sm font-bold uppercase tracking-widest pb-1 mb-3" style={{ color: '#2563eb', borderBottom: '2px solid #2563eb' }}>Skills</h2>
                          <p className="text-sm leading-relaxed" style={{ color: '#334155' }}>{skills.replace(/--- AI Suggestions ---/g, '').replace(/\n/g, ' ')}</p>
                      </section>
                  </main>
              </div>
          </div>
      </div>
    </div>
  );
}