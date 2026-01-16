import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import Hero from '../components/Hero';
import { SERVICE_CATEGORIES } from '../config/categories';
import { FaStar } from 'react-icons/fa';

export default function Explore() {
    const [stylists, setStylists] = useState([]);
    const [filteredStylists, setFilteredStylists] = useState([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStylists = async () => {
            try {
                const res = await api.get('/stylists');
                setStylists(res.data);
                // Initial filter will trigger in second useEffect
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
            if (activeCategory === 'all') {
                setFilteredStylists(stylists);
            } else {
                const filtered = stylists.filter(s => {
                    const specs = s.specialties && s.specialties.length > 0 ? s.specialties : ['hair'];
                    return specs.includes(activeCategory);
                });
                setFilteredStylists(filtered);
            }
        } else {
            setFilteredStylists([]);
        }
    }, [activeCategory, stylists]);

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
                    {/* Filter Bar */}
                    <div className="flex justify-center mb-10 animate-enter animate-delay-1">
                        <div className="inline-flex bg-gray-100 p-1 rounded-xl shadow-inner overflow-x-auto max-w-full">
                            <button
                                onClick={() => setActiveCategory('all')}
                                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 whitespace-nowrap ${activeCategory === 'all'
                                    ? 'bg-white text-crown-dark shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                    }`}
                            >
                                All Services
                            </button>
                            {SERVICE_CATEGORIES.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${activeCategory === cat.id
                                        ? 'bg-white text-crown-dark shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                        }`}
                                >
                                    {cat.shortLabel}
                                </button>
                            ))}
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-12">Loading...</div>
                    ) : (
                        <div className="grid md:grid-cols-3 gap-6 animate-enter animate-delay-2">
                            {filteredStylists.length === 0 && <p className="col-span-3 text-center text-gray-500 py-12">No professionals found for this category.</p>}
                            {filteredStylists.map(stylist => (
                                <Link key={stylist.id} to={`/stylist/${stylist.id}`} className="block group">
                                    <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-xl transition border border-gray-100 group-hover:border-crown-gold/30">
                                        <div className="h-48 bg-gray-200 relative">
                                            {/* Image Wrapper for Zoom Effect */}
                                            <div className="absolute inset-0 overflow-hidden">
                                                {stylist.bannerImage ? (
                                                    <img src={stylist.bannerImage} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt="Banner" />
                                                ) : (
                                                    <div className="w-full h-full bg-cover bg-center opacity-50" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=500&q=60)` }} />
                                                )}
                                            </div>

                                            {/* Avatar - Now outside the overflow-hidden image wrapper */}
                                            <div className="absolute -bottom-6 left-6 border-4 border-white rounded-full w-16 h-16 bg-gray-100 overflow-hidden shadow-sm flex items-center justify-center z-10">
                                                {stylist.profileImage ? (
                                                    <img src={stylist.profileImage} className="w-full h-full object-cover" alt="Profile" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-crown-dark text-white font-serif font-bold text-xl">
                                                        {stylist.businessName ? stylist.businessName[0] : 'S'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-6 pt-10">
                                            <div className="mb-1">
                                                <h3 className="text-xl font-bold font-serif group-hover:text-crown-gold transition truncate">{stylist.businessName}</h3>
                                            </div>

                                            <p className="text-sm text-gray-500 mb-3 line-clamp-2 min-h-[40px]">{stylist.bio || 'Beauty Professional ready to serve you.'}</p>

                                            <div className="flex items-center gap-2 text-xs font-medium text-crown-gold border-t pt-3 mt-3">
                                                <FaStar /> <span>5.0 (New)</span>
                                                <span className="text-gray-300">|</span>
                                                <span className="text-gray-400">Detroit, MI</span>
                                            </div>
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
