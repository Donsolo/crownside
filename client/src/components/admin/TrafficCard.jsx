import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { FaChartBar, FaUsers, FaArrowUp, FaArrowDown, FaSync } from 'react-icons/fa';

export default function TrafficCard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        try {
            const res = await api.get('/analytics/stats');
            setStats(res.data);
        } catch (err) {
            console.error("Failed to load traffic stats", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleRefresh = () => {
        fetchStats(true);
    };

    // Fallback if loading or error
    if (loading) return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse h-64">
            <div className="h-6 bg-gray-100 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-3 gap-4">
                <div className="h-16 bg-gray-100 rounded"></div>
                <div className="h-16 bg-gray-100 rounded"></div>
                <div className="h-16 bg-gray-100 rounded"></div>
            </div>
            <div className="h-24 bg-gray-100 rounded mt-6"></div>
        </div>
    );

    if (!stats) return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center text-gray-400 h-64 gap-4">
            <p>Analytics Unavailable</p>
            <button onClick={handleRefresh} className="btn-secondary text-sm flex items-center gap-2">
                <FaSync /> Retry
            </button>
        </div>
    );

    // Chart Logic: Normalize heights based on max value
    const chartData = stats.chart || [];
    const maxCount = Math.max(...chartData.map(d => d.count), 1); // Avoid div by zero

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <FaChartBar />
                    </div>
                    <h3 className="font-bold text-gray-800">Site Traffic</h3>
                </div>
                <div className="flex items-center gap-2">
                    <div className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        Live
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className={`p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all ${refreshing ? 'animate-spin text-blue-600' : ''}`}
                        title="Refresh Data"
                    >
                        <FaSync size={12} />
                    </button>
                </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
                {/* METRICS ROW */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="text-center md:text-left">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Last 24h</p>
                        <p className="text-2xl font-serif font-bold text-gray-900">{stats.daily}</p>
                        <p className="text-[10px] text-gray-400">Visitors</p>
                    </div>
                    <div className="text-center md:text-left border-l border-gray-100 pl-4">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">7 Days</p>
                        <p className="text-2xl font-serif font-bold text-gray-900">{stats.weekly}</p>
                        <p className="text-[10px] text-gray-400">Visitors</p>
                    </div>
                    <div className="text-center md:text-left border-l border-gray-100 pl-4">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">30 Days</p>
                        <p className="text-2xl font-serif font-bold text-gray-900">{stats.monthly}</p>
                        <p className="text-[10px] text-gray-400">Visitors</p>
                    </div>
                </div>

                {/* SIMPLE CSS CHART */}
                <div className="mt-auto">
                    <p className="text-xs font-bold text-gray-400 mb-4">Traffic Trend (Last 7 Days)</p>
                    {chartData.length > 0 ? (
                        <div className="h-24 flex items-end gap-2">
                            {chartData.map((d, i) => {
                                const heightPercent = (d.count / maxCount) * 100;
                                const dateLabel = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center group">
                                        <div className="relative w-full flex items-end justify-center h-full">
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition text-[10px] bg-black text-white px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-10">
                                                {d.count} visits
                                            </div>
                                            {/* Bar */}
                                            <div
                                                className="w-full bg-blue-500 rounded-t-sm hover:bg-blue-600 transition-all duration-300"
                                                style={{ height: `${Math.max(heightPercent, 5)}%`, opacity: 0.7 + (heightPercent / 300) }}
                                            ></div>
                                        </div>
                                        <span className="text-[9px] text-gray-400 mt-1">{dateLabel}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-24 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed text-gray-400 text-xs">
                            Collecting data...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
