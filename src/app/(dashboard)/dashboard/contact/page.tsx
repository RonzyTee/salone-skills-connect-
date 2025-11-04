

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhone,
  FaClock,
  FaPaperPlane,
  FaSpinner,
  FaCheckCircle,
  FaGithub,
  FaLinkedin,
  FaWhatsapp,
} from 'react-icons/fa';
import { SiMinutemailer } from 'react-icons/si';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';


// --- Reusable Footer Component (copied from dashboard) ---
const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="text-slate-400 hover:text-blue-400 transition-colors duration-200 text-sm">
    {children}
  </Link>
);

const Footer = () => {
  return (
    <footer className="bg-slate-900/50 border-t border-slate-800 py-16 px-6 sm:px-8 mt-24">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          
          <div className="sm:col-span-2 lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <SiMinutemailer className="h-8 w-8 text-blue-500" />
              <h3 className="text-xl font-bold text-white">Salone Skills Connect</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Building a trusted skills economy for Sierra Leone's youth by verifying talent and creating opportunities.
            </p>
             <div className="pt-4 space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <FaMapMarkerAlt className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <span>Freetown, Sierra Leone</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <FaPhone className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <a href="tel:+23299761998" className="hover:text-blue-400 transition-colors">+232 99761998</a>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <FaEnvelope className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <a href="mailto:info@saloneskills.sl" className="hover:text-blue-400 transition-colors">info@saloneskills.sl</a>
              </div>
            </div>
            <div className="pt-4 flex items-center gap-6">
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-slate-400 hover:text-blue-400 transition-colors"><FaLinkedin className="h-6 w-6" /></a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-slate-400 hover:text-white transition-colors"><FaGithub className="h-6 w-6" /></a>
                <a href="https://wa.me/23299761998" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="text-slate-400 hover:text-green-400 transition-colors"><FaWhatsapp className="h-6 w-6" /></a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-white tracking-wide">Quick Links</h4>
            <div className="flex flex-col space-y-3">
              {/* Fix: Provided children to FooterLink components to resolve missing 'children' prop error. */}
              <FooterLink href="/talent">Find Talent</FooterLink>
              <FooterLink href="/jobs">Find Work</FooterLink>
              <FooterLink href="/about">About Us</FooterLink>
              <FooterLink href="/blog">Blog</FooterLink>
              <FooterLink href="/how-it-works">How It Works</FooterLink>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-white tracking-wide">Explore</h4>
            <div className="flex flex-col space-y-3">
              {/* Fix: Provided children to FooterLink components to resolve missing 'children' prop error. */}
              <FooterLink href="/portfolios">Browse Portfolios</FooterLink>
              <FooterLink href="/success-stories">Success Stories</FooterLink>
              <FooterLink href="/sell-ideas">Sell Your Ideas</FooterLink>
              <FooterLink href="/mentorship">Mentorship</FooterLink>
              <FooterLink href="/events">Events & Workshops</FooterLink>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold text-white tracking-wide">Support</h4>
            <div className="flex flex-col space-y-3">
              {/* Fix: Provided children to FooterLink components to resolve missing 'children' prop error. */}
              <FooterLink href="/community">Community Forum</FooterLink>
              <FooterLink href="/resume-builder">Resume Builder</FooterLink>
              <FooterLink href="/support">Support / FAQ</FooterLink>
              <FooterLink href="/terms">Terms of Service</FooterLink>
              <FooterLink href="/privacy">Privacy Policy</FooterLink>
            </div>
          </div>
        </div>

        <div className="text-center mt-12 border-t border-slate-800 pt-8">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Salone Skills Connect. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};


// --- Main Contact Page Component ---
export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormState(prevState => ({ ...prevState, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionStatus('loading');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In a real app, you would send the form data to a backend endpoint.
    console.log('Form submitted:', formState);

    // For demonstration, we'll just set it to success.
    setSubmissionStatus('success');

    // Reset form after a delay
    setTimeout(() => {
        setSubmissionStatus('idle');
        setFormState({ name: '', email: '', subject: '', message: '' });
    }, 4000);
  };

  return (
    <div className="bg-slate-950 text-white min-h-screen">
      <main className="container mx-auto px-4 py-16 sm:py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">Get In Touch</h1>
          <p className="mt-4 text-lg text-slate-400">
            Have a question, a project idea, or just want to say hello? We'd love to hear from you.
            Use the form below or reach out to us directly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left Column: Info & Map Card */}
          <div className="space-y-12">
            {/* Operating Hours */}
            <div className="space-y-4">
               <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <FaClock className="text-blue-400" />
                  Operating Hours
               </h2>
               <Card className="bg-slate-900 border-slate-800">
                 <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                       <p className="font-semibold text-slate-300">Monday - Friday:</p>
                       <p className="font-mono text-green-400 bg-green-900/50 px-3 py-1 rounded-md">8:00 AM - 4:30 PM</p>
                    </div>
                    <Separator className="bg-slate-800" />
                    <p className="text-sm text-slate-500 text-center">
                       Closed on weekends and national holidays.
                    </p>
                 </CardContent>
               </Card>
            </div>

            {/* Find Us Card */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                 <FaMapMarkerAlt className="text-blue-400" />
                 Find Us
              </h2>
              <p className="text-slate-400">
                Our office is conveniently located at Jalloh Terrace in the heart of Freetown, making it easily accessible for all citizens.
              </p>
              <div className="bg-gradient-to-br from-green-400/10 via-slate-900/10 to-blue-400/10 p-8 rounded-2xl shadow-lg border border-slate-800/50 text-center">
                  <FaMapMarkerAlt className="mx-auto h-12 w-12 text-green-400 mb-6" />
                  <h3 className="text-xl font-bold text-white">Salone skill Connect</h3>
                  <p className="text-slate-400 mt-2">Jalloh Terrace, Freetown</p>
                  <p className="text-slate-400">Sierra Leone</p>
                  <div className="mt-8 flex justify-center gap-4">
                    <a href="tel:+23299761998">
                      <Button className="bg-green-500 hover:bg-green-600 text-white">
                        <FaPhone className="mr-2 h-4 w-4" />
                        Call Us
                      </Button>
                    </a>
                    <a href="mailto:info@saloneskills.sl">
                       <Button variant="outline" className="bg-transparent border-slate-600 hover:bg-slate-800 hover:text-white">
                         <FaEnvelope className="mr-2 h-4 w-4" />
                         Email Us
                       </Button>
                    </a>
                  </div>
              </div>
            </div>
          </div>
          {/* Right Column: Contact Form */}
          <div>
            <Card className="bg-slate-900 border-slate-800 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                  <FaPaperPlane className="text-blue-400"/>
                  Send a Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                {submissionStatus === 'success' ? (
                  <div className="text-center py-10">
                    <FaCheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                    <h3 className="text-xl font-semibold text-white">Message Sent!</h3>
                    <p className="text-slate-400 mt-2">Thank you for reaching out. We'll get back to you shortly.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <Label htmlFor="name" className="text-slate-300">Full Name</Label>
                          <Input id="name" placeholder="John Doe" required className="bg-slate-800 border-slate-700" value={formState.name} onChange={handleInputChange} />
                       </div>
                       <div className="space-y-2">
                          <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                          <Input id="email" type="email" placeholder="you@example.com" required className="bg-slate-800 border-slate-700" value={formState.email} onChange={handleInputChange} />
                       </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="subject" className="text-slate-300">Subject</Label>
                        <Input id="subject" placeholder="e.g., Project Inquiry" required className="bg-slate-800 border-slate-700" value={formState.subject} onChange={handleInputChange} />
                     </div>
                     <div className="space-y-2">
                        <Label htmlFor="message" className="text-slate-300">Your Message</Label>
                        <Textarea id="message" placeholder="Tell us how we can help..." required rows={5} className="bg-slate-800 border-slate-700" value={formState.message} onChange={handleInputChange} />
                     </div>
                     <div>
                       <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold" disabled={submissionStatus === 'loading'}>
                         {submissionStatus === 'loading' ? (
                           <FaSpinner className="animate-spin mr-2" />
                         ) : (
                           <FaPaperPlane className="mr-2" />
                         )}
                         {submissionStatus === 'loading' ? 'Sending...' : 'Send Message'}
                       </Button>
                     </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}