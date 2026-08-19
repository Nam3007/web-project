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
    Sparkles,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    QrCode,
    Plus,
    Minus,
    Trash2,
    ShoppingBag,
    ChefHat,
    MessageSquare,
    Search,
    ShieldCheck,
    ArrowRight,
    CalendarCheck,
    History
} from 'lucide-react';

const DURATION_OPTIONS = [
    { value: 1.0, label: '1.0 Hour' },
    { value: 1.5, label: '1.5 Hours' },
    { value: 2.0, label: '2.0 Hours (Recommended)' },
    { value: 3.0, label: '3.0 Hours' },
];

const TIME_SLOTS = [
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
    '13:00', '13:30', '14:00', '17:00', '17:30', '18:00',
    '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
];

export default function CustomerReservationPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState('book'); // 'book' | 'my-reservations' | 'calendar'
    
    // Booking Form State
    const [numberOfGuests, setNumberOfGuests] = useState(2);
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });
    const [selectedTime, setSelectedTime] = useState('18:00');
    const [durationHours, setDurationHours] = useState(2.0);
    const [specialRequests, setSpecialRequests] = useState('');
    const [preorderCart, setPreorderCart] = useState({}); // { itemId: { item, quantity, notes } }
    const [menuSearch, setMenuSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');

    // QR Payment Modal State
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [pendingReservationPayload, setPendingReservationPayload] = useState(null);
    const [qrSimulating, setQrSimulating] = useState(false);

    // Calendar Navigation State
    const [calendarWeekStart, setCalendarWeekStart] = useState(() => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
        const monday = new Date(d.setDate(diff));
        return monday.toISOString().split('T')[0];
    });

    // 1. Fetch Deposit Config
    const { data: depositConfig } = useQuery({
        queryKey: ['depositConfig'],
        queryFn: async () => {
            const res = await api.get('/reservations/deposit-config');
            return res.data;
        }
    });
    const depositAmount = depositConfig?.deposit_amount || 50000;

    // 2. Fetch Menu Items for Pre-order
    const { data: menuItems = [] } = useQuery({
        queryKey: ['menuItems'],
        queryFn: async () => {
            const res = await api.get('/menu-items/');
            return res.data;
        }
    });

    // 3. Fetch Customer Reservations
    const { data: myReservations = [], isLoading: loadingReservations } = useQuery({
        queryKey: ['myReservations', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            const res = await api.get(`/reservations/customer/${user.id}`);
            return res.data;
        },
        enabled: !!user?.id,
        refetchInterval: 10000
    });

    // 4. Fetch Weekly Reservations for Calendar
    const { data: weeklyData } = useQuery({
        queryKey: ['weeklyReservations', calendarWeekStart],
        queryFn: async () => {
            const res = await api.get(`/reservations/weekly?start_date=${calendarWeekStart}`);
            return res.data;
        }
    });

    // Mutations
    const createReservationMutation = useMutation({
        mutationFn: async (payload) => {
            return api.post('/reservations/', payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['myReservations']);
            queryClient.invalidateQueries(['weeklyReservations']);
            setIsQRModalOpen(false);
            setPreorderCart({});
            setSpecialRequests('');
            setActiveTab('my-reservations');
            alert('🎉 Reservation created successfully! Awaiting admin confirmation.');
        },
        onError: (err) => {
            alert('Failed to create reservation: ' + (err.response?.data?.detail || err.message));
        }
    });

    const cancelReservationMutation = useMutation({
        mutationFn: async (reservationId) => {
            return api.put(`/reservations/${reservationId}/cancel`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['myReservations']);
            queryClient.invalidateQueries(['weeklyReservations']);
            alert('Reservation cancelled.');
        },
        onError: (err) => {
            alert('Failed to cancel: ' + (err.response?.data?.detail || err.message));
        }
    });

    // Preorder Cart Helpers
    const handleAddPreorder = (item) => {
        setPreorderCart(prev => {
            const currentQty = prev[item.id]?.quantity || 0;
            return {
                ...prev,
                [item.id]: {
                    item,
                    quantity: currentQty + 1,
                    notes: prev[item.id]?.notes || ''
                }
            };
        });
    };

    const handleUpdatePreorderQty = (itemId, delta) => {
        setPreorderCart(prev => {
            const current = prev[itemId];
            if (!current) return prev;
            const newQty = current.quantity + delta;
            if (newQty <= 0) {
                const next = { ...prev };
                delete next[itemId];
                return next;
            }
            return {
                ...prev,
                [itemId]: { ...current, quantity: newQty }
            };
        });
    };

    const preorderTotal = useMemo(() => {
        return Object.values(preorderCart).reduce((sum, entry) => {
            return sum + (entry.item.item_price * entry.quantity);
        }, 0);
    }, [preorderCart]);

    const totalCombinedPayment = depositAmount + preorderTotal;

    // Filter Menu for Pre-order
    const filteredMenuItems = useMemo(() => {
        return menuItems.filter(item => {
            if (!item.is_available) return false;
            const matchCategory = selectedCategory === 'ALL' || item.item_type === selectedCategory;
            const matchSearch = item.item_name.toLowerCase().includes(menuSearch.toLowerCase());
            return matchCategory && matchSearch;
        });
    }, [menuItems, selectedCategory, menuSearch]);

    // Handle Form Submit -> Open QR Payment Modal
    const handleProceedToPayment = (e) => {
        e.preventDefault();
        if (!user) {
            alert('Please sign in to make a reservation.');
            navigate('/login');
            return;
        }

        const dateTimeStr = `${selectedDate}T${selectedTime}:00`;
        const preorderedList = Object.values(preorderCart).map(entry => ({
            menu_item_id: entry.item.id,
            quantity: entry.quantity,
            notes: entry.notes || null
        }));

        const payload = {
            customer_id: user.id,
            reservation_date: dateTimeStr,
            duration_hours: durationHours,
            number_of_guests: numberOfGuests,
            special_requests: specialRequests || null,
            deposit_amount: depositAmount,
            deposit_paid: true,
            deposit_transaction_id: `RES-${Date.now()}`,
            preorder_items: preorderedList
        };

        setPendingReservationPayload(payload);
        setIsQRModalOpen(true);
    };

    const handleConfirmPayment = () => {
        setQrSimulating(true);
        setTimeout(() => {
            setQrSimulating(false);
            if (pendingReservationPayload) {
                createReservationMutation.mutate(pendingReservationPayload);
            }
        }, 1500);
    };

    // Week navigation helper
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

    // Calculate Week Days
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
        <div className="customer-page customer-page-wide pb-16">
            
            {/* Header Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-100/60 pb-5">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-slate-900">Table Reservations</h1>
                    <p className="text-sm text-slate-500 mt-1">Book your private dining experience with instant table reservation & optional pre-orders.</p>
                </div>

                <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60">
                    <button
                        onClick={() => setActiveTab('book')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                            activeTab === 'book'
                                ? 'bg-primary text-white shadow-md shadow-emerald-200'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                        }`}
                    >
                        <CalendarCheck className="w-4 h-4" />
                        Book a Table
                    </button>
                    <button
                        onClick={() => setActiveTab('my-reservations')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all relative ${
                            activeTab === 'my-reservations'
                                ? 'bg-primary text-white shadow-md shadow-emerald-200'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                        }`}
                    >
                        <History className="w-4 h-4" />
                        My Bookings
                        {myReservations.length > 0 && (
                            <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${activeTab === 'my-reservations' ? 'bg-white text-primary' : 'bg-primary text-white'}`}>
                                {myReservations.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('calendar')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                            activeTab === 'calendar'
                                ? 'bg-primary text-white shadow-md shadow-emerald-200'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                        }`}
                    >
                        <CalendarDays className="w-4 h-4" />
                        Weekly Calendar
                    </button>
                </div>
            </div>

            {/* TAB 1: BOOKING FORM */}
            {activeTab === 'book' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
                    
                    {/* Left Column: Form Details + Pre-order Menu */}
                    <div className="lg:col-span-8 space-y-8">
                        
                        {/* 1. Guests, Date, Time & Duration */}
                        <div className="bg-white/95 backdrop-blur rounded-[2rem] p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
                            <h2 className="text-xl font-bold text-slate-800 font-serif flex items-center gap-2.5">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-primary text-sm font-sans font-bold">1</span>
                                Reservation Details
                            </h2>

                            {/* Guest Count */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Number of Guests</label>
                                <div className="flex flex-wrap items-center gap-3">
                                    {[1, 2, 4, 6, 8, 10, 12].map(num => (
                                        <button
                                            type="button"
                                            key={num}
                                            onClick={() => setNumberOfGuests(num)}
                                            className={`flex items-center justify-center min-w-[54px] h-12 px-4 rounded-2xl font-bold text-sm transition-all duration-200 ${
                                                numberOfGuests === num
                                                    ? 'bg-primary text-white shadow-lg shadow-emerald-200 scale-105'
                                                    : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-emerald-50 hover:border-primary/40'
                                            }`}
                                        >
                                            <Users className="w-4 h-4 mr-1.5 opacity-80" />
                                            {num}
                                        </button>
                                    ))}
                                    <div className="flex items-center gap-2 pl-2">
                                        <input
                                            type="number"
                                            min="1"
                                            max="50"
                                            value={numberOfGuests}
                                            onChange={(e) => setNumberOfGuests(Math.max(1, parseInt(e.target.value) || 1))}
                                            className="w-20 px-3 py-3 text-center border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:border-primary focus:outline-none"
                                            placeholder="Custom"
                                        />
                                        <span className="text-xs text-slate-400 font-medium">Guests</span>
                                    </div>
                                </div>
                            </div>

                            {/* Date and Time Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Reservation Date</label>
                                    <div className="relative">
                                        <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                        <input
                                            type="date"
                                            min={new Date().toISOString().split('T')[0]}
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:border-primary focus:bg-white focus:outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Time Slot</label>
                                    <div className="relative">
                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                        <select
                                            value={selectedTime}
                                            onChange={(e) => setSelectedTime(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:border-primary focus:bg-white focus:outline-none transition-all"
                                        >
                                            {TIME_SLOTS.map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Duration Selection */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">Duration</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {DURATION_OPTIONS.map(opt => (
                                        <button
                                            type="button"
                                            key={opt.value}
                                            onClick={() => setDurationHours(opt.value)}
                                            className={`p-3 rounded-2xl font-bold text-xs sm:text-sm text-center transition-all ${
                                                durationHours === opt.value
                                                    ? 'bg-secondary text-white shadow-md shadow-emerald-200'
                                                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Special Requests */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Special Requests (Optional)</label>
                                <textarea
                                    value={specialRequests}
                                    onChange={(e) => setSpecialRequests(e.target.value)}
                                    placeholder="e.g. Quiet corner, anniversary setup, high chair for child..."
                                    rows={2}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 focus:border-primary focus:bg-white focus:outline-none resize-none"
                                />
                            </div>
                        </div>

                        {/* 2. Optional Pre-Order Items */}
                        <div className="bg-white/95 backdrop-blur rounded-[2rem] p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <h2 className="text-xl font-bold text-slate-800 font-serif flex items-center gap-2.5">
                                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-600 text-sm font-sans font-bold">2</span>
                                    Pre-Order Food (Optional)
                                </h2>
                                <span className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full font-medium border border-amber-200/60">
                                    Kitchen will start preparation at reservation time
                                </span>
                            </div>

                            {/* Search & Category Filter */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search dishes to pre-order..."
                                        value={menuSearch}
                                        onChange={(e) => setMenuSearch(e.target.value)}
                                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-primary focus:outline-none"
                                    />
                                </div>
                                <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                                    {['ALL', 'food', 'drink', 'appetizer', 'dessert'].map(cat => (
                                        <button
                                            type="button"
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`px-3.5 py-2 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all ${
                                                selectedCategory === cat
                                                    ? 'bg-slate-900 text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Menu Grid for Pre-ordering */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-1">
                                {filteredMenuItems.map(item => {
                                    const inCart = preorderCart[item.id];
                                    return (
                                        <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                            {item.item_image ? (
                                                <img src={item.item_image} alt={item.item_name} className="w-16 h-16 rounded-xl object-cover" />
                                            ) : (
                                                <div className="w-16 h-16 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400">
                                                    <Utensils className="w-6 h-6" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-sm text-slate-800 truncate">{item.item_name}</h4>
                                                <p className="text-xs font-semibold text-primary mt-0.5">{item.item_price?.toLocaleString('vi-VN')}₫</p>
                                            </div>

                                            {inCart ? (
                                                <div className="flex items-center gap-2 bg-white px-2 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdatePreorderQty(item.id, -1)}
                                                        className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600"
                                                    >
                                                        <Minus className="w-3.5 h-3.5" />
                                                    </button>
                                                    <span className="font-bold text-xs min-w-[18px] text-center text-slate-800">{inCart.quantity}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdatePreorderQty(item.id, 1)}
                                                        className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddPreorder(item)}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-primary hover:text-white border border-slate-200 hover:border-primary rounded-xl text-xs font-bold text-slate-700 transition-all shadow-sm"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    Add
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Order & Deposit Summary Sticky */}
                    <div className="lg:col-span-4 sticky top-24 space-y-6">
                        <div className="bg-white/95 backdrop-blur rounded-[2rem] p-6 sm:p-7 shadow-xl border border-slate-200/80 space-y-6">
                            <h3 className="text-lg font-serif font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
                                <span>Booking Summary</span>
                                <Sparkles className="w-4 h-4 text-accent" />
                            </h3>

                            {/* Booking Quick Specs */}
                            <div className="space-y-2.5 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Date:</span>
                                    <span className="font-bold text-slate-800">{selectedDate}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Time:</span>
                                    <span className="font-bold text-slate-800">{selectedTime} ({durationHours}h)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Guests:</span>
                                    <span className="font-bold text-slate-800">{numberOfGuests} people</span>
                                </div>
                            </div>

                            {/* Preorder Items List in Summary */}
                            <div>
                                <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400 mb-2">
                                    <span>Pre-Order Items</span>
                                    <span>{Object.keys(preorderCart).length} items</span>
                                </div>

                                {Object.keys(preorderCart).length === 0 ? (
                                    <p className="text-xs text-slate-400 italic py-2">No pre-order items selected.</p>
                                ) : (
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                        {Object.values(preorderCart).map(({ item, quantity }) => (
                                            <div key={item.id} className="flex justify-between items-center text-xs">
                                                <span className="truncate max-w-[160px] text-slate-700 font-medium">
                                                    {quantity}x {item.item_name}
                                                </span>
                                                <span className="font-bold text-slate-900">
                                                    {(item.item_price * quantity).toLocaleString('vi-VN')}₫
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Cost Breakdown */}
                            <div className="pt-4 border-t border-slate-100 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Deposit Fee (Flat):</span>
                                    <span className="font-bold text-slate-900">{depositAmount.toLocaleString('vi-VN')}₫</span>
                                </div>

                                {preorderTotal > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Pre-order Total:</span>
                                        <span className="font-bold text-slate-900">{preorderTotal.toLocaleString('vi-VN')}₫</span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center pt-3 border-t border-slate-200 text-base">
                                    <div>
                                        <p className="font-extrabold text-slate-900">Total Payment</p>
                                        <p className="text-[10px] text-slate-400">Combined Deposit & Pre-orders</p>
                                    </div>
                                    <span className="text-xl font-bold text-primary">
                                        {totalCombinedPayment.toLocaleString('vi-VN')}₫
                                    </span>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="button"
                                onClick={handleProceedToPayment}
                                className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm"
                            >
                                <QrCode className="w-5 h-5" />
                                Proceed to QR Payment
                            </button>

                            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                Secure VietQR instant confirmation
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: MY BOOKINGS */}
            {activeTab === 'my-reservations' && (
                <div className="space-y-6 animate-fade-in">
                    {loadingReservations ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-32 bg-white/60 rounded-3xl animate-pulse" />
                            ))}
                        </div>
                    ) : myReservations.length === 0 ? (
                        <div className="bg-white/80 rounded-[2rem] border border-dashed border-slate-200 p-12 text-center space-y-4">
                            <CalendarDays className="w-12 h-12 text-slate-300 mx-auto" />
                            <h3 className="text-lg font-serif font-bold text-slate-700">No Reservations Yet</h3>
                            <p className="text-sm text-slate-400 max-w-sm mx-auto">You haven't made any dining reservations. Book a table now for an unforgettable meal!</p>
                            <button
                                onClick={() => setActiveTab('book')}
                                className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-md hover:bg-emerald-600 transition-all"
                            >
                                Book Now
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {myReservations.map(res => {
                                const resDate = new Date(res.reservation_date);
                                const isPending = res.status === 'pending';
                                const isAccepted = res.status === 'accepted';
                                const isRejected = res.status === 'rejected';
                                const isCompleted = res.status === 'completed';
                                const isCancelled = res.status === 'cancelled';

                                return (
                                    <div key={res.id} className="bg-white/95 backdrop-blur rounded-[2rem] p-6 shadow-sm border border-slate-200/80 space-y-5 hover:shadow-md transition-all">
                                        
                                        {/* Status Header */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-400">Booking #{res.id}</span>
                                                {isAccepted && (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                        Confirmed
                                                    </span>
                                                )}
                                                {isPending && (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                        <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                                                        Pending Approval
                                                    </span>
                                                )}
                                                {isRejected && (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                                        Rejected
                                                    </span>
                                                )}
                                                {isCompleted && (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                                                        Completed
                                                    </span>
                                                )}
                                                {isCancelled && (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                                                        Cancelled
                                                    </span>
                                                )}
                                            </div>

                                            <span className="text-xs font-bold text-primary">
                                                {res.total_paid?.toLocaleString('vi-VN')}₫ Paid
                                            </span>
                                        </div>

                                        {/* Date and Table Info */}
                                        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl text-xs">
                                            <div>
                                                <p className="text-slate-400">Date & Time</p>
                                                <p className="font-bold text-slate-800 mt-0.5">
                                                    {resDate.toLocaleDateString('en-GB')} at {resDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                <p className="text-[11px] text-slate-500">{res.duration_hours}h duration</p>
                                            </div>

                                            <div>
                                                <p className="text-slate-400">Party Size & Table</p>
                                                <p className="font-bold text-slate-800 mt-0.5">{res.number_of_guests} Guests</p>
                                                <p className="text-[11px] font-semibold text-emerald-600">
                                                    {res.table_number ? `Assigned: ${res.table_number}` : 'Table: Assigning soon'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Assigned Staff (Waiters / Chefs) */}
                                        {res.assigned_staff?.length > 0 && (
                                            <div className="space-y-1.5">
                                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Your Dedicated Staff</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {res.assigned_staff.map(st => (
                                                        <span key={st.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50/80 text-emerald-800 border border-emerald-100">
                                                            <ChefHat className="w-3.5 h-3.5 text-emerald-600" />
                                                            {st.staff_name} ({st.role})
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Pre-order Items */}
                                        {res.preorder_items?.length > 0 && (
                                            <div className="space-y-1.5 pt-2 border-t border-slate-100">
                                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pre-ordered Food</p>
                                                <div className="space-y-1">
                                                    {res.preorder_items.map(item => (
                                                        <div key={item.id} className="flex justify-between text-xs text-slate-700">
                                                            <span>{item.quantity}x {item.item_name}</span>
                                                            <span className="font-medium">{item.subtotal?.toLocaleString('vi-VN')}₫</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Admin Notes */}
                                        {res.admin_notes && (
                                            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 text-xs text-amber-800">
                                                <strong>Note from Restaurant:</strong> {res.admin_notes}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                            {isAccepted ? (
                                                <button
                                                    onClick={() => navigate('/menu')}
                                                    className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                                                >
                                                    <Utensils className="w-3.5 h-3.5" />
                                                    Browse Menu for Extra Items
                                                </button>
                                            ) : (
                                                <span className="text-[11px] text-slate-400">
                                                    {isPending ? 'We will confirm your table shortly' : ''}
                                                </span>
                                            )}

                                            {(isPending || isAccepted) && (
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Are you sure you want to cancel this reservation?')) {
                                                            cancelReservationMutation.mutate(res.id);
                                                        }
                                                    }}
                                                    className="text-xs text-rose-500 hover:text-rose-700 font-semibold"
                                                >
                                                    Cancel Booking
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: WEEKLY CALENDAR */}
            {activeTab === 'calendar' && (
                <div className="space-y-6 animate-fade-in">
                    {/* Navigation Header */}
                    <div className="bg-white/95 backdrop-blur rounded-[2rem] p-5 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handlePrevWeek}
                                className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleTodayWeek}
                                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-100 text-slate-700"
                            >
                                Current Week
                            </button>
                            <button
                                onClick={handleNextWeek}
                                className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="text-center sm:text-right">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Week Range</span>
                            <h3 className="text-lg font-bold text-slate-800 font-serif">
                                {weekDays[0]?.monthName} {weekDays[0]?.dayNum} – {weekDays[6]?.monthName} {weekDays[6]?.dayNum}, {weekDays[0]?.dateObj.getFullYear()}
                            </h3>
                        </div>
                    </div>

                    {/* 7 Days Timeline Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                        {weekDays.map(day => {
                            // Find reservations on this day
                            const dayReservations = (weeklyData?.reservations || []).filter(r => {
                                const rDate = new Date(r.reservation_date).toISOString().split('T')[0];
                                return rDate === day.dateStr;
                            });

                            const isToday = day.dateStr === new Date().toISOString().split('T')[0];

                            return (
                                <div
                                    key={day.dateStr}
                                    className={`bg-white/95 backdrop-blur rounded-2xl p-4 border flex flex-col min-h-[320px] ${
                                        isToday ? 'border-primary shadow-md shadow-emerald-100 ring-2 ring-primary/20' : 'border-slate-200/80'
                                    }`}
                                >
                                    {/* Day Header */}
                                    <div className="text-center pb-3 border-b border-slate-100">
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{day.dayName}</p>
                                        <p className={`text-xl font-bold font-serif ${isToday ? 'text-primary' : 'text-slate-800'}`}>
                                            {day.dayNum}
                                        </p>
                                    </div>

                                    {/* Slot list */}
                                    <div className="flex-1 py-3 space-y-2.5 overflow-y-auto max-h-[360px]">
                                        {dayReservations.length === 0 ? (
                                            <p className="text-[11px] text-slate-300 text-center py-6">Available</p>
                                        ) : (
                                            dayReservations.map(r => {
                                                const timeStr = new Date(r.reservation_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                                const isMine = r.customer_id === user?.id;

                                                return (
                                                    <div
                                                        key={r.id}
                                                        className={`p-2.5 rounded-xl text-xs space-y-1 border ${
                                                            isMine
                                                                ? 'bg-emerald-50 border-primary text-emerald-900 font-semibold'
                                                                : 'bg-slate-50 border-slate-200 text-slate-600'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-bold flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {timeStr}
                                                            </span>
                                                            <span className="text-[10px] uppercase font-bold text-primary">
                                                                {r.table_number || 'TBD'}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] truncate">
                                                            {isMine ? '★ Your Booking' : `${r.number_of_guests} Guests`}
                                                        </p>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/*  VIETQR PAYMENT MODAL                                          */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {isQRModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="text-xl font-serif font-bold text-slate-900">VietQR Deposit Payment</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Scan to complete table reservation</p>
                            </div>
                            <button
                                onClick={() => setIsQRModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 rounded-full"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        {/* VietQR Mock Code */}
                        <div className="flex flex-col items-center bg-slate-50 p-6 rounded-3xl border border-slate-200/80 space-y-4">
                            <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-100">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=VIETQR_RESTAURANT_RES_${totalCombinedPayment}`}
                                    alt="VietQR Payment Code"
                                    className="w-44 h-44 rounded-xl"
                                />
                            </div>

                            <div className="text-center space-y-1">
                                <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Amount to Pay</span>
                                <p className="text-2xl font-bold text-primary font-sans">
                                    {totalCombinedPayment.toLocaleString('vi-VN')}₫
                                </p>
                            </div>
                        </div>

                        {/* Payment Transfer Info */}
                        <div className="space-y-2 text-xs bg-emerald-50/60 p-4 rounded-2xl text-slate-700 border border-emerald-100">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Bank:</span>
                                <span className="font-bold text-slate-900">Vietcombank</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Account No:</span>
                                <span className="font-mono font-bold text-slate-900">9988776655</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Account Name:</span>
                                <span className="font-bold text-slate-900">RIVER SIDE RESTAURANT</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Transfer Note:</span>
                                <span className="font-mono font-bold text-primary">RES {user?.username}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                            <button
                                onClick={handleConfirmPayment}
                                disabled={qrSimulating || createReservationMutation.isPending}
                                className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 text-sm"
                            >
                                {qrSimulating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Verifying Transaction...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" />
                                        I Have Paid / Confirm Booking
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => setIsQRModalOpen(false)}
                                className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-700 font-semibold"
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
