import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, LayoutDashboard, Image, Users, Scissors, Calendar, Star, Settings, Activity } from 'lucide-react';
import logo from '../assets/logo.png';

export default function Navbar() {
    const { user, logout } = useAuth();

    const navigate = useNavigate();
    const [adminMenuOpen, setAdminMenuOpen] = React.useState(false);
    const location = useLocation();

    // Close menu when route changes
    React.useEffect(() => {
        setAdminMenuOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="bg-white shadow-sm sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-[64px] md:h-[76px] transition-all duration-300">
                    {/* Logo */}
                    <Link to="/" className="brand-logo flex items-center shrink-0">
                        <img
                            src={logo}
                            alt="CrownSide"
                            className="h-[56px] md:h-[70px] w-auto object-contain scale-110 origin-left ml-2"
                        />
                    </Link>

                    {/* Desktop Navigation Actions */}
                    <div className="hidden md:flex items-center space-x-6">
                        <Link to="/explore" className="text-crown-gray hover:text-crown-gold font-medium transition">Explore</Link>

                        {user ? (
                            <>
                                {user.role === 'CLIENT' && (
                                    <Link to="/my-bookings" className="text-crown-gray hover:text-crown-gold font-medium transition">My Bookings</Link>
                                )}
                                {user.role === 'STYLIST' && (
                                    <Link to="/dashboard" className="text-crown-gray hover:text-crown-gold font-medium transition">Dashboard</Link>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="text-crown-gray hover:text-crown-gold font-medium transition"
                                >
                                    Log Out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-crown-gray hover:text-crown-gold font-medium transition">Log In</Link>
                                <Link to="/register" className="btn-primary text-white bg-crown-dark hover:bg-black px-5 py-2 rounded-full text-sm">
                                    Join CrownSide
                                </Link>
                            </>
                        )}

                        {/* Main Hamburger Menu (Desktop & Mobile) */}
                        <button
                            onClick={() => setAdminMenuOpen(true)} // Reusing existing state or creating new one? Let's use a new one or rename.
                            className="p-2 text-crown-dark hover:bg-gray-100 rounded-lg transition ml-2"
                            aria-label="Open Menu"
                        >
                            <Menu size={28} />
                        </button>
                    </div>

                    {/* Mobile Admin Link (No Hamburger) */}
                    <div className="md:hidden flex items-center">
                        {user?.role === 'ADMIN' && (
                            <Link to="/admin" className="text-crown-gold font-bold text-sm bg-crown-cream px-3 py-1 rounded-full">
                                Admin
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation Drawer / Side Menu */}
            {adminMenuOpen && ( // Assuming we rename this or use it for the main menu now
                <div className="fixed inset-0 z-[100]">
                    {/* Overlay */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                        onClick={() => setAdminMenuOpen(false)}
                    ></div>

                    {/* Drawer */}
                    <div className="absolute right-0 top-0 h-full w-[300px] bg-white shadow-2xl p-6 animate-slide-in-right flex flex-col">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-serif text-crown-dark">Menu</h2>
                            <button
                                onClick={() => setAdminMenuOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-6">
                            {/* Main Links */}
                            <div className="space-y-4">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Navigation</p>
                                <Link to="/" onClick={() => setAdminMenuOpen(false)} className="block text-lg font-medium text-gray-800 hover:text-crown-gold">Home</Link>
                                <Link to="/explore" onClick={() => setAdminMenuOpen(false)} className="block text-lg font-medium text-gray-800 hover:text-crown-gold">Explore</Link>
                                {user?.role === 'CLIENT' && (
                                    <Link to="/my-bookings" onClick={() => setAdminMenuOpen(false)} className="block text-lg font-medium text-gray-800 hover:text-crown-gold">Bookings</Link>
                                )}
                                <Link to="/about" onClick={() => setAdminMenuOpen(false)} className="block text-lg font-medium text-gray-800 hover:text-crown-gold">About Us</Link>
                                <Link to="/contact" onClick={() => setAdminMenuOpen(false)} className="block text-lg font-medium text-gray-800 hover:text-crown-gold">Contact</Link>
                                <Link to="/faq" onClick={() => setAdminMenuOpen(false)} className="block text-lg font-medium text-gray-800 hover:text-crown-gold">Freq. Asked Questions</Link>
                            </div>

                            {/* Admin Links (If Admin) */}
                            {user?.role === 'ADMIN' && (
                                <div className="space-y-4 pt-6 border-t border-gray-100">
                                    <p className="text-xs font-bold text-crown-gold uppercase tracking-wider flex items-center gap-2">
                                        <LayoutDashboard size={14} /> Admin Panel
                                    </p>
                                    <Link to="/admin" onClick={() => setAdminMenuOpen(false)} className="block text-gray-600 hover:text-crown-gold">Dashboard</Link>
                                    <Link to="/admin/pricing" onClick={() => setAdminMenuOpen(false)} className="block text-gray-600 hover:text-crown-gold">Pricing & Subs</Link>
                                    <Link to="/admin/users" onClick={() => setAdminMenuOpen(false)} className="block text-gray-600 hover:text-crown-gold">Users</Link>
                                </div>
                            )}

                            {/* Account Links */}
                            <div className="space-y-4 pt-6 border-t border-gray-100">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Account</p>
                                {user ? (
                                    <>
                                        {user.role === 'STYLIST' && (
                                            <Link to="/dashboard" onClick={() => setAdminMenuOpen(false)} className="block text-gray-600 hover:text-crown-gold">My Dashboard</Link>
                                        )}
                                        <button
                                            onClick={() => { handleLogout(); setAdminMenuOpen(false); }}
                                            className="text-red-500 hover:text-red-700 font-medium"
                                        >
                                            Log Out
                                        </button>
                                    </>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        <Link to="/login" onClick={() => setAdminMenuOpen(false)} className="btn-secondary text-center py-2 text-sm justify-center">Log In</Link>
                                        <Link to="/register" onClick={() => setAdminMenuOpen(false)} className="btn-primary bg-crown-dark text-white text-center py-2 text-sm justify-center">Sign Up</Link>
                                    </div>
                                )}
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
