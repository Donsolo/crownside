import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import badge from '../assets/badge.png';
import Hero from '../components/Hero';
import { useAuth } from '../context/AuthContext';
import { SERVICE_CATEGORIES } from '../config/categories';
import api from '../lib/api';
import { FaUserCircle, FaStar, FaMapMarkerAlt, FaSearch, FaCalendarAlt, FaCut } from 'react-icons/fa';
import {
    LayoutDashboard,
    Calendar,
    MessageSquare,
    Store,
    Users,
    Crown,
    Check,
    ArrowRight,
    Smartphone,
    Globe,
    TrendingUp
} from 'lucide-react';

import { useNotifications } from '../context/NotificationContext';
import MyConnections from '../components/MyConnections';
import Avatar from '../components/Avatar';

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
                <div className="relative z-10 w-full max-w-[1920px] mx-auto px-4 md:px-8">
                    <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-2 drop-shadow-md">
                        {greeting}, {displayName}.
                    </h1>
                    <p className="text-crown-gold text-lg font-medium">
                        Your beauty, beautifully booked.
                    </p>
                </div>
            </Hero>

            <div className="w-full max-w-[1920px] mx-auto px-4 md:px-8 -mt-10 relative z-20">

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
                                        <div className="absolute -bottom-6 left-4 z-10">
                                            <Avatar
                                                src={pro.profileImage}
                                                user={pro.user}
                                                size="lg" // w-14 is 3.5rem (56px). lg is usually ~48px-56px.
                                                className={`bg-gray-100 shadow-sm ${pro.user?.isFounderEnrolled ? '' : 'border-4 border-[var(--card-bg)]'}`}
                                                alt={pro.businessName}
                                            />
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
    const [plans, setPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(true);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await api.get('/subscriptions');
                setPlans(res.data);
            } catch (err) {
                console.error("Failed to fetch plans", err);
            } finally {
                setLoadingPlans(false);
            }
        };
        fetchPlans();
    }, []);

    // Helper to get plan details safe
    const getPlan = (key) => plans.find(p => p.key === key) || {};
    const proPlan = getPlan('pro');
    const elitePlan = getPlan('elite');
    const premierPlan = getPlan('premier');

    return (
        <div className="bg-[#1a1614] min-h-screen font-sans text-white transition-colors duration-300">
            {/* 1. HERO SECTION */}
            <Hero
                pageKey="home"
                className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden flex flex-col items-center justify-center min-h-[90vh]"
                overlayOpacity={0.65}
            >
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto text-center mb-16">
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight text-white drop-shadow-lg">
                            The Modern Booking Platform <br className="hidden md:block" />
                            for <span className="text-crown-gold drop-shadow-md">Beauty Professionals</span>
                        </h1>
                        <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed drop-shadow-md font-medium">
                            Booking, messaging, storefronts, calendar control, and community — all in one powerful platform.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link to="/register?role=pro" className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-black transition-all duration-200 bg-crown-gold rounded-full hover:bg-crown-gold/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-crown-gold shadow-lg shadow-crown-gold/20">
                                Join as a Professional
                            </Link>
                            <Link to="/explore" className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white transition-all duration-200 bg-white/10 border border-white/20 rounded-full hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50 backdrop-blur-sm shadow-md">
                                Find a Stylist
                            </Link>
                        </div>
                    </div>

                    {/* Mockup Placeholder */}
                    <div className="relative mx-auto max-w-5xl mt-16 group perspective-1000">
                        {/* Main Dashboard Preview */}
                        <div className="relative rounded-xl bg-[#0F0F0F] border border-white/10 shadow-2xl overflow-hidden aspect-[16/9] md:aspect-[2/1] flex flex-col transition-transform duration-500 ease-out group-hover:scale-[1.01]">
                            {/* Fake Browser Top Bar */}
                            <div className="h-8 bg-[#1a1a1a] border-b border-white/5 flex items-center px-4 gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
                            </div>

                            {/* Inner Content Placeholder */}
                            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-[#0F0F0F] to-[#121212] relative">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.05)_0%,rgba(0,0,0,0)_70%)] opacity-50"></div>
                                <div className="text-center p-8 z-10">
                                    <div className="inline-flex p-5 rounded-2xl bg-crown-gold/10 mb-6 border border-crown-gold/20">
                                        <LayoutDashboard className="w-10 h-10 text-crown-gold" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Stylist Dashboard</h3>
                                    <p className="text-gray-500 font-medium">Real-time scheduling & analytics</p>
                                </div>
                            </div>
                        </div>

                        {/* Ambient Glow */}
                        <div className="absolute -inset-1 bg-gradient-to-br from-crown-gold/20 to-purple-900/20 rounded-xl blur-xl opacity-30 -z-10 group-hover:opacity-50 transition-opacity duration-500"></div>
                    </div>
                </div>
            </Hero>

            {/* 2. TRUST STRIP */}
            <div className="border-y border-white/5 bg-white/[0.02] backdrop-blur-sm">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 md:gap-16 text-xs md:text-sm font-medium text-gray-400 uppercase tracking-wider">
                        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-crown-gold"></div> Built for Metro Detroit</span>
                        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-crown-gold"></div> Founder Program Open</span>
                        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-crown-gold"></div> Professional Growth</span>
                    </div>
                </div>
            </div>

            {/* 3. PLATFORM OVERVIEW */}
            <section className="py-24 bg-[#0f0c0b]">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Everything You Need To Run Your Beauty Business</h2>
                        <p className="text-gray-400">Comprehensive tools designed to replace your fragmented stack.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: Calendar, title: "Smart Booking System", desc: "Accept, manage, and approve appointments with full availability control." },
                            { icon: MessageSquare, title: "Built-In Messaging", desc: "Direct client communication linked to specific bookings." },
                            { icon: Store, title: "Public Storefront", desc: "Your professional portfolio and service menu at yourname.thecrownside.com." },
                            { icon: LayoutDashboard, title: "Advanced Calendar", desc: "Multi-day management and future import support for Elite & Premier." },
                            { icon: Users, title: "Client Management", desc: "Track booking history and build a loyal repeat clientele." },
                            { icon: Crown, title: "Crown Connect Community", desc: "Access the forum, network with peers, and gain visibility." }
                        ].map((feature, i) => (
                            <div key={i} className="p-8 rounded-2xl bg-[#2C2420] border border-white/10 hover:border-crown-gold/30 transition-all duration-300 group hover:-translate-y-1">
                                <div className="w-12 h-12 rounded-lg bg-crown-gold/10 flex items-center justify-center mb-6 text-crown-gold group-hover:scale-110 transition-transform duration-300">
                                    <feature.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                                <p className="text-gray-400 leading-relaxed text-sm">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. DEEP FEATURE SECTIONS */}
            <section className="py-0 space-y-0 relative">
                {[
                    { title: "Booking That Works For You", desc: "Say goodbye to scheduling chaos. Set your rules, approve requests, and manage your time efficiently.", align: "left", icon: Smartphone },
                    { title: "Your Brand. Your Storefront.", desc: "Showcase your portfolio, pricing, and bio on a stunning, dedicated page that represents your unique style.", align: "right", icon: Globe },
                    { title: "Level Up With Elite & Premier", desc: "Unlock advanced calendar power, priority support, and higher visibility in search results.", align: "left", icon: TrendingUp },
                    { title: "Built for Growth", desc: "Tools to retain clients, reduce no-shows, and expand your business footprint in Detroit.", align: "right", icon: Users }
                ].map((item, i) => (
                    <div key={i} className={`py-20 md:py-32 border-b border-white/5 ${i % 2 === 0 ? 'bg-[#1a1614]' : 'bg-[#0f0c0b]'}`}>
                        <div className="container mx-auto px-4">
                            <div className={`flex flex-col md:flex-row items-center gap-12 md:gap-24 ${item.align === 'right' ? 'md:flex-row-reverse' : ''}`}>

                                {/* Visual Side */}
                                <div className="flex-1 w-full relative">
                                    <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-white/10 overflow-hidden relative group shadow-2xl">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.1)_0%,rgba(0,0,0,0)_60%)]"></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center text-crown-gold border border-white/10 group-hover:scale-110 transition-transform duration-500">
                                                <item.icon className="w-10 h-10 opacity-80" />
                                            </div>
                                        </div>
                                    </div>
                                    {/* Decorative Elements */}
                                    <div className={`absolute -bottom-6 ${item.align === 'left' ? '-right-6' : '-left-6'} w-24 h-24 bg-crown-gold/20 rounded-full blur-3xl`}></div>
                                </div>

                                {/* Text Side */}
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-3xl md:text-4xl font-bold mb-6 text-white">{item.title}</h3>
                                    <p className="text-lg text-gray-400 leading-relaxed mb-8">{item.desc}</p>
                                    <Link to="/register" className="text-crown-gold font-bold hover:text-white transition-colors inline-flex items-center gap-2 group">
                                        Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </section>

            {/* 5. PRICING PREVIEW */}
            <section className="py-24 bg-[#1a1614] overflow-hidden">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Simple Plans. Real Growth.</h2>
                        <p className="text-gray-400">Choose the tier that fits your stage of business.</p>
                    </div>

                    <div className="flex flex-row overflow-x-auto md:grid md:grid-cols-3 gap-4 md:gap-8 max-w-6xl mx-auto relative px-4 md:px-0 pb-6 snap-x snap-mandatory scrollbar-premium">
                        {/* Beauty Pro */}
                        <div className="min-w-[85vw] md:min-w-0 snap-center p-8 rounded-2xl bg-[#0f0c0b] border border-white/10 flex flex-col hover:border-white/20 transition-colors">
                            <h3 className="text-xl font-bold mb-2 text-white">{proPlan.label || 'Beauty Pro'}</h3>
                            <p className="text-sm text-gray-400 mb-6">Essential tools for independent pros.</p>
                            <div className="text-3xl font-bold mb-8 text-white">${proPlan.price ?? 0}<span className="text-lg font-normal text-gray-500">/mo</span></div>
                            <ul className="space-y-4 mb-8 flex-1">
                                {['Booking Management', 'Basic Storefront', 'Direct Messaging', 'Standard Support'].map(f => (
                                    <li key={f} className="flex items-center gap-3 text-sm text-gray-300">
                                        <Check className="w-4 h-4 text-crown-gold flex-shrink-0" /> {f}
                                    </li>
                                ))}
                            </ul>
                            <Link to="/register" className="w-full py-3 rounded-lg border border-white/20 text-white font-medium hover:bg-white/5 text-center transition-colors">Start Free</Link>
                        </div>

                        {/* Elite */}
                        <div className="min-w-[85vw] md:min-w-0 snap-center p-8 rounded-2xl bg-[#2C2420] border border-crown-gold/40 shadow-2xl relative transform md:-translate-y-4 flex flex-col">
                            <div className="absolute top-0 right-0 bg-crown-gold text-black text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl uppercase tracking-wide">Most Popular</div>
                            <h3 className="text-xl font-bold mb-2 text-crown-gold">{elitePlan.label || 'Elite'}</h3>
                            <p className="text-sm text-gray-400 mb-6">Advanced power for busy schedules.</p>
                            <div className="text-3xl font-bold mb-8 text-white">${elitePlan.price ?? 29}<span className="text-lg font-normal text-gray-500">/mo</span></div>
                            <ul className="space-y-4 mb-8 flex-1">
                                {['Everything in Pro', 'Advanced Calendar', 'Future Import', 'Priority Visibility', 'Analytics Dashboard'].map(f => (
                                    <li key={f} className="flex items-center gap-3 text-sm text-white">
                                        <Check className="w-4 h-4 text-crown-gold flex-shrink-0" /> {f}
                                    </li>
                                ))}
                            </ul>
                            <Link to="/register" className="w-full py-3 rounded-lg bg-crown-gold text-black font-bold hover:bg-crown-gold/90 text-center transition-colors shadow-lg shadow-crown-gold/20">Get Elite</Link>
                        </div>

                        {/* Premier */}
                        <div className="min-w-[85vw] md:min-w-0 snap-center p-8 rounded-2xl bg-[#0f0c0b] border border-white/10 flex flex-col hover:border-white/20 transition-colors">
                            <h3 className="text-xl font-bold mb-2 text-white">{premierPlan.label || 'Premier'}</h3>
                            <p className="text-sm text-gray-400 mb-6">Maximum visibility and control.</p>
                            <div className="text-3xl font-bold mb-8 text-white">${premierPlan.price ?? 49}<span className="text-lg font-normal text-gray-500">/mo</span></div>
                            <ul className="space-y-4 mb-8 flex-1">
                                {['Everything in Elite', 'Top Search Ranking', 'Concierge Onboarding', 'Verified Badge', 'Featured Spots'].map(f => (
                                    <li key={f} className="flex items-center gap-3 text-sm text-gray-300">
                                        <Check className="w-4 h-4 text-crown-gold flex-shrink-0" /> {f}
                                    </li>
                                ))}
                            </ul>
                            <Link to="/register" className="w-full py-3 rounded-lg border border-white/20 text-white font-medium hover:bg-white/5 text-center transition-colors">Get Premier</Link>
                        </div>
                    </div>

                    <div className="text-center mt-12 pb-8">
                        <Link to="/pricing" className="text-gray-400 hover:text-white transition-colors text-sm border-b border-gray-700 hover:border-white pb-0.5">View Full Pricing details</Link>
                    </div>
                </div>
            </section>

            {/* 6. WHY CROWNSIDE */}
            <section className="py-24 bg-[#0f0c0b] border-t border-white/5">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-12 text-white">Why Professionals Choose CrownSide</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { title: "Built for Beauty Pros", desc: "Designed specifically for the unique needs of hair, nail, and lash artists." },
                            { title: "Community-Driven", desc: "A supportive network of peers in the Metro Detroit area." },
                            { title: "Tiered Growth", desc: "A clear path to advance your career and business capabilities." },
                            { title: "Detroit Roots", desc: "Local understanding with a vision for national excellence." }
                        ].map((item, i) => (
                            <div key={i} className="p-6">
                                <h3 className="text-xl font-bold mb-3 text-white">{item.title}</h3>
                                <div className="w-12 h-1 bg-crown-gold mx-auto mb-4 rounded-full opacity-60"></div>
                                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 7. FINAL CTA */}
            <section className="py-32 bg-crown-dark relative overflow-hidden text-center">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-crown-dark via-crown-dark/80 to-transparent"></div>

                <div className="relative z-10 container mx-auto px-4">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white max-w-4xl mx-auto">Ready to Own Your Booking Experience?</h2>
                    <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">Create your account and start building your professional presence today.</p>
                    <Link to="/register" className="inline-flex items-center justify-center px-10 py-5 text-lg font-bold text-black transition-all duration-200 bg-crown-gold rounded-full hover:bg-crown-gold/90 hover:scale-105 shadow-2xl shadow-crown-gold/20">
                        Create Free Account
                    </Link>
                </div>
            </section>
        </div>
    );
}
