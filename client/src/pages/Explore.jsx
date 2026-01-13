import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import Hero from '../components/Hero';

export default function Explore() {
    const [stylists, setStylists] = useState([]);
    const [filteredStylists, setFilteredStylists] = useState([]);
    const [category, setCategory] = useState('hair'); // 'hair' | 'nails'
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStylists = async () => {
            try {
                const res = await api.get('/stylists');
                setStylists(res.data);
                setFilteredStylists(res.data.filter(s => s.specialties && s.specialties.includes('hair')));
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStylists();
    }, []);

    useEffect(() => {
        if (stylists.length > 0) {
            const filtered = stylists.filter(s => {
                // If they have no specialties defined (old data), assume 'hair'
                const specs = s.specialties && s.specialties.length > 0 ? s.specialties : ['hair'];
                return specs.includes(category);
            });
            setFilteredStylists(filtered);
        }
    }, [category, stylists]);

    return (
        <div className="min-h-screen bg-crown-cream">
            <Hero
                pageKey="explore"
                className="h-[50vh] md:h-[60vh] flex items-center justify-center text-center"
            >
                <div>
                    <h1 className="text-4xl md:text-6xl font-serif font-bold text-white drop-shadow-lg mb-4">Find a Beauty Pro</h1>
                    <p className="text-lg text-white/90 drop-shadow-md max-w-xl mx-auto">Discover and book the best beauty professionals in your area.</p>
                </div>
            </Hero>

            <div className="container mx-auto px-4 relative z-20 -mt-20">
                <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-crown-soft" >

                    {/* Filter Toggles */}
                    <div className="flex justify-center mb-8 gap-4">
                        <button
                            onClick={() => setCategory('hair')}
                            className={`px-6 py-2 rounded-full font-medium transition ${category === 'hair' ? 'bg-crown-dark text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                            Hair Services
                        </button>
                        <button
                            onClick={() => setCategory('nails')}
                            className={`px-6 py-2 rounded-full font-medium transition ${category === 'nails' ? 'bg-crown-dark text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                            Nail Services
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-12">Loading...</div>
                    ) : (
                        <div className="grid md:grid-cols-3 gap-6">
                            {filteredStylists.length === 0 && <p className="col-span-3 text-center text-gray-500 py-12">No professionals found for this category.</p>}
                            {filteredStylists.map(stylist => (
                                <Link key={stylist.id} to={`/stylist/${stylist.id}`} className="block group">
                                    <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-xl transition border border-gray-100 group-hover:border-crown-gold/30">
                                        <div className="h-48 bg-gray-200 relative overflow-hidden">
                                            {stylist.bannerImage ? (
                                                <img src={stylist.bannerImage} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt="Banner" />
                                            ) : (
                                                <div className="w-full h-full bg-crown-dark flex items-center justify-center text-crown-gold opacity-50">CrownSide</div>
                                            )}
                                            <div className="absolute -bottom-6 left-6">
                                                <div className="w-16 h-16 rounded-full border-4 border-white overflow-hidden bg-gray-100 shadow-sm">
                                                    <img src={stylist.profileImage || 'https://placehold.co/100?text=Pro'} className="w-full h-full object-cover" alt="Profile" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-6 pt-8">
                                            <h3 className="text-xl font-bold font-serif mb-1 group-hover:text-crown-gold transition">{stylist.businessName}</h3>
                                            <p className="text-sm text-crown-gray mb-3 flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                {stylist.locationType} • Detroit, MI
                                            </p>
                                            <p className="text-sm text-gray-600 line-clamp-2">{stylist.bio || 'Beauty Professional ready to serve you.'}</p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
