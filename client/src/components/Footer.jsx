import React from 'react';
import { Link } from 'react-router-dom';
import tektriqIcon from '../assets/tektriq-icon.png';

export default function Footer() {
    return (
        <footer className="bg-stone-950 text-stone-400 py-12 border-t border-stone-900 font-sans">
            <div className="container mx-auto px-4">
                <div className="flex flex-col items-center gap-6 text-center">
                    {/* Copyright & Powered By */}
                    <div className="flex flex-col gap-2 text-sm items-center">
                        <p>&copy; {new Date().getFullYear()} Tektriq LLC. All rights reserved.</p>
                        <div className="flex items-center gap-2 text-stone-500 text-xs uppercase tracking-wider font-bold">
                            <span>Powered by</span>
                            <a href="https://tektriq.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-stone-300 transition-colors">
                                <img src={tektriqIcon} alt="Tektriq" className="w-4 h-4 object-contain" />
                                <span>Tektriq LLC</span>
                            </a>
                        </div>
                    </div>

                    {/* Links */}
                    <nav className="flex flex-wrap justify-center gap-6 text-sm font-medium">
                        <Link to="/about" className="hover:text-white transition-colors">About</Link>
                        <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                        <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
                    </nav>

                    {/* Support Email */}
                    <a href="mailto:support@tektriq.com" className="text-crown-gold hover:text-yellow-400 text-sm font-bold transition-colors">
                        support@tektriq.com
                    </a>
                </div>
            </div>
        </footer>
    );
}
