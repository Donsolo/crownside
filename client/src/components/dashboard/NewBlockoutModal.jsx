import React, { useState } from 'react';
import api from '../../lib/api';
import { FaTimes, FaBan, FaArrowRight } from 'react-icons/fa';

export default function NewBlockoutModal({ isOpen, onClose, onSuccess, initialDate }) {
    if (!isOpen) return null;

    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        date: initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        startTime: '09:00',
        duration: 60,
        notes: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Construct ISO Start Date
            const startDateTime = new Date(`${formData.date}T${formData.startTime}:00`);

            await api.post('/calendar/blockout', {
                start: startDateTime.toISOString(),
                duration: parseInt(formData.duration),
                notes: formData.notes
            });

            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert('Failed to create blockout');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-enter">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
                >
                    <FaTimes />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                        <FaBan size={18} />
                    </div>
                    <div>
                        <h3 className="font-serif font-bold text-xl text-gray-900 leading-tight">Block Time</h3>
                        <p className="text-gray-500 text-sm">Unavailable for bookings</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Date</label>
                        <input
                            type="date"
                            name="date"
                            required
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-400 focus:outline-none"
                            value={formData.date}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Start Time</label>
                            <input
                                type="time"
                                name="startTime"
                                required
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-400 focus:outline-none"
                                value={formData.startTime}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Duration (min)</label>
                            <input
                                type="number"
                                name="duration"
                                min="15"
                                step="15"
                                required
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-400 focus:outline-none"
                                value={formData.duration}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Reason (Optional)</label>
                        <input
                            type="text"
                            name="notes"
                            placeholder="e.g. Lunch, Personal"
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-400 focus:outline-none"
                            value={formData.notes}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gray-900 text-white font-bold py-3 px-6 rounded-xl hover:bg-black transition shadow-lg flex items-center justify-center gap-2"
                        >
                            {isLoading ? 'Blocking...' : 'Block Time'}
                            {!isLoading && <FaArrowRight size={14} />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
