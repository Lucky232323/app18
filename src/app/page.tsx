'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { FirebaseClientProvider, useUser, useDoc, useFirebase } from '@/firebase';
import SplashScreen from '@/components/app/SplashScreen';
import RoleSelectionPage from '@/components/app/RoleSelectionPage';
import LoginPage from '@/components/app/LoginPage';
import CaptainLoginPage from '@/components/app/CaptainLoginPage';
import AdminLoginPage from '@/app/admin/page';
import AdminDashboardPage from '@/app/admin/dashboard/page';
import AdminCaptainsPage from '@/app/admin/captains/page';
import AdminUsersPage from '@/app/admin/users/page';
import AdminRidesPage from '@/app/admin/rides/page';
import AdminSosAlertsPage from '@/app/admin/sos-alerts/page';
import AdminOffersPage from '@/app/admin/offers/page';
import AdminRatingsPage from '@/app/admin/ratings/page';
import AdminNotificationsPage from '@/app/admin/notifications/page';
import AdminSettingsPage from '@/app/admin/settings/page';
import AdminPaymentsPage from '@/app/admin/payments/page';
import PermissionsPage from '@/components/app/PermissionsPage';
import HomePage from '@/components/app/HomePage';
import RideHistoryPage from '@/app/ride-history/page';
import OffersPage from '@/app/offers/page';
import WalletPage from '@/app/wallet/page';
import ProfilePage from '@/app/profile/page';
import HelpPage from '@/app/help/page';
import SafetyPage from '@/app/safety/page';
import ReferPage from '@/app/refer/page';
import MyRewardsPage from '@/app/rewards/page';
import PowerPassPage from '@/app/power-pass/page';
import RiderAppCoinsPage from '@/app/coins/page';
import NotificationsPage from '@/app/notifications/page';
import PaymentsPage from '@/app/payments/page';
import ClaimsPage from '@/app/claims/page';
import SettingsPage from '@/app/settings/page';
import MyRatingPage from '@/app/my-rating/page';
import CaptainDashboardPage from '@/app/captain-dashboard/page';
import CaptainDocumentsPage from '@/app/captain-documents/page';
import CaptainVehicleSelectionPage from '@/app/captain-vehicle-selection/page';
import ChatPage from '@/app/chat/page';


import type { User, Ride, Screen } from '@/lib/types';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';


