'use client';
import { useState, useMemo } from 'react';
import type { User, Screen } from '@/lib/types';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Send, Bell, History } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { collection, addDoc, Timestamp, query, orderBy, limit } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { format } from 'date-fns';

type AdminNotificationsPageProps = {
  user: User | null;
  onLogout: () => void;
  navigateTo: (screen: Screen) => void;
  currentScreen: Screen;
};

export default function AdminNotificationsPage({ user, onLogout, navigateTo, currentScreen }: AdminNotificationsPageProps) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ title: '', body: '', targetAudience: 'ALL' });

  // Fetch history
  const historyQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'notifications'), orderBy('createdAt', 'desc'), limit(10));
  }, [firestore]);
  const { data: history } = useCollection(historyQuery);

  const handleSend = async () => {
    if (!firestore) return;
    setLoading(true);
    try {
      await addDoc(collection(firestore, 'notifications'), {
        title: formData.title,
        body: formData.body,
        targetAudience: formData.targetAudience, // Correct field name
        createdAt: Timestamp.now(),
        status: 'sent',
        sentBy: user?.email
      });
      toast({ title: "Notification Sent", description: "Your message has been queued for delivery." });
      setFormData({ title: '', body: '', targetAudience: 'ALL' });
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Failed to send notification." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout user={user} onLogout={onLogout} navigateTo={navigateTo} currentScreen={currentScreen}>
      <div className="p-4 md:p-8 max-w-[1200px] mx-auto grid gap-8 lg:grid-cols-2">

        {/* Compose Section */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Push Notifications</h1>
            <p className="text-muted-foreground">Send real-time alerts to your users and captains.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5" /> Compose Message</CardTitle>
              <CardDescription>This will send a notification to devices immediately.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select value={formData.targetAudience} onValueChange={v => setFormData({ ...formData, targetAudience: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Users & Captains</SelectItem>
                    <SelectItem value="RIDERS">Riders Only</SelectItem>
                    <SelectItem value="CAPTAINS">Captains Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input placeholder="e.g. 50% Off Today!" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Body</Label>
                <Textarea placeholder="Enter your message here..." className="h-32" value={formData.body} onChange={e => setFormData({ ...formData, body: e.target.value })} />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleSend} disabled={loading || !formData.title || !formData.body}>
                {loading ? 'Sending...' : 'Send Notification'}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* History Section */}
        <div className="space-y-6">
          <div className="lg:mt-20"> {/* Spacer to align with title */}
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><History className="h-5 w-5" /> Recent History</h2>
          </div>
          <div className="space-y-4">
            {history?.map((notif: any) => (
              <Card key={notif.id} className="bg-gray-50/50 dark:bg-gray-900/50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold">{notif.title}</h3>
                    <span className="text-xs text-muted-foreground">{notif.createdAt?.toDate ? format(notif.createdAt.toDate(), 'PP p') : 'Just now'}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{notif.body}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase font-medium">
                    <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">{notif.targetAudience}</span>
                    <span>• Sent by {notif.sentBy || 'Admin'}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!history || history.length === 0 && (
              <div className="text-center py-10 text-muted-foreground bg-gray-50 rounded-lg border border-dashed">
                <Bell className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p>No notifications sent recently.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
