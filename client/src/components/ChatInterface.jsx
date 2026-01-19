import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Loader2, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import MessageBubble from './MessageBubble';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function ChatInterface({ bookingId, onClose, participants }) {
    const { user, loading: authLoading } = useAuth(); // Get auth loading state
    const { markMessagesSeen } = useNotifications();
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);
    const pollingRef = useRef(null);
    const initRef = useRef(false); // Ref to track initialization

    // Initial Load
    useEffect(() => {
        let isMounted = true;

        const initChat = async () => {
            // Prevent premature or duplicate calls
            if (!bookingId || !user || authLoading) return;
            // Prevent double-init in Strict Mode if already successful/loading? 
            // Actually, we just want to ensure we don't spam.
            if (initRef.current) return;
            initRef.current = true;

            try {
                if (isMounted) setLoading(true);

                // Get or Create Conversation
                const res = await api.post('/messages', { bookingId });

                if (isMounted) {
                    setConversation(res.data);
                    // Fetch Messages
                    await fetchMessages(res.data.id);

                    // Start Polling (every 5s)
                    pollingRef.current = setInterval(() => {
                        fetchMessages(res.data.id, true);
                    }, 5000);
                }

            } catch (err) {
                console.error("Chat Error:", err);
                if (err.response?.status === 403) {
                    setError("You are not authorized to view this chat.");
                } else {
                    setError("Failed to load conversation. Please try again.");
                }
                initRef.current = false; // Reset on error to allow retry
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        initChat();

        return () => {
            isMounted = false;
            // Clear interval is handled by separate effect or here
            if (pollingRef.current) clearInterval(pollingRef.current);
            initRef.current = false; // Reset on unmount
        };
    }, [bookingId, user, authLoading]); // Re-run when auth is ready

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        if (!loading) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, loading]);

    const fetchMessages = async (conversationId, isPolling = false) => {
        try {
            const res = await api.get(`/messages/${conversationId}`);

            setMessages(prev => {
                // If polling, only update if new messages exist
                if (isPolling && res.data.messages.length === prev.length) return prev;
                return res.data.messages;
            });

            // Mark as read if I am viewing
            // Only mark if unread messages exist to save API calls
            if (res.data.messages.some(m => !m.readAt && m.senderId !== user.id)) {
                await api.put(`/messages/${conversationId}/read`);
                markMessagesSeen(); // Global indicator clear
            }

        } catch (err) {
            console.error("Fetch Messages Error:", err);
            // Don't show error on poll, just log
            if (!isPolling) setError("Could not update messages");
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !conversation) return;

        setSending(true);
        try {
            const res = await api.post(`/messages/${conversation.id}/messages`, {
                content: newMessage
            });

            // Optimistic update or refresh
            setMessages(prev => [...prev, res.data]);
            setNewMessage('');

        } catch (err) {
            console.error("Send Error:", err);
            setError("Failed to send message.");
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-[var(--card-bg)] p-8 rounded-2xl shadow-xl flex flex-col items-center">
                    <Loader2 className="animate-spin text-crown-gold mb-3" size={32} />
                    <p className="text-[var(--text-secondary)] font-medium">Loading Chat...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[40] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 md:p-4">
            <div className="bg-[var(--bg-primary)] w-full max-w-lg h-[90vh] md:h-[80vh] rounded-2xl shadow-2xl flex flex-col relative overflow-hidden animate-enter">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)] bg-[var(--card-bg)] z-10">
                    <div>
                        <h3 className="font-serif font-bold text-lg text-[var(--text-primary)]">
                            {participants?.otherName || 'Chat'}
                        </h3>
                        {participants?.bookingDate && (
                            <p className="text-xs text-[var(--text-secondary)]">
                                Ref: {format(new Date(participants.bookingDate), 'MMM d, h:mm a')}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[var(--bg-secondary)] rounded-full text-[var(--text-secondary)] transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-[var(--bg-tertiary)] space-y-4">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
                            <div className="w-16 h-16 bg-crown-gold/10 rounded-full flex items-center justify-center mb-4 text-crown-gold">
                                <Send size={24} />
                            </div>
                            <h4 className="font-bold text-[var(--text-primary)] mb-1">Start the conversation</h4>
                            <p className="text-sm text-[var(--text-secondary)]">
                                Ask questions or coordinate details about your appointment.
                            </p>
                        </div>
                    ) : (
                        messages.map(msg => (
                            <MessageBubble
                                key={msg.id}
                                message={msg}
                                isMe={msg.senderId === user.id}
                            />
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-50 text-red-600 px-4 py-2 text-xs text-center border-t border-red-100 flex items-center justify-center gap-2">
                        <AlertCircle size={12} /> {error}
                    </div>
                )}

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-4 bg-[var(--card-bg)] border-t border-[var(--border-subtle)]">
                    <div className="flex items-end gap-2">
                        <textarea
                            value={newMessage}
                            onChange={(e) => {
                                setNewMessage(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend(e);
                                }
                            }}
                            placeholder="Type a message..."
                            rows={1}
                            className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-primary)] rounded-3xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-crown-gold/30 disabled:opacity-50 resize-none overflow-hidden"
                            disabled={sending}
                            style={{ minHeight: '44px', maxHeight: '120px' }}
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || sending}
                            className="bg-crown-gold text-white p-3 rounded-full hover:bg-crown-gold/90 transition shadow-md disabled:opacity-50 disabled:shadow-none mb-[1px]"
                        >
                            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}

// Helper for formatting if date-fns isn't globally available here (it should be though)
import { format } from 'date-fns';
