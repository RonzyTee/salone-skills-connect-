'use client';

import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from 'next/link';
import { auth } from '@/lib/firebase'; // For the sign-out function

export function UserNav() {
  // Get user data and loading state from the hook
  const { user, userProfile, loading } = useAuth();

  const handleSignOut = async () => {
    try {
      // Sign out from Firebase client-side
      await auth.signOut();
      // Tell the server to clear the session cookie
      await fetch('/api/auth/session', { method: 'DELETE' });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Show a skeleton loader while fetching user data
  if (loading) {
    return <div className="w-10 h-10 bg-gray-700 rounded-full animate-pulse" />;
  }

  // If not loading and no user is found, show a Sign In button
  if (!user) {
    return (
      <Button asChild>
        <Link href="/signin">Sign In</Link>
      </Button>
    );
  }

  // If a user is logged in, display their avatar and dropdown menu
  // Create fallback initials from the user's email if no other name is available
  const fallbackInitials = user.email ? user.email.substring(0, 2).toUpperCase() : 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            {/* The user.photoURL comes from Google/GitHub sign-in */}
            <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User avatar'} />
            <AvatarFallback>{fallbackInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {/* You can get a name from userProfile if you save it there */}
              {user.displayName || 'Salone Youth'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/dashboard">
            <DropdownMenuItem>Dashboard</DropdownMenuItem>
          </Link>
          <Link href="/dashboard/settings">
            <DropdownMenuItem>Settings</DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}