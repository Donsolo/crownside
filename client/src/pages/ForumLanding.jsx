import React from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import { FaUserTie, FaSearch, FaComments, FaArrowRight, FaBullhorn, FaQuestionCircle } from 'react-icons/fa';

export default function ForumLanding() {
    return (
        <div className="min-h-screen bg-neutral-50 pb-20">
            {/* HERO */}
            <Hero
                pageKey="forum"
                className="h-[35vh] min-h-[300px] flex items-center justify-center relative"
                overlayOpacity={0.7}
                fallbackImage="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
            >
                <div className="text-center text-white z-10 px-4 max-w-3xl animate-fade-in-up">
                    <h1 className="font-serif text-4xl md:text-6xl font-bold mb-4 drop-shadow-xl leading-tight text-white">
                        Crown Connect
                    </h1>
                    <p className="text-white/90 text-lg md:text-xl font-medium max-w-2xl mx-auto drop-shadow-md">
                        Connect with Detroit's best beauty professionals and clients.
                    </p>
                </div>
            </Hero>

            {/* BOARD SELECTION */}
            <div className="container mx-auto px-4 -mt-16 relative z-20">
                <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">

                    {/* FIND A PRO */}
                    <Link to="/forum/feed?board=FIND_PRO" className="group">
                        <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 h-full flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-crown-gold/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-crown-gold group-hover:text-white transition-colors duration-300">
                                <FaSearch size={32} className="text-crown-gold group-hover:text-white transition-colors" />
                            </div>
                            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-3">Find a Beauty Pro</h2>
                            <p className="text-gray-500 mb-6 flex-grow">
                                Clients: Post your specific requests (budget, style, date) and let customized offers come to you.
                            </p>
                            <span className="text-crown-gold font-bold flex items-center gap-2 group-hover:gap-3 transition-all">
                                Browse Board <FaArrowRight />
                            </span>
                        </div>
                    </Link>

                    {/* FIND CLIENTS */}
                    <Link to="/forum/feed?board=FIND_CLIENT" className="group">
                        <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 h-full flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-gray-800 group-hover:text-white transition-colors duration-300">
                                <FaUserTie size={32} className="text-gray-600 group-hover:text-white transition-colors" />
                            </div>
                            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-3">Find Clients / Availability</h2>
                            <p className="text-gray-500 mb-6 flex-grow">
                                Stylists: Post your last-minute openings, travel schedules, and "books open" announcements.
                            </p>
                            <span className="text-gray-800 font-bold flex items-center gap-2 group-hover:gap-3 transition-all">
                                Browse Board <FaArrowRight />
                            </span>
                        </div>
                    </Link>

                </div>

                {/* COMMUNITY SECTION */}
                <div className="max-w-6xl mx-auto mt-12 mb-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-px bg-gray-200 flex-grow"></div>
                        <h3 className="font-serif font-bold text-gray-400 uppercase tracking-widest text-sm text-center">Community & Updates</h3>
                        <div className="h-px bg-gray-200 flex-grow"></div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* SALON TALK */}
                        <Link to="/forum/feed?board=SALON_TALK" className="group">
                            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 h-full flex flex-col items-center text-center">
                                <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center mb-4 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    <FaComments className="text-xl" />
                                </div>
                                <h4 className="font-bold text-gray-900 mb-2">Salon Talk</h4>
                                <p className="text-gray-500 text-sm">Industry advice, tips, and professional discussion.</p>
                            </div>
                        </Link>

                        {/* ANNOUNCEMENTS */}
                        <Link to="/forum/feed?board=ANNOUNCEMENTS" className="group">
                            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 h-full flex flex-col items-center text-center">
                                <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <FaBullhorn className="text-xl" />
                                </div>
                                <h4 className="font-bold text-gray-900 mb-2">Announcements</h4>
                                <p className="text-gray-500 text-sm">Platform updates and Detroit beauty events.</p>
                            </div>
                        </Link>

                        {/* HELP & FEEDBACK */}
                        <Link to="/forum/feed?board=HELP_FEEDBACK" className="group">
                            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 h-full flex flex-col items-center text-center">
                                <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mb-4 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                    <FaQuestionCircle className="text-xl" />
                                </div>
                                <h4 className="font-bold text-gray-900 mb-2">Help & Feedback</h4>
                                <p className="text-gray-500 text-sm">Report bugs or request new features.</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* INFO SECTION */}
                <div className="max-w-3xl mx-auto mt-16 text-center">
                    <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 inline-block w-full">
                        <FaComments className="text-4xl text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Community Guidelines</h3>
                        <p className="text-gray-500 mb-0">
                            Crown Connect is a public space. Please be respectful. Posting requires an account.
                            Posts are monitored for safety.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
