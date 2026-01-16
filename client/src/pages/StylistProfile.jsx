import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { FaInstagram, FaTiktok, FaPhoneAlt, FaGlobe, FaMapMarkerAlt, FaStar, FaShareAlt } from 'react-icons/fa';

export default function StylistProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [stylist, setStylist] = useState(null);
    const [services, setServices] = useState([]);
    const [portfolio, setPortfolio] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Booking State
    const [selectedService, setSelectedService] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [isBooking, setIsBooking] = useState(false);

    useEffect(() => {
        const fetchStylist = async () => {
            try {
                const res = await api.get(`/stylists/${id}`);
                setStylist(res.data);
                setServices(res.data.services || []);
                setPortfolio(res.data.portfolioImages || []);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStylist();
    }, [id]);

    const handleBook = async () => {
        if (!selectedService || !selectedDate) return alert('Please select a service and date');

        // Check auth
        const token = localStorage.getItem('token');
        if (!token) {
            // Redirect to login with return url
            return navigate('/login');
        }

        setIsBooking(true);
        try {
            await api.post('/bookings', {
                stylistId: stylist.id,
                serviceId: selectedService.id,
                appointmentDate: selectedDate
            });
            alert('Booking request sent!');
            setSelectedService(null);
            setSelectedDate(null);
        } catch (err) {
            alert(err.response?.data?.error || 'Booking failed');
        } finally {
            setIsBooking(false);
        }
    };

    if (isLoading) return <div className="text-center py-20">Loading Pro Profile...</div>;
    if (!stylist) return <div className="text-center py-20">Professional not found.</div>;

    // Contact Helper
    const renderContactButtons = () => {
        const pref = stylist.contactPreference || 'BOOKINGS_ONLY';
        if (pref === 'BOOKINGS_ONLY') return null;

        return (
            <div className="flex gap-3 mt-4 flex-wrap">
                {/* Phone - Only if CALL_OR_TEXT */}
                {pref === 'CALL_OR_TEXT' && stylist.phoneNumber && (
                    <a href={`tel:${stylist.phoneNumber}`} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm font-bold text-gray-700 hover:bg-gray-200 transition">
                        <FaPhoneAlt size={14} /> Call/Text
                    </a>
                )}

                {/* Socials - Only if SOCIAL_DM or SOCIAL_DM included */}
                {pref === 'SOCIAL_DM' && (
                    <>
                        {stylist.instagramHandle && (
                            <a href={`https://instagram.com/${stylist.instagramHandle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-600 rounded-full text-sm font-bold hover:bg-pink-100 transition">
                                <FaInstagram size={16} /> Instagram
                            </a>
                        )}
                        {stylist.tiktokHandle && (
                            <a href={`https://tiktok.com/@${stylist.tiktokHandle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-black rounded-full text-sm font-bold hover:bg-gray-200 transition">
                                <FaTiktok size={14} /> TikTok
                            </a>
                        )}
                        {stylist.websiteUrl && (
                            <a href={stylist.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-bold hover:bg-blue-100 transition">
                                <FaGlobe size={14} /> Website
                            </a>
                        )}
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Navbar removed to fix double header */}

            {/* Banner */}
            <div className="h-64 sm:h-80 bg-gray-200 relative overflow-hidden">
                {stylist.bannerImage ? (
                    <img src={stylist.bannerImage} className="w-full h-full object-cover" alt="Banner" />
                ) : (
                    <div className="w-full h-full bg-crown-dark flex items-center justify-center text-white/20 text-4xl font-serif">CrownSide</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            </div>

            <div className="container mx-auto px-4 -mt-24 relative z-10 flex flex-col md:flex-row gap-8 pb-20">

                {/* Left: Profile Info */}
                <div className="md:w-1/3 animate-enter animate-delay-1">
                    <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden mb-4 bg-gray-100">
                                <img src={stylist.profileImage || `https://placehold.co/150?text=Pro`} className="w-full h-full object-cover" alt={stylist.businessName} />
                            </div>
                            <h1 className="text-2xl font-bold font-serif text-crown-dark mb-1">{stylist.businessName}</h1>
                            <p className="text-gray-500 mb-4 flex items-center gap-1 text-sm">
                                <FaMapMarkerAlt className="text-crown-gold" /> {stylist.locationType} • Detroit, MI
                            </p>

                            {/* Bio */}
                            <p className="text-gray-600 text-sm leading-relaxed mb-6">
                                {stylist.bio || 'No bio available.'}
                            </p>

                            {/* Contact Buttons */}
                            {renderContactButtons()}
                        </div>

                        <div className="mt-8 pt-6 border-t">
                            <h3 className="font-bold text-gray-900 mb-3">Specialties</h3>
                            <div className="flex flex-wrap gap-2">
                                {stylist.specialties.map(spec => (
                                    <span key={spec} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full uppercase tracking-wider font-bold">
                                        {spec}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Booking & Content */}
                <div className="md:w-2/3 space-y-8 animate-enter animate-delay-2">

                    {/* Services */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                        <h2 className="text-2xl font-serif font-bold mb-6 text-crown-dark">Select a Service</h2>
                        <div className="space-y-4">
                            {services.length === 0 && <p className="text-gray-500">No services listed.</p>}
                            {services.map(service => (
                                <div
                                    key={service.id}
                                    onClick={() => setSelectedService(service)}
                                    className={`p-4 rounded-xl border-2 transition cursor-pointer flex justify-between items-center group ${selectedService?.id === service.id ? 'border-crown-gold bg-crown-gold/5' : 'border-dashed border-gray-200 hover:border-crown-gold/50'}`}
                                >
                                    <div>
                                        <h3 className={`font-bold text-lg ${selectedService?.id === service.id ? 'text-crown-dark' : 'text-gray-700'}`}>{service.name}</h3>
                                        <p className="text-sm text-gray-500">{service.duration} mins • {service.category}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-bold text-xl text-crown-dark">${service.price}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Simple Date Picker (Only if service selected) */}
                    {selectedService && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 animate-fade-in-up">
                            <h2 className="text-xl font-serif font-bold mb-4">Choose Date & Time</h2>
                            <div className="mb-6">
                                <DatePicker
                                    selected={selectedDate}
                                    onChange={(date) => setSelectedDate(date)}
                                    showTimeSelect
                                    dateFormat="MMMM d, yyyy h:mm aa"
                                    className="w-full p-3 border rounded-lg"
                                    placeholderText="Click to select date"
                                    minDate={new Date()}
                                />
                            </div>

                            <button
                                onClick={handleBook}
                                disabled={isBooking || !selectedDate}
                                className="w-full btn-primary py-4 text-lg shadow-lg flex justify-center items-center gap-2"
                            >
                                {isBooking ? 'Processing...' : `Request Appointment • $${selectedService.price}`}
                            </button>
                            <p className="text-center text-xs text-gray-400 mt-4">You won't be charged until the stylist approves.</p>
                        </div>
                    )}

                    {/* Portfolio Grid */}
                    {portfolio.length > 0 && (
                        <div className="mt-12">
                            <h2 className="text-2xl font-serif font-bold mb-6 text-crown-dark">Portfolio</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {portfolio.map(img => (
                                    <div key={img.id} className="aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-sm">
                                        <img src={img.imageUrl} className="w-full h-full object-cover hover:scale-105 transition duration-500" alt="Work" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
