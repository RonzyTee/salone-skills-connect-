'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    GithubAuthProvider,
    AuthError,
    User,
    getAdditionalUserInfo
} from 'firebase/auth';

import { auth } from '@/lib/firebase'; // Ensure this path is correct

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Globe, ChevronDown, Lock, Eye, EyeOff, Mail, ArrowLeft, Loader2 } from 'lucide-react';

// --- FORM VALIDATION SCHEMA ---
const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters." })
    .regex(/[a-z]/, { message: "Must contain at least one lowercase letter." })
    .regex(/[A-Z]/, { message: "Must contain at least one uppercase letter." })
    .regex(/[0-9]/, { message: "Must contain at least one number." })
    .regex(/[^a-zA-Z0-9]/, { message: "Must contain at least one special character." }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
});

type SignUpFormValues = z.infer<typeof formSchema>;


// --- SVG ICON COMPONENTS ---
const SaloneSkillsLinkLogo = ({ className }: { className?: string }) => (
  <svg className={className || "h-16 w-16 mb-4 text-white"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"/>
  </svg>
);

const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M22.56 12.25c0-.78-.07-1.5-.18-2.2H12v4.26h6.15c-.25 1.29-.98 2.5-2.09 3.39v2.85h3.69c2.16-1.98 3.4-4.88 3.4-8.3z" fill="#4285F4"/> <path d="M12 23c3.27 0 6.03-1.08 8.04-2.92l-3.69-2.85c-.99.71-2.27 1.13-3.65 1.13-2.82 0-5.2-1.9-6.07-4.47H2.36v2.96c1.9 3.73 5.76 6.3 9.64 6.3z" fill="#34A853"/> <path d="M5.93 14.28c-.29-.71-.46-1.46-.46-2.28s.17-1.57.46-2.28V6.76H2.36C1.43 8.65.87 10.26.87 12c0 1.74.56 3.35 1.49 5.24L5.93 14.28z" fill="#FBBC04"/> <path d="M12 5.09c1.77 0 3.3.61 4.54 1.76L19.46 3c-2.01-1.84-4.77-2.92-8.04-2.92-3.88 0-7.74 2.57-9.64 6.3l3.57 2.76c.87-2.57 3.25-4.47 6.07-4.47z" fill="#EA4335"/> </svg>
);

const GitHubIcon = () => (
    <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"> <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.6.111.819-.258.819-.576 0-.288-.011-1.05-.017-2.062-3.337.724-4.042-1.61-4.042-1.61-.545-1.385-1.328-1.756-1.328-1.756-1.088-.745.084-.73.084-.73 1.205.086 1.838 1.238 1.838 1.238 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.304.762-1.604-2.665-.304-5.466-1.33-5.466-5.932 0-1.31.469-2.38.123-3.22-.123-.304-.535-1.524.117-3.176 0 0 1.032-.321 3.385 1.23.974-.27 2.007-.405 3.04-.409 1.033.004 2.066.139 3.04.409 2.353-1.551 3.385-1.23 3.385-1.23.652 1.652.241 2.872.118 3.176.353.84.123 1.91.123 3.22 0 4.61-2.807 5.624-5.476 5.922.43.37.817 1.107.817 2.235 0 1.607-.015 2.9-.015 3.286 0 .315.216.691.825.575C20.565 21.792 24 17.302 24 12c0-6.627-5.373-12-12-12z"/> </svg>
);

const ShieldIcon = () => (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path> </svg>
);


