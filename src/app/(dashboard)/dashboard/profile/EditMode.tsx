'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { FaUser, FaSave, FaPlus, FaTimes, FaSpinner, FaCamera, FaImage, FaTools, FaAddressCard } from 'react-icons/fa';
import { MdOutlineWork } from 'react-icons/md';
import { Button } from '@/components/ui/button';
import { Card, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { profileSchema, ProfileFormValues, itemVariants } from './common';

interface EditModeProps {
  userProfile: any;
  refreshUserProfile: () => Promise<void>;
  onSave: () => void;
}

export const EditMode: React.FC<EditModeProps> = ({ userProfile, refreshUserProfile, onSave }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [currentSkills, setCurrentSkills] = useState<string[]>(userProfile.selectedSkills || []);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: 'onBlur',
    defaultValues: {},
  });

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = form;

  const profilePicturePreview = watch('profilePictureUrl');
  const coverPhotoPreview = watch('coverPhotoUrl');

  useEffect(() => {
    reset({
      fullName: userProfile.fullName || '',
      profilePictureUrl: userProfile.profilePictureUrl || '',
      coverPhotoUrl: userProfile.coverPhotoUrl || '',
      bio: userProfile.bio || '',
      location: userProfile.location || '',
      phoneNumber: userProfile.phoneNumber || '',
      whatsappNumber: userProfile.whatsappNumber || '',
      githubUrl: userProfile.githubUrl || '',
      linkedinUrl: userProfile.linkedinUrl || '',
      careerObjective: userProfile.careerObjective || '',
      primarySkill: userProfile.primarySkill || '',
    });
    setCurrentSkills(userProfile.selectedSkills || []);
  }, [userProfile, reset]);

  const handleFileUpload = async (file: File, type: 'profile' | 'cover') => {
    const isProfile = type === 'profile';
    if (isProfile) setIsUploadingImage(true);
    else setIsUploadingCover(true);

    const formData = new FormData();
    formData.append('image', file);

    const uploadPromise = fetch('/api/upload', { method: 'POST', body: formData });
    
    toast.promise(uploadPromise, {
      loading: `Uploading ${isProfile ? 'image' : 'cover photo'}...`,
      success: (response) => {
        if (!response.ok) throw new Error('Upload failed.');
        return response.json();
      },
      error: (err) => `Upload failed: ${err.message}`,
    });

    try {
      const response = await uploadPromise;
      const data = await response.json();
      if (data.url) {
        setValue(isProfile ? 'profilePictureUrl' : 'coverPhotoUrl', data.url, { shouldValidate: true });
        toast.success(`${isProfile ? 'Profile picture' : 'Cover photo'} updated!`);
      } else {
        throw new Error(data.error || 'Failed to get image URL.');
      }
    } catch (error: any) {
      console.error(error);
    } finally {
      if (isProfile) setIsUploadingImage(false);
      else setIsUploadingCover(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
    const file = event.target.files?.[0];
    if (file) handleFileUpload(file, type);
    event.target.value = '';
  };
  
  const addSkill = useCallback(() => {
    const trimmedSkill = newSkill.trim();
    if (trimmedSkill && !currentSkills.includes(trimmedSkill)) {
      setCurrentSkills((prev) => [...prev, trimmedSkill]);
      setNewSkill('');
    } else if (trimmedSkill) {
      toast.warning('Skill already exists.');
    }
  }, [newSkill, currentSkills]);

  const removeSkill = useCallback((skillToRemove: string) => {
    setCurrentSkills((prev) => prev.filter((skill) => skill !== skillToRemove));
  }, []);

  const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, selectedSkills: currentSkills }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }
      await refreshUserProfile();
      onSave(); // This will switch back to view mode
      toast.success('Profile Updated!');
    } catch (error: any) {
      toast.error('Update Failed', { description: error.message || 'Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="visible">
      <Card className="bg-transparent border-slate-800 text-white shadow-lg p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <h2 className="text-3xl font-bold text-slate-200 border-b border-slate-700 pb-4 mb-6">Edit Profile</h2>

          {/* Sections */}
          <section className="space-y-6 p-4 border border-slate-800 rounded-lg">
            <h3 className="text-xl font-semibold text-slate-300 flex items-center gap-2"><FaUser /> Basic Information</h3>
            <div>
              <Label className="text-base text-slate-400 mb-2 block">Profile Picture</Label>
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20 border-2 border-slate-700">
                  <AvatarImage src={profilePicturePreview} alt="Profile preview" />
                  <AvatarFallback className="bg-slate-700 text-3xl">{userProfile.fullName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <Input id="profilePictureInput" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'profile')} className="hidden" />
                <Button type="button" variant="outline" onClick={() => document.getElementById('profilePictureInput')?.click()} disabled={isUploadingImage} className="bg-slate-800 border-slate-700 hover:bg-slate-700">
                  {isUploadingImage ? <FaSpinner className="mr-2 h-4 w-4 animate-spin" /> : <FaCamera className="mr-2" />}
                  {isUploadingImage ? 'Uploading...' : 'Change'}
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-base text-slate-400 mb-2 block">Cover Photo</Label>
              <div className="flex items-center gap-4">
                <div className="w-32 h-20 rounded-md border-2 border-slate-700 bg-slate-800 overflow-hidden">
                   {coverPhotoPreview ? <img src={coverPhotoPreview} alt="Cover preview" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-r from-blue-700 to-indigo-800" />}
                </div>
                <Input id="coverPhotoInput" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'cover')} className="hidden" />
                <Button type="button" variant="outline" onClick={() => document.getElementById('coverPhotoInput')?.click()} disabled={isUploadingCover} className="bg-slate-800 border-slate-700 hover:bg-slate-700">
                  {isUploadingCover ? <FaSpinner className="mr-2 h-4 w-4 animate-spin" /> : <FaImage className="mr-2" />}
                  {isUploadingCover ? 'Uploading...' : 'Change'}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="fullName" className="text-base text-slate-400 mb-2 block">Full Name</Label>
                <Input id="fullName" {...register('fullName')} className="p-3 bg-slate-800 border-slate-700 text-white focus:border-blue-500" />
                {errors.fullName && <p className="text-red-400 text-sm mt-1">{errors.fullName.message}</p>}
              </div>
              <div>
                <Label htmlFor="location" className="text-base text-slate-400 mb-2 block">Location (City, Country)</Label>
                <Input id="location" {...register('location')} className="p-3 bg-slate-800 border-slate-700 text-white focus:border-blue-500" />
              </div>
            </div>
          </section>

          <section className="space-y-6 p-4 border border-slate-800 rounded-lg">
            <h3 className="text-xl font-semibold text-slate-300 flex items-center gap-2"><MdOutlineWork /> Professional Details</h3>
            <div>
              <Label htmlFor="primarySkill" className="text-base text-slate-400 mb-2 block">Primary Skill / Title</Label>
              <Input id="primarySkill" {...register('primarySkill')} placeholder="e.g., Full-Stack Developer" className="p-3 bg-slate-800 border-slate-700 text-white focus:border-blue-500" />
            </div>
            <div>
              <Label htmlFor="bio" className="text-base text-slate-400 mb-2 block">About Me (Bio)</Label>
              <Textarea id="bio" {...register('bio')} rows={5} className="p-3 bg-slate-800 border-slate-700 text-white focus:border-blue-500" />
              {errors.bio && <p className="text-red-400 text-sm mt-1">{errors.bio.message}</p>}
            </div>
            <div>
              <Label htmlFor="careerObjective" className="text-base text-slate-400 mb-2 block">Career Objective</Label>
              <Textarea id="careerObjective" {...register('careerObjective')} rows={3} className="p-3 bg-slate-800 border-slate-700 text-white focus:border-blue-500" />
            </div>
          </section>

          <section className="space-y-6 p-4 border border-slate-800 rounded-lg">
             <h3 className="text-xl font-semibold text-slate-300 flex items-center gap-2"><FaAddressCard /> Contact & Socials</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                <Label htmlFor="phoneNumber" className="text-base text-slate-400 mb-2 block">Phone Number</Label>
                <Input id="phoneNumber" {...register('phoneNumber')} className="p-3 bg-slate-800 border-slate-700 text-white focus:border-blue-500" />
              </div>
               <div>
                <Label htmlFor="whatsappNumber" className="text-base text-slate-400 mb-2 block">WhatsApp Number</Label>
                <Input id="whatsappNumber" {...register('whatsappNumber')} className="p-3 bg-slate-800 border-slate-700 text-white focus:border-blue-500" />
              </div>
               <div>
                <Label htmlFor="githubUrl" className="text-base text-slate-400 mb-2 block">GitHub URL</Label>
                <Input id="githubUrl" {...register('githubUrl')} className="p-3 bg-slate-800 border-slate-700 text-white focus:border-blue-500" />
                 {errors.githubUrl && <p className="text-red-400 text-sm mt-1">{errors.githubUrl.message}</p>}
              </div>
               <div>
                <Label htmlFor="linkedinUrl" className="text-base text-slate-400 mb-2 block">LinkedIn URL</Label>
                <Input id="linkedinUrl" {...register('linkedinUrl')} className="p-3 bg-slate-800 border-slate-700 text-white focus:border-blue-500" />
                {errors.linkedinUrl && <p className="text-red-400 text-sm mt-1">{errors.linkedinUrl.message}</p>}
              </div>
            </div>
          </section>

          <section className="space-y-4 p-4 border border-slate-800 rounded-lg">
            <h3 className="text-xl font-semibold text-slate-300 flex items-center gap-2"><FaTools /> Skills & Expertise</h3>
            <div className="flex gap-2">
              <Input type="text" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} placeholder="Add a skill..." className="flex-1 p-3 bg-slate-800 border-slate-700 text-white focus:border-blue-500" />
              <Button type="button" onClick={addSkill} className="bg-blue-600 hover:bg-blue-700 text-white"><FaPlus /> Add</Button>
            </div>
            <div className="flex flex-wrap gap-3 pt-3">
              {currentSkills.map((skill) => (
                <span key={skill} className="flex items-center gap-2 bg-slate-700 text-white text-sm font-medium px-4 py-2 rounded-full">
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)} className="text-slate-400 hover:text-red-400"><FaTimes /></button>
                </span>
              ))}
            </div>
          </section>

          <CardFooter className="flex justify-end gap-4 p-0 pt-6 border-t border-slate-700 mt-8">
            <Button type="submit" size="lg" disabled={isSaving} className="text-base px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
              {isSaving ? <><FaSpinner className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><FaSave className="mr-2" /> Save Changes</>}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
};