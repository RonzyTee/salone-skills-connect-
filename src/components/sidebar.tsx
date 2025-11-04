// components/sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { ReactNode } from 'react';
import {
  FaTachometerAlt, FaFolderOpen, FaUserCircle, FaEnvelope, FaCog,
  FaSearch, FaBuilding, FaHandsHelping, FaCalendarAlt, FaComments, FaFileAlt, FaStore
} from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { useLoading } from '@/context/LoadingContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// --- NAVIGATION ITEMS ---
const YOUTH_NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: <FaTachometerAlt /> },
  { href: '/dashboard/portfolio', label: 'My Portfolio', icon: <FaFolderOpen /> },
  { href: '/dashboard/profile', label: 'My Public Profile', icon: <FaUserCircle /> },
  { href: '/dashboard/jobs', label: 'Job Search', icon: <FaSearch /> },
  { href: '/dashboard/marketplace', label: 'Market Place', icon: <FaStore /> },
  { href: '/dashboard/mentorship', label: 'Mentorship', icon: <FaHandsHelping />, isComingSoon: true },
  { href: '/dashboard/events', label: 'Events & Workshops', icon: <FaCalendarAlt />, isComingSoon: true },
  { href: '/dashboard/forum', label: 'Community Forum', icon: <FaComments />, isComingSoon: true },
  { href: '/dashboard/cv-builder', label: 'CV Builder', icon: <FaFileAlt />, isComingSoon: true },
  { href: '/dashboard/messages', label: 'Messages', icon: <FaEnvelope /> },
  { href: '/dashboard/settings', label: 'Settings', icon: <FaCog /> },
];

const MANAGER_NAV_LINKS = [
  { href: '/dashboard/manager', label: 'Dashboard', icon: <FaTachometerAlt /> },
  { href: '/dashboard/browse', label: 'Browse Talent', icon: <FaSearch /> },
  { href: '/dashboard/organization', label: 'My Organization', icon: <FaBuilding /> },
  { href: '/dashboard/messages', label: 'Messages', icon: <FaEnvelope /> },
  { href: '/dashboard/settings', label: 'Settings', icon: <FaCog /> },
];


// --- SIDEBAR LINK COMPONENT (Adjusted for new width) ---
interface SidebarLinkProps {
  href: string;
  label: string;
  icon: ReactNode;
  isComingSoon?: boolean;
}

function SidebarLink({ href, label, icon, isComingSoon = false }: SidebarLinkProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { showLoader } = useLoading();
  const isActive = pathname === href;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (isComingSoon) return;
    if (!isActive) {
      showLoader();
      router.push(href);
    }
  };

  const linkClasses = `flex items-center gap-4 rounded-lg px-3 py-2.5 text-base font-medium transition-all ${
    isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400'
  } ${
    isComingSoon ? 'opacity-50 cursor-not-allowed hover:bg-transparent hover:text-gray-400' : 'hover:text-white hover:bg-gray-800'
  } group-hover:justify-start justify-center`;

  const tooltipContent = isComingSoon ? `${label} (Coming Soon!)` : label;

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={href} onClick={handleClick} className={linkClasses}>
            {React.cloneElement(icon as React.ReactElement, { className: "h-5 w-5 flex-shrink-0" })}
            <span className="hidden group-hover:inline whitespace-nowrap">{label}</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-black border-gray-700 text-white group-hover:hidden">
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}


// --- MAIN REDESIGNED SIDEBAR (Width Reduced) ---
export default function Sidebar() {
  const { userProfile, loading } = useAuth();

  if (loading || !userProfile) {
    return (
      <aside className="hidden w-16 flex-col border-r border-gray-800 bg-black p-3 md:flex">
        <div className="flex h-14 items-center justify-center mb-4 flex-shrink-0">
          <div className="h-7 w-7 bg-gray-800 rounded-full animate-pulse"></div>
        </div>
        <div className="flex flex-col gap-3 flex-1 items-center">
          <div className="h-9 w-9 bg-gray-800 rounded-lg animate-pulse"></div>
          <div className="h-9 w-9 bg-gray-800 rounded-lg animate-pulse"></div>
          <div className="h-9 w-9 bg-gray-800 rounded-lg animate-pulse"></div>
        </div>
      </aside>
    );
  }

  const userRole = userProfile.userType || userProfile.role;
  const navLinks = userRole === 'youth' ? YOUTH_NAV_LINKS : MANAGER_NAV_LINKS;

  return (
    <aside className="group hidden md:flex h-screen sticky top-0 w-16 hover:w-64 flex-col border-r border-gray-800 bg-black p-3 transition-all duration-300 ease-in-out">
      {/* Logo Section */}
      <div className="flex h-14 items-center gap-2 mb-4 px-1 flex-shrink-0">
        <svg className="h-7 w-7 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M2 7L12 12" stroke="white" strokeWidth="2" strokeLinejoin="round"/><path d="M12 22V12" stroke="white" strokeWidth="2" strokeLinejoin="round"/><path d="M22 7L12 12" stroke="white" strokeWidth="2" strokeLinejoin="round"/><path d="M17 4.5L7 9.5" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
        </svg>
        <span className="font-bold text-lg whitespace-nowrap hidden group-hover:inline">SkillsLink</span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-2">
          {navLinks.map((link) => (
            <li key={link.href}>
              <SidebarLink {...link} />
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}