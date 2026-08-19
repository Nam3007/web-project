import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
    CalendarDays,
    Clock,
    Users,
    Utensils,
    CheckCircle2,
    ChefHat,
    ClipboardList,
    ChevronLeft,
    ChevronRight,
    PlusCircle,
    Check,
    MessageSquare
} from 'lucide-react';

export default function StaffReservationPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState('assigned'); // 'assigned' | 'calendar'
    const isWaiter = user?.role === 'waiter';
    const isChef = user?.role === 'chef';

    // Calendar Week Navigation State
    const [calendarWeekStart, setCalendarWeekStart] = useState(() => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        return monday.toISOString().split('T')[0];
    });

    // 1. Fetch Assigned Reservations for this Staff
    const { data: myAssignedReservations = [], isLoading } = useQuery({
        queryKey: ['staffAssignedReservations', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            const res = await api.get(`/reservations/staff/${user.id}`);
            return res.data;
        },
        enabled: !!user?.id,
        refetchInterval: 10000
    });

    // 2. Fetch Weekly Reservations for Calendar
    const { data: weeklyData } = useQuery({
        queryKey: ['weeklyReservations', calendarWeekStart],
        queryFn: async () => {
            const res = await api.get(`/reservations/weekly?start_date=${calendarWeekStart}`);
            return res.data;
        }
    });

    // Mutation to mark reservation complete
    const completeMutation = useMutation({
        mutationFn: async (id) => {
            return api.put(`/reservations/${id}/complete`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['staffAssignedReservations']);
            queryClient.invalidateQueries(['weeklyReservations']);
            alert('Reservation marked as completed.');
        }
    });

    // Filter upcoming vs completed
    const upcomingReservations = useMemo(() => {
        return myAssignedReservations.filter(r => r.status === 'accepted');
    }, [myAssignedReservations]);

    const completedReservations = useMemo(() => {
        return myAssignedReservations.filter(r => r.status === 'completed');
    }, [myAssignedReservations]);

    // Handle Take Order -> Redirect to WaiterOrderEntry with preselected table
    const handleTakeOrder = (res) => {
        if (!res.table_id) {
            alert('No table assigned yet.');
            return;
        }
        navigate('/staff/orders/new', {
            state: {
                tableId: res.table_id,
                tableNumber: res.table_number,
                reservationId: res.id,
                customerName: res.customer_name
            }
        });
    };

    // Calendar Week Navigation
    const handlePrevWeek = () => {
        const d = new Date(calendarWeekStart);
        d.setDate(d.getDate() - 7);
        setCalendarWeekStart(d.toISOString().split('T')[0]);
    };

    const handleNextWeek = () => {
        const d = new Date(calendarWeekStart);
        d.setDate(d.getDate() + 7);
        setCalendarWeekStart(d.toISOString().split('T')[0]);
    };

    const handleTodayWeek = () => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        setCalendarWeekStart(monday.toISOString().split('T')[0]);
    };

    const weekDays = useMemo(() => {
        const start = new Date(calendarWeekStart);
        const days = [];
        for (let i = 0; i < 7; i++) {
            const current = new Date(start);
            current.setDate(start.getDate() + i);
            days.push({
                dateObj: current,
                dateStr: current.toISOString().split('T')[0],
                dayName: current.toLocaleDateString('en-US', { weekday: 'short' }),
                dayNum: current.getDate(),
                monthName: current.toLocaleDateString('en-US', { month: 'short' })
            });
        }
        return days;
    }, [calendarWeekStart]);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-50 rounded-2xl text-primary border border-emerald-100">
                        <ChefHat className="w-7 h-7" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-gray-900 font-serif">Assigned Reservations</h1>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold capitalize bg-slate-900 text-white">
                                {user?.role || 'Staff'} View
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {isChef 
                                ? 'Review pre-ordered dishes and prepare food for incoming reserved tables.'
                                : 'Serve assigned dining tables, take additional orders, and complete dining sessions.'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl border border-gray-200">
                    <button
                        onClick={() => setActiveTab('assigned')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'assigned'
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <ClipboardList className="w-4 h-4" />
                        My Assigned ({upcomingReservations.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('calendar')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'calendar'
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <CalendarDays className="w-4 h-4" />
                        Weekly Schedule
                    </button>
                </div>
            </div>

            {/* TAB 1: ASSIGNED LIST */}
            {activeTab === 'assigned' && (
                <div className="space-y-6">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2].map(i => <div key={i} className="h-44 bg-white rounded-2xl animate-pulse" />)}
                        </div>
                    ) : upcomingReservations.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300 space-y-3">
                            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                            <h3 className="text-lg font-bold text-gray-800">No Active Assignments</h3>
                            <p className="text-sm text-gray-500">You currently have no upcoming table reservations assigned to you.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {upcomingReservations.map(res => {
                                const rDate = new Date(res.reservation_date);

                                return (
                                    <div key={res.id} className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-200 space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
                                        <div className="space-y-3">
                                            {/* Table Badge Header */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-3 py-1.5 rounded-xl font-extrabold text-sm bg-emerald-100 text-emerald-900 border border-emerald-200">
                                                        Table {res.table_number}
                                                    </span>
                                                    <span className="text-xs font-bold text-gray-400 font-mono">#{res.id}</span>
                                                </div>

                                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    Confirmed
                                                </span>
                                            </div>

                                            {/* Customer & Time Info */}
                                            <div>
                                                <h3 className="font-bold text-base text-gray-900">{res.customer_name}</h3>
                                                <p className="text-xs text-gray-500">{res.customer_phone || 'No phone'}</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl text-xs">
                                                <div>
                                                    <span className="text-gray-400">Date & Time</span>
                                                    <p className="font-bold text-gray-800 mt-0.5">
                                                        {rDate.toLocaleDateString('en-GB')} {rDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400">Party Size</span>
                                                    <p className="font-bold text-gray-800 mt-0.5">
                                                        {res.number_of_guests} Guests ({res.duration_hours}h)
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Pre-order Food Section */}
                                            {res.preorder_items?.length > 0 && (
                                                <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/60 text-xs space-y-1.5">
                                                    <p className="font-bold text-amber-900 flex items-center justify-between">
                                                        <span className="flex items-center gap-1.5">
                                                            <Utensils className="w-3.5 h-3.5" />
                                                            Pre-Order Dishes ({res.preorder_items.length})
                                                        </span>
                                                        <span>{res.total_preorder_amount?.toLocaleString('vi-VN')}₫</span>
                                                    </p>
                                                    <div className="space-y-1 pt-1 border-t border-amber-200/40">
                                                        {res.preorder_items.map(item => (
                                                            <div key={item.id} className="flex justify-between text-[11px] text-amber-950 font-medium">
                                                                <span>{item.quantity}x {item.item_name}</span>
                                                                {item.notes && <span className="text-[10px] text-amber-700 italic truncate max-w-[120px]">({item.notes})</span>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Other Assigned Staff */}
                                            {res.assigned_staff?.length > 0 && (
                                                <div className="text-[11px] text-gray-500">
                                                    <span className="font-semibold text-gray-400">Team: </span>
                                                    {res.assigned_staff.map(s => `${s.staff_name} (${s.role})`).join(', ')}
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-3 border-t border-gray-100">
                                            {isWaiter && (
                                                <button
                                                    onClick={() => handleTakeOrder(res)}
                                                    className="flex-1 py-2.5 bg-primary hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-200 transition-all"
                                                >
                                                    <PlusCircle className="w-4 h-4" />
                                                    Take Order / Add Items
                                                </button>
                                            )}
                                            
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Mark this table reservation as completed?')) {
                                                        completeMutation.mutate(res.id);
                                                    }
                                                }}
                                                className={`py-2.5 px-3 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-colors ${!isWaiter ? 'flex-1' : ''}`}
                                            >
                                                <Check className="w-4 h-4" />
                                                Finish Session
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: DARK MATRIX WEEKLY SCHEDULE CALENDAR */}
            {activeTab === 'calendar' && (
                <div className="space-y-4">
                    {/* Navigation Header */}
                    <div className="bg-[#121318] p-4 sm:p-5 rounded-2xl border border-[#232630] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handlePrevWeek}
                                className="p-2 rounded-xl bg-[#1A1D24] border border-[#2A2E3A] hover:bg-[#252934] text-slate-300 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleTodayWeek}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#1A1D24] border border-[#2A2E3A] hover:bg-[#252934] text-slate-200"
                            >
                                Current Week
                            </button>
                            <button
                                onClick={handleNextWeek}
                                className="p-2 rounded-xl bg-[#1A1D24] border border-[#2A2E3A] hover:bg-[#252934] text-slate-300 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="text-right">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">My Shift Timeline</span>
                            <h3 className="text-base font-bold text-white font-serif">
                                {weekDays[0]?.monthName} {weekDays[0]?.dayNum} – {weekDays[6]?.monthName} {weekDays[6]?.dayNum}, {weekDays[0]?.dateObj.getFullYear()}
                            </h3>
                        </div>
                    </div>

                    {/* Dark Matrix Schedule Board */}
                    <div className="bg-[#0D0E12] rounded-2xl border border-[#20232D] shadow-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <div className="min-w-[1000px]">
                                
                                {/* ─── TIMELINE HEADER: TIME SLOTS ─── */}
                                <div className="grid grid-cols-[130px_repeat(13,1fr)] border-b border-[#20232D] bg-[#111319] sticky top-0 z-20">
                                    <div className="p-3.5 text-xs font-bold uppercase tracking-wider text-slate-500 border-r border-[#20232D] flex items-center justify-center">
                                        Day \ Time
                                    </div>
                                    {['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'].map(hour => (
                                        <div key={hour} className="py-3 px-2 text-center text-xs font-semibold text-slate-400 border-r border-[#1D2028] last:border-r-0">
                                            {hour}
                                        </div>
                                    ))}
                                </div>

                                {/* ─── ROWS: MONDAY TO SUNDAY ─── */}
                                <div className="divide-y divide-[#1D2028]">
                                    {weekDays.map(day => {
                                        const isToday = day.dateStr === new Date().toISOString().split('T')[0];
                                        const dayReservations = myAssignedReservations.filter(r => {
                                            const rDate = new Date(r.reservation_date).toISOString().split('T')[0];
                                            return rDate === day.dateStr && r.status !== 'cancelled' && r.status !== 'rejected';
                                        });

                                        return (
                                            <div
                                                key={day.dateStr}
                                                className={`grid grid-cols-[130px_1fr] relative min-h-[96px] transition-colors ${
                                                    isToday ? 'bg-[#141720]/60' : 'hover:bg-[#12141C]/40'
                                                }`}
                                            >
                                                {/* Left Column: Day Label */}
                                                <div className={`p-4 border-r border-[#20232D] flex flex-col justify-center items-center select-none ${
                                                    isToday ? 'bg-[#181C26]' : 'bg-[#0E1015]'
                                                }`}>
                                                    <span className={`text-xs font-bold uppercase tracking-wider ${isToday ? 'text-emerald-400' : 'text-slate-400'}`}>
                                                        {day.dayName}
                                                    </span>
                                                    <span className={`text-lg font-bold font-serif ${isToday ? 'text-white' : 'text-slate-200'}`}>
                                                        {day.dayNum} {day.monthName}
                                                    </span>
                                                    {isToday && (
                                                        <span className="mt-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                            Today
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Right Area: Time Grid Track & Bookings */}
                                                <div className="relative h-full">
                                                    
                                                    {/* Background Hour Lines */}
                                                    <div className="absolute inset-0 grid grid-cols-13 pointer-events-none">
                                                        {Array.from({ length: 13 }).map((_, idx) => (
                                                            <div key={idx} className="border-r border-[#1B1D25] h-full last:border-r-0" />
                                                        ))}
                                                    </div>

                                                    {/* Reservation Cards Layer */}
                                                    <div className="relative h-full min-h-[96px] p-2">
                                                        {dayReservations.map((res, rIdx) => {
                                                            const resDate = new Date(res.reservation_date);
                                                            const startHour = resDate.getHours() + (resDate.getMinutes() / 60);
                                                            const duration = res.duration_hours || 2.0;

                                                            const timelineStart = 10.0;
                                                            const totalHours = 13.0;

                                                            const leftPct = Math.max(0, Math.min(95, ((startHour - timelineStart) / totalHours) * 100));
                                                            const widthPct = Math.max(7, Math.min(100 - leftPct, (duration / totalHours) * 100));

                                                            const isPinkStyle = rIdx % 2 === 1;

                                                            return (
                                                                <div
                                                                    key={res.id}
                                                                    style={{
                                                                        left: `${leftPct}%`,
                                                                        width: `${widthPct}%`,
                                                                        top: `${(rIdx % 2) * 44 + 8}px`
                                                                    }}
                                                                    className={`absolute z-10 p-2.5 rounded-xl shadow-lg transition-all duration-200 hover:scale-[1.03] select-none ${
                                                                        isPinkStyle
                                                                            ? 'bg-[#FFB5C5] text-[#18181B] shadow-[0_4px_16px_rgba(255,181,197,0.25)]'
                                                                            : 'bg-[#2E323C] text-[#F3F4F6] border border-[#3E4350] shadow-md'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center justify-between gap-1">
                                                                        <h4 className={`text-xs font-bold truncate ${isPinkStyle ? 'text-[#18181B]' : 'text-white'}`}>
                                                                            {res.customer_name}
                                                                        </h4>
                                                                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                                                            isPinkStyle ? 'bg-[#18181B]/15 text-[#18181B]' : 'bg-white/10 text-slate-300'
                                                                        }`}>
                                                                            T{res.table_number}
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className={`text-[10px] font-semibold flex items-center gap-1 ${
                                                                            isPinkStyle ? 'text-[#18181B]/80' : 'text-slate-300'
                                                                        }`}>
                                                                            <Users className="w-3 h-3" />
                                                                            {String(res.number_of_guests).padStart(2, '0')}
                                                                        </span>
                                                                        <span className={`text-[10px] ${isPinkStyle ? 'text-[#18181B]/60' : 'text-slate-400'}`}>
                                                                            • {resDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({res.duration_hours}h)
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
