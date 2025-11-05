
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FaArrowUp, FaCog, FaSearch, FaImages, FaTrophy, FaNewspaper, FaQuestionCircle,
  FaBriefcase, FaChevronDown, FaTimesCircle, FaCheckCircle,
  FaPaintBrush, FaCode, FaCamera, FaWrench, FaCut, FaBirthdayCake,
  FaUserCheck, FaFolderOpen, FaAward, FaSearchLocation, FaFilter, FaHandshake,
  FaQuoteLeft, FaPlus, FaMinus, FaSignInAlt, FaUserPlus, FaIdBadge, FaCertificate, FaStar, FaMapMarkerAlt
} from 'react-icons/fa';

// --- CONFIGURATION / CONSTANTS ---

// FIX: Define a type for navigation links to prevent 'any[]' type error.
interface NavLink {
  name: string;
  href: string;
  icon?: React.ReactNode;
}

// Navigation links with corrected hrefs for Next.js routing
const NAV_LINKS: NavLink[] = [
];

// Data for Featured Skills section
const FEATURED_SKILLS = [
    { name: 'Web Development', icon: <FaCode className="h-10 w-10 text-blue-400" />, color: 'blue' },
    { name: 'Graphic Design', icon: <FaPaintBrush className="h-10 w-10 text-purple-400" />, color: 'purple' },
    { name: 'Photography', icon: <FaCamera className="h-10 w-10 text-pink-400" />, color: 'pink' },
    { name: 'Tailoring', icon: <FaCut className="h-10 w-10 text-green-400" />, color: 'green' },
    { name: 'Baking', icon: <FaBirthdayCake className="h-10 w-10 text-red-400" />, color: 'red' },
    { name: 'Mechanics', icon: <FaWrench className="h-10 w-10 text-gray-400" />, color: 'gray' },
];

// Statistics data for the hero section
const STATS_DATA = [
    { value: '200+', description: 'Skilled talents ready to be hired across various platforms.' },
    { value: '50+', description: 'Managers & Clients actively registering and hiring.' },
    { value: '100+', description: 'Active members using the platform to connect and grow daily.' },
];

// Step data for "How It Works" section
const talentSteps = [
    { icon: <FaUserCheck />, title: "Verify Your Identity", description: "Upload your National ID to confirm you're a real person (OIVP Tier 0)." },
    { icon: <FaFolderOpen />, title: "Showcase Your Work", description: "Add projects to your portfolio—verify websites automatically or upload photo/video proof for vocational skills (OIVP Tier 1)." },
    { icon: <FaAward />, title: "Get Endorsed by Clients", description: "Request testimonials from past clients to earn the 'Client Endorsed' badge—the ultimate trust signal (OIVP Tier 2)." },
];

const managerSteps = [
    { icon: <FaSearchLocation />, title: "Find Proven Talent", description: "Search for any skill you need, from programming to painting." },
    { icon: <FaFilter />, title: "Filter by Trust Level", description: "Use our OIVP filters to instantly find youth who are identity-verified, have proven work, or are endorsed by clients." },
    { icon: <FaHandshake />, title: "Hire with Confidence", description: "Review verified portfolios and testimonials to make informed, risk-free hiring decisions." },
];

