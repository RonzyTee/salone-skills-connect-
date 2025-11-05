'use client';

import React, { useEffect, useState, useRef, ReactNode, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FaCog, FaSignOutAlt, FaUser, FaBriefcase, FaEnvelope, FaTachometerAlt,
  FaUsers, FaBuilding, FaSearch, FaFileAlt, FaStore, FaLightbulb,
  FaFileInvoice, FaShieldAlt, FaHistory, FaQuestionCircle, FaComments,
  FaExpandArrowsAlt, FaTh, FaBell, FaFolderOpen, FaUserCircle, FaHandsHelping,
  FaCalendarAlt, FaCode, FaBook, FaInfoCircle, FaSpinner, FaPlus, FaAngleRight
} from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useLoading } from '@/context/LoadingContext';
import Loader from '@/components/ui/loader';
import toast from 'react-hot-toast';

// FIXED: Add .tsx extension to force correct module resolution
import { ChatWidget } from '@/components/chat-widget';

// UPDATED INTERFACE
interface UserProfile {
  uid: string;
  email: string;
  userType: 'youth' | 'manager';
  
  // Youth fields
  fullName?: string;
  profilePictureUrl?: string;

  // Manager fields
  organizationName?: string;
  organizationLogoUrl?: string;
  contactPersonFullName?: string; // ← Fixed: now recognized
}

const playNotificationSound = () => {
  if (typeof window !== 'undefined' && window.AudioContext) {
    try {
      const audioContext = new window.AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.error("Error playing notification sound:", e);
    }
  }
};

// --- NAVIGATION LINKS ---
const YOUTH_NAV_LINKS_UNSORTED = [
  { href: '/dashboard', label: 'Dashboard', icon: <FaTachometerAlt /> },
  { href: '/dashboard/portfolio', label: 'My Portfolio', icon: <FaFolderOpen /> },
  { href: '/dashboard/jobs', label: 'Job Search', icon: <FaSearch /> },
  { href: '/dashboard/marketplace', label: 'Market Place', icon: <FaStore /> },
  { href: '/dashboard/ideas', label: 'Sell your Ideas', icon: <FaLightbulb />, isComingSoon: true },
  { href: '/dashboard/mentorship', label: 'Mentorship', icon: <FaHandsHelping />, isComingSoon: true },
  { href: '/dashboard/events', label: 'Events & Workshops', icon: <FaCalendarAlt />, isComingSoon: true },
  { href: '/dashboard/community', label: 'Community Forum', icon: <FaComments /> },
  { href: '/dashboard/cv-builder', label: 'CV Builder', icon: <FaFileAlt /> },
  { href: '/chat', label: 'Messages', icon: <FaEnvelope /> },
  { href: '/dashboard/documentation', label: 'Documentation', icon: <FaBook /> },
  { href: '/about', label: 'About', icon: <FaInfoCircle /> },
  { href: '/dashboard/settings', label: 'Settings', icon: <FaCog /> },
  { href: '#', label: 'Payments', icon: <FaFileInvoice />, isComingSoon: true },
  { href: '#', label: 'Membership', icon: <FaShieldAlt />, isComingSoon: true },
  { href: '#', label: 'Legal', icon: <FaBook />, isComingSoon: true },
];

const clickableYouthLinks = YOUTH_NAV_LINKS_UNSORTED.filter(link => !link.isComingSoon);
const nonClickableYouthLinks = YOUTH_NAV_LINKS_UNSORTED.filter(link => link.isComingSoon);
const YOUTH_NAV_LINKS = [...clickableYouthLinks, ...nonClickableYouthLinks];

const MANAGER_NAV_LINKS_UNSORTED: Array<{ href: string, label: string, icon: ReactNode, isComingSoon?: boolean }> = [
  { href: '/dashboard', label: 'Dashboard', icon: <FaTachometerAlt /> },
  { href: '/dashboard/manager/my-jobs', label: 'My Jobs', icon: <FaBriefcase /> },
  { href: '/dashboard/manager/post-job', label: 'Post a Job', icon: <FaPlus /> },
  { href: '/dashboard/manager/browse', label: 'Browse Talent', icon: <FaSearch /> },
  { href: '/dashboard/organization', label: 'My Organization', icon: <FaBuilding /> },
  { href: '/dashboard/api-key', label: 'Developers API', icon: <FaCode /> },
  { href: '/dashboard/documentation', label: 'Documentation', icon: <FaBook /> },
  { href: '/about', label: 'About', icon: <FaInfoCircle /> },
  { href: '/chat', label: 'Messages', icon: <FaEnvelope /> },
  { href: '/dashboard/settings', label: 'Settings', icon: <FaCog /> },
];

