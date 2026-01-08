'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ChevronRight, Tag, Wallet, Clock, Package } from 'lucide-react';
import type { Service, Screen } from '@/lib/types';
import VehicleIcon from './VehicleIcon';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose,
} from "@/components/ui/sheet"
import { Separator } from '../ui/separator';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { useState } from 'react';
import Image from 'next/image';

type BookingSheetProps = {
    pickup: string;
    destination: string;
    selectedService: Service['id'];
    onServiceSelect: (serviceId: Service['id']) => void;
    onBack: () => void;
    onBook: (service: Service['id'], details?: any) => void;
    navigateTo: (screen: Screen) => void;
    availableOffers?: any[]; // Promotion[]
};

const serviceOptions: Service[] = [
    { id: 'Bike', name: 'Bike', description: 'Quickest way', eta: 5, fare: 75, image: '/icons/bike.png' },
    { id: 'Auto', name: 'Auto', description: 'Economical', eta: 7, fare: 120, image: '/icons/auto.png' },
    { id: 'Cab', name: 'Cab', description: 'Comfortable', eta: 8, fare: 180, image: '/icons/cab.png' },
];

const rentalPackages = [
    { id: '1hr', name: '1 Hr / 10 km', fare: 150 },
    { id: '2hr', name: '2 Hr / 20 km', fare: 280 },
    { id: '4hr', name: '4 Hr / 40 km', fare: 550 },
    { id: '8hr', name: '8 Hr / 80 km', fare: 1000 },
];

const paymentMethods = [
    { id: 'cash', name: 'Cash' },
    { id: 'wallet', name: 'Wallet', balance: 150 },
    { id: 'gpay', name: 'GPay' },
];

