// src/app/dashboard/portfolio/add/how-to-submit/page.tsx
"use client";

import Link from 'next/link';
import { FaArrowLeft, FaClipboardCheck, FaUserShield, FaBoxOpen, FaDatabase, FaMagic } from 'react-icons/fa';
// NEW: Import motion and Variants type from framer-motion
import { motion, Variants } from 'framer-motion';

// MODIFIED: Added hover transition effects to the MockUI component
const MockUI = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 mt-4 mb-6 shadow-lg transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl ${className}`}>
    {children}
  </div>
);

export default function HowToSubmitPage() {

  // NEW & FIXED: Defined animation variants with the correct TypeScript type
  const sectionVariants: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.6,
        ease: "easeInOut" // Corrected the ease value to a valid one
      } 
    }
  };

  return (
    <div className="min-h-screen text-gray-100 pb-12 relative overflow-hidden">
      
      {/* --- Decorative Background Elements --- */}
      <div className="absolute top-0 left-0 -translate-x-1/4 -translate-y-1/4 w-96 h-96 lg:w-[32rem] lg:h-[32rem] bg-green-900/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '9s' }}></div>
      <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-96 h-96 lg:w-[32rem] lg:h-[32rem] bg-indigo-900/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '11s' }}></div>

      <div className="max-w-4xl mx-auto px-6 pt-8 relative z-10">
        
        {/* --- Header and Back Button --- */}
        <div className="mb-10">
          <Link href="/dashboard/portfolio/add" className="flex items-center text-gray-400 hover:text-white transition-colors group">
            <FaArrowLeft className="h-5 w-5 mr-3 transform group-hover:-translate-x-1 transition-transform" />
             {/* MODIFIED: Added a subtle glow effect on hover */}
            <span className="text-lg transition-all group-hover:text-shadow-[0_0_8px_rgba(255,255,255,0.4)]">Back to Project Form</span>
          </Link>
        </div>

        {/* --- Main Content (CORRECTION: Glowing border effect removed) --- */}
        <div className="border border-gray-800 rounded-2xl p-8 md:p-12 shadow-2xl backdrop-blur-sm">
          <h1 className="text-4xl font-extrabold text-white mb-4">How to Submit a Project</h1>
          <p className="text-gray-400 text-lg mb-10">
            Submitting is more than just a click. Here's a look at the automated process that happens when you save your work.
          </p>
          
          <div className="space-y-12">
            
            {/* --- STEP 1: Validation --- */}
            {/* NEW: Wrapped section with motion.section for scroll animation */}
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={sectionVariants}
            >
              <h2 className="text-2xl font-bold text-blue-400 border-l-4 border-blue-400 pl-4 mb-4 flex items-center">
                <FaClipboardCheck className="mr-3" />Validation
              </h2>
              <p className="text-gray-300 mb-4">
                First, the system performs a comprehensive check to ensure all required fields are filled out correctly. If anything is missing or an image is still uploading, an error message will appear, and the submission will be paused.
              </p>
              <MockUI className="text-sm">
                <p className="font-semibold text-white mb-3">Form Checklist:</p>
                <ul className="space-y-2">
                  <li className="flex items-center text-green-400"><span className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center mr-3">✓</span>Project Title</li>
                  <li className="flex items-center text-green-400"><span className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center mr-3">✓</span>Description</li>
                  <li className="flex items-center text-green-400"><span className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center mr-3">✓</span>Skills</li>
                  <li className="flex items-center text-red-400"><span className="w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center mr-3">!</span>Main Image (Still uploading...)</li>
                </ul>
                <div className="mt-4 pt-4 border-t border-gray-700 text-center text-gray-400">
                  Submission Halts Until All Checks Pass
                </div>
              </MockUI>
            </motion.section>
            
            {/* --- STEP 2: User Authentication Check --- */}
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={sectionVariants}
            >
              <h2 className="text-2xl font-bold text-green-400 border-l-4 border-green-400 pl-4 mb-4 flex items-center">
                <FaUserShield className="mr-3" />User Authentication Check
              </h2>
              <p className="text-gray-300 mb-4">
                Next, the system quickly verifies your identity. It checks that you are logged in and confirms that your account has the "youth" user type, which is required to add portfolio projects.
              </p>
              <MockUI className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-500 rounded-full flex-shrink-0"></div>
                <div>
                  <p className="font-bold text-white">Your Profile</p>
                  <p className="text-sm text-gray-400">Status: <span className="text-green-400 font-semibold">Logged In</span></p>
                  <p className="text-sm text-gray-400">User Role: <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded-full">youth</span></p>
                </div>
              </MockUI>
            </motion.section>
            
            {/* --- STEP 3: Data Packaging --- */}
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={sectionVariants}
            >
              <h2 className="text-2xl font-bold text-purple-400 border-l-4 border-purple-400 pl-4 mb-4 flex items-center">
                <FaBoxOpen className="mr-3" />Data Packaging
              </h2>
              <p className="text-gray-300 mb-4">
                All the information you entered—title, description, skills, image data, and category-specific URLs—is collected and neatly organized into a single digital package, ready for the database.
              </p>
              <MockUI className="text-center">
                  <div className="text-sm text-gray-400">Title, Description, Skills, Image Data, URLs</div>
                  <div className="text-2xl my-2 text-gray-500">↓</div>
                  <div className="bg-gray-700 p-4 rounded-lg inline-block">
                    <p className="font-mono text-white">[ Project Data Object ]</p>
                  </div>
              </MockUI>
            </motion.section>

            {/* --- STEP 4: Database Storage --- */}
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={sectionVariants}
            >
              <h2 className="text-2xl font-bold text-red-400 border-l-4 border-red-400 pl-4 mb-4 flex items-center">
                <FaDatabase className="mr-3" />Database Storage
              </h2>
              <p className="text-gray-300 mb-4">
                This data package is securely sent to the Firestore database, where it is stored as a new project entry. The `addDoc` function in the code handles this critical step, ensuring your work is saved safely.
              </p>
               <MockUI className="flex items-center justify-center space-x-6">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <p className="font-mono text-white">[ Project Data Object ]</p>
                  </div>
                  <div className="text-3xl text-gray-500">→</div>
                  <FaDatabase className="text-5xl text-red-400" />
               </MockUI>
            </motion.section>
            
            {/* --- STEP 5: Redirection --- */}
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={sectionVariants}
            >
              <h2 className="text-2xl font-bold text-yellow-400 border-l-4 border-yellow-400 pl-4 mb-4 flex items-center">
                <FaMagic className="mr-3" />Redirection
              </h2>
              <p className="text-gray-300 mb-4">
                Finally, once the data is successfully saved, you are automatically redirected from the form page back to your main portfolio dashboard, where you can see your newly added project.
              </p>
              <MockUI className="flex items-center justify-center space-x-6 text-center">
                <div className="p-4 rounded-lg bg-gray-700/50">
                    <p className="font-semibold text-white">Add Project Page</p>
                    <p className="text-xs text-gray-400">/portfolio/add</p>
                </div>
                <div className="text-3xl text-gray-500 animate-pulse">→</div>
                <div className="p-4 rounded-lg bg-gray-700/50">
                    <p className="font-semibold text-white">Portfolio Dashboard</p>
                    <p className="text-xs text-gray-400">/dashboard/portfolio</p>
                </div>
              </MockUI>
            </motion.section>

          </div>
        </div>
      </div>
    </div>
  );
}