import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Search, MapPin } from 'lucide-react';

export default function AdminPros() {
    const [stylists, setStylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchStylists();
    }, []);

    const fetchStylists = async () => {
        try {
            const res = await api.get('/stylists'); // Public endpoint returns list
            setStylists(res.data);
        } catch (err) {
            console.error("Failed to fetch stylists", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredStylists = stylists.filter(s =>
        s.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div>Loading stylists...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-serif font-bold text-crown-dark">Beauty Professionals</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search pros..."
                        className="pl-10 pr-4 py-2 border rounded-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">Professional</th>
                            <th className="p-4 font-semibold text-gray-600">Services</th>
                            <th className="p-4 font-semibold text-gray-600">Location</th>
                            <th className="p-4 font-semibold text-gray-600">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredStylists.map(stylist => (
                            <tr key={stylist.id} className="hover:bg-gray-50 transition">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        {/* Avatar placeholder if no image */}
                                        <div className="w-10 h-10 rounded-full bg-crown-dark text-white flex items-center justify-center font-bold">
                                            {stylist.businessName[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">{stylist.businessName}</div>
                                            <div className="text-xs text-gray-500">{stylist.user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="text-sm font-bold text-gray-800">
                                        {(stylist.specialties || []).length === 1 && 'Beauty Pro'}
                                        {(stylist.specialties || []).length === 2 && 'Beauty Pro Elite'}
                                        {(stylist.specialties || []).length >= 3 && 'Beauty Pro Premier'}
                                        <span className="text-xs font-normal text-gray-500 ml-2">(${stylist.specialties?.length === 1 ? '24.99' : stylist.specialties?.length === 2 ? '34.99' : '49.99'}/mo)</span>
                                    </div>
                                    <div className="text-xs text-secondary truncate max-w-[200px]">
                                        Services: {stylist.services.length} listed
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <MapPin size={14} />
                                        {stylist.locationType}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">Active</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredStylists.length === 0 && (
                    <div className="p-8 text-center text-gray-400">No beauty professionals found.</div>
                )}
            </div>
        </div>
    );
}
