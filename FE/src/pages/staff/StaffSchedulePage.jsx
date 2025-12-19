import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { CalendarRange, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const SHIFTS = ['morning', 'noon', 'afternoon', 'evening'];

export default function StaffSchedulePage() {
    const [selectedDay, setSelectedDay] = useState('mon');
    const { user } = useAuth();

    // Fetch Schedules. Note: This fetches ALL schedules. 
    // Ideally backend should filter or we filter client side.
    // Given the small scale, client side filtering is acceptable.
    const { data: schedules = [], isLoading } = useQuery({
        queryKey: ['schedules'],
        queryFn: async () => {
            const res = await api.get('/staff-schedules/');
            return res.data;
        }
    });

    const getShiftColor = (shift) => {
        switch (shift) {
            case 'morning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'noon': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'afternoon': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'evening': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            default: return 'bg-gray-100';
        }
    };

    // Filter to show ONLY the logged-in user's shifts
    // OR show all shifts so they know who they are working with?
    // User request: "add a schedule to chef and staff" -> usually implies seeing their own or the team.
    // Let's show ALL but highlight MINE.
    const mySchedules = schedules.filter(s => s.staff_id === user?.id);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">My Schedule</h1>
                <p className="text-gray-500 text-sm">View upcoming shifts</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col max-w-4xl">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex overflow-x-auto">
                    {DAYS.map(day => (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            className={`flex-1 min-w-[3rem] py-2 px-1 text-center rounded-lg text-sm font-medium uppercase transition-all ${selectedDay === day
                                ? 'bg-white text-primary shadow-sm ring-1 ring-gray-200'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            {day}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    <h3 className="font-bold text-gray-800 mb-6 capitalize flex items-center gap-2">
                        <CalendarRange className="w-5 h-5 text-gray-400" />
                        Schedule for {selectedDay}
                    </h3>

                    {isLoading ? (
                        <div className="text-center py-10">Loading schedule...</div>
                    ) : (
                        <div className="space-y-6">
                            {SHIFTS.map(shift => {
                                // Check if I am working this shift
                                const isMyShift = mySchedules.some(s => s.work_day === selectedDay && s.work_shift === shift);

                                return (
                                    <div key={shift} className={`p-4 rounded-xl border transition-all ${isMyShift ? getShiftColor(shift) + ' shadow-sm' : 'border-gray-100 bg-gray-50/50 opacity-60'}`}>
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-bold uppercase tracking-wider text-sm">{shift}</h4>
                                            {isMyShift && <span className="text-xs font-bold bg-white/50 px-2 py-1 rounded">My Shift</span>}
                                        </div>
                                        {!isMyShift && <p className="text-xs mt-1">Not assigned</p>}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
