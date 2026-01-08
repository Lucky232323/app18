'use client';
import { useState, useMemo } from 'react';
import Layout from '@/components/app/Layout';
import { Card, CardContent } from '@/components/ui/card';
import type { Screen } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Wallet, Landmark, Tag, Ticket, Plus, CreditCard, Banknote } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Image from 'next/image';
import { useFirebase, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, where, orderBy, limit } from 'firebase/firestore';

type PaymentsPageProps = {
    navigateTo: (screen: Screen) => void;
    onBack?: () => void;
};

// ... Icons (AmazonPay, Upi, Paytm) ...
const AmazonPayIcon = () => (
    <div className="h-8 w-12 bg-white border rounded flex items-center justify-center p-1">
        <svg viewBox="0 0 49 14" className="w-full h-full">
            <path d="M9.993 12.922h4.153v1.89H5.72V-1.84h4.273v14.762z" fill="#000"></path>
            <path d="M21.19 13.06c2.618 0 4.23-1.428 4.23-3.692 0-2.22-1.57-3.623-4.13-3.623h-2.58v7.315h2.48zm-2.48-8.834h2.41c1.55 0 2.617.773 2.617 2.11 0 1.355-1.023 2.132-2.595 2.132h-2.432v-4.242z" fill="#000"></path>
            <path d="M43.08-1.84V14.89h-3.958L34.33.475l.182 14.415h-4.04V-1.84h3.957l4.774 14.38.18-14.38h3.655v.025z" fill="#000"></path>
        </svg>
    </div>
)

