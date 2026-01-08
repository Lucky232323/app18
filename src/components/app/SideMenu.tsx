'use client';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  History,
  CreditCard,
  Tag,
  Bell,
  Settings,
  Shield,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import type { Screen, User as UserType } from '@/lib/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';

type SideMenuProps = {
  user: UserType | null;
  navigateTo: (screen: Screen) => void;
  onLogout: () => void;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const mainMenuItems = [
  { screen: 'ride-history' as Screen, label: 'My Rides', icon: History },
  { screen: 'payments' as Screen, label: 'Payments', icon: CreditCard },
  { screen: 'offers' as Screen, label: 'Offers & Promos', icon: Tag },
];

const supportMenuItems = [
  { screen: 'notifications' as Screen, label: 'Notifications', icon: Bell },
  { screen: 'settings' as Screen, label: 'Settings', icon: Settings },
  { screen: 'safety' as Screen, label: 'Safety', icon: Shield },
  { screen: 'help' as Screen, label: 'Help', icon: HelpCircle },
];

export default function SideMenu({ user, navigateTo, onLogout, children, open, onOpenChange }: SideMenuProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0 flex flex-col">
        <SheetHeader>
          <div
            className="flex items-center gap-4 p-4 bg-secondary cursor-pointer"
            onClick={() => navigateTo('profile')}
          >
            <Avatar className="h-16 w-16">
              <AvatarFallback>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xl font-bold">{user?.name || 'Guest User'}</p>
              <p className="text-sm text-muted-foreground">View Profile</p>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="py-2 px-2 space-y-1">
            {mainMenuItems.map((item) => (
              <MenuItem key={item.screen} item={item} navigateTo={navigateTo} />
            ))}
          </div>
          <Separator />
          <div className="py-2 px-2 space-y-1">
            {supportMenuItems.map((item) => (
              <MenuItem key={item.screen} item={item} navigateTo={navigateTo} />
            ))}
          </div>
        </ScrollArea>

        <div className="p-2 mt-auto border-t">
          <Button variant="ghost" className="w-full justify-start text-base h-12 text-destructive hover:text-destructive" onClick={onLogout}>
            <LogOut className="mr-4 h-5 w-5" />
            Logout
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}


const MenuItem = ({ item, navigateTo }: { item: { screen: Screen, label: string, icon: React.ElementType }, navigateTo: (screen: Screen) => void }) => (
  <Button
    key={item.screen}
    variant="ghost"
    className="w-full justify-start text-base h-12"
    onClick={() => navigateTo(item.screen)}
  >
    <item.icon className="mr-4 h-5 w-5 text-muted-foreground" />
    {item.label}
  </Button>
);
