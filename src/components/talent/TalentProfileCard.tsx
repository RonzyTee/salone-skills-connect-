'use client';

import Link from 'next/link';
import { UserProfile } from '@/types';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaProjectDiagram,
  FaUserPlus,
  FaGithub,
  FaLinkedin,
  FaWhatsapp,
  // --- Skill Icons ---
  FaCode, // Full-Stack
  FaPalette, // UI/UX
  FaVial, // QA
  FaDatabase, // DB
  FaFilm, // Motion Graphics
  FaShieldAlt, // Cybersecurity
  FaCloud, // Cloud
  FaMobileAlt, // Mobile Dev
  FaLayerGroup, // Generic Fallback
  // --- Specific Tech Icons ---
  FaReact,
  FaNodeJs,
  FaPython,
  FaJsSquare,
  FaHtml5,
  FaCss3Alt,
  FaFigma,
  FaDocker,
  FaAws,
} from 'react-icons/fa'; // FaTools has been removed
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// --- HELPER: Map skill names to Icons AND Colors ---
const getSkillData = (skillName: string) => {
  const normalizedSkill = skillName.toLowerCase().trim();
  const skillMap: { [key: string]: { icon: React.ReactNode; color: string } } =
    {
      'full-stack development': { icon: <FaCode />, color: 'text-blue-400' },
      'ui/ux design': { icon: <FaPalette />, color: 'text-pink-400' },
      'software testing and qa': { icon: <FaVial />, color: 'text-emerald-400' },
      'database management': { icon: <FaDatabase />, color: 'text-amber-400' },
      'motion graphics': { icon: <FaFilm />, color: 'text-red-400' },
      cybersecurity: { icon: <FaShieldAlt />, color: 'text-cyan-400' },
      'cloud architecture': { icon: <FaCloud />, color: 'text-sky-400' },
      'mobile development': { icon: <FaMobileAlt />, color: 'text-indigo-400' },
      react: { icon: <FaReact />, color: 'text-sky-300' },
      'node.js': { icon: <FaNodeJs />, color: 'text-green-400' },
      python: { icon: <FaPython />, color: 'text-yellow-400' },
      javascript: { icon: <FaJsSquare />, color: 'text-yellow-300' },
      html5: { icon: <FaHtml5 />, color: 'text-orange-400' },
      css3: { icon: <FaCss3Alt />, color: 'text-blue-300' },
      figma: { icon: <FaFigma />, color: 'text-purple-400' },
      docker: { icon: <FaDocker />, color: 'text-blue-500' },
      aws: { icon: <FaAws />, color: 'text-orange-500' },
      // Add any other skills from your list here
      'agile methodologies': { icon: <FaLayerGroup />, color: 'text-blue-300' },
      'api development': { icon: <FaCode />, color: 'text-purple-300' },
      'cloud computing': { icon: <FaCloud />, color: 'text-sky-400' },
      'data visualization': { icon: <FaPalette />, color: 'text-green-300' },
      // --- THIS IS THE FIX ---
      'devops engineering': { icon: <FaDocker />, color: 'text-orange-400' }, 
      'machine learning': { icon: <FaVial />, color: 'text-pink-400' },
    };
  return (
    skillMap[normalizedSkill] || {
      icon: <FaLayerGroup />,
      color: 'text-slate-400',
    }
  );
};

// --- HELPER: Format Follower Count ---
const formatFollowerCount = (count: number): string => {
  if (!count) return '0';
  if (count >= 1000000) {
    const num = count / 1000000;
    return `${num % 1 === 0 ? num : num.toFixed(1)}m`;
  }
  if (count >= 1000) {
    const num = count / 1000;
    return `${num % 1 === 0 ? num : num.toFixed(1)}k`;
  }
  return count.toString();
};

const getSparkleClass = (index: number) => {
  const variations = ['', 'variation-1', 'variation-2'];
  return variations[index % variations.length];
};

interface TalentProfileCardProps {
  talent: UserProfile;
  isFollowing: boolean;
  onFollow: (targetUserId: string) => void;
  index?: number;
}

