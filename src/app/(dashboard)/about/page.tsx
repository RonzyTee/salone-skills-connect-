
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FaArrowRight,
  FaBriefcase,
  FaChevronDown,
  FaChevronUp,
  FaSearch,
  FaUserCheck,
  FaFolderOpen,
  FaAward,
  FaTimesCircle,
  FaCheckCircle,
} from 'react-icons/fa';

// --- IN-PAGE COMPONENTS ---

// FIX: Define FAQItem as a React.FC to correctly type props and handle React-specific props like 'key'.
const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-gray-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left py-5 px-6 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75"
      >
        <h3 className="text-lg font-medium text-white">{question}</h3>
        {isOpen ? (
          <FaChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <FaChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-5 text-gray-400">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
};

// --- MAIN ABOUT PAGE COMPONENT ---
export default function AboutPage() {
  const faqData = {
    general: [
      {
        q: 'What is Salone Skills Connect?',
        a: 'It is a pioneering digital platform designed to bridge the trust gap between Sierra Leone\'s skilled youth and potential employers. We provide a space for talent to build verified portfolios and for employers to hire with confidence.',
      },
      {
        q: 'Who is behind this platform?',
        a: 'Salone Skills Connect was founded by Aaron Peter Coker with a mission to foster economic opportunity, build trust, and unlock the full potential of Sierra Leone\'s dynamic youth.',
      },
    ],
    forTalent: [
      {
        q: 'How do I get my skills verified?',
        a: 'You can get verified through our three-tier Open Innovation Verification Protocol (OIVP). It starts with confirming your identity (Tier 0), then providing proof of your work like photos or code (Tier 1), and finally, getting endorsed by a real client (Tier 2).',
      },
      {
        q: 'What kind of skills can I showcase?',
        a: 'Our platform supports a full spectrum of skills! This includes digital skills like web development, creative skills like graphic design, and vocational skills like baking, carpentry, tailoring, and mechanics.',
      },
      {
        q: 'Is it free to join as a talent?',
        a: 'Yes, creating a profile, building your portfolio, and showcasing your verified work to potential employers is completely free for skilled youth.',
      },
    ],
    forEmployers: [
      {
        q: 'Why should I hire through Salone Skills Connect?',
        a: 'Hiring through our platform dramatically reduces your risk. Our OIVP system means you are hiring talent whose identity, skills, and client satisfaction have been objectively verified, saving you time and ensuring quality.',
      },
      {
        q: 'How do I know a project or skill is legitimate?',
        a: 'Look for the OIVP badges on a talent\'s profile. The "Proof of Work" (Tier 1) badge shows they have provided tangible evidence of their skill, and the "Client Endorsed" (Tier 2) badge is the highest level of trust, indicating a positive review from a past client.',
      },
      {
        q: 'How do I contact a talent I\'m interested in?',
        a: 'Once you find a talent you\'re interested in, you can use our secure, integrated messaging system to connect with them directly, discuss project details, and negotiate terms.',
      },
    ],
  };

  return (
    <div className="bg-gray-950 text-white font-sans">
      {/* Hero Section */}
      <section className="relative py-32 bg-gray-900 text-center">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=2070&auto=format&fit=crop')",
          }}
        ></div>
        <div className="relative max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
            Empowering Sierra Leone's Youth,
            <span className="block text-blue-400 mt-2">
              Building a Trusted Future.
            </span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-300">
            We are revolutionizing the employment landscape by bridging the
            critical trust gap between talented youth and the employers who need
            them.
          </p>
        </div>
      </section>

      {/* The Challenge & Solution Section */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="bg-gray-900 p-8 rounded-xl border border-red-500/30">
            <div className="flex items-center gap-4">
              <FaTimesCircle className="h-10 w-10 text-red-400 flex-shrink-0" />
              <h2 className="text-3xl font-bold">The Challenge We Address</h2>
            </div>
            <p className="mt-4 text-gray-400">
              High youth unemployment meets a pervasive lack of trust. Talented
              youth struggle to prove their skills, and employers find it risky
              to hire without verifiable proof. This uncertainty stifles
              opportunity for everyone.
            </p>
          </div>
          <div className="bg-gray-900 p-8 rounded-xl border border-green-500/30">
            <div className="flex items-center gap-4">
              <FaCheckCircle className="h-10 w-10 text-green-400 flex-shrink-0" />
              <h2 className="text-3xl font-bold">Our Transformative Solution</h2>
            </div>
            <p className="mt-4 text-gray-400">
              We provide a verified talent marketplace where skills are not just
              listed, but proven. Through our unique OIVP system, we create a
              transparent ecosystem where employers can hire with absolute
              confidence.
            </p>
          </div>
        </div>
      </section>

      {/* OIVP - How It Works Section */}
      <section className="py-24 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-sm font-bold uppercase tracking-widest text-blue-400">
            Our Core Innovation
          </h2>
          <p className="mt-3 text-4xl md:text-5xl font-extrabold tracking-tight">
            The Open Innovation Verification Protocol (OIVP)
          </p>
          <p className="mt-6 text-lg text-gray-400">
            The OIVP is the engine that drives trust on our platform. It’s a
            robust, three-tier protocol designed to establish genuine
            credibility for every skill.
          </p>
        </div>
        <div className="max-w-2xl mx-auto mt-16 px-4">
          <div className="relative">
            {/* The vertical line */}
            <div className="absolute left-6 top-6 h-full w-0.5 bg-gray-800"></div>

            <div className="relative flex flex-col gap-12">
              {/* Tier 0 */}
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center z-10">
                  <FaUserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">
                    Tier 0: Identity Confirmed
                  </h3>
                  <p className="mt-1 text-gray-400">
                    We establish the foundational truth: the talent is a real
                    person. Every user verifies their identity by uploading
                    their National ID, anchoring their profile in reality.
                  </p>
                </div>
              </div>
              {/* Tier 1 */}
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center z-10">
                  <FaFolderOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Tier 1: Proof of Work</h3>
                  <p className="mt-1 text-gray-400">
                    We verify that the talent has tangible proof of their skill.
                    For digital skills, we check live sites or code. For
                    vocational skills, talent uploads rich media portfolios
                    with photos and videos of their work.
                  </p>
                </div>
              </div>
              {/* Tier 2 */}
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center z-10">
                  <FaAward className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">
                    Tier 2: Client Endorsed
                  </h3>
                  <p className="mt-1 text-gray-400">
                    The pinnacle of trust. After a project, clients provide a
                    rating and testimonial via a secure link. This awards the
                    project a "Client Endorsed" badge—the ultimate signal of
                    quality and reliability.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              Answers to common questions from our community.
            </p>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <h3 className="text-xl font-bold p-6 bg-gray-800/50">
              General
            </h3>
            {faqData.general.map((item, index) => (
              <FAQItem key={`gen-${index}`} question={item.q} answer={item.a} />
            ))}
            <h3 className="text-xl font-bold p-6 bg-gray-800/50 mt-4">
              For Talent
            </h3>
            {faqData.forTalent.map((item, index) => (
              <FAQItem key={`tal-${index}`} question={item.q} answer={item.a} />
            ))}
            <h3 className="text-xl font-bold p-6 bg-gray-800/50 mt-4">
              For Employers & Clients
            </h3>
            {faqData.forEmployers.map((item, index) => (
              <FAQItem key={`emp-${index}`} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-24 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-extrabold text-white">
            Ready to Join the Movement?
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            Whether you're a skilled professional ready to showcase your work
            or an employer looking for trusted talent, your journey starts here.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-6">
            <Link
              href="/talent"
              className="group inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-blue-600 rounded-lg transition-all duration-300 hover:bg-blue-700 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/20"
            >
              Find Talent <FaSearch className="ml-3 h-5 w-5" />
            </Link>
            <Link
              href="/dashboard/jobs"
              className="group inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-green-600 rounded-lg transition-all duration-300 hover:bg-green-700 hover:-translate-y-1 hover:shadow-xl hover:shadow-green-500/20"
            >
              Find Work <FaBriefcase className="ml-3 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
