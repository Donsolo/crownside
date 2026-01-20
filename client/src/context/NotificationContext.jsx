import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../lib/api';

const NotificationContext = createContext();

export function useNotifications() {
    return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [counts, setCounts] = useState({
        total: 0,
        bookings: 0, // Covers NEW_BOOKING and BOOKING_UPDATE
        messages: 0, // Covers NEW_MESSAGE
        forum: 0,    // Covers Crown Connect
        connections: 0 // Covers requests
    });
    const [loading, setLoading] = useState(false);

    // Track recently read IDs to prevent stale fetches from reverting UI
    // (Still useful for immediate race conditions)
    const recentlyReadRef = React.useRef(new Set());

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            // Fetch Counts
            const countRes = await api.get('/notifications/unread-count');
            setCounts(countRes.data.counts);

            // Fetch List (Backend now defaults to isRead: false)
            // Add cache/timestamp buster to prevent Service Worker/Browser from returning stale data
            const listRes = await api.get(`/notifications?_t=${Date.now()}`);
            const fetchedList = listRes.data.notifications;

            // Filter out locally "removed" (read) notifications to enforce "Gone"
            const filteredList = fetchedList.filter(n => {
                const isHidden = recentlyReadRef.current.has(n.id);
                return !isHidden;
            });

            setNotifications(filteredList);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    // Initial Fetch & Polling
    useEffect(() => {
        if (!user) return;

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000); // 15s poll

        return () => clearInterval(interval);
    }, [user]);

    // Mark Single Read
    const markRead = async (id) => {
        // Find synchronously from current state
        const target = notifications.find(n => n.id === id);

        // If not found, still define type if possible or just proceed to remove
        if (!target) {
            // Proceed to call backend anyway to be safe
        }

        const notifType = target?.type;

        // Track globally to prevent revert/reappearance
        recentlyReadRef.current.add(id);

        // Optimistic Update: REMOVE from UI (Filter out)
        setNotifications(prev => {
            const newList = prev.filter(n => n.id !== id);
            return newList;
        });

        // Optimistic Update: Decrement Counts
        setCounts(prev => {
            if (!notifType && !target) return prev; // Can't decrement specific if unknown

            const newCounts = { ...prev };
            if (newCounts.total > 0) newCounts.total -= 1;

            if (['NEW_BOOKING', 'BOOKING_UPDATE'].includes(notifType)) {
                if (newCounts.bookings > 0) newCounts.bookings -= 1;
            } else if (notifType === 'NEW_MESSAGE') {
                if (newCounts.messages > 0) newCounts.messages -= 1;
            } else if (['NEW_COMMENT', 'REPLY', 'MENTION', 'LIKE_POST', 'LIKE_COMMENT'].includes(notifType)) {
                if (newCounts.forum > 0) newCounts.forum -= 1;
            } else if (['CONNECTION_REQUEST', 'CONNECTION_ACCEPTED'].includes(notifType)) {
                if (newCounts.connections > 0) newCounts.connections -= 1;
            }

            return newCounts;
        });

        // Backend Call
        try {
            await api.put(`/notifications/${id}/read`);

            // Optionally refetch in background, but don't await blocking UI
            // const countRes = await api.get('/notifications/unread-count');
            // setCounts(countRes.data.counts);
        } catch (err) {
            console.error("Failed to mark read in backend", err);
        }
    };

    // Mark All Read
    const markAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setCounts({ total: 0, bookings: 0, messages: 0, forum: 0, connections: 0 });
        } catch (err) {
            console.error(err);
        }
    };

    // Messages seen (helper to refresh counts after chat open)
    const markMessagesSeen = () => {
        fetchNotifications();
    };

    // Mark All Bookings as Seen
    const markBookingsSeen = async () => {
        // Find all unread booking notifications
        const bookingNotifs = notifications.filter(n => (!n.isRead && (n.type === 'NEW_BOOKING' || n.type === 'BOOKING_UPDATE')));

        if (bookingNotifs.length === 0) return;

        try {
            // Can optimize with a bulk endpoint later, for now loop or rely on refresh
            // For UX, just assume they are cleared or call a specific "clear type" endpoint if existed
            // Here we'll just optimistically clear the booking count and assume user views them
            // Ideally we'd hit an endpoint like /notifications/mark-type-read?type=BOOKING

            // For MVP: Mark visible booking notifications as read
            await Promise.all(bookingNotifs.map(n => api.put(`/notifications/${n.id}/read`)));

            setNotifications(prev => prev.map(n =>
                (n.type === 'NEW_BOOKING' || n.type === 'BOOKING_UPDATE') ? { ...n, isRead: true } : n
            ));

            // Update counts locally
            setCounts(prev => ({ ...prev, bookings: 0, total: Math.max(0, prev.total - bookingNotifs.length) }));
        } catch (err) {
            console.error("Failed to clear booking badges", err);
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            counts,
            fetchNotifications,
            markRead,
            markAllRead,
            markBookingsSeen,
            markMessagesSeen
        }}>
            {children}
        </NotificationContext.Provider>
    );
}
