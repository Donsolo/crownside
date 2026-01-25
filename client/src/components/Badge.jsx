import React from 'react';
import PropTypes from 'prop-types';

import badgePro from '../assets/badges/badge-pro.png';
import badgeElite from '../assets/badges/badge-elite.png';
import badgePremier from '../assets/badges/badge-premier.png';
import badgeFounder from '../assets/badges/founder_badge.png';

const BADGES = {
    'PRO': {
        src: badgePro,
        label: 'CrownSide Pro member'
    },
    'ELITE': {
        src: badgeElite,
        label: 'CrownSide Elite member'
    },
    'PREMIER': {
        src: badgePremier,
        label: 'CrownSide Premier member'
    },
    'FOUNDER': {
        src: badgeFounder,
        label: 'CrownSide Founder'
    }
};

const Badge = ({ tier, size = '24px', className = '' }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    if (!tier) return null;

    const normalizedTier = tier.toUpperCase();
    const badge = BADGES[normalizedTier];

    if (!badge) return null;

    // Strict style enforcement as per requirements
    const style = {
        width: size,
        height: size,
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: 'middle',
        cursor: 'pointer', // Clickable
        userSelect: 'none'
    };

    const toggleTooltip = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    // Close on click outside (simple effect)
    React.useEffect(() => {
        if (!isOpen) return;
        const close = () => setIsOpen(false);
        document.addEventListener('click', close);
        return () => document.removeEventListener('click', close);
    }, [isOpen]);

    return (
        <div className="relative inline-block" style={{ verticalAlign: 'middle' }}>
            <img
                src={badge.src}
                alt={badge.label}
                aria-label={badge.label}
                className={`crownside-badge ${className} hover:scale-110 active:scale-95 transition-transform`}
                style={style}
                onClick={toggleTooltip}
            />
            {isOpen && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 animate-fade-in text-center leading-relaxed">
                    <div className="font-bold text-crown-gold mb-1">{badge.label}</div>
                    {tier === 'FOUNDER'
                        ? "This member is a founding partner of the CrownSide community, helping to pioneer the platform."
                        : "A verified professional member of CrownSide."}
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
                </div>
            )}
        </div>
    );
};

Badge.propTypes = {
    tier: PropTypes.oneOf(['PRO', 'ELITE', 'PREMIER', 'pro', 'elite', 'premier']),
    size: PropTypes.string,
    className: PropTypes.string
};

export default Badge;
