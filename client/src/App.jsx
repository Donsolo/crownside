import React from 'react';
import ConnectionsPage from './pages/ConnectionsPage';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from './lib/stripe';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';
import CookieConsent from './components/CookieConsent';
import InstallPrompt from './components/InstallPrompt';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import StylistDashboard from './pages/StylistDashboard';
import Explore from './pages/Explore';
import StylistProfile from './pages/StylistProfile';
import MyBookings from './pages/MyBookings';
import ClientProfile from './pages/ClientProfile';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Contact from './pages/Contact';
import About from './pages/About';
import FAQ from './pages/FAQ';
import AdminHeroManager from './pages/admin/AdminHeroManager';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPros from './pages/admin/AdminPros';
import AdminBookings from './pages/admin/AdminBookings';
import AdminReviews from './pages/admin/AdminReviews';
import AdminSettings from './pages/admin/AdminSettings';
import AdminSubscriptions from './pages/admin/AdminSubscriptions';
import AccountSettings from './pages/AccountSettings';
import ForumLanding from './pages/ForumLanding';
import ForumFeed from './pages/ForumFeed';
import CreatePost from './pages/CreatePost';
import PostDetail from './pages/PostDetail';
import ModeratorDashboard from './pages/ModeratorDashboard';
import UserProfile from './pages/UserProfile';
import MessageThread from './pages/MessageThread';
import ScrollToTop from './components/ScrollToTop';

import { usePullToRefresh } from './hooks/usePullToRefresh';

function App() {
  // Subdomain Logic
  const hostname = window.location.hostname; // e.g., "thecrownside.com" or "queenlashes.thecrownside.com"
  const parts = hostname.split('.');

  // Analytics Tracking
  // We use a ref to prevent double-firing in React 18 Strict Mode dev, 
  // though backend also handles IP hashing.
  const location = window.location;
  React.useEffect(() => {
    const trackVisit = async () => {
      try {
        // Wait a moment to ensure route is settled? 
        // Actually, just fire.
        await import('./lib/api').then(module => {
          const api = module.default;
          api.post('/analytics/visit', {
            path: location.pathname + location.search
          }).catch(err => console.debug("Analytics skipped", err));
        });
      } catch (e) {
        // Silent fail
      }
    };
    trackVisit();
  }, [window.location.pathname]); // Re-run on path change

  // Logic: 
  // localhost: parts = ['localhost'] (len 1) -> No subdomain
  // queenlashes.localhost: parts = ['queenlashes', 'localhost'] (len 2) -> Subdomain 'queenlashes'
  // thecrownside.com: parts = ['thecrownside', 'com'] (len 2) -> No subdomain (standard prod)
  // www.thecrownside.com: parts = ['www', 'thecrownside', 'com'] (len 3) -> Ignore 'www'
  // queenlashes.thecrownside.com: parts = ['queenlashes', 'thecrownside', 'com'] (len 3) -> Subdomain 'queenlashes'

  let subdomain = null;

  // Simple heuristic for now: 
  /* TEMPORARILY DISABLED FOR STABILITY
  if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'api') {
    subdomain = parts[0];
  } else if (parts.length === 2 && parts[1] === 'localhost' && parts[0] !== 'www') {
    // Localhost testing support
    subdomain = parts[0];
  }
  */
  // Force disable subdomains
  subdomain = null;

  // Pull to Refresh Polyfill (iOS PWA)
  usePullToRefresh();

  // Unified App Structure
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <ThemeProvider>
          <NotificationProvider>
            <Elements stripe={stripePromise}>
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main
                  className="flex-grow md:pb-0 transition-all duration-300"
                  style={{
                    // Mobile: Base nav content (~60px) + Base Padding (12px) + Safe Area
                    // We use 80px base to be safe and ensure no overlap
                    paddingBottom: 'calc(80px + env(safe-area-inset-bottom))'
                  }}
                >
                  {subdomain ? (
                    // Storefront Mode: Render StylistProfile directly
                    // This preserves the App Shell (Auth, Navbar, etc.) but isolates the view
                    <StylistProfile handle={subdomain} />
                  ) : (
                    // Standard App Routing
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/explore" element={<Explore />} />
                      <Route path="/stylist/:id" element={<StylistProfile />} />
                      <Route path="/my-bookings" element={<MyBookings />} />
                      <Route path="/profile" element={<ClientProfile />} />
                      <Route path="/account-settings" element={<AccountSettings />} />
                      <Route path="/connections" element={<ConnectionsPage />} />

                      {/* Forum Routes */}
                      <Route path="/forum" element={<ForumLanding />} />
                      <Route path="/forum/feed" element={<ForumFeed />} />
                      <Route path="/forum/create" element={<CreatePost />} />
                      <Route path="/forum/:id" element={<PostDetail />} />
                      <Route path="/moderator" element={<ModeratorDashboard />} />

                      {/* Social Routes */}
                      <Route path="/user/:userId" element={<UserProfile />} />
                      <Route path="/messages/:conversationId" element={<MessageThread />} />

                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/dashboard" element={<StylistDashboard />} />
                      <Route path="/privacy" element={<PrivacyPolicy />} />
                      <Route path="/terms" element={<TermsOfService />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/faq" element={<FAQ />} />

                      <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="heroes" element={<AdminHeroManager />} />
                        <Route path="users" element={<AdminUsers />} />
                        <Route path="pros" element={<AdminPros />} />
                        <Route path="bookings" element={<AdminBookings />} />
                        <Route path="reviews" element={<AdminReviews />} />
                        <Route path="pricing" element={<AdminSubscriptions />} />
                        <Route path="settings" element={<AdminSettings />} />
                      </Route>
                    </Routes>
                  )}
                </main>
                {/* Hide BottomNav on Subdomain Storefronts for "App-like" feel, or keep it? User said "Bottom nav may be hidden" */}
                {!subdomain && <BottomNav />}
                <Footer />
                <CookieConsent />
                <InstallPrompt />
              </div>
            </Elements>
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
