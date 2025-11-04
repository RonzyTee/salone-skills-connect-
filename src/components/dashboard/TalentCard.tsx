// /components/dashboard/TalentCard.tsx
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FaCheckCircle } from 'react-icons/fa';

interface TalentCardProps {
  user: {
    id: string;
    fullName: string;
    headline: string;
    profilePictureUrl: string;
    identityStatus: string;
    selectedSkills: string[];
  };
}

export default function TalentCard({ user }: TalentCardProps) {
  const isVerified = user.identityStatus === 'verified';

  return (
    // UPDATED COLORS: bg-slate-900, border-slate-800, and hover state
    <Card className="bg-slate-900 border-slate-800 text-white overflow-hidden transform transition-all duration-300 hover:scale-105 hover:bg-slate-800">
      <CardContent className="p-0">
        {/* UPDATED: Removed gradient, now a solid dark banner */}
        <div className="h-24 bg-slate-800" />
        <div className="p-6">
          {/* UPDATED: Avatar border matches new card background */}
          <Avatar className="h-20 w-20 -mt-16 border-4 border-slate-900">
            <AvatarImage src={user.profilePictureUrl} alt={user.fullName} />
            <AvatarFallback>{user.fullName?.[0]}</AvatarFallback>
          </Avatar>
          
          <h3 className="text-2xl font-bold mt-4 text-white">{user.fullName}</h3>
          <p className="text-base text-gray-400 h-12">{user.headline}</p>

          {isVerified ? (
            <div className="flex items-center gap-2 mt-3 text-green-400">
              <FaCheckCircle />
              <span className="font-semibold text-lg">Identity Confirmed</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-3 text-gray-500">
              <span className="font-semibold text-lg">Not Verified</span>
            </div>
          )}

          <div className="my-4 h-16">
            <h4 className="text-sm font-semibold text-gray-500 mb-2">TOP SKILLS</h4>
            <div className="flex flex-wrap gap-2">
              {/* UPDATED: Darker skill tags */}
              {user.selectedSkills.map(skill => (
                <span key={skill} className="bg-slate-700 text-slate-300 text-sm px-3 py-1 rounded-full">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          
          {/* UPDATED: Button style to be more subtle */}
          <Button asChild variant="outline" className="w-full text-lg py-6 bg-slate-800 border-slate-700 text-gray-300 hover:bg-slate-700 hover:text-white">
            <Link href={`/profile/${user.id}`}>View Profile</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}