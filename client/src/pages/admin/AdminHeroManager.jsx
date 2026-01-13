import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

const PAGES = [
    { key: 'home', label: 'Home Page' },
    { key: 'explore', label: 'Explore / Find a Pro' },
    { key: 'about', label: 'About Us' },
    { key: 'contact', label: 'Contact Us' },
    { key: 'faq', label: 'FAQ' },
    { key: 'bookings', label: 'Client Bookings' } // Optional
];

export default function AdminHeroManager() {
    const [heroes, setHeroes] = useState([]);
    const [loading, setLoading] = useState(true);
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    useEffect(() => {
        fetchHeroes();
    }, []);

    const fetchHeroes = async () => {
        try {
            const res = await api.get('/heroes');
            setHeroes(res.data);
        } catch (err) {
            alert('Failed to load configs');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-serif font-bold text-crown-dark">Hero Image Manager</h1>

            {/* Pages Grid */}
            <div className="space-y-8">
                {PAGES.map(page => (
                    <HeroEditor
                        key={page.key}
                        page={page}
                        existingConfig={heroes.find(h => h.pageKey === page.key)}
                        onUpdate={fetchHeroes}
                    />
                ))}
            </div>
        </div>
    );
}

function HeroEditor({ page, existingConfig, onUpdate }) {
    const [enabled, setEnabled] = useState(existingConfig ? existingConfig.enabled : true);
    const [uploading, setUploading] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        setUploading(true);

        const formData = new FormData();
        formData.append('enabled', enabled);

        const desktopFile = e.target.desktopImage.files[0];
        const mobileFile = e.target.mobileImage.files[0];

        if (desktopFile) formData.append('desktopImage', desktopFile);
        if (mobileFile) formData.append('mobileImage', mobileFile);

        try {
            await api.put(`/heroes/${page.key}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Saved!');
            onUpdate();
        } catch (err) {
            console.error(err);
            alert('Failed to save');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{page.label}</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setEnabled(e.target.checked)}
                        className="w-5 h-5 text-crown-gold rounded"
                    />
                    <span className="font-medium text-gray-700">Enable Hero</span>
                </label>
            </div>

            <form onSubmit={handleSave} className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold mb-2">Desktop Image (Landscape)</label>
                    <div className="h-40 bg-gray-100 rounded-lg mb-2 overflow-hidden border border-gray-300">
                        {existingConfig?.desktopImageUrl ? (
                            <img src={existingConfig.desktopImageUrl} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                        )}
                    </div>
                    <input type="file" name="desktopImage" accept="image/*" className="text-sm" />
                </div>

                <div>
                    <label className="block text-sm font-bold mb-2">Mobile Image (Portrait)</label>
                    <div className="h-40 w-24 mx-auto bg-gray-100 rounded-lg mb-2 overflow-hidden border border-gray-300">
                        {existingConfig?.mobileImageUrl ? (
                            <img src={existingConfig.mobileImageUrl} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                        )}
                    </div>
                    <input type="file" name="mobileImage" accept="image/*" className="text-sm" />
                </div>

                <div className="md:col-span-2 text-right">
                    <button disabled={uploading} className="btn-primary">
                        {uploading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}
