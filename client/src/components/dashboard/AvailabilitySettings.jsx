import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { FaSave, FaPlus, FaTrash, FaCheckCircle, FaBan, FaSpinner } from 'react-icons/fa';

// Default Schedule: Mon-Fri 9-5
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DEFAULT_SCHEDULE = DAYS.map((day, index) => ({
    dayOfWeek: index,
    isWorkingDay: index >= 1 && index <= 5,
    startTime: '09:00',
    endTime: '17:00'
}));

export default function AvailabilitySettings() {
    const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
    const [exceptions, setExceptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Exception Form State
    const [newException, setNewException] = useState({
        date: '',
        isOff: true,
        startTime: '09:00',
        endTime: '17:00',
        reason: ''
    });

    useEffect(() => {
        fetchAvailability();
    }, []);

    const fetchAvailability = async () => {
        try {
            // Fetch for current user (Stylist)
            // We need the stylist ID. Assuming /availability/me or use the one from profile context?
            // The backend route is /availability/:stylistId. 
            // Better: use /auth/me to get ID first? 
            // Or strict usage: The dashboard passes stylistId? 
            // Let's rely on the Dashboard passing it, or fetch /auth/me if standalone.
            // As a component inside Dashboard, we might not have props if not passed.
            // Let's fetch /auth/me wrapper first or assume logic.
            // ACTUALLY: The backend controller for updateSchedule uses req.user. 
            // But getAvailability requires an ID.
            // Let's first fetch /auth/me to get the ID.
            const userRes = await api.get('/auth/me');
            if (userRes.data.role !== 'STYLIST') return;
            const stylistId = userRes.data.stylistProfile.id;

            // Now fetch availability
            // We want exceptions for... let's say next 3 months? Or just all future?
            // For now, let's fetch basic.
            const res = await api.get(`/availability/${stylistId}?start=${new Date().toISOString()}&end=${new Date(Date.now() + 90 * 86400000).toISOString()}`);

            // Merge fetched schedule with default structure to ensure all days exist
            const fetchedSchedule = res.data.schedule;
            const mergedSchedule = DEFAULT_SCHEDULE.map(defaultDay => {
                const found = fetchedSchedule.find(s => s.dayOfWeek === defaultDay.dayOfWeek);
                return found || defaultDay;
            });

            setSchedule(mergedSchedule);
            setExceptions(res.data.exceptions);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleScheduleChange = (index, field, value) => {
        const newSchedule = [...schedule];
        newSchedule[index] = { ...newSchedule[index], [field]: value };
        setSchedule(newSchedule);
    };

    const saveSchedule = async () => {
        setSaving(true);
        try {
            await api.put('/availability/schedule', { schedule });
            alert('Weekly schedule updated!');
        } catch (err) {
            console.error(err);
            alert('Failed to update schedule');
        } finally {
            setSaving(false);
        }
    };

    const addException = async (e) => {
        e.preventDefault();
        try {
            await api.post('/availability/exception', newException);
            // Refresh
            fetchAvailability();
            setNewException({ ...newException, date: '', reason: '' });
            alert('Exception added');
        } catch (err) {
            console.error(err);
            alert('Failed to add exception');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading availability...</div>;

    return (
        <div className="space-y-8 animate-fade-in text-gray-900">
            {/* 1. WEEKLY SCHEDULE */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-serif font-bold">Weekly Schedule</h2>
                        <p className="text-gray-500 text-sm">Set your standard recurring working hours.</p>
                    </div>
                    <button
                        onClick={saveSchedule}
                        disabled={saving}
                        className="btn-primary flex items-center gap-2 bg-crown-dark text-white px-6 py-2 rounded-lg hover:bg-black transition w-full md:w-auto justify-center whitespace-nowrap"
                    >
                        {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                        Save Schedule
                    </button>
                </div>

                <div className="space-y-3">
                    {schedule.map((day, index) => (
                        <div key={day.dayOfWeek} className={`flex items-center gap-4 p-3 rounded-lg border ${day.isWorkingDay ? 'bg-white border-gray-200' : 'bg-gray-50 border-transparent'}`}>
                            {/* Toggle */}
                            <div className="w-32 flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={day.isWorkingDay}
                                    onChange={(e) => handleScheduleChange(index, 'isWorkingDay', e.target.checked)}
                                    className="w-5 h-5 rounded border-gray-300 text-crown-gold focus:ring-crown-gold"
                                />
                                <span className={`font-bold ${day.isWorkingDay ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {DAYS[day.dayOfWeek]}
                                </span>
                            </div>

                            {/* Hours */}
                            {day.isWorkingDay ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="time"
                                        value={day.startTime}
                                        onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                                        className="p-2 border rounded-md text-sm"
                                    />
                                    <span className="text-gray-400">to</span>
                                    <input
                                        type="time"
                                        value={day.endTime}
                                        onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                                        className="p-2 border rounded-md text-sm"
                                    />
                                    {/* Copy to All Helper? Maybe later */}
                                </div>
                            ) : (
                                <span className="text-sm text-gray-400 italic">Unavailable</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. DATE EXCEPTIONS */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="mb-6">
                    <h2 className="text-2xl font-serif font-bold">Overrides & Time Off</h2>
                    <p className="text-gray-500 text-sm">Add specific dates where your schedule differs (vacations, holidays, etc).</p>
                </div>

                {/* Add Form */}
                <form onSubmit={addException} className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                        <input
                            type="date"
                            required
                            value={newException.date}
                            onChange={(e) => setNewException({ ...newException, date: e.target.value })}
                            className="w-full p-2 border rounded-md"
                        />
                    </div>

                    <div className="flex items-center gap-2 pb-3">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={newException.isOff}
                                onChange={(e) => setNewException({ ...newException, isOff: e.target.checked })}
                                className="w-5 h-5 rounded text-red-500 focus:ring-red-500"
                            />
                            <span className="font-bold text-gray-700">Entire Day Off</span>
                        </label>
                    </div>

                    {!newException.isOff && (
                        <div className="flex gap-2">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start</label>
                                <input
                                    type="time"
                                    value={newException.startTime}
                                    onChange={(e) => setNewException({ ...newException, startTime: e.target.value })}
                                    className="p-2 border rounded-md w-32"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">End</label>
                                <input
                                    type="time"
                                    value={newException.endTime}
                                    onChange={(e) => setNewException({ ...newException, endTime: e.target.value })}
                                    className="p-2 border rounded-md w-32"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reason (Optional)</label>
                        <input
                            type="text"
                            placeholder="e.g. Vacation"
                            value={newException.reason}
                            onChange={(e) => setNewException({ ...newException, reason: e.target.value })}
                            className="w-full p-2 border rounded-md"
                        />
                    </div>

                    <button type="submit" className="btn-secondary h-[42px] px-6 flex items-center justify-center gap-2 whitespace-nowrap min-w-[100px]">
                        <FaPlus size={14} /> <span>Add</span>
                    </button>
                </form>

                {/* List */}
                <div className="space-y-2">
                    {exceptions.length === 0 && <p className="text-gray-400 italic text-sm">No upcoming exceptions.</p>}
                    {exceptions.map(ex => (
                        <div key={ex.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${ex.isOff ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {ex.isOff ? <FaBan /> : <FaCheckCircle />}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">
                                        {new Date(ex.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {ex.isOff ? 'Day Off' : `Modified Hours: ${ex.startTime} - ${ex.endTime}`}
                                        {ex.reason && <span className="ml-2 font-medium text-gray-700">• {ex.reason}</span>}
                                    </p>
                                </div>
                            </div>
                            {/* Delete/Edit actions could go here */}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
