'use client';
import Layout from '@/components/app/Layout';
import { Card, CardContent } from '@/components/ui/card';
import type { Screen } from '@/lib/types';
import { ShieldAlert, Share2, PhoneCall } from 'lucide-react';

type SafetyPageProps = {
    navigateTo: (screen: Screen) => void;
    onBack?: () => void;
};

const safetyFeatures = [
    {
        icon: Share2,
        title: "Share your ride",
        description: "Let your loved ones track your ride in real-time for peace of mind."
    },
    {
        icon: ShieldAlert,
        title: "Emergency SOS",
        description: "Tap the SOS button anytime during your ride to get emergency assistance."
    },
    {
        icon: PhoneCall,
        title: "24/7 Support",
        description: "Our support team is always available to help you with any issues."
    }
];

export default function SafetyPage({ navigateTo }: SafetyPageProps) {
    return (
        <Layout title="Safety" navigateTo={navigateTo}>
            <div className="p-4 space-y-4">
                {safetyFeatures.map((feature, index) => (
                    <Card key={index}>
                        <CardContent className="flex items-start gap-4 p-4">
                            <feature.icon className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
                            <div>
                                <h3 className="text-lg font-semibold">{feature.title}</h3>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </Layout>
    );
}
