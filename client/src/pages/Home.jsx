import React from 'react';
import { Link } from 'react-router-dom';
import badge from '../assets/badge.png';
import Hero from '../components/Hero';
import { useAuth } from '../context/AuthContext';

export default function Home() {
    const { user } = useAuth();
    return (
        <div className="bg-crown-cream min-h-[80vh]">
            {/* Hero Section */}
            <Hero
                pageKey="home"
                className="h-[90vh] md:h-[80vh] flex items-center justify-center text-center"
            >
                {/* Content */}
                <div className="relative z-10 container mx-auto px-4 mt-16 md:mt-0">
                    <img
                        src={badge}
                        alt="CrownSide brand badge"
                        className="mx-auto mb-12 max-h-[240px] md:max-h-[320px] w-auto pointer-events-none drop-shadow-2xl"
                    />
                    <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 leading-tight drop-shadow-md">
                        Beauty, Booked <br /> <span className="text-crown-gold">Beautifully.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 drop-shadow-sm font-medium">
                        Detroit’s premier beauty booking platform connecting you with top-tier hair, nail, & lash/brow professionals.
                        Discover talent, book appointments, and elevate your crown.
                    </p>
                    <div className="flex flex-col md:flex-row justify-center gap-4">
                        <Link to="/explore" className="btn-primary text-center shadow-lg border-none">
                            Find a Beauty Pro
                        </Link>
                        <Link to="/register" className="px-6 py-3 rounded-full font-medium text-center bg-crown-dark/80 backdrop-blur-sm border border-white text-white hover:bg-crown-dark hover:text-crown-gold transition-all shadow-lg active:scale-95">
                            Register as Client/Beauty Pro
                        </Link>
                    </div>
                </div>
            </Hero>

            {/* Value Props */}
            <section className="bg-white py-16">
                <div className="container mx-auto px-4 grid md:grid-cols-3 gap-8">
                    <div className="text-center p-6 bg-crown-cream rounded-2xl">
                        <h3 className="text-xl font-bold mb-3">Hair, Nail & Lash Pros</h3>
                        <p className="text-crown-gray">Vetted professionals dedicated to beauty services including silk presses, braids, manicures, pedicures & lash extensions.</p>
                    </div>
                    <div className="text-center p-6 bg-crown-cream rounded-2xl">
                        <h3 className="text-xl font-bold mb-3">Seamless Booking</h3>
                        <p className="text-crown-gray">Book your appointment, pay deposits securely, and get reminders instantly.</p>
                    </div>
                    <div className="text-center p-6 bg-crown-cream rounded-2xl">
                        <h3 className="text-xl font-bold mb-3">Detroit Roots</h3>
                        <p className="text-crown-gray">Built for our community, supporting local beauty entrepreneurs.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
