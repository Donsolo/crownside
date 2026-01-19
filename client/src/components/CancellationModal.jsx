import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function CancellationModal({ isOpen, onClose, onConfirm, title = "Cancel Appointment" }) {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason.trim()) return;

        setIsSubmitting(true);
        try {
            await onConfirm(reason);
            // Parent handles closing
        } catch (err) {
            console.error(err);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in">

                {/* Header */}
                <div className="bg-red-50 p-6 flex items-start gap-4 border-b border-red-100">
                    <div className="p-3 bg-red-100 rounded-full text-red-600 shrink-0">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-red-900">{title}</h3>
                        <p className="text-red-700 text-sm mt-1">
                            This action cannot be undone.
                        </p>
                    </div>
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <form onSubmit={handleSubmit}>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Reason for Cancellation
                        </label>
                        <textarea
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition min-h-[100px]"
                            placeholder="Please provide a reason..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                        ></textarea>

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                            >
                                Keep Appointment
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !reason.trim()}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Cancelling...' : 'Confirm Cancel'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
