'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Check, MapPin, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type PermissionsPageProps = {
  onPermissionsGranted: () => void;
};

export default function PermissionsPage({ onPermissionsGranted }: PermissionsPageProps) {
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [rewardVisible, setRewardVisible] = useState(false);
  const { toast } = useToast();

  const handleEnableLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationEnabled(true);
          toast({ title: "Location access granted", description: "You can now book rides." });
          if (notificationsEnabled) setRewardVisible(true);
        },
        () => {
          toast({ variant: 'destructive', title: "Location access denied", description: "Please enable location in your browser settings to use this app." });
        }
      );
    } else {
      toast({ variant: 'destructive', title: "Geolocation not supported", description: "Your browser doesn't support location services." });
    }
  };

  const handleEnableNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        toast({ title: "Notifications enabled", description: "You'll receive updates about your rides." });
        if (locationEnabled) setRewardVisible(true);
      } else {
        toast({ variant: 'destructive', title: "Notification access denied", description: "You can enable notifications later in your browser settings." });
      }
    } else {
      toast({ variant: 'destructive', title: "Notifications not supported", description: "Your browser doesn't support notifications." });
    }
  };

  const allPermissionsGranted = locationEnabled && notificationsEnabled;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Enable Permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Location Access</h3>
              <p className="text-sm text-muted-foreground">We need your location to find nearby rides and track your trip.</p>
              <Button
                size="sm"
                className="mt-2"
                onClick={handleEnableLocation}
                disabled={locationEnabled}
              >
                {locationEnabled ? <><Check className="mr-2 h-4 w-4" /> Enabled</> : 'Enable'}
              </Button>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Notifications</h3>
              <p className="text-sm text-muted-foreground">Get updates on your ride status, offers, and more.</p>
              <Button
                size="sm"
                className="mt-2"
                onClick={handleEnableNotifications}
                disabled={notificationsEnabled}
              >
                {notificationsEnabled ? <><Check className="mr-2 h-4 w-4" /> Enabled</> : 'Enable'}
              </Button>
            </div>
          </div>

          {rewardVisible && (
            <div className="flex items-center space-x-4 p-4 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
              <Gift className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-200">Congratulations!</h3>
                <p className="text-sm text-green-700 dark:text-green-300">You've unlocked a free ride for enabling all permissions!</p>
              </div>
            </div>
          )}

          <Button
            className="w-full h-14 text-lg mt-6"
            onClick={onPermissionsGranted}
            disabled={!allPermissionsGranted}
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