// Data for Interactive Product Demo
const TALENT_DATA = [
  { name: 'Isata Kallon', skill: 'Web Developer', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=256&auto=format&fit=crop', location: 'Freetown', oivpTier: 2 },
  { name: 'Musa Bangura', skill: 'Graphic Designer', avatar: 'https://images.unsplash.com/photo-1610216705422-caa3fc269d95?q=80&w=256&auto=format&fit=crop', location: 'Bo', oivpTier: 1 },
  { name: 'Fatmata Koroma', skill: 'Photographer', avatar: 'https://images.unsplash.com/photo-1592755219439-559d1a3a4c38?q=80&w=256&auto=format&fit=crop', location: 'Freetown', oivpTier: 2 },
  { name: 'David Williams', skill: 'Mechanic', avatar: 'https://images.unsplash.com/photo-1568602471322-7826e3a4e894?q=80&w=256&auto=format&fit=crop', location: 'Kenema', oivpTier: 0 },
  { name: 'Zainab Turay', skill: 'Tailor', avatar: 'https://images.unsplash.com/photo-1558239088-580a145d4755?q=80&w=256&auto=format&fit=crop', location: 'Makeni', oivpTier: 1 },
  { name: 'Samuel Johnson', skill: 'Web Developer', avatar: 'https://images.unsplash.com/photo-1629683239923-38a4ea51143a?q=80&w=256&auto=format&fit=crop', location: 'Freetown', oivpTier: 1 },
];

const TESTIMONIALS_DATA = [
  {
    quote: "Finding a verified web developer was impossible before this. Salone Skills Connect made it simple and secure. We hired a fantastic developer in days.",
    name: "Foday Kamara",
    title: "Project Manager, TechVibe SL",
    avatar: "https://images.unsplash.com/photo-1537511446984-935f663eb1f4?q=80&w=256&auto=format&fit=crop"
  },
  {
    quote: "As a photographer, proving my skills was hard. The OIVP system gave me a verified portfolio that landed me three major contracts. It's a game-changer.",
    name: "Aminata Sesay",
    title: "Freelance Photographer",
    avatar: "https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?q=80&w=256&auto=format&fit=crop"
  },
  {
    quote: "The 'Client Endorsed' badge is pure gold. It immediately separates the serious professionals from the rest. Our hiring process is now 90% faster.",
    name: "John Davies",
    title: "HR Director, Creative Solutions",
    avatar: "https://images.unsplash.com/photo-1566753323558-f4e0952af115?q=80&w=256&auto=format&fit=crop"
  }
];

const FAQ_DATA = [
  {
    question: "What is the Open Innovation Verification Protocol (OIVP)?",
    answer: "The OIVP is our unique 3-tier system designed to build trust. Tier 0 verifies identity with a National ID. Tier 1 verifies work through portfolios or proof of skill. Tier 2 confirms credibility with client endorsements and testimonials."
  },
  {
    question: "Is this platform only for tech skills?",
    answer: "Not at all! We welcome all skilled youth, from digital professionals like coders and designers to vocational experts like mechanics, tailors, photographers, and bakers. Our mission is to empower the entire spectrum of Sierra Leone's talent."
  },
  {
    question: "How do I get the 'Client Endorsed' badge?",
    answer: "After completing a job for a client you connected with (on or off the platform), you can request a testimonial. Once the client submits a positive review confirming the successful completion of work, you earn the Tier 2 'Client Endorsed' badge, the highest level of trust."
  },
  {
    question: "Are there any fees for talent to join?",
    answer: "Joining Salone Skills Connect, creating a profile, and completing the verification process is completely free for skilled individuals. Our goal is to remove barriers to opportunity, not create them."
  }
];


// --- IN-PAGE COMPONENTS ---

const Header: React.FC<{ scrollToSection: (e: React.MouseEvent, id: string) => void }> = ({ scrollToSection }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'bg-gray-900/80 backdrop-blur-lg border-b border-gray-700/50' : 'bg-transparent'}`}>
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2" aria-label="Home">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-400">
              <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M2 7L12 12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M12 22V12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M22 7L12 12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M17 4.5L7 9.5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
            <span className="font-bold text-xl text-white">Salone Skills Connect</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <Link key={link.name} href={link.href} onClick={(e) => link.href.startsWith('#') && scrollToSection(e, link.href)} className="flex items-center text-sm font-medium text-gray-300 hover:text-blue-400 transition-colors">
                {link.icon}
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
           <Link href="/signin" className="flex items-center text-sm font-medium text-gray-300 hover:text-blue-400 transition-colors">
             <FaSignInAlt className="mr-2" />
             Sign In
           </Link>
           <Link href="/signup" className="flex items-center justify-center text-sm font-bold text-white bg-blue-600 rounded-md px-4 py-2 transition-all duration-300 ease-in-out hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30">
             <FaUserPlus className="mr-2" />
             Sign Up
           </Link>
        </div>
      </div>
    </header>
  );
};

const Hero: React.FC<{ scrollToSection: (id: string) => void }> = ({ scrollToSection }) => (
    <section id="hero" className="relative w-full h-screen flex flex-col justify-center items-center text-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center -z-20" style={{backgroundImage: "url('https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?q=80&w=2070&auto=format&fit=crop')"}}></div>
        <div className="absolute inset-0 bg-gray-950/80 -z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-950 -z-10"></div>

        <div className="container mx-auto px-4 flex flex-col items-center z-10 -mt-16">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-tight animate-fade-in-down">
            <span className="text-blue-400">Connect</span> with Sierra Leone's
            <br />
            Finest <span className="text-green-400">Verified</span> Talent
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-300 max-w-3xl animate-fade-in-up animation-delay-300">
            The trusted marketplace for Sierra Leone's skilled youth—from code to carpentry. We verify, you hire with confidence.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center items-center animate-fade-in-up animation-delay-500">
            <Link href="/signup" className="group relative inline-flex items-center justify-center px-8 py-3 text-lg font-bold text-white bg-blue-600 rounded-lg overflow-hidden transition-all duration-300 ease-in-out hover:bg-blue-700 w-64 h-14 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/20">
                <FaSearch className="mr-3 h-5 w-5" /> I'm looking for Talent
            </Link>
            <Link href="/signup" className="group relative inline-flex items-center justify-center px-8 py-3 text-lg font-bold text-white bg-green-600 rounded-lg overflow-hidden transition-all duration-300 ease-in-out hover:bg-green-700 w-64 h-14 hover:-translate-y-1 hover:shadow-xl hover:shadow-green-500/20">
                <FaBriefcase className="mr-3 h-5 w-5" /> I'm looking for Work
            </Link>
          </div>
        </div>

        <div className="absolute bottom-24 w-full animate-fade-in-up animation-delay-700">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white backdrop-blur-sm bg-white/5 rounded-lg p-6 max-w-4xl mx-auto">
                    {STATS_DATA.map((stat) => (
                        <div key={stat.value} className="flex flex-col items-center text-center md:flex-row md:text-left md:gap-4 md:items-start">
                            <p className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400">{stat.value}</p>
                            <p className="text-sm text-gray-300 mt-1 md:mt-2 max-w-[200px]">{stat.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        
        <div className="absolute bottom-10 animate-bounce">
          <button onClick={() => scrollToSection('problem')} aria-label="Scroll down">
              <FaChevronDown className="h-8 w-8 text-white/30 hover:text-white transition-colors" />
          </button>
        </div>
        <style>{`
          @keyframes fade-in-down { 
            0% { opacity: 0; transform: translateY(-20px) scale(0.95); filter: blur(3px); } 
            100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); } 
          }
          @keyframes fade-in-up { 
            0% { opacity: 0; transform: translateY(20px) scale(0.95); filter: blur(3px); } 
            100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); } 
          }
          .animate-fade-in-down { animation: fade-in-down 0.8s cubic-bezier(0.215, 0.610, 0.355, 1.000) forwards; opacity: 0; }
          .animate-fade-in-up { animation: fade-in-up 0.8s cubic-bezier(0.215, 0.610, 0.355, 1.000) forwards; opacity: 0; }
          .animation-delay-300 { animation-delay: 0.3s; }
          .animation-delay-500 { animation-delay: 0.5s; }
          .animation-delay-700 { animation-delay: 0.7s; }
        `}</style>
    </section>
);

const ProblemSolution: React.FC = () => (
    <section id="problem" className="py-24 bg-gray-950">
        <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-sm font-bold uppercase tracking-widest text-blue-400">The Challenge</h2>
            <p className="mt-3 text-4xl md:text-5xl font-extrabold tracking-tight text-white">Bridging the Trust Gap in Sierra Leone</p>
            <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-400">
                High youth unemployment meets a critical trust gap. Employers struggle to verify skills, and talented youth lack a platform to showcase proven work. We fix this.
            </p>
            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 transition-all duration-300 hover:border-red-500/50 hover:shadow-2xl hover:shadow-red-500/10">
                    <div className="flex items-center gap-4">
                        <FaTimesCircle className="h-8 w-8 text-red-400 flex-shrink-0" />
                        <h3 className="text-2xl font-bold text-white">The Problem</h3>
                    </div>
                    <p className="mt-4 text-gray-400">Employers find it risky to validate skills from a CV alone. How do you know a "web developer" can code, or a "baker" is reliable? This uncertainty stifles opportunities.</p>
                </div>
                <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 transition-all duration-300 hover:border-green-500/50 hover:shadow-2xl hover:shadow-green-500/10">
                    <div className="flex items-center gap-4">
                        <FaCheckCircle className="h-8 w-8 text-green-400 flex-shrink-0" />
                        <h3 className="text-2xl font-bold text-white">Our Solution: The OIVP</h3>
                    </div>
                    <p className="mt-4 text-gray-400">Our <span className="font-bold text-green-300">Open Innovation Verification Protocol (OIVP)</span> is a 3-tier system that proves identity, verifies work, and secures endorsements, creating a marketplace built on trust.</p>
                </div>
            </div>
        </div>
    </section>
);

const FeaturedSkills: React.FC = () => (
    <section id="skills" className="py-24 bg-gray-950/70">
        <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-sm font-bold uppercase tracking-widest text-blue-400">Limitless Potential</h2>
            <p className="mt-3 text-4xl md:text-5xl font-extrabold tracking-tight text-white">Empowering a Spectrum of Skills</p>
            <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-400">
                We empower all of Sierra Leone's skilled youth, from digital experts to vocational professionals. If you have a skill, you have a future here.
            </p>
            <div className="mt-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {FEATURED_SKILLS.map((skill) => (
                    <div key={skill.name} className={`group flex flex-col items-center justify-center gap-4 p-6 bg-gray-900/50 rounded-xl border border-gray-800 transition-all duration-300 hover:scale-105 hover:border-${skill.color}-500/50 hover:shadow-lg hover:shadow-${skill.color}-500/40 cursor-pointer`}>
                        <div className="transform transition-transform duration-300 group-hover:-translate-y-1">
                            {skill.icon}
                        </div>
                        <p className="font-semibold text-white text-center">{skill.name}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

const StepCard: React.FC<{ icon: React.ReactElement<any>, title: string, description: string, isLast: boolean, color: 'blue' | 'green' }> = ({ icon, title, description, isLast, color }) => (
    <li className="relative flex items-start gap-6 pb-10">
        {!isLast && <div className={`absolute left-5 top-5 h-full w-0.5 bg-gradient-to-b from-${color}-500/50 via-${color}-500/50 to-transparent`} />}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-${color}-500/10 border border-${color}-500/30 text-${color}-400 flex items-center justify-center z-10`}>
            {React.cloneElement(icon, { className: "w-5 h-5" })}
        </div>
        <div>
            <h4 className="font-bold text-xl text-white">{title}</h4>
            <p className="mt-1 text-gray-400">{description}</p>
        </div>
    </li>
);

