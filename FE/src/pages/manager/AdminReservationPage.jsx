import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import {
    CalendarDays,
    Clock,
    Users,
    Utensils,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    ChefHat,
    Search,
    SlidersHorizontal,
    Plus,
    Filter,
    Edit3,
    Eye,
    MessageSquare,
    DollarSign,
    Save,
    X
} from 'lucide-react';

export default function AdminReservationPage() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'calendar' | 'all'
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // Accept Modal State
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
    const [assignTableId, setAssignTableId] = useState('');
    const [assignWaiters, setAssignWaiters] = useState([]);
    const [assignChefs, setAssignChefs] = useState([]);
    const [adminNotes, setAdminNotes] = useState('');

    // Reject Modal State
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectNotes, setRejectNotes] = useState('');

    // Details Modal State
    const [viewDetailsReservation, setViewDetailsReservation] = useState(null);

    // Deposit Config Modal State
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [newDepositAmount, setNewDepositAmount] = useState(50000);

    // Calendar Week Navigation State
    const [calendarWeekStart, setCalendarWeekStart] = useState(() => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        return monday.toISOString().split('T')[0];
    });

    // 1. Fetch All Reservations
    const { data: allReservations = [], isLoading } = useQuery({
        queryKey: ['adminAllReservations'],
        queryFn: async () => {
            const res = await api.get('/reservations/');
            return res.data;
        },
        refetchInterval: 10000
    });

    // 2. Fetch Deposit Config
    const { data: depositConfig } = useQuery({
        queryKey: ['depositConfig'],
        queryFn: async () => {
            const res = await api.get('/reservations/deposit-config');
            return res.data;
        }
    });

    // 3. Fetch Staff (Waiters & Chefs)
    const { data: allStaff = [] } = useQuery({
        queryKey: ['adminAllStaff'],
        queryFn: async () => {
            const res = await api.get('/staff/');
            return res.data;
        }
    });

    const activeWaiters = useMemo(() => allStaff.filter(s => s.role === 'waiter' ), [allStaff]);
    const activeChefs = useMemo(() => allStaff.filter(s => s.role === 'chef'), [allStaff]);

    // 4. Fetch Available Tables for Selected Reservation
    const { data: availableTables = [] } = useQuery({
        queryKey: ['availableTablesForSlot', selectedReservation?.id, selectedReservation?.reservation_date, selectedReservation?.duration_hours],
        queryFn: async () => {
            if (!selectedReservation) return [];
            const res = await api.get('/reservations/available-tables', {
                params: {
                    reservation_date: selectedReservation.reservation_date,
                    duration_hours: selectedReservation.duration_hours || 2.0,
                    number_of_guests: selectedReservation.number_of_guests || 1,
                    exclude_reservation_id: selectedReservation.id
                }
            });
            return res.data;
        },
        enabled: !!selectedReservation
    });

    // 5. Fetch Weekly Reservations for Calendar
    const { data: weeklyData } = useQuery({
        queryKey: ['weeklyReservations', calendarWeekStart],
        queryFn: async () => {
            const res = await api.get(`/reservations/weekly?start_date=${calendarWeekStart}`);
            return res.data;
        }
    });

    // Mutations
    const acceptMutation = useMutation({
        mutationFn: async ({ id, payload }) => {
            return api.put(`/reservations/${id}/accept`, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['adminAllReservations']);
            queryClient.invalidateQueries(['weeklyReservations']);
            setIsAcceptModalOpen(false);
            setSelectedReservation(null);
            alert('Reservation accepted & table/staff assigned successfully!');
        },
        onError: (err) => {
            alert('Failed to accept: ' + (err.response?.data?.detail || err.message));
        }
    });

    const rejectMutation = useMutation({
        mutationFn: async ({ id, payload }) => {
            return api.put(`/reservations/${id}/reject`, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['adminAllReservations']);
            queryClient.invalidateQueries(['weeklyReservations']);
            setIsRejectModalOpen(false);
            setSelectedReservation(null);
            alert('Reservation rejected.');
        },
        onError: (err) => {
            alert('Failed to reject: ' + (err.response?.data?.detail || err.message));
        }
    });

    const completeMutation = useMutation({
        mutationFn: async (id) => {
            return api.put(`/reservations/${id}/complete`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['adminAllReservations']);
            queryClient.invalidateQueries(['weeklyReservations']);
            alert('Reservation marked as completed.');
        }
    });

    const depositConfigMutation = useMutation({
        mutationFn: async (amount) => {
            return api.put('/reservations/deposit-config', { deposit_amount: amount });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['depositConfig']);
            setIsDepositModalOpen(false);
            alert('Default deposit amount updated.');
        }
    });

    // Pending List
    const pendingList = useMemo(() => {
        return allReservations.filter(r => r.status === 'pending');
    }, [allReservations]);

    // Filtered All List
    const filteredAllReservations = useMemo(() => {
        return allReservations.filter(r => {
            const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
            const matchesSearch = !searchQuery || 
                r.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.customer_phone?.includes(searchQuery) ||
                r.table_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.id.toString() === searchQuery;
            return matchesStatus && matchesSearch;
        });
    }, [allReservations, statusFilter, searchQuery]);

    // Open Accept Modal
    const handleOpenAcceptModal = (res) => {
        setSelectedReservation(res);
        setAssignTableId(res.table_id || '');
        setAssignWaiters(res.assigned_staff?.filter(s => s.role === 'waiter').map(s => s.staff_id) || []);
        setAssignChefs(res.assigned_staff?.filter(s => s.role === 'chef').map(s => s.staff_id) || []);
        setAdminNotes(res.admin_notes || '');
        setIsAcceptModalOpen(true);
    };

    // Open Reject Modal
    const handleOpenRejectModal = (res) => {
        setSelectedReservation(res);
        setRejectNotes('');
        setIsRejectModalOpen(true);
    };

    const handleConfirmAccept = () => {
        if (!assignTableId) {
            alert('Please select a table to assign.');
            return;
        }

        acceptMutation.mutate({
            id: selectedReservation.id,
            payload: {
                table_id: parseInt(assignTableId),
                waiter_ids: assignWaiters,
                chef_ids: assignChefs,
                admin_notes: adminNotes || null
            }
        });
    };

    const handleConfirmReject = () => {
        rejectMutation.mutate({
            id: selectedReservation.id,
            payload: {
                admin_notes: rejectNotes || null
            }
        });
    };

    const toggleWaiter = (staffId) => {
        setAssignWaiters(prev => 
            prev.includes(staffId) ? prev.filter(id => id !== staffId) : [...prev, staffId]
        );
    };

    const toggleChef = (staffId) => {
        setAssignChefs(prev => 
            prev.includes(staffId) ? prev.filter(id => id !== staffId) : [...prev, staffId]
        );
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
            
            {/* Header with Title & Global Deposit Setting */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 font-serif">Reservation Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Review table booking requests, assign tables and dedicated staff, and manage weekly calendars.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        <div>
                            <p className="text-[10px] uppercase font-bold text-emerald-700">Default Deposit</p>
                            <p className="text-sm font-bold text-emerald-900">
                                {depositConfig?.deposit_amount?.toLocaleString('vi-VN')}₫
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setNewDepositAmount(depositConfig?.deposit_amount || 50000);
                            setIsDepositModalOpen(true);
                        }}
                        className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
                    >
                        Edit Deposit
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                        activeTab === 'pending'
                            ? 'bg-primary text-white shadow-md shadow-primary/20'
                            : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    <Clock className="w-4 h-4" />
                    Pending Requests
                    {pendingList.length > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${activeTab === 'pending' ? 'bg-white text-primary' : 'bg-amber-500 text-white'}`}>
                            {pendingList.length}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setActiveTab('calendar')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                        activeTab === 'calendar'
                            ? 'bg-primary text-white shadow-md shadow-primary/20'
                            : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    <CalendarDays className="w-4 h-4" />
                    Weekly Timeline
                </button>

                <button
                    onClick={() => setActiveTab('all')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                        activeTab === 'all'
                            ? 'bg-primary text-white shadow-md shadow-primary/20'
                            : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    <Filter className="w-4 h-4" />
                    All Bookings ({allReservations.length})
                </button>
            </div>

            {/* TAB 1: PENDING REQUESTS */}
            {activeTab === 'pending' && (
                <div className="space-y-4">
                    {pendingList.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300 space-y-3">
                            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                            <h3 className="text-lg font-bold text-gray-800">No Pending Reservations</h3>
                            <p className="text-sm text-gray-500">All customer booking requests have been reviewed!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pendingList.map(res => {
                                const rDate = new Date(res.reservation_date);
                                return (
                                    <div key={res.id} className="bg-white rounded-2xl p-5 shadow-sm border border-amber-200 space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
                                        <div className="space-y-3">
                                            {/* Top info */}
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-mono font-bold text-gray-400">#RES-{res.id}</span>
                                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                                                    Pending
                                                </span>
                                            </div>

                                            {/* Customer name */}
                                            <div>
                                                <h3 className="font-bold text-base text-gray-900">{res.customer_name || `Customer #${res.customer_id}`}</h3>
                                                <p className="text-xs text-gray-500">{res.customer_phone || res.customer_email || 'No contact provided'}</p>
                                            </div>

                                            {/* Booking Details Grid */}
                                            <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl text-xs">
                                                <div>
                                                    <span className="text-gray-400">Date & Time</span>
                                                    <p className="font-bold text-gray-800 mt-0.5">
                                                        {rDate.toLocaleDateString('en-GB')} {rDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400">Guests & Duration</span>
                                                    <p className="font-bold text-gray-800 mt-0.5">
                                                        {res.number_of_guests} Guests ({res.duration_hours}h)
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Pre-order summary */}
                                            {res.preorder_items?.length > 0 && (
                                                <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-100 text-xs">
                                                    <p className="font-bold text-emerald-900 mb-1 flex items-center justify-between">
                                                        <span>Pre-ordered Food ({res.preorder_items.length} items)</span>
                                                        <span>{res.total_preorder_amount?.toLocaleString('vi-VN')}₫</span>
                                                    </p>
                                                    <div className="text-emerald-800 truncate text-[11px]">
                                                        {res.preorder_items.map(i => `${i.quantity}x ${i.item_name}`).join(', ')}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Special requests */}
                                            {res.special_requests && (
                                                <div className="p-2.5 bg-amber-50 rounded-xl text-xs text-amber-900 border border-amber-200/60">
                                                    <strong>Request:</strong> {res.special_requests}
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 pt-3 border-t border-gray-100">
                                            <button
                                                onClick={() => handleOpenAcceptModal(res)}
                                                className="flex-1 py-2.5 bg-primary hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-200 transition-all"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                Accept & Assign
                                            </button>
                                            <button
                                                onClick={() => handleOpenRejectModal(res)}
                                                className="px-3.5 py-2.5 bg-gray-100 hover:bg-rose-50 hover:text-rose-600 text-gray-600 font-bold rounded-xl text-xs transition-colors"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: DARK MATRIX TIMELINE CALENDAR (Matching Reference Design) */}
            {activeTab === 'calendar' && (
                <div className="space-y-4">
                    {/* Navigation Header */}
                    <div className="bg-[#121318] p-4 sm:p-5 rounded-2xl border border-[#232630] flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
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

                        {/* Date Range & Stats */}
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-md bg-[#FFB5C5]"></span>
                                    <span className="text-slate-400 font-medium">Confirmed</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-md bg-[#323640] border border-[#434856]"></span>
                                    <span className="text-slate-400 font-medium">Reserved / Assigned</span>
                                </div>
                            </div>

                            <div className="text-right">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Timeline</span>
                                <h3 className="text-base font-bold text-white font-serif">
                                    {weekDays[0]?.monthName} {weekDays[0]?.dayNum} – {weekDays[6]?.monthName} {weekDays[6]?.dayNum}, {weekDays[0]?.dateObj.getFullYear()}
                                </h3>
                            </div>
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
                                        const dayReservations = (weeklyData?.reservations || []).filter(r => {
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

                                                            // Calculate left % (10:00 is 10.0, 22:00 is 22.0 -> total 12 hours)
                                                            // We support from 9:30 to 22:30 (timeline starts at 10:00 -> offset)
                                                            const timelineStart = 10.0;
                                                            const totalHours = 13.0; // 10:00 to 23:00

                                                            const leftPct = Math.max(0, Math.min(95, ((startHour - timelineStart) / totalHours) * 100));
                                                            const widthPct = Math.max(7, Math.min(100 - leftPct, (duration / totalHours) * 100));

                                                            // Alternate colors matching screenshot: soft pink vs charcoal
                                                            const isPinkStyle = rIdx % 2 === 1;

                                                            return (
                                                                <div
                                                                    key={res.id}
                                                                    onClick={() => setViewDetailsReservation(res)}
                                                                    style={{
                                                                        left: `${leftPct}%`,
                                                                        width: `${widthPct}%`,
                                                                        top: `${(rIdx % 2) * 44 + 8}px`
                                                                    }}
                                                                    className={`absolute z-10 p-2.5 rounded-xl cursor-pointer shadow-lg transition-all duration-200 hover:scale-[1.03] hover:z-30 select-none ${
                                                                        isPinkStyle
                                                                            ? 'bg-[#FFB5C5] text-[#18181B] shadow-[0_4px_16px_rgba(255,181,197,0.25)] hover:bg-[#FFC2D1]'
                                                                            : 'bg-[#2E323C] text-[#F3F4F6] border border-[#3E4350] shadow-md hover:bg-[#383D48]'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center justify-between gap-1">
                                                                        <h4 className={`text-xs font-bold truncate ${isPinkStyle ? 'text-[#18181B]' : 'text-white'}`}>
                                                                            {res.customer_name || `Guest #${res.customer_id}`}
                                                                        </h4>
                                                                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                                                            isPinkStyle ? 'bg-[#18181B]/15 text-[#18181B]' : 'bg-white/10 text-slate-300'
                                                                        }`}>
                                                                            {res.table_number ? `T${res.table_number}` : 'Pending'}
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
                                                                            • {resDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

            {/* TAB 3: ALL RESERVATIONS TABLE */}
            {activeTab === 'all' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden space-y-4 p-5">
                    {/* Filters Bar */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by customer, table, phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:border-primary focus:outline-none"
                            />
                        </div>

                        <div className="flex gap-2 overflow-x-auto w-full md:w-auto">
                            {['ALL', 'pending', 'accepted', 'completed', 'rejected', 'cancelled'].map(st => (
                                <button
                                    key={st}
                                    onClick={() => setStatusFilter(st)}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                                        statusFilter === st
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                                <tr>
                                    <th className="py-3 px-4">ID</th>
                                    <th className="py-3 px-4">Customer</th>
                                    <th className="py-3 px-4">Date & Time</th>
                                    <th className="py-3 px-4">Guests</th>
                                    <th className="py-3 px-4">Table</th>
                                    <th className="py-3 px-4">Staff Assigned</th>
                                    <th className="py-3 px-4">Total Paid</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredAllReservations.map(res => {
                                    const rDate = new Date(res.reservation_date);
                                    return (
                                        <tr key={res.id} className="hover:bg-gray-50/50">
                                            <td className="py-3 px-4 font-mono font-bold text-gray-400">#{res.id}</td>
                                            <td className="py-3 px-4">
                                                <p className="font-bold text-gray-900">{res.customer_name || `Cust #${res.customer_id}`}</p>
                                                <p className="text-xs text-gray-500">{res.customer_phone}</p>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="font-medium text-gray-800">{rDate.toLocaleDateString('en-GB')}</p>
                                                <p className="text-xs text-gray-500">{rDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({res.duration_hours}h)</p>
                                            </td>
                                            <td className="py-3 px-4 font-semibold text-gray-700">{res.number_of_guests}p</td>
                                            <td className="py-3 px-4">
                                                <span className="px-2 py-1 rounded-lg bg-gray-100 font-bold text-xs">
                                                    {res.table_number || 'Unassigned'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-xs text-gray-600">
                                                {res.assigned_staff?.length > 0 ? (
                                                    <span>{res.assigned_staff.map(s => s.staff_name).join(', ')}</span>
                                                ) : (
                                                    <span className="text-gray-400">None</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 font-bold text-emerald-600">
                                                {res.total_paid?.toLocaleString('vi-VN')}₫
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                                                    res.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                                                    res.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                                                    res.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {res.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right space-x-1">
                                                <button
                                                    onClick={() => setViewDetailsReservation(res)}
                                                    className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {res.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleOpenAcceptModal(res)}
                                                        className="p-1.5 text-primary hover:text-emerald-700 rounded-lg hover:bg-emerald-50"
                                                        title="Accept"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {res.status === 'accepted' && (
                                                    <button
                                                        onClick={() => completeMutation.mutate(res.id)}
                                                        className="p-1.5 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50"
                                                        title="Complete Dining"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/*  ACCEPT & ASSIGN MODAL                                         */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {isAcceptModalOpen && selectedReservation && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 font-serif">Accept Reservation #{selectedReservation.id}</h3>
                                <p className="text-xs text-gray-500">
                                    {selectedReservation.customer_name} • {selectedReservation.number_of_guests} Guests • {selectedReservation.duration_hours}h
                                </p>
                            </div>
                            <button onClick={() => setIsAcceptModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* 1. Table Selection */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold uppercase text-gray-500">
                                Assign Table <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={assignTableId}
                                onChange={(e) => setAssignTableId(e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:border-primary focus:outline-none"
                            >
                                <option value="">-- Choose an Available Table --</option>
                                {availableTables.map(t => (
                                    <option 
                                        key={t.id} 
                                        value={t.id}
                                        disabled={!t.is_available}
                                    >
                                        {t.table_number} (Capacity: {t.table_size}p) - {t.is_available ? 'Available' : `Booked (${t.conflict_reason})`}
                                    </option>
                                ))}
                            </select>
                            <p className="text-[11px] text-gray-400 italic">
                                * Tables with conflicting bookings or within the 1-hour preparation lockout window are automatically disabled.
                            </p>
                        </div>

                        {/* 2. Assign Waiters */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold uppercase text-gray-500">
                                Assign Waiters (Multi-Select)
                            </label>
                            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-200">
                                {activeWaiters.map(w => (
                                    <label key={w.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border text-xs cursor-pointer hover:bg-emerald-50">
                                        <input
                                            type="checkbox"
                                            checked={assignWaiters.includes(w.id)}
                                            onChange={() => toggleWaiter(w.id)}
                                            className="rounded text-primary focus:ring-primary"
                                        />
                                        <span className="font-semibold text-gray-800">{w.full_name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* 3. Assign Chefs */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold uppercase text-gray-500">
                                Assign Chefs (Multi-Select)
                            </label>
                            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-200">
                                {activeChefs.map(c => (
                                    <label key={c.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border text-xs cursor-pointer hover:bg-emerald-50">
                                        <input
                                            type="checkbox"
                                            checked={assignChefs.includes(c.id)}
                                            onChange={() => toggleChef(c.id)}
                                            className="rounded text-primary focus:ring-primary"
                                        />
                                        <span className="font-semibold text-gray-800">{c.full_name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* 4. Admin Notes */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold uppercase text-gray-500">
                                Note for Customer (Optional)
                            </label>
                            <textarea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="e.g. Table decorated for anniversary, please arrive 5 mins early..."
                                rows={2}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:border-primary focus:outline-none resize-none"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-3 border-t border-gray-100">
                            <button
                                onClick={handleConfirmAccept}
                                disabled={acceptMutation.isPending}
                                className="flex-1 py-3 bg-primary hover:bg-emerald-600 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-200 transition-all disabled:opacity-50"
                            >
                                {acceptMutation.isPending ? 'Confirming...' : 'Confirm Assignment & Accept'}
                            </button>
                            <button
                                onClick={() => setIsAcceptModalOpen(false)}
                                className="px-5 py-3 text-sm text-gray-500 hover:text-gray-700 font-semibold"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/*  REJECT MODAL                                                  */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {isRejectModalOpen && selectedReservation && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-gray-900 font-serif">Reject Reservation #{selectedReservation.id}</h3>
                        <p className="text-xs text-gray-500">Please provide an optional reason to notify the customer.</p>
                        
                        <textarea
                            value={rejectNotes}
                            onChange={(e) => setRejectNotes(e.target.value)}
                            placeholder="e.g. Fully booked at this hour, kitchen closing early..."
                            rows={3}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-rose-500 focus:outline-none resize-none"
                        />

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleConfirmReject}
                                disabled={rejectMutation.isPending}
                                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm transition-all"
                            >
                                Confirm Rejection
                            </button>
                            <button
                                onClick={() => setIsRejectModalOpen(false)}
                                className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 font-semibold"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/*  VIEW DETAILS DRAWER/MODAL                                     */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {viewDetailsReservation && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 font-serif">Booking #{viewDetailsReservation.id} Details</h3>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                                    viewDetailsReservation.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                    {viewDetailsReservation.status}
                                </span>
                            </div>
                            <button onClick={() => setViewDetailsReservation(null)} className="p-1.5 text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="bg-gray-50 p-3.5 rounded-xl space-y-1.5">
                                <p><span className="text-gray-400">Customer:</span> <strong>{viewDetailsReservation.customer_name}</strong></p>
                                <p><span className="text-gray-400">Phone:</span> {viewDetailsReservation.customer_phone}</p>
                                <p><span className="text-gray-400">Date/Time:</span> {new Date(viewDetailsReservation.reservation_date).toLocaleString()}</p>
                                <p><span className="text-gray-400">Party Size:</span> {viewDetailsReservation.number_of_guests} Guests ({viewDetailsReservation.duration_hours} hours)</p>
                                <p><span className="text-gray-400">Assigned Table:</span> <strong className="text-primary">{viewDetailsReservation.table_number || 'None'}</strong></p>
                            </div>

                            {viewDetailsReservation.assigned_staff?.length > 0 && (
                                <div>
                                    <p className="font-bold text-gray-500 mb-1">Assigned Staff:</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {viewDetailsReservation.assigned_staff.map(s => (
                                            <span key={s.id} className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-900 font-semibold">
                                                {s.staff_name} ({s.role})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {viewDetailsReservation.preorder_items?.length > 0 && (
                                <div>
                                    <p className="font-bold text-gray-500 mb-1">Pre-order Items:</p>
                                    <div className="bg-gray-50 p-3 rounded-xl space-y-1">
                                        {viewDetailsReservation.preorder_items.map(pi => (
                                            <div key={pi.id} className="flex justify-between">
                                                <span>{pi.quantity}x {pi.item_name}</span>
                                                <span className="font-bold">{pi.subtotal?.toLocaleString('vi-VN')}₫</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {viewDetailsReservation.special_requests && (
                                <div className="p-2.5 bg-amber-50 rounded-xl text-amber-900 border border-amber-100">
                                    <strong>Request:</strong> {viewDetailsReservation.special_requests}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setViewDetailsReservation(null)}
                            className="w-full py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-200 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/*  EDIT DEPOSIT CONFIG MODAL                                     */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {isDepositModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-gray-900 font-serif">Adjust Default Deposit Fee</h3>
                        <p className="text-xs text-gray-500">Set the fixed deposit fee required from customers when booking tables.</p>
                        
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Amount (VND)</label>
                            <input
                                type="number"
                                step="10000"
                                min="0"
                                value={newDepositAmount}
                                onChange={(e) => setNewDepositAmount(parseFloat(e.target.value) || 0)}
                                className="w-full p-3 border border-gray-200 rounded-xl text-base font-bold text-gray-900 focus:border-primary focus:outline-none"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => depositConfigMutation.mutate(newDepositAmount)}
                                disabled={depositConfigMutation.isPending}
                                className="flex-1 py-2.5 bg-primary hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all"
                            >
                                Save Setting
                            </button>
                            <button
                                onClick={() => setIsDepositModalOpen(false)}
                                className="px-4 py-2.5 text-sm text-gray-500 font-semibold"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
