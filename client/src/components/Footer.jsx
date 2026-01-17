import React from 'react';
import { Link } from 'react-router-dom';
import tektriqIcon from '../assets/tektriq-icon.png';

export default function Footer() {
    return (
        <footer className="bg-[var(--footer-bg)] text-[var(--footer-text)] py-12 md:pb-8 pb-24 transition-colors duration-300">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-4 gap-8 mb-8">
                    <div>
                        <h4 className="font-serif text-xl font-bold mb-4">CrownSide</h4>
                        <p className="text-gray-400 text-sm">
                            Detroit's premier beauty booking platform connecting you with top-tier hair & nail professionals.
                        </p>
                    </div>

                    <div>
                        <h5 className="font-bold mb-4 text-crown-gold">Company</h5>
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li><Link to="/about" className="hover:text-white">About Us</Link></li>
                            <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
                            <li><Link to="/explore" className="hover:text-white">Find a Pro</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h5 className="font-bold mb-4 text-crown-gold">Support</h5>
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
                            <li><Link to="/register?role=stylist" className="hover:text-white">For Professionals</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h5 className="font-bold mb-4 text-crown-gold">Legal</h5>
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
                    <p>&copy; {new Date().getFullYear()} CrownSide. All rights reserved.</p>
                    <a href="https://tektriq.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-opacity opacity-70 hover:opacity-100">
                        <span className="text-xs">Powered by</span>
                        <div className="flex items-center gap-1">
                            <img src={tektriqIcon} alt="Tektriq" className="w-4 h-4 object-contain" />
                            <span className="font-bold tracking-wide">Tektriq</span>
                        </div>
                    </a>
                </div>
            </div>
        </footer>
    );
}
