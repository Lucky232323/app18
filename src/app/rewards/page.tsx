'use client';
import Layout from '@/components/app/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Screen } from '@/lib/types';
import { Coins, Ticket } from 'lucide-react';

type MyRewardsPageProps = {
    navigateTo: (screen: Screen) => void;
    onBack?: () => void;
};

export default function MyRewardsPage({ navigateTo }: MyRewardsPageProps) {
    return (
        <Layout title="My Rewards" navigateTo={navigateTo}>
            <div className="p-4 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col items-center p-4 bg-secondary rounded-lg">
                            <Coins className="h-8 w-8 text-primary" />
                            <p className="text-2xl font-bold mt-2">150</p>
                            <p className="text-sm text-muted-foreground">Coins</p>
                        </div>
                        <div className="flex flex-col items-center p-4 bg-secondary rounded-lg">
                            <Ticket className="h-8 w-8 text-primary" />
                            <p className="text-2xl font-bold mt-2">3</p>
                            <p className="text-sm text-muted-foreground">Vouchers</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Your Vouchers</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="p-4 border rounded-lg">
                            <p className="font-bold">20% off on your next 3 rides</p>
                            <p className="text-sm text-muted-foreground">Valid until Dec 31, 2024</p>
                        </div>
                        <div className="p-4 border rounded-lg opacity-50">
                            <p className="font-bold">Flat ₹50 off</p>
                            <p className="text-sm text-destructive">Expired on Nov 15, 2024</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
