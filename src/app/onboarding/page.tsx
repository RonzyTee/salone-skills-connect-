// src/app/onboarding/page.tsx

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import * as admin from 'firebase-admin';
import { TalentOnboardingForm } from '@/components/onboarding/TalentOnboardingForm'; 
import { ManagerOnboardingForm } from '@/components/onboarding/ManagerOnboardingForm';

export const dynamic = 'force-dynamic';

// Helper to initialize Firebase Admin SDK (idempotent)
function initializeAdmin() {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return admin;
}

// Function to get user role from Firestore
async function getUserRole(uid: string): Promise<string | null> {
  try {
    const adminApp = initializeAdmin();
    const userDoc = await adminApp.firestore().collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      console.error(`Onboarding Page: No user document found for UID: ${uid}`);
      return null;
    }
    return userDoc.data()?.userType || null;
  } catch (error) {
    console.error("Onboarding Page: Failed to fetch user role:", error);
    return null;
  }
}

// The main Onboarding Page Server Component
export default async function OnboardingPage() { 
  const cookieStore = await cookies(); 
  const sessionCookie = cookieStore.get('__session')?.value;

  if (!sessionCookie) {
    redirect('/signin');
  }

  let decodedToken;
  try {
    const adminApp = initializeAdmin();
    decodedToken = await adminApp.auth().verifySessionCookie(sessionCookie, true);
  } catch (error) {
    console.log('Onboarding Page: Session cookie verification failed. Redirecting to signin.', error);
    redirect('/signin');
  }
  
  const uid = decodedToken.uid;
  const userRole = await getUserRole(uid);

  if (!userRole) {
    redirect('/choose-role');
  }

  // Conditionally render the correct client component based on the user's role.
  return (
    <div className="flex w-full min-h-screen items-center justify-center p-4 sm:p-8 bg-[#1E1E1E]">
      {userRole === 'youth' && <TalentOnboardingForm />}
      {userRole === 'manager' && <ManagerOnboardingForm />}
    </div>
  );
}
