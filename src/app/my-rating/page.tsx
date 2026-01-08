'use client';
import Layout from '@/components/app/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Screen } from '@/lib/types';
import { MessageCircle, Clock, Shield, Smile, Star } from 'lucide-react';

type MyRatingPageProps = {
    navigateTo: (screen: Screen) => void;
    onBack?: () => void;
};

const ratingInfo = [
    { icon: MessageCircle, title: "Know your Captain", description: "Be respectful and clear in your communication." },
    { icon: Clock, title: "Timely", description: "Be ready for pickup to avoid making your captain wait." },
    { icon: Shield, title: "Safety", description: "Follow safety guidelines during your ride." },
    { icon: Smile, title: "Courtesy", description: "A friendly attitude makes the ride better for everyone." },
];

export default function MyRatingPage({ navigateTo, onBack }: MyRatingPageProps) {
    return (
        <Layout title="My Rating" navigateTo={navigateTo} onBack={onBack}>
            <div className="bg-secondary/30">
                <div className="p-8 text-center">
                    <div className="inline-block relative">
                        <Star className="h-32 w-32 text-primary" fill="hsl(var(--primary))" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <p className="text-primary-foreground text-4xl font-bold">4.85</p>
                        </div>
                    </div>
                    <p className="text-muted-foreground mt-4">Your Rating</p>
                    <p className="text-muted-foreground mt-1">Based on your last 50 rides</p>
                </div>
            </div>
            <div className="p-4 space-y-6 -mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle>How your rating is calculated</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Your rating is an average of the ratings you've received from captains. Here are some tips to maintain a high rating:</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 space-y-4">
                        {ratingInfo.map((info, index) => (
                            <div key={index} className="flex items-start gap-4">
                                <div className="flex-shrink-0 bg-primary/10 p-2 rounded-full">
                                    <info.icon className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">{info.title}</h3>
                                    <p className="text-sm text-muted-foreground">{info.description}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
