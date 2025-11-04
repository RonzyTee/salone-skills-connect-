'use client';

import { useState } from 'react';
import {
  FaReact, FaNodeJs, FaFigma, FaPython, FaDocker, FaAws,
  FaDownload, FaLayerGroup, FaJsSquare, FaHtml5, FaCss3Alt, FaPalette,
  FaSpinner,
  // --- ADDED ICONS for products ---
  FaTasks,
  FaCogs,
  FaSitemap,
  FaCloud,
  FaShieldAlt,
  FaDatabase,
  FaChartBar,
  FaInfinity,
  FaCode // Fallback icon
} from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

export type Product = {
  id: string;
  title: string;
  iconName: string;
  price: number;
  techStack: string[];
  downloads: number;
  category: string;
};

// HELPER: Map skill names to Icons (Unchanged)
const getSkillIcon = (skillName: string) => {
  const normalizedSkill = skillName.toLowerCase().trim();
  const skillMap: { [key: string]: React.ReactNode } = {
    react: <FaReact className="text-sky-300" />,
    'node.js': <FaNodeJs className="text-green-400" />,
    python: <FaPython className="text-yellow-400" />,
    javascript: <FaJsSquare className="text-yellow-300" />,
    html5: <FaHtml5 className="text-orange-400" />,
    css3: <FaCss3Alt className="text-blue-300" />,
    figma: <FaFigma className="text-purple-400" />,
    docker: <FaDocker className="text-blue-500" />,
    aws: <FaAws className="text-orange-500" />,
    'ui/ux design': <FaPalette className="text-pink-400" />,
  };
  return skillMap[normalizedSkill] || <FaLayerGroup className="text-slate-400" />;
};

// --- UPDATED HELPER: Map product icon names to Components with specific colors ---
const getProductIcon = (iconName: string) => {
  const iconMap: { [key: string]: React.ReactNode } = {
    'FaTasks': <FaTasks className="text-blue-400" />,        // Agile
    'FaCogs': <FaCogs className="text-yellow-400" />,         // API
    'FaSitemap': <FaSitemap className="text-sky-400" />,      // Cloud Architecture
    'FaCloud': <FaCloud className="text-slate-400" />,        // Cloud Computing
    'FaShieldAlt': <FaShieldAlt className="text-green-400" />,// Cybersecurity
    'FaDatabase': <FaDatabase className="text-indigo-400" />, // Database
    'FaChartBar': <FaChartBar className="text-red-400" />,    // Data Visualization
    'FaInfinity': <FaInfinity className="text-purple-400" />, // DevOps
    'FaLayerGroup': <FaLayerGroup className="text-slate-400" />, // Default/Fallback
  };
  // Return the mapped icon with its color, or a default code icon with a color
  return iconMap[iconName] || <FaCode className="text-gray-400" />;
};


interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleComingSoonClick = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1500); // Show loading for 1.5 seconds
  };

  return (
    <Card className="w-full bg-slate-900 border-slate-700/50 rounded-lg shadow-lg overflow-hidden flex flex-col">
      <CardHeader className="p-0 relative h-40 w-full flex items-center justify-center bg-slate-800/50">
        
        {/* Render the icon dynamically with its color */}
        {/* The text-6xl class is still on the parent div to control size */}
        <div className="text-6xl"> 
          {getProductIcon(product.iconName)}
        </div>
        
        <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-sm text-white font-bold text-lg py-1.5 px-4 rounded-full border border-slate-700">
          ${product.price.toFixed(2)}
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3 flex-1">
        <h3 className="text-xl font-bold text-white truncate">{product.title}</h3>
        
        <div className="flex flex-row flex-wrap items-center gap-2">
          {product.techStack.slice(0, 5).map((skill, idx) => (
            <div
              key={idx}
              title={skill}
              className="flex items-center justify-center h-7 w-7 bg-slate-800/80 rounded-full text-base"
            >
              {getSkillIcon(skill)}
            </div>
          ))}
          {product.techStack.length > 5 && (
              <span className="text-xs text-slate-400">
                +{product.techStack.length - 5} more
              </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 bg-slate-900/50 border-t border-slate-700/50 flex items-center justify-end">
        <Button
          variant="secondary"
          disabled={isLoading}
          onClick={handleComingSoonClick}
          className="bg-slate-700 text-slate-300 hover:bg-slate-600 w-32"
        >
          {isLoading ? (
            <FaSpinner className="animate-spin" />
          ) : (
            'Coming Soon'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};