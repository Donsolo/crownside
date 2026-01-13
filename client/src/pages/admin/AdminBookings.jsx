import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Calendar, Search, MapPin } from 'lucide-react';

export default function AdminBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const res = await api.get('/bookings/all');
            setBookings(res.data);
        } catch (err) {
            console.error("Failed to fetch bookings", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredBookings = bookings.filter(b =>
        b.client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.stylist.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.service.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div>Loading bookings...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-serif font-bold text-crown-dark">Bookings</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search bookings..."
                        className="pl-10 pr-4 py-2 border rounded-lg w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">Date/Time</th>
                            <th className="p-4 font-semibold text-gray-600">Service</th>
                            <th className="p-4 font-semibold text-gray-600">Client</th>
                            <th className="p-4 font-semibold text-gray-600">Stylist</th>
                            <th className="p-4 font-semibold text-gray-600">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredBookings.map(booking => (
                            <tr key={booking.id} className="hover:bg-gray-50 transition">
                                <td className="p-4 text-sm">
                                    <div className="font-medium text-gray-900">
                                        {new Date(booking.appointmentDate).toLocaleDateString()}
                                    </div>
                                    <div className="text-gray-500">
                                        {new Date(booking.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="font-medium">{booking.service.name}</div>
                                    <div className="text-sm text-gray-500">${booking.service.price} • {booking.service.duration} min</div>
                                </td>
                                <td className="p-4 text-sm text-gray-600">
                                    {booking.client.email}
                                </td>
                                <td className="p-4 text-sm text-gray-600">
                                    {booking.stylist.businessName}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${booking.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                            booking.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                                                booking.status === 'CANCELED' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {booking.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredBookings.length === 0 && (
                    <div className="p-8 text-center text-gray-400">No bookings found.</div>
                )}
            </div>
        </div>
    );
}
