// src/app/dashboard/portfolio/add/how-to-verify/page.tsx
"use client";

import Link from 'next/link';
import { FaArrowLeft, FaClock, FaUserCheck, FaClipboardList, FaCheckCircle, FaShieldAlt } from 'react-icons/fa';
// NEW: Import motion and Variants type from framer-motion
import { motion, Variants } from 'framer-motion';

// A helper component for visual mock-ups of UI elements
const MockUI = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 mt-4 mb-6 shadow-lg transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl ${className}`}>
    {children}
  </div>
);

export default function HowToVerifyPage() {

  // Defined animation variants for scroll animations
  const sectionVariants: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.6,
        ease: "easeInOut" 
      } 
    }
  };

  return (
    <div className="min-h-screen text-gray-100 pb-12 relative overflow-hidden">
      
      {/* --- Decorative Background Elements --- */}
      <div className="absolute top-0 left-0 -translate-x-1/4 -translate-y-1/4 w-96 h-96 lg:w-[32rem] lg:h-[32rem] bg-teal-900/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }}></div>
      <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-96 h-96 lg:w-[32rem] lg:h-[32rem] bg-green-900/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s' }}></div>

      <div className="max-w-4xl mx-auto px-6 pt-8 relative z-10">
        
        {/* --- Header and Back Button --- */}
        <div className="mb-10">
          <Link href="/dashboard/portfolio/add" className="flex items-center text-gray-400 hover:text-white transition-colors group">
            <FaArrowLeft className="h-5 w-5 mr-3 transform group-hover:-translate-x-1 transition-transform" />
            <span className="text-lg transition-all group-hover:text-shadow-[0_0_8px_rgba(255,255,255,0.4)]">Back to Project Form</span>
          </Link>
        </div>

        {/* --- Main Content --- */}
        <div className="border border-gray-800 rounded-2xl p-8 md:p-12 shadow-2xl backdrop-blur-sm">
          <h1 className="text-4xl font-extrabold text-white mb-4">How to Get Your Project Verified</h1>
          <p className="text-gray-400 text-lg mb-10">
            Verification adds a layer of authenticity to your work. It's a review process handled by our team to confirm the quality and legitimacy of your submission.
          </p>
          
          <div className="space-y-12">
            
            {/* --- STEP 1: Initial Status --- */}
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={sectionVariants}
            >
              <h2 className="text-2xl font-bold text-yellow-400 border-l-4 border-yellow-400 pl-4 mb-4 flex items-center">
                <FaClock className="mr-3" />Step 1: Automatic "Unverified" Status
              </h2>
              <p className="text-gray-300 mb-4">
                As soon as you successfully submit a new project, it is automatically saved to your portfolio with an initial status of "Unverified." This is the default state for all new submissions and indicates your project is awaiting review.
              </p>
              <MockUI>
                <div className="bg-gray-900/60 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-white text-lg">My New Awesome Project</p>
                    <span className="bg-yellow-500/20 text-yellow-300 text-xs font-semibold px-3 py-1 rounded-full">Unverified</span>
                  </div>
                  <p className="text-gray-400 text-sm mt-1">Your project has been submitted and is pending review.</p>
                </div>
              </MockUI>
            </motion.section>
            
            {/* --- STEP 2: The Review Queue --- */}
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={sectionVariants}
            >
              <h2 className="text-2xl font-bold text-blue-400 border-l-4 border-blue-400 pl-4 mb-4 flex items-center">
                <FaClipboardList className="mr-3" />Step 2: Entering the Admin Review Queue
              </h2>
              <p className="text-gray-300 mb-4">
                Your project is placed in a queue to be reviewed by a platform administrator. The review process is manual to ensure a high standard of quality and authenticity across all verified projects.
              </p>
              <MockUI className="text-center">
                <div className="text-sm text-gray-400">Your Project</div>
                <div className="text-2xl my-2 text-gray-500">↓</div>
                <div className="bg-gray-700 p-4 rounded-lg inline-block">
                  <p className="font-mono text-white flex items-center"><FaClipboardList className="mr-3"/>[ Admin Review Queue ]</p>
                </div>
              </MockUI>
            </motion.section>
            
            {/* --- STEP 3: The Verification Check --- */}
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={sectionVariants}
            >
              <h2 className="text-2xl font-bold text-purple-400 border-l-4 border-purple-400 pl-4 mb-4 flex items-center">
                <FaUserCheck className="mr-3" />Step 3: The Manual Review
              </h2>
              <p className="text-gray-300 mb-4">
                An administrator will thoroughly check your project. This includes visiting your Live Demo URL, inspecting your GitHub repository for legitimate code, and ensuring the description and skills listed are accurate.
              </p>
              <MockUI>
                <p className="font-semibold text-white mb-3">Admin Checklist:</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center text-green-400"><span className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center mr-3">✓</span>Live Demo link is functional.</li>
                  <li className="flex items-center text-green-400"><span className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center mr-3">✓</span>GitHub repository is accessible and relevant.</li>
                  <li className="flex items-center text-green-400"><span className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center mr-3">✓</span>Project quality meets platform standards.</li>
                  <li className="flex items-center text-gray-400"><span className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center mr-3">?</span>Authenticity confirmed.</li>
                </ul>
              </MockUI>
            </motion.section>
            
            {/* --- STEP 4: Verified Status Achieved --- */}
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={sectionVariants}
            >
              <h2 className="text-2xl font-bold text-green-400 border-l-4 border-green-400 pl-4 mb-4 flex items-center">
                <FaShieldAlt className="mr-3" />Step 4: Status Update
              </h2>
              <p className="text-gray-300 mb-4">
                If your project passes the review, its status will be updated to "Verified" or "Work Authenticated." This new status will be publicly visible on your portfolio, possibly with a special badge, adding credibility to your profile.
              </p>
              <MockUI>
                 <div className="bg-gray-900/60 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-white text-lg">My New Awesome Project</p>
                    <span className="bg-green-500/20 text-green-300 text-xs font-bold px-3 py-1 rounded-full flex items-center">
                        <FaCheckCircle className="mr-1.5"/> Verified
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mt-1">Congratulations! Your work has been authenticated by our team.</p>
                </div>
              </MockUI>
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  );
}