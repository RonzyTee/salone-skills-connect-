'use client';

import React, { useEffect, useState, useRef, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FaCog, FaSignOutAlt, FaUser, FaBriefcase, FaEnvelope, FaTachometerAlt,
  FaUsers, FaBuilding, FaSearch, FaFileAlt, FaStore, FaLightbulb,
  FaFileInvoice, FaShieldAlt, FaHistory, FaQuestionCircle, FaComments,
  FaExpandArrowsAlt, FaTh, FaBell, FaFolderOpen, FaUserCircle, FaHandsHelping,
  FaCalendarAlt, FaCode, FaBook, FaInfoCircle, FaSpinner, FaPlus // <-- ADD THIS ICON
  
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
  contactPersonFullName?: string; // The manager's personal name
}

const playNotificationSound = () => {
  if (typeof window !== 'undefined' && window.AudioContext) {
    try {
      const audioContext = new window.AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
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
  // This first link is correct: it points to your main dashboard page
  { href: '/dashboard', label: 'Dashboard', icon: <FaTachometerAlt /> },
  
  // These are the new, nested links
  { href: '/dashboard/manager/my-jobs', label: 'My Jobs', icon: <FaBriefcase /> },
  { href: '/dashboard/manager/post-job', label: 'Post a Job', icon: <FaPlus /> },
  { href: '/dashboard/manager/browse', label: 'Browse Talent', icon: <FaSearch /> },
  
  // These links are fine as-is
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

// --- SIDEBAR LINK COMPONENT (WITH TOOLTIP FIX) ---
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
    ? "text-gray-500 cursor-not-allowed" // Distinct, non-interactive style for "Coming Soon"
    : isActive
    ? "bg-blue-600 text-white shadow-sm" // Active link style
    : "text-gray-400 hover:text-white hover:bg-gray-800"; // Default inactive link style

  const linkClasses = `${baseClasses} ${stateClasses}`;
  const tooltipContent = isComingSoon ? `${label} (Coming Soon!)` : label;


  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          {/*
            THIS IS THE FIX:
            Wrap the <Link> in a <span>. The <span> is now the
            direct child for `asChild`, which solves the error.
            `className="block"` ensures it behaves like the <li>.
          */}
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
            // Error is handled by the onLogout function, which shows a toast.
            // We just need to re-enable the button.
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
        <svg className="h-7 w-7 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/><path d="M2 7L12 12" stroke="white" strokeWidth="2" strokeLinejoin="round"/><path d="M12 22V12" stroke="white" strokeWidth="2" strokeLinejoin="round"/><path d="M22 7L12 12" stroke="white" strokeWidth="2" strokeLinejoin="round"/><path d="M17 4.5L7 9.5" stroke="white" strokeWidth="2" strokeLinejoin="round"/></svg>
        <span className="font-bold text-lg whitespace-nowrap hidden group-hover:inline">SkillsLink</span>
      </div>
      <nav className="flex-1 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-2">
          {navLinks.map((link) => (
            <li key={link.href + link.label}><SidebarLink {...link} notificationCount={link.label === 'Messages' ? totalUnreadCount : 0}/></li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto pt-2 border-t border-gray-800"><SidebarLogoutButton onLogout={onLogout} /></div>
    </aside>
  );
}

// --- HEADER HELPER COMPONENTS ---
function HeaderIconTooltip({ tooltip, icon }: { tooltip: string; icon: ReactNode }) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild><Button variant="ghost" className="h-9 w-9 p-0 text-gray-400 hover:text-white hover:bg-gray-800">{icon}</Button></TooltipTrigger>
        <TooltipContent className="bg-black border-gray-700 text-white"><p>{tooltip}</p></TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// --- THIS IS THE CORRECTED COMPONENT ---
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
    
    // Conditionally set the tooltip content
    const tooltipContent = isComingSoon ? `${label} (Coming Soon!)` : label;
    
    // Determine content for the single tooltip
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
                {/*
                  FIX IS HERE:
                  We now have only ONE TooltipContent.
                  - On mobile (lg:hidden), it shows the full label.
                  - On desktop (hidden lg:block), it shows "Coming Soon!" if needed, or the full label.
                */}
                <TooltipContent className="bg-black border-gray-700 text-white">
                    <p className="lg:hidden">{tooltipContent}</p>
                    <p className="hidden lg:block">{desktopTooltipText}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

// --- UPDATED HEADER COMPONENT ---
function Header({ onLogout }: { onLogout: () => Promise<void> }) {
    const { user, userProfile, loading } = useAuth();
    
    if (loading || !user || !userProfile) {
        return (
          <header className="flex h-16 items-center justify-between border-b border-gray-800 bg-black px-6 z-40 sticky top-0">
            <div className="flex items-center gap-3"><div className="h-8 w-8 bg-gray-800 rounded animate-pulse"></div><div className="h-6 w-32 bg-gray-800 rounded animate-pulse"></div></div>
            <div className="h-10 w-10 rounded-full bg-gray-800 animate-pulse"></div>
          </header>
        );
    }

    // --- NEW LOGIC START ---

    const isManager = userProfile.userType === 'manager';

    // "Welcome, [Organization Name]" for managers
    // "Welcome, [Full Name]" for youth
    const welcomeName = isManager
      ? userProfile.organizationName || 'Organization'
      : userProfile.fullName || user.displayName || 'User';

    // Dropdown menu shows personal name for both
    const dropdownName = isManager
      ? userProfile.contactPersonFullName || 'Manager'
      : userProfile.fullName || user.displayName || 'User';

    // Avatar is Org Logo for managers
    const userAvatarUrl = isManager
      ? userProfile.organizationLogoUrl || ''
      : userProfile.profilePictureUrl || user.photoURL || '';

    // Fallback initials are from Org Name for managers
    const fallbackInitials = (isManager ? (userProfile.organizationName || 'O') : (userProfile.fullName || 'U'))
      .split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    // --- NEW LOGIC END ---
    
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
                <div className="hidden md:flex items-center gap-2 px-2 border-r border-gray-700">
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
                transition: `width ${isLoading ? '10s' : '0.s'} cubic-bezier(0.1, 0.9, 0.2, 1), opacity 0.5s ease-out`,
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
    const { user, loading } = useAuth();
    const { hideLoader } = useLoading();
    const router = useRouter();
    const pathname = usePathname();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

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
            throw error; // Propagate error to re-enable UI buttons
        }
    };

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

    return (
        <>
            {isLoggingOut && <LogoutLoader />}
            <TopProgressBar />
            <div className={`flex min-h-screen bg-[#111] text-white ${isLoggingOut ? 'pointer-events-none' : ''}`}>
                <Sidebar onLogout={handleLogout} />
                {/* THIS IS THE FIX
                  This div is the flex-1 sibling to the sidebar.
                  It was stretching. min-w-0 stops it from stretching.
                */}
                <div className="flex flex-1 flex-col min-w-0">
                    <Header onLogout={handleLogout} />
                    <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#181818]">
                        {children}
                    </main>
                </div>
            </div>
        </>
    );
}