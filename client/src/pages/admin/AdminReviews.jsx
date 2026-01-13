import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Star } from 'lucide-react';

export default function AdminReviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const res = await api.get('/reviews/all');
            setReviews(res.data);
        } catch (err) {
            console.error("Failed to fetch reviews", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading reviews...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-serif font-bold text-crown-dark">Reviews and Ratings</h1>

            <div className="grid gap-6">
                {reviews.map(review => (
                    <div key={review.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg mb-1">{review.booking.stylist.businessName}</h3>
                                <div className="text-sm text-gray-500">Reviewed by {review.booking.client.email}</div>
                            </div>
                            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg text-yellow-700 font-bold">
                                <span>{review.rating}</span>
                                <Star size={14} fill="currentColor" />
                            </div>
                        </div>

                        <p className="text-gray-700 mb-4 italic">"{review.comment}"</p>

                        <div className="text-xs text-gray-400">
                            Service: {new Date(review.booking.appointmentDate).toLocaleDateString()}
                        </div>
                    </div>
                ))}

                {reviews.length === 0 && (
                    <div className="bg-white p-12 text-center rounded-xl border border-gray-100">
                        <p className="text-gray-400 text-lg">No reviews have been submitted yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
