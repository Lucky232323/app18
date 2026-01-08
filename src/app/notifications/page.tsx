'use client';
import { useMemo } from 'react';
import Layout from '@/components/app/Layout';
import { Card, CardContent } from '@/components/ui/card';
import type { Screen } from '@/lib/types';
import { Tag, CheckCircle, Bell } from 'lucide-react';
import { useFirebase, useCollection } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';

type NotificationsPageProps = {
    navigateTo: (screen: Screen) => void;
    onBack?: () => void;
};

export default function NotificationsPage({ navigateTo, onBack }: NotificationsPageProps) {
    const { firestore } = useFirebase();

    const notificationsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'notifications'),
            where('targetAudience', 'in', ['ALL', 'RIDERS']),
            limit(20)
        );
    }, [firestore]);

    const { data: notifications, isLoading } = useCollection(notificationsQuery);

    return (
        <Layout title="Notifications" navigateTo={navigateTo} onBack={onBack}>
            <div className="p-4 space-y-4">
                {isLoading && <p className="text-center py-4 text-muted-foreground">Loading notifications...</p>}

                {notifications?.map((notif: any) => (
                    <Card key={notif.id} className="border-l-4 border-l-primary shadow-sm">
                        <CardContent className="flex items-start gap-4 p-4">
                            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <Bell className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg">{notif.title}</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{notif.body}</p>
                                <p className="text-xs text-muted-foreground mt-2 text-right">
                                    {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleDateString() : 'Just now'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {!isLoading && (!notifications || notifications.length === 0) && (
                    <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <Bell className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                        <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300">No Notifications</h3>
                        <p className="text-muted-foreground">We'll let you know when we have news.</p>
                    </div>
                )}
            </div>
        </Layout>
    );
}
