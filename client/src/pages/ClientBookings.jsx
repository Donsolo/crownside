import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Hero from '../components/Hero';

export default function ClientBookings() {
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

    // Review Form Params
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    const { user, logout } = useAuth(); // Destructure user
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
        }
    }, [navigate]);

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

    useEffect(() => {
        fetchBookings();
    }, []);

    const openReviewModal = (booking) => {
        setSelectedBooking(booking);
        setReviewModalOpen(true);
    };

    const submitReview = async (e) => {
        e.preventDefault();
        try {
            await api.post('/reviews', {
                bookingId: selectedBooking.id,
                rating,
                comment
            });
            alert('Review Submitted!');
            setReviewModalOpen(false);
            setComment('');
            fetchBookings(); // Refresh to potentially show "Reviewed" status if we were tracking it
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to submit review');
        }
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="min-h-screen bg-crown-cream">
            <Hero
                pageKey="bookings"
                className="h-[50vh] md:h-[60vh] flex items-center justify-center text-center"
            >
                <div className="flex flex-col items-center gap-4 relative z-10 p-4">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-white drop-shadow-xl">My Bookings</h1>
                    <button
                        onClick={handleLogout}
                        className="md:hidden text-sm bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-full backdrop-blur-sm transition border border-white/40 shadow-lg"
                    >
                        Log Out
                    </button>
                </div>
            </Hero>

            <div className="container mx-auto px-4 -mt-20 relative z-20">
                <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-crown-soft min-h-[400px]">
                    {bookings.length === 0 && !isLoading && (
                        <div className="text-center py-12">
                            <p className="text-gray-500 mb-4">You haven't made any bookings yet.</p>
                            <button onClick={() => navigate('/explore')} className="btn-primary">Find a Pro</button>
                        </div>
                    )}

                    <div className="space-y-4">
                        {bookings.map(booking => (
                            <div key={booking.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-lg">{booking.stylist.businessName}</h3>
                                    <p className="text-crown-gray">{booking.service.name} • ${booking.service.price}</p>
                                    <p className="text-sm text-gray-500">{new Date(booking.appointmentDate).toLocaleString()}</p>
                                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${booking.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                        booking.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                                            booking.status === 'CANCELED' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {booking.status}
                                    </span>
                                </div>

                                {/* Allow review if Approved or Completed (relaxed logic per conversation) */}
                                {(booking.status === 'COMPLETED' || booking.status === 'APPROVED') && (
                                    <button
                                        onClick={() => openReviewModal(booking)}
                                        className="btn-secondary text-sm px-4 py-2"
                                    >
                                        Leave Review
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Review Modal */}
                    {reviewModalOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-xl p-8 max-w-md w-full">
                                <h3 className="text-2xl font-serif mb-4">Review {selectedBooking?.stylist.businessName}</h3>
                                <form onSubmit={submitReview}>
                                    <div className="mb-4">
                                        <label className="block font-bold mb-2">Rating</label>
                                        <select
                                            className="w-full p-2 border rounded"
                                            value={rating}
                                            onChange={(e) => setRating(e.target.value)}
                                        >
                                            <option value="5">5 - Excellent</option>
                                            <option value="4">4 - Good</option>
                                            <option value="3">3 - Average</option>
                                            <option value="2">2 - Poor</option>
                                            <option value="1">1 - Terrible</option>
                                        </select>
                                    </div>
                                    <div className="mb-4">
                                        <label className="block font-bold mb-2">Comment</label>
                                        <textarea
                                            className="w-full p-2 border rounded h-24"
                                            required
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                        ></textarea>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button type="button" onClick={() => setReviewModalOpen(false)} className="px-4 py-2 text-gray-500">Cancel</button>
                                        <button type="submit" className="btn-primary">Submit Review</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
