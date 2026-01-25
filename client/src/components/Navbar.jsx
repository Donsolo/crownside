import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { X, LayoutDashboard, Image, Users, Scissors, Calendar, Star, Settings, Activity, Bell, Menu } from 'lucide-react';
import logo from '../assets/logo.png';

import { useNotifications } from '../context/NotificationContext';
import NotificationPanel from './NotificationPanel';
import FounderWelcomeModal from './FounderWelcomeModal';
import Avatar from './Avatar';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { counts } = useNotifications(); // Access counts

    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = React.useState(false);
    const [panelOpen, setPanelOpen] = React.useState(false);
    const [founderModalOpen, setFounderModalOpen] = React.useState(false);
    const location = useLocation();

    // Close menu when route changes
    React.useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav
            className="bg-[var(--nav-background)] shadow-sm sticky top-0 z-50 border-b border-[var(--border-subtle)] transition-colors duration-300"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
            <div className="w-full px-4 md:px-8 lg:px-12">
                <div className="flex justify-between items-center h-[70px] md:h-[80px] transition-all duration-300">
                    {/* Brand Block */}
                    <div className="flex items-center gap-2 md:gap-8">
                        <Link to="/" className="brand-logo relative flex items-center shrink-0 h-full w-[100px] md:w-[180px] group">
                            <img
                                src={logo}
                                alt="CrownSide"
                                className="absolute left-0 top-1/2 -translate-y-1/2 h-[90px] md:h-[140px] w-auto max-w-none object-contain"
                            />
                        </Link>

                        {/* Location Context - Desktop & Tablet */}
                        <div className="hidden md:flex flex-col justify-center border-l border-crown-gold/30 pl-6 h-full py-1">
                            <span className="text-3xl text-[#8F6A2D] font-medium tracking-wider [text-shadow:0_0.5px_0_rgba(0,0,0,0.15)]" style={{ fontFamily: '"Great Vibes", cursive' }}>
                                Serving Metro Detroit
                            </span>
                        </div>

                        {/* Location Context - Mobile */}
                        <div className="md:hidden flex flex-col justify-center pl-3 border-l border-crown-gold/30 h-6 ml-2">
                            <span className="text-xl text-[#8F6A2D] font-medium tracking-wide whitespace-nowrap [text-shadow:0_0.5px_0_rgba(0,0,0,0.15)]" style={{ fontFamily: '"Great Vibes", cursive' }}>
                                Serving Metro Detroit
                            </span>
                        </div>
                    </div>

                    {/* Desktop Navigation Actions */}
                    <div className="hidden md:flex items-center space-x-6">
                        <Link to="/explore" className="text-[var(--nav-text)] hover:text-crown-gold font-medium transition">Explore</Link>
                        <Link to="/forum" className="text-[var(--nav-text)] hover:text-crown-gold font-medium transition">Connect</Link>

                        {user ? (
                            <>
                                {/* Notification Bell */}
                                <button
                                    onClick={() => setPanelOpen(true)}
                                    className="relative p-2 text-[var(--nav-text)] hover:text-crown-gold transition group"
                                >
                                    <Bell size={24} className="group-hover:rotate-12 transition-transform" />
                                    {counts.total > 0 && (
                                        <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border border-[var(--nav-background)]">
                                            {counts.total > 9 ? '9+' : counts.total}
                                        </span>
                                    )}
                                </button>

                                <>
                                    <Link to="/my-bookings" className="text-[var(--nav-text)] hover:text-crown-gold font-medium transition relative">
                                        My Bookings
                                    </Link>
                                    <Link to="/profile" className="flex items-center gap-2 group">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-transparent group-hover:border-crown-gold transition">
                                            {(user.profileImage || user.stylistProfile?.profileImage) ? (
                                                <img src={user.profileImage || user.stylistProfile?.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                                                    {user.displayName?.[0] || 'U'}
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                </>
                                {user.role === 'STYLIST' && (
                                    <Link to="/dashboard" className="text-[var(--nav-text)] hover:text-crown-gold font-medium transition relative">
                                        Dashboard
                                    </Link>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="text-[var(--nav-text)] hover:text-crown-gold font-medium transition"
                                >
                                    Log Out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-[var(--nav-text)] hover:text-crown-gold font-medium transition">Log In</Link>
                                <Link to="/register" className="btn-primary text-white bg-crown-dark hover:bg-black px-5 py-2 rounded-full text-sm">
                                    Join CrownSide
                                </Link>
                            </>
                        )}

                        {/* Desktop Hamburger */}
                        <button
                            onClick={() => setMenuOpen(true)}
                            className="text-[var(--nav-text)] hover:text-crown-gold transition p-2"
                            aria-label="Open Menu"
                        >
                            <Menu size={24} />
                        </button>
                    </div>

                    {/* Mobile Actions (Menu Only) */}
                    <div className="md:hidden flex items-center gap-2">
                        {user && (
                            <button
                                onClick={() => setPanelOpen(true)}
                                className="relative p-2 text-[var(--nav-text)] hover:text-crown-gold transition"
                            >
                                <Bell size={24} />
                                {counts.total > 0 && (
                                    <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full border border-[var(--nav-background)]" />
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <NotificationPanel open={panelOpen} setOpen={setPanelOpen} onShowFounderWelcome={() => setFounderModalOpen(true)} />

            <FounderWelcomeModal isOpen={founderModalOpen} onClose={() => setFounderModalOpen(false)} />

            {/* Navigation Drawer / Side Menu */}
            {menuOpen && (
                <div className="fixed inset-0 z-[100]">
                    {/* Overlay */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                        onClick={() => setMenuOpen(false)}
                    ></div>

                    {/* Drawer */}
                    <div
                        className="absolute right-0 top-0 h-full w-[300px] bg-white shadow-2xl px-6 animate-slide-in-right flex flex-col"
                        style={{
                            paddingTop: 'calc(env(safe-area-inset-top) + 24px)',
                            paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)'
                        }}
                    >
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-serif text-crown-dark">Menu</h2>
                            <button
                                onClick={() => setMenuOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-6">
                            {/* Main Links */}
                            <div className="space-y-4">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Navigation</p>
                                <Link to="/" onClick={() => setMenuOpen(false)} className="block text-lg font-medium text-gray-800 hover:text-crown-gold">Home</Link>
                                <Link to="/explore" onClick={() => setMenuOpen(false)} className="block text-lg font-medium text-gray-800 hover:text-crown-gold">Explore</Link>
                                <Link to="/forum" onClick={() => setMenuOpen(false)} className="block text-lg font-medium text-gray-800 hover:text-crown-gold">Crown Connect</Link>
                                {user?.role === 'CLIENT' && (
                                    <>
                                        <Link to="/my-bookings" onClick={() => setMenuOpen(false)} className="block text-lg font-medium text-gray-800 hover:text-crown-gold">
                                            Bookings
                                            {counts.bookings > 0 && <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{counts.bookings}</span>}
                                        </Link>
                                        <Link to="/profile" onClick={() => setMenuOpen(false)} className="block text-lg font-medium text-gray-800 hover:text-crown-gold">Profile</Link>
                                    </>
                                )}
                                {user && (
                                    <Link to="/connections" onClick={() => setMenuOpen(false)} className="block text-lg font-medium text-gray-800 hover:text-crown-gold">My Connections</Link>
                                )}
                                <Link to="/about" onClick={() => setMenuOpen(false)} className="block text-lg font-medium text-gray-800 hover:text-crown-gold">About Us</Link>
                                <Link to="/contact" onClick={() => setMenuOpen(false)} className="block text-lg font-medium text-gray-800 hover:text-crown-gold">Contact</Link>
                                <Link to="/faq" onClick={() => setMenuOpen(false)} className="block text-lg font-medium text-gray-800 hover:text-crown-gold">Freq. Asked Questions</Link>
                            </div>

                            {/* Admin Links (If Admin) */}
                            {user?.role === 'ADMIN' && (
                                <div className="space-y-4 pt-6 border-t border-gray-100">
                                    <p className="text-xs font-bold text-crown-gold uppercase tracking-wider flex items-center gap-2">
                                        <LayoutDashboard size={14} /> Admin Panel
                                    </p>
                                    <Link to="/admin" onClick={() => setMenuOpen(false)} className="block text-gray-600 hover:text-crown-gold">Dashboard</Link>
                                    <Link to="/admin/heroes" onClick={() => setMenuOpen(false)} className="block text-gray-600 hover:text-crown-gold">Hero Manager</Link>
                                    <Link to="/admin/users" onClick={() => setMenuOpen(false)} className="block text-gray-600 hover:text-crown-gold">Users</Link>
                                    <Link to="/admin/pros" onClick={() => setMenuOpen(false)} className="block text-gray-600 hover:text-crown-gold">Beauty Pros</Link>
                                    <Link to="/admin/bookings" onClick={() => setMenuOpen(false)} className="block text-gray-600 hover:text-crown-gold">Bookings</Link>
                                    <Link to="/admin/reviews" onClick={() => setMenuOpen(false)} className="block text-gray-600 hover:text-crown-gold">Reviews</Link>
                                    <Link to="/admin/pricing" onClick={() => setMenuOpen(false)} className="block text-gray-600 hover:text-crown-gold">Pricing & Subs</Link>
                                    <Link to="/admin/settings" onClick={() => setMenuOpen(false)} className="block text-gray-600 hover:text-crown-gold">Settings</Link>
                                </div>
                            )}

                            {/* Account Links */}
                            <div className="space-y-4 pt-6 border-t border-gray-100">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Account</p>
                                {user ? (
                                    <>
                                        {user.role === 'STYLIST' && (
                                            <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block text-gray-600 hover:text-crown-gold">
                                                My Dashboard
                                                {counts.total - counts.forum > 0 && <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{counts.total - counts.forum}</span>}
                                            </Link>
                                        )}
                                        <Link to="/account-settings" onClick={() => setMenuOpen(false)} className="block text-gray-600 hover:text-crown-gold">Account Settings</Link>
                                        <button
                                            onClick={() => { handleLogout(); setMenuOpen(false); }}
                                            className="text-red-500 hover:text-red-700 font-medium"
                                        >
                                            Log Out
                                        </button>
                                    </>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary text-center py-2 text-sm justify-center">Log In</Link>
                                        <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary bg-crown-dark text-white text-center py-2 text-sm justify-center">Sign Up</Link>
                                    </div>
                                )}
                            </div>

                            {/* Legal Footer in Drawer */}
                            <div className="pt-4 border-t border-gray-100">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Legal</p>
                                <div className="space-y-2">
                                    <Link to="/privacy" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-500 hover:text-crown-gold">Privacy Policy</Link>
                                    <Link to="/terms" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-500 hover:text-crown-gold">Terms of Service</Link>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto pt-6 border-t border-gray-100 text-center">
                            <p className="text-xs text-gray-400">&copy; 2026 CrownSide</p>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
