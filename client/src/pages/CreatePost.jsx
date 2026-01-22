import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCamera, FaTimes, FaCheck } from 'react-icons/fa';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { SERVICE_CATEGORIES } from '../config/categories';

export default function CreatePost() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const board = searchParams.get('board') || 'FIND_PRO';

    const [formData, setFormData] = useState({
        title: '',
        type: 'Hair',
        content: {
            location: '',
            date: '',
            budget: '',
            notes: '',
            services: [], // For Stylist
            locationType: 'Salon', // For Stylist
            deposit: false // For Stylist
        }
    });
    const [images, setImages] = useState([]); // Array of strings (URLs)
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const isFindingPro = board === 'FIND_PRO';
    const isCommunity = ['SALON_TALK', 'HELP_FEEDBACK', 'ANNOUNCEMENTS'].includes(board);

    // Categories based on Board
    const getCategories = () => {
        if (board === 'SALON_TALK') return [{ id: 'advice', label: 'Advice' }, { id: 'technique', label: 'Technique' }, { id: 'business', label: 'Business' }, { id: 'story', label: 'Story' }];
        if (board === 'HELP_FEEDBACK') return [{ id: 'bug', label: 'Bug Report' }, { id: 'feature', label: 'Feature Request' }, { id: 'feedback', label: 'General Feedback' }];
        if (board === 'ANNOUNCEMENTS') return [{ id: 'update', label: 'Update' }, { id: 'event', label: 'Event' }];
        return SERVICE_CATEGORIES;
    };

    const categories = getCategories();

    // Misuse Detection
    const checkMisuse = () => {
        if (!isCommunity) return false;
        const spamRegex = /(dm to book|link in bio|booking via dm|deposit ready|cash app \$|slots filling|book now)/i;
        const text = `${formData.title} ${formData.content.notes || ''}`;
        return spamRegex.test(text);
    };

    const showMisuseWarning = checkMisuse();

    const handleContentChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            content: { ...prev.content, [field]: value }
        }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const data = new FormData();
        data.append('image', file);

        try {
            const res = await api.post('/forum/upload', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setImages(prev => [...prev, res.data.url]);
        } catch (err) {
            alert('Failed to upload image');
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) return alert('Title is required');

        if (showMisuseWarning) {
            return alert("Please remove booking/pricing language. Community boards are for discussion only.");
        }

        setSubmitting(true);
        try {
            await api.post('/forum', {
                board,
                type: isCommunity ? (formData.type || categories[0].label) : formData.type.toUpperCase(),
                title: formData.title,
                content: formData.content,
                images // Array of URLs
            });
            navigate(`/forum/feed?board=${board}`);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || 'Failed to create post');
            setSubmitting(false);
        }
    };

    // RESTRICTION: Clients cannot post in FIND_CLIENT or ANNOUNCEMENTS (Admins/Pros only logic handled, UI blocked in Feed but extra check here is good)
    if ((board === 'FIND_CLIENT' || board === 'ANNOUNCEMENTS') && user && user.role === 'CLIENT') {
        return (
            <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-lg max-w-lg w-full text-center">
                    <h2 className="font-serif text-2xl font-bold mb-4">Professional Access Only</h2>
                    <p className="text-gray-500 mb-8">
                        {board === 'FIND_CLIENT' ? 'Only beauty professionals can post availability.' : 'Only administrators can post announcements.'}
                    </p>
                    <button onClick={() => navigate('/forum')} className="btn-primary w-full">
                        Return to Crown Connect
                    </button>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
                    <h2 className="font-serif text-2xl font-bold mb-4">Log in to post on Crown Connect</h2>
                    <p className="text-gray-500 mb-8">Create an account to connect with beauty pros and clients.</p>
                    <div className="flex flex-col gap-3">
                        <button onClick={() => navigate('/login', { state: { from: `/forum/create?board=${board}` } })} className="btn-primary w-full">
                            Log In
                        </button>
                        <button onClick={() => navigate('/register')} className="btn-secondary bg-white border border-gray-200 text-gray-900 w-full hover:bg-gray-50">
                            Create Account
                        </button>
                        <button onClick={() => navigate(-1)} className="text-gray-400 text-sm mt-2 hover:text-gray-600">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 pb-20">
            {/* Header */}
            <div className="bg-white shadow-sm sticky top-0 z-40 px-4 py-4 flex items-center justify-between">
                <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900">
                    <FaArrowLeft className="mr-2 inline" /> Back
                </button>
                <h1 className="font-serif font-bold text-lg">
                    {isCommunity ? 'Start Conversation' : (isFindingPro ? 'Request a Service' : 'Post Availability')}
                </h1>
                <div className="w-16"></div> {/* Spacer */}
            </div>

            <div className="max-w-2xl mx-auto p-4">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* MISUSE WARNING BANNER */}
                    {showMisuseWarning && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-sm">
                            <div className="flex items-start">
                                <div className="ml-3">
                                    <h3 className="text-sm font-bold text-red-800">Booking Language Detected</h3>
                                    <p className="text-sm text-red-700 mt-1">
                                        Community boards are for discussion only. To post pricing, availability, or handle bookings, please use the <strong>Find a Beauty Pro</strong> or <strong>Availability</strong> boards.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Basic Info */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            {isCommunity ? 'Topic Title' : 'Post Title'}
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder={isCommunity ? "e.g. Best products for natural hair?" : (isFindingPro ? "e.g. Looking for Medium Knotless Braids" : "e.g. Last Minute Openings for Saturday")}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-crown-gold focus:border-crown-gold outline-none"
                            required
                        />
                    </div>

                    {/* Service Type / Category */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            {isCommunity ? 'Topic Category' : 'Service Category'}
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg"
                        >
                            {/* If community, default to first option if not set? Controlled component usually requires valid value matching options */}
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.label}>{cat.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* DYNAMIC FIELDS */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                        <h3 className="font-bold text-gray-900 border-b pb-2 mb-4">Details</h3>

                        {!isCommunity && isFindingPro && (
                            // FIND PRO FIELDS
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Budget Range</label>
                                        <input
                                            type="text"
                                            placeholder="$100 - $150"
                                            className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200"
                                            value={formData.content.budget}
                                            onFocus={() => {
                                                if (!formData.content.budget) handleContentChange('budget', '$');
                                            }}
                                            onBlur={() => {
                                                if (formData.content.budget === '$') handleContentChange('budget', '');
                                            }}
                                            onChange={(e) => {
                                                let val = e.target.value;
                                                // If taking valid input, ensure prefix.
                                                // If matching '$' only and user deletes, allow clear.
                                                if (val && !val.startsWith('$')) {
                                                    val = '$' + val;
                                                }
                                                handleContentChange('budget', val);
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Date/Time</label>
                                        <input
                                            type="text"
                                            placeholder="This weekend / Flexible"
                                            className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200"
                                            value={formData.content.date}
                                            onChange={(e) => handleContentChange('date', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Location / Area</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Southfield, Detroit, Willing to Travel"
                                        className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200"
                                        value={formData.content.location}
                                        onChange={(e) => handleContentChange('location', e.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        {!isCommunity && !isFindingPro && (
                            // FIND CLIENT FIELDS
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Availability</label>
                                    <textarea
                                        rows="2"
                                        placeholder="e.g. 2 slots left for Friday at 10am and 2pm"
                                        className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200"
                                        value={formData.content.date}
                                        onChange={(e) => handleContentChange('date', e.target.value)}
                                    ></textarea>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Location Type</label>
                                        <select
                                            className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200"
                                            value={formData.content.locationType}
                                            onChange={(e) => handleContentChange('locationType', e.target.value)}
                                        >
                                            <option>Salon</option>
                                            <option>Home Studio</option>
                                            <option>Mobile / Travel</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2 pt-6">
                                        <input
                                            type="checkbox"
                                            id="deposit"
                                            className="w-5 h-5 text-crown-gold rounded"
                                            checked={formData.content.deposit}
                                            onChange={(e) => handleContentChange('deposit', e.target.checked)}
                                        />
                                        <label htmlFor="deposit" className="text-sm font-medium text-gray-700">Deposit Required?</label>
                                    </div>
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">
                                {isCommunity ? 'Message / Discussion' : 'Notes / Specifics'}
                            </label>
                            <textarea
                                rows="6"
                                placeholder={isCommunity ? "Start the conversation..." : (isFindingPro ? "Describe the style, hair length, or any specific needs..." : "Additional details about policies or the service...")}
                                className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-crown-gold outline-none"
                                value={formData.content.notes}
                                onChange={(e) => handleContentChange('notes', e.target.value)}
                            ></textarea>
                        </div>
                    </div>

                    {/* Photos */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <label className="block text-sm font-bold text-gray-700 mb-4">Photos (Optional)</label>
                        <div className="grid grid-cols-3 gap-4">
                            {images.map((url, idx) => (
                                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                                    <img src={url} alt="Upload" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveImage(idx)}
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <FaTimes size={10} />
                                    </button>
                                </div>
                            ))}

                            {images.length < 4 && (
                                <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-crown-gold hover:text-crown-gold transition bg-gray-50">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                        disabled={uploading}
                                    />
                                    {uploading ? (
                                        <div className="animate-spin w-6 h-6 border-2 border-current border-t-transparent rounded-full" />
                                    ) : (
                                        <>
                                            <FaCamera size={24} className="mb-2" />
                                            <span className="text-xs font-bold">Add Photo</span>
                                        </>
                                    )}
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={submitting || showMisuseWarning}
                            className={`w-full text-white font-bold py-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${showMisuseWarning ? 'bg-gray-400 hover:bg-gray-400' : 'bg-crown-dark hover:bg-black'}`}
                        >
                            {submitting ? 'Posting...' : <><FaCheck /> {isCommunity ? 'Start Conversation' : 'Post to Crown Connect'}</>}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
