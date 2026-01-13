import React, { useEffect } from 'react';
import Hero from '../components/Hero';

export default function FAQ() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const faqs = [
        {
            q: "How does booking work?",
            a: "Simply browse our network of professionals, select a service, choose a date and time, and submit your request. Some professionals require a deposit to secure the slot."
        },
        {
            q: "How are payments handled?",
            a: "CrownSide uses Stripe for secure payment processing. Deposits are paid through the app, while the remaining balance is typically paid directly to the professional at the time of service."
        },
        {
            q: "Can I cancel or reschedule?",
            a: "Yes, you can manage your bookings from your dashboard. However, each professional sets their own cancellation policy regarding deposit refunds."
        },
        {
            q: "Are professionals vetted?",
            a: "We verify the identity and basic credentials of professionals on our platform to ensure a safe and high-quality community."
        },
        {
            q: "Does CrownSide provide services directly?",
            a: "No, CrownSide is a marketplace connecting independent professionals with clients. The services are performed by the independent professionals."
        },
        {
            q: "How do I join as a professional?",
            a: "Click 'Join CrownSide' or 'I'm a Beauty Pro' on the homepage to create your professional profile. It takes just a few minutes to set up your services and portfolio."
        }
    ];

    return (
        <div className="min-h-screen bg-crown-cream">
            <Hero
                pageKey="faq"
                className="h-[50vh] md:h-[60vh] flex items-center justify-center text-center"
            >
                <div className="relative z-10 px-4">
                    <h1 className="text-4xl md:text-6xl font-serif font-bold text-white drop-shadow-xl">Frequently Asked Questions</h1>
                    <p className="text-lg text-white/90 mt-4 drop-shadow-md">Find answers to common questions about CrownSide.</p>
                </div>
            </Hero>

            <div className="container mx-auto px-4 -mt-20 relative z-20">
                <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-crown-soft max-w-4xl mx-auto">

                    <div className="space-y-6">
                        {faqs.map((faq, index) => (
                            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                                <h3 className="text-xl font-bold text-crown-dark mb-3">{faq.q}</h3>
                                <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 text-center bg-crown-cream p-8 rounded-2xl">
                        <p className="font-bold mb-2">Still have questions?</p>
                        <a href="/contact" className="text-crown-gold font-bold hover:underline">Contact our Support Team</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
