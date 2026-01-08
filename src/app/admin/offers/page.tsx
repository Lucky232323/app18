'use client';
import { useState } from 'react';
import type { User, Screen } from '@/lib/types';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Tag, Trash2, Calendar, Users } from 'lucide-react';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, Timestamp, query, orderBy } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

type AdminOffersPageProps = {
  user: User | null;
  onLogout: () => void;
  navigateTo: (screen: Screen) => void;
  currentScreen: Screen;
};

type Promotion = {
  id: string;
  code: string;
  discountType: 'percentage' | 'flat';
  value: number;
  description: string;
  validUntil: any;
  usageCount: number;
  status: 'active' | 'expired';
  targetAudience: 'ALL' | 'RIDERS' | 'CAPTAINS';
};

export default function AdminOffersPage({ user, onLogout, navigateTo, currentScreen }: AdminOffersPageProps) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPromo, setNewPromo] = useState({ code: '', discountType: 'percentage', value: '', description: '', validUntil: '', targetAudience: 'ALL' });

  const promosQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'promotions'), orderBy('validUntil', 'desc'));
  }, [firestore]);

  const { data: promos, isLoading } = useCollection<Promotion>(promosQuery);

  const handleCreate = async () => {
    if (!firestore) return;
    try {
      // 1. Create Promotion
      await addDoc(collection(firestore, 'promotions'), {
        code: newPromo.code.toUpperCase(),
        discountType: newPromo.discountType,
        value: Number(newPromo.value),
        description: newPromo.description,
        validUntil: Timestamp.fromDate(new Date(newPromo.validUntil)),
        targetAudience: newPromo.targetAudience,
        usageCount: 0,
        status: 'active',
        createdAt: Timestamp.now()
      });

      // 2. Auto-send Notification
      await addDoc(collection(firestore, 'notifications'), {
        title: `New Offer: ${newPromo.code.toUpperCase()}`,
        body: `${newPromo.description}. Use code ${newPromo.code.toUpperCase()}!`,
        targetAudience: newPromo.targetAudience,
        createdAt: Timestamp.now(),
        status: 'sent',
        sentBy: 'System (Auto-Offer)'
      });

      toast({ title: "Success", description: "Promotion created & notification sent!" });
      setIsDialogOpen(false);
      setNewPromo({ code: '', discountType: 'percentage', value: '', description: '', validUntil: '', targetAudience: 'ALL' });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create promotion" });
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    if (confirm('Are you sure you want to delete this offer?')) {
      await deleteDoc(doc(firestore, 'promotions', id));
      toast({ title: "Deleted", description: "Promotion removed" });
    }
  }

  return (
    <AdminLayout user={user} onLogout={onLogout} navigateTo={navigateTo} currentScreen={currentScreen}>
      <div className="p-4 md:p-8 max-w-[1200px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Offers & Promos</h1>
            <p className="text-muted-foreground">Manage discount codes and marketing campaigns</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700"><Plus className="mr-2 h-4 w-4" /> Create New Offer</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Promotion</DialogTitle>
                <DialogDescription>Add a new discount code for users.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Audience</Label>
                  <div className="col-span-3">
                    <Select value={newPromo.targetAudience} onValueChange={(v) => setNewPromo({ ...newPromo, targetAudience: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Target" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Users</SelectItem>
                        <SelectItem value="RIDERS">Riders Only</SelectItem>
                        <SelectItem value="CAPTAINS">Captains Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Code</Label>
                  <Input value={newPromo.code} onChange={e => setNewPromo({ ...newPromo, code: e.target.value })} placeholder="SUMMER50" className="col-span-3 uppercase" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Value</Label>
                  <div className="col-span-3 flex gap-2">
                    <Input type="number" value={newPromo.value} onChange={e => setNewPromo({ ...newPromo, value: e.target.value })} placeholder="50" />
                    <select
                      className="border rounded px-2"
                      value={newPromo.discountType}
                      onChange={e => setNewPromo({ ...newPromo, discountType: e.target.value as any })}
                    >
                      <option value="percentage">%</option>
                      <option value="flat">₹</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Expiry</Label>
                  <Input type="date" value={newPromo.validUntil} onChange={e => setNewPromo({ ...newPromo, validUntil: e.target.value })} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Desc</Label>
                  <Input value={newPromo.description} onChange={e => setNewPromo({ ...newPromo, description: e.target.value })} placeholder="50% off on first ride" className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate}>Create Offer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && <TableRow><TableCell colSpan={7} className="text-center h-24">Loading offers...</TableCell></TableRow>}
                  {!isLoading && promos?.length === 0 && <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">No active promotions</TableCell></TableRow>}
                  {promos?.map((promo) => (
                    <TableRow key={promo.id}>
                      <TableCell className="font-bold text-blue-600 flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        {promo.code}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex w-fit items-center gap-1">
                          <Users className="h-3 w-3" />
                          {promo.targetAudience || 'ALL'}
                        </Badge>
                      </TableCell>
                      <TableCell>{promo.discountType === 'percentage' ? `${promo.value}%` : `₹${promo.value}`}</TableCell>
                      <TableCell>{promo.description}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {promo.validUntil?.toDate ? format(promo.validUntil.toDate(), 'PP') : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={promo.status === 'active' ? 'default' : 'secondary'} className={promo.status === 'active' ? 'bg-green-100 text-green-800' : ''}>
                          {promo.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(promo.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
