// /components/dashboard/ManagerCard.tsx
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FaCheckCircle } from 'react-icons/fa';

interface ManagerCardProps {
  manager: {
    id: string;
    companyName: string;
    industry: string;
    logoUrl: string;
    tagline: string;
  };
}

export default function ManagerCard({ manager }: ManagerCardProps) {
  return (
    // UPDATED COLORS: bg-slate-900, border-slate-800, and hover state
    <Card className="bg-slate-900 border-slate-800 text-white overflow-hidden transform transition-all duration-300 hover:scale-105 hover:bg-slate-800">
      <CardContent className="p-6 flex flex-col items-center text-center">
        {/* UPDATED: Avatar border matches new theme */}
        <Avatar className="h-24 w-24 border-4 border-slate-800">
          <AvatarImage src={manager.logoUrl} alt={manager.companyName} />
          <AvatarFallback>{manager.companyName?.[0]}</AvatarFallback>
        </Avatar>
        
        <h3 className="text-2xl font-bold mt-4 text-white">{manager.companyName}</h3>
        <p className="text-base text-gray-400">{manager.industry}</p>

        <div className="flex items-center gap-2 mt-3 text-blue-400">
          <FaCheckCircle />
          <span className="font-semibold text-lg">Verified Organization</span>
        </div>

        <p className="text-base text-gray-300 my-4 h-12">{manager.tagline}</p>
        
        {/* This button is a primary action, so blue is correct */}
        <Button asChild className="w-full text-lg py-6 bg-blue-600 hover:bg-blue-700">
          <Link href={`/organization/${manager.id}`}>View Opportunities</Link>
        </Button>
      </CardContent>
    </Card>
  );
}