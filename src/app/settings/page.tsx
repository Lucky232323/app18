'use client';
import Layout from '@/components/app/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ChevronRight,
  User,
  Heart,
  SlidersHorizontal,
  AppWindow,
  Info,
  Beaker,
  LogOut,
  Trash2,
} from 'lucide-react';
import type { Screen } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';

type SettingsPageProps = {
  navigateTo: (screen: Screen) => void;
  onLogout: () => void;
  onBack?: () => void;
};

export default function SettingsPage({ navigateTo, onLogout, onBack }: SettingsPageProps) {
  const { toast } = useToast();
  const { auth } = useFirebase();

  const handleDummyClick = () => {
    toast({
      title: "Coming Soon!",
      description: "This feature is under development."
    });
  };

  const handleLogoutClick = () => {
    if (auth) {
      auth.signOut().then(() => {
        onLogout();
        toast({ title: "Logged out successfully" });
      }).catch((error) => {
        toast({ variant: 'destructive', title: "Logout failed", description: error.message });
      });
    }
  }

  const generalItems = [
    { label: 'Profile', icon: User, action: () => navigateTo('profile') },
    { label: 'Favourites', icon: Heart, action: handleDummyClick },
    { label: 'Preferences', icon: SlidersHorizontal, action: handleDummyClick },
    { label: 'App shortcuts', icon: AppWindow, action: handleDummyClick },
  ];

  const otherItems = [
    { label: 'About', icon: Info, action: handleDummyClick },
    { label: 'Subscribe to Beta', icon: Beaker, action: handleDummyClick },
  ];

  return (
    <Layout title="Settings" navigateTo={navigateTo} onBack={onBack}>
      <div className="p-4 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground px-4 mb-2">GENERAL</h3>
          <Card>
            <CardContent className="p-2">
              {generalItems.map((item, index) => (
                <button
                  key={index}
                  className="flex items-center w-full p-3 text-left hover:bg-secondary rounded-md"
                  onClick={item.action}
                >
                  <item.icon className="h-6 w-6 mr-4 text-muted-foreground" />
                  <span className="flex-1 text-base font-medium">{item.label}</span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground px-4 mb-2">OTHERS</h3>
          <Card>
            <CardContent className="p-2">
              {otherItems.map((item, index) => (
                <button
                  key={index}
                  className="flex items-center w-full p-3 text-left hover:bg-secondary rounded-md"
                  onClick={item.action}
                >
                  <item.icon className="h-6 w-6 mr-4 text-muted-foreground" />
                  <span className="flex-1 text-base font-medium">{item.label}</span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-2">
            <button
              className="flex items-center w-full p-3 text-left hover:bg-secondary rounded-md text-destructive"
              onClick={handleLogoutClick}
            >
              <LogOut className="h-6 w-6 mr-4" />
              <span className="flex-1 text-base font-medium">Logout</span>
            </button>
            <button
              className="flex items-center w-full p-3 text-left hover:bg-secondary rounded-md text-destructive"
              onClick={handleDummyClick}
            >
              <Trash2 className="h-6 w-6 mr-4" />
              <span className="flex-1 text-base font-medium">Delete Account</span>
            </button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
