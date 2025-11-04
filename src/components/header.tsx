// components/header.tsx
'use client'; // <-- ADD THIS: Required for hooks

import Image from 'next/image';
import Link from 'next/link';
import { FaBell, FaUserCircle } from 'react-icons/fa';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext'; // <-- IMPORT useAuth
import { auth } from '@/lib/firebase'; // <-- IMPORT auth for signout

// REMOVED: We no longer need HeaderProps because the component gets its own data.

export default function Header() {
  // --- 1. GET REAL USER DATA FROM THE AUTH CONTEXT ---
  const { user, userProfile, loading } = useAuth();

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      await fetch('/api/auth/session', { method: 'DELETE' });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // --- 2. HANDLE LOADING AND LOGGED-OUT STATES ---
  if (loading) {
    // Show a simple placeholder while user data is loading
    return (
      <header className="flex h-16 items-center justify-end border-b bg-white px-6 dark:bg-gray-950">
        <div className="h-9 w-24 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </header>
    );
  }

  if (!user || !userProfile) {
    // If the user is not logged in, you might not want to show anything,
    // as the page should redirect them anyway.
    return null; 
  }

  // --- 3. RENDER THE HEADER WITH REAL DATA ---
  const userName = user.displayName || userProfile.name || 'User'; // Prioritize available names
  const userAvatar = user.photoURL || userProfile.avatarUrl || ''; // Prioritize available avatars

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-gray-200 bg-white px-6 dark:border-gray-800 dark:bg-gray-950 shadow-sm">
      <div className="flex-1">
        {/* Search bar or other elements can go here */}
      </div>
      <div className="flex items-center gap-4">
        {/* Notifications Bell Icon */}
        <Link href="/dashboard/notifications" className="relative text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50">
          <FaBell className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">3</span>
        </Link>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              {userAvatar ? (
                <Image
                  src={userAvatar}
                  alt={userName}
                  width={36}
                  height={36}
                  className="rounded-full border-2 border-gray-300 dark:border-gray-700"
                />
              ) : (
                <FaUserCircle className="h-9 w-9 text-gray-500" />
              )}
              <span className="hidden lg:inline">{userName}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName}</p>
                <p className="text-xs leading-none text-gray-500 dark:text-gray-400">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="cursor-pointer">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700">
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}