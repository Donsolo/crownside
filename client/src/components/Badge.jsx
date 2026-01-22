import React from 'react';
import PropTypes from 'prop-types';

import badgePro from '../assets/badges/badge-pro.png';
import badgeElite from '../assets/badges/badge-elite.png';
import badgePremier from '../assets/badges/badge-premier.png';

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
    }
};

const Badge = ({ tier, size = '24px', className = '' }) => {
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
        pointerEvents: 'none', // Not clickable
        userSelect: 'none'     // Not selectable
    };

    return (
        <img
            src={badge.src}
            alt={badge.label}
            title={badge.label} // Basic tooltip
            aria-label={badge.label}
            className={`crownside-badge ${className}`}
            style={style}
        />
    );
};

Badge.propTypes = {
    tier: PropTypes.oneOf(['PRO', 'ELITE', 'PREMIER', 'pro', 'elite', 'premier']),
    size: PropTypes.string,
    className: PropTypes.string
};

export default Badge;
