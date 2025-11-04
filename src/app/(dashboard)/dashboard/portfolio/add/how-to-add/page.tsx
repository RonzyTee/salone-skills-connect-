// src/app/dashboard/portfolio/add/how-to-add/page.tsx
"use client";

import Link from 'next/link';
import { FaArrowLeft, FaCogs, FaHeading, FaParagraph, FaTags, FaUpload, FaExclamationTriangle, FaCode, FaGithub, FaPalette, FaImages, FaYoutube, FaPlus, FaCheckCircle } from 'react-icons/fa';
// NEW: Import motion and Variants type from framer-motion
import { motion, Variants } from 'framer-motion';

// MODIFIED: Added hover transition effects to the MockUI component
const MockUI = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 mt-4 mb-6 shadow-lg transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl ${className}`}>
    {children}
  </div>
);

export default function HowToAddPage() {

  // NEW: Defined animation variants with the correct TypeScript type for scroll animations
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
      <div className="absolute top-0 left-0 -translate-x-1/4 -translate-y-1/4 w-96 h-96 lg:w-[32rem] lg:h-[32rem] bg-blue-900/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-96 h-96 lg:w-[32rem] lg:h-[32rem] bg-purple-900/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s' }}></div>

      <div className="max-w-4xl mx-auto px-6 pt-8 relative z-10">
        
        {/* --- Header and Back Button --- */}
        <div className="mb-10">
          <Link href="/dashboard/portfolio/add" className="flex items-center text-gray-400 hover:text-white transition-colors group">
            <FaArrowLeft className="h-5 w-5 mr-3 transform group-hover:-translate-x-1 transition-transform" />
            {/* MODIFIED: Added a subtle glow effect on hover */}
            <span className="text-lg transition-all group-hover:text-shadow-[0_0_8px_rgba(255,255,255,0.4)]">Back to Project Form</span>
          </Link>
        </div>

        {/* --- Main Content (CORRECTION: Removed 'bg-gray-900/50') --- */}
        <div className="border border-gray-800 rounded-2xl p-8 md:p-12 shadow-2xl backdrop-blur-sm">
          <h1 className="text-4xl font-extrabold text-white mb-4">How to Add a New Project</h1>
          <p className="text-gray-400 text-lg mb-10">
            Follow this visual guide to fill out the form and showcase your work effectively.
          </p>
          
          {/* --- STEP 1: Core Details --- */}
          <motion.section 
            className="mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={sectionVariants}
          >
            <h2 className="text-2xl font-bold text-blue-400 border-l-4 border-blue-400 pl-4 mb-6">Step 1: Fill Out Core Project Details</h2>
            <p className="text-gray-300 mb-6">
              This is the foundation of your project. Provide the essential information that tells viewers what your project is about.
            </p>
            
            <ul className="space-y-8">
              {/* Skill Category */}
              <li className="flex items-start space-x-4">
                <FaCogs className="text-blue-400 h-6 w-6 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white text-lg">Skill Category</h3>
                  <p className="text-gray-400">Select a category from the dropdown. This choice customizes the form for your project type.</p>
                  <MockUI>
                    <div className="flex justify-between items-center bg-gray-700 p-3 rounded text-gray-300">
                      <span>Select the main category...</span>
                      <span>▼</span>
                    </div>
                  </MockUI>
                </div>
              </li>
              
              {/* Project Title */}
              <li className="flex items-start space-x-4">
                <FaHeading className="text-blue-400 h-6 w-6 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white text-lg">Project Title</h3>
                  <p className="text-gray-400">Create a concise and descriptive title.</p>
                  <MockUI>
                    <input type="text" readOnly value="Mobile App for Local Delivery Service" className="w-full bg-gray-700 p-3 rounded text-gray-300 placeholder-gray-500 border border-transparent" />
                  </MockUI>
                </div>
              </li>
              
              {/* Description */}
              <li className="flex items-start space-x-4">
                <FaParagraph className="text-blue-400 h-6 w-6 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white text-lg">Description</h3>
                  <p className="text-gray-400">Explain your project in detail. We recommend covering:</p>
                  <ul className="list-disc list-inside text-gray-400 mt-2 space-y-1">
                    <li><span className="font-semibold text-gray-300">The Problem:</span> What challenge did you address?</li>
                    <li><span className="font-semibold text-gray-300">The Solution:</span> How did you solve it?</li>
                    <li><span className="font-semibold text-gray-300">Your Role:</span> What was your specific contribution?</li>
                  </ul>
                </div>
              </li>
              
              {/* Skills Used */}
              <li className="flex items-start space-x-4">
                <FaTags className="text-blue-400 h-6 w-6 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white text-lg">Skills Used</h3>
                  <p className="text-gray-400">Type a skill and press "Enter" to add it as a tag.</p>
                  <MockUI>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">React</span>
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">Node.js</span>
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">Graphic Design</span>
                    </div>
                  </MockUI>
                </div>
              </li>
            </ul>
          </motion.section>

          {/* --- STEP 2: Main Visual --- */}
          <motion.section 
            className="mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            variants={sectionVariants}
          >
            <h2 className="text-2xl font-bold text-green-400 border-l-4 border-green-400 pl-4 mb-6">Step 2: Upload a Main Project Visual</h2>
            <p className="text-gray-300 mb-6">
              Every project needs a main image. This is the first thing people see and acts as the preview on your portfolio card.
            </p>
            <MockUI className="text-center">
              <FaUpload className="mx-auto h-12 w-12 text-gray-500 mb-4" />
              <p className="text-gray-400">Drag & drop an image here, or <span className="text-blue-400 font-semibold">click to browse</span></p>
            </MockUI>

            <div className="mt-6 flex items-start space-x-4 bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
                <FaExclamationTriangle className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-1" />
                <div>
                    <h4 className="font-bold text-yellow-300">Important Size Limit</h4>
                    <p className="text-yellow-300/80">Images are stored directly in the database, which has a strict <strong className="font-bold">1MB size limit</strong> per entry (this includes all text and other data). Please use compressed images (e.g., JPEG, WEBP) to ensure they fit.</p>
                </div>
            </div>
          </motion.section>

          {/* --- STEP 3: Category-Specific Info --- */}
          <motion.section 
            className="mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={sectionVariants}
          >
            <h2 className="text-2xl font-bold text-purple-400 border-l-4 border-purple-400 pl-4 mb-6">Step 3: Provide Category-Specific Information</h2>
            <p className="text-gray-300 mb-6">
              Based on the category you chose in Step 1, you will need to provide specific links or visuals to validate your work.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {/* For Tech */}
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <h3 className="font-bold text-lg text-white mb-3 flex items-center"><FaCode className="mr-2 text-purple-400" />For Tech Projects</h3>
                <p className="text-sm text-gray-400 mb-2">Provide a link to a live demo and the source code.</p>
                <div className="space-y-2 text-sm text-gray-300">
                    <p className="flex items-center"><FaCheckCircle className="text-green-500 mr-2" /> Live Demo URL</p>
                    <p className="flex items-center"><FaGithub className="text-gray-400 mr-2" /> GitHub Repository URL</p>
                </div>
              </div>
              
              {/* For Design/Craft */}
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <h3 className="font-bold text-lg text-white mb-3 flex items-center"><FaPalette className="mr-2 text-purple-400" />For Design & Craft</h3>
                <p className="text-sm text-gray-400 mb-2">Link to an external portfolio or upload more images.</p>
                <div className="space-y-2 text-sm text-gray-300">
                    <p className="flex items-center">Project Portfolio URL (Optional)</p>
                    <p className="flex items-center"><FaImages className="text-gray-400 mr-2" /> Project Image Gallery (Optional)</p>
                </div>
              </div>
              
              {/* For Performance/Service */}
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 md:col-span-2">
                <h3 className="font-bold text-lg text-white mb-3 flex items-center"><FaYoutube className="mr-2 text-purple-400" />For Performance & Service</h3>
                <p className="text-sm text-gray-400 mb-2">Showcase your work with a link to a video or audio platform.</p>
                <div className="space-y-2 text-sm text-gray-300">
                    <p className="flex items-center">Video/Audio URL (e.g., YouTube, SoundCloud)</p>
                </div>
              </div>
            </div>
          </motion.section>
          
          {/* --- STEP 4: Saving --- */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            variants={sectionVariants}
          >
            <h2 className="text-2xl font-bold text-red-400 border-l-4 border-red-400 pl-4 mb-6">Step 4: Save Your Project</h2>
            <p className="text-gray-300 mb-6">
              Once all required fields are complete and image uploads are finished, the "Save Project" button will become clickable. Press it to add the project to your portfolio.
            </p>
             <MockUI className="flex items-center justify-center space-x-4">
                <button disabled className="w-1/2 bg-gray-600 text-gray-400 font-semibold py-3 px-6 rounded-lg cursor-not-allowed">
                    <FaPlus className="mr-2 inline-block" /> Save Project (Disabled)
                </button>
                <button className="w-1/2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg">
                    <FaPlus className="mr-2 inline-block" /> Save Project (Active)
                </button>
            </MockUI>
          </motion.section>
        </div>

      </div>
    </div>
  );
}