// --- MAIN SIGNUP COMPONENT ---
export default function SignUpPage() {
  const router = useRouter();
  const [formStep, setFormStep] = useState<'email' | 'password'>('email');
  const isMounted = useRef(true);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
    mode: "onChange",
  });

  const { register, handleSubmit, watch, trigger, getValues, formState: { errors, isSubmitting } } = form;

  const [isLoading, setIsLoading] = useState(false);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // NEW STATE FOR SOCIAL BUTTON LOADING
  const [isSocialLoading, setIsSocialLoading] = useState<'google' | 'github' | null>(null);

  const password = watch('password', '');
  const emailValue = getValues('email');

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleProceedToPassword = async () => {
    const isEmailValid = await trigger("email");
    if (isEmailValid) {
      setFormStep('password');
    }
  };

  const getFirebaseErrorMessage = (error: AuthError): string => {
    switch (error.code) {
      case 'auth/email-already-in-use': return 'This email address is already registered.';
      case 'auth/invalid-email': return 'The email address is not valid.';
      case 'auth/weak-password': return 'Password is too weak. Please choose a stronger password.';
      case 'auth/popup-closed-by-user': return 'Sign-up cancelled. Please try again.';
      case 'auth/cancelled-popup-request': return 'Another sign-in attempt is in progress. Please wait or refresh.';
      // Handle "auth/credential-already-in-use" if you want to link providers
      // For now, it will default to unexpected error.
      default: return 'An unexpected error occurred. Please try again.';
    }
  };

  const getPasswordStrength = (password: string): { strength: string, color: string } => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    switch (strength) {
      case 1: return { strength: "Very Weak", color: "text-red-500" };
      case 2: return { strength: "Weak", color: "text-orange-500" };
      case 3: return { strength: "Moderate", color: "text-yellow-500" };
      case 4: return { strength: "Strong", color: "text-green-500" };
      case 5: return { strength: "Very Strong", color: "text-green-400" };
      default: return { strength: "", color: "" };
    }
  };
  const passwordStrength = getPasswordStrength(password);

  const createSession = async (user: User) => {
    try {
        const idToken = await user.getIdToken();
        await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        });
    } catch (error) {
        console.error("Failed to create session:", error);
        if (isMounted.current) {
            setFirebaseError("Could not sign you in. Please try again.");
        }
        throw error;
    }
  };

  const saveUserToDb = async (user: User) => {
    try {
      // It's good practice to ensure email is not null before sending
      if (!user.email) {
        console.warn("Attempted to save user to DB without an email.");
        return; // Or throw an error if email is mandatory
      }
      const response = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, email: user.email }),
      });
      if (!response.ok) throw new Error('Failed to save user to database.');
    } catch (error) {
      console.error("Error saving user to DB:", error);
      throw error;
    }
  };

  const onSubmit = async (values: SignUpFormValues) => {
    if (isMounted.current) {
        setFirebaseError(null);
        setIsLoading(true);
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      // For email/password signup, user is definitely new if successful.
      await saveUserToDb(userCredential.user);
      await createSession(userCredential.user);
      router.push('/choose-role');
    } catch (error: any) {
      if (isMounted.current) {
        setFirebaseError(getFirebaseErrorMessage(error));
        setIsLoading(false);
      }
    }
  };

  const handleSocialSignIn = async (providerName: 'google' | 'github') => {
    if (isMounted.current) {
        setFirebaseError(null);
        setIsSocialLoading(providerName); // Set which social button is loading
    }
    
    let authProvider;
    if (providerName === 'google') {
      const googleProvider = new GoogleAuthProvider();
      googleProvider.setCustomParameters({
        // This forces the account selection dialog, even if only one account is logged in
        // or if the user previously gave permission.
        prompt: 'select_account'
      });
      authProvider = googleProvider;
    } else {
      authProvider = new GithubAuthProvider();
    }

    try {
      const result = await signInWithPopup(auth, authProvider);
      const additionalInfo = getAdditionalUserInfo(result); // Get information about the user's sign-in status

      // Create session regardless if new or old user, as they've just authenticated
      await createSession(result.user);

      if (additionalInfo?.isNewUser) {
        // If it's a completely new user in Firebase
        await saveUserToDb(result.user);
        router.push('/choose-role'); // Direct new users to role selection
      } else {
        // If it's an existing user signing in via social (or linking a new social provider)
        router.push('/dashboard'); // Direct existing users to their dashboard
      }
    } catch (error: any) {
      if (isMounted.current) {
        setFirebaseError(getFirebaseErrorMessage(error));
        console.error("Social Sign-in Error:", error); // Log the full error for debugging
        setIsSocialLoading(null); // Reset social loading state
      }
    }
  };

  const buttonAnimation = "transform transition-transform duration-150 active:scale-95";

  const GlobalStyles = () => (
    <style jsx global>{`
      @keyframes gradient-animation { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
      .animate-gradient { background-size: 200% 200%; animation: gradient-animation 6s ease infinite; }
      @keyframes fade-in-down { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
      .fade-in-down { opacity: 0; animation: fade-in-down 0.8s ease-out 0.2s forwards; }
      @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      .fade-in-up-1 { opacity: 0; animation: fade-in-up 0.8s ease-out forwards; }
      .fade-in-up-2 { opacity: 0; animation: fade-in-up 0.8s ease-out 0.3s forwards; }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .animate-spin-fast { animation: spin 1s linear infinite; }
    `}</style>
  );

  const finalIsSubmitting = isSubmitting || isLoading;
  const isAnySocialLoading = isSocialLoading !== null;

  return (
    <div className="flex flex-col min-h-screen bg-[#1E1E1E] text-gray-300 font-sans">
      <GlobalStyles />
      <header className="absolute top-0 left-0 p-6 z-10">
        <SaloneSkillsLinkLogo className="w-8 h-8 text-white" />
      </header>

      <main className="flex flex-col lg:flex-row flex-grow w-full">
        <div className="hidden lg:flex w-full lg:w-1/2 items-center justify-center p-8 lg:p-12 bg-black/20">
            <div className="text-center lg:text-left flex flex-col items-center lg:items-start">
                  <SaloneSkillsLinkLogo className="h-16 w-16 mb-4 text-white fade-in-down" />
                  <h1 className="text-5xl md:text-6xl font-black text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 animate-gradient fade-in-up-1">
                    Open Innovation Verification Protocol (OIVP)
                  </h1>
                  <h2 className="text-xl md:text-2xl text-gray-400 fade-in-up-2">
                    Connect, learn and grow your skills!
                  </h2>
            </div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-sm">
            <h1 className="text-4xl font-bold text-white mb-4">Create account</h1>
            <p className="text-sm text-gray-400 mb-8">
              By continuing you agree to our{' '}
              <Link href="/terms" className="text-blue-400 hover:underline">Terms of Service</Link>
              {' '}and acknowledge the{' '}
              <Link href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</Link>.
            </p>

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              {formStep === 'email' && (
                <>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <input
                          id="email"
                          type="email"
                          autoComplete="email"
                          {...register("email")}
                          className={`w-full h-12 px-4 pl-10 bg-[#2A2A2A] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${errors.email ? 'border-red-500 ring-red-500' : 'border-gray-600 focus:ring-blue-500'}`}
                        />
                    </div>
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                  </div>

                  <button
                    type="button"
                    onClick={handleProceedToPassword}
                    className={`w-full h-12 flex items-center justify-center bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors ${buttonAnimation}`}
                  >
                    Proceed
                  </button>
                </>
              )}

              {formStep === 'password' && (
                <>
                  <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-400">Creating account for: <span className="font-medium text-white">{emailValue}</span></p>
                      <button type="button" onClick={() => setFormStep('email')} className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                        <ArrowLeft size={14} /> Back
                      </button>
                  </div>
                  <div>
                    <label htmlFor="password"className="block text-sm font-medium text-gray-400 mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        {...register("password")}
                        className={`w-full h-12 px-4 pl-10 pr-10 bg-[#2A2A2A] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${errors.password ? 'border-red-500 ring-red-500' : 'border-gray-600 focus:ring-blue-500'}`}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400">
                        {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                      </button>
                    </div>
                      {errors.password ? (
                        <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                      ) : (
                        password && <p className={`text-xs mt-1 ${passwordStrength.color}`}>{passwordStrength.strength}</p>
                      )}
                  </div>

                  <div>
                    <label htmlFor="confirm-password"className="block text-sm font-medium text-gray-400 mb-2">Confirm Password</label>
                      <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        {...register("confirmPassword")}
                        className={`w-full h-12 px-4 pl-10 pr-10 bg-[#2A2A2A] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${errors.confirmPassword ? 'border-red-500 ring-red-500' : 'border-gray-600 focus:ring-blue-500'}`}
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400">
                        {showConfirmPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
                  </div>

                  {firebaseError && <p className="text-red-500 text-sm text-center font-medium">{firebaseError}</p>}

                  <button
                    type="submit"
                    disabled={finalIsSubmitting}
                    className={`w-full h-12 flex items-center justify-center bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed ${buttonAnimation}`}
                  >
                    {finalIsSubmitting ? 'Creating Account...' : 'Create Account'}
                  </button>
                </>
              )}
            </form>

            <p className="text-center text-sm text-gray-400 mt-6">
              Already have an account?{' '}
              <Link href="/signin" className="font-medium text-blue-400 hover:underline">Sign in</Link>
            </p>

            <div className="flex items-center my-8">
              <hr className="w-full border-gray-600" />
              <span className="px-4 text-gray-400 text-sm">or</span>
              <hr className="w-full border-gray-600" />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => handleSocialSignIn('google')}
                disabled={finalIsSubmitting || isAnySocialLoading}
                className={`w-full h-12 flex items-center justify-center bg-transparent border border-gray-600 rounded-lg text-white hover:bg-[#2A2A2A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${buttonAnimation}`}
              >
                {isSocialLoading === 'google' ? (
                  <Loader2 className="animate-spin-fast h-5 w-5 mr-3" />
                ) : (
                  <GoogleIcon />
                )}
                Google
              </button>
              <button
                onClick={() => handleSocialSignIn('github')}
                disabled={finalIsSubmitting || isAnySocialLoading}
                className={`w-full h-12 flex items-center justify-center bg-transparent border border-gray-600 rounded-lg text-white hover:bg-[#2A2A2A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${buttonAnimation}`}
              >
                {isSocialLoading === 'github' ? (
                  <Loader2 className="animate-spin-fast h-5 w-5 mr-3" />
                ) : (
                  <GitHubIcon />
                )}
                GitHub
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full bg-[#1E1E1E]">
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