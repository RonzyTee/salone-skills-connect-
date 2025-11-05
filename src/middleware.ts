import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 1. Specify which routes are protected and which are public-only
const protectedRoutes = [
  '/dashboard', 
  '/onboarding', 
  '/settings', 
  '/portfolio', 
  '/profile', 
  '/choose-role',
  '/admin' // <-- *** ADD THIS LINE ***
];
const publicAuthRoutes = ['/signin', '/signup'];

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const sessionCookie = req.cookies.get('__session')?.value;

  // Check if the current route is one of the protected routes
  const isProtectedRoute = protectedRoutes.some((prefix) => path.startsWith(prefix));
  
  // Check if the current route is one of the public-only routes
  const isPublicAuthRoute = publicAuthRoutes.some((prefix) => path.startsWith(prefix));

  // RULE 1: If trying to access a protected route without a session, redirect to sign-in.
  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL('/signin', req.nextUrl));
  }

  // RULE 2: If logged in and trying to access signin/signup, redirect to dashboard.
  if (isPublicAuthRoute && sessionCookie) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }
  
  // If no rules match, allow the request to proceed.
  return NextResponse.next();
}

// This config specifies which paths the middleware should run on.
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

