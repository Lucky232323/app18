'use client';
import Layout from '@/components/app/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Screen } from '@/lib/types';
import { CheckCircle, Zap } from 'lucide-react';

type PowerPassPageProps = {
  navigateTo: (screen: Screen) => void;
  onBack?: () => void;
};

const benefits = [
  "Save up to ₹100 on 10 rides",
  "No surge pricing on any ride",
  "Priority customer support",
  "Exclusive offers from partners"
];

export default function PowerPassPage({ navigateTo, onBack }: PowerPassPageProps) {
  return (
    <Layout title="Power Pass" navigateTo={navigateTo} onBack={onBack}>
      <div className="p-4 space-y-6">
        <Card className="overflow-hidden bg-primary/10">
          <CardContent className="p-6">
            <div className="flex justify-center items-center h-40">
              <Zap className="h-24 w-24 text-primary animate-pulse" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold">Unlock exclusive savings!</h2>
              <p className="text-muted-foreground mt-2">Get the Power Pass and enjoy amazing benefits on your rides.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pass Benefits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <p>{benefit}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Button className="w-full h-14 text-lg">Get Power Pass for ₹99</Button>
      </div>
    </Layout>
  );
}
