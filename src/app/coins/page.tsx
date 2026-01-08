'use client';
import { useState } from 'react';
import Layout from '@/components/app/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { Screen } from '@/lib/types';
import { ChevronRight, Coins } from 'lucide-react';

type RiderAppCoinsPageProps = {
    navigateTo: (screen: Screen) => void;
    onBack?: () => void;
};

export default function RiderAppCoinsPage({ navigateTo, onBack }: RiderAppCoinsPageProps) {
    const [useCoins, setUseCoins] = useState(true);
    const { toast } = useToast();

    const handleToggle = (checked: boolean) => {
        setUseCoins(checked);
        if (checked) {
            toast({
                title: "Rider App Coins will be used for future rides."
            });
        }
    }

    return (
        <Layout title="RIDER APP Coins" navigateTo={navigateTo} onBack={onBack}>
            <div className="p-4 space-y-6">
                <Card>
                    <CardContent className="p-6 text-center">
                        <div className="flex justify-center items-center h-40 bg-secondary rounded-lg">
                            <Coins className="h-20 w-20 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold mt-4">Earn Coins on Every Ride</h2>
                        <p className="text-muted-foreground mt-2">Use your coins to get discounts on your rides and other exciting rewards.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold">Your Coin Balance</h3>
                            <p className="text-2xl font-bold">150 Coins</p>
                        </div>
                        <Switch checked={useCoins} onCheckedChange={handleToggle} />
                    </CardContent>
                    <div className="border-t p-4 text-sm text-muted-foreground">
                        <p>Always use Rider App Coins for rides</p>
                    </div>
                </Card>

                <button className="flex items-center w-full p-4 text-left bg-card rounded-lg border">
                    <span className="flex-1 text-base font-medium">View Coin Transactions</span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
            </div>
        </Layout>
    );
}
