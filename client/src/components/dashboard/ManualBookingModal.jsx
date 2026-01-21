import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { FaUser, FaCut, FaCalendarAlt, FaClock, FaStickyNote, FaSpinner } from 'react-icons/fa';

const ManualBookingModal = ({ isOpen, onClose, onSuccess, initialDate, stylistId }) => {
    const [clients, setClients] = useState([]);
    const [services, setServices] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

    // Form State
    const [selectedClientId, setSelectedClientId] = useState('');
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchData();
            if (initialDate) {
                const d = new Date(initialDate);
                setDate(d.toISOString().split('T')[0]);
                // Format time as HH:MM
                const h = String(d.getHours()).padStart(2, '0');
                const m = String(d.getMinutes()).padStart(2, '0');
                setTime(`${h}:${m}`);
            } else {
                // Default to today/next hour
                const now = new Date();
                setDate(now.toISOString().split('T')[0]);
                now.setHours(now.getHours() + 1, 0, 0, 0);
                const h = String(now.getHours()).padStart(2, '0');
                const m = String(now.getMinutes()).padStart(2, '0');
                setTime(`${h}:${m}`);
            }
        }
    }, [isOpen, initialDate]);

    const fetchData = async () => {
        setLoadingData(true);
        try {
            const [clientRes, serviceRes] = await Promise.all([
                api.get('/calendar/clients'),
                api.get(`/stylists/${stylistId}/services`) // Assuming this endpoint exists and is public/accessible
            ]);
            setClients(clientRes.data);
            setServices(serviceRes.data);
        } catch (err) {
            console.error("Failed to load booking data", err);
        } finally {
            setLoadingData(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const appointmentDate = new Date(`${date}T${time}:00`);

            await api.post('/bookings', {
                stylistId,
                stylistClientId: selectedClientId,
                serviceId: selectedServiceId,
                appointmentDate: appointmentDate.toISOString(),
                notes
            });

            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || 'Failed to create booking');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative animate-enter flex flex-col max-h-[90vh]">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    ✕
                </button>

                <h3 className="text-xl font-serif font-bold mb-6 text-gray-900 border-b pb-4">New Appointment</h3>

                {loadingData ? (
                    <div className="flex-1 flex items-center justify-center py-10">
                        <FaSpinner className="animate-spin text-crown-gold text-2xl" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                        {/* Client Select */}
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1 flex items-center gap-2">
                                <FaUser /> Client
                            </label>
                            <select
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-crown-gold outline-none"
                                value={selectedClientId}
                                onChange={e => setSelectedClientId(e.target.value)}
                                required
                            >
                                <option value="">Select a Client...</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} {c.phone ? `(${c.phone})` : ''}
                                    </option>
                                ))}
                            </select>
                            <div className="mt-1 text-right">
                                <button type="button" className="text-xs text-crown-gold font-bold hover:underline">
                                    + New Client
                                </button>
                            </div>
                        </div>

                        {/* Service Select */}
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1 flex items-center gap-2">
                                <FaCut /> Service
                            </label>
                            <select
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-crown-gold outline-none"
                                value={selectedServiceId}
                                onChange={e => setSelectedServiceId(e.target.value)}
                                required
                            >
                                <option value="">Select Service...</option>
                                {services.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} - ${s.price} ({s.duration} min)
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Date & Time */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1 flex items-center gap-2">
                                    <FaCalendarAlt /> Date
                                </label>
                                <input
                                    type="date"
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-crown-gold outline-none"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1 flex items-center gap-2">
                                    <FaClock /> Time
                                </label>
                                <input
                                    type="time"
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-crown-gold outline-none"
                                    value={time}
                                    onChange={e => setTime(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1 flex items-center gap-2">
                                <FaStickyNote /> Notes (Optional)
                            </label>
                            <textarea
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-crown-gold outline-none h-24"
                                placeholder="Any internal notes..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            />
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full btn-primary bg-crown-dark text-white py-3 rounded-xl shadow-lg hover:shadow-xl transition flex justify-center items-center gap-2"
                            >
                                {submitting && <FaSpinner className="animate-spin" />}
                                {submitting ? 'Booking...' : 'Confirm Booking'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ManualBookingModal;
