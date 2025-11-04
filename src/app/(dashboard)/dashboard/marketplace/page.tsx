'use client';

import { useState, useEffect } from 'react';
import {
  FaSpinner,
  FaShoppingBag,
  FaTasks,        // Added for Agile
  FaCogs,         // Added for API
  FaSitemap,      // Added for Architecture
  FaCloud,        // Added for Cloud
  FaShieldAlt,    // Added for Cybersecurity
  FaDatabase,     // Added for Database
  FaChartBar,     // Added for DataViz
  FaInfinity,     // Added for DevOps
  FaLayerGroup    // Added as a fallback
} from 'react-icons/fa';
// Imports from the ProductCard.tsx file in the same folder
import { Product, ProductCard } from './ProductCard';

// --- Categories from your list ---
const CATEGORIES = [
  'Agile Methodologies',
  'API Development',
  'Cloud Architecture',
  'Cloud Computing',
  'Cybersecurity',
  'Database Management',
  'Data Visualization',
  'DevOps Engineering',
];

// --- NEW: Map categories to icon names ---
const CATEGORY_ICON_MAP: { [key: string]: string } = {
  'Agile Methodologies': 'FaTasks',
  'API Development': 'FaCogs',
  'Cloud Architecture': 'FaSitemap',
  'Cloud Computing': 'FaCloud',
  'Cybersecurity': 'FaShieldAlt',
  'Database Management': 'FaDatabase',
  'Data Visualization': 'FaChartBar',
  'DevOps Engineering': 'FaInfinity',
};

// --- Dummy Data Generation (Tech/Titles) ---
const allTech = ['React', 'Node.js', 'Figma', 'Python', 'Docker', 'AWS', 'Javascript', 'HTML5', 'CSS3', 'UI/UX Design'];
const allTitles = [
  'Admin Dashboard Kit', 'Mobile App UI Kit', 'Cloud Deployment Script',
  'API Starter Pack', 'Security Scanner', 'Database Schema', 'DataViz Charts',
  'Kanban Board Template', 'E-commerce Backend', 'SaaS Boilerplate'
];

// --- DUMMY_IMAGES array is REMOVED ---

// Helper to get random items
const getRandomItems = (arr: string[], count: number) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Helper to generate all dummy products
const generateDummyProducts = (): Product[] => {
  const products: Product[] = [];
  let idCounter = 1;

  CATEGORIES.forEach(category => {
    for (let i = 0; i < 12; i++) { // Generate 12 products per category
      products.push({
        id: `prod_${idCounter++}`,
        title: `${getRandomItems(allTitles, 1)[0]} (${category.split(' ')[0]})`,
        
        // --- CHANGED: from imageUrl to iconName ---
        iconName: CATEGORY_ICON_MAP[category] || 'FaLayerGroup', // Use map or fallback
        // ---
        
        price: Math.floor(Math.random() * (50 - 10 + 1)) + 10,
        techStack: getRandomItems(allTech, Math.floor(Math.random() * 4) + 3),
        downloads: Math.floor(Math.random() * 2500) + 50,
        category: category,
      });
    }
  });
  return products;
};
// --- End of Dummy Data ---


// --- Category Row Component ---
interface CategoryRowProps {
  title: string;
  products: Product[];
}

const CategoryRow: React.FC<CategoryRowProps> = ({ title, products }) => {
  if (products.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Main Marketplace Page Component ---
export default function MarketplacePage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      const products = generateDummyProducts();
      setAllProducts(products);
      setIsLoading(false);
    }, 500);
  }, []);

  if (isLoading) {
    return (
      <div className="flex w-full min-h-screen bg-slate-950 items-center justify-center p-10">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white p-6 md:p-8 space-y-12">
      <h1 className="text-4xl font-bold tracking-tight text-white flex items-center">
        <FaShoppingBag className="mr-3 text-blue-400" />
        Project Marketplace
      </h1>

      {CATEGORIES.map(category => {
        const productsForCategory = allProducts.filter(
          p => p.category === category
        );
        return (
          <CategoryRow
            key={category}
            title={category}
            products={productsForCategory}
          />
        );
      })}
    </div>
  );
}