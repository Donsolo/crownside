import React, { useState, useEffect, useMemo } from 'react';
import api from '../../lib/api';
import { FaChevronLeft, FaChevronRight, FaCalendarPlus, FaBan, FaSpinner } from 'react-icons/fa';
import NewBlockoutModal from './NewBlockoutModal';
import ManualBookingModal from './ManualBookingModal';

const CalendarView = ({ stylistId }) => {
    const [events, setEvents] = useState([]);
    const [availability, setAvailability] = useState({ schedule: [], exceptions: [] }); // [NEW]
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState('week'); // 'day', 'week', 'month'
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showBlockoutModal, setShowBlockoutModal] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);

    // --- Helpers ---

    const getStartOfWeek = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const addDays = (date, days) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    };

    const isSameDay = (d1, d2) => {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    // Generate days for current view
    const days = useMemo(() => {
        if (view === 'month') {
            const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const start = getStartOfWeek(startOfMonth);
            const daysArr = [];
            // 6 weeks * 7 days = 42 days to cover padding
            for (let i = 0; i < 42; i++) {
                daysArr.push(addDays(start, i));
            }
            return daysArr;
        }

        const start = view === 'week' ? getStartOfWeek(currentDate) : new Date(currentDate.setHours(0, 0, 0, 0));
        const daysArr = [];
        const count = view === 'week' ? 7 : 1;
        for (let i = 0; i < count; i++) {
            daysArr.push(view === 'week' ? addDays(start, i) : new Date(start));
        }
        return daysArr;
    }, [currentDate, view]);

    // Format helpers
    const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(':00', '');

    // --- Data Fetching ---

    const fetchEventsAndAvailability = async () => {
        if (!stylistId) return;
        setLoading(true);
        try {
            // Calculate range
            const startDay = days[0];
            const endDay = new Date(days[days.length - 1]);
            endDay.setHours(23, 59, 59, 999);

            const [eventsRes, availRes] = await Promise.all([
                api.get(`/calendar/events?start=${startDay.toISOString()}&end=${endDay.toISOString()}`),
                api.get(`/availability/${stylistId}?start=${startDay.toISOString()}&end=${endDay.toISOString()}`)
            ]);

            setEvents(eventsRes.data);
            setAvailability(availRes.data);
        } catch (err) {
            console.error('Failed to fetch calendar data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEventsAndAvailability();
    }, [currentDate, view, stylistId]);


    // --- Navigation Handlers ---

    const handlePrev = () => {
        if (view === 'month') {
            const newDate = new Date(currentDate);
            newDate.setMonth(newDate.getMonth() - 1);
            setCurrentDate(newDate);
            return;
        }
        const diff = view === 'week' ? -7 : -1;
        setCurrentDate(addDays(currentDate, diff));
    };

    const handleNext = () => {
        if (view === 'month') {
            const newDate = new Date(currentDate);
            newDate.setMonth(newDate.getMonth() + 1);
            setCurrentDate(newDate);
            return;
        }
        const diff = view === 'week' ? 7 : 1;
        setCurrentDate(addDays(currentDate, diff));
    };

    const handleToday = () => setCurrentDate(new Date());

    const isSlotAvailable = (date) => {
        const dayOfWeek = date.getDay();
        const timeString = date.toTimeString().slice(0, 5); // HH:MM

        // 1. Check Exceptions
        const exception = availability.exceptions.find(ex => isSameDay(new Date(ex.date), date));
        if (exception) {
            if (exception.isOff) return false;
            // Check if within custom hours
            return timeString >= exception.startTime && timeString < exception.endTime;
        }

        // 2. Check Schedule
        const daySchedule = availability.schedule.find(s => s.dayOfWeek === dayOfWeek);
        if (!daySchedule || !daySchedule.isWorkingDay) return false;

        return timeString >= daySchedule.startTime && timeString < daySchedule.endTime;
    };

    const handleSlotClick = (day, e) => {
        // Calculate clicked hour (6 AM offset)
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const hourHeight = 80;
        const hoursFrom6 = Math.floor(y / hourHeight);
        const clickedHour = 6 + hoursFrom6; // 6 AM start

        // Don't allow click if out of bounds (shouldn't happen with grid)
        if (clickedHour < 6 || clickedHour > 22) return;

        const slotDate = new Date(day);
        slotDate.setHours(clickedHour, 0, 0, 0);

        // Strict Check: Don't allow booking if slot is unavailable
        // We allow booking "near" availability but let's be strict for now or show warning.
        // Actually, for "Manual Booking" (Admin side), maybe we allow override?
        // But the user requested "Prevent booking attempts during unavailable times."
        // Let's enforce it visually and logically here.
        if (!isSlotAvailable(slotDate)) {
            alert('This slot is outside of working hours.');
            return;
        }

        setSelectedSlot(slotDate);
        setShowBookingModal(true);
    };


    // --- Render Logic ---

    // Hours (6 AM to 10 PM = 17 hours)
    const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6 to 22

    // Filter events for a specific day
    const getEventsForDay = (day) => {
        return events.filter(e => isSameDay(new Date(e.start), day));
    };

    // Calculate position
    const getEventStyle = (event) => {
        const start = new Date(event.start);
        const startHour = start.getHours();
        const startMin = start.getMinutes();

        // Relative to 6 AM
        const minutesFrom6am = (startHour - 6) * 60 + startMin;
        const top = minutesFrom6am * (80 / 60); // 80px per hour
        const height = (event.duration || 60) * (80 / 60);

        return {
            top: `${top}px`,
            height: `${height}px`,
            minHeight: '20px'
        };
    };

    // Calculate Unavailable Zones for Rendering
    const getUnavailableZones = (day) => {
        const dayOfWeek = day.getDay();
        const zones = [];

        // Default working hours (empty means closed all day)
        let workingStart = null;
        let workingEnd = null;

        // Exception?
        const exception = availability.exceptions.find(ex => isSameDay(new Date(ex.date), day));
        if (exception) {
            if (!exception.isOff) {
                workingStart = exception.startTime;
                workingEnd = exception.endTime;
            }
        } else {
            // Regular Schedule
            const sched = availability.schedule.find(s => s.dayOfWeek === dayOfWeek);
            if (sched && sched.isWorkingDay) {
                workingStart = sched.startTime;
                workingEnd = sched.endTime;
            }
        }

        // If closed all day
        if (!workingStart || !workingEnd) {
            return [{ top: 0, height: 1360 }]; // Full height (17 * 80)
        }

        // Parse HH:MM
        const parseTime = (t) => {
            const [h, m] = t.split(':').map(Number);
            return h + m / 60;
        };

        const startDec = parseTime(workingStart);
        const endDec = parseTime(workingEnd);

        // Pre-work unavailable zone (6 AM to Start)
        if (startDec > 6) {
            const height = (startDec - 6) * 80;
            zones.push({ top: 0, height });
        }

        // Post-work unavailable zone (End to 10 PM)
        // Calendar goes to 23:00 (17 hours from 6 to 22 inclusive) -> 23:00 is end of 22 block?
        // Hours array is 6..22. Last slot is 22:00-23:00.
        // So end of day is 23.
        if (endDec < 23) {
            const top = (endDec - 6) * 80;
            const height = (23 - endDec) * 80;
            zones.push({ top, height });
        }

        return zones;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-200px)] min-h-[600px]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 bg-white z-10">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-serif font-bold text-gray-900 capitalize">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setView('day')}
                            className={`px-3 py-1 rounded text-sm font-medium transition ${view === 'day' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Day
                        </button>
                        <button
                            onClick={() => setView('week')}
                            className={`px-3 py-1 rounded text-sm font-medium transition ${view === 'week' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Week
                        </button>
                        <button
                            onClick={() => setView('month')}
                            className={`px-3 py-1 rounded text-sm font-medium transition ${view === 'month' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Month
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={handlePrev} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500">
                        <FaChevronLeft size={14} />
                    </button>
                    <button onClick={handleToday} className="px-3 py-1 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded transition border border-gray-200">
                        Today
                    </button>
                    <button onClick={handleNext} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500">
                        <FaChevronRight size={14} />
                    </button>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setSelectedSlot(new Date()); // Default to now
                            setShowBlockoutModal(true);
                        }}
                        className="btn-secondary text-sm flex items-center gap-2"
                    >
                        <FaBan size={12} />
                        <span>Block Time</span>
                    </button>
                    <button
                        onClick={() => {
                            setSelectedSlot(new Date()); // Default to now
                            setShowBookingModal(true);
                        }}
                        className="btn-primary flex items-center gap-2 bg-crown-dark text-white px-4 py-2 rounded-lg text-sm shadow-md hover:bg-black transition"
                    >
                        <FaCalendarPlus />
                        <span>Book Appt</span>
                    </button>
                </div>
            </div>

            {/* Calendar Grid Container */}
            <div className="flex-1 overflow-y-auto relative bg-white custom-scrollbar">
                {loading && (
                    <div className="absolute inset-0 z-50 bg-white/80 flex items-center justify-center">
                        <FaSpinner className="animate-spin text-crown-gold text-3xl" />
                    </div>
                )}

                {view === 'month' ? (
                    // --- MONTH VIEW GRID ---
                    <div className="h-full flex flex-col">
                        {/* Days Header */}
                        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="py-2 text-center text-xs font-bold text-gray-500 uppercase tracking-wide">
                                    {day}
                                </div>
                            ))}
                        </div>
                        {/* Month Cells */}
                        <div className="grid grid-cols-7 grid-rows-6 flex-1 bg-gray-200 gap-px border-b border-gray-200">
                            {days.map((day, i) => {
                                const isToday = isSameDay(day, new Date());
                                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                                const dayEvents = getEventsForDay(day);

                                return (
                                    <div
                                        key={i}
                                        onClick={() => {
                                            setCurrentDate(day);
                                            setView('day');
                                        }}
                                        className={`bg-white min-h-[80px] p-1 flex flex-col gap-1 cursor-pointer hover:bg-gray-50 transition relative ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}`}
                                    >
                                        <div className="flex justify-between items-center px-1">
                                            <span className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-crown-gold text-white' : 'text-gray-700'
                                                }`}>
                                                {day.getDate()}
                                            </span>
                                        </div>

                                        {/* Event Dots/Bars */}
                                        <div className="flex flex-col gap-1 overflow-hidden mt-1">
                                            {dayEvents.slice(0, 3).map(event => (
                                                <div
                                                    key={event.id}
                                                    className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium ${event.isBlockout
                                                        ? 'bg-gray-100 text-gray-500'
                                                        : 'bg-indigo-50 text-indigo-700 border-l-2 border-indigo-500'
                                                        }`}
                                                >
                                                    {formatTime(event.start)} {event.title}
                                                </div>
                                            ))}
                                            {dayEvents.length > 3 && (
                                                <div className="text-[10px] text-gray-400 pl-1">
                                                    + {dayEvents.length - 3} more
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    // --- TIME GRID VIEW (Day/Week) ---
                    <div className="flex min-w-[800px]">
                        {/* Time Column */}
                        <div className="w-16 flex-shrink-0 border-r border-gray-100 bg-white sticky left-0 z-20">
                            {/* Header Spacer */}
                            <div className="h-12 border-b border-gray-100 sticky top-0 bg-white z-30"></div>
                            {hours.map(h => (
                                <div key={h} className="h-20 text-xs text-gray-400 text-right pr-2 pt-2 relative">
                                    <span className="relative -top-3">{h > 12 ? h - 12 : h} {h >= 12 ? 'PM' : 'AM'}</span>
                                </div>
                            ))}
                        </div>

                        {/* Days Columns */}
                        <div className="flex-1 grid grid-cols-7 relative"> {/* Grid cols 7 or 1 */}
                            {/* Day Headers */}
                            <div className="contents">
                                {days.map((day, i) => {
                                    const isToday = isSameDay(day, new Date());
                                    return (
                                        <div
                                            key={i}
                                            className="h-12 border-b border-gray-200 border-r border-gray-100 bg-white sticky top-0 z-10 flex flex-col justify-center items-center"
                                            style={{ gridColumn: view === 'day' ? 'span 7' : 'span 1' }}
                                        >
                                            <span className={`text-xs font-bold uppercase tracking-wide ${isToday ? 'text-crown-gold' : 'text-gray-500'}`}>
                                                {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                            </span>
                                            <div className={`text-lg leading-none font-bold ${isToday ? 'bg-crown-gold text-white w-7 h-7 flex items-center justify-center rounded-full mt-1 shadow-sm' : 'text-gray-900 mt-0.5'}`}>
                                                {day.getDate()}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Day Bodies */}
                            <div className="contents">
                                {/* Background Lines */}
                                <div className="absolute inset-0 top-12 pointer-events-none z-0">
                                    {hours.map(h => (
                                        <div key={h} className="h-20 border-b border-gray-50 w-full" />
                                    ))}
                                </div>

                                {days.map((day, i) => {
                                    const dayEvents = getEventsForDay(day);
                                    const unavailableZones = getUnavailableZones(day); // [NEW] Get gray zones

                                    return (
                                        <div
                                            key={i}
                                            className="relative border-r border-gray-50 h-[1360px] group" // 17 hours * 80px
                                            style={{ gridColumn: view === 'day' ? 'span 7' : 'span 1' }}
                                        >
                                            {/* Unavailable Overlays */}
                                            {unavailableZones.map((zone, zIdx) => (
                                                <div
                                                    key={`zone-${zIdx}`}
                                                    className="absolute left-0 right-0 bg-gray-100/50 pointer-events-none z-10"
                                                    style={{
                                                        top: `${zone.top}px`,
                                                        height: `${zone.height}px`,
                                                        backgroundImage: 'repeating-linear-gradient(45deg, #f3f4f6 25%, transparent 25%, transparent 50%, #f3f4f6 50%, #f3f4f6 75%, transparent 75%, transparent 100%)',
                                                        backgroundSize: '10px 10px'
                                                    }}
                                                />
                                            ))}

                                            {/* Events */}
                                            {dayEvents.map(event => {
                                                const styles = getEventStyle(event);
                                                return (
                                                    <div
                                                        key={event.id}
                                                        className={`absolute left-1 right-1 rounded px-2 py-1 text-xs border overflow-hidden cursor-pointer hover:shadow-lg hover:z-30 transition-all ${event.isBlockout
                                                            ? 'bg-gray-100 border-gray-200 text-gray-500 bg-stripe opacity-90'
                                                            : 'bg-indigo-50 border-indigo-100 text-indigo-700 border-l-4 border-l-indigo-500'
                                                            }`}
                                                        style={{
                                                            ...styles,
                                                            backgroundImage: event.isBlockout ? 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.03) 5px, rgba(0,0,0,0.03) 10px)' : 'none'
                                                        }}
                                                        title={event.title}
                                                    >
                                                        <div className="font-bold truncate">
                                                            {event.isBlockout && <FaBan className="inline mr-1 text-[10px]" />}
                                                            {event.title}
                                                        </div>
                                                        {!event.isBlockout && (
                                                            <div className="truncate text-[10px] opacity-80">
                                                                {event.clientName}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}

                                            {/* Grid Click Handler Layer */}
                                            <div
                                                className="absolute inset-0 z-0 cursor-pointer hover:bg-black/5 transition"
                                                onClick={(e) => handleSlotClick(day, e)}
                                                title="Click to book"
                                            ></div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <NewBlockoutModal
                isOpen={showBlockoutModal}
                onClose={() => setShowBlockoutModal(false)}
                onSuccess={() => {
                    fetchEventsAndAvailability(); // Refresh both
                    // Optional: Show toast
                }}
                initialDate={currentDate}
            />

            <ManualBookingModal
                isOpen={showBookingModal}
                onClose={() => setShowBookingModal(false)}
                onSuccess={() => {
                    fetchEventsAndAvailability(); // Refresh both
                    // Optional: Show toast
                }}
                initialDate={selectedSlot}
                stylistId={stylistId}
            />
        </div>
    );
};

export default CalendarView;
