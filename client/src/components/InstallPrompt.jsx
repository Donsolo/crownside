import React, { useState, useEffect } from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { FaShare, FaPlusSquare, FaTimes } from 'react-icons/fa'; // Assuming react-icons is available, else I'll use text

export default function InstallPrompt() {
    const { deferredPrompt, isIOS, isStandalone, triggerPrompt } = useInstallPrompt();
    const [isVisible, setIsVisible] = useState(false);
    const [isIOSModalOpen, setIsIOSModalOpen] = useState(false);

    useEffect(() => {
        // Persistence Check
        const isDismissed = localStorage.getItem('install_prompt_dismissed');
        const isInstalled = localStorage.getItem('app_installed'); // Can also track manually
        const firstLoginDone = localStorage.getItem('first_login_completed');

        // Logic: Show ONLY if NOT dismissed, NOT installed, NOT standalone.
        // AND "Show ONLY on first successful login" -> implied we handle this by setting a flag after showing/dismissing.
        if (isStandalone) return;
        if (isDismissed || isInstalled) return;
        if (firstLoginDone) return; // If they've logged in before and handled this, don't show custom prompt again.

        // Platform Constraints
        if (isIOS) {
            // iOS: Always ready to show "Add to Home Screen" instructions
            // Delay slightly for smooth entrance
            setTimeout(() => setIsVisible(true), 2000);
        } else if (deferredPrompt) {
            // Android: Only show when browser has fired 'beforeinstallprompt'
            setIsVisible(true);
        }
    }, [deferredPrompt, isIOS, isStandalone]);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('install_prompt_dismissed', 'true');
        localStorage.setItem('first_login_completed', 'true'); // Considers the "first login" event handled
    };

    const handleInstallClick = () => {
        if (isIOS) {
            setIsIOSModalOpen(true);
            setIsVisible(false); // Hide banner, show modal
        } else {
            triggerPrompt();
            setIsVisible(false);
            // We assume success/dismissal logic in hook handles the deferredPrompt,
            // but for our business logic, we mark "first login" as done.
            localStorage.setItem('first_login_completed', 'true');
            // If accepted, PWA install event usually fires, we could listen for 'appinstalled'
        }
    };

    if (!isVisible && !isIOSModalOpen) return null;

    // METRO DETROIT THEME: Colors
    // Gold: #C5A059 (Crown Gold)
    // Dark: #1a1a1a (Background)

    return (
        <>
            {/* 1. BOTTOM BANNER (Android & Initial iOS) */}
            {isVisible && (
                <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-fade-in-up md:hidden">
                    <div className="bg-[#1a1a1a] border-t-4 border-[#C5A059] text-white p-5 rounded-t-2xl shadow-2xl flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h3 className="font-serif text-xl font-bold text-[#C5A059] mb-1">
                                    Put CrownSide on your Home Screen
                                </h3>
                                <p className="text-gray-300 text-sm leading-relaxed">
                                    Fast access for Detroit beauty pros and clients — just like an app.
                                </p>
                            </div>
                            <button onClick={handleDismiss} className="text-gray-400 hover:text-white p-1">
                                <span className="text-xl">×</span>
                            </button>
                        </div>

                        <div className="flex gap-3 mt-2">
                            <button
                                onClick={handleDismiss}
                                className="flex-1 py-3 px-4 rounded-xl border border-gray-700 text-gray-400 font-medium text-sm hover:bg-gray-800 transition"
                            >
                                Not Now
                            </button>
                            <button
                                onClick={handleInstallClick}
                                className="flex-1 py-3 px-4 rounded-xl bg-[#C5A059] text-black font-bold text-sm hover:bg-[#b08d4b] transition shadow-lg flex items-center justify-center gap-2"
                            >
                                {isIOS ? 'Add to Home Screen' : 'Install App'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. iOS INSTRUCTION MODAL */}
            {isIOSModalOpen && (
                <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in">
                    <div className="bg-[#1a1a1a] w-full max-w-sm rounded-2xl border border-gray-800 shadow-2xl p-6 relative">
                        <button
                            onClick={() => setIsIOSModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <span className="text-2xl">×</span>
                        </button>

                        <div className="text-center mb-6">
                            <h3 className="font-serif text-2xl font-bold text-[#C5A059] mb-2">
                                Add to Home Screen
                            </h3>
                            <p className="text-gray-400 text-sm">
                                Follow these steps to install the app on your iPhone/iPad.
                            </p>
                        </div>

                        <div className="space-y-6">
                            {/* Step 1 */}
                            <div className="flex items-center gap-4 text-left">
                                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-[#C5A059] font-bold text-lg">
                                    1
                                </div>
                                <div className="flex-1 text-gray-200 text-sm">
                                    Tap the <span className="font-bold text-white">Share</span> icon in the bottom bar.
                                    <div className="mt-1 text-gray-500 text-xs">(Pass rectangular box with arrow)</div>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="flex items-center gap-4 text-left">
                                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-[#C5A059] font-bold text-lg">
                                    2
                                </div>
                                <div className="flex-1 text-gray-200 text-sm">
                                    Scroll down and tap <span className="font-bold text-white">Add to Home Screen</span>.
                                    <div className="mt-1 text-gray-500 text-xs">(You may need to swipe up)</div>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="flex items-center gap-4 text-left">
                                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-[#C5A059] font-bold text-lg">
                                    3
                                </div>
                                <div className="flex-1 text-gray-200 text-sm">
                                    Tap <span className="font-bold text-white">Add</span> in the top right corner.
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setIsIOSModalOpen(false);
                                localStorage.setItem('first_login_completed', 'true');
                            }}
                            className="w-full mt-8 py-3 rounded-xl bg-gray-800 text-white font-medium hover:bg-gray-700 transition"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
