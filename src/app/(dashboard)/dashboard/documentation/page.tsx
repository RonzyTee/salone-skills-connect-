
'use client';

// FIX: Corrected import statement for React and its hooks.
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FaBook,
  FaBullseye,
  FaUsers,
  FaDesktop,
  FaTachometerAlt,
  FaFolderPlus,
  FaRocket,
  FaQuestionCircle,
  FaUserTie,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaArrowUp,
  FaArrowDown,
  FaHome,
  FaStore,
  FaSearch,
} from 'react-icons/fa';

// --- NEW NAVIGATION COMPONENTS ---

const ActionSidebar: React.FC = () => {
  const actions = [
    { href: '/', label: 'Go Home', icon: <FaHome /> },
    { href: '/talent', label: 'View Talents', icon: <FaUsers /> },
    { href: '/dashboard/marketplace', label: 'Marketplace', icon: <FaStore /> },
    { href: '/dashboard/jobs', label: 'Find Jobs', icon: <FaSearch /> },
  ];

  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
        Quick Actions
      </h3>
      <div className="space-y-3">
        {actions.map(action => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-3 w-full p-3 rounded-lg text-sm font-medium bg-gray-800/50 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            {React.cloneElement(action.icon as React.ReactElement, { className: "h-4 w-4 text-blue-400" })}
            <span>{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};


const TableOfContents: React.FC<{
  sections: { id: string; title: string }[];
  activeSection: string;
}> = ({ sections, activeSection }) => {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
        On this page
      </h3>
      <ul className="space-y-2">
        {sections.map((section) => (
          <li key={section.id}>
            <button
              onClick={() => scrollTo(section.id)}
              className={`w-full text-left text-sm transition-colors pl-2 border-l-2 ${
                activeSection === section.id
                  ? 'font-bold text-blue-400 border-blue-400'
                  : 'text-gray-400 hover:text-white border-transparent hover:border-gray-600'
              }`}
            >
              {section.title}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

const ScrollControls: React.FC = () => {
  // FIX: Replaced `aistudio.useState` with the standard `useState` hook.
  const [isVisible, setIsVisible] = useState(false);

  // FIX: Replaced `aistudio.useEffect` with the standard `useEffect` hook.
  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 300);
    };
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3">
      <button
        onClick={scrollToTop}
        className="bg-blue-600/80 hover:bg-blue-500 text-white p-3 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 ease-in-out transform hover:scale-110 focus:outline-none"
        aria-label="Scroll to top"
      >
        <FaArrowUp className="h-5 w-5" />
      </button>
      <button
        onClick={scrollToBottom}
        className="bg-gray-700/80 hover:bg-gray-600 text-white p-3 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 ease-in-out transform hover:scale-110 focus:outline-none"
        aria-label="Scroll to bottom"
      >
        <FaArrowDown className="h-5 w-5" />
      </button>
    </div>
  );
};

// --- CORE PAGE COMPONENTS ---

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string }> = ({
  icon,
  title,
}) => (
  <div className="flex items-center gap-4 mb-6">
    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
      {icon}
    </div>
    <h2 className="text-3xl font-bold text-white tracking-tight">{title}</h2>
  </div>
);

const DocListItem: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <li className="mb-2 pl-4 border-l-2 border-gray-700">{children}</li>;

// --- MAIN DOCUMENTATION PAGE ---

export default function DocumentationPage() {
  // FIX: Replaced `aistudio.useState` with the standard `useState` hook.
  const [activeSection, setActiveSection] = useState('');

  const sections = [
    { id: 'overview', title: '1. Platform Overview' },
    { id: 'landing-page', title: '2. Public-Facing Landing Page' },
    { id: 'dashboard', title: '3. Youth Dashboard' },
    { id: 'portfolio', title: '4. Portfolio & Project Management' },
    { id: 'features', title: '5. Salone Skills Connect Core Features' },
    { id: 'roadmap', title: '6. Future Features & Strategic Road Map' },
  ];

  // FIX: Replaced `aistudio.useEffect` with the standard `useEffect` hook.
  useEffect(() => {
    const handleScroll = () => {
      let currentSectionId = '';
      const sectionElements = sections.map(s => document.getElementById(s.id)).filter(Boolean);

      for (const element of sectionElements) {
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top >= 0 && rect.top <= window.innerHeight / 2) {
            currentSectionId = element.id;
            break;
          }
        }
      }

      if (!currentSectionId && sectionElements.length > 0) {
        let closest = { id: '', distance: Infinity };
        for (const element of sectionElements) {
            if (element) {
                const distance = Math.abs(element.getBoundingClientRect().top);
                if (distance < closest.distance) {
                    closest = { id: element.id, distance };
                }
            }
        }
        currentSectionId = closest.id;
      }
      setActiveSection(currentSectionId);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-gray-950 text-gray-300 font-sans min-h-screen p-4 sm:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-x-12">
        <div className="lg:col-span-3">
          <header className="text-center mb-16">
            <FaBook className="mx-auto h-16 w-16 text-blue-400 mb-4" />
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              Salone Skills Connect Documentation
            </h1>
            <p className="mt-4 text-lg text-gray-400 max-w-3xl mx-auto">
              Welcome to the Salone Skills Connect documentation. This guide provides an in-depth overview of the platform's purpose, comprehensive features, diverse user experiences, and foundational components.
            </p>
          </header>

          <article className="space-y-16 doc-content">
            <section id="overview">
              <SectionTitle
                icon={<FaBullseye className="w-6 h-6" />}
                title="1. Platform Overview: Building a Holistic Skills Ecosystem"
              />
              <div className="space-y-4 text-gray-400">
                <p>
                  Salone Skills Connect is more than a talent marketplace; it's a dynamic ecosystem engineered to bridge the critical "trust gap" in Sierra Leone's employment landscape while fostering continuous learning, collaboration, and innovation. It serves as the definitive hub where skilled youth can not only showcase their meticulously verified work but also grow their careers through mentorship, community engagement, and entrepreneurial opportunities. Simultaneously, it empowers employers to confidently discover and hire talent with proven abilities across a multitude of disciplines.
                </p>
                <h3 className="text-2xl font-semibold text-white pt-4">
                  1.1 Core Mission: Empowering Futures Through Trust and Opportunity
                </h3>
                <p>
                  Our unwavering mission is to build a vibrant, trusted, and sustainable skills economy for Sierra Leone's youth. We achieve this by providing a robust platform for verifiable skill demonstration, fostering career development through holistic support, and enabling seamless, confident talent discovery for employers and clients.
                </p>
                <h3 className="text-2xl font-semibold text-white pt-4">
                  1.2 Target Audience: The Pillars of Our Community
                </h3>
                <ul className="space-y-4">
                  <DocListItem>
                    <strong className="text-gray-200">
                      <FaUserGraduate className="inline mr-2" /> Talent (Youth):
                    </strong>{' '}
                    Aspiring and established individuals seeking to build credible, verified portfolios, continuously upskill, access mentorship, engage with a supportive community, and monetize their ideas or skills.
                  </DocListItem>
                  <DocListItem>
                    <strong className="text-gray-200">
                      <FaUserTie className="inline mr-2" /> Managers/Clients (Employers/Organizations):
                    </strong>{' '}
                     Businesses, NGOs, and individual clients committed to sourcing and hiring verified talent with confidence, thereby streamlining recruitment, minimizing risk, and ensuring high-quality project delivery.
                    <div className="mt-4 pl-6 border-l-2 border-gray-700 text-gray-400 space-y-3">
                      <p className="italic">
                       The core purpose of the Manager role is to serve as the "employer" or "client"—the individual or company looking to hire skilled talent.
                      </p>
                      <h4 className="font-semibold text-gray-200 pt-2">
                        Key Functions of a Manager:
                      </h4>
                      <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Sign Up:</strong> A new user can register and explicitly select the "Manager" role.</li>
                        <li><strong>Browse and Search Talent:</strong> The manager has access to a dashboard where they can see a searchable list of all youth profiles on the platform.</li>
                        <li><strong>Filter by Skill and Trust:</strong> This is a key function. A manager can filter the talent pool to find specific skills (e.g., "Baking," "Graphic Design," "Web Developer").</li>
                        <li><strong>Verify Trust Levels (OIVP):</strong> Most importantly, the manager can filter talent based on your Open Innovation Verification Protocol (OIVP) to find candidates who are: OIVP Tier 0 (Identity Confirmed), OIVP Tier 1 (Proof of Work), OIVP Tier 2 (Client Endorsed).</li>
                        <li><strong>View Verified Portfolios:</strong> The manager can click into a youth's profile to view their detailed portfolio, including photo galleries, videos of their work (for vocational skills), links to websites (for tech skills), and the trusted endorsements from previous clients.</li>
                        <li><strong>Hire with Confidence:</strong> The ultimate function of the manager is to use this verified information to confidently find and connect with reliable, proven talent, bridging the "trust gap" that you identified.</li>
                      </ul>
                    </div>
                  </DocListItem>
                  <DocListItem>
                    <strong className="text-gray-200">
                      <FaChalkboardTeacher className="inline mr-2" /> Mentors &
                      Facilitators:
                    </strong>{' '}
                    Experienced professionals and organizations eager to contribute to youth development through guidance, workshops, and knowledge sharing.
                  </DocListItem>
                </ul>
              </div>
            </section>

            <section id="landing-page">
              <SectionTitle
                icon={<FaDesktop className="w-6 h-6" />}
                title="2. Public-Facing Landing Page: The Gateway to Opportunity"
              />
               <p className="text-gray-400 mb-4">
                 The landing page (<code>/</code>) is the platform's captivating public face, meticulously crafted to attract new users and vividly articulate the profound value proposition of Salone Skills Connect. It's the first step on a journey toward empowerment and trusted connections.
              </p>
              <h3 className="text-2xl font-semibold text-white pt-4 mb-4">
                2.1 Key Sections: A Persuasive Narrative
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-400">
                <li><strong>Header:</strong> A responsive, persistently visible navigation bar proudly featuring the "Salone Skills Connect" logo. It provides intuitive links to core sections like "How It Works," "Community," "Mentorship," and direct access to the <code>/signup</code> page.</li>
                <li><strong>Hero Section:</strong> A bold headline: "Connect with Sierra Leone's Finest Verified Talent. Build Your Future." It clearly articulates the platform's essence and has prominent "I'm looking for Talent" and "I'm looking for Work" buttons.</li>
                <li><strong>Social Proof:</strong> Dynamically displays compelling statistics, such as "200+ skilled talents," "50+ mentors," and "100+ successful projects," to instantly build credibility.</li>
                <li><strong>Problem/Solution Section:</strong> Deeply explains the "trust gap" and introduces the Open Innovation Verification Protocol (OIVP) as the solution.</li>
                <li><strong>Featured Skills Section:</strong> A vibrant showcase of the vast array of talents on the platform, from digital to vocational skills.</li>
                <li><strong>How It Works Section:</strong> Provides clear, step-by-step user journeys for both Talent and Managers.</li>
                <li><strong>Footer:</strong> A standard footer with essential quick links, legal information, and a summary of the platform's mission.</li>
              </ul>
            </section>

            <section id="dashboard">
               <SectionTitle
                icon={<FaTachometerAlt className="w-6 h-6" />}
                title="3. Youth Dashboard: The Command Center for Career Growth"
              />
              <p className="text-gray-400 mb-4">
               The youth dashboard serves as the personalized, dynamic command center for logged-in "youth" users. It’s an integrated hub for talent discovery, robust portfolio management, real-time communication, and accessing exclusive growth opportunities. Designed with a responsive two-column layout for an optimal desktop experience, it ensures critical information and tools are always at hand.
              </p>
              <h3 className="text-2xl font-semibold text-white pt-4 mb-4">
                3.1 Main Content Area (Wide, Left Column): Discovery & Interaction
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-400">
                <li><strong>Personalized Welcome Header:</strong> A warm greeting displaying follower count and recent notifications.</li>
                <li><strong>Advanced Search & Filter Block:</strong> A universal search bar with dynamic filters and an intelligent quick-select skill dropdown.</li>
                <li><strong>Featured Talent & Projects Card:</strong> A compelling, horizontally scrolling gallery with toggles for "Tech vs. Vocational," "Verified Only," etc.</li>
                <li><strong>Organizations on Salone Skills Connect Card:</strong> A dynamic vertical list featuring profiles of "manager" (organization) user types.</li>
                <li><strong>"Sell Your Ideas" Showcase:</strong> A prominent section encouraging entrepreneurial spirit, displaying innovative concepts from youth users.</li>
                <li><strong>Upcoming Events & Workshops Card:</strong> A real-time feed of community events and skill-building workshops.</li>
              </ul>
              <h3 className="text-2xl font-semibold text-white pt-4 mb-4">
                3.2 Sidebar (Narrow, Right Column): Personal Insights & Quick Access
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-400">
                <li><strong>Recent Messages Card:</strong> A real-time communication hub with unread indicators, leveraging Firestore's <code>onSnapshot</code> for instant updates.</li>
                <li><strong>My Verification Status Card:</strong> Visually tracks the user's progress through the critical 3-tier OIVP system.</li>
                <li><strong>My Portfolio Snapshot Card:</strong> Provides at-a-glance KPIs for projects and endorsements with a "Manage My Portfolio" button.</li>
                <li><strong>Mentorship Opportunities Card:</strong> Highlights available mentors relevant to the user's skills.</li>
              </ul>
              <h3 className="text-2xl font-semibold text-white pt-4 mb-4">3.3 Core Dashboard Functionalities</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-400">
                <li><strong>Robust Authentication:</strong> Powered by <code>useAuth()</code> for secure sessions and role-based access.</li>
                <li><strong>Real-time Database Interaction (Firestore):</strong> Uses <code>useEffect</code> hooks for initial data fetch and <code>onSnapshot</code> listeners for live updates.</li>
                <li><strong>Client-Side Filtering:</strong> All talent and project lists are filtered instantaneously in the browser for a highly responsive UX.</li>
                <li><strong>Modern UI Components:</strong> Built with a consistent, accessible component library (e.g., Shadcn/ui).</li>
              </ul>
            </section>
            
            <section id="portfolio">
              <SectionTitle
                icon={<FaFolderPlus className="w-6 h-6" />}
                title="4. Portfolio & Project Management: Building Your Credibility"
              />
              <p className="text-gray-400 mb-4">
                The portfolio system is the heart of a youth user's profile, enabling them to meticulously document their achievements and undergo the OIVP verification process.
              </p>
              <h3 className="text-2xl font-semibold text-white pt-4 mb-4">
                4.1 Add New Project Page (<code>/dashboard/portfolio/add</code>)
              </h3>
              <p className="text-gray-400 mb-2">A comprehensive, multi-step form for "youth" users to upload projects, with an intuitive two-column layout:</p>
              <ul className="list-disc pl-5 space-y-2 text-gray-400">
                <li><strong>Left Column (Input Form):</strong> Logically broken down into steps: Core Details, Skills & Disciplines, and Project Visuals & Links.</li>
                <li><strong>Conditional Fields Logic:</strong> A powerful dynamic system ensures only relevant fields appear (e.g., GitHub URL for "Tech," Video/Audio URL for "Performance").</li>
                <li><strong>Right Column (Live Preview):</strong> A dynamically updating card that offers a real-time visualization of the project.</li>
                <li><strong>Robust Form Submission (<code>handleSubmit</code>):</strong> Includes client-side validation, data serialization into a <code>FormData</code> object, and API integration for secure submission.</li>
              </ul>

              <h3 className="text-2xl font-semibold text-white pt-4 mb-4">
                4.2 Edit Project Page (<code>/portfolio/edit/[projectId]</code>)
              </h3>
              <p className="text-gray-400 mb-2">This dynamic page empowers users to modify existing projects, featuring specialized image handling:</p>
               <ul className="list-disc pl-5 space-y-2 text-gray-400">
                <li><strong>Efficient Data Fetching:</strong> Uses <code>useParams()</code> and <code>useEffect</code> to fetch the specific project document from Firestore.</li>
                <li><strong>Critical Security Check:</strong> Ensures the logged-in user is the authorized owner before allowing edits.</li>
                <li><strong>Advanced Image Handling:</strong> A client-side approach using <code>FileReader</code> to convert images to Base64 strings for preview and update, including a size check to prevent oversized documents.</li>
                <li><strong>Optimized Update Logic (<code>handleUpdate</code>):</strong> Leverages <code>updateDoc</code> to atomically save all modified data directly back to Firestore.</li>
              </ul>
            </section>

            <section id="features">
              <SectionTitle
                icon={<FaUsers className="w-6 h-6" />}
                title="5. Salone Skills Connect Core Features: Beyond the Marketplace"
              />
              <p className="text-gray-400 mb-4">
                Salone Skills Connect is enriched with features designed to support holistic career development, community building, and entrepreneurial endeavors.
              </p>
              <div className="space-y-4 text-gray-400">
                <p><strong>Sell Your Ideas:</strong> Empowers youth to monetize their innovative concepts, digital products, or services directly through the platform.</p>
                <p><strong>Mentorship Program:</strong> Connects aspiring youth with experienced professionals for guidance, skill development, and career advice.</p>
                <p><strong>Events & Workshops:</strong> A centralized hub for promoting skill-building workshops, industry events, and community gatherings.</p>
                <p><strong>Community Forum:</strong> A dedicated space for users to connect, share knowledge, ask questions, and collaborate.</p>
                <p><strong>Resume Builder:</strong> Provides a seamless tool for youth users to generate professional resumes directly from their verified Salone Skills Connect profile data.</p>
              </div>
            </section>

            <section id="roadmap">
               <SectionTitle
                icon={<FaRocket className="w-6 h-6" />}
                title="6. Future Features & Strategic Road Map"
              />
              <p className="text-gray-400 mb-4">
                Salone Skills Connect is committed to continuous innovation and expansion to better serve its growing community. Our strategic road map includes:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-400">
                <li><strong>Integrated Job Board:</strong> Fully functional job listing and application system, connecting verified talent directly with opportunities.</li>
                <li><strong>Advanced Project Marketplace:</strong> Enhanced functionalities for buying and selling digital products, services, and collaborative project ideas.</li>
                <li><strong>On-Platform Skill Assessments:</strong> Development of tools for both technical and vocational skills to provide additional, objective verification and skill validation.</li>
                <li><strong>Enhanced Direct Messaging & Collaboration Tools:</strong> More robust features for team collaboration, project management within chats, and secure file sharing.</li>
                <li><strong>Localized Content & Resources:</strong> Expanding events, workshops, and mentorship opportunities tailored to specific regional needs and languages within Sierra Leone.</li>
              </ul>
            </section>
          </article>
        </div>
        <aside className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24 h-fit space-y-12">
            <ActionSidebar />
            <TableOfContents sections={sections} activeSection={activeSection} />
          </div>
        </aside>
      </div>
      <ScrollControls />
      <style jsx>{`
        .doc-content h3 {
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .doc-content p {
          line-height: 1.75;
        }
      `}</style>
    </div>
  );
}