export const TalentProfileCard: React.FC<TalentProfileCardProps> = ({
  talent,
  isFollowing,
  onFollow,
  index = 0,
}) => {
  const isVerified = talent.oivpStatus?.tier0 === 'verified';
  const displaySkill =
    talent.primarySkill || talent.selectedSkills?.[0] || 'Skill not listed';

  return (
    <div
      className={`sparkle-corner ${getSparkleClass(
        index
      )} flex-shrink-0 w-80 flex flex-col p-4 bg-slate-900 border border-slate-700/50 rounded-lg shadow-lg hover:shadow-blue-500/10 transition-shadow duration-300`}
    >
      <div className="flex items-start gap-4 mb-4">
        <Avatar className="h-14 w-14 border-2 border-slate-700 flex-shrink-0">
          <AvatarImage
            src={talent.profilePictureUrl}
            alt={talent.fullName || 'User avatar'}
            className="object-cover"
          />
          <AvatarFallback>
            {talent.fullName ? talent.fullName.charAt(0) : 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center gap-2">
            <p className="font-bold text-lg text-white truncate">
              {talent.fullName?.split(' ')[0] || 'User'}
            </p>
            <span title={isVerified ? 'Verified' : 'Not Verified'}>
              {isVerified ? (
                <FaCheckCircle className="h-4 w-4 text-blue-500" />
              ) : (
                <FaTimesCircle className="h-4 w-4 text-red-500" />
              )}
            </span>
          </div>
          <p className="text-sm text-slate-400 truncate">{displaySkill}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-400 mb-3">
        <div className="flex items-center gap-1.5">
          <FaProjectDiagram className="h-3.5 w-3.5 text-blue-400" />
          <span className="font-medium">{talent.projectsCount ?? 0} Projects</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FaUserPlus className="h-3.5 w-3.5 text-green-400" />
          <span className="font-medium">
            {formatFollowerCount(talent.followers?.length ?? 0)}
          </span>
        </div>
      </div>

      <div className="mb-6 min-h-[28px]">
        <div className="flex flex-wrap items-center gap-2">
          {talent.selectedSkills && talent.selectedSkills.length > 0 ? (
            talent.selectedSkills.slice(0, 5).map((skill: string, idx: number) => {
              const { icon, color } = getSkillData(skill);
              return (
                <div
                  key={idx}
                  title={skill}
                  className={`flex items-center justify-center h-7 w-7 bg-slate-800/80 rounded-full ${color} text-base transition-transform hover:scale-110`}
                >
                  {icon}
                </div>
              );
            })
          ) : (
            <span className="bg-slate-800 text-slate-500 text-xs font-medium px-2.5 py-1 rounded-full">
              No skills added
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end text-sm text-slate-400 mb-3 gap-3">
        {talent.githubUrl && (
          <a
            href={talent.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="GitHub"
          >
            <FaGithub className="h-5 w-5" />
          </a>
        )}
        {talent.linkedinUrl && (
          <a
            href={talent.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-400 transition-colors"
            aria-label="LinkedIn"
          >
            <FaLinkedin className="h-5 w-5" />
          </a>
        )}
        {talent.whatsappNumber && (
          <a
            href={`https://wa.me/${talent.whatsappNumber.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-500 hover:text-green-400 transition-colors"
            aria-label="WhatsApp"
          >
            <FaWhatsapp className="h-5 w-5" />
          </a>
        )}
      </div>

      <div className="mt-auto pt-4 flex items-center justify-between">
        <div className="sparkle-button-container">
          <Link href={`/profile/${talent.uid}`}>
            <Button
              variant="outline"
              size="sm"
              className="bg-slate-900 border-transparent text-blue-400 hover:bg-slate-800/80 hover:text-blue-300 transition-all"
            >
              View Profile
            </Button>
          </Link>
        </div>
        <div className="sparkle-button-container">
          <Button
            variant={isFollowing ? 'secondary' : 'default'}
            size="sm"
            className="text-xs px-3"
            onClick={() => onFollow(talent.uid)}
          >
            <FaUserPlus className="mr-1.5 h-3 w-3" />
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
        </div>
      </div>
    </div>
  );
};