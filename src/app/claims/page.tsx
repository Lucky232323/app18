'use client';
import Layout from '@/components/app/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { Screen } from '@/lib/types';
import { FileText, ClipboardList, User, Bike, Rocket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ClaimsPageProps = {
  navigateTo: (screen: Screen) => void;
  onBack?: () => void;
};

const bikeCoverage = [
  { icon: User, title: 'Personal Accident/Accidental Death', amount: '₹ 5,00,000' },
  { icon: FileText, title: 'Medical Expense for Accident', amount: '₹ 1,00,000' },
];

const autoCoverage = [
  { icon: User, title: 'Personal Accident/Accidental Death', amount: '₹ 7,50,000' },
  { icon: FileText, title: 'Medical Expense for Accident', amount: '₹ 1,50,000' },
];

export default function ClaimsPage({ navigateTo, onBack }: ClaimsPageProps) {
  const { toast } = useToast();

  const handleClaim = () => {
    toast({
      title: "Claim Process Initiated",
      description: "Our team will get in touch with you shortly.",
    });
  };

  return (
    <Layout title="Claims" navigateTo={navigateTo} onBack={onBack}>
      <div className="p-4 space-y-6">
        <Tabs defaultValue="bike" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="bike" className="h-10 text-base">
              <Bike className="mr-2 h-5 w-5" /> Bike
            </TabsTrigger>
            <TabsTrigger value="auto" className="h-10 text-base">
              <Rocket className="mr-2 h-5 w-5" /> Auto
            </TabsTrigger>
          </TabsList>
          <TabsContent value="bike">
            <CoverageCard title="Bike Insurance Coverage" coverage={bikeCoverage} />
          </TabsContent>
          <TabsContent value="auto">
            <CoverageCard title="Auto Insurance Coverage" coverage={autoCoverage} />
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <ClipboardList className="h-6 w-6 text-primary" />
              <span>Legal</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <button className="text-primary underline">View Claim Procedure</button><br />
            <button className="text-primary underline mt-2">View Terms and Conditions</button>
          </CardContent>
        </Card>

        <Button className="w-full h-14 text-lg" onClick={handleClaim}>
          Claim Insurance
        </Button>
      </div>
    </Layout>
  );
}

const CoverageCard = ({ title, coverage }: { title: string, coverage: typeof bikeCoverage }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {coverage.map((item, index) => (
        <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
          <div className="flex items-center gap-3">
            <item.icon className="h-6 w-6 text-muted-foreground" />
            <span className="font-medium">{item.title}</span>
          </div>
          <span className="font-bold">{item.amount}</span>
        </div>
      ))}
    </CardContent>
  </Card>
);
