'use client';
import { useMemo } from 'react';
import Layout from '@/components/app/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tag, Copy, Percent, Gift } from 'lucide-react';
import { useFirebase, useCollection } from '@/firebase';
import { collection, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import type { Screen } from '@/lib/types';


type OffersPageProps = {
    navigateTo: (screen: Screen) => void;
    onBack?: () => void;
};

export default function OffersPage({ navigateTo, onBack }: OffersPageProps) {
    const { firestore } = useFirebase();
    const { toast } = useToast();

    const offersQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'promotions'),
            where('targetAudience', 'in', ['ALL', 'RIDERS']),
            where('status', '==', 'active')
            // In real app, we would add expiration check in query or security rules
        );
    }, [firestore]);

    const { data: offers, isLoading } = useCollection(offersQuery);

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        toast({ title: "Copied!", description: `Code ${code} copied to clipboard.` });
    };

    return (
        <Layout title="Offers & Promos" navigateTo={navigateTo} onBack={onBack}>
            <div className="p-4 space-y-4">
                {isLoading && <p className="text-center py-4 text-muted-foreground">Loading offers...</p>}

                {offers?.map((offer: any) => (
                    <Card key={offer.id} className="border-l-4 border-l-orange-500 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                            <Gift className="h-24 w-24" />
                        </div>
                        <CardContent className="flex items-start gap-4 p-4 relative z-10">
                            <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 text-orange-600">
                                <Percent className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg">{offer.code}</h3>
                                        <p className="text-sm text-muted-foreground">{offer.description}</p>
                                    </div>
                                    <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => handleCopy(offer.code)}>
                                        <Copy className="h-3 w-3" /> Copy
                                    </Button>
                                </div>
                                <div className="mt-3 flex items-center gap-2 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded w-fit">
                                    <Tag className="h-3 w-3" />
                                    {offer.discountType === 'percentage' ? `Get ${offer.value}% OFF` : `Flat ₹${offer.value} OFF`}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Valid until: {offer.validUntil?.toDate ? format(offer.validUntil.toDate(), 'PP') : 'N/A'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {!isLoading && (!offers || offers.length === 0) && (
                    <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <Gift className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                        <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300">No Active Offers</h3>
                        <p className="text-muted-foreground">Check back later for exciting deals!</p>
                    </div>
                )}
            </div>
        </Layout>
    );
}
