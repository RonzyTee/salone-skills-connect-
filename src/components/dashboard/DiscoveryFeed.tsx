// /components/dashboard/DiscoveryFeed.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FaSearch, FaRandom } from 'react-icons/fa';
import TalentCard from './TalentCard';
import ManagerCard from './ManagerCard';
import toast from 'react-hot-toast';

export default function DiscoveryFeed() {
  const [talent, setTalent] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTalent = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users/featured-talent');
      if (!res.ok) throw new Error('Failed to fetch talent');
      setTalent(await res.json());
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const res = await fetch('/api/users/featured-managers');
      if (!res.ok) throw new Error('Failed to fetch managers');
      setManagers(await res.json());
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchTalent();
    fetchManagers();
  }, []);

  const handleShuffle = () => {
    toast.success('Shuffling featured talent!');
    fetchTalent();
  };

  return (
    <div className="lg:col-span-2 space-y-8">
      {/* 1. Search and Shuffle Header */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-500" />
          {/* UPDATED: Search bar style to match right sidebar cards */}
          <Input 
            placeholder="Search for skills, talent, or companies..." 
            className="h-16 w-full rounded-full bg-slate-900 border-slate-800 pl-14 text-xl" 
          />
        </div>
        <Button 
          onClick={handleShuffle} 
          size="lg" 
          // UPDATED: Shuffle button style to match search bar
          className="h-16 w-16 rounded-full bg-slate-900 border-slate-800 text-gray-400 hover:bg-slate-800"
        >
          <FaRandom className="h-6 w-6" />
        </Button>
      </div>

      {/* 2. Tabs and Content */}
      <Tabs defaultValue="talent" className="w-full">
        {/* UPDATED: TabsList to be dark */}
        <TabsList className="grid w-full grid-cols-2 h-16 bg-slate-900">
          {/* UPDATED: TabsTrigger to be white when active (matches screenshot) */}
          <TabsTrigger 
            value="talent" 
            className="h-12 text-xl rounded-md text-gray-400 data-[state=active]:bg-white data-[state=active]:text-black"
          >
            Featured Talent
          </TabsTrigger>
          <TabsTrigger 
            value="managers" 
            className="h-12 text-xl rounded-md text-gray-400 data-[state=active]:bg-white data-[state=active]:text-black"
          >
            Featured Managers
          </TabsTrigger>
        </TabsList>
        <TabsContent value="talent" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? <p>Loading talent...</p> : talent.map(user => <TalentCard key={user.id} user={user} />)}
          </div>
        </TabsContent>
        <TabsContent value="managers" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? <p>Loading managers...</p> : managers.map(manager => <ManagerCard key={manager.id} manager={manager} />)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}