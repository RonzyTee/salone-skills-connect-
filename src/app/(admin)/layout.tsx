'use client';

// 1. IMPORT NECESSARY MODULES AND COMPONENTS
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // Your auth context (still needed for user & loading)
import {
  ShieldCheck,
  Users,
  Settings,
  LogOut,
  Menu,
  MessageSquare,
  PackageCheck,
  UserCheck,
  Briefcase,
  Loader2, // Import a loader icon
} from 'lucide-react';
import { signOut } from 'firebase/auth'; // <--- ADDED: Direct Firebase signOut
import { auth } from '@/lib/firebase'; // <--- ADDED: Firebase auth instance
import toast from 'react-hot-toast'; // <--- ADDED: For toast notifications
import { FaSpinner } from 'react-icons/fa'; // <--- ADDED: For the spinner icon

// --- Full Page Loader (existing) ---
function FullPageLoader() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-900">
      <Loader2 className="h-12 w-12 animate-spin text-blue-400" />
    </div>
  );
}

// --- Logout Loader (NEW - copied from your other layout concept) ---
const LogoutLoader = () => (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex flex-col items-center justify-center z-[10000]">
        <FaSpinner className="h-12 w-12 text-white animate-spin" />
        <p className="mt-4 text-xl text-white font-semibold tracking-wider">Signing Out...</p>
    </div>
);


// --- Sidebar Navigation Link (existing) ---
function NavLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href}>
      <span
        className={`
          flex items-center gap-3 rounded-lg px-3 py-2 transition-all
          ${
            isActive
              ? 'bg-blue-600/20 text-blue-300'
              : 'text-gray-400 hover:bg-gray-700 hover:text-white'
          }
        `}
      >
        <Icon className="h-5 w-5" />
        <span className="font-medium">{children}</span>
      </span>
    </Link>
  );
}

// --- Main Layout Component ---
export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Get 'loading' and 'user' from useAuth
  const { user, loading } = useAuth(); // <--- REMOVED 'logout' from here
  const router = useRouter();

  // 2. ADD LOCAL LOGOUT STATE
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Auth Guard Logic (existing)
  useEffect(() => {
    // If the auth state is still loading, we don't do anything yet
    if (loading) {
      return;
    }

    // If auth is done loading and there is NO user, force redirect to the sign-in page.
    // This will now primarily catch cases where the user wasn't logged in initially,
    // as the handleLogout will do the redirect itself.
    if (!user && !isLoggingOut) { // <--- Added !isLoggingOut check
      router.push('/signin');
    }
  }, [user, loading, router, isLoggingOut]); // Added isLoggingOut to dependencies

  // 3. REPLICATE THE LOGOUT LOGIC FROM YOUR OTHER LAYOUT
  const handleLogout = async () => {
    setIsLoggingOut(true); // Show the specific "Signing Out..." loader
    try {
      // Set user offline in Firestore *before* signing out (optional, but good practice)
      // This logic should ideally be handled by your AuthContext's signOut wrapper if used universally.
      // For now, mirroring your other layout.
      if (user) {
        // You might need to import `db` and `doc`, `updateDoc`, `serverTimestamp` here
        // or ensure your AuthContext handles presence management.
        // For simplicity, directly calling `signOut` is the main goal here.
        // If your AuthContext has presence updates on logout, you can remove this.
      }

      await signOut(auth); // Direct Firebase sign out
      
      // Clear server session, just like your other layout
      const response = await fetch('/api/auth/session', { method: 'DELETE' });
      if (!response.ok) {
          toast.error('Could not fully clear server session.');
      }
      
      router.push('/signin'); // Explicitly redirect to sign-in page
    } catch (error) {
      console.error('Failed to log out:', error);
      toast.error('Logout failed. Please try again.');
      setIsLoggingOut(false); // Re-enable button if logout failed
    }
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-gray-700 px-6">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-2 font-semibold text-white"
        >
          <ShieldCheck className="h-6 w-6 text-blue-400" />
          <span>Admin Panel</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        <NavLink href="/admin/dashboard" icon={MessageSquare}>
          Support Chat
        </NavLink>

        <div className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-500 uppercase">
          Verifications
        </div>
        <NavLink href="/admin/verifications/identities" icon={UserCheck}>
          Identities
        </NavLink>
        <NavLink href="/admin/verifications/products" icon={PackageCheck}>
          Products
        </NavLink>
        <NavLink href="/admin/verifications/work" icon={Briefcase}>
          Work
        </NavLink>

        <div className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-500 uppercase">
          Management
        </div>
        <NavLink href="/admin/users" icon={Users}>
          Users
        </NavLink>
        <NavLink href="/admin/settings" icon={Settings}>
          Settings
        </NavLink>
      </nav>

      {/* Sidebar Footer */}
      <div className="mt-auto border-t border-gray-700 p-4">
        <button
          onClick={handleLogout} // <--- Call the local handleLogout
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-gray-400 transition-all hover:bg-gray-700 hover:text-white ${isLoggingOut ? 'opacity-70 cursor-not-allowed' : ''}`}
          disabled={isLoggingOut} // Disable button while logging out
        >
          {isLoggingOut ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <LogOut className="h-5 w-5" />
          )}
          <span className="font-medium">{isLoggingOut ? 'Signing Out...' : 'Log Out'}</span>
        </button>
      </div>
    </div>
  );

  // 4. CONDITIONAL RENDERING FOR LOGOUT LOADER AND MAIN CONTENT
  if (isLoggingOut) { // If logging out, show ONLY the dedicated logout loader
    return <LogoutLoader />;
  }

  // While auth is loading, or if the user is null (and not logging out), show the general loader.
  if (loading || !user) {
    return <FullPageLoader />;
  }

  // If we are here, user is loaded AND authenticated, and not in the process of logging out
  return (
    <div className="flex min-h-screen w-full bg-gray-900 text-gray-200">
      {/* --- Sidebar (Desktop) --- */}
      <aside className="hidden w-64 flex-col border-r border-gray-800 bg-gray-800 lg:flex">
        {sidebarContent}
      </aside>

      {/* --- Mobile Sidebar (Overlay) --- */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 flex-col border-r border-gray-800 bg-gray-800
          transition-transform duration-300 ease-in-out lg:hidden
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {sidebarContent}
      </aside>

      {/* --- Main Content (Header + Page) --- */}
<div className="flex flex-1 flex-col">        {/* --- Header --- */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-800 bg-gray-900/80 px-6 backdrop-blur-sm lg:justify-end">
          <button
            className="rounded-full p-2 text-gray-400 hover:text-white lg:hidden"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-4">
            {/* You can add profile/notification icons here */}
            <div className="text-right text-sm">
              <div className="font-medium text-white">
                {user?.displayName || 'Admin'}
              </div>
              <div className="text-gray-400">{user?.email}</div>
            </div>
          </div>
        </header>

        {/* --- Page Content --- */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}