const UpiIcon = () => (
    <svg width="40" height="24" viewBox="0 0 62 21" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3.775 20.354V.948h5.922c1.871 0 3.327.429 4.368 1.287 1.04 0.858 1.56 2.052 1.56 3.582 0 1.23-.332 2.274-.994 3.132-0.662 0.858-1.576 1.47-2.742 1.836v.156c1.47.312 2.613 1.002 3.429 2.07 0.816 1.068 1.224 2.418 1.224 4.05 0 1.704-.546 3.036-1.638 3.996-1.092 0.96-2.613 1.44-4.563 1.44H3.775zm3.831-10.98c1.326 0 2.28-.195 2.862-.585 0.582-0.39 0.873-1.03 0.873-1.92 0-0.874-.273-1.524-.819-1.95-.546-0.429-1.443-0.643-2.691-0.643H6.42v5.1H7.606zm.063 8.19c1.625 0 2.829-.273 3.612-.819 0.783-0.546 1.175-1.411 1.175-2.583 0-1.14-.383-1.998-1.149-2.574-0.767-0.576-1.892-0.864-3.375-0.864H6.42v6.84h1.311v-0.001zM28.098 1.04h3.64V20.4H28.1V1.04zM36.19 1.04h15.933v3.024H39.83V9.22h11.4v3.023H39.83v5.254h12.3V20.4H36.19V1.04z" fill="url(#paint0_linear_1_2)"></path>
        <path d="M28.098 1.04h3.64V20.4H28.1V1.04z" fill="url(#paint1_linear_1_2)"></path>
        <path d="M36.19 1.04h15.933v3.024H39.83V9.22h11.4v3.023H39.83v5.254h12.3V20.4H36.19V1.04z" fill="url(#paint2_linear_1_2)"></path>
        <defs>
            <linearGradient id="paint0_linear_1_2" x1="32.595" y1="10.676" x2="32.595" y2="20.4" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F58721"></stop><stop offset="1" stopColor="#FCAF19"></stop>
            </linearGradient>
            <linearGradient id="paint1_linear_1_2" x1="29.918" y1="10.72" x2="29.918" y2="20.4" gradientUnits="userSpaceOnUse">
                <stop stopColor="#254390"></stop><stop offset="1" stopColor="#0E9445"></stop>
            </linearGradient>
            <linearGradient id="paint2_linear_1_2" x1="44.156" y1="10.72" x2="44.156" y2="20.4" gradientUnits="userSpaceOnUse">
                <stop stopColor="#254390"></stop><stop offset="1" stopColor="#0E9445"></stop>
            </linearGradient>
        </defs>
    </svg>
)

const PaytmIcon = () => (
    <svg width="60" height="20" viewBox="0 0 91 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M90.87 23.366V8.625h-5.91L75.39 20.36v-11.72h-6.04V23.37h5.91L84.81 11.64v11.73h6.06z" fill="#002E6E"></path>
        <path d="M48.273 23.366h6.35c4.7 0 7.82-2.3 7.82-5.98 0-3.67-3.13-5.97-7.82-5.97h-6.35v11.95zm6.05-1.95h.3c2.72 0 4.1-1.22 4.1-4.02 0-2.8-1.38-4.02-4.1-4.02h-.3v8.04z" fill="#00B9F1"></path>
        <path d="M31.64 8.625h13.23v2.85H37.6v11.9h-5.96V8.625zM17.76 8.625h10.9v2.85h-4.94v3.13h4.42v2.84h-4.42v3.07h4.94v2.85h-10.9V8.625z" fill="#002E6E"></path>
        <path d="M.48 8.625h6.34c4.7 0 7.82 2.3 7.82 5.97s-3.13 5.97-7.82 5.97H.48V8.625zm6.05 11.9c2.72 0 4.1-1.21 4.1-4.01 0-2.8-1.38-4.02-4.1-4.02h-.3v8.03h.3z" fill="#00B9F1"></path>
    </svg>
)

export default function PaymentsPage({ navigateTo, onBack }: PaymentsPageProps) {
    const [selectedPayment, setSelectedPayment] = useState('rapido-wallet');
    const { firestore, user } = useFirebase();

    const userDocRef = useMemo(() =>
        firestore && user ? doc(firestore, 'userProfiles', user.uid) : null,
        [firestore, user]);

    const { data: userProfile } = useDoc(userDocRef);
    const walletBalance = userProfile?.walletBalance || 0;

    // Fetch recent rides
    const transactionsQuery = useMemo(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'rides'),
            where('userId', '==', user.uid),
            where('status', 'in', ['PAID', 'ENDED']),
            orderBy('createdAt', 'desc'),
            limit(5)
        );
    }, [firestore, user]);

    const { data: recentTransactions } = useCollection(transactionsQuery);

    return (
        <Layout title="Payments" navigateTo={navigateTo} onBack={onBack}>
            <div className="bg-slate-50 min-h-screen pb-20">
                {/* Wallet Balance Card */}
                <div className="bg-white p-6 shadow-sm mb-2">
                    <p className="text-sm font-medium text-muted-foreground mb-1">TOTAL BALANCE</p>
                    <div className="flex justify-between items-center">
                        <h1 className="text-4xl font-bold">₹{walletBalance.toFixed(2)}</h1>
                        <Button
                            className="rounded-full px-6 bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-200"
                            onClick={() => navigateTo('wallet')}
                        >
                            <Plus className="h-4 w-4 mr-1" /> ADD MONEY
                        </Button>
                    </div>
                </div>

                <div className="p-4 space-y-6">
                    {/* Payment Methods */}
                    <div>
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">Payment Methods</h3>
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden divide-y">

                            {/* RIDER APP Wallet */}
                            <div className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedPayment('rapido-wallet')}>
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                        <Wallet className="h-5 w-5 text-yellow-700" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-base">RIDER APP Wallet</p>
                                        <p className="text-sm text-green-600 font-medium">Link & Pay</p>
                                    </div>
                                </div>
                                <div className="h-5 w-5 rounded-full border-2 border-slate-300 flex items-center justify-center">
                                    {selectedPayment === 'rapido-wallet' && <div className="h-3 w-3 bg-primary rounded-full" />}
                                </div>
                            </div>

                            {/* UPI */}
                            <div className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedPayment('upi')}>
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center">
                                        <Landmark className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-base">UPI</p>
                                        <p className="text-xs text-muted-foreground">Google Pay, PhonePe, Paytm</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" className="text-primary font-bold">LINK</Button>
                            </div>

                            {/* Cash */}
                            <div className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedPayment('cash')}>
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-green-50 rounded-full flex items-center justify-center">
                                        <Banknote className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-base">Cash</p>
                                        <p className="text-xs text-muted-foreground">Pay at the end of the trip</p>
                                    </div>
                                </div>
                                <div className="h-5 w-5 rounded-full border-2 border-slate-300 flex items-center justify-center">
                                    {selectedPayment === 'cash' && <div className="h-3 w-3 bg-primary rounded-full" />}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pay Later / Offers Highlight */}
                    <div className="grid grid-cols-2 gap-3">
                        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-lg">
                            <CardContent className="p-4 relative overflow-hidden">
                                <div className="absolute right-0 top-0 p-3 opacity-20">
                                    <CreditCard className="h-16 w-16" />
                                </div>
                                <p className="text-xs font-medium opacity-80 mb-1">RIDER APP</p>
                                <h3 className="text-lg font-bold mb-4">Pay Later</h3>
                                <Button size="sm" variant="secondary" className="w-full text-indigo-700 font-bold h-8">Activate Now</Button>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-orange-400 to-red-500 text-white border-0 shadow-lg">
                            <CardContent className="p-4 relative overflow-hidden">
                                <div className="absolute right-0 top-0 p-3 opacity-20">
                                    <Tag className="h-16 w-16" />
                                </div>
                                <p className="text-xs font-medium opacity-80 mb-1">OFFERS</p>
                                <h3 className="text-lg font-bold mb-4">View All</h3>
                                <Button size="sm" variant="secondary" className="w-full text-orange-700 font-bold h-8" onClick={() => navigateTo('offers')}>Check Offers</Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Transactions */}
                    <div>
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">Recent Transactions</h3>
                        <div className="space-y-3">
                            {recentTransactions && recentTransactions.length > 0 ? (
                                recentTransactions.map((tx: any) => (
                                    <div key={tx.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center">
                                                <div className="text-xs font-bold text-slate-600">
                                                    {tx.createdAt?.toDate ? tx.createdAt.toDate().getDate() : 'DD'}
                                                    <br />
                                                    {tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleString('default', { month: 'short' }).toUpperCase() : 'MM'}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">Ride Completed</p>
                                                <p className="text-xs text-muted-foreground">{tx.dropLocation || 'Destination'}</p>
                                            </div>
                                        </div>
                                        <span className="font-bold text-base text-slate-800">₹{Math.round(tx.estimatedFare || tx.fare || 0)}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 bg-white rounded-xl border-dashed border-2 border-slate-200">
                                    <p className="text-muted-foreground text-sm">No recent transactions</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
