'use client';

import { GeoPoint } from 'firebase/firestore';

export type Screen =
  | 'splash'
  | 'role-selection'
  | 'login'
  | 'captain-login'
  | 'admin-login'
  | 'permissions'
  | 'home'
  | 'ride-history'
  | 'wallet'
  | 'profile'
  | 'settings'
  | 'help'
  | 'safety'
  | 'refer'
  | 'rewards'
  | 'power-pass'
  | 'coins'
  | 'notifications'
  | 'payments'
  | 'claims'
  | 'my-rating'
  | 'otp-verified'
  | 'details'
  | 'captain-dashboard'
  | 'captain-documents'
  | 'captain-vehicle-selection'
  | 'admin-dashboard'
  | 'admin-captains'
  | 'admin-users'
  | 'admin-rides'
  | 'admin-sos-alerts'
  | 'admin-payments'
  | 'admin-offers'
  | 'admin-ratings'
  | 'admin-notifications'
  | 'admin-settings'
  | 'chat'
  | 'offers';

export type User = {
  phone: string;
  name: string;
  email: string;
  gender?: 'male' | 'female' | 'other';
  role?: 'rider' | 'captain' | 'admin';
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export type CaptainProfile = {
  id: string;
  name: string;
  vehicleType: 'Bike' | 'Auto' | 'Cab';
  status: 'pending' | 'approved' | 'blocked';
  isOnline?: boolean;
  location?: GeoPoint;
  lastLocationUpdate?: any; // Firestore Timestamp
}

export type Ride = {
  id: string;
  captain?: {
    name: string;
    vehicle: string;
    rating: number;
    image: string;
  };
  captainId?: string;
  captainName?: string; // Denormalized captain name
  riderId?: string;
  riderName?: string;   // Denormalized rider name
  riderPhone?: string;  // Denormalized rider phone
  pickup?: string; // For mock
  pickupLocation?: string; // For firestore
  destination?: string; // For mock
  dropLocation?: string; // For firestore
  fare?: number; // for mock
  estimatedFare?: number; // for firestore
  service: 'Bike' | 'Auto' | 'Cab';
  date?: string;
  status?: RideStatus;
  captainLocation?: GeoPoint;
  createdAt?: any;
  otp?: string;
  paymentMethod?: string;
  bookingMode?: 'daily' | 'rentals' | 'parcel';
  rentalPackage?: any;
  receiverName?: string;
  receiverPhone?: string;
};

export type Message = {
  id: string;
  rideId: string;
  senderId: string;
  senderRole: 'rider' | 'captain';
  text: string;
  timestamp: any; // Firestore ServerTimestamp
}

export type RideStatus = 'SEARCHING' | 'ACCEPTED' | 'ARRIVED' | 'STARTED' | 'ENDED' | 'PAID' | 'CANCELLED';

export type Service = {
  id: 'Bike' | 'Auto' | 'Cab';
  name: string;
  description: string;
  eta: number;
  fare: number;
  image?: string;
};

export type Promotion = {
  id: string;
  code: string;
  discountType: 'percentage' | 'flat';
  value: number;
  description: string;
  validUntil: any;
  targetAudience: 'ALL' | 'RIDERS' | 'CAPTAINS';
  minFare?: number;
  maxDiscount?: number;
};
