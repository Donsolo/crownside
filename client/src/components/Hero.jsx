import React, { useState, useEffect } from 'react';
import api from '../lib/api';

const Hero = ({ pageKey, defaultDesktop, defaultMobile, children, className = "" }) => {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                // In a real app, we might fetch all at once or cache this
                const res = await api.get('/heroes');
                const heroConfig = res.data.find(h => h.pageKey === pageKey);
                setConfig(heroConfig);
            } catch (err) {
                console.error("Failed to fetch hero config", err);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, [pageKey]);

    // Loading State: Render neutral fallback (prevent flash of old placeholder)
    if (loading) {
        return (
            <section className={`relative w-full overflow-hidden bg-crown-dark ${className}`}>
                <div className="absolute inset-0 bg-neutral-900 animate-pulse" />
                {/* Optional: Render children (text) immediately if safe, or wait? 
                    User requested "clean initial render". Layout needs to hold. 
                    Let's render children to minimize LCP delay, but background is neutral.
                */}
                {/* Content */}
                <div className="relative z-10 w-full h-full opacity-0 animate-fade-in-fast">
                    {children}
                </div>
            </section>
        );
    }

    // Defaults (only applied AFTER loading, if config missing)
    const desktopSrc = config?.desktopImageUrl; // No longer falling back to props 'defaultImage' to avoid legacy flash
    const mobileSrc = config?.mobileImageUrl;
    const isEnabled = config ? config.enabled : true;

    if (!isEnabled) return null;

    return (
        <section className={`relative w-full overflow-hidden ${className}`}>
            {/* Background Images */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat md:hidden transition-opacity duration-700 ease-in-out"
                style={{ backgroundImage: mobileSrc ? `url(${mobileSrc})` : 'none', backgroundColor: '#1a1a1a' }}
            />
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat hidden md:block transition-opacity duration-700 ease-in-out"
                style={{ backgroundImage: desktopSrc ? `url(${desktopSrc})` : 'none', backgroundColor: '#1a1a1a' }}
            />

            {/* Overlay - Optional, passed via children or always present? */}
            <div className="absolute inset-0 bg-black/50" />

            {/* Content */}
            <div className="relative z-10 w-full h-full">
                {children}
            </div>
        </section>
    );
};

export default Hero;
