import React, { useState, useEffect } from 'react';

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('crownside_cookie_consent');
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('crownside_cookie_consent', 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl p-4 z-50 md:flex md:items-center md:justify-between max-h-[200px] overflow-y-auto">
            <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-4">
                <p className="text-sm text-gray-600 text-center md:text-left">
                    We use cookies to enhance your experience and analyze our traffic.
                    By continuing to use our site, you agree to our <a href="/privacy" className="text-crown-gold underline">Privacy Policy</a>.
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={handleAccept}
                        className="bg-crown-dark text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-black transition whitespace-nowrap"
                    >
                        Accept
                    </button>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="text-gray-500 hover:text-gray-800 text-sm"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
}
