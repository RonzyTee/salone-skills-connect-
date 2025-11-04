'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FaPaperPlane, FaSpinner } from 'react-icons/fa';

// NEW: Import EmailJS
import emailjs from '@emailjs/browser';

interface EndorsementRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: { id: string; title: string; } | null; // NEW: Pass the project object
  userProfile: { name: string; } | null; // NEW: Pass user's name
  onSubmit: (projectId: string, clientEmail: string) => Promise<void>;
}

const EndorsementRequestModal: React.FC<EndorsementRequestModalProps> = ({
  isOpen,
  onClose,
  project, // Updated
  userProfile, // Updated
  onSubmit,
}) => {
  const [clientEmail, setClientEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Get keys from environment
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!;
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!;

  useEffect(() => {
    if (isOpen) {
      setClientEmail('');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !userProfile) {
        setError('Missing project or user data.');
        return;
    }

    if (!clientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    
    if (!serviceId || !templateId || !publicKey) {
      setError('Email service is not configured. Please check environment variables.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    
    // --- THIS IS THE NEW EMAILJS LOGIC ---
    try {
      // 1. Generate the unique endorsement link
      //    We will need to build the page for this link next
      //    Using btoa() to slightly hide the email in the URL
      const endorsementLink = `${window.location.origin}/endorse/${project.id}?client=${btoa(clientEmail)}`;

      // 2. Define the variables for your EmailJS template
      const templateParams = {
        project_title: project.title,
        talent_name: userProfile.name,
        endorsement_link: endorsementLink,
        to_email: clientEmail, 
      };

      // 3. Send the email via EmailJS
      await emailjs.send(
        serviceId,
        templateId,
        templateParams,
        publicKey
      );

      // 4. If email sends, call the original onSubmit
      //    This will update Firestore to set the project to "pending"
      await onSubmit(project.id, clientEmail);

    } catch (err) {
      console.error(err);
      setError('An error occurred sending the email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-white">Request Client Endorsement</DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter your client's email address. We will send them a secure link to
              verify and endorse your project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right text-slate-300">
                Client's Email
              </Label>
              <Input
                id="email"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="client@example.com"
                className="col-span-3 bg-slate-800 border-slate-700 text-white focus:ring-blue-500"
                required
              />
            </div>
            {error && (
              <p className="col-span-4 text-red-400 text-sm text-center">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="bg-slate-700 hover:bg-slate-600 border-slate-600"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <FaSpinner className="animate-spin mr-2" />
              ) : (
                <FaPaperPlane className="mr-2 h-4 w-4" />
              )}
              {isSubmitting ? 'Sending...' : 'Send Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EndorsementRequestModal;