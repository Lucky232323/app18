'use client';

import type { User, Screen } from '@/lib/types';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Bike, Car, DollarSign, Activity } from 'lucide-react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy, limit, where, updateDoc, doc } from 'firebase/firestore';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { format } from 'date-fns';
import Map from '@/components/app/Map';
import type { Ride, UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import * as React from 'react';


type AdminDashboardPageProps = {
  user: User | null;
  onLogout: () => void;
  navigateTo: (screen: Screen) => void;
  currentScreen: Screen;
};

export default function AdminDashboardPage({ user, onLogout, navigateTo, currentScreen }: AdminDashboardPageProps) {
  const { firestore } = useFirebase();

  const userProfilesQuery = useMemoFirebase(() =>
    firestore ? collection(firestore, 'userProfiles') : null,
    [firestore]);
  const { data: userProfiles, isLoading: usersLoading } = useCollection(userProfilesQuery);

  const captainProfilesQuery = useMemoFirebase(() =>
    firestore ? collection(firestore, 'captainProfiles') : null,
    [firestore]);
  const { data: captainProfiles, isLoading: captainsLoading } = useCollection(captainProfilesQuery);

  const recentRidesQuery = useMemoFirebase(() =>
    firestore ? query(collection(firestore, 'rides'), orderBy('createdAt', 'desc'), limit(5)) : null,
    [firestore]);
  const { data: recentRides, isLoading: ridesLoading } = useCollection<Ride>(recentRidesQuery);

  const activeRidesQuery = useMemoFirebase(() =>
    firestore ? query(collection(firestore, 'rides'), where('status', 'in', ['ACCEPTED', 'ARRIVED', 'STARTED'])) : null,
    [firestore]);
  const { data: activeRides, isLoading: activeRidesLoading } = useCollection(activeRidesQuery);

  const recentUsersQuery = useMemoFirebase(() =>
    firestore ? query(collection(firestore, 'userProfiles'), orderBy('id'), limit(5)) : null,
    [firestore]);
  const { data: recentUsers, isLoading: recentUsersLoading } = useCollection<UserProfile>(recentUsersQuery);


  // ... (previous queries)

  const pendingCaptainsQuery = useMemoFirebase(() =>
    firestore ? query(collection(firestore, 'captainProfiles'), where('status', '==', 'pending')) : null,
    [firestore]);
  const { data: pendingCaptains, isLoading: pendingCaptainsLoading } = useCollection(pendingCaptainsQuery);

  // Fetch rides for Revenue Calculation
  const ridesQuery = useMemoFirebase(() =>
    firestore ? query(collection(firestore, 'rides'), orderBy('createdAt', 'desc')) : null,
    [firestore]);
  const { data: allRides, isLoading: allRidesLoading } = useCollection<Ride>(ridesQuery);

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });

  const handleApprove = async (captainId: string) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'captainProfiles', captainId), { status: 'approved' });
    } catch (err) {
      console.error("Failed to approve", err);
    }
  }

  // Calculate Real Revenue based on Date Range
  const revenueStats = useMemoFirebase(() => {
    if (!allRides || !dateRange?.from) return { selectedPeriod: 0 };

    let total = 0;
    const from = dateRange.from;
    const to = dateRange.to || dateRange.from; // Default to single day if no end date

    // Normalize 'to' date to end of day to include all rides on that day
    const toEndOfDay = new Date(to);
    toEndOfDay.setHours(23, 59, 59, 999);

    const fromStartOfDay = new Date(from);
    fromStartOfDay.setHours(0, 0, 0, 0);

    allRides.forEach(ride => {
      // Only count completed/paid rides
      if (ride.status === 'PAID' || ride.status === 'ENDED') {
        const amount = ride.estimatedFare || 0;
        let rideDate: Date | null = null;

        if (ride.createdAt) {
          if (typeof ride.createdAt.toDate === 'function') {
            rideDate = ride.createdAt.toDate();
          } else if (ride.createdAt instanceof Date) {
            rideDate = ride.createdAt;
          } else if (typeof ride.createdAt === 'string') {
            rideDate = new Date(ride.createdAt);
          }
        }

        if (rideDate && rideDate >= fromStartOfDay && rideDate <= toEndOfDay) {
          total += amount;
        }
      }
    });

    return { selectedPeriod: total };
  }, [allRides, dateRange]);

  const kpis = [
    {
      title: 'Total Users',
      value: usersLoading ? '...' : userProfiles?.length ?? 0,
      icon: Users,
      color: 'text-blue-500',
      screen: 'admin-users' as Screen,
      trend: 'Registered users'
    },
    {
      title: 'Total Captains',
      value: captainsLoading ? '...' : captainProfiles?.length ?? 0,
      icon: Bike,
      color: 'text-green-500',
      screen: 'admin-captains' as Screen,
      trend: 'Registered captains'
    },
    {
      title: 'Active Rides',
      value: activeRidesLoading ? '...' : activeRides?.length ?? 0,
      icon: Car,
      color: 'text-yellow-500',
      screen: 'admin-rides' as Screen,
      trend: 'Currently live'
    },
    {
      title: 'Total Revenue',
      value: allRidesLoading ? '...' : `₹${revenueStats?.selectedPeriod?.toLocaleString() ?? 0}`,
      icon: DollarSign,
      color: 'text-purple-500',
      screen: 'admin-payments' as Screen,
      trend: dateRange?.from ? `${format(dateRange.from, 'MMM d')} - ${dateRange.to ? format(dateRange.to, 'MMM d') : format(dateRange.from, 'MMM d')}` : 'Selected Period'
    },
  ];

  return (
    <AdminLayout user={user} onLogout={onLogout} navigateTo={navigateTo} currentScreen={currentScreen}>

      <div className="p-4 md:p-8 space-y-8">

        {/* Header with Date Range Picker */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Financial Overview</h2>
            <p className="text-muted-foreground mt-1">Revenue, transactions, and payment methods.</p>
          </div>
          <div className="flex items-center gap-2">
            <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <Button
              key={kpi.title}
              onClick={() => navigateTo(kpi.screen)}
              className="h-auto w-full p-0 text-left bg-transparent hover:bg-transparent"
            >
              <Card className="w-full hover:bg-secondary/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <p className="text-xs text-muted-foreground mt-1 text-green-600 font-medium">
                    {kpi.trend}
                  </p>
                </CardContent>
              </Card>
            </Button>
          ))}
        </div>

        {/* Verification Queue Section */}
        {pendingCaptains && pendingCaptains.length > 0 && (
          <div className="bg-orange-50 dark:bg-orange-900/10 border-l-4 border-orange-500 p-4 rounded-r-lg">
            <h3 className="font-bold text-lg text-orange-700 dark:text-orange-400 mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 animate-pulse" />
              Verification Queue ({pendingCaptains.length})
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingCaptains.map(captain => (
                <Card key={captain.id} className="border-orange-200 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-lg">{captain.name}</p>
                        <p className="text-sm text-muted-foreground">{captain.phoneNumber}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">Pending</Badge>
                    </div>
                    <div className="text-sm space-y-1 mb-4">
                      <p>Vehicle: <span className="font-medium capitalize">{captain.vehicleType || 'Not set'}</span></p>
                      <p>Joined: <span className="font-medium">Just now</span></p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50">Reject</Button>
                      <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleApprove(captain.id)}>Approve</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Live Map</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-md">
                <Map stage='idle' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-md font-semibold mb-2">Recent Rides</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rider & Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Fare</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ridesLoading && <tr><TableCell colSpan={3} className="text-center py-4">Loading...</TableCell></tr>}
                    {recentRides && recentRides.map(ride => (
                      <TableRow key={ride.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium truncate max-w-[100px]">{ride.riderName || 'User'}</span>
                            <span className="text-xs text-muted-foreground capitalize">
                              {ride.bookingMode === 'parcel' ? '📦 Parcel' : ride.bookingMode === 'rentals' ? '⏳ Rental' : '🛵 Ride'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            ride.status === 'ENDED' || ride.status === 'PAID' ? 'default' : ['ACCEPTED', 'ARRIVED', 'STARTED'].includes(ride.status || '') ? 'secondary' : 'destructive'
                          } className={
                            ride.status === 'ENDED' || ride.status === 'PAID' ? 'bg-green-100 text-green-800' :
                              ['ACCEPTED', 'ARRIVED', 'STARTED'].includes(ride.status || '') ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                          }>{ride.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">₹{ride.estimatedFare}</TableCell>
                      </TableRow>
                    ))}
                    {!ridesLoading && recentRides?.length === 0 && (
                      <TableRow><TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No recent rides.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div>
                <h3 className="text-md font-semibold mb-2">New Users</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentUsersLoading && <tr><TableCell colSpan={2} className="text-center py-4">Loading...</TableCell></tr>}
                    {recentUsers && recentUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name || 'N/A'}</TableCell>
                        <TableCell className="text-right truncate max-w-[150px]">{user.id}</TableCell>
                      </TableRow>
                    ))}
                    {!recentUsersLoading && recentUsers?.length === 0 && (
                      <TableRow><TableCell colSpan={2} className="text-center py-4 text-muted-foreground">No new users.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
