import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';

import Hero from '../components/Hero';

export default function StylistProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [stylist, setStylist] = useState(null);
    const [selectedService, setSelectedService] = useState(null);
    const [bookingDate, setBookingDate] = useState('');

    useEffect(() => {
        const fetchStylist = async () => {
            try {
                const res = await api.get(`/stylists/${id}`);
                setStylist(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchStylist();
    }, [id]);

    const handleBook = async () => {
        if (!selectedService || !bookingDate) return alert('Select a service and date');
        const token = localStorage.getItem('token');
        if (!token) return navigate('/login');

        try {
            await api.post('/bookings', {
                stylistId: stylist.id,
                serviceId: selectedService.id,
                appointmentDate: bookingDate,
                notes: 'Booked via CrownSide'
            });
            alert('Booking Request Sent!');
            setSelectedService(null);
        } catch (err) {
            alert('Booking failed');
        }
    };

    if (!stylist) return <div>Loading...</div>;

    return (
        <div className="bg-crown-cream min-h-screen pb-16">
            {/* Hero Section */}
            <Hero
                defaultDesktop={stylist.bannerImage}
                defaultMobile={stylist.bannerImage}
                className="h-[50vh] md:h-[60vh] flex items-center justify-center text-center"
            >
                <div className="relative z-10 px-4">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-white drop-shadow-xl mb-2">{stylist.businessName}</h1>
                    <div className="flex items-center justify-center gap-2 text-white/90 drop-shadow-md font-medium">
                        <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-sm border border-white/30">
                            {stylist.locationType}
                        </span>
                        <span>•</span>
                        <span>Detroit, MI</span>
                    </div>
                </div>
            </Hero>

            <div className="container mx-auto px-4 -mt-20 relative z-20">
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-crown-soft relative">
                    {/* Profile Image Overlay */}
                    <div className="absolute -top-16 left-8">
                        <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gray-200 overflow-hidden">
                            <img
                                src={stylist.profileImage || 'https://placehold.co/128?text=Pro'}
                                alt={stylist.businessName}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                    {/* Spacer for profile image */}
                    <div className="mt-12 md:mt-0 md:ml-40 flex justify-between items-start">
                        {/* Optional: Add social links or 'Share' button here later */}
                    </div>
                    <p className="text-lg text-gray-700 max-w-2xl mb-8 mt-6">{stylist.bio}</p>

                    {/* Portfolio Section */}
                    {stylist.portfolioImages && stylist.portfolioImages.length > 0 && (
                        <div className="mb-10">
                            <h3 className="text-2xl font-serif font-bold mb-4 border-b pb-2">Portfolio</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {stylist.portfolioImages.map(img => (
                                    <div key={img.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark-shadow">
                                        <img
                                            src={img.imageUrl}
                                            alt="Portfolio"
                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                            onError={(e) => { e.target.src = 'https://placehold.co/400?text=Image' }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <h3 className="text-2xl font-serif font-bold mb-6 border-b pb-2">Service Menu</h3>
                    <div className="space-y-4">
                        {stylist.services.map(service => (
                            <div key={service.id}
                                className={`flex justify-between items-center p-4 border rounded-xl cursor-pointer transition ${selectedService?.id === service.id ? 'border-crown-gold bg-yellow-50 ring-1 ring-crown-gold' : 'hover:bg-gray-50'}`}
                                onClick={() => setSelectedService(service)}
                            >
                                <div>
                                    <h4 className="font-bold text-lg">{service.name}</h4>
                                    <p className="text-gray-500">{service.duration} mins</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-xl">${service.price}</p>
                                    {service.deposit > 0 && <span className="text-xs text-crown-gold font-medium">Deposit: ${service.deposit}</span>}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Booking Action */}
                    {selectedService && (
                        <div className="mt-8 p-6 bg-crown-dark text-white rounded-xl flex flex-col md:flex-row items-end justify-between gap-4">
                            <div className="w-full md:w-auto">
                                <label className="block text-sm text-crown-gold mb-1">Select Date & Time</label>
                                <input
                                    type="datetime-local"
                                    className="w-full px-4 py-2 rounded text-black"
                                    onChange={(e) => setBookingDate(e.target.value)}
                                />
                            </div>
                            <button onClick={handleBook} className="btn-secondary w-full md:w-auto">
                                Request Appointment
                            </button>
                        </div>
                    )}

                    {/* Reviews Section */}
                    <div className="mt-12 pt-12 border-t">
                        <h3 className="text-2xl font-serif font-bold mb-6">Client Reviews</h3>
                        <ReviewsList stylistId={stylist.id} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function ReviewsList({ stylistId }) {
    const [reviews, setReviews] = useState([]);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const res = await api.get(`/reviews/stylist/${stylistId}`);
                setReviews(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchReviews();
    }, [stylistId]);

    if (reviews.length === 0) return <p className="text-gray-500">No reviews yet.</p>;

    return (
        <div className="space-y-6">
            {reviews.map(review => (
                <div key={review.id} className="bg-gray-50 p-6 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="flex text-yellow-500">
                            {[...Array(review.rating)].map((_, i) => (
                                <span key={i}>★</span>
                            ))}
                        </div>
                        <span className="text-sm text-gray-400">• {new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-700 mb-2">{review.comment}</p>
                    <p className="text-xs text-crown-gray font-medium">- {review.booking.client.email.split('@')[0]}</p>

                    {review.reply && (
                        <div className="mt-4 pl-4 border-l-2 border-crown-gold">
                            <p className="text-sm font-bold text-crown-dark mb-1">Response from Professional</p>
                            <p className="text-sm text-gray-600">{review.reply}</p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

