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

    const [filterTier, setFilterTier] = useState('ALL'); // ALL, PRO, ELITE, PREMIER
    const [filterService, setFilterService] = useState('ALL'); // ALL, HAIR, NAILS, LASH_BROW

    const filteredStylists = stylists.filter(s => {
        const matchesSearch = s.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.user.email.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesTier = true;
        const specialtyCount = (s.specialties || []).length;
        if (filterTier === 'PRO') matchesTier = specialtyCount === 1;
        if (filterTier === 'ELITE') matchesTier = specialtyCount === 2;
        if (filterTier === 'PREMIER') matchesTier = specialtyCount >= 3;

        let matchesService = true;
        if (filterService !== 'ALL') {
            matchesService = (s.specialties || []).includes(filterService);
        }

        return matchesSearch && matchesTier && matchesService;
    });

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

            {/* Filters */}
            <div className="flex gap-4">
                <select
                    className="p-2 border rounded-lg bg-white"
                    value={filterTier}
                    onChange={(e) => setFilterTier(e.target.value)}
                >
                    <option value="ALL">All Tiers</option>
                    <option value="PRO">Beauty Pro</option>
                    <option value="ELITE">Beauty Pro Elite</option>
                    <option value="PREMIER">Beauty Pro Premier</option>
                </select>

                <select
                    className="p-2 border rounded-lg bg-white"
                    value={filterService}
                    onChange={(e) => setFilterService(e.target.value)}
                >
                    <option value="ALL">All Services</option>
                    <option value="hair">Hair</option>
                    <option value="nails">Nails</option>
                    <option value="lash_brow">Lash/Brow Tech</option>
                </select>
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
                                    <div className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                        {(stylist.specialties || []).length === 1 && <span className="text-crown-gold">Beauty Pro</span>}
                                        {(stylist.specialties || []).length === 2 && <span className="text-purple-600">Beauty Pro Elite</span>}
                                        {(stylist.specialties || []).length >= 3 && <span className="text-emerald-600">Beauty Pro Premier</span>}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        ${(stylist.specialties || []).length === 1 ? '24.99' : (stylist.specialties || []).length === 2 ? '34.99' : '49.99'}/mo
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-wrap gap-1">
                                        {(stylist.specialties || []).map(spec => (
                                            <span key={spec} className="px-2 py-0.5 rounded text-xs bg-gray-100 border border-gray-200">
                                                {spec === 'hair' ? 'Hair' : spec === 'nails' ? 'Nails' : 'Lash/Brow Tech'}
                                            </span>
                                        ))}
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
