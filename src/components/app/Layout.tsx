'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Screen } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';

type LayoutProps = {
  title: string;
  children: React.ReactNode;
  navigateTo: (screen: Screen) => void;
  onBack?: () => void;
};

export default function Layout({ title, children, navigateTo, onBack }: LayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center p-2 border-b sticky top-0 bg-background z-10 h-[65px]">
        <Button variant="ghost" size="icon" onClick={() => onBack ? onBack() : navigateTo('home')}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold ml-4">{title}</h1>
      </header>
      <ScrollArea className="flex-1">
        <main>
          {children}
        </main>
      </ScrollArea>
    </div>
  );
}
