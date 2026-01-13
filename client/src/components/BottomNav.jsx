import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Home, Search, Calendar, User, LogIn, LayoutDashboard, Image, Users, Scissors, Star, Settings, Activity } from 'lucide-react';

export default function BottomNav() {
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const isLoggedIn = !!user;
    const isStylist = user?.role === 'STYLIST';

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
        ...(isLoggedIn ? [{
            label: 'Bookings',
            path: '/my-bookings',
            icon: Calendar
        }] : []),
        {
            label: isLoggedIn ? (isStylist ? 'Dashboard' : 'Profile') : 'Log In',
            path: isLoggedIn ? (isStylist ? '/dashboard' : '/my-bookings') : '/login',
            icon: isLoggedIn ? User : LogIn
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
                            <Link to="/admin/pricing" onClick={() => setAdminMenuOpen(false)} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-gray-700">
                                <Activity size={20} /> <span className="font-medium">Pricing & Subs</span>
                            </Link>
                            <Link to="/admin/settings" onClick={() => setAdminMenuOpen(false)} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-gray-700">
                                <Settings size={20} /> <span className="font-medium">Settings</span>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#FAF7F2] border-t border-black/5 h-[68px] pb-[env(safe-area-inset-bottom)] flex justify-around items-center md:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <NavLink
                            key={item.label}
                            to={item.path}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${isActive ? 'text-crown-gold' : 'text-crown-gray'}`}
                        >
                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
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
