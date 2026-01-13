import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';

export default function About() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="bg-crown-cream min-h-screen">
            {/* Hero */}
            <Hero
                pageKey="about"
                className="h-[50vh] md:h-[60vh] flex items-center justify-center text-center"
            >
                <div className="relative z-10 px-4">
                    <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4 drop-shadow-xl">About CrownSide</h1>
                    <p className="text-xl text-white/90 max-w-2xl mx-auto drop-shadow-md font-medium">Elevating the beauty experience for Detroit's finest professionals and clients.</p>
                </div>
            </Hero>

            <div className="container mx-auto px-4 -mt-20 relative z-20">
                <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-crown-soft max-w-5xl mx-auto">
                    <div className="prose prose-lg text-gray-700 mx-auto">
                        <p className="lead text-xl mb-8 font-medium">
                            CrownSide is more than a booking platform; it's a community dedicated to excellence in hair and nail care.
                        </p>

                        <h2 className="text-3xl font-serif text-crown-dark mt-12 mb-6">Our Mission</h2>
                        <p>
                            We built CrownSide to bridge the gap between talented beauty professionals and clients seeking premium services.
                            In a city as vibrant as Detroit, finding the right stylist or nail tech shouldn't be a hassle—it should be a seamless,
                            inspiring experience.
                        </p>

                        <h2 className="text-3xl font-serif text-crown-dark mt-12 mb-6">For Professionals</h2>
                        <p>
                            We empower independent beauty entrepreneurs by providing them with the tools they need to manage their business,
                            showcase their portfolio, and connect with new clients. From schedule management to secure deposits, we handle
                            the logistics so you can focus on your craft.
                        </p>

                        <h2 className="text-3xl font-serif text-crown-dark mt-12 mb-6">For Clients</h2>
                        <p>
                            CrownSide offers a curated marketplace of vetted professionals. Whether you need a silk press, extensive braids,
                            or intricate nail art, you can browse portfolios, read verified reviews, and book with confidence.
                        </p>

                        <div className="mt-16 text-center border-t border-crown-soft pt-12">
                            <h3 className="text-2xl font-serif mb-6">Ready to join us?</h3>
                            <div className="flex gap-4 justify-center">
                                <Link to="/explore" className="btn-primary">Find a Pro</Link>
                                <Link to="/register?role=stylist" className="btn-secondary text-crown-dark border-crown-dark hover:bg-crown-dark hover:text-white">Join as a Pro</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
