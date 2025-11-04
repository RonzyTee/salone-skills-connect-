// src/app/(auth)/choose-role/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { User, Building, Loader2, Globe, ChevronDown } from 'lucide-react';

// --- SVG ICON COMPONENTS (Reused from Sign-In/Sign-Up) ---
const SaloneSkillsLinkLogo = ({ className }: { className?: string }) => (
  <svg className={className || "h-16 w-16 mb-4 text-white"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"/>
  </svg>
);
const ShieldIcon = () => (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path> </svg>
);

// --- MAIN CHOOSE ROLE COMPONENT ---
export default function ChooseRolePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isSelecting, setIsSelecting] = useState<'youth' | 'manager' | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  const handleRoleSelection = async (role: 'youth' | 'manager') => {
    if (!user || !user.uid) {
      router.push('/signin');
      return;
    }

    setIsSelecting(role);

    try {
      const response = await fetch('/api/user/set-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, userType: role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set user role.');
      }      
      router.push('/onboarding');
    } catch (error) {
      console.error("Error setting user role:", error);
      setIsSelecting(null);
    }
  };
  
  const RoleButton = ({ role, icon, title, description, isSelecting, onSelect }: any) => (
    <button
        onClick={onSelect}
        disabled={!!isSelecting}
        className={`relative group w-full p-6 text-left bg-[#2A2A2A] border border-gray-700 rounded-lg overflow-hidden transition-all duration-300 ease-in-out hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed`}
    >
        <div className="flex items-center">
            <div className="p-3 bg-gray-700/50 rounded-lg mr-5">
                {icon}
            </div>
            <div>
                <h3 className="text-xl font-bold text-white">{title}</h3>
                <p className="text-sm text-gray-400 mt-1">{description}</p>
            </div>
        </div>
        {isSelecting && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        )}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -translate-x-full group-hover:translate-x-full animate-pulse-slow"></div>
    </button>
  );

  const GlobalStyles = () => (
    <style jsx global>{`
      @keyframes gradient-animation { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
      .animate-gradient { background-size: 200% 200%; animation: gradient-animation 6s ease infinite; }
      @keyframes fade-in-down { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
      .fade-in-down { opacity: 0; animation: fade-in-down 0.8s ease-out 0.2s forwards; }
      @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      .fade-in-up-1 { opacity: 0; animation: fade-in-up 0.8s ease-out forwards; }
      .fade-in-up-2 { opacity: 0; animation: fade-in-up 0.8s ease-out 0.3s forwards; }
      @keyframes pulse-slow {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
      }
      .animate-pulse-slow {
        animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
    `}</style>
  );

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1E1E1E] text-gray-300">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-3 text-lg">Verifying session...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#1E1E1E] text-gray-300 font-sans overflow-hidden">
      <GlobalStyles />
      <header className="absolute top-0 left-0 p-6 z-10">
        <SaloneSkillsLinkLogo className="w-8 h-8 text-white" />
      </header>

      <div className="flex flex-col lg:flex-row min-h-screen">
        <div className="hidden lg:flex w-full lg:w-1/2 items-center justify-center p-8 lg:p-12 bg-black/20">
            <div className="text-center lg:text-left flex flex-col items-center lg:items-start">
                 <SaloneSkillsLinkLogo className="h-16 w-16 mb-4 text-white fade-in-down" />
                 <h1 className="text-5xl md:text-6xl font-black text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 animate-gradient fade-in-up-1">
                    One Last Step...
                </h1>
                <h2 className="text-xl md:text-2xl text-gray-400 fade-in-up-2">
                    To give you the best experience, please select your role.
                </h2>
            </div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-sm text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Tell us who you are</h1>
            <p className="text-base text-gray-400 mb-8">
              This helps us customize your experience.
            </p>
            
            <div className="space-y-4">
              <RoleButton
                  role="youth"
                  icon={<User className="h-8 w-8 text-blue-400" />}
                  title="Youth"
                  description="Start your learning journey and build your skills."
                  isSelecting={isSelecting === 'youth'}
                  onSelect={() => handleRoleSelection('youth')}
              />
              <RoleButton
                  role="manager"
                  icon={<Building className="h-8 w-8 text-purple-400" />}
                  title="Manager"
                  description="Manage programs and track youth development."
                  isSelecting={isSelecting === 'manager'}
                  onSelect={() => handleRoleSelection('manager')}
              />
            </div>
          </div>
        </div>
      </div>

      <footer className="hidden lg:block absolute bottom-0 left-0 w-full bg-[#1E1E1E]">
        <div className="max-w-7xl mx-auto px-8 py-4 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-400">
            <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-2">
                <Link href="/legal" className="hover:text-white">Legal</Link>
                <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
                <Link href="/cookies" className="hover:text-white">Cookies</Link>
                <button className="hover:text-white">Cookie Settings</button>
                <button className="hover:text-white text-center">Do Not Sell or Share My Personal Information</button>
            </div>
            <div className="mt-4 sm:mt-0">
                <button className="flex items-center gap-2 hover:text-white">
                    <Globe className="h-4 w-4" />
                    <span>English</span>
                    <ChevronDown className="h-4 w-4" />
                </button>
            </div>
        </div>
      </footer>

      <div className="fixed bottom-4 right-4 bg-gray-800 p-2 rounded-full shadow-lg">
        <ShieldIcon />
      </div>
    </div>
  );
}