function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [appUser, setAppUser] = useState<User | null>(null);
  const [rideHistory, setRideHistory] = useState<Ride[]>([]);
  const [userRole, setUserRole] = useState<'rider' | 'captain' | 'admin' | null>(null);
  const [activeRideId, setActiveRideId] = useState<string | null>(null);
  const [activeChatRideId, setActiveChatRideId] = useState<string | null>(null);
  // New state to control if side menu should be open when returning to home
  const [shouldOpenSideMenu, setShouldOpenSideMenu] = useState(false);

  const { user: firebaseUser, isUserLoading, firestore } = useFirebase();

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (currentScreen === 'splash') {
        if (isUserLoading) {
          // Stay on splash while checking auth
          return;
        }
        if (firebaseUser) {
          // If user is logged in via Firebase, try to load app user data
          let storedUser = null;
          let storedRole = null;
          if (typeof window !== "undefined") {
            try {
              storedUser = localStorage.getItem('rider-app-user');
              storedRole = localStorage.getItem('rider-app-role') as 'rider' | 'captain' | 'admin' | null;
            } catch (e) { console.error(e) }
          }
          if (storedUser && storedRole) {
            setAppUser(JSON.parse(storedUser));
            setUserRole(storedRole);
            if (storedRole === 'captain') {
              setCurrentScreen('captain-dashboard');
            } else if (storedRole === 'admin') {
              setCurrentScreen('admin-dashboard');
            }
            else {
              setCurrentScreen('home');
            }
          } else {
            // Fallback: Try to fetch from Firestore
            if (firestore) {
              try {
                // Try Rider Profile First
                const userDocRef = doc(firestore, 'userProfiles', firebaseUser.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                  const userData = userDocSnap.data() as User;
                  setAppUser(userData);
                  setUserRole('rider');
                  setCurrentScreen('home');
                  if (typeof window !== "undefined") localStorage.setItem('rider-app-user', JSON.stringify(userData));
                  if (typeof window !== "undefined") localStorage.setItem('rider-app-role', 'rider');
                  return;
                }

                // Try Captain Profile
                const captainDocRef = doc(firestore, 'captainProfiles', firebaseUser.uid);
                const captainDocSnap = await getDoc(captainDocRef);

                if (captainDocSnap.exists()) {
                  const captainData = captainDocSnap.data() as User;
                  setAppUser(captainData);
                  setUserRole('captain');
                  setCurrentScreen('captain-dashboard');
                  if (typeof window !== "undefined") localStorage.setItem('rider-app-user', JSON.stringify(captainData));
                  if (typeof window !== "undefined") localStorage.setItem('rider-app-role', 'captain');
                  return;
                }

                // Try Admin Profile
                const adminDocRef = doc(firestore, 'adminProfiles', firebaseUser.uid);
                const adminDocSnap = await getDoc(adminDocRef);

                if (adminDocSnap.exists()) {
                  // Ensure the data matches the User type or create a placeholder
                  const adminData = adminDocSnap.data();
                  const appAdminUser: User = {
                    name: adminData.name || "Admin",
                    email: adminData.email || firebaseUser.email || "",
                    phone: adminData.phone || ""
                  };

                  setAppUser(appAdminUser);
                  setUserRole('admin');
                  setCurrentScreen('admin-dashboard');
                  if (typeof window !== "undefined") localStorage.setItem('rider-app-user', JSON.stringify(appAdminUser));
                  if (typeof window !== "undefined") localStorage.setItem('rider-app-role', 'admin');
                  return;
                }

                // If neither, go to role selection (e.g. fresh login but no profile created yet?)
                setCurrentScreen('role-selection');

              } catch (err) {
                console.error("Error fetching user profile:", err);
                setCurrentScreen('role-selection');
              }
            } else {
              setCurrentScreen('role-selection');
            }
          }
        } else {
          setCurrentScreen('role-selection');
        }
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [currentScreen, firebaseUser, isUserLoading, firestore]);

  const handleRoleSelection = useCallback((role: 'rider' | 'captain' | 'admin') => {
    setUserRole(role);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem('rider-app-role', role);
      } catch (e) { console.error(e) }
    }
    if (role === 'captain') {
      setCurrentScreen('captain-login');
    } else if (role === 'admin') {
      setCurrentScreen('admin-login');
    } else {
      setCurrentScreen('login');
    }
  }, []);

  const onDetailsComplete = useCallback(() => {
    if (userRole === 'captain') {
      setCurrentScreen('captain-documents');
    } else {
      setCurrentScreen('permissions');
    }
  }, [userRole]);

  const handleDocumentsComplete = () => {
    setCurrentScreen('captain-vehicle-selection');
  }

  const handleLoginSuccess = useCallback((loggedInUser: User, fbUser: FirebaseUser, role?: 'rider' | 'captain' | 'admin') => {
    setAppUser(loggedInUser);

    // Explicitly set role if passed (important for signup flow)
    let roleToUse = userRole;
    if (role) {
      setUserRole(role);
      roleToUse = role;
      if (typeof window !== "undefined") localStorage.setItem('rider-app-role', role);
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem('rider-app-user', JSON.stringify(loggedInUser));
      } catch (e) {
        console.error("Failed to write to localStorage", e);
      }
    }

    if (roleToUse === 'captain') {
      setCurrentScreen('captain-dashboard');
    } else if (roleToUse === 'admin') {
      setCurrentScreen('admin-dashboard');
    } else {
      // Rider
      // Check if we need to show permissions or go Home directly
      // onDetailsComplete will handle 'permissions' -> 'home'
      if (roleToUse === 'rider') {
        // Assuming rider login/signup implies basic details are done
        onDetailsComplete(); // This goes to Permissions
      } else {
        onDetailsComplete();
      }
    }
  }, [userRole, onDetailsComplete]);

  const handlePermissionsGranted = useCallback(() => {
    setCurrentScreen('home');
  }, []);

  const handleRideComplete = useCallback((ride: Ride) => {
    const newHistory = [ride, ...rideHistory];
    setRideHistory(newHistory);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem('rider-app-ride-history', JSON.stringify(newHistory));
      } catch (e) {
        console.error("Failed to write to localStorage", e);
      }
    }
  }, [rideHistory]);

  const onLogout = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem('rider-app-user');
        localStorage.removeItem('rider-app-ride-history');
        localStorage.removeItem('rider-app-role');
      } catch (e) {
        console.error("Failed to remove from localStorage", e);
      }
    }
    setAppUser(null);
    setRideHistory([]);
    setActiveRideId(null);
    setUserRole(null);
    setCurrentScreen('role-selection');
  }, []);

  const handleUserUpdate = useCallback((updatedUser: User) => {
    setAppUser(updatedUser);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem('rider-app-user', JSON.stringify(updatedUser));
      } catch (e) {
        console.error("Failed to write to localStorage", e);
      }
    }
  }, []);

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
    // Reset side menu flag when navigating away normally, unless we specifically set it elsewhere
    setShouldOpenSideMenu(false);
  };

  const navigateBackToMenu = () => {
    setShouldOpenSideMenu(true);
    setCurrentScreen('home');
  };

  const openChat = (rideId: string) => {
    setActiveChatRideId(rideId);
    setCurrentScreen('chat');
  }

  const closeChat = () => {
    setActiveChatRideId(null);
    // Return to the previous screen based on role
    if (userRole === 'captain') {
      setCurrentScreen('captain-dashboard');
    } else if (userRole === 'rider') {
      setCurrentScreen('home');
    } else {
      // Fallback for any other case
      setCurrentScreen('home');
    }
  }

  const renderScreen = () => {
    if (isUserLoading || currentScreen === 'splash') {
      return <SplashScreen />;
    }

    switch (currentScreen) {
      case 'role-selection':
        return <RoleSelectionPage onRoleSelect={handleRoleSelection} />;
      case 'login':
        return <LoginPage navigateTo={navigateTo} onLoginSuccess={handleLoginSuccess} />;
      case 'captain-login':
        return <CaptainLoginPage onLoginSuccess={handleLoginSuccess} navigateTo={navigateTo} onDetailsComplete={onDetailsComplete} />;
      case 'admin-login':
        return <AdminLoginPage navigateTo={navigateTo} onLoginSuccess={handleLoginSuccess} />;
      case 'admin-dashboard':
        return <AdminDashboardPage user={appUser} onLogout={onLogout} navigateTo={navigateTo} currentScreen={currentScreen} />;
      case 'admin-captains':
        return <AdminCaptainsPage user={appUser} onLogout={onLogout} navigateTo={navigateTo} currentScreen={currentScreen} />;
      case 'admin-users':
        return <AdminUsersPage user={appUser} onLogout={onLogout} navigateTo={navigateTo} currentScreen={currentScreen} />;
      case 'admin-rides':
        return <AdminRidesPage user={appUser} onLogout={onLogout} navigateTo={navigateTo} currentScreen={currentScreen} />;
      case 'admin-sos-alerts':
        return <AdminSosAlertsPage user={appUser} onLogout={onLogout} navigateTo={navigateTo} currentScreen={currentScreen} />;
      case 'admin-offers':
        return <AdminOffersPage user={appUser} onLogout={onLogout} navigateTo={navigateTo} currentScreen={currentScreen} />;
      case 'admin-ratings':
        return <AdminRatingsPage user={appUser} onLogout={onLogout} navigateTo={navigateTo} currentScreen={currentScreen} />;
      case 'admin-notifications':
        return <AdminNotificationsPage user={appUser} onLogout={onLogout} navigateTo={navigateTo} currentScreen={currentScreen} />;
      case 'admin-settings':
        return <AdminSettingsPage user={appUser} onLogout={onLogout} navigateTo={navigateTo} currentScreen={currentScreen} />;
      case 'admin-payments':
        return <AdminPaymentsPage user={appUser} onLogout={onLogout} navigateTo={navigateTo} currentScreen={currentScreen} />;
      case 'permissions':
        return <PermissionsPage onPermissionsGranted={handlePermissionsGranted} />;
      case 'home':
        return <HomePage user={appUser} onRideComplete={handleRideComplete} navigateTo={navigateTo} handleLogout={onLogout} openChat={openChat} activeRideId={activeRideId} onActiveRideIdChange={setActiveRideId} initialSideMenuOpen={shouldOpenSideMenu} />;
      case 'captain-dashboard':
        return <CaptainDashboardPage captain={appUser} onLogout={onLogout} openChat={openChat} />;
      case 'captain-documents':
        return <CaptainDocumentsPage onDocumentsComplete={handleDocumentsComplete} navigateTo={navigateTo} />;
      case 'captain-vehicle-selection':
        return <CaptainVehicleSelectionPage onVehicleSelected={handleLoginSuccess} />;
      case 'chat':
        if (!activeChatRideId || !userRole) return null; // Or show an error/fallback
        return <ChatPage rideId={activeChatRideId} userRole={userRole} onBack={closeChat} />;
      case 'ride-history':
        return <RideHistoryPage navigateTo={navigateTo} rides={rideHistory} onBack={navigateBackToMenu} />;
      case 'wallet':
        return <WalletPage navigateTo={navigateTo} onBack={navigateBackToMenu} />;
      case 'profile':
        return <ProfilePage user={appUser} navigateTo={navigateTo} onUserUpdate={handleUserUpdate} onLogout={onLogout} onBack={navigateBackToMenu} />;
      case 'help':
        return <HelpPage navigateTo={navigateTo} onBack={navigateBackToMenu} />;
      case 'safety':
        return <SafetyPage navigateTo={navigateTo} onBack={navigateBackToMenu} />;
      case 'refer':
        return <ReferPage navigateTo={navigateTo} onBack={navigateBackToMenu} />;
      case 'rewards':
        return <MyRewardsPage navigateTo={navigateTo} onBack={navigateBackToMenu} />;
      case 'power-pass':
        return <PowerPassPage navigateTo={navigateTo} onBack={navigateBackToMenu} />;
      case 'coins':
        return <RiderAppCoinsPage navigateTo={navigateTo} onBack={navigateBackToMenu} />;
      case 'notifications':
        return <NotificationsPage navigateTo={navigateTo} onBack={navigateBackToMenu} />;
      case 'payments':
        return <PaymentsPage navigateTo={navigateTo} onBack={navigateBackToMenu} />;
      case 'claims':
        return <ClaimsPage navigateTo={navigateTo} onBack={navigateBackToMenu} />;
      case 'settings':
        return <SettingsPage navigateTo={navigateTo} onLogout={onLogout} onBack={navigateBackToMenu} />;
      case 'my-rating':
        return <MyRatingPage navigateTo={navigateTo} onBack={navigateBackToMenu} />;
      case 'offers':
        return <OffersPage navigateTo={navigateTo} onBack={navigateBackToMenu} />;
      default:
        if (firebaseUser) {
          if (userRole === 'captain') {
            return <CaptainDashboardPage captain={appUser} onLogout={onLogout} openChat={openChat} />;
          }
          if (userRole === 'admin') {
            return <AdminDashboardPage user={appUser} onLogout={onLogout} navigateTo={navigateTo} currentScreen={currentScreen} />;
          }
          return <HomePage user={appUser} onRideComplete={handleRideComplete} navigateTo={navigateTo} handleLogout={onLogout} openChat={openChat} activeRideId={activeRideId} onActiveRideIdChange={setActiveRideId} initialSideMenuOpen={shouldOpenSideMenu} />;
        }
        return <RoleSelectionPage onRoleSelect={handleRoleSelection} />;
    }
  };

  return <div className="font-body">{renderScreen()}</div>;
}


export default function AppController() {
  return (
    <FirebaseClientProvider>
      <App />
    </FirebaseClientProvider>
  );
}