const clickableManagerLinks = MANAGER_NAV_LINKS_UNSORTED.filter(link => !link.isComingSoon);
const nonClickableManagerLinks = MANAGER_NAV_LINKS_UNSORTED.filter(link => link.isComingSoon);
const MANAGER_NAV_LINKS = [...clickableManagerLinks, ...nonClickableManagerLinks];

// --- BREADCRUMBS COMPONENT ---
function Breadcrumbs() {
  const pathname = usePathname();
  const router = useRouter();
  const { showLoader } = useLoading();

  const pathSegments = pathname.split('/').filter(Boolean);

  if (pathSegments.length <= 1 && (pathSegments[0] === 'dashboard' || !pathSegments[0])) {
    return null;
  }

  const toTitleCase = (str: string) => str.replace(/-/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    showLoader();
    router.push(href);
  };

  return (
    <nav aria-label="breadcrumb" className="mb-6 text-sm text-gray-400">
      <ol className="flex items-center space-x-2">
        <li>
          <a href="/dashboard" onClick={(e) => handleLinkClick(e, '/dashboard')} className="hover:text-white transition-colors">Dashboard</a>
        </li>
        {pathSegments.slice(1).map((segment, index) => {
          const href = `/${pathSegments.slice(0, index + 2).join('/')}`;
          const isLast = index === pathSegments.length - 2;
          return (
            <li key={href} className="flex items-center space-x-2">
              <FaAngleRight className="h-3 w-3 text-gray-500" />
              {isLast ? (
                <span className="text-white font-medium">{toTitleCase(segment)}</span>
              ) : (
                <a href={href} onClick={(e) => handleLinkClick(e, href)} className="hover:text-white transition-colors">{toTitleCase(segment)}</a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}


// --- COMMAND PALETTE COMPONENT ---
interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  navLinks: Array<{ href: string, label: string, icon: ReactNode }>;
}
function CommandPalette({ isOpen, onClose, navLinks }: CommandPaletteProps) {
  const router = useRouter();
  const { showLoader } = useLoading();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLUListElement>(null);

  const filteredLinks = navLinks.filter(link => link.label.toLowerCase().includes(searchTerm.toLowerCase()));

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [searchTerm]);

  const handleNavigation = (href: string) => {
    showLoader();
    router.push(href);
    onClose();
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % filteredLinks.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + filteredLinks.length) % filteredLinks.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredLinks[activeIndex]) {
        handleNavigation(filteredLinks[activeIndex].href);
      }
    }
  }, [activeIndex, filteredLinks]);

  useEffect(() => {
    const activeElement = resultsRef.current?.children[activeIndex] as HTMLLIElement | undefined;
    activeElement?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20" onKeyDown={handleKeyDown}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-lg transform-gpu rounded-xl bg-[#161b22] border border-gray-700 shadow-2xl transition-all">
        <div className="flex items-center border-b border-gray-700 p-3">
          <FaSearch className="h-5 w-5 text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for commands or pages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none"
          />
        </div>
        <ul ref={resultsRef} className="max-h-80 overflow-y-auto p-2">
          {filteredLinks.length > 0 ? (
            filteredLinks.map((link, index) => (
              <li
                key={link.href}
                onClick={() => handleNavigation(link.href)}
                className={`flex items-center gap-3 p-3 rounded-md cursor-pointer text-gray-300 ${
                  activeIndex === index ? 'bg-blue-600/50 text-white' : 'hover:bg-gray-800 hover:text-white'
                }`}
              >
                {React.cloneElement(link.icon as React.ReactElement<any>, { className: "h-5 w-5 flex-shrink-0" })}
                <span>{link.label}</span>
              </li>
            ))
          ) : (
            <li className="p-4 text-center text-gray-500">No results found.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

// --- SIDEBAR LINK COMPONENT ---
interface SidebarLinkProps {
  href: string;
  label: string;
  icon: ReactNode;
  isComingSoon?: boolean;
  notificationCount?: number;
}
function SidebarLink({ href, label, icon, isComingSoon = false, notificationCount = 0 }: SidebarLinkProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { showLoader } = useLoading();
  const isActive = (href === '/chat' && pathname.startsWith('/chat')) || (href === '/dashboard/community' && pathname.startsWith('/dashboard/community')) || pathname === href;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (isComingSoon) return;
    if (!isActive) {
      showLoader();
      router.push(href);
    }
  };

  const baseClasses = "flex items-center gap-4 rounded-lg px-3 py-2.5 text-sm font-medium transition-all group-hover:justify-start justify-center";
  const stateClasses = isComingSoon
    ? "text-gray-500 cursor-not-allowed"
    : isActive
    ? "bg-blue-600 text-white shadow-sm"
    : "text-gray-400 hover:text-white hover:bg-gray-800";

  const linkClasses = `${baseClasses} ${stateClasses}`;
  const tooltipContent = isComingSoon ? `${label} (Coming Soon!)` : label;

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="block">
            <Link href={href} onClick={handleClick} className={linkClasses}>
              <div className="relative">
                {React.cloneElement(icon as React.ReactElement<any>, { className: "h-5 w-5 flex-shrink-0" })}
                {notificationCount > 0 && (
                  <span className="absolute top-[-2px] right-[-2px] block h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-black" />
                )}
              </div>
              <span className="hidden group-hover:inline whitespace-nowrap">{label}</span>
            </Link>
          </span>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-black border-gray-700 text-white group-hover:hidden">
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// --- SIDEBAR LOGOUT BUTTON ---
function SidebarLogoutButton({ onLogout }: { onLogout: () => Promise<void> }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await onLogout();
    } catch {
      setIsLoggingOut(false);
    }
  };

  const linkClasses = `flex items-center gap-4 rounded-lg px-3 py-2.5 text-sm font-medium transition-all w-full text-gray-400 hover:text-white hover:bg-red-900/50 ${isLoggingOut ? 'opacity-70 cursor-not-allowed' : ''} group-hover:justify-start justify-center`;
  const tooltipContent = isLoggingOut ? 'Signing Out...' : 'Logout';

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={handleClick} className={linkClasses} disabled={isLoggingOut}>
            <FaSignOutAlt className="h-5 w-5 flex-shrink-0" />
            <span className="hidden group-hover:inline whitespace-nowrap">{tooltipContent}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-black border-gray-700 text-white group-hover:hidden">
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// --- SIDEBAR COMPONENT ---
function Sidebar({ onLogout }: { onLogout: () => Promise<void> }) {
  const { user, userProfile, loading } = useAuth();
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const prevUnreadCountRef = useRef(0);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let unreadSum = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        const countForUser = data.unreadCount?.[user.uid] || 0;
        unreadSum += countForUser;
      });
      if (unreadSum > prevUnreadCountRef.current) {
        playNotificationSound();
      }
      setTotalUnreadCount(unreadSum);
      prevUnreadCountRef.current = unreadSum;
    }, (error) => {
      console.error("Error listening to chat unread counts:", error);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  if (loading || !userProfile) {
    return (
      <aside className="hidden w-16 flex-col border-r border-gray-800 bg-black p-3 md:flex h-screen sticky top-0">
        <div className="flex h-14 items-center justify-center mb-4 flex-shrink-0"><div className="h-7 w-7 bg-gray-800 rounded-full animate-pulse"></div></div>
        <div className="flex flex-col gap-3 flex-1 items-center">
          <div className="h-9 w-9 bg-gray-800 rounded-lg animate-pulse"></div>
          <div className="h-9 w-9 bg-gray-800 rounded-lg animate-pulse"></div>
          <div className="h-9 w-9 bg-gray-800 rounded-lg animate-pulse"></div>
        </div>
      </aside>
    );
  }

  const userRole = userProfile.userType;
  const navLinks = userRole === 'youth' ? YOUTH_NAV_LINKS : MANAGER_NAV_LINKS;

  return (
    <aside className="group hidden md:flex h-screen sticky top-0 w-16 hover:w-64 flex-col border-r border-gray-800 bg-black p-3 transition-all duration-300 ease-in-out z-50">
      <div className="flex h-14 items-center gap-2 mb-4 px-1 flex-shrink-0">
        <svg className="h-7 w-7 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M2 7L12 12" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M12 22V12" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M22 7L12 12" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M17 4.5L7 9.5" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
        </svg>
        <span className="font-bold text-lg whitespace-nowrap hidden group-hover:inline">SkillsLink</span>
      </div>
      <nav className="flex-1 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-2">
          {navLinks.map((link) => (
            <li key={link.href + link.label}>
              <SidebarLink {...link} notificationCount={link.label === 'Messages' ? totalUnreadCount : 0}/>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto pt-2 border-t border-gray-800">
        <SidebarLogoutButton onLogout={onLogout} />
      </div>
    </aside>
  );
}

// --- HEADER COMPONENTS ---
function HeaderIconTooltip({ tooltip, icon }: { tooltip: string; icon: ReactNode }) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" className="h-9 w-9 p-0 text-gray-400 hover:text-white hover:bg-gray-800">{icon}</Button>
        </TooltipTrigger>
        <TooltipContent className="bg-black border-gray-700 text-white"><p>{tooltip}</p></TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function HeaderNavAction({ label, icon, href, isComingSoon = false }: { label: string; icon: ReactNode; href?: string; isComingSoon?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { showLoader } = useLoading();
  const isActive = pathname === href;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!href || isComingSoon) { e.preventDefault(); return; }
    e.preventDefault();
    if (!isActive) { showLoader(); router.push(href); }
  };

  const linkClasses = `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'text-white bg-gray-800' : 'text-gray-400'} ${isComingSoon || !href ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-800 hover:text-white'}`;
  const tooltipContent = isComingSoon ? `${label} (Coming Soon!)` : label;
  const desktopTooltipText = isComingSoon ? "Coming Soon!" : tooltipContent;

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div onClick={handleClick} className={linkClasses}>
            {React.cloneElement(icon as React.ReactElement<any>, { className: 'h-5 w-5' })}
            <span className="hidden lg:inline">{label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-black border-gray-700 text-white">
          <p className="lg:hidden">{tooltipContent}</p>
          <p className="hidden lg:block">{desktopTooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function Header({ onLogout }: { onLogout: () => Promise<void> }) {
  const { user, userProfile, loading } = useAuth();
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  if (loading || !user || !userProfile) {
    return (
      <header className="flex h-16 items-center justify-between border-b border-gray-800 bg-black px-6 z-40 sticky top-0">
        <div className="flex items-center gap-3"><div className="h-8 w-8 bg-gray-800 rounded animate-pulse"></div><div className="h-6 w-32 bg-gray-800 rounded animate-pulse"></div></div>
        <div className="h-10 w-10 rounded-full bg-gray-800 animate-pulse"></div>
      </header>
    );
  }

  const isManager = userProfile.userType === 'manager';
  const welcomeName = isManager
    ? userProfile.organizationName || 'Organization'
    : userProfile.fullName || user.displayName || 'User';
  const dropdownName = isManager
    ? userProfile.contactPersonFullName || 'Manager'
    : userProfile.fullName || user.displayName || 'User';
  const userAvatarUrl = isManager
    ? userProfile.organizationLogoUrl || ''
    : userProfile.profilePictureUrl || user.photoURL || '';
  const fallbackInitials = (isManager ? (userProfile.organizationName || 'O') : (userProfile.fullName || 'U'))
    .split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const renderHeaderNavLinks = () => {
    if (userProfile.userType === 'youth') {
      return (
        <div className="hidden md:flex items-center gap-1">
          <HeaderNavAction label="Marketplace" icon={<FaStore />} href="/dashboard/marketplace" />
          <HeaderNavAction label="CV Builder" icon={<FaFileAlt />} href="/dashboard/cv-builder" />
          <HeaderNavAction label="Resume Builder" icon={<FaFileInvoice />} href="/dashboard/resume-builder" />
        </div>
      );
    }
    return null;
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-800 bg-black px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-3 md:hidden" aria-label="Home">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M2 7L12 12" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M12 22V12" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M22 7L12 12" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M17 4.5L7 9.5" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
          </svg>
        </Link>
        {renderHeaderNavLinks()}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center text-gray-500 text-xs border border-gray-700 rounded-md px-2 py-1.5 font-mono select-none">
          <span>{isMac ? '⌘ K' : 'Ctrl+K'}</span>
        </div>
        <div className="hidden md:flex items-center gap-2 px-2 border-l border-gray-700 ml-1">
          <HeaderIconTooltip tooltip="Status - Coming Soon!" icon={<FaShieldAlt className="h-5 w-5" />} />
          <HeaderIconTooltip tooltip="Feedback - Coming Soon!" icon={<FaComments className="h-5 w-5" />} />
          <HeaderIconTooltip tooltip="Expand - Coming Soon!" icon={<FaExpandArrowsAlt className="h-5 w-5" />} />
          <HeaderIconTooltip tooltip="Apps - Coming Soon!" icon={<FaTh className="h-5 w-5" />} />
          <HeaderIconTooltip tooltip="Notifications - Coming Soon!" icon={<FaBell className="h-5 w-5" />} />
        </div>
        <span className="hidden sm:inline text-sm font-medium text-gray-300">Welcome, {welcomeName}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={userAvatarUrl} alt={welcomeName} />
                <AvatarFallback className="text-sm bg-gray-700">{fallbackInitials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-black border-gray-700 text-gray-200">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-white">{dropdownName}</p>
                <p className="text-xs leading-none text-gray-400">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuItem asChild>
              <Link href={userProfile.userType === 'youth' ? '/dashboard/profile' : `/organization/${user.uid}`} className="cursor-pointer">
                <FaUser className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="cursor-pointer">
                <FaCog className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuItem onClick={() => onLogout().catch(() => {})} className="cursor-pointer text-red-400 focus:bg-red-900/50 focus:text-red-300">
              <FaSignOutAlt className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

// --- LOADING BAR & LOADER ---
function TopProgressBar() {
  const { isLoading } = useLoading();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setVisible(true);
      setProgress(90);
    } else {
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setTimeout(() => setProgress(0), 200);
      }, 500);
    }
  }, [isLoading]);

  return (
    <div 
      className="fixed top-0 left-0 h-[3px] bg-blue-500 z-[9999] shadow-lg shadow-blue-500/50"
      style={{
        width: `${progress}%`,
        opacity: visible ? 1 : 0,
        transition: `width ${isLoading ? '10s' : '0.5s'} cubic-bezier(0.1, 0.9, 0.2, 1), opacity 0.5s ease-out`,
      }}
    />
  );
}

const LogoutLoader = () => (
  <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex flex-col items-center justify-center z-[10000]">
    <FaSpinner className="h-12 w-12 text-white animate-spin" />
    <p className="mt-4 text-xl text-white font-semibold tracking-wider">Signing Out...</p>
  </div>
);

// --- MAIN LAYOUT COMPONENT ---
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, userProfile, loading } = useAuth();
  const { hideLoader } = useLoading();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await auth.signOut();
      const response = await fetch('/api/auth/session', { method: 'DELETE' });
      if (!response.ok) {
        toast.error('Could not fully clear server session.');
      }
      router.push('/signin');
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error('Logout failed. Please try again.');
      setIsLoggingOut(false);
      throw error;
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      if (event.key === 'Escape') {
        setIsCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    hideLoader();
  }, [pathname]);

  const isAuthPage = pathname.startsWith('/signin') || pathname.startsWith('/signup');
  const isOnboardingPage = pathname.startsWith('/onboarding');

  if (isAuthPage || isOnboardingPage) {
    return <>{children}</>;
  }

  if (loading || !user) {
    return <Loader />;
  }
  
  const navLinks = userProfile?.userType === 'youth' ? YOUTH_NAV_LINKS : MANAGER_NAV_LINKS;

  return (
    <>
      {isLoggingOut && <LogoutLoader />}
      <TopProgressBar />
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)}
        navLinks={navLinks.filter(link => !link.isComingSoon)}
      />

      <div className={`flex min-h-screen bg-[#111] text-white ${isLoggingOut ? 'pointer-events-none' : ''}`}>
        <Sidebar onLogout={handleLogout} />
        <div className="flex flex-1 flex-col min-w-0">
          <Header onLogout={handleLogout} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0d1117]">
            <Breadcrumbs />
            {children}
          </main>
        </div>
      </div>

      {/* ---- CHAT WIDGET (single instance) ---- */}
      {typeof ChatWidget === 'function' && <ChatWidget />}
    </>
  );
}