'use client';
import { useState } from 'react';
import Layout from '@/components/app/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Screen } from '@/lib/types';
import { Wallet as WalletIcon } from 'lucide-react';

type WalletPageProps = {
  navigateTo: (screen: Screen) => void;
  onBack?: () => void;
};

export default function WalletPage({ navigateTo, onBack }: WalletPageProps) {
  const [balance, setBalance] = useState(150.00);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAddMoney = () => {
    const addAmount = parseFloat(amount);
    if (!isNaN(addAmount) && addAmount > 0) {
      setIsLoading(true);
      setTimeout(() => {
        setBalance(balance + addAmount);
        setAmount('');
        setIsLoading(false);
        toast({
          title: "Success!",
          description: `₹${addAmount.toFixed(2)} added to your wallet.`,
        });
      }, 1000);
    } else {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid amount to add.",
      });
    }
  };

  return (
    <Layout title="Wallet" navigateTo={navigateTo} onBack={onBack}>
      <div className="p-4 space-y-6">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span>Your Balance</span>
              <WalletIcon />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">₹{balance.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Money to Wallet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-14 text-lg"
            />
            <Button
              className="w-full h-14 text-lg"
              onClick={handleAddMoney}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Add Money'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
              <p>No recent transactions</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
