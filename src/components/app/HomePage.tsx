'use client';

import { useState, useEffect, useMemo } from 'react';
import Map from './Map';
import SearchSheet from './SearchSheet';
import BookingSheet from './BookingSheet';
import FindingCaptainSheet from './FindingCaptainSheet';
import RideStatusSheet from './RideStatusSheet';
import TripSummarySheet from './TripSummarySheet';
import SideMenu from './SideMenu';
import { Button } from '@/components/ui/button';
import { Menu, User, Crosshair, ShieldAlert, Bell, Bike, Car, Package } from 'lucide-react';
import type { Ride, Screen, Service, User as UserType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useDoc } from '@/firebase';
import { addDoc, collection, doc, serverTimestamp, updateDoc, getDoc } from 'firebase/firestore';

type Stage = 'idle' | 'searching' | 'selecting_service' | 'finding_captain' | 'in_ride' | 'trip_summary';

type HomePageProps = {
  user: UserType | null;
  onRideComplete: (ride: Ride) => void;
  navigateTo: (screen: Screen) => void;
  handleLogout: () => void;
  openChat: (rideId: string) => void;
  activeRideId: string | null;
  onActiveRideIdChange: (rideId: string | null) => void;
  initialSideMenuOpen?: boolean;
};

export default function HomePage({ user, onRideComplete, navigateTo, handleLogout, openChat, activeRideId, onActiveRideIdChange: setActiveRideId, initialSideMenuOpen = false }: HomePageProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [sideMenuOpen, setSideMenuOpen] = useState(initialSideMenuOpen);
  const [pickup, setPickup] = useState('Your Current Location');
  const [destination, setDestination] = useState('');
  const [selectedService, setSelectedService] = useState<Service['id']>('Bike');
  const [mapCenter, setMapCenter] = useState<{ lat: number, lng: number } | null>(null);
  const [platformConfig, setPlatformConfig] = useState<any>(null); // To store dynamic pricing

  const { toast } = useToast();
  const { firestore, user: firebaseUser } = useFirebase();

  // --- 1. ACCESS CONTROL: Check User Status ---
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!firestore || !firebaseUser) return;
      try {
        const userRef = doc(firestore, 'userProfiles', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && userSnap.data().status === 'blocked') {
          toast({ variant: 'destructive', title: "Account Blocked", description: "Your account has been blocked. Please contact admin." });
          handleLogout();
        }
      } catch (e) { console.error("Error checking status", e); }
    };
    checkUserStatus();
  }, [firestore, firebaseUser, handleLogout, toast]);

  // --- 2. DYNAMIC PRICING: Fetch Platform Config ---
  useEffect(() => {
    const fetchConfig = async () => {
      if (!firestore) return;
      try {
        const configRef = doc(firestore, 'config', 'platform');
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
          setPlatformConfig(configSnap.data());
        }
      } catch (e) {
        // Fallback values if config fetch fails
        setPlatformConfig({ baseFare: 40, perKmRate: 15 });
      }
    };
    fetchConfig();
  }, [firestore]);


  const rideDocRef = useMemo(() =>
    firestore && activeRideId ? doc(firestore, 'rides', activeRideId) : null,
    [firestore, activeRideId]);

  const { data: rideData, isLoading: isRideLoading } = useDoc(rideDocRef);

  useEffect(() => {
    if (!isRideLoading && rideData) {
      switch (rideData.status) {
        case 'SEARCHING':
          setStage('finding_captain');
          break;
        case 'ACCEPTED':
        case 'ARRIVED':
        case 'STARTED':
          setStage('in_ride');
          break;
        case 'ENDED':
          setStage('trip_summary');
          break;
        case 'PAID':
        case 'CANCELLED':
          resetToIdle();
          break;
      }
    }
  }, [rideData, isRideLoading, activeRideId]);

  // --- 4. OFFERS: Fetch Active Promotions ---
  const [promotions, setPromotions] = useState<any[]>([]);
  useEffect(() => {
    const fetchPromos = async () => {
      if (!firestore) return;
      try {
        const q = collection(firestore, 'promotions'); // Simplified query for demo to ensure data shows
        const snap = await import('firebase/firestore').then(mod => mod.getDocs(q));
        const promos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setPromotions(promos);
      } catch (e) { console.error("Error fetching promos", e); }
    };
    fetchPromos();
  }, [firestore]);


  const handleDestinationSelect = (p: string, d: string, coords?: { lat: number, lng: number }) => {
    setPickup(p);
    setDestination(d);
    if (coords) setMapCenter(coords);
    setStage('selecting_service');
  };

  const handleBook = async (service: Service['id'], details?: any) => {
    if (!firestore || !firebaseUser || !user) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to book a ride." });
      return;
    }

    setStage('finding_captain');

    // Calculate Dynamic Fare
    let baseFare = platformConfig?.baseFare || 40; // Default fallback
    let perKm = platformConfig?.perKmRate || 12;   // Default fallback

    // Very basic distance simulation (random between 2km - 15km)
    const simulatedDistance = Math.floor(Math.random() * 13) + 2;

    let fare = baseFare + (simulatedDistance * perKm);

    // Service Multipliers
    if (service === 'Auto') fare *= 1.2;
    if (service === 'Cab') fare *= 1.8;

    try {
      const ridePayload = {
        userId: firebaseUser.uid, // Standardized field for queries
        riderId: firebaseUser.uid, // Keep for backward compatibility if needed
        riderName: user.name,
        riderPhone: user.phone,
        pickupLocation: pickup,
        dropLocation: destination,
        status: 'SEARCHING',
        service: service,
        estimatedFare: Math.round(fare), // Use dynamic calculation
        bookingMode: details?.bookingMode || 'daily',
        rentalPackage: details?.rentalPackage || null,
        receiverName: details?.receiverName || null,
        receiverPhone: details?.receiverPhone || null,
        createdAt: serverTimestamp(),
        paymentMethod: 'Cash',
        otp: Math.floor(1000 + Math.random() * 9000).toString(), // Generate 4-digit OTP
      };

      const ridesCollection = collection(firestore, "rides");
      const docRef = await addDoc(ridesCollection, ridePayload);
      setActiveRideId(docRef.id);

    } catch (error: any) {
      console.error("Booking process failed", error);
      toast({
        variant: "destructive",
        title: "Booking Failed",
        description: error.message || "Could not create a ride request. Please try again.",
      });
      setStage('selecting_service');
    }
  };

  const handleCancelSearch = async () => {
    if (!firestore || !activeRideId) return;
    const rideRef = doc(firestore, 'rides', activeRideId);
    await updateDoc(rideRef, { status: 'CANCELLED' });
    resetToIdle();
  };

  const handleRideCompletion = async () => {
    if (rideData && activeRideId && firestore) {
      const finalRide: Ride = {
        id: activeRideId,
        captain: {
          name: rideData.captainName || 'Captain',
          vehicle: 'KA-01-AB-1234',
          rating: 4.8,
          image: 'https://picsum.photos/seed/captain/100/100',
        },
        pickup: rideData.pickupLocation,
        destination: rideData.dropLocation,
        fare: rideData.estimatedFare,
        service: rideData.service,
        date: new Date().toISOString(),
      };
      onRideComplete(finalRide);

      const rideRef = doc(firestore, 'rides', activeRideId);
      await updateDoc(rideRef, { status: 'PAID' }); // Assuming payment is done

      resetToIdle();
    }
  };

  // --- 4. SAFETY: SOS Functionality ---
  const handleSOS = async () => {
    if (!firestore || !activeRideId) return;
    try {
      const incidentsCol = collection(firestore, 'incidents');
      await addDoc(incidentsCol, {
        rideId: activeRideId,
        riderId: firebaseUser?.uid,
        type: 'EMERGENCY',
        status: 'OPEN',
        createdAt: serverTimestamp(),
        description: "Rider triggered SOS button during active ride."
      });
      toast({ variant: 'destructive', title: "SOS Alert Sent", description: "Our safety team has been notified!" });
    } catch (e) { console.error(e); }
  };

  const resetToIdle = () => {
    setStage('idle');
    setDestination('');
    setActiveRideId(null);
  }

  const getRideForSheet = (): Ride | null => {
    if (!rideData) return null;
    return {
      id: activeRideId || '',
      captain: {
        name: rideData.captainName || 'Captain',
        vehicle: 'KA-01-AB-1234',
        rating: 4.8,
        image: 'https://picsum.photos/seed/captain/100/100',
      },
      pickup: rideData.pickupLocation,
      destination: rideData.dropLocation,
      fare: rideData.estimatedFare,
      service: rideData.service,
      date: new Date().toISOString(),
      status: rideData.status,
      captainLocation: rideData.captainLocation,
      otp: rideData.otp
    }
  }

  const handleCenterMap = () => {
    const kphbLocation = {
      lat: 17.4948,
      lng: 78.3996,
    };
    setMapCenter(kphbLocation);
    toast({ title: 'Showing KPHB, Telangana' });
  };


  const rideForSheet = getRideForSheet();

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-background">
      <Map stage={stage} activeRide={rideForSheet} selectedService={selectedService} center={mapCenter} onCenterChange={() => setMapCenter(null)} showOtherCaptains={true} />

      {stage !== 'searching' && stage !== 'selecting_service' && (
        <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
          <SideMenu user={user} navigateTo={navigateTo} onLogout={handleLogout}>
            <Button variant="ghost" size="icon" className="h-12 w-12 bg-card rounded-full shadow-lg">
              <Menu />
            </Button>
          </SideMenu>

          <div className="flex gap-2">
            {stage === 'in_ride' && (
              <Button variant="destructive" size="icon" className="h-12 w-12 rounded-full shadow-lg animate-pulse" onClick={handleSOS}>
                <ShieldAlert className="h-6 w-6" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-12 w-12 bg-card rounded-full shadow-lg" onClick={() => navigateTo('notifications')}>
              <Bell />
            </Button>
            <Button variant="ghost" size="icon" className="h-12 w-12 bg-card rounded-full shadow-lg" onClick={() => navigateTo('profile')}>
              <User />
            </Button>
          </div>
        </header>
      )}

      {stage === 'idle' && (
        <>
          <div className="absolute top-20 left-0 right-0 p-4 space-y-4">
            {/* Services Grid */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { name: 'Bike', icon: Bike },
                { name: 'Auto', icon: Car },
                { name: 'Cab', icon: Car },
                { name: 'Parcel', icon: Package }
              ].map((item, index) => (
                <div key={item.name + index} className="flex flex-col items-center bg-card p-3 rounded-xl shadow-sm border border-border/50 transition-all hover:scale-105 active:scale-95 cursor-pointer" onClick={() => setStage('searching')}>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-1 text-primary">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-semibold">{item.name}</span>
                </div>
              ))}
            </div>

            {/* Saved Places */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {['Home', 'Office', 'Gym', 'Mall'].map((place) => (
                <Button key={place} variant="outline" className="rounded-full px-6 h-9 bg-card/90 shadow-sm border-0 whitespace-nowrap" onClick={() => setStage('searching')}>
                  {place}
                </Button>
              ))}
            </div>
          </div>

          <div className="absolute bottom-28 right-4 z-10">
            <Button variant="ghost" size="icon" className="h-14 w-14 bg-card rounded-full shadow-lg" onClick={handleCenterMap}>
              <Crosshair className="h-7 w-7" />
            </Button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/90 to-transparent pt-10">
            <Button className="w-full h-14 text-lg rounded-xl shadow-lg justify-start px-4 text-muted-foreground bg-card hover:bg-card border-2 border-primary/10" variant="secondary" onClick={() => setStage('searching')}>
              <div className="w-2 h-2 rounded-full bg-green-500 mr-3" />
              Where are you going?
            </Button>
          </div>
        </>
      )}

      {stage === 'searching' && (
        <SearchSheet
          onClose={resetToIdle}
          onDestinationSelect={handleDestinationSelect}
        />
      )}

      {stage === 'selecting_service' && (
        <BookingSheet
          pickup={pickup}
          destination={destination}
          selectedService={selectedService}
          onServiceSelect={setSelectedService}
          onBack={() => setStage('searching')}
          onBook={handleBook}
          navigateTo={navigateTo}
          availableOffers={promotions}
        />
      )}

      {stage === 'finding_captain' && (
        <FindingCaptainSheet onCancel={handleCancelSearch} />
      )}

      {stage === 'in_ride' && rideForSheet && (
        <RideStatusSheet ride={rideForSheet} onCancel={handleCancelSearch} openChat={openChat} />
      )}

      {stage === 'trip_summary' && rideForSheet && (
        <TripSummarySheet ride={rideForSheet} onDone={handleRideCompletion} />
      )}
    </div>
  );
}