const HowItWorks: React.FC = () => (
    <section id="how-it-works" className="py-24 bg-gray-950">
        <div className="container mx-auto px-4 md:px-6">
            <div className="text-center">
                <h2 className="text-sm font-bold uppercase tracking-widest text-blue-400">Simple & Powerful</h2>
                <p className="mt-3 text-4xl md:text-5xl font-extrabold tracking-tight text-white">A Clear Path to Opportunity</p>
                <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-400">
                    A simple process to build trust and connect talent with opportunity, whether you're looking for work or searching for the perfect candidate.
                </p>
            </div>
            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-16">
                <div>
                    <h3 className="text-3xl font-bold mb-8 text-center text-blue-300">For Talent</h3>
                    <ul className="space-y-4">
                       {talentSteps.map((step, index) => (
                           <StepCard key={step.title} icon={step.icon} title={step.title} description={step.description} isLast={index === talentSteps.length - 1} color="blue" />
                       ))}
                    </ul>
                </div>
                <div>
                    <h3 className="text-3xl font-bold mb-8 text-center text-green-300">For Managers</h3>
                     <ul className="space-y-4">
                        {managerSteps.map((step, index) => (
                           <StepCard key={step.title} icon={step.icon} title={step.title} description={step.description} isLast={index === managerSteps.length - 1} color="green" />
                       ))}
                     </ul>
                </div>
            </div>
        </div>
    </section>
);

