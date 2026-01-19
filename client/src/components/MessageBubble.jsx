import React from 'react';
import { format } from 'date-fns';

const MessageBubble = ({ message, isMe }) => {
    return (
        <div className={`flex w-full mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 relative shadow-sm ${isMe
                        ? 'bg-crown-gold text-white rounded-br-none'
                        : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-bl-none border border-[var(--border-subtle)]'
                    }`}
            >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                <div className={`text-[10px] mt-1 flex items-center gap-1 opacity-70 ${isMe ? 'text-white/90 justify-end' : 'text-[var(--text-secondary)] justify-start'}`}>
                    <span>{format(new Date(message.createdAt), 'h:mm a')}</span>
                    {isMe && message.readAt && (
                        <span>• Read</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
