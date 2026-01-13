import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';

export default function Contact() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // In a real app, this would send to an API
        setSubmitted(true);
    };

    return (
        <div className="min-h-screen bg-crown-cream">
            <Hero
                pageKey="contact"
                className="h-[50vh] md:h-[60vh] flex items-center justify-center text-center"
            >
                <div className="relative z-10 px-4">
                    <h1 className="text-4xl md:text-6xl font-serif font-bold text-white drop-shadow-xl">Contact Us</h1>
                    <p className="text-lg text-white/90 mt-4 drop-shadow-md">We're here to help with any questions.</p>
                </div>
            </Hero>

            <div className="container mx-auto px-4 -mt-20 relative z-20">
                <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-crown-soft max-w-5xl mx-auto">

                    <div className="grid md:grid-cols-2 gap-12">
                        <div>
                            <h2 className="text-2xl font-bold mb-4 text-crown-dark">Get in Touch</h2>
                            <p className="text-gray-600 mb-6">
                                Have a question about booking, your account, or joining as a professional?
                                We're here to help.
                            </p>

                            <div className="mb-6">
                                <h3 className="font-bold text-lg mb-2">Support Email</h3>
                                <p className="text-crown-gold text-xl">support@crownside.com</p>
                            </div>

                            <div className="bg-crown-cream p-6 rounded-xl">
                                <p className="font-medium text-crown-dark">
                                    We typically respond within 24–48 hours.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-xl shadow-lg border border-crown-soft">
                            {submitted ? (
                                <div className="text-center py-12">
                                    <h3 className="text-2xl font-serif text-crown-dark mb-4">Message Sent!</h3>
                                    <p className="text-gray-600">Thank you for reaching out. We'll be in touch shortly.</p>
                                    <button onClick={() => setSubmitted(false)} className="mt-6 text-crown-gold hover:underline">Send another message</button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold mb-2">Name</label>
                                        <input type="text" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-crown-gold outline-none" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-2">Email</label>
                                        <input type="email" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-crown-gold outline-none" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-2">Message</label>
                                        <textarea className="w-full p-3 border rounded-lg h-32 focus:ring-2 focus:ring-crown-gold outline-none" required></textarea>
                                    </div>
                                    <button className="btn-primary w-full py-3">Send Message</button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
