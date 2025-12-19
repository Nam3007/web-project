import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import {
    CalendarRange,
    Plus,
    Trash2,
    User,
    XCircle
} from 'lucide-react';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const SHIFTS = ['morning', 'noon', 'afternoon', 'evening'];

export default function AdminSchedulePage() {
    const [selectedDay, setSelectedDay] = useState('mon');
    const [selectedShift, setSelectedShift] = useState('morning');
    const [selectedStaff, setSelectedStaff] = useState('');

    const queryClient = useQueryClient();

    // Fetch Schedules
    const { data: schedules = [], isLoading: schedulesLoading } = useQuery({
        queryKey: ['schedules'],
        queryFn: async () => {
            const res = await api.get('/staff-schedules/');
            return res.data;
        }
    });

    // Fetch Staff List for dropdown
    const { data: staffList = [] } = useQuery({
        queryKey: ['staff'],
        queryFn: async () => {
            const res = await api.get('/staff/');
            return res.data;
        }
    });

    // Add Schedule Mutation
    const addScheduleMutation = useMutation({
        mutationFn: async ({ staff_id, work_day, work_shift }) => {
            return api.post('/staff-schedules/', { staff_id, work_day, work_shift });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['schedules']);
            alert('Shift assigned successfully!');
        },
        onError: (err) => {
            alert("Failed to assign shift: " + (err.response?.data?.detail || err.message));
        }
    });

    // Delete Schedule Mutation
    const deleteScheduleMutation = useMutation({
        mutationFn: async (id) => {
            return api.delete(`/staff-schedules/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['schedules']);
        }
    });

    const handleAssignShift = (e) => {
        e.preventDefault();
        if (!selectedStaff) return;
        addScheduleMutation.mutate({
            staff_id: parseInt(selectedStaff),
            work_day: selectedDay,
            work_shift: selectedShift
        });
    };

    const handleDelete = (id) => {
        if (window.confirm("Remove this shift assignment?")) {
            deleteScheduleMutation.mutate(id);
        }
    };

    const getShiftColor = (shift) => {
        switch (shift) {
            case 'morning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'noon': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'afternoon': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'evening': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            default: return 'bg-gray-100';
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Schedule Management</h1>
                <p className="text-gray-500 text-sm">Assign shifts to staff members</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Assignment Panel */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                    <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-primary" />
                        Assign New Shift
                    </h2>
                    <form onSubmit={handleAssignShift} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member</label>
                            <select
                                required
                                value={selectedStaff}
                                onChange={(e) => setSelectedStaff(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
                            >
                                <option value="">Select Staff</option>
                                {staffList.map(staff => (
                                    <option key={staff.id} value={staff.id}>{staff.full_name} ({staff.role})</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                                <select
                                    value={selectedDay}
                                    onChange={(e) => setSelectedDay(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white capitalize"
                                >
                                    {DAYS.map(day => (
                                        <option key={day} value={day}>{day}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                                <select
                                    value={selectedShift}
                                    onChange={(e) => setSelectedShift(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white capitalize"
                                >
                                    {SHIFTS.map(shift => (
                                        <option key={shift} value={shift}>{shift}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={addScheduleMutation.isPending}
                            className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-lg shadow-primary/30 disabled:opacity-70"
                        >
                            {addScheduleMutation.isPending ? 'Assigning...' : 'Assign Shift'}
                        </button>
                    </form>
                </div>

                {/* Schedule View */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
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

                    <div className="p-6 flex-1">
                        <h3 className="font-bold text-gray-800 mb-4 capitalize flex items-center gap-2">
                            <CalendarRange className="w-5 h-5 text-gray-400" />
                            Schedule for {selectedDay}
                        </h3>

                        {schedulesLoading ? (
                            <div className="flex justify-center p-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            /* Group by Shift */
                            <div className="space-y-6">
                                {SHIFTS.map(shift => {
                                    // Filter schedules for current day and shift
                                    const currentSchedules = schedules.filter(s => s.work_day === selectedDay && s.work_shift === shift);

                                    return (
                                        <div key={shift} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                                            <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${getShiftColor(shift).split(' ')[0].replace('bg-', 'bg-').replace('-100', '-400')}`}></div>
                                                {shift}
                                            </h4>

                                            {currentSchedules.length === 0 ? (
                                                <p className="text-sm text-gray-400 italic pl-4">No staff assigned</p>
                                            ) : (
                                                <div className="flex flex-wrap gap-3 pl-4">
                                                    {currentSchedules.map(schedule => {
                                                        const staffMember = staffList.find(s => s.id === schedule.staff_id);
                                                        const staffName = staffMember ? staffMember.full_name : `Staff #${schedule.staff_id}`;

                                                        return (
                                                            <div key={schedule.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getShiftColor(shift)}`}>
                                                                <User className="w-3 h-3 opacity-50" />
                                                                <span className="text-sm font-medium">{staffName}</span>
                                                                <button
                                                                    onClick={() => handleDelete(schedule.id)}
                                                                    className="ml-1 p-0.5 hover:bg-black/10 rounded"
                                                                >
                                                                    <XCircle className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