const OIVPBadge: React.FC<{ tier: number }> = ({ tier }) => {
  const badges = [
    { icon: <FaIdBadge />, text: 'Identity Verified', color: 'text-gray-400', level: 'OIVP Tier 0' },
    { icon: <FaCertificate />, text: 'Work Verified', color: 'text-blue-400', level: 'OIVP Tier 1' },
    { icon: <FaStar />, text: 'Client Endorsed', color: 'text-yellow-400', level: 'OIVP Tier 2' },
  ];

  if (tier < 0 || tier >= badges.length) return null;

  const badge = badges[tier];

  return (
    <div className={`flex items-center gap-2 text-sm ${badge.color}`} title={badge.level}>
        {React.cloneElement(badge.icon, { className: 'w-4 h-4' })}
        <span className="font-semibold">{badge.text}</span>
    </div>
  );
};


const ProductDemo: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTalent, setFilteredTalent] = useState(TALENT_DATA);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm.trim() === '') {
        setFilteredTalent(TALENT_DATA);
      } else {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filtered = TALENT_DATA.filter(talent =>
          talent.name.toLowerCase().includes(lowercasedFilter) ||
          talent.skill.toLowerCase().includes(lowercasedFilter)
        );
        setFilteredTalent(filtered);
      }
    }, 300); // Debounce search
    return () => clearTimeout(handler);
  }, [searchTerm]);

  return (
    <section id="demo" className="py-24 bg-gray-950/70">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center">
          <h2 className="text-sm font-bold uppercase tracking-widest text-blue-400">Interactive Demo</h2>
          <p className="mt-3 text-4xl md:text-5xl font-extrabold tracking-tight text-white">See Our Talent in Action</p>
          <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-400">
            Get a feel for our platform. Use the search bar to filter talent by name or skill and see how our OIVP trust system works.
          </p>
        </div>
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search for 'Web Developer', 'Photographer'..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTalent.map((talent) => (
            <div key={talent.name} className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col items-center text-center transition-all duration-300 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2">
              <img src={talent.avatar} alt={talent.name} className="w-24 h-24 rounded-full mb-4 border-4 border-gray-700 object-cover" />
              <h3 className="text-xl font-bold text-white">{talent.name}</h3>
              <p className="text-blue-300 font-medium">{talent.skill}</p>
              <p className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                <FaMapMarkerAlt className="w-3 h-3"/> {talent.location}
              </p>
              <div className="mt-4 pt-4 border-t border-gray-800 w-full flex justify-center">
                <OIVPBadge tier={talent.oivpTier} />
              </div>
            </div>
          ))}
           {filteredTalent.length === 0 && (
             <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12">
                <p className="text-gray-400 text-lg">No talent found matching your search.</p>
             </div>
           )}
        </div>
      </div>
    </section>
  );
};


