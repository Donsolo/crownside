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

function App() {
  // Subdomain Logic
  const hostname = window.location.hostname; // e.g., "crownside.com" or "queenlashes.crownside.com"
  const parts = hostname.split('.');

  // Logic: 
  // localhost: parts = ['localhost'] (len 1) -> No subdomain
  // queenlashes.localhost: parts = ['queenlashes', 'localhost'] (len 2) -> Subdomain 'queenlashes'
  // crownside.com: parts = ['crownside', 'com'] (len 2) -> No subdomain (standard prod)
  // www.crownside.com: parts = ['www', 'crownside', 'com'] (len 3) -> Ignore 'www'
  // queenlashes.crownside.com: parts = ['queenlashes', 'crownside', 'com'] (len 3) -> Subdomain 'queenlashes'

  let subdomain = null;

  // Simple heuristic for now: 
  if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'api') {
    subdomain = parts[0];
  } else if (parts.length === 2 && parts[1] === 'localhost' && parts[0] !== 'www') {
    // Localhost testing support
    subdomain = parts[0];
  }

  // If a specific storefront subdomain is detected, we render ONLY the simplified storefront flow.
  if (subdomain) {
    return (
      <Router>
        <ScrollToTop />
        <AuthProvider>
          <ThemeProvider>
            <NotificationProvider>
              <Elements stripe={stripePromise}>
                <div className="min-h-screen flex flex-col">
                  <Navbar />
                  <main className="flex-grow pb-[68px] md:pb-0">
                    <StylistProfile handle={subdomain} />
                  </main>
                  <Footer />
                  <CookieConsent />
                </div>
              </Elements>
            </NotificationProvider>
          </ThemeProvider>
        </AuthProvider>
      </Router>
    );
  }

  // Standard App Routing
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <ThemeProvider>
          <NotificationProvider>
            <Elements stripe={stripePromise}>
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow pb-[68px] md:pb-0">
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
                </main>
                <BottomNav />
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
