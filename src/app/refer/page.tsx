'use client';
import Layout from '@/components/app/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Screen } from '@/lib/types';
import { Copy, Gift } from 'lucide-react';

type ReferPageProps = {
  navigateTo: (screen: Screen) => void;
  onBack?: () => void;
};

export default function ReferPage({ navigateTo }: ReferPageProps) {
  const referralCode = 'RIDER123';
  const { toast } = useToast();

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(referralCode);
      toast({ title: 'Copied!', description: 'Referral code copied to clipboard.' });
    }
  };

  return (
    <Layout title="Refer and Earn" navigateTo={navigateTo}>
      <div className="p-4 space-y-6">
        <Card className="text-center overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-center items-center h-40 bg-secondary rounded-lg">
              <Gift className="h-20 w-20 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mt-4">Refer friends, get rewards</h2>
            <p className="text-muted-foreground mt-2">Share your code with friends. They get a discount, and you get rewards when they take their first ride!</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground text-center">Your referral code</p>
            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg mt-2">
              <p className="text-xl font-bold tracking-widest">{referralCode}</p>
              <Button variant="ghost" size="icon" onClick={handleCopy}>
                <Copy />
              </Button>
            </div>
          </CardContent>
        </Card>
        <Button className="w-full h-14 text-lg">Refer Now</Button>
      </div>
    </Layout>
  );
}
