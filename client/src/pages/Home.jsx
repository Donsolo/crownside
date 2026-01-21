import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import badge from '../assets/badge.png';
import Hero from '../components/Hero';
import { useAuth } from '../context/AuthContext';
import { SERVICE_CATEGORIES } from '../config/categories';
import api from '../lib/api';
import { FaUserCircle, FaStar, FaMapMarkerAlt, FaSearch, FaCalendarAlt, FaCut } from 'react-icons/fa';

import { useNotifications } from '../context/NotificationContext';
import MyConnections from '../components/MyConnections';

export default function Home() {
    const { user } = useAuth();

    if (user) {
        return <AuthenticatedHome user={user} />;
    }

    return <LandingPage />;
}

function AuthenticatedHome({ user }) {
    const navigate = useNavigate();
    const { counts } = useNotifications();
    const [featuredPros, setFeaturedPros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showConnections, setShowConnections] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch stylists for "Featured" section
                // In a real app, this might be /stylists?featured=true
                const res = await api.get('/stylists');
                // Just take the first 5 for now
                setFeaturedPros(res.data.slice(0, 5));
            } catch (err) {
                console.error("Failed to fetch home data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Greeting based on time
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const displayName = user.displayName || user.email?.split('@')[0] || 'Beautiful';

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] pb-20 transition-colors duration-300">
            {/* 1. SOFT HERO */}
            <Hero
                pageKey="home"
                className="h-[35vh] min-h-[300px] flex items-center justify-center text-center relative"
                overlayOpacity={0.5}
            >
                <div className="relative z-10 container mx-auto px-4">
                    <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-2 drop-shadow-md">
                        {greeting}, {displayName}.
                    </h1>
                    <p className="text-white/90 text-lg font-medium">
                        Your beauty, beautifully booked.
                    </p>
                </div>
            </Hero>

            <div className="container mx-auto px-4 -mt-10 relative z-20">

                {/* 2. QUICK ACTIONS CARD ROW */}
                {/* 2. QUICK ACTIONS CARD ROW */}
                <div className="flex flex-col gap-4 mb-10 max-w-xl mx-auto">
                    <div className="grid grid-cols-2 gap-4 animate-enter animate-delay-1">
                        {/* Find a Pro */}
                        <Link to="/explore" className="group relative bg-gradient-to-br from-[var(--card-bg)] to-[var(--bg-tertiary)] p-5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-[var(--border-subtle)] hover:scale-[1.02] transition-all duration-200 ease-out flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-[var(--bg-primary)] shadow-sm flex items-center justify-center text-crown-gold mb-3 text-lg group-hover:text-crown-gold/80 transition-colors">
                                <FaSearch />
                            </div>
                            <h3 className="font-medium text-[var(--text-primary)] leading-tight mb-0.5">Find a Pro</h3>
                            <p className="text-xs text-[var(--text-secondary)] font-medium">Book top talent</p>
                        </Link>

                        {/* My Bookings */}
                        <Link to={user.role === 'STYLIST' ? '/dashboard' : '/my-bookings'} className="group relative bg-gradient-to-br from-[var(--card-bg)] to-[var(--bg-tertiary)] p-5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-[var(--border-subtle)] hover:scale-[1.02] transition-all duration-200 ease-out flex flex-col items-center text-center">
                            {(user.role === 'STYLIST' ? (counts.pendingRequests > 0 || counts.unreadMessages > 0) : counts.bookingUpdates > 0) && (
                                <span className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm z-10"></span>
                            )}
                            <div className="w-12 h-12 rounded-full bg-[var(--bg-primary)] shadow-sm flex items-center justify-center text-crown-gold mb-3 text-lg group-hover:text-crown-gold/80 transition-colors">
                                <FaCalendarAlt />
                            </div>
                            <h3 className="font-medium text-[var(--text-primary)] leading-tight mb-0.5">{user.role === 'STYLIST' ? 'Pro Studio' : 'My Bookings'}</h3>
                            <p className="text-xs text-[var(--text-secondary)] font-medium">{user.role === 'STYLIST' ? 'Manage business' : 'Upcoming visits'}</p>
                        </Link>
                    </div>

                    {/* New Services (Full Width) */}
                    {/* New Services Replacement: My Connections */}
                    <div className="animate-enter animate-delay-2">
                        <button
                            onClick={() => setShowConnections(true)}
                            className="group flex items-center justify-center gap-3 w-full bg-[var(--card-bg)] rounded-2xl shadow-sm hover:shadow-md border border-[var(--border-subtle)] hover:border-crown-gold/20 hover:scale-[1.01] transition-all duration-200 ease-out p-5"
                        >
                            <div className="w-8 h-8 rounded-full bg-crown-gold/10 flex items-center justify-center text-crown-gold text-sm group-hover:scale-110 transition-transform duration-200">
                                <FaUserCircle />
                            </div>
                            <span className="font-medium text-[var(--text-primary)] group-hover:text-crown-gold transition-colors">My Connections</span>
                        </button>
                    </div>
                </div>

                {/* My Connections Overlay */}
                {showConnections && (
                    <MyConnections onClose={() => setShowConnections(false)} />
                )}

                {/* 3. BROWSE BY SERVICE */}
                <div className="mb-12">
                    <div className="flex justify-between items-end mb-4 px-1">
                        <h3 className="text-xl font-serif font-bold text-[var(--text-primary)]">Browse by Service</h3>
                        <Link to="/explore" className="text-crown-gold text-sm font-bold hover:underline">See All</Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-xl mx-auto">
                        {SERVICE_CATEGORIES.map(cat => (
                            <Link
                                key={cat.id}
                                to={`/explore?category=${cat.id}`}
                                className="group relative overflow-hidden rounded-xl aspect-square shadow-sm hover:shadow-md transition bg-cover bg-center bg-no-repeat"
                                style={{ backgroundImage: `url(${cat.image})` }}
                            >
                                {/* Overlay: linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0.7)) */}
                                <div className="absolute inset-0 bg-gradient-to-b from-black/25 to-black/70 z-10 transition-opacity duration-300" />

                                {/* Content */}
                                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white text-center p-2">
                                    <cat.icon className="text-xl mb-1.5 text-white/90 group-hover:text-white group-hover:scale-110 transition duration-300" />
                                    <span className="font-bold tracking-wide text-sm">{cat.shortLabel}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* 4. FEATURED PROS */}
                <div className="mb-12">
                    <div className="flex justify-between items-end mb-4 px-1">
                        <h3 className="text-xl font-serif font-bold text-[var(--text-primary)]">Featured in Detroit</h3>
                    </div>

                    {loading ? (
                        <div className="flex gap-4 overflow-hidden">
                            {[1, 2, 3].map(i => <div key={i} className="min-w-[280px] h-48 bg-gray-100 rounded-xl animate-pulse" />)}
                        </div>
                    ) : featuredPros.length > 0 ? (
                        <div className="flex overflow-x-auto pb-6 gap-4 snap-x hide-scrollbar">
                            {featuredPros.map(pro => (
                                <Link
                                    key={pro.id}
                                    to={`/stylist/${pro.id}`}
                                    className="w-[260px] md:w-[280px] min-w-[260px] md:min-w-[280px] bg-[var(--card-bg)] rounded-xl shadow-sm border border-[var(--card-border)] overflow-hidden hover:shadow-md transition snap-start flex-shrink-0"
                                >
                                    <div className="h-32 bg-gray-200 relative">
                                        {pro.bannerImage ? (
                                            <img src={pro.bannerImage} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-cover bg-center opacity-50" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=500&q=60)` }} />
                                        )}
                                        <div className="absolute -bottom-6 left-4 border-4 border-[var(--card-bg)] rounded-full w-14 h-14 bg-gray-100 overflow-hidden shadow-sm">
                                            {pro.profileImage ? (
                                                <img src={pro.profileImage} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-crown-dark text-white font-serif font-bold text-lg">
                                                    {pro.businessName[0]}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="pt-8 pb-4 px-4">
                                        <h4 className="font-bold text-[var(--text-primary)] truncate">{pro.businessName}</h4>
                                        <p className="text-xs text-gray-500 mb-2 truncate">{pro.bio || 'Beauty Professional'}</p>
                                        <div className="flex items-center gap-2 text-xs font-medium text-crown-gold">
                                            <FaStar /> <span>5.0 (New)</span>
                                            <span className="text-gray-300">|</span>
                                            <span className="text-gray-400">Detroit, MI</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-200 text-gray-500">
                            No professionals found yet.
                        </div>
                    )}
                </div>

                {/* 5. LOCAL VIBE / TRENDING */}
                <div className="bg-crown-gold/10 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
                    <div>
                        <h3 className="text-2xl font-serif font-bold text-[var(--text-primary)] mb-2">New to CrownSide?</h3>
                        <p className="text-[var(--text-primary)] opacity-70">Join the community of Detroit's best beauty professionals and clients.</p>
                    </div>
                    {/* Only show if NOT a pro? Or just generic vibe button */}
                    <button onClick={() => navigate('/explore')} className="btn-primary whitespace-nowrap">
                        Explore Looks
                    </button>
                </div>
            </div>
        </div>
    );
}

function LandingPage() {
    return (
        <div className="bg-[var(--bg-primary)] min-h-[80vh] transition-colors duration-300">
            {/* Hero Section */}
            {/* Hero Section */}
            <Hero
                pageKey="home"
                className="min-h-[90vh] md:h-[80vh] flex items-center justify-center text-center py-20 md:py-0"
            >
                {/* Content */}
                <div className="relative z-10 container mx-auto px-4">
                    <img
                        src={badge}
                        alt="CrownSide brand badge"
                        className="mx-auto mb-8 md:mb-12 max-h-[180px] md:max-h-[320px] w-auto pointer-events-none drop-shadow-2xl"
                    />
                    <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 leading-tight drop-shadow-md">
                        Beauty, Booked <br /> <span className="text-crown-gold">Beautifully.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 drop-shadow-sm font-medium">
                        Detroit’s premier beauty booking platform connecting you with top-tier hair, nail, & lash/brow professionals.
                        Discover talent, book appointments, and elevate your crown.
                    </p>
                    <div className="flex flex-col md:flex-row justify-center gap-4">
                        <Link to="/explore" className="btn-primary text-center shadow-lg border-none">
                            Find a Beauty Pro
                        </Link>
                        <Link to="/register" className="px-6 py-3 rounded-full font-medium text-center bg-crown-dark/80 backdrop-blur-sm border border-white text-white hover:bg-crown-dark hover:text-crown-gold transition-all shadow-lg active:scale-95">
                            Register as Client/Beauty Pro
                        </Link>
                    </div>
                </div>
            </Hero>

            {/* Value Props */}
            <section className="bg-[var(--bg-secondary)] py-16 transition-colors duration-300">
                <div className="container mx-auto px-4 grid md:grid-cols-3 gap-8">
                    <div className="text-center p-6 bg-crown-cream rounded-2xl">
                        <h3 className="text-xl font-bold mb-3">Hair, Nail & Lash Pros</h3>
                        <p className="text-crown-gray">Vetted professionals dedicated to beauty services including silk presses, braids, manicures, pedicures & lash extensions.</p>
                    </div>
                    <div className="text-center p-6 bg-crown-cream rounded-2xl">
                        <h3 className="text-xl font-bold mb-3">Seamless Booking</h3>
                        <p className="text-crown-gray">Book your appointment, pay deposits securely, and get reminders instantly.</p>
                    </div>
                    <div className="text-center p-6 bg-crown-cream rounded-2xl">
                        <h3 className="text-xl font-bold mb-3">Detroit Roots</h3>
                        <p className="text-crown-gray">Built for our community, supporting local beauty entrepreneurs.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
