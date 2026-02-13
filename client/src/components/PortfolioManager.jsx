import { useRef } from 'react';
import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Trash2, Plus, Image as ImageIcon, Upload } from 'lucide-react';

const PortfolioManager = () => {
    const [images, setImages] = useState([]);
    const [newImageUrl, setNewImageUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    // State to store the fetched stylist ID
    const [planKey, setPlanKey] = useState('PRO'); // Default to PRO

    useEffect(() => {
        fetchStylistAndImages();
    }, []);

    const fetchStylistAndImages = async () => {
        try {
            // First get the stylist ID
            const me = await api.get('/auth/me');
            if (me.data.stylistProfile) {
                const id = me.data.stylistProfile.id;
                setStylistId(id);
                // Then get images
                const response = await api.get(`/portfolio/stylist/${id}`);
                setImages(response.data);

                // Fetch subscription status to know limits
                try {
                    const subRes = await api.get('/subscriptions/status');
                    if (subRes.data.plan) {
                        setPlanKey(subRes.data.plan.key.toUpperCase());
                    }
                } catch (subErr) {
                    console.warn("Could not fetch subscription status, using defaults");
                }
            }
        } catch (err) {
            console.error("Failed to fetch portfolio images", err);
            // Don't show error to user immediately, maybe empty state
        } finally {
            setLoading(false);
        }
    };

    const fileInputRef = useRef(null);

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSubmitting(true);
        setError(null);

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await api.post('/portfolio', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setImages([response.data, ...images]);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to upload image.');
            console.error(err);
        } finally {
            setSubmitting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleAddImage = async (e) => {
        e.preventDefault();
        if (!newImageUrl.trim()) return;

        setSubmitting(true);
        setError(null);

        try {
            const response = await api.post('/portfolio', { imageUrl: newImageUrl });
            setImages([response.data, ...images]);
            setNewImageUrl('');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to add image.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteImage = async (imageId) => {
        if (!window.confirm('Are you sure you want to remove this image?')) return;

        try {
            await api.delete(`/portfolio/${imageId}`);
            setImages(images.filter(img => img.id !== imageId));
        } catch (err) {
            setError('Failed to delete image.');
        }
    };

    const { SUBSCRIPTION_TIERS } = require('../config/constants');
    const currentTier = SUBSCRIPTION_TIERS[planKey] || SUBSCRIPTION_TIERS.PRO;
    const isLimitReached = images.length >= currentTier.photoLimit;

    if (loading) return <div>Loading portfolio...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-xl font-body font-semibold text-primary-900">Add to Portfolio</h3>
                        <span className="text-xs text-crown-gold font-bold uppercase tracking-wider">{currentTier.label} Plan</span>
                    </div>
                    <span className={`text-sm font-bold ${isLimitReached ? 'text-red-500' : 'text-gray-500'}`}>
                        {images.length} / {currentTier.photoLimit} items
                    </span>
                </div>

                {isLimitReached ? (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    You have reached the limit of {currentTier.photoLimit} items.
                                    {currentTier.key === 'pro' && ' Upgrade to Elite for more space!'}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {!currentTier.videoAllowed && (
                            <div className="bg-stone-50 border border-stone-100 rounded-lg p-3 mb-4 flex justify-between items-center">
                                <span className="text-xs text-stone-500 font-medium">✨ Want to upload videos?</span>
                                <button className="text-xs font-bold text-crown-gold hover:underline">Upgrade to Elite</button>
                            </div>
                        )}

                        <div className="flex gap-4 items-center mb-4">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-crown-gold text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors flex items-center gap-2"
                                disabled={submitting}
                            >
                                <Upload size={20} /> Upload {currentTier.videoAllowed ? 'Photo / Video' : 'Photo'}
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept={currentTier.videoAllowed ? "image/*,video/*" : "image/*"}
                                onChange={handleFileSelect}
                            />
                            <span className="text-gray-400">or add via URL:</span>
                        </div>

                        <form onSubmit={handleAddImage} className="flex gap-4">
                            <input
                                type="url"
                                placeholder="https://example.com/image.jpg"
                                value={newImageUrl}
                                onChange={(e) => setNewImageUrl(e.target.value)}
                                className="flex-1 p-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
                            />
                            <button
                                type="submit"
                                disabled={submitting || !newImageUrl.trim()}
                                className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-black transition-colors flex items-center gap-2"
                            >
                                {submitting ? 'Adding...' : <><Plus size={20} /> Add URL</>}
                            </button>
                        </form>
                    </>
                )}
                {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((img) => (
                    <div key={img.id} className="group relative aspect-square bg-neutral-100 rounded-lg overflow-hidden border border-neutral-200">
                        <img
                            src={img.imageUrl}
                            alt="Portfolio"
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = 'https://placehold.co/400?text=Invalid+Image' }}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                                onClick={() => handleDeleteImage(img.id)}
                                className="bg-white text-red-600 p-2 rounded-full hover:bg-neutral-100 transform scale-0 group-hover:scale-100 transition-transform duration-200"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                ))}
                {images.length === 0 && (
                    <div className="col-span-full py-12 text-center text-neutral-500 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200">
                        <ImageIcon className="mx-auto h-12 w-12 text-neutral-400 mb-2" />
                        <p>No images in portfolio yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PortfolioManager;
