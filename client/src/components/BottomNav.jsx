import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Home, Search, Calendar, User, LogIn, LayoutDashboard, Image, Users, Scissors, Star, Settings, Activity, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { canAccessNativeBilling } from '../lib/billingGuard';

export default function BottomNav() {
    const location = useLocation();
    const { user } = useAuth();
    const isLoggedIn = !!user;
    const isStylist = user?.role === 'STYLIST';
    const { counts } = useNotifications() || { counts: { total: 0, bookings: 0, messages: 0, forum: 0 } };

    const [isVisible, setIsVisible] = useState(true);
    const lastScrollY = useRef(0);
    const isKeyboardOpen = useRef(false);
    const initialHeight = useRef(window.innerHeight);

    useEffect(() => {
        const handleScroll = () => {
            if (isKeyboardOpen.current) return;
            
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY.current + 15) {
                setIsVisible(false);
            } else if (currentScrollY < lastScrollY.current - 15 || currentScrollY < 50) {
                setIsVisible(true);
            }
            lastScrollY.current = currentScrollY;
        };

        const handleResize = () => {
            // Detect if keyboard is open by checking if height dropped by > 150px
            if (initialHeight.current - window.innerHeight > 150) {
                isKeyboardOpen.current = true;
                setIsVisible(false);
            } else {
                isKeyboardOpen.current = false;
                setIsVisible(true);
                // Only update initialHeight if it gets larger (to prevent shrinking issues)
                if (window.innerHeight > initialHeight.current) {
                    initialHeight.current = window.innerHeight;
                }
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleResize);

        // Initial check for height
        initialHeight.current = window.innerHeight;

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const navItems = [
        {
            label: 'Home',
            path: '/',
            icon: Home
        },
        {
            label: 'Explore',
            path: '/explore',
            icon: Search
        },
        {
            label: 'Connect',
            path: '/forum',
            icon: MessageSquare,
            hasNotification: counts.forum > 0
        },
        ...(isLoggedIn ? [{
            label: 'Bookings',
            path: '/my-bookings',
            icon: Calendar,
            hasNotification: !isStylist && (counts.bookings > 0 || counts.messages > 0)
        }] : []),
        {
            label: isLoggedIn ? (isStylist ? 'Dashboard' : 'Profile') : 'Log in / Register',
            path: isLoggedIn ? (isStylist ? '/dashboard' : '/profile') : '/login',
            icon: isLoggedIn ? User : LogIn,
            hasNotification: isStylist && (counts.bookings > 0 || counts.messages > 0)
        }
    ];

    const [adminMenuOpen, setAdminMenuOpen] = useState(false);
    const isAdmin = user?.role === 'ADMIN';

    // Toggle menu
    const handleAdminClick = (e) => {
        e.preventDefault();
        setAdminMenuOpen(!adminMenuOpen);
    };

    return (
        <>
            {/* Admin Menu Overlay */}
            {adminMenuOpen && (
                <div className="fixed inset-0 z-[60] flex flex-col justify-end md:hidden">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setAdminMenuOpen(false)} />
                    <div className="relative bg-white rounded-t-2xl shadow-xl p-4 animate-slide-up space-y-2 pb-safe">
                        <div className="flex justify-between items-center mb-2 px-2">
                            <h3 className="font-serif font-bold text-lg text-crown-dark">Admin Menu</h3>
                            <button onClick={() => setAdminMenuOpen(false)} className="p-1"><span className="sr-only">Close</span>✕</button>
                        </div>
                        <div className="flex flex-col space-y-1">
                            <Link to="/admin" onClick={() => setAdminMenuOpen(false)} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-gray-700">
                                <LayoutDashboard size={20} /> <span className="font-medium">Dashboard</span>
                            </Link>
                            <Link to="/admin/heroes" onClick={() => setAdminMenuOpen(false)} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-gray-700">
                                <Image size={20} /> <span className="font-medium">Hero Manager</span>
                            </Link>
                            <Link to="/admin/users" onClick={() => setAdminMenuOpen(false)} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-gray-700">
                                <Users size={20} /> <span className="font-medium">Users</span>
                            </Link>
                            <Link to="/admin/pros" onClick={() => setAdminMenuOpen(false)} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-gray-700">
                                <Scissors size={20} /> <span className="font-medium">Beauty Pros</span>
                            </Link>
                            <Link to="/admin/bookings" onClick={() => setAdminMenuOpen(false)} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-gray-700">
                                <Calendar size={20} /> <span className="font-medium">Bookings</span>
                            </Link>
                            <Link to="/admin/reviews" onClick={() => setAdminMenuOpen(false)} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-gray-700">
                                <Star size={20} /> <span className="font-medium">Reviews</span>
                            </Link>
                            {canAccessNativeBilling() && (
                                <Link to="/admin/pricing" onClick={() => setAdminMenuOpen(false)} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-gray-700">
                                    <Activity size={20} /> <span className="font-medium">Pricing & Subs</span>
                                </Link>
                            )}
                            <Link to="/admin/settings" onClick={() => setAdminMenuOpen(false)} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-gray-700">
                                <Settings size={20} /> <span className="font-medium">Settings</span>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            <nav
                className={`fixed z-50 flex justify-around items-center md:hidden transition-all duration-300 bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl shadow-black/10 rounded-full py-3 px-2 mx-4 ${
                    isVisible ? 'translate-y-0 opacity-100' : 'translate-y-[150%] opacity-0 pointer-events-none'
                }`}
                style={{
                    bottom: 'calc(env(safe-area-inset-bottom) + 16px)',
                    left: '0',
                    right: '0'
                }}
            >
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <NavLink
                            key={item.label}
                            to={item.path}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 relative ${isActive ? 'text-crown-gold' : 'text-crown-gray'}`}
                        >
                            <div className="relative">
                                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                {item.hasNotification && (
                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#FAF7F2]"></span>
                                )}
                            </div>
                            <span className="text-[10px] font-medium tracking-wide whitespace-nowrap">{item.label}</span>
                            {isActive && (
                                <span className="absolute bottom-1 w-1 h-1 bg-crown-gold rounded-full mb-1" />
                            )}
                        </NavLink>
                    );
                })}

                {/* Admin Icon */}
                {isAdmin && (
                    <button
                        onClick={handleAdminClick}
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 text-crown-gold`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        <span className="text-[10px] font-medium tracking-wide">Admin</span>
                    </button>
                )}
            </nav>
        </>
    );
}
