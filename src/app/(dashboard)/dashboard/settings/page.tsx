
'use client'; // <-- MUST BE ON LINE 1 (or right after comments)

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { GoogleGenAI, Type } from "@google/genai";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
// --- Add imports for API Key Page components ---
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
// --- End of added imports ---

import {
    FaUserCog, FaBell, FaShieldAlt, FaCheckCircle, FaPalette, FaExclamationTriangle,
    FaKey, FaTrashAlt, FaHourglassHalf,
    FaLock, FaUserCheck, FaTools, FaStar, FaSpinner,
    FaPlug, FaCreditCard, FaGoogle, FaGithub, FaDownload, FaShareAlt, FaCalendarAlt,
    FaCopy, FaPlus, FaWandMagicSparkles
} from 'react-icons/fa';


// --- Type Definitions ---
interface User {
    uid: string;
    email: string | null;
}

interface UserProfile {
    language?: string;
    timezone?: string;
    notifications?: {
        email: { message: boolean; follower: boolean; endorsement: boolean; newsletter: boolean };
        inApp: { job: boolean; event: boolean };
    };
    oivpStatus?: {
        tier0?: 'verified' | 'pending' | 'unverified' | 'locked';
        tier1?: 'verified' | 'pending' | 'unverified' | 'locked';
        tier2?: 'verified' | 'pending' | 'unverified' | 'locked';
    };
}


// --- Settings Navigation ---

const settingsNavItems = [
  { id: 'general', label: 'General', icon: <FaUserCog /> },
  { id: 'notifications', label: 'Notifications', icon: <FaBell /> },
  { id: 'security', label: 'Security & Privacy', icon: <FaShieldAlt /> },
  { id: 'verification', label: 'Verification (OIVP)', icon: <FaCheckCircle /> },
  { id: 'api', label: 'API Keys', icon: <FaKey /> }, // --- ADDED API TAB ---
  { id: 'integrations', label: 'Integrations', icon: <FaPlug /> },
  { id: 'billing', label: 'Billing', icon: <FaCreditCard /> },
  { id: 'theme', label: 'Theme & Display', icon: <FaPalette /> },
];

type SettingsSection = 'general' | 'notifications' | 'security' | 'verification' | 'api' | 'theme' | 'integrations' | 'billing'; // --- ADDED API TYPE ---

const SettingsSidebar = ({
  activeSection,
  setActiveSection,
}: {
  activeSection: SettingsSection;
  setActiveSection: (section: SettingsSection) => void;
}) => {
  return (
    <nav className="flex flex-col gap-2">
      {settingsNavItems.map((item) => (
        <Button
          key={item.id}
          variant={activeSection === item.id ? 'default' : 'ghost'}
          className="justify-start gap-3 px-3 text-slate-300 hover:text-slate-100 hover:bg-slate-800"
          onClick={() => setActiveSection(item.id as SettingsSection)}
        >
          <span className="text-lg">{item.icon}</span>
          <span>{item.label}</span>
        </Button>
      ))}
    </nav>
  );
};


// --- Settings Content Panes ---

