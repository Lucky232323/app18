'use client';

import Layout from '@/components/app/Layout';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import type { Screen } from '@/lib/types';
import { Search } from 'lucide-react';
import { useState } from 'react';

type HelpPageProps = {
  navigateTo: (screen: Screen) => void;
  onBack?: () => void;
};

const faqs = [
  {
    category: 'Rides',
    questions: [
      { q: 'How to book a ride?', a: 'You can book a ride from the home screen by setting your pickup and destination.' },
      { q: 'How to cancel a ride?', a: 'You can cancel a ride from the ride status screen before the trip starts.' },
    ],
  },
  {
    category: 'Payment',
    questions: [
      { q: 'What payment methods are accepted?', a: 'We accept cash, wallet, and various UPI payments.' },
      { q: 'How do I apply a coupon?', a: 'You can apply coupons on the booking confirmation screen before booking your ride.' },
    ],
  },
  {
    category: 'Account',
    questions: [
      { q: 'How to update my profile?', a: 'You can update your profile from the profile screen, accessible via the side menu.' },
      { q: 'I forgot my password.', a: 'Our login is OTP-based, so you don\'t need a password. Just use your mobile number.' },
    ],
  },
];

export default function HelpPage({ navigateTo, onBack }: HelpPageProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFaqs = faqs.map(cat => ({
    ...cat,
    questions: cat.questions.filter(
      q => q.q.toLowerCase().includes(searchTerm.toLowerCase()) || q.a.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0);


  return (
    <Layout title="Help" navigateTo={navigateTo} onBack={onBack}>
      <div className="p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search for an issue"
            className="h-12 pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredFaqs.map((category) => (
          <div key={category.category}>
            <h2 className="text-lg font-bold my-4">{category.category}</h2>
            <Accordion type="single" collapsible className="w-full">
              {category.questions.map((faq, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger>{faq.q}</AccordionTrigger>
                  <AccordionContent>{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
        {filteredFaqs.length === 0 && (
          <div className="text-center text-muted-foreground py-10">
            <p>No results found for "{searchTerm}"</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