const Testimonials: React.FC = () => (
    <section id="testimonials" className="py-24 bg-gray-950/70">
        <div className="container mx-auto px-4 md:px-6">
            <div className="text-center">
                <h2 className="text-sm font-bold uppercase tracking-widest text-blue-400">Social Proof</h2>
                <p className="mt-3 text-4xl md:text-5xl font-extrabold tracking-tight text-white">Trusted by Leaders</p>
                <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-400">
                    Hear from managers and talent who have successfully used our platform to build their teams and careers.
                </p>
            </div>
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                {TESTIMONIALS_DATA.map((testimonial, index) => (
                    <div key={index} className="bg-gray-900 p-8 rounded-xl border border-gray-800 flex flex-col transition-all duration-300 hover:-translate-y-2 hover:border-blue-500/50">
                        <FaQuoteLeft className="w-8 h-8 text-blue-400 mb-4" />
                        <p className="text-gray-300 flex-grow">{testimonial.quote}</p>
                        <div className="flex items-center mt-6 pt-6 border-t border-gray-800">
                            <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full mr-4 object-cover" />
                            <div>
                                <p className="font-bold text-white">{testimonial.name}</p>
                                <p className="text-sm text-gray-400">{testimonial.title}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

const FAQItem: React.FC<{ q: string; a: string; }> = ({ q, a }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-gray-800">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex justify-between items-center w-full py-5 text-left"
                aria-expanded={isOpen}
            >
                <span className="text-lg font-medium text-white">{q}</span>
                {isOpen ? <FaMinus className="w-5 h-5 text-blue-400" /> : <FaPlus className="w-5 h-5 text-gray-400" />}
            </button>
            <div className={`grid overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <p className="pb-5 pr-10 text-gray-400">{a}</p>
                </div>
            </div>
        </div>
    );
};

const FAQ: React.FC = () => (
    <section id="faq" className="py-24 bg-gray-950">
        <div className="container mx-auto px-4 md:px-6">
            <div className="text-center">
                <h2 className="text-sm font-bold uppercase tracking-widest text-blue-400">Have Questions?</h2>
                <p className="mt-3 text-4xl md:text-5xl font-extrabold tracking-tight text-white">We Have Answers</p>
                <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-400">
                    Find answers to the most common questions about our platform, verification process, and how to get started.
                </p>
            </div>
            <div className="mt-16 max-w-3xl mx-auto">
                {FAQ_DATA.map((item, index) => (
                    <FAQItem key={index} q={item.question} a={item.answer} />
                ))}
            </div>
        </div>
    </section>
);

const CallToAction: React.FC = () => (
  <section id="cta" className="py-24 bg-gray-950/70">
    <div className="container mx-auto px-4 md:px-6">
      <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-xl p-12 text-center relative overflow-hidden">
         <div className="absolute inset-0 bg-black/20 mix-blend-multiply"></div>
         <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">Ready to Join?</h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-blue-100">
                Whether you're looking for verified talent or seeking your next big opportunity, your journey starts here. Create your account and unlock your potential today.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/signup" className="group relative inline-flex items-center justify-center px-8 py-3 text-lg font-bold text-blue-600 bg-white rounded-lg overflow-hidden transition-all duration-300 ease-in-out hover:bg-gray-200 w-full sm:w-auto h-14 hover:-translate-y-1 hover:shadow-xl">
                    <FaSearch className="mr-3 h-5 w-5" /> Find Talent Now
                </Link>
                <Link href="/signup" className="group relative inline-flex items-center justify-center px-8 py-3 text-lg font-bold text-white bg-gray-900/50 rounded-lg overflow-hidden transition-all duration-300 ease-in-out hover:bg-gray-900/80 w-full sm:w-auto h-14 hover:-translate-y-1 hover:shadow-xl">
                    <FaBriefcase className="mr-3 h-5 w-5" /> Start Earning
                </Link>
            </div>
        </div>
      </div>
    </div>
  </section>
);

const Footer: React.FC = () => (
  <footer className="bg-gray-950 border-t border-gray-800">
    <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
                <Link href="/" className="flex items-center gap-2">
                     <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-400">
                        <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                        <path d="M2 7L12 12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                        <path d="M12 22V12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                        <path d="M22 7L12 12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                        <path d="M17 4.5L7 9.5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                    </svg>
                    <h3 className="font-bold text-xl text-white">Salone Skills Connect</h3>
                </Link>
                <p className="mt-4 text-sm text-gray-400 max-w-sm">Building a trusted skills economy for Sierra Leone's youth by verifying talent and creating opportunities.</p>
            </div>
        </div>
        <div className="mt-12 border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>TRON: Aaron Peter Coker © 2025 - Professionally Redesigned</p>
        </div>
    </div>
  </footer>
);


// --- Main App Page Component for Next.js ---
export default function LandingPage() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Effect to show/hide the scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- Scroll Functions ---
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const scrollToSection = (event: React.MouseEvent, id: string) => {
    if (id.startsWith('#')) {
      event.preventDefault();
      const sectionId = id.substring(1);
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-gray-200 font-sans antialiased overflow-x-hidden">
      <Header scrollToSection={scrollToSection} />
      <main className="flex-grow">
        <Hero scrollToSection={(id) => scrollToSection({ preventDefault: () => {} } as React.MouseEvent, `#${id}`)} />
        <ProblemSolution />
        <FeaturedSkills />
        <HowItWorks />
        <ProductDemo />
        <Testimonials />
        <FAQ />
        <CallToAction />
      </main>
      <Footer />

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 z-50"
          aria-label="Scroll to top"
        >
          <FaArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
