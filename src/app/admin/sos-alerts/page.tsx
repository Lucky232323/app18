'use client';
import { useState, useMemo } from 'react';
import type { User, Screen } from '@/lib/types';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertCircle, Clock, CheckCircle2, Search, Filter, Octagon, MoreVertical, Eye, Share2, MapPin, Phone, User as UserIcon } from 'lucide-react';

import { useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where, updateDoc, doc, Timestamp, addDoc } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type AdminSosAlertsPageProps = {
  user: User | null;
  onLogout: () => void;
  navigateTo: (screen: Screen) => void;
  currentScreen: Screen;
};

// Define Incident Type matching Firestore
type Incident = {
  id: string;
  type: 'SOS' | 'ACCIDENT' | 'HARASSMENT' | 'LOST_ITEM' | 'OTHER';
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  description?: string;
  userId?: string;
  userName?: string;
  userPhone?: string;
  captainId?: string;
  captainName?: string;
  rideId?: string;
  location?: { lat: number; lng: number; address?: string };
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}; export default function AdminSosAlertsPage({ user, onLogout, navigateTo, currentScreen }: AdminSosAlertsPageProps) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('OPEN');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // --- 1. Queries ---
  const incidentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'incidents'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: allIncidents, isLoading } = useCollection<Incident>(incidentsQuery);

  // --- 2. Derived State ---
  const stats = useMemo(() => {
    if (!allIncidents) return { activeSos: 0, open: 0, investigating: 0, resolved: 0 };
    return {
      activeSos: allIncidents.filter(i => i.type === 'SOS' && i.status !== 'RESOLVED' && i.status !== 'CLOSED').length,
      open: allIncidents.filter(i => i.status === 'OPEN').length,
      investigating: allIncidents.filter(i => i.status === 'INVESTIGATING').length,
      resolved: allIncidents.filter(i => i.status === 'RESOLVED').length,
    };
  }, [allIncidents]);

  const filteredIncidents = useMemo(() => {
    if (!allIncidents) return [];
    if (activeTab === 'ALL') return allIncidents;
    return allIncidents.filter(i => i.status === activeTab);
  }, [allIncidents, activeTab]);

  // --- 3. Actions ---
  const handleStatusChange = async (id: string, newStatus: Incident['status']) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'incidents', id), {
        status: newStatus,
        updatedAt: Timestamp.now()
      });
      toast({ title: "Status Updated", description: `Incident moved to ${newStatus}` });
    } catch (error) {
      console.error("Error updating incident:", error);
      toast({ variant: 'destructive', title: "Error", description: "Failed to update status." });
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN': return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200">Open</Badge>;
      case 'INVESTIGATING': return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200">Investigating</Badge>;
      case 'RESOLVED': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">Resolved</Badge>;
      case 'CLOSED': return <Badge variant="outline" className="bg-gray-100 text-gray-800">Closed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return <Badge className="bg-red-600 animate-pulse">CRITICAL</Badge>;
      case 'HIGH': return <Badge className="bg-orange-500">HIGH</Badge>;
      default: return <span className="text-xs text-muted-foreground font-medium uppercase">{priority}</span>
    }
  }

  return (
    <AdminLayout user={user} onLogout={onLogout} navigateTo={navigateTo} currentScreen={currentScreen}>
      <div className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Incidents</h1>
          <p className="text-muted-foreground mt-1">Manage safety incidents and complaints</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-red-500 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active SOS</CardTitle>
              <Octagon className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.activeSos}</div>
              <p className="text-xs text-muted-foreground mt-1">Requires immediate attention</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Open</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.open}</div>
              <p className="text-xs text-muted-foreground mt-1">New reports</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Investigating</CardTitle>
              <Search className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.investigating}</div>
              <p className="text-xs text-muted-foreground mt-1">In progress</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <Card className="shadow-lg border-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <CardHeader className="px-6 py-4 border-b">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <TabsList className="bg-transparent p-0 gap-2 h-auto flex-wrap">
                  {['OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED', 'ALL'].map((tab) => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      className="data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800 data-[state=active]:text-foreground rounded-full px-4 py-2 border border-transparent data-[state=active]:border-gray-200 dark:data-[state=active]:border-gray-700 transition-all shadow-none"
                    >
                      {tab.charAt(0) + tab.slice(1).toLowerCase()}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-9 gap-2">
                    <Filter className="h-4 w-4" />
                    Filter
                  </Button>
                </div>
              </div>
            </Tabs>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50/50 dark:bg-gray-800/50">
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reported By</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        Loading incidents...
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && filteredIncidents?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 text-green-500/20" />
                        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">No incidents found</p>
                        <p className="text-sm">Great job! There are no {activeTab.toLowerCase()} incidents.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {filteredIncidents?.map((incident) => (
                  <TableRow key={incident.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <TableCell className="font-mono text-xs font-medium">#{incident.id.slice(0, 6)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {incident.type === 'SOS' && <Octagon className="h-4 w-4 text-red-500" />}
                        <span className="font-medium">{incident.type}</span>
                        {getPriorityBadge(incident.priority)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{incident.userName || 'Unknown User'}</span>
                        <span className="text-xs text-muted-foreground">{incident.userPhone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="truncate max-w-[200px] text-sm text-gray-600 dark:text-gray-300" title={incident.description}>
                        {incident.description || 'No description provided'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs text-muted-foreground">
                        <span>{incident.createdAt ? format(incident.createdAt.toDate(), 'PP') : '-'}</span>
                        <span>{incident.createdAt ? format(incident.createdAt.toDate(), 'p') : '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(incident.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setSelectedIncident(incident)} className="gap-2">
                            <Eye className="h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(incident.id, 'INVESTIGATING')} className="gap-2" disabled={incident.status === 'INVESTIGATING' || incident.status === 'RESOLVED'}>
                            <Search className="h-4 w-4" /> Investigate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleStatusChange(incident.id, 'RESOLVED')} className="gap-2 text-green-600" disabled={incident.status === 'RESOLVED'}>
                            <CheckCircle2 className="h-4 w-4" /> Mark Resolved
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>


      <Sheet open={!!selectedIncident} onOpenChange={(open) => !open && setSelectedIncident(null)}>
        <SheetContent className="sm:max-w-md w-full overflow-y-auto">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              {selectedIncident?.type === 'SOS' && <Octagon className="h-5 w-5 text-red-500" />}
              Incident Details
            </SheetTitle>
          </SheetHeader>

          {selectedIncident && (
            <div className="space-y-6 pt-6">
              {/* Status Section */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedIncident.status)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground text-right">Priority</p>
                  <div className="mt-1 flex justify-end">{getPriorityBadge(selectedIncident.priority)}</div>
                </div>
              </div>

              {/* User Details */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Reported By</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="font-bold">{selectedIncident.userName || 'Unknown User'}</p>
                      <p className="text-sm text-muted-foreground">User</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${selectedIncident.userPhone}`} className="text-blue-600 hover:underline">{selectedIncident.userPhone || 'No phone'}</a>
                  </div>
                </CardContent>
              </Card>

              {/* Incident Details */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <div className="bg-slate-50 p-3 rounded-lg border text-sm">
                  {selectedIncident.description || "No description provided."}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Time</p>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedIncident.createdAt ? format(selectedIncident.createdAt.toDate(), "PPpp") : 'N/A'}</span>
                </div>
              </div>

              {selectedIncident.location && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Location</p>
                  <div className="flex items-center gap-2 text-sm bg-slate-50 p-2 rounded">
                    <MapPin className="h-4 w-4 text-red-500" />
                    <span>{selectedIncident.location.address || `${selectedIncident.location.lat.toFixed(4)}, ${selectedIncident.location.lng.toFixed(4)}`}</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t flex flex-col gap-2">
                <Button className="w-full" onClick={() => {
                  handleStatusChange(selectedIncident.id, 'INVESTIGATING');
                  setSelectedIncident(null);
                }} disabled={selectedIncident.status !== 'OPEN'}>
                  Start Investigation
                </Button>
                <Button variant="outline" className="w-full text-green-600 border-green-200 hover:bg-green-50" onClick={() => {
                  handleStatusChange(selectedIncident.id, 'RESOLVED');
                  setSelectedIncident(null);
                }} disabled={selectedIncident.status === 'RESOLVED'}>
                  Mark as Resolved
                </Button>
              </div>

            </div>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout >
  );
}