export default function BookingSheet({ pickup, destination, selectedService, onServiceSelect, onBack, onBook, navigateTo, availableOffers = [] }: BookingSheetProps) {
    const [selectedPayment, setSelectedPayment] = useState('cash');
    const [appliedOffer, setAppliedOffer] = useState<Promotion | null>(null);
    const [bookingMode, setBookingMode] = useState<'daily' | 'rentals' | 'parcel'>('daily');
    const [selectedPackage, setSelectedPackage] = useState(rentalPackages[0].id);

    // --- Helper: Calculate Discount ---
    const calculateDiscountedFare = (originalFare: number) => {
        if (!appliedOffer) return originalFare;

        let discount = 0;
        if (appliedOffer.discountType === 'percentage') {
            discount = (originalFare * appliedOffer.value) / 100;
            if (appliedOffer.maxDiscount) discount = Math.min(discount, appliedOffer.maxDiscount);
        } else {
            discount = appliedOffer.value;
        }

        // Ensure discount doesn't exceed fare
        return Math.max(0, Math.round(originalFare - discount));
    };

    const getSavings = (originalFare: number) => {
        return originalFare - calculateDiscountedFare(originalFare);
    };

    const selectedBaseFare = bookingMode === 'rentals'
        ? rentalPackages.find(p => p.id === selectedPackage)?.fare || 0
        : serviceOptions.find(s => s.id === selectedService)?.fare || 0;

    const finalFare = calculateDiscountedFare(selectedBaseFare);
    const paymentMethodName = paymentMethods.find(p => p.id === selectedPayment)?.name || 'Cash';

    // ... receivers state ...
    const [receiverName, setReceiverName] = useState('');
    const [receiverPhone, setReceiverPhone] = useState('');

    const handleBookClick = () => {
        const details = {
            bookingMode,
            rentalPackage: bookingMode === 'rentals' ? rentalPackages.find(p => p.id === selectedPackage) : null,
            receiverName: bookingMode === 'parcel' ? receiverName : null,
            receiverPhone: bookingMode === 'parcel' ? receiverPhone : null,
            fare: finalFare,
            discountAttributes: appliedOffer ? { code: appliedOffer.code, saved: getSavings(selectedBaseFare) } : null
        };
        onBook(selectedService, details);
    }

    const handleApplyOffer = (offer: Promotion) => {
        setAppliedOffer(offer);
        // Toast logic could be added here
    };

    const handleRemoveOffer = () => {
        setAppliedOffer(null);
    };

    return (
        <div className="absolute bottom-0 left-0 right-0 z-30">
            <Card className="rounded-t-2xl rounded-b-none shadow-2xl bg-background border-t-0">
                <CardContent className="p-4 space-y-4 pb-8">
                    {/* Tab Switcher */}
                    <div className="flex p-1 bg-secondary/50 rounded-xl mb-2">
                        {['daily', 'rentals', 'parcel'].map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setBookingMode(mode as any)}
                                className={`flex-1 py-1.5 text-sm font-semibold rounded-lg capitalize transition-all ${bookingMode === mode ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>

                    {/* Location Header */}
                    <div className="flex items-center">
                        <Button variant="ghost" size="icon" onClick={onBack} className="mr-2 -ml-2">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="space-y-1 flex-1 overflow-hidden">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500 ring-2 ring-green-500/30 shrink-0"></div>
                                <p className="font-medium text-sm truncate">{pickup}</p>
                            </div>
                            {bookingMode !== 'rentals' && (
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-500/30 shrink-0"></div>
                                    <p className="font-medium text-sm truncate">{bookingMode === 'parcel' ? 'Receiver Location' : destination}</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <Separator className="opacity-50" />

                    {/* DAILY Content */}
                    {bookingMode === 'daily' && (
                        <div className="space-y-3">
                            {serviceOptions.map(service => {
                                const discountedFare = calculateDiscountedFare(service.fare);
                                const savings = service.fare - discountedFare;
                                const isSelected = selectedService === service.id;

                                return (
                                    <Card
                                        key={service.id}
                                        className={`relative overflow-hidden flex items-center p-3 gap-4 cursor-pointer transition-all border-2 ${isSelected ? 'border-primary bg-yellow-50/50 dark:bg-yellow-900/10' : 'border-transparent hover:bg-secondary/50'}`}
                                        onClick={() => onServiceSelect(service.id)}
                                    >
                                        <VehicleIcon service={service.id} className="h-12 w-12 p-1" />
                                        <div className="flex-1">
                                            <h3 className="font-bold text-base">{service.name}</h3>
                                            <p className="text-xs text-muted-foreground">{service.description} • {service.eta} min</p>
                                            {appliedOffer && savings > 0 && (
                                                <span className="text-[10px] font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded mt-1 inline-block">
                                                    {appliedOffer.code} applied
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            {appliedOffer && savings > 0 ? (
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs text-muted-foreground line-through decoration-red-500">₹{service.fare}</span>
                                                    <span className="font-bold text-lg">₹{discountedFare}</span>
                                                </div>
                                            ) : (
                                                <p className="font-bold text-lg">₹{service.fare}</p>
                                            )}
                                        </div>
                                        {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r"></div>}
                                    </Card>
                                )
                            })}
                        </div>
                    )}

                    {/* RENTALS & PARCEL Content (Simplified for brevity, similar logic applies) */}
                    {bookingMode !== 'daily' && (
                        <div className="text-center py-8 bg-secondary/20 rounded-xl border-dashed border-2 border-secondary">
                            <p className="text-sm text-muted-foreground mb-4">Select options below</p>
                            {bookingMode === 'rentals' && (
                                <div className="grid grid-cols-2 gap-3">
                                    {rentalPackages.map(pkg => (
                                        <button key={pkg.id} onClick={() => setSelectedPackage(pkg.id)} className={`p-3 rounded-xl border-2 text-center transition-all ${selectedPackage === pkg.id ? 'border-primary bg-primary/5' : 'border-transparent bg-background'}`}>
                                            <p className="font-bold text-sm">{pkg.name}</p>
                                            <p className="text-lg font-bold">₹{pkg.fare}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {bookingMode === 'parcel' && (
                                <div className="p-4 space-y-4 text-left">
                                    <Input placeholder="Receiver Name" value={receiverName} onChange={e => setReceiverName(e.target.value)} />
                                    <Input placeholder="Receiver Phone" value={receiverPhone} onChange={e => setReceiverPhone(e.target.value)} />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="grid grid-cols-[1fr,auto] gap-3 pt-2">
                        {/* Payment Selection */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" className="h-12 justify-start px-3 bg-secondary/30 border-0">
                                    <div className="p-1.5 bg-white rounded-full mr-2 shadow-sm">
                                        <Wallet className="h-4 w-4 text-black" />
                                    </div>
                                    <div className="text-left flex-1 overflow-hidden">
                                        <p className="text-xs text-muted-foreground font-medium">Payment</p>
                                        <p className="text-sm font-bold truncate">{paymentMethodName}</p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground ml-1" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="bottom">
                                <SheetHeader><SheetTitle>Payment Method</SheetTitle></SheetHeader>
                                <div className="py-4 space-y-2">
                                    {paymentMethods.map(p => (
                                        <button key={p.id} onClick={() => setSelectedPayment(p.id)} className="w-full flex items-center p-4 rounded-xl hover:bg-secondary transition-colors">
                                            <div className={`w-4 h-4 rounded-full border mr-3 ${selectedPayment === p.id ? 'bg-black border-black' : 'border-gray-300'}`} />
                                            <span className="font-medium">{p.name}</span>
                                        </button>
                                    ))}
                                    <SheetClose asChild><Button className="w-full mt-4">Done</Button></SheetClose>
                                </div>
                            </SheetContent>
                        </Sheet>

                        {/* Offers Selection */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" className={`h-12 px-4 border-0 ${appliedOffer ? 'bg-green-50 text-green-700' : 'bg-secondary/30'}`}>
                                    <div className="flex items-center gap-2">
                                        <Tag className="h-4 w-4" />
                                        <span className="font-bold">{appliedOffer ? `Saved ₹${getSavings(selectedBaseFare)}` : 'Coupons'}</span>
                                    </div>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="bottom" className="h-[80vh]">
                                <SheetHeader className="text-left">
                                    <SheetTitle>Apply Coupon</SheetTitle>
                                </SheetHeader>
                                <div className="py-4 space-y-4">
                                    <div className="flex gap-2">
                                        <Input placeholder="Enter code" className="uppercase" />
                                        <Button variant="secondary">Check</Button>
                                    </div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Available Coupons</p>
                                    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                                        {availableOffers.length === 0 ? (
                                            <p className="text-center text-muted-foreground py-8">No active coupons available.</p>
                                        ) : (
                                            availableOffers.map((offer: Promotion) => (
                                                <Card key={offer.id} className="p-4 border-l-4 border-l-orange-500 cursor-pointer hover:shadow-md transition-all group" onClick={() => {/* Pre-fill input or apply directly */ }}>
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-bold text-lg">{offer.code}</h4>
                                                            <p className="text-sm text-muted-foreground line-clamp-2">{offer.description}</p>
                                                            <p className="text-xs text-green-600 font-bold mt-2">
                                                                {offer.discountType === 'percentage' ? `${offer.value}% OFF` : `FLAT ₹${offer.value} OFF`}
                                                            </p>
                                                        </div>
                                                        <SheetClose asChild>
                                                            <Button size="sm" onClick={() => handleApplyOffer(offer)} disabled={appliedOffer?.id === offer.id} className={appliedOffer?.id === offer.id ? 'bg-green-600 hover:bg-green-700' : ''}>
                                                                {appliedOffer?.id === offer.id ? 'APPLIED' : 'APPLY'}
                                                            </Button>
                                                        </SheetClose>
                                                    </div>
                                                </Card>
                                            ))
                                        )}
                                    </div>
                                    {appliedOffer && (
                                        <Button variant="destructive" className="w-full" onClick={handleRemoveOffer}>Remove Applied Coupon</Button>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    <Button className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20 rounded-xl" onClick={handleBookClick}>
                        Book {selectedService} - ₹{finalFare}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

// Add these imports at the top
import { Promotion } from '@/lib/types';

