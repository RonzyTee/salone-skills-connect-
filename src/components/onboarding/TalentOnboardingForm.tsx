
'use client';

import React, { useState, FC, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';

// Icons
import {
    Loader2,
    ArrowRight,
    ArrowLeft,
    CheckCircle,
    UploadCloud,
    Link as LinkIcon,
    Globe,
    ChevronDown,
    Image as ImageIcon,
    MapPin,
    Briefcase
} from 'lucide-react';

// --- SVG ICONS ---
const SaloneSkillsLinkLogo: FC<{className?: string}> = ({ className }) => ( <svg className={className || "h-16 w-16 mb-4 text-white"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"> <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"/> <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"/> </svg> );
const ShieldIcon: FC = () => ( <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path> </svg> );


// --- CONSTANTS & ZOD SCHEMAS ---
const ID_TYPES = ['National ID', 'Passport', "Driver's License"] as const;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const SKILL_CATEGORIES = [
    {
        category: '💻 Tech Roles & Disciplines',
        skills: ['Agile Methodologies', 'API Development', 'Cloud Architecture', 'Cloud Computing', 'Cybersecurity', 'Database Management', 'Data Visualization', 'DevOps Engineering', 'Full-Stack Development', 'Machine Learning', 'Mobile Development', 'Motion Graphics', 'Project Management', 'Software Testing and QA', 'Technical Writing', 'UI/UX Design', 'Data Science / Analytics', 'Network Engineering', 'Embedded Systems', 'Business Analysis (BA)']
    },
    {
        category: '🌐 Programming Languages & Tools',
        skills: ['AWS', 'CSS3', 'Docker', 'Figma', 'HTML5', 'Javascript', 'Node.js', 'Python', 'React', 'SQL / Postgre', 'C# / .NET', 'Go (Golang)', 'Terraform / Ansible']
    },
    {
        category: '🎨 Creative & Performance',
        skills: ['Design (Graphic, Fashion, Interior)', 'Painting', 'Performance & Media (Music, Videography, Acting)', 'Photography', 'Illustration', 'Sound Engineering / Production']
    },
    {
        category: '🔨 Crafts & Vocational',
        skills: ['Baking', 'Carpentry', 'Mechanics', 'Plumbing', 'Tailoring', 'Welding', 'Architecture', 'Masonry / Bricklaying', 'Electrical Wiring', 'Refrigeration & HVAC']
    },
    {
        category: '💼 Services & Instruction',
        skills: ['Fitness', 'Hair Styling', 'Tutoring', 'Accounting / Bookkeeping', 'Translation / Interpretation', 'Security (Physical)']
    }
];

const formSchema = z.object({
    fullName: z.string().min(3, { message: "Your full name is required." }),
    phoneNumber: z.string().optional(),
    cityLocation: z.string().min(2, { message: "Your current city/town is required." }),
    selectedSkills: z.array(z.string()).min(4, { message: "Please select at least 4 core skills." }).max(5, { message: "You can select a maximum of 5 core skills." }),
    bio: z.string().min(50, { message: "A short bio (min 50 chars) helps us match you." }).max(500),
    goal: z.enum(['Find a mentor', 'Find work experience', 'Showcase projects', 'Connect with peers']),
    idType: z.enum(ID_TYPES),
    linkedinUrl: z.string().url({ message: "Must be a valid URL" }).optional().or(z.literal('')),
    githubUrl: z.string().url({ message: "Must be a valid URL" }).optional().or(z.literal('')),
    whatsappNumber: z.string().optional(),
    idFilePlaceholder: z.string().min(1, { message: "ID upload is required for verification." }),
    profilePicturePlaceholder: z.string().optional(),
    coverPhotoPlaceholder: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export const TalentOnboardingForm = () => {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [idFileObject, setIdFileObject] = useState<File | null>(null);
    const [profilePictureObject, setProfilePictureObject] = useState<File | null>(null);
    const [coverPhotoObject, setCoverPhotoObject] = useState<File | null>(null);
    
    const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
    const [coverPhotoPreview, setCoverPhotoPreview] = useState<string | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: user?.displayName || "", cityLocation: "", selectedSkills: [], bio: "",
            goal: 'Find work experience', idType: 'National ID', idFilePlaceholder: "",
            profilePicturePlaceholder: "", coverPhotoPlaceholder: "",
            linkedinUrl: "", githubUrl: "", whatsappNumber: "",
        },
        mode: 'onTouched'
    });

    const { formState, trigger, watch, setValue, getValues, handleSubmit, register } = form;
    const watchedValues = watch();

    useEffect(() => {
        // Cleanup profile picture object URL to avoid memory leaks
        return () => {
            if (profilePicturePreview) {
                URL.revokeObjectURL(profilePicturePreview);
            }
        };
    }, [profilePicturePreview]);

    useEffect(() => {
        // Cleanup cover photo object URL to avoid memory leaks
        return () => {
            if (coverPhotoPreview) {
                URL.revokeObjectURL(coverPhotoPreview);
            }
        };
    }, [coverPhotoPreview]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, fieldName: 'idFile' | 'profilePicture' | 'coverPhoto') => {
        const file = event.target.files?.[0];
        const placeholderField = `${fieldName}Placeholder` as keyof FormValues;
        
        if (file) {
            if (file.size > MAX_FILE_SIZE) {
                setStatusMessage(`Error: File size cannot exceed 5MB.`);
                setValue(placeholderField, "", { shouldValidate: true });
                if (fieldName === 'idFile') setIdFileObject(null);
                else if (fieldName === 'profilePicture') { setProfilePictureObject(null); setProfilePicturePreview(null); }
                else if (fieldName === 'coverPhoto') { setCoverPhotoObject(null); setCoverPhotoPreview(null); }
                return;
            }
            
            setValue(placeholderField, file.name, { shouldValidate: true });
            setStatusMessage(null);

            if (fieldName === 'idFile') {
                setIdFileObject(file);
            } else if (fieldName === 'profilePicture') {
                setProfilePictureObject(file);
                setProfilePicturePreview(URL.createObjectURL(file));
            } else if (fieldName === 'coverPhoto') {
                setCoverPhotoObject(file);
                setCoverPhotoPreview(URL.createObjectURL(file));
            }
        } else {
            setValue(placeholderField, "", { shouldValidate: true });
            if (fieldName === 'idFile') setIdFileObject(null);
            else if (fieldName === 'profilePicture') { setProfilePictureObject(null); setProfilePicturePreview(null); }
            else if (fieldName === 'coverPhoto') { setCoverPhotoObject(null); setCoverPhotoPreview(null); }
        }
    };

    const handleNext = async () => {
        const fieldsToValidate: (keyof FormValues)[] =
            currentStep === 1 ? ['fullName', 'cityLocation', 'phoneNumber', 'profilePicturePlaceholder', 'coverPhotoPlaceholder', 'linkedinUrl', 'githubUrl', 'whatsappNumber']
            : currentStep === 2 ? ['selectedSkills', 'bio', 'goal']
            : [];
        const isValid = await trigger(fieldsToValidate);
        if (isValid) {
            setCurrentStep(currentStep + 1);
            setStatusMessage(null);
        } else {
            setStatusMessage("Please correct the highlighted errors to proceed.");
        }
    };

    const onSubmit = async (values: FormValues) => {
        if (currentStep !== 3 || !user) {
            setStatusMessage("Error: You must be logged in to submit.");
            return;
        }
        setIsSubmitting(true);
        setStatusMessage("Creating your basic profile...");

        const userUid = user.uid;
        if (!userUid) {
            setStatusMessage("Error: User ID is missing, please re-login.");
            setIsSubmitting(false);
            return;
        }

        try {
            const basicProfilePayload = {
                uid: userUid,
                fullName: values.fullName,
                cityLocation: values.cityLocation,
                phoneNumber: values.phoneNumber || '',
                linkedinUrl: values.linkedinUrl || '',
                githubUrl: values.githubUrl || '',
                whatsappNumber: values.whatsappNumber || '',
                bio: values.bio,
                goal: values.goal,
                idType: values.idType,
                selectedSkills: values.selectedSkills,
                profileCompleted: false,
            };

            const basicProfileResponse = await fetch('/api/onboarding/youth-basic', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(basicProfilePayload),
            });

            if (!basicProfileResponse.ok) {
                const errorData = await basicProfileResponse.json();
                throw new Error(errorData.message || 'Failed to create basic profile.');
            }

            setStatusMessage("Basic profile created. Now securely uploading your documents...");

            if (!idFileObject) {
                throw new Error("Identity verification document is required.");
            }

            const fileFormData = new FormData();
            fileFormData.append('uid', userUid);
            fileFormData.append('idFile', idFileObject);
            if (profilePictureObject) fileFormData.append('profilePicture', profilePictureObject);
            if (coverPhotoObject) fileFormData.append('coverPhoto', coverPhotoObject);
            
            const fileUploadResponse = await fetch('/api/onboarding/youth-files', {
                method: 'POST',
                body: fileFormData,
            });

            if (!fileUploadResponse.ok) {
                const errorData = await fileUploadResponse.json();
                throw new Error(errorData.message || 'Failed to upload documents.');
            }

            setStatusMessage("Profile created successfully! Redirecting...");
            router.refresh();
            router.push('/dashboard');

        } catch (error: any) {
            console.error("Profile creation failed:", error);
            setStatusMessage(`Error: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
          <div className="flex items-center justify-center min-h-screen bg-[#1E1E1E] text-gray-300">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="ml-3 text-lg">Loading your profile...</p>
          </div>
        );
    }

    if (!user) {
        router.push('/signin');
        return null;
    }
    
    const SkillSelector = () => {
        const [openCategory, setOpenCategory] = useState<string | null>(SKILL_CATEGORIES[0].category);
        const currentSkills = watch('selectedSkills');

        const toggleSkill = (skill: string) => {
            const newSkills = currentSkills.includes(skill)
                ? currentSkills.filter(s => s !== skill)
                : currentSkills.length < 5
                    ? [...currentSkills, skill]
                    : currentSkills;
            
            if (newSkills.length > 5) {
                setStatusMessage("You can select a maximum of 5 skills.");
            } else {
                setValue('selectedSkills', newSkills, { shouldValidate: true });
                setStatusMessage(null);
            }
        };

        return (
            <div className="space-y-2">
                <p className="text-sm text-gray-400">Select <strong>4 to 5</strong> core skills. This is crucial for matching you with opportunities.</p>
                <div className="space-y-2 max-h-80 overflow-y-auto border border-gray-600 p-2 rounded-lg bg-[#2A2A2A]">
                    {SKILL_CATEGORIES.map(({ category, skills }) => (
                        <div key={category}>
                            <button type="button" onClick={() => setOpenCategory(openCategory === category ? null : category)} className="w-full flex justify-between items-center text-left p-2 rounded-md bg-gray-700/50 hover:bg-gray-700">
                                <span className="font-semibold text-white">{category}</span>
                                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${openCategory === category ? 'rotate-180' : ''}`} />
                            </button>
                            {openCategory === category && (
                                <div className="flex flex-wrap gap-2 p-3">
                                    {skills.map(skill => (
                                        <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                                            className={`px-3 py-1 text-sm h-auto transition-all duration-200 rounded-md flex items-center ${currentSkills.includes(skill) ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                                            {skill} {currentSkills.includes(skill) && <CheckCircle className="ml-2 h-3 w-3" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                {formState.errors.selectedSkills && <p className="text-red-500 text-sm mt-1">{formState.errors.selectedSkills.message}</p>}
                <p className={`text-right text-xs font-medium ${currentSkills.length >= 4 && currentSkills.length <= 5 ? 'text-green-400' : 'text-orange-400'}`}>
                    Selected: {currentSkills.length} of 5
                </p>
            </div>
        );
    };
    
    const ProfilePreview = () => (
        <div className="w-full max-w-sm mx-auto bg-[#252525] rounded-2xl overflow-hidden shadow-2xl border border-gray-700/50 sticky top-24">
            <div className="h-32 bg-gray-700 relative flex items-center justify-center">
                {coverPhotoPreview ? (
                    <img src={coverPhotoPreview} alt="Cover preview" className="w-full h-full object-cover" />
                ) : (
                    <div className="text-center text-gray-500">
                        <ImageIcon className="h-8 w-8 mx-auto" />
                        <p className="text-xs mt-1">Cover Photo</p>
                    </div>
                )}
            </div>
            <div className="relative p-6">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full border-4 border-[#252525] bg-gray-600 flex items-center justify-center overflow-hidden">
                    {profilePicturePreview ? (
                        <img src={profilePicturePreview} alt="Profile preview" className="w-full h-full object-cover" />
                    ) : (
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                    )}
                </div>
                <div className="pt-12 text-center">
                    <h3 className="text-xl font-bold text-white truncate">{watchedValues.fullName || 'Your Name'}</h3>
                    <p className="text-sm text-gray-400 flex items-center justify-center gap-1.5 mt-1">
                        <MapPin className="h-4 w-4" />
                        {watchedValues.cityLocation || 'Your City'}
                    </p>
                </div>
                <div className="mt-4 border-t border-gray-700 pt-4">
                    <h4 className="text-xs uppercase font-semibold text-gray-500 mb-3 text-center">Core Skills</h4>
                    <div className="flex flex-wrap justify-center gap-2">
                        {(watchedValues.selectedSkills.length > 0 ? watchedValues.selectedSkills : Array(4).fill('Skill...')).slice(0, 5).map((skill, index) => (
                            <span key={index} className="px-2 py-1 text-xs font-medium bg-blue-900/50 text-blue-300 rounded-md">{skill}</span>
                        ))}
                    </div>
                </div>
                 <div className="mt-4 border-t border-gray-700 pt-4 text-center">
                    <h4 className="text-xs uppercase font-semibold text-gray-500 mb-2">Primary Goal</h4>
                     <p className="text-sm text-gray-300 flex items-center justify-center gap-2"><Briefcase className="h-4 w-4 text-green-400" /> {watchedValues.goal}</p>
                 </div>
            </div>
        </div>
    );

    const renderStep = () => {
        const inputClass = (hasError: boolean) => `w-full h-12 px-4 bg-[#2A2A2A] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${hasError ? 'border-red-500 ring-red-500' : 'border-gray-600 focus:ring-blue-500'}`;
        const labelClass = "block text-sm font-medium text-gray-400 mb-2";

        switch (currentStep) {
            case 1: return (
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-3 mb-4">1. Personal & Contact Information</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div><label htmlFor="fullName" className={labelClass}>Full Name <span className="text-red-500">*</span></label><input id="fullName" {...register("fullName")} className={inputClass(!!formState.errors.fullName)} />{formState.errors.fullName && <p className="text-red-500 text-xs mt-1">{formState.errors.fullName.message}</p>}</div>
                        <div><label htmlFor="cityLocation" className={labelClass}>Current City / Town <span className="text-red-500">*</span></label><input id="cityLocation" {...register("cityLocation")} className={inputClass(!!formState.errors.cityLocation)} />{formState.errors.cityLocation && <p className="text-red-500 text-xs mt-1">{formState.errors.cityLocation.message}</p>}</div>
                    </div>
                    <div><label htmlFor="phoneNumber" className={labelClass}>Phone Number (Optional)</label><input id="phoneNumber" type="tel" {...register("phoneNumber")} className={inputClass(!!formState.errors.phoneNumber)} /></div>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                           <label className={labelClass}>Profile Picture (Optional, <strong className="text-orange-400">5MB Max</strong>)</label>
                           <div className={`flex items-center space-x-2 border rounded-lg p-2 ${formState.errors.profilePicturePlaceholder ? 'border-red-500' : 'border-gray-600'}`}><UploadCloud className="h-5 w-5 text-gray-500" /><input id="profilePictureFile" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'profilePicture')} className="flex-1 bg-transparent text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-900/50 file:text-blue-300 hover:file:bg-blue-900/80"/></div>
                           {profilePictureObject && <p className="text-xs text-green-400 mt-1 flex items-center"><CheckCircle className="h-3 w-3 mr-1" /> {profilePictureObject.name}</p>}
                        </div>
                        <div>
                           <label className={labelClass}>Cover Photo (Optional, <strong className="text-orange-400">5MB Max</strong>)</label>
                           <div className={`flex items-center space-x-2 border rounded-lg p-2 ${formState.errors.coverPhotoPlaceholder ? 'border-red-500' : 'border-gray-600'}`}><UploadCloud className="h-5 w-5 text-gray-500" /><input id="coverPhotoFile" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'coverPhoto')} className="flex-1 bg-transparent text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-900/50 file:text-blue-300 hover:file:bg-blue-900/80"/></div>
                           {coverPhotoObject && <p className="text-xs text-green-400 mt-1 flex items-center"><CheckCircle className="h-3 w-3 mr-1" /> {coverPhotoObject.name}</p>}
                        </div>
                    </div>
                    
                    <hr className="border-gray-700"/>
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-300">Professional Profiles (Optional)</h4>
                        <div><label htmlFor="linkedinUrl" className={`${labelClass} flex items-center gap-1`}><LinkIcon className="h-4 w-4 text-blue-400" /> LinkedIn URL</label><input id="linkedinUrl" {...register("linkedinUrl")} className={inputClass(!!formState.errors.linkedinUrl)} />{formState.errors.linkedinUrl && <p className="text-red-500 text-xs mt-1">{formState.errors.linkedinUrl.message}</p>}</div>
                        <div><label htmlFor="githubUrl" className={`${labelClass} flex items-center gap-1`}><LinkIcon className="h-4 w-4 text-gray-400" /> GitHub URL</label><input id="githubUrl" {...register("githubUrl")} className={inputClass(!!formState.errors.githubUrl)} />{formState.errors.githubUrl && <p className="text-red-500 text-xs mt-1">{formState.errors.githubUrl.message}</p>}</div>
                        <div><label htmlFor="whatsappNumber" className={`${labelClass} flex items-center gap-1`}><LinkIcon className="h-4 w-4 text-green-400" /> WhatsApp Number</label><input id="whatsappNumber" {...register("whatsappNumber")} className={inputClass(!!formState.errors.whatsappNumber)} /></div>
                    </div>
                </div>
            );
            case 2: return (
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-3 mb-4">2. Skills & Aspirations</h3>
                    <div><label className={labelClass}>Core Professional Skills <span className="text-red-500">*</span></label><SkillSelector /></div>
                    <div><label htmlFor="bio" className={labelClass}>Professional Bio <span className="text-red-500">*</span></label><textarea id="bio" {...register("bio")} rows={5} className={inputClass(!!formState.errors.bio) + ' h-auto py-3'} placeholder="Describe your experience, passions, and what drives you." /><p className="text-right text-xs text-gray-500 mt-1">{watch('bio')?.length || 0} / 500</p>{formState.errors.bio && <p className="text-red-500 text-xs mt-1">{formState.errors.bio.message}</p>}</div>
                    <div>
                        <label htmlFor="goal" className={labelClass}>Primary Career Goal <span className="text-red-500">*</span></label>
                        <select id="goal" {...register('goal')} className={inputClass(!!formState.errors.goal)}><option>Find work experience</option><option>Find a mentor</option><option>Showcase projects</option><option>Connect with peers</option></select>
                        {formState.errors.goal && <p className="text-red-500 text-xs mt-1">{formState.errors.goal.message}</p>}
                    </div>
                </div>
            );
            case 3: return (
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-3 mb-4">3. Identity Verification</h3>
                    <p className="text-sm text-orange-400 font-medium">To ensure a secure platform, we require one official identity document for verification.</p>
                    <div>
                        <label htmlFor="idType" className={labelClass}>ID Type <span className="text-red-500">*</span></label>
                        <select id="idType" {...register('idType')} className={inputClass(!!formState.errors.idType)}>{ID_TYPES.map(t => <option key={t}>{t}</option>)}</select>
                    </div>
                    <div>
                        <label className={labelClass}>Upload Your {getValues('idType')} <span className="text-red-500">*</span> (<strong className="text-orange-400">Max 5MB</strong>)</label>
                        <div className={`flex items-center space-x-2 border rounded-lg p-2 ${formState.errors.idFilePlaceholder ? 'border-red-500' : 'border-gray-600'}`}><UploadCloud className="h-5 w-5 text-gray-500" /><input id="idFile" type="file" accept="image/*,application/pdf" onChange={(e) => handleFileChange(e, 'idFile')} className="flex-1 bg-transparent text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-900/50 file:text-blue-300 hover:file:bg-blue-900/80"/></div>
                        {formState.errors.idFilePlaceholder && <p className="text-red-500 text-xs mt-1">{formState.errors.idFilePlaceholder.message}</p>}
                        {idFileObject && <p className="text-xs text-green-400 mt-1 flex items-center"><CheckCircle className="h-3 w-3 mr-1" /> {idFileObject.name}</p>}
                    </div>
                    <div className="flex items-start space-x-3 pt-4">
                        <input type="checkbox" id="terms" required className="mt-1 h-4 w-4 rounded border-gray-500 bg-gray-700 text-blue-600 focus:ring-blue-500" />
                        <label htmlFor="terms" className="text-sm text-gray-400">I confirm the information is accurate and agree to the <a href="/terms" className="text-blue-400 underline">Terms of Service</a>.</label>
                    </div>
                </div>
            );
            default: return null;
        }
    };
    
    const progress = (currentStep -1) / 2 * 100;

    return (
        <div className="relative min-h-screen bg-[#1E1E1E] text-gray-300 font-sans">
            <header className="absolute top-0 left-0 p-6 z-10"><SaloneSkillsLinkLogo className="w-8 h-8 text-white" /></header>

            <div className="container mx-auto px-4 py-24">
                <div className="flex flex-col lg:flex-row lg:gap-16">
                    {/* Left side: Profile Preview */}
                    <div className="w-full lg:w-2/5 mb-12 lg:mb-0">
                       <ProfilePreview />
                    </div>

                    {/* Right side: Form */}
                    <div className="w-full lg:w-3/5">
                        <div className="w-full bg-[#252525]/50 backdrop-blur-sm border border-gray-700/50 rounded-lg shadow-2xl">
                            <div className="p-6 sm:p-8">
                                <div className="h-2 bg-gray-700 rounded-full w-full">
                                    <div className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}/>
                                </div>
                                <p className="text-sm text-blue-400 mt-2 font-semibold text-center">{`Step ${currentStep} of 3: ${currentStep === 1 ? 'Personal Info' : currentStep === 2 ? 'Skills & Goals' : 'Verification'}`}</p>
                            </div>

                            <div className="p-6 sm:p-8">
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                                    {renderStep()}
                                    <div className="flex justify-between items-center pt-6 border-t border-gray-700 mt-8">
                                        {currentStep > 1 ? (
                                            <button type="button" onClick={() => setCurrentStep(currentStep - 1)} disabled={isSubmitting} className="flex items-center px-6 py-2 font-semibold text-blue-400 hover:text-white disabled:opacity-50"><ArrowLeft className="mr-2 h-4 w-4" /> Back</button>
                                        ) : <div></div>}

                                        {currentStep < 3 ? (
                                            <button type="button" onClick={handleNext} disabled={isSubmitting} className="flex items-center ml-auto px-6 py-2 font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:bg-blue-800">Next <ArrowRight className="ml-2 h-4 w-4" /></button>
                                        ) : (
                                            <button type="submit" disabled={isSubmitting} className="flex items-center w-full justify-center px-6 py-2 font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:bg-green-800">{isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finalizing...</> : 'Confirm & Create Profile'}</button>
                                        )}
                                    </div>
                                    {statusMessage && (
                                        <div className={`text-sm text-center mt-6 p-3 rounded-md ${statusMessage.startsWith('Error') ? 'bg-red-900/50 text-red-300 border border-red-500/50' : 'bg-blue-900/50 text-blue-300 border border-blue-500/50'}`}>
                                            <p>{statusMessage}</p>
                                        </div>
                                    )}
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="absolute bottom-0 left-0 w-full bg-[#1E1E1E]">
                <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center text-xs text-gray-400">
                    <div className="flex gap-x-4"><span>Legal</span><span>Privacy Policy</span></div>
                    <button className="flex items-center gap-2 hover:text-white"><Globe className="h-4 w-4" /><span>English</span><ChevronDown className="h-4 w-4" /></button>
                </div>
            </footer>
            <div className="fixed bottom-4 right-4 bg-gray-800 p-2 rounded-full shadow-lg"><ShieldIcon /></div>
        </div>
    );
};
