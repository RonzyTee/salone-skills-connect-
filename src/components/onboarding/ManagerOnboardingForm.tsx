
'use client';

import React, { useState, FC, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
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
    MapPin,
    Briefcase,
    Image as ImageIcon
} from 'lucide-react';

// --- SVG ICONS (Reused for consistency) ---
const SaloneSkillsLinkLogo: FC<{className?: string}> = ({ className }) => ( <svg className={className || "h-16 w-16 mb-4 text-white"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"> <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"/> <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"/> </svg> );
const ShieldIcon: FC = () => ( <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path> </svg> );


// --- ZOD SCHEMA & TYPES FOR MANAGER ---
const INDUSTRIES = ['Fintech', 'Agriculture', 'NGO', 'Government', 'Education', 'Healthcare', 'Retail', 'Technology', 'Other'] as const;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const managerFormSchema = z.object({
  organizationName: z.string().min(3, { message: "Official organization name is required." }),
  contactPersonFullName: z.string().min(3, { message: "Your full name is required." }),
  businessEmail: z.string().email({ message: "A valid business email is required." }),
  phoneNumber: z.string().min(6, { message: "A valid phone number is required." }),
  physicalAddress: z.string().min(10, { message: "A verifiable physical address is required." }),
  organizationWebsite: z.string().url({ message: "Please enter a valid URL (e.g., https://example.com)" }).optional().or(z.literal('')),
  linkedinUrl: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal('')),
  aboutOrganization: z.string().min(50, { message: "Please describe your organization (min 50 chars)." }).max(1000),
  industry: z.enum(INDUSTRIES),
  // Placeholders for file uploads to enforce validation
  businessRegDocPlaceholder: z.string().min(1, { message: "Business registration document is required for verification." }),
  organizationLogoPlaceholder: z.string().optional(),
  organizationCoverPhotoPlaceholder: z.string().optional(),
});

type ManagerFormValues = z.infer<typeof managerFormSchema>;


// --- MAIN MANAGER ONBOARDING COMPONENT ---
export const ManagerOnboardingForm: FC = () => {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    
    // State for file objects
    const [regDocFile, setRegDocFile] = useState<File | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null);
    
    // State for image previews
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [coverPhotoPreview, setCoverPhotoPreview] = useState<string | null>(null);

    const form = useForm<ManagerFormValues>({
        resolver: zodResolver(managerFormSchema),
        defaultValues: {
            organizationName: "",
            contactPersonFullName: user?.displayName || "",
            businessEmail: user?.email || "", // Pre-fill with user's email
            phoneNumber: "",
            physicalAddress: "",
            organizationWebsite: "",
            linkedinUrl: "",
            aboutOrganization: "",
            industry: 'Technology',
            businessRegDocPlaceholder: "",
            organizationLogoPlaceholder: "",
            organizationCoverPhotoPlaceholder: "",
        },
        mode: 'onTouched'
    });

    const { register, handleSubmit, formState: { errors }, setValue, trigger, watch } = form;
    const watchedValues = watch();

    useEffect(() => {
        // Cleanup logo object URL to avoid memory leaks
        return () => {
            if (logoPreview) {
                URL.revokeObjectURL(logoPreview);
            }
        };
    }, [logoPreview]);

    useEffect(() => {
        // Cleanup cover photo object URL to avoid memory leaks
        return () => {
            if (coverPhotoPreview) {
                URL.revokeObjectURL(coverPhotoPreview);
            }
        };
    }, [coverPhotoPreview]);
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, fieldName: 'regDoc' | 'logo' | 'coverPhoto') => {
        const file = event.target.files?.[0];
        
        let placeholderField: keyof ManagerFormValues;
        if (fieldName === 'regDoc') {
            placeholderField = 'businessRegDocPlaceholder';
        } else if (fieldName === 'logo') {
            placeholderField = 'organizationLogoPlaceholder';
        } else {
            placeholderField = 'organizationCoverPhotoPlaceholder';
        }
        
        if (file) {
            if (file.size > MAX_FILE_SIZE) {
                setStatusMessage(`Error: File size cannot exceed 5MB.`);
                setValue(placeholderField, "", { shouldValidate: true });
                if (fieldName === 'regDoc') setRegDocFile(null);
                else if (fieldName === 'logo') { setLogoFile(null); setLogoPreview(null); }
                else if (fieldName === 'coverPhoto') { setCoverPhotoFile(null); setCoverPhotoPreview(null); }
                return;
            }
            
            setValue(placeholderField, file.name, { shouldValidate: true });
            setStatusMessage(null);

            if (fieldName === 'regDoc') {
                setRegDocFile(file);
            } else if (fieldName === 'logo') {
                setLogoFile(file);
                if (logoPreview) URL.revokeObjectURL(logoPreview);
                setLogoPreview(URL.createObjectURL(file));
            } else if (fieldName === 'coverPhoto') {
                setCoverPhotoFile(file);
                if (coverPhotoPreview) URL.revokeObjectURL(coverPhotoPreview);
                setCoverPhotoPreview(URL.createObjectURL(file));
            }
        } else {
            setValue(placeholderField, "", { shouldValidate: true });
            if (fieldName === 'regDoc') setRegDocFile(null);
            else if (fieldName === 'logo') { setLogoFile(null); setLogoPreview(null); }
            else if (fieldName === 'coverPhoto') { setCoverPhotoFile(null); setCoverPhotoPreview(null); }
        }
    };


    const handleNext = async () => {
        const fieldsToValidate: (keyof ManagerFormValues)[] =
            currentStep === 1 ? ['organizationName', 'contactPersonFullName', 'businessEmail', 'phoneNumber', 'physicalAddress', 'organizationWebsite', 'linkedinUrl'] : [];
        
        const isValid = await trigger(fieldsToValidate);
        if (isValid) {
            setCurrentStep(currentStep + 1);
            setStatusMessage(null);
        } else {
            setStatusMessage("Please correct the highlighted errors to proceed.");
        }
    };

    const onSubmit = async (values: ManagerFormValues) => {
        if (currentStep !== 2 || !user) {
            setStatusMessage("Error: You must be logged in to submit.");
            return;
        }
        setIsSubmitting(true);
        setStatusMessage("Creating your organization's profile...");

        const userUid = user.uid;
        if (!userUid) {
            setStatusMessage("Error: User ID is missing, please re-login.");
            setIsSubmitting(false);
            return;
        }

        try {
            const basicProfilePayload = {
                uid: userUid,
                organizationName: values.organizationName,
                contactPersonFullName: values.contactPersonFullName,
                businessEmail: values.businessEmail,
                phoneNumber: values.phoneNumber,
                physicalAddress: values.physicalAddress,
                organizationWebsite: values.organizationWebsite || '',
                linkedinUrl: values.linkedinUrl || '',
                aboutOrganization: values.aboutOrganization,
                industry: values.industry,
                profileCompleted: false, // Or some other status like 'pending_review'
            };

            const basicProfileResponse = await fetch('/api/onboarding/manager-basic', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(basicProfilePayload),
            });

            if (!basicProfileResponse.ok) {
                const errorData = await basicProfileResponse.json();
                throw new Error(errorData.message || 'Failed to create basic profile.');
            }

            setStatusMessage("Basic profile created. Now securely uploading documents...");

            if (!regDocFile) {
                throw new Error("Business registration document is required for verification.");
            }

            const fileFormData = new FormData();
            fileFormData.append('uid', userUid);
            fileFormData.append('businessRegDoc', regDocFile);
            if (logoFile) fileFormData.append('organizationLogo', logoFile);
            if (coverPhotoFile) fileFormData.append('organizationCoverPhoto', coverPhotoFile);
            
            const fileUploadResponse = await fetch('/api/onboarding/manager-files', {
                method: 'POST',
                body: fileFormData,
            });

            if (!fileUploadResponse.ok) {
                let errorMessage = 'Failed to upload documents.';
                try {
                    const contentType = fileUploadResponse.headers.get("content-type");
                    if (contentType && contentType.indexOf("application/json") !== -1) {
                        const errorData = await fileUploadResponse.json();
                        errorMessage = errorData.message || errorMessage;
                    } else {
                        const errorText = await fileUploadResponse.text();
                        console.error("Server returned a non-JSON error response:", errorText);
                        errorMessage = `An unexpected server error occurred. Please try again later.`;
                    }
                } catch (e) {
                    console.error("Could not parse error response:", e);
                }
                throw new Error(errorMessage);
            }

            setStatusMessage("Profile submitted for review! Redirecting...");
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
    
    const OrganizationProfilePreview = () => (
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
                    {logoPreview ? (
                        <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain p-2" />
                    ) : (
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                    )}
                </div>
                <div className="pt-12 text-center">
                    <h3 className="text-xl font-bold text-white truncate">{watchedValues.organizationName || 'Organization Name'}</h3>
                    <p className="text-sm text-gray-400 flex items-center justify-center gap-1.5 mt-1">
                        <MapPin className="h-4 w-4" />
                        {watchedValues.physicalAddress?.split(',')[0] || 'Organization City'}
                    </p>
                </div>
                 <div className="mt-4 border-t border-gray-700 pt-4 text-center">
                    <h4 className="text-xs uppercase font-semibold text-gray-500 mb-2">Industry</h4>
                     <p className="text-sm text-gray-300 flex items-center justify-center gap-2"><Briefcase className="h-4 w-4 text-green-400" /> {watchedValues.industry}</p>
                 </div>
                <div className="mt-4 border-t border-gray-700 pt-4">
                    <h4 className="text-xs uppercase font-semibold text-gray-500 mb-3 text-center">About</h4>
                    <p className="text-xs text-center text-gray-400 line-clamp-3">
                        {watchedValues.aboutOrganization || 'A brief description of the organization will appear here...'}
                    </p>
                </div>
            </div>
        </div>
    );

    const renderStep = () => {
        const inputClass = (hasError: boolean) => `w-full h-12 px-4 bg-[#2A2A2A] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${hasError ? 'border-red-500 ring-red-500' : 'border-gray-600 focus:ring-blue-500'}`;
        const labelClass = "block text-sm font-medium text-gray-400 mb-2";

        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-3 mb-4">1. Organization & Contact Details</h3>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div><label htmlFor="organizationName" className={labelClass}>Organization Name <span className="text-red-500">*</span></label><input id="organizationName" {...register("organizationName")} className={inputClass(!!errors.organizationName)} />{errors.organizationName && <p className="text-red-500 text-xs mt-1">{errors.organizationName.message}</p>}</div>
                            <div><label htmlFor="contactPersonFullName" className={labelClass}>Your Full Name <span className="text-red-500">*</span></label><input id="contactPersonFullName" {...register("contactPersonFullName")} className={inputClass(!!errors.contactPersonFullName)} />{errors.contactPersonFullName && <p className="text-red-500 text-xs mt-1">{errors.contactPersonFullName.message}</p>}</div>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div><label htmlFor="businessEmail" className={labelClass}>Official Business Email <span className="text-red-500">*</span></label><input id="businessEmail" type="email" {...register("businessEmail")} className={inputClass(!!errors.businessEmail)} />{errors.businessEmail && <p className="text-red-500 text-xs mt-1">{errors.businessEmail.message}</p>}</div>
                            <div><label htmlFor="phoneNumber" className={labelClass}>Official Phone Number <span className="text-red-500">*</span></label><input id="phoneNumber" type="tel" {...register("phoneNumber")} className={inputClass(!!errors.phoneNumber)} />{errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber.message}</p>}</div>
                        </div>
                        <div><label htmlFor="physicalAddress" className={labelClass}>Physical Office Address <span className="text-red-500">*</span></label><input id="physicalAddress" {...register("physicalAddress")} className={inputClass(!!errors.physicalAddress)} />{errors.physicalAddress && <p className="text-red-500 text-xs mt-1">{errors.physicalAddress.message}</p>}</div>
                        <hr className="border-gray-700"/>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div><label htmlFor="organizationWebsite" className={`${labelClass} flex items-center gap-1`}><LinkIcon className="h-4 w-4 text-gray-400" />Organization Website (Optional)</label><input id="organizationWebsite" {...register("organizationWebsite")} className={inputClass(!!errors.organizationWebsite)} placeholder="https://example.com" />{errors.organizationWebsite && <p className="text-red-500 text-xs mt-1">{errors.organizationWebsite.message}</p>}</div>
                            <div><label htmlFor="linkedinUrl" className={`${labelClass} flex items-center gap-1`}><LinkIcon className="h-4 w-4 text-blue-400" /> LinkedIn Page (Optional)</label><input id="linkedinUrl" {...register("linkedinUrl")} className={inputClass(!!errors.linkedinUrl)} />{errors.linkedinUrl && <p className="text-red-500 text-xs mt-1">{errors.linkedinUrl.message}</p>}</div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-3 mb-4">2. Verification & Profile Details</h3>
                        <div>
                            <label className={labelClass}>Business Registration Doc <span className="text-red-500">*</span> (<strong className="text-orange-400">Max 5MB</strong>)</label>
                            <p className="text-xs text-gray-400 mb-2">Upload a clear photo or PDF of your Certificate of Incorporation.</p>
                            <div className={`flex items-center space-x-2 border rounded-lg p-2 ${errors.businessRegDocPlaceholder ? 'border-red-500' : 'border-gray-600'}`}><UploadCloud className="h-5 w-5 text-gray-500" /><input id="regDocFile" type="file" accept="image/*,application/pdf" onChange={(e) => handleFileChange(e, 'regDoc')} className="flex-1 bg-transparent text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-900/50 file:text-blue-300 hover:file:bg-blue-900/80" /></div>
                            {errors.businessRegDocPlaceholder && <p className="text-red-500 text-xs mt-1">{errors.businessRegDocPlaceholder.message}</p>}
                            {regDocFile && <p className="text-xs text-green-400 mt-1 flex items-center"><CheckCircle className="h-3 w-3 mr-1"/>{regDocFile.name}</p>}
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                             <div>
                                <label className={labelClass}>Organization Logo (Optional, <strong className="text-orange-400">Max 5MB</strong>)</label>
                                <div className={`flex items-center space-x-2 border rounded-lg p-2 ${errors.organizationLogoPlaceholder ? 'border-red-500' : 'border-gray-600'}`}><UploadCloud className="h-5 w-5 text-gray-500" /><input id="logoFile" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} className="flex-1 bg-transparent text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-900/50 file:text-blue-300 hover:file:bg-blue-900/80" /></div>
                                {logoFile && <p className="text-xs text-green-400 mt-1 flex items-center"><CheckCircle className="h-3 w-3 mr-1"/>{logoFile.name}</p>}
                            </div>
                            <div>
                               <label className={labelClass}>Cover Photo (Optional, <strong className="text-orange-400">Max 5MB</strong>)</label>
                               <div className={`flex items-center space-x-2 border rounded-lg p-2 ${errors.organizationCoverPhotoPlaceholder ? 'border-red-500' : 'border-gray-600'}`}><UploadCloud className="h-5 w-5 text-gray-500" /><input id="coverPhotoFile" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'coverPhoto')} className="flex-1 bg-transparent text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-900/50 file:text-blue-300 hover:file:bg-blue-900/80"/></div>
                               {coverPhotoFile && <p className="text-xs text-green-400 mt-1 flex items-center"><CheckCircle className="h-3 w-3 mr-1" /> {coverPhotoFile.name}</p>}
                            </div>
                        </div>
                        <div><label htmlFor="aboutOrganization" className={labelClass}>About Your Organization <span className="text-red-500">*</span></label><textarea id="aboutOrganization" {...register("aboutOrganization")} rows={4} className={inputClass(!!errors.aboutOrganization) + ' h-auto py-3'} placeholder="What does your organization do? What is your mission?" />{errors.aboutOrganization && <p className="text-red-500 text-xs mt-1">{errors.aboutOrganization.message}</p>}</div>
                        <div>
                            <label htmlFor="industry" className={labelClass}>Industry / Sector <span className="text-red-500">*</span></label>
                            <select id="industry" {...register('industry')} className={inputClass(!!errors.industry)}>{INDUSTRIES.map(t => <option key={t}>{t}</option>)}</select>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    const progress = (currentStep - 1) / 1 * 100; // Only 1 step transition (1 -> 2)

    return (
        <div className="relative min-h-screen bg-[#1E1E1E] text-gray-300 font-sans">
            <header className="absolute top-0 left-0 p-6 z-10"><SaloneSkillsLinkLogo className="w-8 h-8 text-white" /></header>

            <div className="container mx-auto px-4 py-24">
                <div className="flex flex-col lg:flex-row lg:gap-16">
                    {/* Left side: Profile Preview */}
                    <div className="w-full lg:w-2/5 mb-12 lg:mb-0">
                       <OrganizationProfilePreview />
                    </div>

                    {/* Right side: Form */}
                    <div className="w-full lg:w-3/5">
                        <div className="w-full bg-[#252525]/50 backdrop-blur-sm border border-gray-700/50 rounded-lg shadow-2xl">
                            <div className="p-6 sm:p-8">
                                <div className="h-2 bg-gray-700 rounded-full w-full">
                                    <div className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}/>
                                </div>
                                <p className="text-sm text-blue-400 mt-2 font-semibold text-center">{`Step ${currentStep} of 2: ${currentStep === 1 ? 'Organization Details' : 'Verification'}`}</p>
                            </div>

                            <div className="p-6 sm:p-8">
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                                    {renderStep()}
                                    <div className="flex justify-between items-center pt-6 border-t border-gray-700 mt-8">
                                        {currentStep > 1 ? (
                                            <button type="button" onClick={() => setCurrentStep(currentStep - 1)} disabled={isSubmitting} className="flex items-center px-6 py-2 font-semibold text-blue-400 hover:text-white disabled:opacity-50"><ArrowLeft className="mr-2 h-4 w-4" /> Back</button>
                                        ) : <div></div>}

                                        {currentStep < 2 ? (
                                            <button type="button" onClick={handleNext} disabled={isSubmitting} className="flex items-center ml-auto px-6 py-2 font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:bg-blue-800">Next <ArrowRight className="ml-2 h-4 w-4" /></button>
                                        ) : (
                                            <button type="submit" disabled={isSubmitting} className="flex items-center w-full justify-center px-6 py-2 font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:bg-green-800">{isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting for Review...</> : 'Confirm & Submit Profile'}</button>
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
