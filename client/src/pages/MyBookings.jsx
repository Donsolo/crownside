import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import Hero from '../components/Hero';
import { useAuth } from '../context/AuthContext';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaSearch } from 'react-icons/fa';

export default function MyBookings() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const res = await api.get('/bookings');
                setBookings(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchBookings();
    }, []);

    // Derived State
    const upcomingBookings = bookings.filter(b => ['PENDING', 'APPROVED'].includes(b.status));
    const pastBookings = bookings.filter(b => ['COMPLETED', 'CANCELED'].includes(b.status));

    const StatusBadge = ({ status }) => {
        const styles = {
            APPROVED: 'bg-green-100 text-green-800 border-green-200',
            PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
            COMPLETED: 'bg-slate-100 text-slate-600 border-slate-200',
            CANCELED: 'bg-red-50 text-red-500 border-red-100'
        };
        const s = status ? status.toUpperCase() : 'PENDING';
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border ${styles[s] || styles.CANCELED}`}>
                {s}
            </span>
        );
    };

    const BookingCard = ({ booking, isPast }) => {
        const dateObj = new Date(booking.appointmentDate);
        return (
            <div className={`bg-white rounded-xl p-5 border transition-all duration-300 ${isPast ? 'border-gray-100 opacity-75 hover:opacity-100' : 'border-gray-200 shadow-sm hover:shadow-md hover:border-crown-gold/30'}`}>
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-serif font-bold ${isPast ? 'bg-gray-300' : 'bg-crown-dark'}`}>
                            {booking.stylist.businessName[0]}
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 leading-tight">{booking.service.name}</h4>
                            <p className="text-xs text-gray-500">with {booking.stylist.businessName}</p>
                        </div>
                    </div>
                    <StatusBadge status={booking.status} />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-2 rounded-lg flex items-center gap-2">
                        <FaCalendarAlt className="text-crown-gold text-sm" />
                        <div className="text-xs">
                            <span className="block font-bold text-gray-700">{dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' })}</span>
                        </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg flex items-center gap-2">
                        <FaClock className="text-crown-gold text-sm" />
                        <div className="text-xs">
                            <span className="block font-bold text-gray-700">{dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-400 border-t pt-3">
                    <span className="flex items-center gap-1"><FaMapMarkerAlt /> Detroit, MI</span>
                    <span className="font-bold text-gray-700 text-sm">${booking.service.price}</span>
                </div>
            </div>
        );
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-neutral-50 pb-20">
            {/* HER0 - Distinct from Profile */}
            <Hero
                pageKey="bookings" // We might need to ensure pageKey 'bookings' exists in DB or fallback works, assuming fallback works if not dynamic
                className="h-[30vh] min-h-[250px] flex items-center justify-center relative"
                overlayOpacity={0.7}
            >
                <div className="text-center text-white z-10 px-4">
                    <h1 className="font-serif text-3xl md:text-5xl font-bold mb-2 drop-shadow-lg text-white">My Appointments</h1>
                    <p className="text-white/80 text-lg font-medium text-white">Your upcoming and past bookings</p>
                </div>
            </Hero>

            <div className="container mx-auto px-4 -mt-10 relative z-20">
                <div className="max-w-4xl mx-auto">
                    {/* Upcoming Section */}
                    <div className="mb-12 animate-enter animate-delay-1">
                        <div className="flex justify-between items-end mb-6">
                            <h2 className="text-2xl font-serif font-bold text-gray-900">Upcoming</h2>
                            <button onClick={() => navigate('/explore')} className="btn-primary py-2 px-4 text-xs">
                                Book New
                            </button>
                        </div>

                        {upcomingBookings.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                                <div className="inline-flex w-16 h-16 rounded-full bg-crown-gold/10 items-center justify-center text-crown-gold mb-4 text-2xl">
                                    <FaCalendarAlt />
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg mb-2">No upcoming appointments</h3>
                                <p className="text-gray-500 mb-6 max-w-sm mx-auto">Ready to treat yourself? Find the best beauty professionals in Detroit.</p>
                                <button onClick={() => navigate('/explore')} className="btn-secondary">
                                    Find a Beauty Pro
                                </button>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-6">
                                {upcomingBookings.map(b => (
                                    <BookingCard key={b.id} booking={b} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Past Section */}
                    {pastBookings.length > 0 && (
                        <div className="animate-enter animate-delay-2">
                            <h2 className="text-xl font-serif font-bold text-gray-400 mb-6 uppercase tracking-wider text-sm">Past History</h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                {pastBookings.map(b => (
                                    <BookingCard key={b.id} booking={b} isPast={true} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
