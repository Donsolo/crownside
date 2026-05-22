import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function DataDeletion() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="container mx-auto px-4 py-12 max-w-3xl min-h-[60vh]">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
                <h1 className="text-3xl md:text-4xl font-serif font-bold mb-6 text-crown-dark">
                    Account & Data Deletion
                </h1>
                
                <div className="prose prose-lg text-gray-700">
                    <p className="text-lg mb-6">
                        We respect your privacy and your right to control your personal data. If you would like to request the permanent deletion of your CrownSide account and all associated personal data, please follow the instructions below.
                    </p>

                    <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-r-lg mb-8">
                        <h3 className="text-xl font-bold text-orange-800 mb-2 mt-0">Important Notice</h3>
                        <p className="text-orange-700 mb-0">
                            Account deletion is irreversible. Once your data is deleted, you will lose access to your booking history, messages, reviews, and portfolio (if applicable).
                        </p>
                    </div>

                    <h2 className="text-2xl font-bold mb-4 text-crown-dark">How to Request Deletion</h2>
                    <p className="mb-6">
                        To initiate a data deletion request, please send an email to our support team from the email address associated with your CrownSide account.
                    </p>

                    <div className="text-center my-10">
                        <a 
                            href="mailto:crownside@tektriq.com?subject=Data%20Deletion%20Request" 
                            className="inline-block bg-crown-dark text-white font-bold py-4 px-8 rounded-full hover:bg-black transition-colors shadow-md"
                        >
                            Email crownside@tektriq.com
                        </a>
                    </div>

                    <p className="text-sm text-gray-500">
                        Please include "Data Deletion Request" in the subject line. We will process your request within 30 days in accordance with applicable privacy laws.
                    </p>
                </div>

                <div className="mt-12 pt-6 border-t border-gray-100">
                    <Link to="/privacy" className="text-crown-gold hover:underline font-medium">
                        &larr; Back to Privacy Policy
                    </Link>
                </div>
            </div>
        </div>
    );
}
