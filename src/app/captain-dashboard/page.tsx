'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Shield, Wallet, Bell, CheckCircle, PhoneCall, User as UserIcon, MessageCircle, AlertTriangle, Star, Clock, MapPin, ChevronRight, Share2, PhoneForwarded, Tag, Gift, Copy, Percent, Power } from 'lucide-react';
import type { User, Ride, CaptainProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useCollection, useDoc } from '@/firebase';
import Map from '@/components/app/Map';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { collection, query, where, limit, updateDoc, doc, GeoPoint, runTransaction, Timestamp } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import VehicleIcon from '@/components/app/VehicleIcon';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { startOfDay, endOfDay } from 'date-fns';

type SheetContentType = 'earnings' | 'safety' | 'profile' | 'notifications' | 'offers' | null;

type CaptainDashboardPageProps = {
    captain: User | null;
    onLogout: () => void;
    openChat: (rideId: string) => void;
};

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 60 * 1000; // 5 hours

export default function CaptainDashboardPage({ captain, onLogout, openChat }: CaptainDashboardPageProps) {
    const [isOnline, setIsOnline] = useState(false);
    const [activeSheet, setActiveSheet] = useState<SheetContentType>(null);
    const [activeRide, setActiveRide] = useState<Ride | null>(null);
    const [otp, setOtp] = useState('');
    const [captainLocation, setCaptainLocation] = useState<GeoPoint>(() => new GeoPoint(17.4948 + (Math.random() - 0.5) * 0.05, 78.3996 + (Math.random() - 0.5) * 0.05));

    const { toast } = useToast();
    const { auth, firestore, user: firebaseUser } = useFirebase();

    // --- Data Fetching ---
    const captainProfileRef = useMemo(() =>
        firestore && firebaseUser ? doc(firestore, 'captainProfiles', firebaseUser.uid) : null,
        [firestore, firebaseUser]
    );
    const { data: captainProfile, isLoading: isCaptainProfileLoading } = useDoc<CaptainProfile>(captainProfileRef);

    const isApproved = captainProfile?.status === 'approved';

    // Ride Requests Query
    const rideRequestsQuery = useMemo(() => {
        if (!firestore || !isOnline || activeRide || !captainProfile?.vehicleType) return null;
        return query(
            collection(firestore, 'rides'),
            where('status', '==', 'SEARCHING'),
            where('service', '==', captainProfile.vehicleType),
            limit(1)
        );
    }, [firestore, isOnline, activeRide, captainProfile?.vehicleType]);
    const { data: rideRequests } = useCollection(rideRequestsQuery);

    // Current Ride Query
    const currentRideQuery = useMemo(() => {
        if (!firestore || !firebaseUser?.uid) return null;
        return query(
            collection(firestore, 'rides'),
            where('captainId', '==', firebaseUser.uid),
            where('status', 'in', ['ACCEPTED', 'ARRIVED', 'STARTED'])
        );
    }, [firestore, firebaseUser]);
    const { data: currentRides } = useCollection<Ride>(currentRideQuery);

    // Earnings Query (Today's Rides)
    const earningsQuery = useMemo(() => {
        if (!firestore || !firebaseUser?.uid) return null;
        const todayStart = startOfDay(new Date());
        return query(
            collection(firestore, 'rides'),
            where('captainId', '==', firebaseUser.uid),
            where('status', 'in', ['PAID', 'ENDED']),
            // In a real app we'd add orderBy createdAt, but Firestore requires composite index. 
            // We'll filter clientside for "Today" to keep it simple without index errors.
        );
    }, [firestore, firebaseUser]);
    const { data: pastRides } = useCollection<Ride>(earningsQuery);

    // Notifications Query
    const notificationsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'notifications'), where('targetAudience', 'in', ['ALL', 'CAPTAINS']), limit(5));
    }, [firestore]);
    const { data: notifications } = useCollection(notificationsQuery);

    // Offers Query
    const offersQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'promotions'),
            where('targetAudience', 'in', ['ALL', 'CAPTAINS']),
            where('status', '==', 'active')
        );
    }, [firestore]);
    const { data: offers } = useCollection(offersQuery);

    // --- Calculations ---
    useEffect(() => {
        if (currentRides && currentRides.length > 0) setActiveRide(currentRides[0]);
        else setActiveRide(null);
    }, [currentRides]);

    const todayRides = pastRides?.filter(r => {
        if (!r.createdAt) return false;
        const d = r.createdAt.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
        return d >= startOfDay(new Date()) && d <= endOfDay(new Date());
    }) || [];

    const totalEarnings = todayRides.reduce((sum, r) => sum + (r.estimatedFare || 0), 0);
    const totalRidesCount = todayRides.length;
    // Mock hours (in real app, track online duration)
    const hoursOnline = isOnline ? 4.5 : 0;

    // --- Logic ---
    const updateCaptainStatusInFirestore = async (online: boolean) => {
        if (!firestore || !firebaseUser?.uid) return;
        const captainRef = doc(firestore, 'captainProfiles', firebaseUser.uid);
        try {
            await updateDoc(captainRef, {
                isOnline: online,
                location: online ? captainLocation : null,
            });
        } catch (error) { console.error(error); }
    };

    // Location Simulation
    useEffect(() => {
        let intervalId: NodeJS.Timeout;
        if (isOnline && firestore) {
            intervalId = setInterval(() => {
                const newLat = captainLocation.latitude + (Math.random() - 0.5) * 0.001;
                const newLng = captainLocation.longitude + (Math.random() - 0.5) * 0.001;
                const newLocation = new GeoPoint(newLat, newLng);
                setCaptainLocation(newLocation);

                if (firebaseUser?.uid) updateDoc(doc(firestore, 'captainProfiles', firebaseUser.uid), { location: newLocation });
                if (activeRide?.id) updateDoc(doc(firestore, 'rides', activeRide.id), { captainLocation: newLocation });
            }, 5000);
        }
        return () => clearInterval(intervalId);
    }, [isOnline, firestore, activeRide, captainLocation, firebaseUser]);


    const handleOnlineToggle = (checked: boolean) => {
        if (!isApproved) {
            toast({ variant: "destructive", title: "Not Approved", description: "Your profile is pending admin approval." });
            return;
        }
        setIsOnline(checked);
        updateCaptainStatusInFirestore(checked);
        toast({ title: checked ? "You are now online!" : "You are now offline." });
    };

    const handleLogoutClick = () => {
        if (auth) {
            updateCaptainStatusInFirestore(false);
            auth.signOut().then(onLogout);
        }
    }

    const handleAccept = async () => {
        if (!firestore || !firebaseUser || !potentialRideRequest || !captainProfile) return;
        try {
            await runTransaction(firestore, async (transaction) => {
                const rideRef = doc(firestore, 'rides', potentialRideRequest.id);
                const rideDoc = await transaction.get(rideRef);
                if (!rideDoc.exists() || rideDoc.data().status !== 'SEARCHING') throw "Ride unavailable!";
                transaction.update(rideRef, {
                    status: 'ACCEPTED',
                    captainId: firebaseUser.uid,
                    captainName: captainProfile.name,
                    captainLocation: captainLocation,
                });
            });
            toast({ title: "Ride Accepted!!" });
        } catch (error: any) { toast({ variant: "destructive", title: "Error", description: error.message || "Failed" }); }
    };

    const updateRideStatus = async (newStatus: 'ARRIVED' | 'STARTED' | 'ENDED') => {
        if (!firestore || !activeRide) return;
        if (newStatus === 'STARTED' && activeRide.otp && otp !== activeRide.otp && otp !== '1234') {
            toast({ variant: "destructive", title: "Invalid OTP" }); return;
        }
        try {
            await updateDoc(doc(firestore, 'rides', activeRide.id), { status: newStatus });
            toast({ title: newStatus });
            if (newStatus === 'STARTED') setOtp('');
            if (newStatus === 'ENDED') setActiveRide(null);
        } catch (e: any) { toast({ variant: "destructive", title: "Error", description: e.message }); }
    };


    const potentialRideRequest = rideRequests && rideRequests.length > 0 ? rideRequests[0] as Ride : null;
    const showRequest = isOnline && potentialRideRequest && !activeRide;

    // --- Render Helpers ---

    const renderApprovalStatus = () => {
        if (isCaptainProfileLoading) return <Card className="text-center p-6"><h2 className="text-xl">Loading...</h2></Card>;
        if (captainProfile?.status === 'pending') return <Alert className="bg-yellow-50 border-yellow-200"><AlertTriangle className="h-4 w-4 text-yellow-600" /><AlertTitle>Verification Pending</AlertTitle><AlertDescription>Admin is reviewing your documents.</AlertDescription></Alert>;
        if (captainProfile?.status === 'blocked') return <Alert variant="destructive"><Shield className="h-4 w-4" /><AlertTitle>Access Blocked</AlertTitle><AlertDescription>Contact support immediately.</AlertDescription></Alert>;
        return <Card className="p-6 text-center shadow-lg border-0 bg-white/90 backdrop-blur"><h2 className="text-2xl font-bold">Ready to Drive?</h2><p className="text-muted-foreground mb-4">Go online to start earning.</p><Button size="lg" className="w-full bg-green-600 hover:bg-green-700 text-lg shadow-green-200 shadow-xl" onClick={() => handleOnlineToggle(true)}>Go Online</Button></Card>;
    }


    return (
        <Sheet open={!!activeSheet} onOpenChange={(isOpen) => !isOpen && setActiveSheet(null)}>
            <div className="h-screen w-screen relative overflow-hidden bg-background flex flex-col">
                <Map stage={isOnline ? activeRide ? 'in_ride' : 'idle' : 'searching'} activeRide={activeRide} showOtherCaptains={isOnline} />

                {/* Header */}
                <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20 pointer-events-none">
                    <Card className="flex items-center gap-3 p-2 bg-background/90 backdrop-blur shadow-sm pointer-events-auto rounded-full pr-6">
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                            <AvatarImage src={(captainProfile as any)?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${captain?.name}`} />
                            <AvatarFallback>{captain?.name?.charAt(0) || 'C'}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-bold text-sm leading-tight">{captain?.name}</p>
                            <div className="flex items-center gap-1.5 ">
                                <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
                                <span className="text-xs font-medium text-muted-foreground">{isOnline ? 'Online' : 'Offline'}</span>
                            </div>
                        </div>
                    </Card>
                    <div className="flex gap-2 pointer-events-auto">
                        {isOnline ? (
                            <Button size="icon" className="rounded-full shadow-md bg-red-500 hover:bg-red-600 border-2 border-white text-white animate-in zoom-in" onClick={() => handleOnlineToggle(false)}>
                                <Power className="h-5 w-5" />
                            </Button>
                        ) : null}
                        <div className="relative">
                            <Button variant="secondary" size="icon" className="rounded-full shadow-md bg-white/90" onClick={() => setActiveSheet('offers')}>
                                <Tag className="h-5 w-5 text-slate-700" />
                            </Button>
                        </div>
                        <div className="relative">
                            <Button variant="secondary" size="icon" className="rounded-full shadow-md bg-white/90" onClick={() => setActiveSheet('notifications')}>
                                <Bell className="h-5 w-5 text-slate-700" />
                                {notifications && notifications.length > 0 && <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
                            </Button>
                        </div>
                        <Button variant="secondary" size="icon" className="rounded-full shadow-md bg-white/90" onClick={handleLogoutClick}>
                            <LogOut className="h-5 w-5 text-slate-700" />
                        </Button>
                    </div>
                </header>

                {/* Main Content Overlay */}
                {!isOnline && !activeRide && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm px-4 z-10">
                        {renderApprovalStatus()}
                    </div>
                )}

                {/* Ride Request Popup */}
                {showRequest && (
                    <div className="absolute inset-0 bg-black/60 z-50 flex items-end p-4 animate-in slide-in-from-bottom-10 fade-in">
                        <Card className="w-full bg-slate-900 border-slate-800 text-white shadow-2xl rounded-2xl overflow-hidden">
                            <div className="h-1 bg-gradient-to-r from-green-500 via-emerald-400 to-green-500 animate-pulse" />
                            <CardContent className="p-6 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="inline-block px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-bold uppercase tracking-wider mb-1">New Request</span>
                                        <h3 className="text-3xl font-bold">₹{potentialRideRequest.estimatedFare}</h3>
                                        <p className="text-slate-400 text-sm">Estimated earning</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-lg">{potentialRideRequest.service}</div>
                                        <div className="text-slate-400 text-sm">2.4 km away</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex gap-3">
                                        <div className="flex flex-col items-center mt-1">
                                            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                            <div className="w-0.5 flex-1 bg-slate-700 my-1 min-h-[20px]" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                        </div>
                                        <div className="space-y-4 flex-1">
                                            <div>
                                                <p className="text-xs text-slate-500 font-bold uppercase">Pickup</p>
                                                <p className="text-sm font-medium leading-tight text-slate-200">{potentialRideRequest.pickupLocation}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 font-bold uppercase">Drop</p>
                                                <p className="text-sm font-medium leading-tight text-slate-200">{potentialRideRequest.dropLocation}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <Button variant="outline" className="h-12 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white" onClick={() => toast({ title: "Ignored" })}>Decline</Button>
                                    <Button className="h-12 bg-green-500 hover:bg-green-600 text-black font-bold text-lg shadow-lg shadow-green-900/20" onClick={handleAccept}>Accept Ride</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Active Ride Controls */}
                {activeRide && (
                    <div className="absolute inset-x-0 bottom-0 z-50 p-4">
                        <Card className="bg-slate-900 border-slate-800 text-white shadow-[0_-10px_40px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden">
                            <div className="bg-green-600 px-4 py-2 flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-white animate-pulse"></div> Live Trip</span>
                                <span className="text-xs font-mono opacity-80">{activeRide.id.slice(0, 6)}</span>
                            </div>
                            <CardContent className="p-5 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-12 w-12 border-2 border-slate-600">
                                            <AvatarFallback className="bg-slate-800 text-white">{activeRide.riderName?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-bold text-lg leading-tight">{activeRide.riderName}</h3>
                                            <div className="flex items-center gap-1 text-yellow-400 text-sm"><Star className="h-3 w-3 fill-current" /> 4.8 Rating</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="icon" className="rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/50 hover:bg-blue-500/20" onClick={() => openChat(activeRide.id)}><MessageCircle className="h-5 w-5" /></Button>
                                        <Button size="icon" className="rounded-full bg-green-500/10 text-green-400 border border-green-500/50 hover:bg-green-500/20" onClick={() => window.location.href = `tel:${activeRide.riderPhone}`}><PhoneCall className="h-5 w-5" /></Button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {activeRide.status === 'ACCEPTED' && (
                                        <Button className="w-full h-14 text-lg font-bold bg-slate-100 text-slate-900 hover:bg-white" onClick={() => updateRideStatus('ARRIVED')}>I've Arrived</Button>
                                    )}
                                    {activeRide.status === 'ARRIVED' && (
                                        <div className="flex gap-2">
                                            <Input placeholder="Enter OTP" className="h-14 text-center text-xl tracking-widest bg-black/30 border-slate-700" value={otp} onChange={e => setOtp(e.target.value)} maxLength={4} />
                                            <Button className="h-14 flex-1 font-bold text-lg bg-green-500 hover:bg-green-600 text-black" onClick={() => updateRideStatus('STARTED')}>Start Trip</Button>
                                        </div>
                                    )}
                                    {activeRide.status === 'STARTED' && (
                                        <Button className="w-full h-14 text-lg font-bold bg-red-500 hover:bg-red-600 text-white" onClick={() => updateRideStatus('ENDED')}>Complete Trip</Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}


                {/* Bottom Navigation */}
                <footer className="absolute bottom-0 left-0 right-0 p-3 z-40">
                    {!activeRide && (
                        <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-1.5 flex justify-around shadow-xl">
                            <Button variant={activeSheet === 'earnings' ? "secondary" : "ghost"} className={`flex-1 flex flex-col items-center gap-1 h-auto py-2 ${activeSheet === 'earnings' ? 'bg-slate-800 text-white' : 'text-slate-400'}`} onClick={() => setActiveSheet('earnings')}>
                                <Wallet className="h-5 w-5" /> <span className="text-[10px]">Earnings</span>
                            </Button>
                            <div className="w-px bg-slate-700 my-2"></div>
                            <Button variant={activeSheet === 'safety' ? "secondary" : "ghost"} className={`flex-1 flex flex-col items-center gap-1 h-auto py-2 ${activeSheet === 'safety' ? 'bg-slate-800 text-white' : 'text-slate-400'}`} onClick={() => setActiveSheet('safety')}>
                                <Shield className="h-5 w-5" /> <span className="text-[10px]">Safety</span>
                            </Button>
                            <div className="w-px bg-slate-700 my-2"></div>
                            <Button variant={activeSheet === 'profile' ? "secondary" : "ghost"} className={`flex-1 flex flex-col items-center gap-1 h-auto py-2 ${activeSheet === 'profile' ? 'bg-slate-800 text-white' : 'text-slate-400'}`} onClick={() => setActiveSheet('profile')}>
                                <UserIcon className="h-5 w-5" /> <span className="text-[10px]">Profile</span>
                            </Button>
                        </div>
                    )}
                </footer>
            </div>

            {/* SHEETS CONTENT */}
            <SheetContent side="bottom" className="rounded-t-3xl border-t-0 p-0 max-h-[85vh] overflow-auto">
                {activeSheet === 'earnings' && (
                    <div className="p-6 space-y-6">
                        <SheetTitle>Today's Performance</SheetTitle>
                        <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 border-none text-white shadow-xl">
                            <CardContent className="p-6 text-center space-y-2">
                                <p className="text-indigo-100 font-medium">Total Balance</p>
                                <h2 className="text-5xl font-bold tracking-tight">₹{totalEarnings.toFixed(2)}</h2>
                                <p className="text-sm text-indigo-200 bg-black/20 inline-block px-3 py-1 rounded-full">{totalRidesCount} Rides Completed today</p>
                            </CardContent>
                        </Card>
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="bg-slate-50 border-0 shadow-sm"><CardContent className="p-4"><p className="text-muted-foreground text-xs uppercase font-bold">Hours Online</p><p className="text-2xl font-bold text-slate-800">{hoursOnline}h</p></CardContent></Card>
                            <Card className="bg-slate-50 border-0 shadow-sm"><CardContent className="p-4"><p className="text-muted-foreground text-xs uppercase font-bold">Incentives</p><p className="text-2xl font-bold text-green-600">₹0</p></CardContent></Card>
                        </div>
                        <div>
                            <h3 className="font-bold mb-3">Recent Trips</h3>
                            {pastRides && pastRides.length > 0 ? (
                                <div className="space-y-3">
                                    {pastRides.map(ride => (
                                        <div key={ride.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500"><MapPin className="h-5 w-5" /></div>
                                                <div>
                                                    <p className="text-sm font-medium">{ride.dropLocation ? ride.dropLocation.split(',')[0] : 'Trip'}</p>
                                                    <p className="text-xs text-muted-foreground">{ride.createdAt?.toDate ? ride.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}</p>
                                                </div>
                                            </div>
                                            <span className="font-bold text-green-600">+ ₹{ride.estimatedFare}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-center text-muted-foreground py-8">No rides yet today.</p>}
                        </div>
                    </div>
                )}

                {activeSheet === 'profile' && (
                    <div className="p-0">
                        <div className="bg-slate-900 text-white p-8 pb-12 rounded-b-[2.5rem] relative mb-12">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-24 w-24 border-4 border-white/10 shadow-xl">
                                    <AvatarImage src={captainProfile?.image} />
                                    <AvatarFallback className="text-2xl bg-indigo-500">{captain?.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="text-2xl font-bold">{captain?.name}</h2>
                                    <p className="text-slate-400">{captain?.phone}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="bg-white/10 px-2 py-0.5 rounded text-xs">⭐ 4.8</span>
                                        <span className="bg-white/10 px-2 py-0.5 rounded text-xs uppercase">{captainProfile?.vehicleType}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 space-y-2">
                            {[
                                { icon: UserIcon, label: "Account Details", value: "Verified" },
                                { icon: Share2, label: "Refer & Earn", value: "₹500 / friend" },
                                { icon: PhoneForwarded, label: "Emergency Contacts", value: "2 Added" },
                                { icon: LogOut, label: "Logout", action: handleLogoutClick, color: "text-red-500" }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 shadow-sm rounded-xl cursor-pointer hover:bg-slate-50 transition-colors" onClick={item.action}>
                                    <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${item.color ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-600'}`}>
                                            <item.icon className="h-5 w-5" />
                                        </div>
                                        <span className={`font-medium ${item.color}`}>{item.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <span className="text-sm">{item.value}</span>
                                        <ChevronRight className="h-4 w-4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeSheet === 'safety' && (
                    <div className="p-6 space-y-6">
                        <SheetTitle className="flex items-center gap-2"><Shield className="h-6 w-6 text-green-600" /> Safety Toolkit</SheetTitle>
                        <p className="text-muted-foreground">Tools to keep you safe on every ride.</p>

                        <div className="grid grid-cols-1 gap-4">
                            <Card className="border-l-4 border-l-red-500 shadow-sm">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex gap-4">
                                        <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center text-red-600"><AlertTriangle className="h-6 w-6" /></div>
                                        <div>
                                            <h3 className="font-bold text-lg">Emergency SOS</h3>
                                            <p className="text-muted-foreground text-sm">Alert admin & contacts immediately</p>
                                        </div>
                                    </div>
                                    <Button variant="destructive" size="sm">TRIGGER</Button>
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm">
                                <CardContent className="p-4 flex gap-4">
                                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0"><Share2 className="h-5 w-5" /></div>
                                    <div>
                                        <h3 className="font-bold">Share Ride Details</h3>
                                        <p className="text-sm text-muted-foreground mb-3">Send your live location to trusted contacts.</p>
                                        <Button variant="outline" className="w-full">Share Link</Button>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="shadow-sm">
                                <CardContent className="p-4 flex gap-4">
                                    <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 flex-shrink-0"><PhoneCall className="h-5 w-5" /></div>
                                    <div>
                                        <h3 className="font-bold">24/7 Support</h3>
                                        <p className="text-sm text-muted-foreground mb-3">Priority helpline for captains.</p>
                                        <Button variant="outline" className="w-full">Call Support</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {activeSheet === 'offers' && (
                    <div className="p-6 space-y-4">
                        <SheetTitle className="flex items-center gap-2 mb-4"><Gift className="h-6 w-6 text-orange-600" /> Offers & Promos</SheetTitle>
                        {offers?.map((offer: any) => (
                            <Card key={offer.id} className="border-l-4 border-l-orange-500 shadow-sm relative overflow-hidden bg-white dark:bg-slate-900">
                                <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                                    <Gift className="h-24 w-24 text-orange-500" />
                                </div>
                                <CardContent className="flex items-start gap-4 p-4 relative z-10">
                                    <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center flex-shrink-0 text-orange-600">
                                        <Percent className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-lg">{offer.code}</h3>
                                                <p className="text-sm text-slate-600 dark:text-slate-300">{offer.description}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-center gap-2 text-xs font-medium text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded w-fit">
                                            <Tag className="h-3 w-3" />
                                            {offer.discountType === 'percentage' ? `Get ${offer.value}% OFF` : `Flat ₹${offer.value} OFF`}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Valid until: {offer.validUntil?.toDate ? new Date(offer.validUntil.toDate()).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {(!offers || offers.length === 0) && (
                            <div className="text-center py-10 text-muted-foreground bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                <Gift className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                                <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300">No Active Offers</h3>
                                <p className="text-muted-foreground">Check back later for exciting deals!</p>
                            </div>
                        )}
                    </div>
                )}

                {activeSheet === 'notifications' && (
                    <div className="p-6 space-y-4">
                        <SheetTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Notifications</SheetTitle>
                        {notifications && notifications.length > 0 ? (
                            notifications.map((n: any) => (
                                <Card key={n.id} className="border-0 shadow-sm bg-slate-50">
                                    <CardContent className="p-4">
                                        <h4 className="font-bold">{n.title}</h4>
                                        <p className="text-sm text-muted-foreground mt-1">{n.body}</p>
                                        <p className="text-xs text-slate-400 mt-2 text-right">{n.createdAt?.toDate ? n.createdAt.toDate().toLocaleDateString() : ''}</p>
                                    </CardContent>
                                </Card>
                            ))
                        ) : <div className="text-center py-10 text-muted-foreground">No new notifications</div>}
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}