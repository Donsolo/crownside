import React, { useEffect, useState, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Dialog, Menu, Transition } from '@headlessui/react';
import api from '../lib/api';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { FaInstagram, FaTiktok, FaPhoneAlt, FaGlobe, FaMapMarkerAlt, FaStar, FaShareAlt, FaUserPlus, FaUserCheck, FaUserTimes, FaComment, FaEllipsisH, FaBan, FaFlag, FaArrowLeft, FaCheckCircle, FaCalendarCheck, FaPaperPlane, FaShare } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';

export default function StylistProfile({ handle }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [stylist, setStylist] = useState(null);
    const [services, setServices] = useState([]);

    // Determine the identifier to use (prop handle takes precedence for subdomains)
    const activeId = handle || id;
    const [portfolio, setPortfolio] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Social State
    const [connectionStatus, setConnectionStatus] = useState('NONE');
    const [actionLoading, setActionLoading] = useState(false);

    // Booking State
    const [selectedService, setSelectedService] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [isBooking, setIsBooking] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [availability, setAvailability] = useState({ schedule: [], exceptions: [] });

    const [isBioExpanded, setIsBioExpanded] = useState(false);

    const [selectedPortfolioItem, setSelectedPortfolioItem] = useState(null);

    // Storefront 2.0 State (Restored)
    const [activeCategory, setActiveCategory] = useState('All');
    const [expandedServiceId, setExpandedServiceId] = useState(null);
    const [showStickyNav, setShowStickyNav] = useState(false); // New for Phase 5

    // Reviews State
    const [visibleReviews, setVisibleReviews] = useState(3);

    // Insights Calculation
    const bookings = stylist?.stylistBookings || [];

    // 1. Extract and Flatten Reviews
    const reviews = bookings.flatMap(b => {
        const bookingReviews = b.reviews || [];
        // Map to flat structure for UI
        return bookingReviews.map(r => ({
            ...r,
            clientName: b.user?.firstName || 'Client',
            serviceName: b.service?.name || 'Service',
            date: r.createdAt
        }));
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    // 2. Client Metrics
    const totalClients = new Set(bookings.map(b => b.userId)).size;
    const clientCounts = bookings.reduce((acc, b) => {
        acc[b.userId] = (acc[b.userId] || 0) + 1;
        return acc;
    }, {});
    const returningClients = Object.values(clientCounts).filter(count => count > 1).length;
    const rebookingRate = totalClients > 0 ? Math.round((returningClients / totalClients) * 100) : 0;

    // 3. Ratings & Trending
    const totalRating = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    const activeRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : "New";
    // Alias for compatibility with other sections
    const averageRating = activeRating;
    const reviewCount = reviews.length;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const monthlyBookings = bookings.filter(b => new Date(b.createdAt) > thirtyDaysAgo && b.status !== 'CANCELED').length;
    const isTrending = monthlyBookings >= 5;



    const joinedYear = stylist?.createdAt ? new Date(stylist.createdAt).getFullYear() : new Date().getFullYear();

    useEffect(() => {
        const fetchStylist = async () => {
            if (!activeId) return;
            try {
                const res = await api.get(`/stylists/${activeId}`);
                setStylist(res.data);
                setServices(res.data.services || []);
                setPortfolio(res.data.portfolioImages || []);

                // Set default reviews visibility
                setVisibleReviews(3);

                // Fetch Availability
                if (res.data.id) {
                    try {
                        const availRes = await api.get(`/availability/${res.data.id}`);
                        setAvailability(availRes.data || { schedule: [], exceptions: [] });
                    } catch (e) {
                        console.warn('Availability fetch failed', e);
                    }
                }

                // Fetch Connection Status if logged in
                if (currentUser && res.data.userId !== currentUser.id) {
                    checkConnectionStatus(res.data.userId);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStylist();
    }, [activeId, currentUser]);

    // Scroll Detection for Sticky Nav (Phase 5)
    useEffect(() => {
        const handleScroll = () => {
            const heroHeight = 400; // Approx hero section height
            setShowStickyNav(window.scrollY > heroHeight);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToServices = () => {
        const section = document.getElementById('services-section');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const checkConnectionStatus = async (targetId) => {
        try {
            const res = await api.get(`/connections/status/${targetId}`);
            setConnectionStatus(res.data.status);
        } catch (err) {
            console.error("Failed to check connection status", err);
        }
    };

    const handleConnect = async () => {
        if (!currentUser) return navigate('/login');
        setActionLoading(true);
        try {
            await api.post('/connections/request', { targetUserId: stylist.userId });
            setConnectionStatus('REQUEST_SENT');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to send request');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAccept = async () => {
        setActionLoading(true);
        try {
            await api.post('/connections/accept', { requesterId: stylist.userId });
            setConnectionStatus('CONNECTED');
        } catch (err) {
            alert('Failed to accept');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemove = async () => {
        if (!window.confirm('Remove connection?')) return;
        setActionLoading(true);
        try {
            await api.post('/connections/remove', { targetUserId: stylist.userId });
            setConnectionStatus('NONE');
        } catch (err) {
            alert('Failed to remove');
        } finally {
            setActionLoading(false);
        }
    };

    const handleMessage = async () => {
        if (!currentUser) return navigate('/login');
        try {
            const res = await api.post('/messages', { participantId: stylist.userId });
            navigate(`/messages/${res.data.id}`);
        } catch (err) {
            alert('Failed to open chat');
        }
    };

    const handleBlock = async () => {
        if (!window.confirm('Block this user?')) return;
        try {
            await api.post('/blocks', { targetUserId: stylist.userId });
            navigate('/explore');
        } catch (err) {
            alert('Failed to block');
        }
    };

    // Availability Helpers
    const isDateAvailable = (date) => {
        if (!stylist || !availability) return true;

        const dayOfWeek = date.getDay(); // 0 = Sun

        // 1. Check Exceptions (Primary Override)
        // Note: Exceptions are usually specific dates.
        const dateString = date.toDateString();
        const exception = availability.exceptions?.find(e => new Date(e.date).toDateString() === dateString);

        if (exception) {
            return !exception.isOff;
        }

        // 2. Check Weekly Schedule
        const schedule = availability.schedule?.find(s => s.dayOfWeek === dayOfWeek);
        if (schedule) {
            return schedule.isWorkingDay;
        }

        return false; // Default closed if not defined
    };

    const getDayHours = (date) => {
        if (!date || !availability) return { min: undefined, max: undefined };

        const dayOfWeek = date.getDay();
        let startStr = "09:00";
        let endStr = "17:00";

        // Find constraints
        const dateString = date.toDateString();
        const exception = availability.exceptions?.find(e => new Date(e.date).toDateString() === dateString);

        if (exception && !exception.isOff) {
            if (exception.startTime) startStr = exception.startTime;
            if (exception.endTime) endStr = exception.endTime;
        } else {
            const schedule = availability.schedule?.find(s => s.dayOfWeek === dayOfWeek);
            if (schedule && schedule.isWorkingDay) {
                startStr = schedule.startTime;
                endStr = schedule.endTime;
            }
        }

        const [startH, startM] = startStr.split(':').map(Number);
        const [endH, endM] = endStr.split(':').map(Number);

        const minTime = new Date(date); minTime.setHours(startH, startM, 0);
        const maxTime = new Date(date); maxTime.setHours(endH, endM, 0);

        return { minTime, maxTime };
    };

    const isTimeExcluded = (time) => {
        if (!stylist?.stylistBookings) return false;

        const timeVal = time.getTime();

        // 20 min slot duration check logic? 
        // DatePicker calls this for specific intervals. 
        // We just need to check if 'time' is INSIDE a booked slot.
        return stylist.stylistBookings.some(booking => {
            if (['CANCELED', 'CANCELLED_BY_CLIENT', 'CANCELLED_BY_TECH'].includes(booking.status)) return false;

            const start = new Date(booking.appointmentDate).getTime();
            // Default 60 min if missing, or use service duration if available? 
            // Better to trust booking record duration.
            const duration = booking.duration || 60;
            const end = start + (duration * 60000);

            // Inclusive start, exclusive end? 
            // Usually start is occupied. End is free.
            return timeVal >= start && timeVal < end;
        });
    };

    const handleBook = () => {
        if (!selectedService || !selectedDate) return alert('Please select a service and date');
        const token = localStorage.getItem('token');
        if (!token) return navigate('/login');

        // Open Confirmation Modal instead of immediate book
        setConfirmModalOpen(true);
    };

    const submitBooking = async () => {
        setConfirmModalOpen(false);
        setIsBooking(true);
        try {
            await api.post('/bookings', {
                stylistId: stylist.id,
                serviceId: selectedService.id,
                appointmentDate: selectedDate
            });
            setBookingSuccess(true); // Show success state
            setSelectedService(null);
            setSelectedDate(null);
        } catch (err) {
            // Handle availability errors gracefully
            if (err.response?.status === 409 || err.response?.data?.error?.includes('available')) {
                alert("This time is no longer available. Please select another time or stylist.");
            } else {
                alert(err.response?.data?.error || 'Booking failed');
            }
        } finally {
            setIsBooking(false);
        }
    };

    if (isLoading) return <div className="text-center py-20">Loading Pro Profile...</div>;
    if (!stylist) return <div className="text-center py-20">Professional not found.</div>;



    // Contact Helper (Updated with Connect)
    // Contact Helper (Updated with Connect)
    const isMe = currentUser?.id === stylist.userId;

    const renderContactButtons = () => {
        // We keep existing logic but append Connect/Message

        return (
            <div className="flex gap-3 mt-6 flex-wrap justify-center">

                {/* Existing Socials */}
                {stylist.contactPreference !== 'BOOKINGS_ONLY' && (
                    <>
                        {stylist.contactPreference === 'CALL_OR_TEXT' && stylist.phoneNumber && (
                            <a href={`tel:${stylist.phoneNumber}`} className="btn-pill bg-stone-900 text-white hover:bg-stone-800 flex items-center gap-2 text-sm shadow-md">
                                <FaPhoneAlt size={14} /> Call
                            </a>
                        )}
                    </>
                )}

                {/* Social Actions - Only for Logged In Users */}
                {currentUser && !isMe && (
                    <>
                        {/* Connect Button */}
                        {connectionStatus === 'NONE' && (
                            <button onClick={handleConnect} disabled={actionLoading} className="btn-pill bg-crown-gold text-white hover:bg-crown-dark flex items-center gap-2 text-sm shadow-md">
                                <FaUserPlus /> Connect
                            </button>
                        )}
                        {connectionStatus === 'REQUEST_SENT' && (
                            <button onClick={handleRemove} disabled={actionLoading} className="btn-pill bg-stone-100 text-stone-500 flex items-center gap-2 text-sm">
                                <FaUserTimes /> Requested
                            </button>
                        )}
                        {connectionStatus === 'REQUEST_RECEIVED' && (
                            <button onClick={handleAccept} disabled={actionLoading} className="btn-pill bg-green-600 text-white hover:bg-green-700 flex items-center gap-2 text-sm shadow-md">
                                <FaUserCheck /> Accept
                            </button>
                        )}
                        {connectionStatus === 'CONNECTED' && (
                            <button onClick={handleMessage} className="btn-pill bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 text-sm shadow-md">
                                <FaComment /> Message
                            </button>
                        )}

                        {/* Three Dots Menu */}
                        <Menu as="div" className="relative">
                            <Menu.Button className="w-12 h-12 flex items-center justify-center text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition">
                                <FaEllipsisH />
                            </Menu.Button>
                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >
                                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white rounded-2xl shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50 text-left overflow-hidden">
                                    <div className="py-1">
                                        {connectionStatus === 'CONNECTED' && (
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <button onClick={handleRemove} className={`${active ? 'bg-stone-50' : ''} text-stone-700 w-full px-4 py-3 text-sm flex items-center`}>
                                                        <FaUserTimes className="mr-3" /> Remove Friend
                                                    </button>
                                                )}
                                            </Menu.Item>
                                        )}
                                        <Menu.Item>
                                            {({ active }) => (
                                                <button onClick={handleBlock} className={`${active ? 'bg-red-50' : ''} text-red-600 w-full px-4 py-3 text-sm flex items-center`}>
                                                    <FaBan className="mr-3" /> Block User
                                                </button>
                                            )}
                                        </Menu.Item>
                                    </div>
                                </Menu.Items>
                            </Transition>
                        </Menu>
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-stone-50 pb-24 font-sans text-stone-900">
            {/* 1. Hero Banner (Immersive) */}
            <div className="h-[420px] md:h-[500px] bg-stone-900 relative overflow-hidden group">
                {stylist.bannerImage ? (
                    <img src={stylist.bannerImage} className="w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105" alt="Banner" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-stone-800 via-stone-900 to-black flex items-center justify-center text-white/5 text-8xl font-serif">CrownSide</div>
                )}
                {/* Soft Bronze Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/40 to-transparent/30"></div>

                {/* Navbar Actions */}
                <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-30">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-lg active:scale-95 group/back"
                    >
                        <FaArrowLeft size={18} className="group-hover/back:-translate-x-1 transition-transform" />
                    </button>

                    {/* Share Button (moved to Hero) */}
                    <button
                        onClick={() => {
                            const url = stylist.storefrontHandle
                                ? `https://${stylist.storefrontHandle}.thecrownside.com`
                                : window.location.href;
                            navigator.clipboard.writeText(url);
                            alert('Storefront link copied!');
                        }}
                        className="h-12 px-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center gap-2 text-white hover:bg-white/20 transition-all shadow-lg active:scale-95 font-medium"
                    >
                        <FaShareAlt size={16} /> <span className="hidden sm:inline">Share Profile</span>
                    </button>
                </div>
            </div>

            {/* Main Content Container */}
            <div className="max-w-4xl mx-auto px-4 -mt-32 relative z-20 space-y-8">

                {/* 2. Profile Card (Identity & Trust) */}
                <div className="card-premium p-6 pt-0 md:p-10 md:pt-0 pb-10 text-center animate-enter animate-delay-1 relative overflow-visible isolate">

                    {/* Floating Avatar */}
                    <div className="-mt-24 mb-4 flex justify-center relative z-10">
                        <div className="relative">
                            <Avatar
                                src={stylist.profileImage}
                                user={stylist.user}
                                size="3xl"
                                className={`shadow-2xl ${stylist.user?.isFounderEnrolled ? 'ring-[6px] ring-white' : 'border-[6px] border-white'}`}
                                alt={stylist.businessName}
                            />
                            {stylist.user?.isFounderEnrolled && (
                                <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm">
                                    <Badge tier="FOUNDER" size="40px" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Identity Block */}
                    <div className="flex flex-col items-center gap-1 mb-6">
                        <div className="flex items-center gap-2 justify-center flex-wrap">
                            <h1 className="font-serif text-4xl md:text-5xl font-bold text-stone-900 tracking-tight leading-tight">
                                {stylist.businessName}
                            </h1>
                            {/* Verified Check (Founder/Paid or Manual) */}
                            {(stylist.user?.isFounderEnrolled || stylist.subscription?.planKey) && (
                                <div className="text-blue-500 bg-blue-50 rounded-full p-1" title="Verified Professional">
                                    <FaUserCheck size={14} />
                                </div>
                            )}
                        </div>

                        {/* Meta Row: Location • Type • Tier */}
                        <div className="flex items-center gap-2 text-sm font-bold tracking-wide text-stone-500 uppercase mt-2 flex-wrap justify-center">
                            <span className="flex items-center gap-1 text-stone-600">
                                <FaMapMarkerAlt className="text-crown-gold" /> Detroit, MI
                            </span>
                            <span className="text-stone-300">•</span>
                            <span>{stylist.locationType === 'MOBILE' ? 'Mobile Stylist' : 'Studio'}</span>
                            {stylist.subscription?.planKey && !stylist.user?.isFounderEnrolled && (
                                <>
                                    <span className="text-stone-300">•</span>
                                    <Badge tier={stylist.subscription.planKey} size="20px" />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Trust Metrics Row */}
                    {(averageRating || monthlyBookings > 0 || isTrending) && (
                        <div className="flex justify-center gap-4 md:gap-8 mb-8 py-4 border-y border-stone-100 w-full max-w-lg mx-auto overflow-x-auto scrollbar-hide">
                            {averageRating && (
                                <div className="flex flex-col items-center min-w-[80px]">
                                    <div className="flex items-center gap-1 text-stone-900 font-bold text-lg">
                                        <FaStar className="text-yellow-400 text-base" /> {averageRating}
                                    </div>
                                    <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">{reviewCount} Reviews</span>
                                </div>
                            )}

                            {monthlyBookings > 0 && (
                                <div className="flex flex-col items-center min-w-[80px] border-l border-stone-100 pl-4 md:pl-8">
                                    <div className="flex items-center gap-1 text-stone-900 font-bold text-lg">
                                        <span className="text-crown-gold text-base">🗓</span> {monthlyBookings}
                                    </div>
                                    <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">Bookings (30d)</span>
                                </div>
                            )}

                            {isTrending && (
                                <div className="flex flex-col items-center min-w-[80px] border-l border-stone-100 pl-4 md:pl-8">
                                    <div className="flex items-center gap-1 text-stone-900 font-bold text-lg">
                                        <span className="text-orange-500 text-base">🔥</span> Hot
                                    </div>
                                    <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">Trending</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Bio Section with Toggle */}
                    <div className="max-w-2xl mx-auto mb-8 relative">
                        {stylist.bio ? (
                            <div className="text-stone-600 text-lg leading-relaxed relative">
                                <p className={!isBioExpanded ? "line-clamp-3" : ""}>
                                    {stylist.bio}
                                </p>
                                {stylist.bio.length > 150 && (
                                    <button
                                        onClick={() => setIsBioExpanded(!isBioExpanded)}
                                        className="mt-2 text-sm font-bold text-crown-gold hover:text-crown-dark transition-colors uppercase tracking-widest flex items-center justify-center gap-1 mx-auto"
                                    >
                                        {isBioExpanded ? 'Read Less' : 'Read More'}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="bg-stone-50 border border-stone-100 rounded-xl p-6 text-stone-400 italic">
                                "Meet the Stylist. Bio coming soon."
                            </div>
                        )}
                    </div>

                    {/* Specialties Pills */}
                    <div className="flex flex-wrap justify-center gap-2 mb-8">
                        {stylist.specialties && stylist.specialties.length > 0 ? (
                            stylist.specialties.map(spec => (
                                <span key={spec} className="px-4 py-2 bg-stone-100 text-stone-600 text-xs rounded-full uppercase tracking-widest font-bold hover:bg-stone-200 transition-colors cursor-default border border-transparent hover:border-stone-300">
                                    {spec}
                                </span>
                            ))
                        ) : (
                            <span className="text-stone-400 text-sm">No specialties listed</span>
                        )}
                    </div>

                    {/* Action Buttons */}
                    {renderContactButtons()}
                </div>

                {/* 3. Services Section (Interactive) */}
                <div className="card-premium p-6 md:p-8 animate-enter animate-delay-2" id="services-section">
                    <div className="text-center mb-8">
                        <h2 className="font-serif text-3xl md:text-4xl text-stone-900 mb-3">Service Menu</h2>
                        <div className="h-1 w-16 bg-crown-gold/40 mx-auto rounded-full"></div>
                    </div>

                    {/* Category Tabs */}
                    <div className="flex overflow-x-auto pb-4 mb-6 gap-2 scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0 md:justify-center">
                        {['All', ...new Set(services.map(s => s.category || 'Other'))].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeCategory === cat
                                    ? 'bg-stone-900 text-crown-gold shadow-md'
                                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Service List */}
                    <div className="space-y-4">
                        {services
                            .filter(s => activeCategory === 'All' || (s.category || 'Other') === activeCategory)
                            .map(service => {
                                const isExpanded = expandedServiceId === service.id;
                                // Popular Logic: simple check if service ID appears in bookings often (mock threshold for now or derived)
                                const bookingCount = stylist.stylistBookings?.filter(b => b.serviceId === service.id).length || 0;
                                const isPopular = bookingCount >= 3;

                                return (
                                    <div
                                        key={service.id}
                                        onClick={() => setExpandedServiceId(isExpanded ? null : service.id)}
                                        className={`border rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden ${isExpanded
                                            ? 'border-crown-gold/50 bg-stone-50 shadow-md ring-1 ring-crown-gold/20'
                                            : 'border-stone-100 hover:border-stone-300 hover:bg-stone-50/50'
                                            }`}
                                    >
                                        {/* Card Header (Always Visible) */}
                                        <div className="p-5 flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className={`font-bold text-lg ${isExpanded ? 'text-stone-900' : 'text-stone-700'}`}>
                                                        {service.name}
                                                    </h3>
                                                    {isPopular && (
                                                        <span className="bg-orange-100 text-orange-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full tracking-wide">
                                                            Popular
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-stone-500 text-sm">{service.duration} mins • {service.category || 'General'}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-serif text-xl font-bold text-stone-900">${service.price}</div>
                                                {isExpanded ? (
                                                    <div className="text-xs text-crown-gold font-bold mt-1 uppercase tracking-wide">Hide</div>
                                                ) : (
                                                    <div className="text-xs text-stone-400 font-bold mt-1 uppercase tracking-wide">View</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Expanded Content */}
                                        <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                            <div className="overflow-hidden">
                                                <div className="p-5 pt-0 border-t border-stone-100/50 mt-2">
                                                    <p className="text-stone-600 mb-4 leading-relaxed text-sm">
                                                        {service.description || "No description provided."}
                                                    </p>

                                                    {/* Smart Availability Preview */}
                                                    <div className="flex items-center gap-2 text-sm text-stone-500 bg-white p-3 rounded-lg border border-stone-100 mb-6">
                                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                                        Currently accepting bookings
                                                    </div>

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent toggling
                                                            handleBook(service);
                                                        }}
                                                        className="w-full btn-pill bg-stone-900 text-white hover:bg-crown-gold hover:text-stone-900 shadow-lg flex items-center justify-center gap-2"
                                                    >
                                                        Book This Service
                                                    </button>

                                                    <p className="text-center text-xs text-stone-400 mt-3">
                                                        Flexible cancellation policy applies.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                        {services.length === 0 && (
                            <div className="text-center py-12 text-stone-400 italic">No services available yet.</div>
                        )}
                    </div>

                    <div className="space-y-4">
                        {services.length === 0 && <p className="text-center text-stone-400 italic">No services listed yet.</p>}
                        {services.map(service => (
                            <div
                                key={service.id}
                                onClick={() => setSelectedService(service)}
                                className={`
                                    p-6 rounded-2xl border transition-all duration-300 cursor-pointer flex justify-between items-center group
                                    ${selectedService?.id === service.id
                                        ? 'border-crown-gold bg-crown-gold/5 shadow-md'
                                        : 'border-stone-100 hover:border-crown-gold/40 hover:shadow-lg bg-white'}
                                `}
                            >
                                <div>
                                    <h3 className={`font-bold text-xl mb-1 ${selectedService?.id === service.id ? 'text-crown-dark' : 'text-stone-800'}`}>
                                        {service.name}
                                    </h3>
                                    <p className="text-sm text-stone-500 font-medium">{service.duration} mins • {service.category}</p>
                                </div>
                                <div className="text-right pl-4">
                                    <span className={`block font-serif font-bold text-2xl ${selectedService?.id === service.id ? 'text-crown-dark' : 'text-stone-900'}`}>
                                        ${service.price}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Booking Form Area (Inline) */}
                    {selectedService && (
                        <div className="mt-12 pt-12 border-t border-stone-100 animate-fade-in-up">
                            {bookingSuccess ? (
                                <div className="text-center py-12 bg-green-50/50 rounded-3xl border border-green-100">
                                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                        <FaUserCheck size={32} />
                                    </div>
                                    <h3 className="text-2xl font-serif font-bold text-stone-900 mb-2">Request Sent!</h3>
                                    <p className="text-stone-600 max-w-md mx-auto mb-8">
                                        You’ll be notified once {stylist.businessName} confirms availability.
                                    </p>
                                    <button
                                        onClick={() => setBookingSuccess(false)}
                                        className="btn-pill bg-white border border-stone-200 text-stone-600 hover:text-crown-dark hover:border-crown-gold shadow-sm"
                                    >
                                        Book Another Service
                                    </button>
                                </div>
                            ) : (
                                <div className="max-w-2xl mx-auto">
                                    <h3 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center text-sm">2</span>
                                        Choose Date & Time
                                    </h3>

                                    <div className="mb-6">
                                        <DatePicker
                                            selected={selectedDate}
                                            onChange={(date) => setSelectedDate(date)}
                                            showTimeSelect
                                            dateFormat="MMMM d, yyyy h:mm aa"
                                            className="w-full p-4 text-lg border-2 border-stone-200 rounded-xl cursor-pointer caret-transparent focus:border-crown-gold focus:ring-0 transition-colors font-medium text-center"
                                            placeholderText="Click to open calendar"
                                            minDate={new Date()}
                                            filterDate={isDateAvailable}
                                            filterTime={(time) => !isTimeExcluded(time)}
                                            minTime={selectedDate ? getDayHours(selectedDate).minTime : undefined}
                                            maxTime={selectedDate ? getDayHours(selectedDate).maxTime : undefined}
                                            onKeyDown={(e) => e.preventDefault()}
                                        />
                                    </div>

                                    {/* Info Box */}
                                    <div className="bg-stone-50 rounded-xl p-4 mb-8 border border-stone-100 flex gap-3">
                                        <div className="text-stone-400 mt-1"><FaStar /></div>
                                        <div className="text-xs text-stone-500 space-y-1">
                                            <p><strong className="text-stone-700">Stylist Approval Required:</strong> This is a request. The stylist will confirm the time.</p>
                                            <p>Payments are handled separately by the stylist.</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleBook}
                                        disabled={isBooking || !selectedDate}
                                        className="w-full btn-pill bg-crown-gold text-white hover:bg-crown-dark text-lg shadow-xl flex justify-center items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isBooking ? 'Sending Request...' : `Request Appointment • $${selectedService.price}`}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 4. Portfolio Section (Masonry) */}
                <div className="card-premium p-6 md:p-8 animate-enter animate-delay-3">
                    <div className="text-center mb-8">
                        <h2 className="font-serif text-3xl md:text-4xl text-stone-900 mb-3">Portfolio</h2>
                        <div className="h-1 w-16 bg-crown-gold/40 mx-auto rounded-full"></div>
                    </div>

                    <div className="columns-2 md:columns-3 gap-4 space-y-4">
                        {portfolio.map((item) => {
                            const isVideo = item.imageUrl?.match(/\.(mp4|mov|webm)$/i);
                            return (
                                <div
                                    key={item.id}
                                    className="break-inside-avoid relative group rounded-xl overflow-hidden cursor-pointer"
                                    onClick={() => setSelectedPortfolioItem(item)}
                                >
                                    {isVideo ? (
                                        <div className="relative">
                                            <video src={item.imageUrl} className="w-full h-auto object-cover" muted loop playsInline />
                                            <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] uppercase font-bold px-2 py-1 rounded backdrop-blur-sm flex items-center gap-1">
                                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> Video
                                            </div>
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                                                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                                                    <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1"></div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <img
                                            src={item.imageUrl}
                                            alt={item.description || "Portfolio"}
                                            className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
                                            loading="lazy"
                                        />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                        <p className="text-white font-bold text-sm truncate">{item.description || "View Details"}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {portfolio.length === 0 && (
                        <div className="text-center py-12 text-stone-400 italic bg-stone-50 rounded-2xl border border-stone-100 border-dashed">
                            No portfolio items yet.
                        </div>
                    )}
                </div>

                {/* 5. Insights & Credibility */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-enter animate-delay-4">
                    <div className="bg-stone-900 rounded-[24px] p-6 text-center text-white flex flex-col items-center justify-center">
                        <div className="text-3xl font-serif font-bold text-crown-gold mb-1">{rebookingRate}%</div>
                        <div className="text-xs uppercase tracking-widest opacity-80">Return Clients</div>
                    </div>
                    <div className="bg-white rounded-[24px] p-6 text-center border border-stone-200 shadow-sm flex flex-col items-center justify-center">
                        <div className="text-3xl font-serif font-bold text-stone-900 mb-1">{totalClients}+</div>
                        <div className="text-xs uppercase tracking-widest text-stone-500">Clients Served</div>
                    </div>
                    <div className="bg-white rounded-[24px] p-6 text-center border border-stone-200 shadow-sm flex flex-col items-center justify-center">
                        <div className="text-3xl font-serif font-bold text-stone-900 mb-1">{joinedYear}</div>
                        <div className="text-xs uppercase tracking-widest text-stone-500">Member Since</div>
                    </div>
                </div>

                {/* 6. Reviews Section */}
                <div className="card-premium p-6 md:p-8 animate-enter animate-delay-5" id="reviews-section">
                    <div className="text-center mb-10">
                        <h2 className="font-serif text-3xl md:text-4xl text-stone-900 mb-2">Client Love</h2>
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <div className="flex text-yellow-500 text-xl">
                                {[...Array(5)].map((_, i) => (
                                    <FaStar key={i} className={i < Math.round(activeRating) ? "text-yellow-400" : "text-stone-200"} />
                                ))}
                            </div>
                            <span className="font-bold text-stone-900 text-lg">{activeRating}</span>
                            <span className="text-stone-400 text-sm">({reviews.length} reviews)</span>
                        </div>
                        <div className="h-1 w-16 bg-crown-gold/40 mx-auto rounded-full"></div>
                    </div>

                    <div className="space-y-6">
                        {reviews.slice(0, visibleReviews).map((review, i) => (
                            <div key={i} className="pb-6 border-b border-stone-100 last:border-0 last:pb-0">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="font-bold text-stone-900">{review.clientName}</div>
                                        <span className="bg-green-100 text-green-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <FaCheckCircle size={10} /> Verified
                                        </span>
                                    </div>
                                    <div className="text-xs text-stone-400">{new Date(review.date).toLocaleDateString()}</div>
                                </div>
                                <div className="flex text-yellow-400 text-xs mb-2">
                                    {[...Array(5)].map((_, i) => (
                                        <FaStar key={i} className={i < review.rating ? "text-yellow-400" : "text-stone-200"} />
                                    ))}
                                </div>
                                <p className="text-stone-600 text-sm leading-relaxed italic">"{review.comment}"</p>
                                <div className="mt-2 text-xs text-stone-400 font-medium">Service: {review.serviceName}</div>
                            </div>
                        ))}

                        {reviews.length === 0 && (
                            <div className="text-center py-8 text-stone-400">
                                <p>No reviews yet. Book a service and be the first!</p>
                            </div>
                        )}
                    </div>

                    {reviews.length > visibleReviews && (
                        <div className="mt-8 text-center">
                            <button
                                onClick={() => setVisibleReviews(prev => prev + 5)}
                                className="px-6 py-2 border border-stone-300 rounded-full text-sm font-bold text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                            >
                                Show More Reviews
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* --- PHASE 5: Conversion Optimization --- */}

            {/* 1. Mobile Sticky Bottom Action Bar */}
            <Transition
                as="div"
                show={showStickyNav}
                enter="transition duration-300 transform"
                enterFrom="translate-y-full"
                enterTo="translate-y-0"
                leave="transition duration-200 transform"
                leaveFrom="translate-y-0"
                leaveTo="translate-y-full"
                className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-lg border-t border-stone-200 z-40 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.1)] flex items-center justify-between gap-3 safe-area-bottom"
            >
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            if (currentUser && !isMe) handleMessage();
                            else if (!currentUser) navigate('/login');
                        }}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-stone-100 text-stone-600 active:scale-95 transition-transform"
                    >
                        <FaComment size={20} />
                    </button>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            alert('Link copied!');
                        }}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-stone-100 text-stone-600 active:scale-95 transition-transform"
                    >
                        <FaShare size={20} />
                    </button>
                </div>
                <button
                    onClick={scrollToServices}
                    className="flex-1 h-12 bg-crown-gold text-white font-bold rounded-full shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 text-lg"
                >
                    <FaCalendarCheck /> Book Now
                </button>
            </Transition>

            {/* 2. Desktop Floating Action Cluster */}
            <div className="fixed bottom-8 right-8 z-50 hidden md:flex flex-col items-end gap-4 pointer-events-none">
                {/* Secondary Actions (Mini FABs) */}
                <Transition
                    as="div"
                    show={showStickyNav}
                    enter="transition duration-300 transform"
                    enterFrom="translate-y-10 opacity-0"
                    enterTo="translate-y-0 opacity-100"
                    leave="transition duration-200 transform"
                    leaveFrom="translate-y-0 opacity-100"
                    leaveTo="translate-y-10 opacity-0"
                    className="flex flex-col gap-3 pointer-events-auto"
                >
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            alert('Link copied!');
                        }}
                        className="w-12 h-12 bg-white text-stone-600 rounded-full shadow-lg border border-stone-100 flex items-center justify-center hover:scale-110 transition-transform hover:text-crown-gold"
                        title="Share Profile"
                    >
                        <FaShare size={18} />
                    </button>

                    <button
                        onClick={() => {
                            if (currentUser && !isMe) handleMessage();
                            else if (!currentUser) navigate('/login');
                        }}
                        className="w-12 h-12 bg-white text-stone-600 rounded-full shadow-lg border border-stone-100 flex items-center justify-center hover:scale-110 transition-transform hover:text-crown-gold"
                        title="Message Stylist"
                    >
                        <FaComment size={18} />
                    </button>
                </Transition>

                {/* Primary Book FAB */}
                <Transition
                    as="div"
                    show={showStickyNav}
                    enter="transition duration-300 delay-100 transform"
                    enterFrom="translate-y-10 opacity-0 scale-90"
                    enterTo="translate-y-0 opacity-100 scale-100"
                    leave="transition duration-200 transform"
                    leaveFrom="translate-y-0 opacity-100 scale-100"
                    leaveTo="translate-y-10 opacity-0 scale-90"
                    className="pointer-events-auto"
                >
                    <button
                        onClick={scrollToServices}
                        className="h-14 px-8 bg-stone-900 text-white rounded-full shadow-2xl flex items-center gap-3 font-bold text-lg hover:bg-crown-gold hover:text-stone-900 hover:-translate-y-1 transition-all group"
                    >
                        <span className="group-hover:animate-pulse">Book Appointment</span> <FaArrowLeft className="rotate-[-45deg] group-hover:rotate-0 transition-transform" />
                    </button>
                </Transition>
            </div>

            {/* Booking Confirmation Modal */}
            <Transition appear show={confirmModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setConfirmModalOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-8 text-left align-middle shadow-2xl transition-all">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-2xl font-serif font-bold leading-6 text-stone-900 mb-4 text-center"
                                    >
                                        Confirm Request
                                    </Dialog.Title>
                                    <div className="mt-2 text-center">
                                        <p className="text-stone-600 mb-6">
                                            Requesting <strong className="text-stone-900">{selectedService?.name}</strong> with {stylist.businessName} on:
                                        </p>
                                        <div className="bg-stone-50 py-3 px-4 rounded-xl border border-stone-100 mb-6 inline-block font-bold text-stone-800">
                                            {selectedDate?.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                        </div>

                                        <p className="text-xs text-stone-400 max-w-xs mx-auto">
                                            Payments are handled directly by the stylist. No charges are made now.
                                        </p>
                                    </div>

                                    <div className="mt-8 flex gap-3 justify-center">
                                        <button
                                            type="button"
                                            className="btn-pill bg-stone-100 text-stone-600 hover:bg-stone-200"
                                            onClick={() => setConfirmModalOpen(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-pill bg-crown-gold text-white hover:bg-crown-dark shadow-md"
                                            onClick={submitBooking}
                                        >
                                            Send Request
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div >
    );
}

