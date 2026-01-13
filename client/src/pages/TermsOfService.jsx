import React, { useEffect } from 'react';

export default function TermsOfService() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-4xl font-serif font-bold mb-8 text-crown-dark">Terms of Service</h1>
            <p className="text-gray-600 mb-8">Effective Date: {new Date().toLocaleDateString()}</p>

            <div className="prose prose-lg text-gray-700">
                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 text-crown-dark">1. Introduction</h2>
                    <p className="mb-4">
                        Welcome to CrownSide. By accessing or using our platform, you agree to be bound by these Terms of Service.
                        CrownSide acts as a marketplace connecting clients with independent beauty professionals. We do not provide beauty services directly.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 text-crown-dark">2. User Responsibilities</h2>
                    <p className="mb-4">Users of CrownSide agree to:</p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>Provide accurate and up-to-date information during registration.</li>
                        <li>Respect the time and professional boundaries of our Beauty Pros.</li>
                        <li>Use the platform for lawful purposes only.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 text-crown-dark">3. Professional Responsibilities</h2>
                    <p className="mb-4">Beauty Professionals using CrownSide agree to:</p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li> maintain valid licenses and insurance as required by local law.</li>
                        <li>Honor bookings accepted through the platform.</li>
                        <li>Provide accurate descriptions of services and pricing.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 text-crown-dark">4. Bookings & Cancellations</h2>
                    <p className="mb-4">
                        Booking agreements are directly between the Client and the Professional. Professionals may set their own cancellation policies.
                        CrownSide is not responsible for disputes arising from cancellations or no-shows, though we facilitate communication to resolve such issues.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 text-crown-dark">5. Limitation of Liability</h2>
                    <p className="mb-4">
                        CrownSide is provided "as is" without warranties of any kind. We are not liable for the quality of services provided by Professionals
                        or for any damages arising from your use of the platform.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 text-crown-dark">6. Governing Law</h2>
                    <p className="mb-4">
                        These Terms were governed by the laws of the United States and the State of Michigan.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 text-crown-dark">7. Contact</h2>
                    <p>
                        Questions regarding these Terms should be sent to <a href="mailto:legal@crownside.com" className="text-crown-gold hover:underline">legal@crownside.com</a>.
                    </p>
                </section>
            </div>
        </div>
    );
}
