import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import badgeFounder from '../assets/badges/founder_badge.png';
import { FaCrown } from 'react-icons/fa';

export default function FounderWelcomeModal({ isOpen, onClose }) {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => { }}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-2xl transition-all border border-crown-gold/30">
                                {/* Header / Icon */}
                                <div className="flex flex-col items-center mb-6">
                                    <div className="mb-4 animate-bounce-slow">
                                        <img src={badgeFounder} alt="Founder Badge" className="w-24 h-24 object-contain drop-shadow-md" />
                                    </div>
                                    <Dialog.Title
                                        as="h3"
                                        className="text-2xl font-serif font-bold leading-8 text-crown-dark text-center"
                                    >
                                        Welcome to the<br />CrownSide Founders Circle
                                    </Dialog.Title>
                                </div>

                                <div className="mt-2 text-center">
                                    <p className="text-gray-600 mb-6 leading-relaxed">
                                        You’re officially a Founder — one of the first 100 members or an invited early supporter of CrownSide.
                                        Founders receive permanent recognition, early feature visibility, and a voice in shaping the platform.
                                    </p>

                                    <div className="bg-gray-50 rounded-xl p-4 text-left mb-6 border border-gray-100">
                                        <ul className="space-y-3 text-sm text-gray-700">
                                            <li className="flex gap-2 items-start">
                                                <FaCrown className="text-crown-gold mt-1 shrink-0" size={12} />
                                                <span><strong>Founder Badge</strong> displayed across CrownSide</span>
                                            </li>
                                            <li className="flex gap-2 items-start">
                                                <FaCrown className="text-crown-gold mt-1 shrink-0" size={12} />
                                                <span>Priority visibility in Crown Connect</span>
                                            </li>
                                            <li className="flex gap-2 items-start">
                                                <FaCrown className="text-crown-gold mt-1 shrink-0" size={12} />
                                                <span>Early access to upcoming features</span>
                                            </li>
                                            <li className="flex gap-2 items-start">
                                                <FaCrown className="text-crown-gold mt-1 shrink-0" size={12} />
                                                <span>Opportunity to provide feedback</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <button
                                        type="button"
                                        className="w-full inline-flex justify-center rounded-full border border-transparent bg-crown-dark px-4 py-3 text-sm font-bold text-white hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-crown-dark transition transform hover:scale-[1.02] shadow-lg"
                                        onClick={onClose}
                                    >
                                        Got it
                                    </button>
                                    <p className="mt-4 text-center text-xs text-gray-400">
                                        Founder status is permanent and tied to your account.
                                    </p>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
