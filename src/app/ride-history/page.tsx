'use client';
import { useMemo } from 'react';
import Layout from '@/components/app/Layout';
import VehicleIcon from '@/components/app/VehicleIcon';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import type { Screen } from '@/lib/types';
import { Star, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useFirebase, useCollection } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';

type RideHistoryPageProps = {
  navigateTo: (screen: Screen) => void;
  rides?: any[];
  onBack?: () => void;
};

export default function RideHistoryPage({ navigateTo, onBack }: RideHistoryPageProps) {
  const { firestore, user } = useFirebase();

  const ridesQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'rides'),
      where('userId', '==', user.uid),
      limit(20)
    );
  }, [firestore, user]);

  const { data: rides, isLoading } = useCollection(ridesQuery);

  return (
    <Layout title="My Rides" navigateTo={navigateTo} onBack={onBack}>
      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>Loading your rides...</p>
          </div>
        ) : rides && rides.length > 0 ? (
          rides.map((ride: any) => (
            <Card key={ride.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {ride.createdAt?.toDate ? format(ride.createdAt.toDate(), "dd MMM yyyy, p") : 'Date N/A'}
                    </p>
                    <p className="font-bold">{ride.dropLocation || ride.destination || 'Destination'}</p>
                    <p className="text-sm text-muted-foreground">From: {ride.pickupLocation || ride.pickup || 'Pickup'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">₹{Math.round(ride.estimatedFare || ride.fare || 0)}</p>
                    <VehicleIcon service={ride.service || ride.serviceId || 'Bike'} className="ml-auto mt-1" />
                  </div>
                </div>
                {ride.captainId && (
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t">
                    <Avatar>
                      <AvatarFallback>{ride.captainName ? ride.captainName.charAt(0) : 'C'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{ride.captainName || 'Captain'}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="w-4 h-4 text-primary fill-primary" />
                        <span>{ride.captainRating || '4.8'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground">You have no past rides.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
