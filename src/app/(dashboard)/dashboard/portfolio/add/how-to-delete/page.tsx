// src/app/dashboard/portfolio/add/how-to-delete/page.tsx
"use client";

import Link from 'next/link';
import { FaArrowLeft, FaTrash, FaShieldAlt, FaExclamationTriangle, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
// NEW: Import motion and Variants type from framer-motion
import { motion, Variants } from 'framer-motion';

// A helper component for visual mock-ups of UI elements
const MockUI = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 mt-4 mb-6 shadow-lg transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl ${className}`}>
    {children}
  </div>
);

export default function HowToDeletePage() {

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
      <div className="absolute top-0 left-0 -translate-x-1/4 -translate-y-1/4 w-96 h-96 lg:w-[32rem] lg:h-[32rem] bg-red-900/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '9s' }}></div>
      <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-96 h-96 lg:w-[32rem] lg:h-[32rem] bg-yellow-900/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '11s' }}></div>

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
          <h1 className="text-4xl font-extrabold text-white mb-4">How to Delete a Project</h1>
          <p className="text-gray-400 text-lg mb-10">
            Removing a project from your portfolio is a permanent action. Here's how the process works to ensure you don't delete work by accident.
          </p>
          
          <div className="space-y-12">
            
            {/* --- STEP 1: Locating the Delete Button --- */}
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={sectionVariants}
            >
              <h2 className="text-2xl font-bold text-blue-400 border-l-4 border-blue-400 pl-4 mb-4 flex items-center">
                <FaTrash className="mr-3" />Step 1: Locate Your Project
              </h2>
              <p className="text-gray-300 mb-4">
                First, navigate to your main portfolio dashboard. Here you will see a list or grid of all your saved projects. Each project card will have its own set of management options, including an "Edit" and a "Delete" button.
              </p>
              <MockUI className="text-sm">
                <div className="bg-gray-900/60 p-4 rounded-lg flex items-center justify-between">
                    <div>
                        <p className="font-bold text-white text-lg">Mobile App for Local Delivery</p>
                        <p className="text-gray-400">Category: Tech</p>
                    </div>
                    <div className="flex space-x-2">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg">Edit</button>
                        <button className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg">Delete</button>
                    </div>
                </div>
              </MockUI>
            </motion.section>
            
            {/* --- STEP 2: The Confirmation Step --- */}
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={sectionVariants}
            >
              <h2 className="text-2xl font-bold text-yellow-400 border-l-4 border-yellow-400 pl-4 mb-4 flex items-center">
                <FaShieldAlt className="mr-3" />Step 2: The Confirmation Prompt
              </h2>
              <p className="text-gray-300 mb-4">
                To prevent accidental deletion, clicking the "Delete" button will not immediately remove the project. Instead, a confirmation pop-up will appear, asking you to verify your decision.
              </p>
              <MockUI>
                <div className="p-4 text-center">
                    <FaExclamationTriangle className="mx-auto h-12 w-12 text-yellow-400 mb-4" />
                    <h3 className="text-xl font-bold text-white">Are you sure?</h3>
                    <p className="text-gray-400 mt-2 mb-6">This action cannot be undone. All project data will be permanently erased from the database.</p>
                    <div className="flex justify-center space-x-4">
                        <button className="w-1/2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center">
                            <FaTimesCircle className="mr-2"/>Cancel
                        </button>
                        <button className="w-1/2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center">
                            <FaTrash className="mr-2"/>Yes, Delete
                        </button>
                    </div>
                </div>
              </MockUI>
            </motion.section>
            
            {/* --- STEP 3: Permanent Deletion --- */}
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={sectionVariants}
            >
              <h2 className="text-2xl font-bold text-red-400 border-l-4 border-red-400 pl-4 mb-4 flex items-center">
                <FaCheckCircle className="mr-3" />Step 3: Final Deletion from Database
              </h2>
              <p className="text-gray-300 mb-4">
                Once you confirm, a request is sent to the server. The system locates your project's unique ID in the Firestore database and uses the `deleteDoc` function to permanently remove the entry. The project will then disappear from your dashboard.
              </p>
              <MockUI className="flex items-center justify-center space-x-6">
                  <div className="text-center">
                    <p className="font-mono text-sm text-gray-400">Project ID: "Abc123XYZ"</p>
                    <div className="text-3xl my-1 text-gray-500">→</div>
                    <FaTrash className="text-5xl text-red-500" />
                  </div>
                  <div className="text-3xl text-gray-500">→</div>
                  <div className="text-center text-gray-500">
                    <p className="font-mono text-lg">[ Entry Deleted ]</p>
                    <p className="text-sm">Database Updated</p>
                  </div>
              </MockUI>
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  );
}