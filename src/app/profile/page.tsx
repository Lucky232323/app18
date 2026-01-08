'use client';
import { useState, ChangeEvent } from 'react';
import Layout from '@/components/app/Layout';
import type { Screen, User } from '@/lib/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Edit,
  User as UserIcon,
  Phone,
  Mail,
  Home,
  Briefcase,
  MapPin,
  LogOut,
  Trash2,
  Star,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

type ProfilePageProps = {
  user: User | null;
  navigateTo: (screen: Screen) => void;
  onUserUpdate: (user: User) => void;
  onLogout: () => void;
  onBack?: () => void;
};

export default function ProfilePage({ user, navigateTo, onUserUpdate, onLogout, onBack }: ProfilePageProps) {
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const { toast } = useToast();

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
          setProfilePic(e.target.result);
          toast({ title: 'Profile picture updated!' });
        }
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  };

  return (
    <Layout title="My Profile" navigateTo={navigateTo} onBack={onBack}>
      <div className="p-4 space-y-6 pb-20">

        {/* Header Section */}
        <div className="flex flex-col items-center justify-center space-y-4 py-6">
          <div className="relative group">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="profile-pic-upload"
              onChange={handleImageUpload}
            />
            <label htmlFor="profile-pic-upload" className="cursor-pointer">
              <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                {profilePic ? (
                  <img src={profilePic} alt={user?.name || ''} className="aspect-square h-full w-full object-cover" />
                ) : (
                  <AvatarFallback className="text-5xl bg-slate-200 text-slate-500">{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                )}
              </Avatar>
              <div className="absolute bottom-2 right-2 bg-blue-600 rounded-full p-2 border-2 border-white shadow-sm group-hover:bg-blue-700 transition-colors">
                <Edit className="h-4 w-4 text-white" />
              </div>
            </label>
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{user?.name || 'Guest User'}</h2>
            <p className="text-slate-500 font-medium">{user?.phone || '+91 XXXXX XXXXX'}</p>

            {/* Rating Pill */}
            <div className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold border border-yellow-100 mt-2">
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              4.8 Rating
            </div>
          </div>
        </div>

        {/* Personal Info Card */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 px-6 py-4 border-b">
            <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
              <UserIcon className="h-4 w-4" /> Personal Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              <div className="flex items-center p-4">
                <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center mr-4">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Email</p>
                  <p className="text-sm font-medium">{user?.email || 'Not verified'}</p>
                </div>
              </div>
              <div className="flex items-center p-4">
                <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center mr-4">
                  <UserIcon className="h-5 w-5 text-slate-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Gender</p>
                  <p className="text-sm font-medium capitalize">{user?.gender || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Saved Places (Mock for visual) */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 px-6 py-4 border-b">
            <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Saved Places
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              <button className="flex items-center w-full p-4 hover:bg-slate-50 transition-colors text-left" onClick={() => toast({ description: "Home location feature coming soon!" })}>
                <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center mr-4">
                  <Home className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Home</p>
                  <p className="text-xs text-muted-foreground">Add home location</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </button>
              <button className="flex items-center w-full p-4 hover:bg-slate-50 transition-colors text-left" onClick={() => toast({ description: "Work location feature coming soon!" })}>
                <div className="h-10 w-10 bg-orange-50 rounded-full flex items-center justify-center mr-4">
                  <Briefcase className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Work</p>
                  <p className="text-xs text-muted-foreground">Add work location</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3 pt-4">
          <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100 h-12 text-base" onClick={onLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>

          <div className="text-center">
            <button className="text-xs text-slate-400 font-medium hover:text-red-500 transition-colors flex items-center justify-center mx-auto gap-1" onClick={() => toast({ title: "Account Deletion", description: "Please contact support to delete your account data permanently." })}>
              <Trash2 className="h-3 w-3" /> Delete Account
            </button>
          </div>

          <p className="text-center text-xs text-slate-300 pt-4">Version 2.4.0 (Build 2024)</p>
        </div>

      </div>
    </Layout>
  );
}
