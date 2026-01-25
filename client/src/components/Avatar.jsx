import React from 'react';
import PropTypes from 'prop-types';

const SIZES = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
    '2xl': 'w-32 h-32 text-4xl',
    '3xl': 'w-40 h-40 text-5xl',
};

const FounderFrame = ({ children, className }) => (
    <div className={`relative rounded-full p-[6px] bg-gradient-to-br from-[#F9E5B3] via-[#C9A24D] to-[#8F6A2D] shadow-[0_0_0_1px_#8F6A2D,0_2px_4px_rgba(0,0,0,0.2)] ${className}`}>
        {/* Crown Accent (Micro-detail at top) */}
        <div className="absolute -top-[5px] left-1/2 -translate-x-1/2 z-10 w-3 h-3 text-[#C9A24D] drop-shadow-sm filter">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
            </svg>
        </div>

        {/* Inner Content with Bevel */}
        <div className="rounded-full bg-white h-full w-full overflow-hidden relative shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]">
            {children}
        </div>
    </div>
);

const StandardFrame = ({ children, className, isPro }) => (
    <div className={`relative rounded-full ${isPro ? 'p-[2px] bg-crown-dark' : 'p-[1px] bg-gray-200'} ${className}`}>
        <div className="rounded-full bg-white h-full w-full overflow-hidden">
            {children}
        </div>
    </div>
);

const Avatar = ({ user, src, size = 'md', className = '', alt, isLink = false }) => {
    // Resolve Image Source
    // 1. Explicit src prop
    // 2. User object profileImage
    // 3. User object stylistProfile.profileImage (if applicable/present)
    const imageSrc = src || user?.profileImage || user?.stylistProfile?.profileImage;

    // Resolve Founder Status
    const isFounder = user?.isFounderEnrolled;

    // Resolve Display Initial
    const initial = (user?.displayName || user?.email || user?.businessName || '?')[0].toUpperCase();

    const sizeClass = SIZES[size] || SIZES.md;

    const Content = (
        <img
            src={imageSrc}
            alt={alt || user?.displayName || 'Avatar'}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
        />
    );

    const Fallback = (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 font-serif font-bold absolute inset-0 hidden">
            {initial}
        </div>
    );

    // Wrapper selection
    const Wrapper = isFounder ? FounderFrame : StandardFrame;

    // Tooltip Title
    const title = isFounder ? `Founder • One of the First 100` : (user?.displayName || 'User');

    return (
        <div className={`relative inline-block rounded-full ${sizeClass} ${className}`} title={title}>
            <Wrapper className="w-full h-full">
                {imageSrc ? (
                    <>
                        <img
                            src={imageSrc}
                            alt={alt || 'Avatar'}
                            className="w-full h-full object-cover"
                        />
                        {/* Fallback rendering logic is tricky with just CSS. 
                            Standard practice: If img fails, replace src. 
                            Or render fallback behind it? 
                            Let's rely on standard img or simple fallback if no src.
                        */}
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 font-serif font-bold">
                        {initial}
                    </div>
                )}
            </Wrapper>
        </div>
    );
};

Avatar.propTypes = {
    user: PropTypes.shape({
        profileImage: PropTypes.string,
        displayName: PropTypes.string,
        email: PropTypes.string,
        isFounderEnrolled: PropTypes.bool,
        stylistProfile: PropTypes.object
    }),
    src: PropTypes.string,
    size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl']),
    className: PropTypes.string,
    alt: PropTypes.string
};

export default Avatar;
