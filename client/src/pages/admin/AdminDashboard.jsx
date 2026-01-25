import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, Scissors, Star, ArrowRight, TrendingUp } from 'lucide-react';
import api from '../../lib/api';
import TrafficCard from '../../components/admin/TrafficCard';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        users: 0,
        pros: 0,
        bookings: 0,
        reviews: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/users/stats');
            setStats(res.data);
        } catch (err) {
            console.error("Failed to fetch dashboard stats", err);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { label: 'Total Clients', value: stats.users, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Beauty Pros', value: stats.pros, icon: Scissors, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Total Bookings', value: stats.bookings, icon: Calendar, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Platform Reviews', value: stats.reviews, icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50' }
    ];

    const shortcuts = [
        { label: 'Manage Heroes', path: '/admin/heroes', icon: ArrowRight, color: 'bg-crown-gold text-white' },
        { label: 'View Users', path: '/admin/users', icon: Users, color: 'bg-gray-100 text-gray-700' },
        { label: 'Manage Pros', path: '/admin/pros', icon: Scissors, color: 'bg-gray-100 text-gray-700' },
    ];

    if (loading) return <div>Loading dashboard...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-crown-dark">Admin Dashboard</h1>
                    <p className="text-gray-500 mt-1">Overview of CrownSide platform performance.</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition">
                            <div className={`p-3 rounded-full mb-3 ${stat.bg} ${stat.color}`}>
                                <Icon size={24} />
                            </div>
                            <span className="text-3xl font-bold text-crown-dark mb-1">{stat.value}</span>
                            <span className="text-sm font-medium text-gray-500">{stat.label}</span>
                        </div>
                    );
                })}
            </div>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TrafficCard />
                {/* Future card placeholder or leave empty for now, maybe move Quick Actions here? */}
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-xl font-serif font-bold text-crown-dark mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {shortcuts.map((sc, index) => {
                        const Icon = sc.icon;
                        return (
                            <Link key={index} to={sc.path} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex items-center justify-between group">
                                <span className="font-semibold text-gray-700">{sc.label}</span>
                                <div className={`p-2 rounded-full ${sc.color} group-hover:scale-110 transition`}>
                                    <Icon size={20} />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
