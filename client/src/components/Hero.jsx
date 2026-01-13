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

    // Defaults
    const desktopSrc = config?.desktopImageUrl || defaultDesktop;
    const mobileSrc = config?.mobileImageUrl || defaultMobile;
    const isEnabled = config ? config.enabled : true; // Default to enabled if no config found yet? Or default to true.

    if (!isEnabled) return null;

    // If no images at all (no config, no defaults), what to do?
    // Maybe render a fallback colored background if specified, or nothing.
    if (!desktopSrc && !mobileSrc && !className) return null;

    return (
        <section className={`relative w-full overflow-hidden ${className}`}>
            {/* Background Images */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat md:hidden"
                style={{ backgroundImage: mobileSrc ? `url(${mobileSrc})` : 'none', backgroundColor: '#333' }}
            />
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat hidden md:block"
                style={{ backgroundImage: desktopSrc ? `url(${desktopSrc})` : 'none', backgroundColor: '#333' }}
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