const GeneralSettings = ({ user, userProfile }: { user: User | null; userProfile: UserProfile | null }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        language: 'en-us',
        timezone: 'utc-0',
    });
    const [statusMessage, setStatusMessage] = useState({ type: '', text: ''});

    useEffect(() => {
        if(userProfile) {
            setFormData({
                language: userProfile.language || 'en-us',
                timezone: userProfile.timezone || 'utc-0',
            })
        }
    }, [userProfile]);

    const handleChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSave = async () => {
        if (!user?.uid) {
             setStatusMessage({ type: 'error', text: 'You must be logged in.' });
             return;
        }
        setIsSaving(true);
        setStatusMessage({ type: '', text: '' });
        try {
            // Fix: Replaced Firebase v9 modular syntax with v8 syntax to resolve import errors.
            const userRef = (db as any).collection('users').doc(user.uid);
            await userRef.update(formData);
            setStatusMessage({ type: 'success', text: 'Preferences saved successfully!' });
        } catch (error) {
            console.error("Error updating preferences: ", error);
            setStatusMessage({ type: 'error', text: 'Failed to save preferences.' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setStatusMessage({ type: '', text: ''}), 3000);
        }
    };

    return (
        <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
                <CardTitle className="text-slate-100">General Account Settings</CardTitle>
                <CardDescription className="text-slate-400">Manage your universal account preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-200">Email Address</Label>
                    <div className="flex items-center gap-4">
                        <Input id="email" type="email" value={user?.email || ''} disabled className="bg-slate-800 border-slate-700 text-slate-400" />
                        <Button variant="outline" disabled className="text-slate-200 border-slate-700 hover:bg-slate-800 hover:text-slate-100">Change Email</Button>
                    </div>
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-200">Password</Label>
                    <div className="flex items-center gap-4">
                        <Input id="password" type="password" value="************" disabled className="bg-slate-800 border-slate-700 text-slate-400" />
                        <Button variant="outline" disabled className="text-slate-200 border-slate-700 hover:bg-slate-800 hover:text-slate-100">
                            <FaKey className="mr-2 h-4 w-4"/> Change Password
                        </Button>
                    </div>
                </div>
                
                <Separator className="bg-slate-700" />
                
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="language" className="text-slate-200">Language</Label>
                        <Select value={formData.language} onValueChange={(value) => handleChange('language', value)}>
                            <SelectTrigger id="language" className="w-full bg-slate-800 border-slate-700 text-slate-100">
                                <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                                <SelectItem value="en-us">English (United States)</SelectItem>
                                <SelectItem value="kri">Krio</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="timezone" className="text-slate-200">Time Zone</Label>
                        <Select value={formData.timezone} onValueChange={(value) => handleChange('timezone', value)}>
                            <SelectTrigger id="timezone" className="w-full bg-slate-800 border-slate-700 text-slate-100">
                                <SelectValue placeholder="Select time zone" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                                <SelectItem value="utc-0">GMT (Greenwich Mean Time)</SelectItem>
                                <SelectItem value="utc-1">WAT (West Africa Time)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                
                {statusMessage.text && (
                    <p className={`text-sm ${statusMessage.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>{statusMessage.text}</p>
                )}
            </CardContent>
            <CardFooter className="flex justify-between items-center border-t border-slate-800 pt-6">
                <Button variant="destructive" className="bg-red-600/20 text-red-400 hover:bg-red-600/30">
                    <FaTrashAlt className="mr-2 h-4 w-4"/> Deactivate Account
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving && <FaSpinner className="mr-2 h-4 w-4 animate-spin"/>}
                    Save Preferences
                </Button>
            </CardFooter>
        </Card>
    );
};

const NotificationSettings = ({ user, userProfile }: { user: User | null; userProfile: UserProfile | null }) => {
    const defaultSettings = {
        email: { message: true, follower: true, endorsement: true, newsletter: true },
        inApp: { job: true, event: true }
    };
    const [settings, setSettings] = useState(defaultSettings);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: ''});
    
    useEffect(() => {
        if(userProfile?.notifications) {
            setSettings(prev => ({...prev, ...userProfile.notifications}));
        }
    }, [userProfile]);

    const handleToggle = (category: 'email' | 'inApp', key: string, value: boolean) => {
        setSettings(prev => ({
            ...prev,
            [category]: { ...prev[category], [key]: value }
        }));
    };

    const handleSave = async () => {
       if (!user?.uid) {
             setStatusMessage({ type: 'error', text: 'You must be logged in.' });
             return;
        }
        setIsSaving(true);
        setStatusMessage({ type: '', text: '' });
        try {
            // Fix: Replaced Firebase v9 modular syntax with v8 syntax to resolve import errors.
            const userRef = (db as any).collection('users').doc(user.uid);
            await userRef.update({ notifications: settings });
            setStatusMessage({ type: 'success', text: 'Notifications saved!' });
        } catch (error) {
             console.error("Error updating notifications: ", error);
             setStatusMessage({ type: 'error', text: 'Failed to save.' });
        } finally {
             setIsSaving(false);
             setTimeout(() => setStatusMessage({ type: '', text: ''}), 3000);
        }
    }

    const NotificationRow = ({ id, title, description, category, field, isChecked }: { id: string, title: string, description: string, category: 'email' | 'inApp', field: string, isChecked: boolean }) => (
         <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
            <div>
                <Label htmlFor={id} className="font-semibold text-base text-slate-100">{title}</Label>
                <p className="text-sm text-slate-300">{description}</p>
            </div>
            <Switch id={id} checked={isChecked} onCheckedChange={(value) => handleToggle(category, field, value)} />
        </div>
    );

    return (
        <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
                <CardTitle className="text-slate-100">Notifications Settings</CardTitle>
                <CardDescription className="text-slate-400">Customize how and when you receive alerts from the platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div>
                    <h3 className="text-lg font-semibold mb-4 text-slate-100">Email Notifications</h3>
                    <div className="space-y-4">
                        <NotificationRow id="email-message" title="New Messages" description="Get an email when someone sends you a message." category="email" field="message" isChecked={settings.email.message}/>
                        <NotificationRow id="email-follower" title="New Followers" description="Get an email when someone follows you." category="email" field="follower" isChecked={settings.email.follower}/>
                        <NotificationRow id="email-endorsement" title="Project Endorsements" description="Notify me when a project gets endorsed." category="email" field="endorsement" isChecked={settings.email.endorsement}/>
                        <NotificationRow id="email-newsletter" title="Platform Updates" description="Receive our newsletter and updates." category="email" field="newsletter" isChecked={settings.email.newsletter}/>
                    </div>
                </div>
                
                <div>
                    <h3 className="text-lg font-semibold mb-4 text-slate-100">In-App Notifications</h3>
                    <div className="space-y-4">
                        <NotificationRow id="app-job" title="Job Recommendations" description="Show alerts for new job opportunities." category="inApp" field="job" isChecked={settings.inApp.job}/>
                        <NotificationRow id="app-event" title="Event Reminders" description="Remind me about upcoming workshops & events." category="inApp" field="event" isChecked={settings.inApp.event}/>
                    </div>
                </div>
                
                {statusMessage.text && (
                    <p className={`mt-4 text-sm ${statusMessage.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>{statusMessage.text}</p>
                )}
            </CardContent>
            <CardFooter className="flex justify-end border-t border-slate-800 pt-6">
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving && <FaSpinner className="mr-2 h-4 w-4 animate-spin"/>}
                    Save Notification Settings
                </Button>
            </CardFooter>
        </Card>
    )
}

const SecuritySettings = () => {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-slate-100">Security & Privacy</CardTitle>
        <CardDescription className="text-slate-400">
          Protect your account and control your data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        
        {/* Two-Factor Authentication */}
        <div className="p-4 bg-slate-800 rounded-lg space-y-4">
          <div>
            <h3 className="font-semibold text-base text-slate-100">Two-Factor Authentication (2FA)</h3>
            <p className="text-sm text-slate-300 mt-1">
              Add an extra layer of security to your account. Highly recommended.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="outline" disabled className="text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-slate-100">
              <FaKey className="mr-2 h-4 w-4"/> Enable 2FA
            </Button>
            <Button variant="ghost" className="text-slate-400" disabled>
              Generate Backup Codes
            </Button>
          </div>
        </div>

        {/* Login Activity */}
        <div className="p-4 bg-slate-800 rounded-lg space-y-4">
          <div>
            <h3 className="font-semibold text-base text-slate-100">Login Activity</h3>
            <p className="text-sm text-slate-300 mt-1">
              Viewing recent login sessions. Log out any suspicious sessions.
            </p>
          </div>
          <div className="text-sm border-t border-b border-slate-700 py-3 my-2 space-y-2">
            <p className="text-slate-200"><strong>This device:</strong> Chrome on macOS - Freetown, SL (Active now)</p>
            <p className="text-slate-400"><strong>Yesterday:</strong> Mobile App on Android - Bo, SL</p>
          </div>
          <Button variant="ghost" className="text-slate-400" disabled>
            Log out of all other sessions
          </Button>
        </div>

        {/* Connected Accounts */}
        <div className="p-4 bg-slate-800 rounded-lg space-y-4">
          <div>
            <h3 className="font-semibold text-base text-slate-100">Connected Accounts</h3>
            <p className="text-sm text-slate-300 mt-1">
              Manage connections to third-party services for login.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaGoogle className="h-5 w-5 text-red-400" />
                <span className="font-medium text-slate-100">Google</span>
              </div>
              <Button variant="destructive" size="sm" disabled>Disconnect</Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaGithub className="h-5 w-5 text-slate-100" />
                <span className="font-medium text-slate-100">GitHub</span>
              </div>
              <Button variant="outline" size="sm" disabled className="text-slate-200 border-slate-700 hover:bg-slate-700">Connect</Button>
            </div>
          </div>
        </div>

        {/* Data & Privacy */}
        <div className="p-4 bg-slate-800 rounded-lg space-y-6">
          <div>
            <h3 className="font-semibold text-base text-slate-100">Data Sharing Preferences</h3>
            <p className="text-sm text-slate-300 mt-1">
              Control what profile information is visible to others.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="data-share-managers" className="flex-1 text-slate-200">
                Allow managers/clients to see my full profile
              </Label>
              <Switch id="data-share-managers" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="data-share-youth" className="flex-1 text-slate-200">
                Allow other youth users to see my email
              </Label>
              <Switch id="data-share-youth" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="data-share-analytics" className="flex-1 text-slate-200">
                Allow personalized recommendations (analytics)
              </Label>
              <Switch id="data-share-analytics" defaultChecked />
            </div>
          </div>
          <Separator className="bg-slate-700" />
          <div>
            <h3 className="font-semibold text-base text-slate-100">Data Download</h3>
            <p className="text-sm text-slate-300 mt-1 mb-4">
              Request an export of all your personal data (GDPR/privacy compliance).
            </p>
            <Button variant="outline" disabled className="text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-slate-100">
              <FaDownload className="mr-2 h-4 w-4"/> Request Data Export
            </Button>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};


const StatusTierRow = ({
  icon,
  title,
  status,
  actionText,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  status?: 'verified' | 'pending' | 'unverified' | 'locked';
  actionText: string;
  href: string;
}) => {
  const statusConfig = {
    verified: { icon: <FaCheckCircle className="text-green-500" />, text: 'Verified', color: 'text-green-500' },
    pending: { icon: <FaHourglassHalf className="text-yellow-500" />, text: 'Pending Review', color: 'text-yellow-500' },
    locked: { icon: <FaLock className="text-slate-500" />, text: 'Locked', color: 'text-slate-500' },
    unverified: { icon: <FaLock className="text-slate-500" />, text: 'Not Verified', color: 'text-slate-500' },
  };
  const currentStatus = status || 'unverified';
  return (
    <div className="flex items-center gap-4 p-4 bg-slate-800 rounded-lg">
      <div className="text-3xl text-slate-400">{icon}</div>
      <div className="flex-1">
        <p className="font-semibold text-slate-100 text-lg">{title}</p>
        <p className={`text-sm font-medium ${statusConfig[currentStatus].color}`}>
          Status: {statusConfig[currentStatus].text}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-2xl">{statusConfig[currentStatus].icon}</div>
        {currentStatus !== 'verified' && (
          <Button variant="outline" size="sm" className="text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-slate-100">
            {actionText}
          </Button>
        )}
      </div>
    </div>
  );
};


const VerificationSettings = ({ userProfile }: { userProfile: UserProfile | null }) => {
    return (
        <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
                <CardTitle className="text-slate-100">Verification Management (OIVP)</CardTitle>
                <CardDescription className="text-slate-400">Manage your trust and verification tiers on the platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <StatusTierRow
                    icon={<FaUserCheck />}
                    title="Tier 0: Identity Confirmed"
                    status={userProfile?.oivpStatus?.tier0}
                    actionText="Verify Identity"
                    href="/onboarding"
                />
                <StatusTierRow
                    icon={<FaTools />}
                    title="Tier 1: Work Authenticated"
                    status={userProfile?.oivpStatus?.tier1}
                    actionText="Manage Portfolio"
                    href="/dashboard/portfolio"
                />
                <StatusTierRow
                    icon={<FaStar />}
                    title="Tier 2: Skill Endorsed"
                    status={userProfile?.oivpStatus?.tier2}
                    actionText="Request Endorsement"
                    href="/dashboard/endorsements"
                />
            </CardContent>
        </Card>
    )
};

const IntegrationsSettings = () => {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-slate-100">Integrations & Connected Apps</CardTitle>
        <CardDescription className="text-slate-400">
          Manage permissions for third-party apps connected to your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-slate-800 rounded-lg space-y-4">
          <div>
            <h3 className="font-semibold text-base text-slate-100">Third-Party App Access</h3>
            <p className="text-sm text-slate-300 mt-1">
              Review apps that have access to your Salone Skills Connect data.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaCalendarAlt className="h-5 w-5 text-blue-400" />
                <div>
                  <span className="font-medium text-slate-100">Mentor's Calendar</span>
                  <p className="text-xs text-slate-400">Access to: Mentorship schedule</p>
                </div>
              </div>
              <Button variant="destructive" size="sm" disabled>Revoke</Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaTools className="h-5 w-5 text-gray-400" />
                <div>
                  <span className="font-medium text-slate-100">ProjectManager Tool</span>
                  <p className="text-xs text-slate-400">Access to: Project details</p>
                </div>
              </div>
              <Button variant="outline" size="sm" disabled className="text-slate-200 border-slate-700 hover:bg-slate-700">Manage</Button>
            </div>
          </div>
          <div className="text-center pt-4">
            <p className="text-sm text-slate-500">No other applications are connected.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// --- START: ADDED API KEYS SETTINGS COMPONENT ---
// (Logic adapted from app/dashboard/settings/api-keys/page.tsx)

// Define the structure of an API key (safe version, no hash)
interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  createdAt: string; // Should be formatted date
}

// Define the scopes your API supports
const AVAILABLE_SCOPES = [
  {
    id: 'talent:read',
    label: 'Read Talent Profiles',
    description: 'Allows access to search and view verified talent profiles.',
  },
  {
    id: 'jobs:write',
    label: 'Post Jobs',
    description: 'Allows remote posting of new job opportunities.',
  },
];

const ApiKeysSettings = () => {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  // State for the "Generate Key" dialog
  const [keyName, setKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(null);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);

  // --- Gemini Snippet Generation State ---
  const [isGeneratingSnippet, setIsGeneratingSnippet] = useState(false);
  const [generatedSnippet, setGeneratedSnippet] = useState('');
  const [snippetLanguage, setSnippetLanguage] = useState('javascript');

  // Fetch existing keys on mount
  useEffect(() => {
    // This is a mock fetch. In a real app, this would be an API call.
    setIsLoading(true);
    setTimeout(() => {
        setKeys([
            { id: '1', name: 'My First Key', prefix: 'ssk_1a2b3c', scopes: ['talent:read'], createdAt: new Date().toISOString() }
        ]);
        setIsLoading(false);
    }, 1000);
  }, []);

  const handleGenerateKey = async () => {
    if (!keyName) {
      toast.error('Please enter a name for your key.');
      return;
    }
    if (selectedScopes.length === 0) {
      toast.error('Please select at least one permission scope.');
      return;
    }

    setIsGenerating(true);
    // Mock generation
    setTimeout(() => {
        const newKey = `ssk_${[...Array(30)].map(() => Math.random().toString(36)[2]).join('')}`;
        setNewlyGeneratedKey(newKey);
        const newKeyData: ApiKey = {
            id: Math.random().toString(),
            name: keyName,
            prefix: newKey.substring(0, 10),
            scopes: selectedScopes,
            createdAt: new Date().toISOString()
        };
        setKeys(prev => [...prev, newKeyData]);
        toast.success('API Key generated successfully!');
        setIsGenerating(false);
    }, 1500);
  };
  
  const handleGenerateSnippet = async () => {
    if (!newlyGeneratedKey || !snippetLanguage) return;
    setIsGeneratingSnippet(true);
    setGeneratedSnippet('');
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const prompt = `Generate a simple ${snippetLanguage} code snippet to make an HTTP GET request to "https://api.saloneskills.dev/v1/talent". The request must include an "Authorization" header with the value "Bearer ${newlyGeneratedKey}". The snippet should then print the response. Only return the code, no explanations.`;
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
        setGeneratedSnippet((response.text ?? '').replace(/```(?:\w+\n)?([\s\S]+)```/, '$1').trim());
    } catch (error) {
        console.error("Error generating snippet:", error);
        toast.error("Failed to generate code snippet.");
        setGeneratedSnippet("Error generating snippet. Please try again.");
    } finally {
        setIsGeneratingSnippet(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    setIsRevoking(true);
    // Mock revoke
    setTimeout(() => {
        toast.success('API Key revoked successfully.');
        setKeys((prevKeys) => prevKeys.filter((key) => key.id !== keyId));
        setIsRevoking(false);
    }, 1000);
  };

  const resetGenerateDialog = () => {
    setKeyName('');
    setSelectedScopes([]);
    setNewlyGeneratedKey(null);
    setGeneratedSnippet('');
    setIsGeneratingSnippet(false);
    setGenerateDialogOpen(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-slate-100">API Keys</CardTitle>
          <CardDescription className="text-slate-400">
            Manage API keys for integrating with your applications.
          </CardDescription>
        </div>
        <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setGenerateDialogOpen(true)}>
              <FaPlus className="mr-2 h-4 w-4" />
              Generate New Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl bg-slate-900 border-slate-800" onInteractOutside={(e) => {
            if (newlyGeneratedKey) e.preventDefault();
          }}>
            <DialogHeader>
              <DialogTitle className="text-slate-100">Generate New API Key</DialogTitle>
              <DialogDescription className="text-slate-400">
                {newlyGeneratedKey
                  ? 'Copy your new key. You will not see it again.'
                  : 'Give your key a name and select its permissions.'}
              </DialogDescription>
            </DialogHeader>

            {newlyGeneratedKey ? (
              <div className="space-y-6">
                <div>
                    <Alert variant="destructive">
                      <FaExclamationTriangle className="h-4 w-4" />
                      <AlertTitle>Store this key securely!</AlertTitle>
                      <AlertDescription>
                        This is the only time you will see this key.
                      </AlertDescription>
                    </Alert>
                    <div className="flex items-center space-x-2 mt-4">
                      <Input
                        readOnly
                        value={newlyGeneratedKey}
                        className="font-mono bg-slate-800 border-slate-700 text-slate-100"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-slate-100"
                        onClick={() => copyToClipboard(newlyGeneratedKey)}
                      >
                        <FaCopy className="h-4 w-4" />
                      </Button>
                    </div>
                </div>
                
                <Separator className="bg-slate-700" />
                
                <div>
                    <h3 className="text-base font-medium text-slate-100">Get Code Snippet</h3>
                    <p className="text-sm text-slate-400 mb-4">Generate an example of how to use your new key.</p>
                    <div className="flex items-center gap-4">
                         <Select value={snippetLanguage} onValueChange={setSnippetLanguage}>
                            <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-slate-100">
                                <SelectValue placeholder="Select Language" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                                <SelectItem value="javascript">JavaScript</SelectItem>
                                <SelectItem value="python">Python</SelectItem>
                                <SelectItem value="curl">cURL</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={handleGenerateSnippet} disabled={isGeneratingSnippet}>
                            {isGeneratingSnippet ? <FaSpinner className="mr-2 h-4 w-4 animate-spin"/> : 'Generate Snippet'}
                        </Button>
                    </div>

                    {generatedSnippet && (
                         <div className="mt-4 relative bg-slate-800 p-4 rounded-md font-mono text-sm text-slate-200">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-7 w-7 text-slate-400 hover:bg-slate-700 hover:text-slate-100"
                                onClick={() => copyToClipboard(generatedSnippet)}
                            >
                                <FaCopy className="h-4 w-4"/>
                            </Button>
                            <pre><code>{generatedSnippet}</code></pre>
                        </div>
                    )}
                </div>

                <DialogFooter>
                  <Button onClick={resetGenerateDialog}>
                    Done
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  placeholder="Key Name (e.g., 'My HR System')"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
                <div className="space-y-3">
                  <p className="font-medium text-slate-100">Permissions</p>
                  {AVAILABLE_SCOPES.map((scope) => (
                    <div key={scope.id} className="flex items-start space-x-3">
                      <Checkbox
                        id={scope.id}
                        checked={selectedScopes.includes(scope.id)}
                        onCheckedChange={(checked) => {
                          setSelectedScopes((prev) =>
                            checked
                              ? [...prev, scope.id]
                              : prev.filter((s) => s !== scope.id)
                          );
                        }}
                        className="border-slate-700 data-[state=checked]:bg-blue-600"
                      />
                      <label
                        htmlFor={scope.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-100"
                      >
                        {scope.label}
                        <p className="text-xs text-slate-400">
                          {scope.description}
                        </p>
                      </label>
                    </div>
                  ))}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" className="text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-slate-100">Cancel</Button>
                  </DialogClose>
                  <Button
                    onClick={handleGenerateKey}
                    disabled={isGenerating || !keyName || selectedScopes.length === 0}
                  >
                    {isGenerating ? <FaSpinner className="mr-2 h-4 w-4 animate-spin"/> : 'Generate Key'}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800">
              <TableHead className="text-slate-300">Name</TableHead>
              <TableHead className="text-slate-300">Key (Prefix)</TableHead>
              <TableHead className="text-slate-300">Scopes</TableHead>
              <TableHead className="text-slate-300">Created</TableHead>
              <TableHead className="text-right text-slate-300">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="border-slate-800">
                <TableCell colSpan={5} className="text-center text-slate-400">
                  Loading keys...
                </TableCell>
              </TableRow>
            ) : keys.length === 0 ? (
              <TableRow className="border-slate-800">
                <TableCell colSpan={5} className="text-center text-slate-400">
                  You have not generated any API keys.
                </TableCell>
              </TableRow>
            ) : (
              keys.map((key) => (
                <TableRow key={key.id} className="border-slate-800">
                  <TableCell className="font-medium text-slate-100">{key.name}</TableCell>
                  <TableCell className="font-mono text-slate-300">{key.prefix}...</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {key.scopes.map((scope) => (
                        <span
                          key={scope}
                          className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-200"
                        >
                          {scope}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {new Date(key.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isRevoking}
                        >
                          <FaTrashAlt className="mr-1 h-3 w-3" />
                          Revoke
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-slate-900 border-slate-800">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-slate-100">Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription className="text-slate-400">
                            This will permanently revoke the API key "
                            <strong className="text-slate-100">{key.name}</strong>". This action cannot be
                            undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-slate-100">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => handleRevokeKey(key.id)}
                          >
                            Yes, Revoke Key
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
// --- END: ADDED API KEYS SETTINGS COMPONENT ---


const BillingSettings = () => {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-slate-100">Billing & Subscriptions</CardTitle>
        <CardDescription className="text-slate-400">
          Manage your subscription plan, payment methods, and view invoices.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        
        {/* Subscription Plan */}
        <div className="p-4 bg-slate-800 rounded-lg space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-base text-slate-100">Current Plan</h3>
              <p className="text-2xl font-bold text-blue-400 mt-1">Free Tier</p>
              <p className="text-sm text-slate-300">Includes basic profile, 3 projects, and community access.</p>
            </div>
            <Button variant="default" disabled>
              Upgrade to Pro <FaStar className="ml-2 h-4 w-4"/>
            </Button>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="p-4 bg-slate-800 rounded-lg space-y-4">
          <div>
            <h3 className="font-semibold text-base text-slate-100">Payment Methods</h3>
            <p className="text-sm text-slate-300 mt-1">
              Add or manage your payment details for subscriptions.
            </p>
          </div>
          <div className="text-sm text-slate-400 border border-dashed border-slate-700 rounded-lg p-4 text-center">
            No payment methods on file.
          </div>
          <Button variant="outline" disabled className="text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-slate-100">
            Add Payment Method
          </Button>
        </div>

        {/* Billing History */}
        <div className="p-4 bg-slate-800 rounded-lg space-y-4">
          <div>
            <h3 className="font-semibold text-base text-slate-100">Billing History</h3>
            <p className="text-sm text-slate-300 mt-1">
              View past invoices and payments.
            </p>
          </div>
          <div className="text-sm text-slate-400 border border-dashed border-slate-700 rounded-lg p-4 text-center">
            No billing history.
          </div>
        </div>

      </CardContent>
      <CardFooter className="border-t border-slate-800 pt-6">
        <p className="text-xs text-slate-500">
          Billing and subscriptions are managed by our future payment partner.
        </p>
      </CardFooter>
    </Card>
  );
};

const ThemeSettings = () => {
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');

    // --- Gemini Theme Generation State ---
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);
    const [generatedColors, setGeneratedColors] = useState<Record<string, string> | null>(null);
    const [aiError, setAiError] = useState('');

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
    }, [theme]);

    useEffect(() => {
        const root = window.document.documentElement;
        let size = '16px';
        if (fontSize === 'small') size = '14px';
        if (fontSize === 'large') size = '18px';
        root.style.fontSize = size;
    }, [fontSize]);
    
    const handleGenerateTheme = async () => {
        if(!aiPrompt) {
            setAiError("Please enter a description for your theme.");
            return;
        }
        setIsGeneratingTheme(true);
        setGeneratedColors(null);
        setAiError('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Generate a color palette for a web application's dark theme based on the description: "${aiPrompt}". The palette should be accessible and aesthetically pleasing.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            background: { type: Type.STRING, description: "Primary background color (e.g. #0F172A)" },
                            foreground: { type: Type.STRING, description: "Primary text/foreground color (e.g. #E2E8F0)" },
                            primary: { type: Type.STRING, description: "Primary action color for buttons (e.g. #3B82F6)" },
                            secondary: { type: Type.STRING, description: "Secondary element color (e.g. #1E293B)" },
                            accent: { type: Type.STRING, description: "Accent color for highlights (e.g. #F472B6)" },
                        }
                    }
                }
            });
            const responseText = response.text;
            if (responseText) {
                const colors = JSON.parse(responseText);
                setGeneratedColors(colors);
            } else {
                throw new Error("AI response was empty, could not parse JSON.");
            }
        } catch(error) {
            console.error("AI theme generation failed:", error);
            setAiError("Sorry, couldn't generate a theme. Please try again.");
        } finally {
            setIsGeneratingTheme(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`Copied ${text} to clipboard!`);
    };

    return (
        <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
                <CardTitle className="text-slate-100">Theme & Display</CardTitle>
                <CardDescription className="text-slate-400">Customize the look and feel of the platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                    <div>
                        <Label htmlFor="theme-mode" className="font-semibold text-base text-slate-100">Interface Theme</Label>
                        <p className="text-sm text-slate-300">Choose between light and dark themes.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="theme-toggle" className={`text-sm font-medium ${theme === 'light' ? 'text-blue-400' : 'text-slate-500'}`}>Light</Label>
                        <Switch id="theme-toggle" checked={theme === 'dark'} onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')} />
                        <Label htmlFor="theme-toggle" className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-slate-500'}`}>Dark</Label>
                    </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                    <div>
                        <Label className="font-semibold text-base text-slate-100">Font Size</Label>
                        <p className="text-sm text-slate-300">Adjust text size for accessibility.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant={fontSize === 'small' ? 'default' : 'outline'} 
                            size="sm" 
                            className="text-slate-200 border-slate-700 hover:bg-slate-700 text-xs"
                            onClick={() => setFontSize('small')}
                        >
                            A
                        </Button>
                        <Button 
                            variant={fontSize === 'medium' ? 'default' : 'outline'} 
                            size="sm"
                            className="text-slate-200 border-slate-700 hover:bg-slate-700 text-base"
                            onClick={() => setFontSize('medium')}
                        >
                            A
                        </Button>
                        <Button 
                            variant={fontSize === 'large' ? 'default' : 'outline'} 
                            size="sm" 
                            className="text-slate-200 border-slate-700 hover:bg-slate-700 text-lg"
                            onClick={() => setFontSize('large')}
                        >
                            A
                        </Button>
                    </div>
                </div>

                <div className="p-4 bg-slate-800 rounded-lg">
                    <div className="space-y-2">
                        <Label className="font-semibold text-base text-slate-100">Generate Theme with AI</Label>
                        <p className="text-sm text-slate-300">Describe the look and feel you want, and let AI create a palette for you.</p>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                        <Input 
                            placeholder="e.g., 'Cyberpunk neon city at night'" 
                            className="bg-slate-900 border-slate-700" 
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                        />
                        <Button onClick={handleGenerateTheme} disabled={isGeneratingTheme}>
                            {isGeneratingTheme ? <FaSpinner className="mr-2 h-4 w-4 animate-spin" /> : <FaWandMagicSparkles className="mr-2 h-4 w-4" />}
                            Generate
                        </Button>
                    </div>
                    {aiError && <p className="text-red-400 text-sm mt-2">{aiError}</p>}
                    {generatedColors && (
                        <div className="mt-4 space-y-3">
                            <p className="text-sm text-slate-200">Generated Palette:</p>
                             <div className="flex flex-wrap gap-4">
                                {Object.entries(generatedColors).map(([name, color]) => (
                                    <div key={name} className="flex flex-col items-center gap-2">
                                        <div 
                                            className="h-12 w-12 rounded-full border-2 border-slate-600 cursor-pointer"
                                            style={{ backgroundColor: color as string }}
                                            onClick={() => copyToClipboard(color as string)}
                                            title={`Copy ${color}`}
                                        />
                                        <div className="text-center">
                                            <p className="text-xs capitalize text-slate-300">{name}</p>
                                            <p className="text-xs font-mono text-slate-400">{color as string}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}


export default function SettingsPage() {
  const { user, userProfile, loading } = useAuth();
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');

  const renderContent = useCallback(() => {
    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <FaSpinner className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }
    
    if (!user || !userProfile) {
        return (
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-slate-100">Authentication Required</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-slate-400">Please log in to manage your settings.</p>
                </CardContent>
            </Card>
        );
    }

    switch (activeSection) {
      case 'general':
        return <GeneralSettings user={user} userProfile={userProfile} />;
      case 'notifications':
        return <NotificationSettings user={user} userProfile={userProfile} />;
      case 'security':
        return <SecuritySettings />;
      case 'verification':
          return <VerificationSettings userProfile={userProfile} />;
      case 'api': // --- ADDED API RENDER CASE ---
          return <ApiKeysSettings />;
      case 'integrations':
          return <IntegrationsSettings />;
      case 'billing':
          return <BillingSettings />;
      case 'theme':
          return <ThemeSettings />;
      default:
        return <GeneralSettings user={user} userProfile={userProfile} />;
    }
  }, [activeSection, user, userProfile, loading]);

  return (
    <>
      <style>{`
        .content-pane {
          animation: content-fade-in 0.5s ease-in-out;
        }

        @keyframes content-fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div className="bg-slate-950 text-slate-100 min-h-screen">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <header className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-slate-100">Settings</h1>
            <p className="text-slate-400 mt-2">Manage your account and platform preferences.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8">
            <aside className="md:col-span-1 lg:col-span-1">
              <SettingsSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
            </aside>
            <main className="md:col-span-3 lg:col-span-4 content-pane" key={activeSection}>
              {renderContent()}
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
