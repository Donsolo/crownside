import React, { useEffect } from 'react';

export default function PrivacyPolicy() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-4xl font-serif font-bold mb-8 text-crown-dark">Privacy Policy</h1>
            <p className="text-gray-600 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

            <div className="prose prose-lg text-gray-700">
                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 text-crown-dark">1. Information We Collect</h2>
                    <p className="mb-4">
                        At CrownSide, we collect information to provide better beauty booking services. This includes:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li><strong>Account Information:</strong> Name, email address, password, and phone number when you register.</li>
                        <li><strong>Profile Information:</strong> For professionals, we collect business names, bios, service menus, and portfolio images.</li>
                        <li><strong>Usage Data:</strong> Information about how you use our platform, including booking history and search queries.</li>
                        <li><strong>Communications:</strong> Data from reviews and any support inquiries.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 text-crown-dark">2. How We Use Your Data</h2>
                    <p className="mb-4">We use your information to:</p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>Facilitate bookings between clients and beauty professionals.</li>
                        <li>Maintain and improve our platform's security and performance.</li>
                        <li>Communicate with you regarding appointments, updates, and support.</li>
                        <li>Marketing purposes (which you can opt-out of at any time).</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 text-crown-dark">3. Data Sharing & Third Parties</h2>
                    <p className="mb-4">
                        <strong>We do not sell your personal data.</strong> We may share data with trusted third-party service providers who assist us in operating our platform, such as:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li><strong>Stripe:</strong> For secure payment processing.</li>
                        <li><strong>Cloud Services:</strong> For hosting our application and storing images (e.g., AWS, Cloudflare).</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 text-crown-dark">4. Your Rights</h2>
                    <p className="mb-4">You have the right to:</p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>Access the personal information we hold about you.</li>
                        <li>Request the correction or deletion of your data.</li>
                        <li>Opt-out of marketing communications.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 text-crown-dark">5. Contact Us</h2>
                    <p>
                        If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@crownside.com" className="text-crown-gold hover:underline">privacy@crownside.com</a>.
                    </p>
                </section>
            </div>
        </div>
    );
}
