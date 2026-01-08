
import { useMemo, useState } from 'react';
import type { User, Screen, Ride } from '@/lib/types';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { DollarSign, CreditCard, Wallet, TrendingUp, Calendar as CalendarIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

type AdminPaymentsPageProps = {
  user: User | null;
  onLogout: () => void;
  navigateTo: (screen: Screen) => void;
  currentScreen: Screen;
};

export default function AdminPaymentsPage({ user, onLogout, navigateTo, currentScreen }: AdminPaymentsPageProps) {
  const { firestore } = useFirebase();
  const [activeTab, setActiveTab] = useState('ALL');
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  // --- 1. Fetch Data (Real Payments from Rides) ---
  // In a real app, strict rules might prevent fetching ALL rides. We'd use a server function or paginated query.
  // For this scope, we fetch recent rides.
  const ridesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'rides'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: rides, isLoading } = useCollection<Ride>(ridesQuery);

  // --- 2. Derived Metrics with Date Filtering ---
  const filteredRides = useMemo(() => {
    if (!rides) return [];
    let data = rides;

    // Date Range Filter
    if (date?.from) {
      data = data.filter(ride => {
        if (!ride.createdAt) return false;
        let rideDate: Date;
        if (typeof ride.createdAt.toDate === 'function') {
          rideDate = ride.createdAt.toDate();
        } else if (ride.createdAt instanceof Date) {
          rideDate = ride.createdAt;
        } else if (typeof ride.createdAt === 'string') {
          rideDate = new Date(ride.createdAt);
        } else {
          return false;
        }

        if (date.to) {
          return isWithinInterval(rideDate, { start: startOfDay(date.from!), end: endOfDay(date.to) });
        } else {
          return rideDate >= startOfDay(date.from!);
        }
      });
    }

    return data;
  }, [rides, date]);

  const paymentStats = useMemo(() => {
    const data = filteredRides;
    if (!data) return { totalRevenue: 0, todayRevenue: 0, avgFare: 0, totalTxns: 0, cash: 0, online: 0, chartData: [] };

    const now = new Date();
    const todayStr = now.toDateString();

    let totalRevenue = 0;
    let todayRevenue = 0;
    let cashCount = 0;
    let onlineCount = 0;
    let completedRides = 0;

    const chartDataMap = new Map<string, number>();

    data.forEach(ride => {
      if (ride.status === 'PAID' || ride.status === 'ENDED') {
        const fare = ride.estimatedFare || 0;
        totalRevenue += fare;
        completedRides++;

        if (ride.paymentMethod?.toLowerCase().includes('cash')) {
          cashCount++;
        } else {
          onlineCount++;
        }

        let rideDate: Date | null = null;
        if (ride.createdAt) {
          // Handle various Timestamp formats
          if (typeof ride.createdAt.toDate === 'function') {
            rideDate = ride.createdAt.toDate();
          } else if (ride.createdAt instanceof Date) {
            rideDate = ride.createdAt;
          } else if (typeof ride.createdAt === 'string') {
            rideDate = new Date(ride.createdAt);
          }
        }

        if (rideDate && rideDate.toDateString() === todayStr) {
          todayRevenue += fare;
        }

        if (rideDate) {
          const dateKey = format(rideDate, 'MMM dd');
          chartDataMap.set(dateKey, (chartDataMap.get(dateKey) || 0) + fare);
        }
      }
    });

    const chartData = Array.from(chartDataMap.entries())
      .map(([name, total]) => ({ name, total }))
      .slice(0, 7)
      .reverse();

    return {
      totalRevenue,
      todayRevenue,
      avgFare: completedRides > 0 ? totalRevenue / completedRides : 0,
      totalTxns: completedRides,
      cash: cashCount,
      online: onlineCount,
      chartData
    };
  }, [filteredRides]);

  const filteredTransactions = useMemo(() => {
    let data = filteredRides.filter(r => r.status === 'PAID' || r.status === 'ENDED');

    if (activeTab === 'CASH') {
      data = data.filter(r => r.paymentMethod?.toLowerCase() === 'cash');
    } else if (activeTab === 'ONLINE') {
      data = data.filter(r => r.paymentMethod?.toLowerCase() !== 'cash');
    }
    return data;
  }, [filteredRides, activeTab]);

  const handleExport = () => {
    if (!filteredTransactions || filteredTransactions.length === 0) return;

    // CSV Header
    const headers = ["Ride ID", "Rider Name", "Captain Name", "Amount", "Payment Method", "Status", "Date"];
    const rows = filteredTransactions.map(r => {
      // Handle potential commas in data to prevent CSV breakage
      const clean = (str: any) => `"${String(str || '').replace(/"/g, '""')}"`;

      return [
        clean(r.id),
        clean(r.riderName || "N/A"),
        clean(r.captainName || "N/A"),
        r.estimatedFare || 0,
        clean(r.paymentMethod || "Cash"),
        clean(r.status),
        clean(r.createdAt?.toDate ? format(r.createdAt.toDate(), 'yyyy-MM-dd HH:mm:ss') : "N/A")
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `payments_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <AdminLayout user={user} onLogout={onLogout} navigateTo={navigateTo} currentScreen={currentScreen}>
      <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-900 p-6 rounded-xl border shadow-sm">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Financial Overview</h1>
            <p className="text-muted-foreground mt-1">Track revenue, transactions, and payment methods.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-[260px] justify-start text-left font-normal bg-white dark:bg-gray-950 border-input shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 transition-all",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
                  {date?.from ? (
                    date.to ? (
                      <span className="font-medium">
                        {format(date.from, "MMM dd, yyyy")} - {format(date.to, "MMM dd, yyyy")}
                      </span>
                    ) : (
                      format(date.from, "MMM dd, yyyy")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-3 border-b bg-gray-50/50">
                  <p className="text-sm font-medium text-gray-500">Select Range</p>
                </div>
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-95 transition-all" onClick={handleExport}>
              <ArrowDownRight className="h-4 w-4" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>

        {/* KPI Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-900 border-blue-100 dark:border-blue-900/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">₹{paymentStats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3 text-green-500" /> +20.1% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today's Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{paymentStats.todayRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {paymentStats.totalTxns > 0 ? `${Math.floor(paymentStats.todayRevenue / (paymentStats.avgFare || 1))} rides today` : 'No rides yet'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Transaction</CardTitle>
              <CreditCard className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{paymentStats.avgFare.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground mt-1">Per completed ride</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cash vs Online</CardTitle>
              <Wallet className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <div className="text-2xl font-bold">{((paymentStats.online / (paymentStats.totalTxns || 1)) * 100).toFixed(0)}%</div>
                <span className="text-sm text-muted-foreground mb-1">Online</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-orange-500" style={{ width: `${(paymentStats.online / (paymentStats.totalTxns || 1)) * 100}%` }}></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <Card className="lg:col-span-1 border-0 shadow-none bg-transparent">
            <div className="mb-4">
              <h3 className="font-semibold text-lg">Revenue Trend</h3>
              <p className="text-sm text-muted-foreground">Last 7 Days activity</p>
            </div>
            <div className="h-[300px] w-full bg-white dark:bg-gray-900 rounded-xl p-4 border shadow-sm">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentStats.chartData}>
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
              {paymentStats.chartData?.length === 0 && (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No recent data</div>
              )}
            </div>
          </Card>

          {/* Transactions Table */}
          <Card className="lg:col-span-2 shadow-lg border-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
            <CardHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Real-time payment info from rides</CardDescription>
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="ALL">All</TabsTrigger>
                  <TabsTrigger value="ONLINE">Online</TabsTrigger>
                  <TabsTrigger value="CASH">Cash</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50/50 dark:bg-gray-800/50">
                  <TableRow>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>Paid By</TableHead>
                    <TableHead>Collected By</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">Loading transactions...</TableCell>
                    </TableRow>
                  )}
                  {!isLoading && filteredTransactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">No transactions found.</TableCell>
                    </TableRow>
                  )}
                  {filteredTransactions.map((ride) => (
                    <TableRow key={ride.id} className="hover:bg-gray-50/50">
                      <TableCell className="font-mono text-xs">#{ride.id.substring(0, 6)}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{ride.riderName || 'Unknown User'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">{ride.captainName || 'Unknown Captain'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {ride.paymentMethod?.toLowerCase() === 'cash' ? <DollarSign className="h-3 w-3 text-green-600" /> : <CreditCard className="h-3 w-3 text-blue-600" />}
                          <span className="capitalize text-sm">{ride.paymentMethod || 'Cash'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {ride.createdAt ? (ride.createdAt.toDate ? format(ride.createdAt.toDate(), 'MMM dd, HH:mm') : 'Recently') : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={ride.status === 'PAID' ? 'default' : 'secondary'} className={ride.status === 'PAID' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-yellow-100 text-yellow-800'}>
                          {ride.status === 'PAID' ? 'Success' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{ride.estimatedFare?.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
