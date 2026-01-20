import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import ChatInterface from '../components/ChatInterface';

export default function MessageThread() {
    const { conversationId } = useParams();
    const navigate = useNavigate();
    const [conversation, setConversation] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConvo = async () => {
            try {
                const res = await api.get(`/messages/${conversationId}?page=1`);
                setConversation(res.data.conversation);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchConvo();
    }, [conversationId]);

    if (loading) return <div className="h-screen flex items-center justify-center">Loading Chat...</div>;
    if (!conversation) return <div className="p-8 text-center">Conversation not found.</div>;

    // Determine Title
    // We need current user ID to know who 'Other' is. 
    // Ideally ChatInterface handles this if we pass the convo object

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="bg-white shadow-sm p-4 sticky top-0 z-10 flex items-center">
                <button onClick={() => navigate(-1)} className="mr-4 text-gray-600">Back</button>
                <h1 className="font-bold text-gray-900">
                    Chat
                </h1>
            </div>
            <div className="flex-grow p-4 md:p-8 max-w-4xl mx-auto w-full">
                <div className="bg-white rounded-xl shadow-lg h-[80vh] overflow-hidden border border-gray-200">
                    <ChatInterface
                        bookingId={null} // Generic
                        conversationId={conversationId}
                        userName="Chat" // Fallback, let component handle logic?
                        onClose={() => navigate(-1)}
                    />
                </div>
            </div>
        </div>
    );
}
