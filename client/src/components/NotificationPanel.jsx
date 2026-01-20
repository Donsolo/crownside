import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
    CalendarIcon,
    ChatBubbleLeftRightIcon,
    UserGroupIcon,
    InformationCircleIcon
} from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';

// Add useAuth import
import { useAuth } from '../context/AuthContext';

export default function NotificationPanel({ open, setOpen }) {
    const { notifications, markRead, markAllRead } = useNotifications();
    const { user } = useAuth(); // Get user for role-based routing
    const navigate = useNavigate();
    const { theme } = useTheme();

    // Determine Icon and Color based on Type
    const getIcon = (type) => {
        switch (type) {
            case 'NEW_BOOKING':
            case 'BOOKING_UPDATE':
                return <CalendarIcon className="h-6 w-6 text-crown-gold" />;
            case 'NEW_MESSAGE':
                return <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-500" />;
            case 'NEW_COMMENT':
            case 'REPLY':
            case 'MENTION':
            case 'LIKE_POST':
            case 'LIKE_COMMENT':
                return <UserGroupIcon className="h-6 w-6 text-green-500" />;
            default:
                return <InformationCircleIcon className="h-6 w-6 text-gray-400" />;
        }
    };

    const getMessage = (notification) => {
        const { type, sender, booking, post, comment } = notification;
        const name = sender?.displayName || 'Someone';

        switch (type) {
            case 'NEW_BOOKING':
                return `New booking request from ${name}`;
            case 'BOOKING_UPDATE':
                return `Booking Status Update: ${booking?.status}`;
            case 'NEW_MESSAGE':
                return `New message from ${name}`;
            case 'NEW_COMMENT':
                return `${name} commented on your post`;
            case 'REPLY':
                return `${name} replied to your comment`;
            case 'MENTION':
                return `${name} mentioned you`;
            case 'LIKE_POST':
                return `${name} liked your post`;
            case 'CONNECTION_REQUEST':
                return `${name} wants to connect with you`;
            case 'CONNECTION_ACCEPTED':
                return `${name} accepted your request`;
            default:
                return 'New notification';
        }
    };

    const handleClick = async (notification) => {
        // 1. Mark as Read in Backend (Await to ensure sync before Nav)
        await markRead(notification.id);

        // 2. Clear UI
        setOpen(false);

        // 3. Navigate
        const { type, conversationId, postId, bookingId } = notification;

        switch (type) {
            case 'NEW_MESSAGE':
                if (conversationId) {
                    navigate(`/messages/${conversationId}`);
                }
                break;

            case 'CONNECTION_REQUEST':
            case 'CONNECTION_ACCEPTED':
                navigate('/connections');
                break;

            case 'NEW_BOOKING':
            case 'BOOKING_UPDATE':
                // Route based on Role
                if (user?.role === 'STYLIST') {
                    navigate('/dashboard'); // Ideally /dashboard/bookings?id=...
                } else {
                    navigate('/my-bookings');
                }
                break;

            case 'NEW_COMMENT':
            case 'REPLY':
            case 'MENTION':
            case 'LIKE_POST':
            case 'LIKE_COMMENT':
                if (postId) {
                    navigate(`/forum/${postId}`);
                }
                break;

            default:
                // Fallback
                console.warn("Unknown notification type for navigation:", type);
                break;
        }
    };

    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={setOpen}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-500"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-500"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-500 sm:duration-700"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-500 sm:duration-700"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className={`pointer-events-auto w-screen max-w-md ${theme === 'dark' ? 'bg-gray-900 border-l border-gray-800' : 'bg-white'}`}>
                                    <div className="flex h-full flex-col overflow-y-scroll shadow-xl">
                                        <div className="px-4 py-6 sm:px-6">
                                            <div className="flex items-start justify-between">
                                                <Dialog.Title className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                    Notifications
                                                </Dialog.Title>
                                                <div className="ml-3 flex h-7 items-center">
                                                    <button
                                                        type="button"
                                                        className="relative rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                                                        onClick={() => setOpen(false)}
                                                    >
                                                        <span className="absolute -inset-2.5" />
                                                        <span className="sr-only">Close panel</span>
                                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="relative flex-1 px-4 sm:px-6">
                                            {notifications.length === 0 ? (
                                                <div className="text-center py-10 text-gray-500">
                                                    You're all caught up ✨
                                                </div>
                                            ) : (
                                                <ul className="divide-y divide-gray-100">
                                                    {notifications.map((notification) => (
                                                        <li
                                                            key={notification.id}
                                                            className={`py-4 cursor-pointer hover:bg-opacity-50 ${!notification.isRead ? (theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50') : ''}`}
                                                            onClick={() => handleClick(notification)}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="flex-shrink-0">
                                                                    {getIcon(notification.type)}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                                        {getMessage(notification)}
                                                                    </p>
                                                                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} truncate`}>
                                                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                                    </p>
                                                                </div>
                                                                {!notification.isRead && (
                                                                    <div className="h-2 w-2 rounded-full bg-crown-gold flex-shrink-0" />
                                                                )}
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}

                                            {notifications.length > 0 && (
                                                <div className="mt-6 text-center">
                                                    <button
                                                        onClick={markAllRead}
                                                        className="text-sm text-crown-gold hover:text-crown-gold-light"
                                                    >
                                                        Mark all as read
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
