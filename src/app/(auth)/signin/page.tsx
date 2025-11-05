'use client';

// Added useRef and useEffect
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { 
    signInWithEmailAndPassword, 
    signInWithPopup, 
    GoogleAuthProvider, 
    GithubAuthProvider, 
    AuthError,
    User
} from 'firebase/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Globe, ChevronDown, Lock, Eye, EyeOff, Mail } from 'lucide-react';

// --- FORM VALIDATION SCHEMA ---
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});
type SignInFormValues = z.infer<typeof formSchema>;

// --- SVG ICON COMPONENTS (Reused) ---
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

// --- MAIN SIGN-IN COMPONENT ---
export default function SignInPage() {
    const router = useRouter();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignInFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { email: "", password: "" },
    });
    
    const isMounted = useRef(true);
    const [isLoading, setIsLoading] = useState(false);
    const [firebaseError, setFirebaseError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        isMounted.current = true;
        return () => {
          isMounted.current = false;
        };
    }, []);

    const getFirebaseErrorMessage = (error: AuthError): string => {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
              return 'Invalid email or password. Please try again.';
          case 'auth/too-many-requests':
              return 'Access to this account has been temporarily disabled due to many failed login attempts. You can try again later.';
          default:
              return 'An unexpected error occurred. Please try again.';
        }
    };

    // --- UPDATED createSession FUNCTION ---
    const createSession = async (user: User) => {
        try {
            const idToken = await user.getIdToken();
            const response = await fetch('/api/auth/session', { // Save response
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });

            if (!response.ok) { // Check if response is successful
              throw new Error('API request failed to create session.');
            }

            return await response.json(); // Return the JSON data
        } catch (error) {
            console.error("Failed to create session:", error);
            if (isMounted.current) {
                setFirebaseError("Could not sign you in. Please try again.");
            }
            throw error; // Re-throw the error to stop the login process
        }
    };

    // --- UPDATED onSubmit FUNCTION ---
    const onSubmit = async (values: SignInFormValues) => {
        if (isMounted.current) {
            setFirebaseError(null);
            setIsLoading(true);
        }
        try {
            const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
            
            // 1. Get the response data (which includes userType)
            const data = await createSession(userCredential.user);

            // 2. Redirect based on userType
            if (data.userType === 'admin') {
              router.push('/admin/dashboard');
            } else {
              router.push('/dashboard');
            }
        } catch (error: any) {
            if (isMounted.current) {
                setFirebaseError(getFirebaseErrorMessage(error));
                setIsLoading(false);
            }
        }
    };

    // --- UPDATED handleSocialSignIn FUNCTION ---
    const handleSocialSignIn = async (provider: 'google' | 'github') => {
        if (isMounted.current) {
            setFirebaseError(null);
            setIsLoading(true);
        }
        const authProvider = provider === 'google' ? new GoogleAuthProvider() : new GithubAuthProvider();
        try {
            const result = await signInWithPopup(auth, authProvider);
            
            // 1. Get the response data (which includes userType)
            const data = await createSession(result.user);

            // 2. Redirect based on userType
            if (data.userType === 'admin') {
              router.push('/admin/dashboard');
            } else {
              router.push('/dashboard');
            }
        } catch (error: any) {
            if (isMounted.current) {
                setFirebaseError(getFirebaseErrorMessage(error));
                setIsLoading(false);
            }
        }
    };

    const finalIsSubmitting = isSubmitting || isLoading;
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
      `}</style>
    );

    return (
        <div className="flex flex-col min-h-screen bg-[#1E1E1E] text-gray-300 font-sans">
            <GlobalStyles />
            <header className="absolute top-0 left-0 p-6 z-10"><SaloneSkillsLinkLogo className="w-8 h-8 text-white" /></header>
            
            <main className="flex flex-col lg:flex-row flex-grow w-full">
                <div className="hidden lg:flex w-full lg:w-1/2 items-center justify-center p-8 lg:p-12 bg-black/20">
                    <div className="text-center lg:text-left flex flex-col items-center lg:items-start">
                        <SaloneSkillsLinkLogo className="h-16 w-16 mb-4 text-white fade-in-down" />
                        <h1 className="text-5xl md:text-6xl font-black text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 animate-gradient fade-in-up-1">Welcome Back!</h1>
                        <h2 className="text-xl md:text-2xl text-gray-400 fade-in-up-2">Sign in to continue your journey.</h2>
                    </div>
                </div>
                <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                    <div className="w-full max-w-sm">
                        <h1 className="text-4xl font-bold text-white mb-4">Sign in</h1>
                        <p className="text-sm text-gray-400 mb-8">Sign in to your account</p>
                        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                    <input id="email" type="email" autoComplete="email" {...register("email")}
                                        className={`w-full h-12 px-4 pl-10 bg-[#2A2A2A] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${errors.email ? 'border-red-500 ring-red-500' : 'border-gray-600 focus:ring-blue-500'}`}
                                    />
                                </div>
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                            </div>
                            <div>
                                <label htmlFor="password"className="block text-sm font-medium text-gray-400 mb-2">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                    <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" {...register("password")}
                                        className={`w-full h-12 px-4 pl-10 pr-10 bg-[#2A2A2A] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${errors.password ? 'border-red-500 ring-red-500' : 'border-gray-600 focus:ring-blue-500'}`}
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400">
                                        {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                                    </button>
                                </div>
                                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                            </div>
                            {firebaseError && <p className="text-red-500 text-sm text-center font-medium">{firebaseError}</p>}
                            <button type="submit" disabled={finalIsSubmitting}
                                className={`w-full h-12 flex items-center justify-center bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed ${buttonAnimation}`}
                            >
                                {finalIsSubmitting ? 'Signing In...' : 'Sign In'}
                            </button>
                        </form>
                        <p className="text-center text-sm text-gray-400 mt-6">
                            Don't have an account?{' '}
                            <Link href="/signup" className="font-medium text-blue-400 hover:underline">Sign Up</Link>
                        </p>
                        <div className="flex items-center my-8">
                            <hr className="w-full border-gray-600" />
                            <span className="px-4 text-gray-400 text-sm">or</span>
                            <hr className="w-full border-gray-600" />
                        </div>
                        
                        <div className="flex gap-4">
                            <button onClick={() => handleSocialSignIn('google')} disabled={finalIsSubmitting} className={`w-full h-12 flex items-center justify-center bg-transparent border border-gray-600 rounded-lg text-white hover:bg-[#2A2A2A] transition-colors disabled:opacity-50 ${buttonAnimation}`}>
                                <GoogleIcon />
                                Google
                            </button>
                            <button onClick={() => handleSocialSignIn('github')} disabled={finalIsSubmitting} className={`w-full h-12 flex items-center justify-center bg-transparent border border-gray-600 rounded-lg text-white hover:bg-[#2A2A2A] transition-colors disabled:opacity-50 ${buttonAnimation}`}>
                                <GitHubIcon />
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

            <div className="fixed bottom-4 right-4 bg-gray-800 p-2 rounded-full shadow-lg"><ShieldIcon /></div>
        </div>
    );
}

