import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaLock, FaTrash, FaUserSlash, FaEye, FaFilter } from 'react-icons/fa';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ModeratorDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL'); // ALL, POST, COMMENT, USER

    useEffect(() => {
        if (user && (user.role === 'ADMIN' || user.role === 'MODERATOR')) {
            fetchReports();
        } else {
            navigate('/');
        }
    }, [user]);

    const fetchReports = async () => {
        try {
            const res = await api.get('/moderation/reports');
            setReports(res.data);
        } catch (err) {
            console.error("Failed to fetch reports", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action, report, duration = null) => {
        if (!window.confirm(`Are you sure you want to ${action} this?`)) return;

        let targetId, targetType;
        if (report.forumPostId) { targetType = 'POST'; targetId = report.forumPostId; }
        else if (report.commentId) { targetType = 'COMMENT'; targetId = report.commentId; }
        else if (report.targetUserId) { targetType = 'USER'; targetId = report.targetUserId; }

        try {
            await api.post('/moderation/action', {
                action,
                targetType: action === 'MUTE' ? 'USER' : targetType,
                targetId: action === 'MUTE' ? report.targetUserId : targetId, // Mutin user even if reported for post
                duration
            });
            fetchReports(); // Refresh
        } catch (err) {
            console.error(err);
            alert('Action failed');
        }
    };

    const filteredReports = reports.filter(r => {
        if (filter === 'ALL') return true;
        return r.targetType === filter;
    });

    if (loading) return <div className="p-8 text-center">Loading Dashboard...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-serif font-bold text-gray-900">Moderation Queue</h1>
                    <div className="flex gap-2">
                        {['ALL', 'POST', 'COMMENT', 'USER'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${filter === f ? 'bg-crown-gold text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredReports.length === 0 ? (
                    <div className="bg-white p-12 rounded-xl text-center shadow-sm">
                        <FaCheck className="mx-auto text-green-500 mb-4" size={48} />
                        <h2 className="text-xl font-bold text-gray-900">All Clear!</h2>
                        <p className="text-gray-500">No pending reports to review.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredReports.map(report => (
                            <div key={report.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">
                                {/* Report Meta */}
                                <div className="md:w-1/4 space-y-2 border-r border-gray-100 pr-4">
                                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${report.targetType === 'POST' ? 'bg-blue-100 text-blue-700' : report.targetType === 'COMMENT' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {report.targetType}
                                    </span>
                                    <p className="text-sm text-gray-500">
                                        Reported by <span className="font-bold text-gray-900">{report.reporter.displayName || 'User'}</span>
                                    </p>
                                    <p className="text-xs text-gray-400">{new Date(report.createdAt).toLocaleString()}</p>
                                    <div className="bg-red-50 p-2 rounded text-red-700 text-sm font-medium">
                                        Reason: {report.reason}
                                    </div>
                                </div>

                                {/* Content Preview */}
                                <div className="md:w-1/2">
                                    {report.forumPost && (
                                        <>
                                            <h3 className="font-bold text-lg mb-1">{report.forumPost.title}</h3>
                                            <p className="text-gray-600 text-sm line-clamp-3">{JSON.parse(JSON.stringify(report.forumPost.content)).notes || 'No content'}</p>
                                        </>
                                    )}
                                    {report.comment && (
                                        <p className="text-gray-600 text-sm italic">"{report.comment.content}"</p>
                                    )}
                                    {report.targetUser && (
                                        <div className="flex items-center gap-2">
                                            <div className="font-bold">{report.targetUser.displayName}</div>
                                            <span className="text-xs text-gray-400">{report.targetUser.email}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="md:w-1/4 flex flex-col gap-2 justify-center pl-4 border-l border-gray-100">
                                    <button onClick={() => handleAction('DISMISS', report)} className="btn-secondary text-xs flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700">
                                        <FaTimes /> Dismiss Report
                                    </button>

                                    <button onClick={() => handleAction('REMOVE', report)} className="btn-secondary text-xs flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border-red-100">
                                        <FaTrash /> Remove Content
                                    </button>

                                    {report.targetType === 'POST' && (
                                        <button onClick={() => handleAction('LOCK', report)} className="btn-secondary text-xs flex items-center justify-center gap-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-100">
                                            <FaLock /> Lock Thread
                                        </button>
                                    )}

                                    <button onClick={() => handleAction('MUTE', report, 24)} className="btn-secondary text-xs flex items-center justify-center gap-2 bg-gray-800 hover:bg-black text-white">
                                        <FaUserSlash /> Mute User (24h)
                                    </button>

                                    {report.forumPostId && (
                                        <button onClick={() => navigate(`/forum/post/${report.forumPostId}`)} className="text-xs text-center text-crown-gold hover:underline mt-2">
                                            View Context
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
