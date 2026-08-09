import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import {
    ClipboardList, MapPin, CheckCircle2, Clock, CreditCard, DollarSign,
    Wallet, Loader2, Star, UtensilsCrossed, Truck, ChevronDown, ChevronUp,
    Package, Sparkles, ArrowRight
} from 'lucide-react';
import RatingModal from '../../components/RatingModal';
import OrderProgressBar from '../../components/OrderProgressBar';

const PAYMENT_METHODS = [
    { value: 'cash', label: 'Cash', icon: DollarSign },
    { value: 'card', label: 'Card', icon: CreditCard },
    { value: 'digital_wallet', label: 'E-Wallet', icon: Wallet },
];

// Custom header config removed, using new emerald glassmorphic design.
/* ── Status helpers ─────────────────────────────────────────── */
const STATUS_CONFIG = {
    pending: { label: 'Pending', color: 'amber', strip: 'from-amber-400 to-yellow-400' },
    pending_confirmation: { label: 'Awaiting Confirm', color: 'amber', strip: 'from-amber-400 to-orange-400' },
    confirmed: { label: 'Confirmed', color: 'teal', strip: 'from-teal-400 to-emerald-400' },
    paid: { label: 'Paid', color: 'emerald', strip: 'from-emerald-400 to-green-400' },
    queued: { label: 'In Queue', color: 'sky', strip: 'from-sky-400 to-blue-400' },
    preparing: { label: 'Preparing', color: 'blue', strip: 'from-blue-500 to-indigo-500' },
    ready: { label: 'Ready', color: 'indigo', strip: 'from-indigo-500 to-violet-500' },
    served: { label: 'Served', color: 'purple', strip: 'from-purple-500 to-fuchsia-500' },
    delivering: { label: 'Out for Delivery', color: 'cyan', strip: 'from-cyan-400 to-blue-400' },
    delivered: { label: 'Delivered', color: 'emerald', strip: 'from-emerald-500 to-green-500' },
    completed: { label: 'Completed', color: 'green', strip: 'from-green-500 to-emerald-600' },
    cancelled: { label: 'Cancelled', color: 'red', strip: 'from-red-400 to-rose-400' },
};

const getConfig = (status) => STATUS_CONFIG[status] || { label: status, color: 'gray', strip: 'from-gray-300 to-gray-400' };

const createDecorativeBackground = (status, orderType) => {
    const isShipping = orderType === 'shipping';
    const accentA = isShipping ? '#38bdf8' : '#fb923c';
    const accentB = status === 'completed' ? '#34d399' : status === 'delivered' ? '#818cf8' : '#60a5fa';
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 220" fill="none">
            <defs>
                <linearGradient id="g" x1="0" y1="0" x2="720" y2="220" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="${accentA}" stop-opacity="0.28" />
                    <stop offset="0.55" stop-color="${accentB}" stop-opacity="0.16" />
                    <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
                </linearGradient>
                <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="12" />
                </filter>
            </defs>
            <rect width="720" height="220" rx="28" fill="url(#g)" />
            <circle cx="118" cy="64" r="48" fill="${accentA}" fill-opacity="0.22" filter="url(#blur)" />
            <circle cx="570" cy="50" r="78" fill="${accentB}" fill-opacity="0.18" filter="url(#blur)" />
            <circle cx="632" cy="178" r="56" fill="${accentA}" fill-opacity="0.14" filter="url(#blur)" />
            <path d="M-20 174C96 120 188 148 292 114C390 82 470 28 592 60C664 79 706 121 740 138V240H-20V174Z" fill="${accentB}" fill-opacity="0.18" />
            <path d="M28 28H260" stroke="white" stroke-opacity="0.18" stroke-width="2" stroke-linecap="round" />
            <path d="M454 34H678" stroke="white" stroke-opacity="0.15" stroke-width="2" stroke-linecap="round" />
            <path d="M70 182H186" stroke="white" stroke-opacity="0.14" stroke-width="2" stroke-linecap="round" />
        </svg>
    `;
    return `url("data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}")`;
};

export default function CustomerActiveOrderPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [payingOrderId, setPayingOrderId] = useState(null);
    const [selectedMethod, setSelectedMethod] = useState('cash');
    const [ratingOrder, setRatingOrder] = useState(null);
    const [expandedOrders, setExpandedOrders] = useState({});

    /* ── Queries ─────────────────────────────────────────────── */
    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['myActiveOrders', user?.id],
        queryFn: async () => {
            const res = await api.get(`/orders/active/customer/${user.id}`);
            return res.data;
        },
        refetchInterval: 10000,
    });

    const expandedOrderIds = Object.keys(expandedOrders).filter(id => expandedOrders[id]);

    const orderItemsQueries = useQuery({
        queryKey: ['activeOrderItems', expandedOrderIds],
        queryFn: async () => {
            const results = {};
            await Promise.all(
                expandedOrderIds.map(async (orderId) => {
                    const res = await api.get(`/order-items/order/${orderId}`);
                    results[orderId] = res.data;
                })
            );
            return results;
        },
        enabled: expandedOrderIds.length > 0,
    });

    const allOrderItems = orderItemsQueries.data || {};

    const { data: ratingOrderItems = [] } = useQuery({
        queryKey: ['orderItems', ratingOrder?.id],
        queryFn: async () => {
            const res = await api.get(`/order-items/order/${ratingOrder.id}`);
            return res.data;
        },
        enabled: !!ratingOrder,
    });

    /* ── Mutations ───────────────────────────────────────────── */
    const payMutation = useMutation({
        mutationFn: async ({ orderId, method }) => {
            const res = await api.post('/payments/', {
                order_id: orderId,
                payment_method: method,
            });
            const paymentId = res.data.id;
            return api.patch(`/payments/${paymentId}/status?payment_status=completed`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['myActiveOrders']);
            setPayingOrderId(null);
        },
        onError: (err) => {
            alert('Payment failed: ' + (err.response?.data?.detail || err.message));
        },
    });

    const confirmDeliveryMutation = useMutation({
        mutationFn: async (orderId) => {
            return api.patch(`/orders/${orderId}/customer-confirm-delivery`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['myActiveOrders']);
        },
        onError: (err) => {
            alert('Failed to confirm delivery: ' + (err.response?.data?.detail || err.message));
        },
    });

    /* ── Helpers ──────────────────────────────────────────────── */
    const toggleExpand = (orderId) => {
        setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
    };

    useEffect(() => {
        if (orders.length > 0 && Object.keys(expandedOrders).length === 0) {
            setExpandedOrders({ [orders[0].id]: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orders]);

    const shouldShowRateButton = (order) => {
        if (order.status !== 'completed') return false;
        if (localStorage.getItem(`rated_order_${order.id}`) === 'true') return false;
        const skippedAt = localStorage.getItem(`skipped_rating_${order.id}`);
        if (skippedAt) return false;
        const completedAt = new Date(order.updated_at || order.created_at);
        const now = new Date();
        const hoursSinceCompletion = (now - completedAt) / (1000 * 60 * 60);
        if (hoursSinceCompletion > 24) return false;
        return true;
    };

    const shouldShowCompletedOrder = (order) => {
        if (order.status !== 'completed') return true;
        if (isAlreadyRated(order)) return false;
        if (shouldShowRateButton(order)) return true;
        return false;
    };

    const isAlreadyRated = (order) => {
        return localStorage.getItem(`rated_order_${order.id}`) === 'true';
    };

    const getRatingItems = () => {
        if (!ratingOrderItems.length) return [];
        const seen = new Set();
        return ratingOrderItems
            .filter((item) => {
                if (seen.has(item.menu_item_id)) return false;
                seen.add(item.menu_item_id);
                return true;
            })
            .map((item) => ({
                menu_item_id: item.menu_item_id,
                item_name: item.item_name || `Item #${item.menu_item_id}`,
                item_image: item.item_image || null,
            }));
    };

    const visibleOrders = orders
        .filter(shouldShowCompletedOrder)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    /* ── Loading skeleton ────────────────────────────────────── */
    if (isLoading) {
        return (
            <div className="customer-page customer-page-wide py-4">
                <div className="h-32 bg-emerald-50 rounded-[2rem] animate-pulse border border-emerald-100" />
                {[1, 2].map(i => (
                    <div key={i} className="h-64 rounded-[2rem] bg-emerald-50/50 mt-6 animate-pulse border border-emerald-50" />
                ))}
            </div>
        );
    }

    /* ── Render ───────────────────────────────────────────────── */
    return (
        <div className="customer-page customer-page-wide pb-12 relative">
            <div className="absolute inset-0 pointer-events-none vietnam-pattern opacity-10 z-0"></div>
            
            <div className="relative z-10 space-y-8">
                {/* ── Header ──────────────────────────────────────── */}
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-900 to-emerald-950 rounded-[2rem] p-8 shadow-xl shadow-emerald-900/10 border border-emerald-700/50">
                    <div className="absolute inset-0 opacity-30 pointer-events-none vietnam-pattern"></div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-30"></div>
                    <div className="absolute bottom-0 left-0 w-56 h-56 bg-emerald-500 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 opacity-20"></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                                <ClipboardList className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight font-serif">Active Orders</h1>
                                <p className="text-sm text-emerald-100/80 mt-1">Track your dine-in & delivery orders in real-time</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-xl px-5 py-3 border border-white/20 shadow-inner">
                            <Package className="w-5 h-5 text-emerald-200" />
                            <span className="text-lg font-bold text-white tabular-nums">{visibleOrders.length}</span>
                            <span className="text-sm text-emerald-100/80 font-medium hidden sm:inline">Active</span>
                        </div>
                    </div>
                </div>

                {/* ── Empty state ─────────────────────────────────── */}
                {visibleOrders.length === 0 ? (
                    <div className="relative overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/80 px-6 py-24 text-center shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl z-10 mt-8">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2 opacity-50"></div>
                        <div className="relative mx-auto flex flex-col items-center justify-center">
                            <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-emerald-50 shadow-inner">
                                <ClipboardList className="w-12 h-12 text-emerald-200" />
                            </div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-700/75">Order Tracker</p>
                            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 font-serif">No active orders</h2>
                            <p className="mt-4 max-w-md text-sm leading-6 text-slate-500">You don't have any orders currently being prepared. Place an order from the menu to track it here.</p>
                            <button
                                onClick={() => window.location.href = '/menu'}
                                className="mt-10 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-3.5 font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-300"
                            >
                                Browse Menu
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {visibleOrders.map((order) => {
                            const isShipping = order.order_type === 'shipping';
                            const isDelivered = order.status === 'delivered';
                            const isPaid = order.status === 'paid';
                            const isCompleted = order.status === 'completed';
                            const isPayingThis = payingOrderId === order.id;
                            const isExpanded = expandedOrders[order.id];
                            const items = allOrderItems[order.id] || [];
                            const cfg = getConfig(order.status);
                            const cardBackgroundImage = createDecorativeBackground(order.status, order.order_type);

                            return (
                                <div
                                    key={order.id}
                                    className="group relative rounded-[2rem] border border-white/70 bg-white/80 p-6 sm:p-8 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl transition-all hover:shadow-[0_20px_40px_rgba(15,23,42,0.1)] hover:-translate-y-1 overflow-hidden"
                                >
                                    <div className="absolute inset-0 pointer-events-none vietnam-pattern opacity-[0.03]"></div>
                                    <div
                                        className="absolute inset-0 bg-center bg-cover opacity-50 pointer-events-none mix-blend-multiply"
                                        style={{ backgroundImage: cardBackgroundImage }}
                                        aria-hidden="true"
                                    />
                                    
                                    <div className="relative z-10 space-y-6">
                                        {/* ── Row 1: Order info ───────────────── */}
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <span className="text-2xl font-bold text-slate-900 font-serif tabular-nums tracking-tight">Order #{order.id}</span>

                                                    {/* Type badge */}
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border ${isShipping
                                                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                                                            : 'bg-orange-50 text-orange-700 border-orange-200'
                                                        }`}>
                                                        {isShipping ? <Truck className="w-4 h-4" /> : <UtensilsCrossed className="w-4 h-4" />}
                                                        {isShipping ? 'Delivery' : 'Dine-in'}
                                                    </span>

                                                    {/* Status badge */}
                                                    <span className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-xl bg-${cfg.color}-50 text-${cfg.color}-700 border border-${cfg.color}-200 ${order.status === 'pending_confirmation' ? 'animate-pulse' : ''
                                                        }`}>
                                                        {cfg.label}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mt-2">
                                                    <Clock className="w-4 h-4" />
                                                    {new Date(order.created_at).toLocaleString()}
                                                </p>
                                            </div>

                                            {/* Total */}
                                            <div className="text-right shrink-0 bg-emerald-50/80 px-4 py-2 rounded-2xl border border-emerald-100">
                                                <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-700/70 font-bold mb-0.5">Total</p>
                                                <p className="text-xl font-bold text-emerald-700 tabular-nums">
                                                    {Number(order.total_amount).toLocaleString("vi-VN")}đ
                                                </p>
                                            </div>
                                        </div>

                                        {/* ── Location info ───────────────────── */}
                                        {isShipping ? (
                                            <div className="flex items-start gap-3 bg-sky-50/70 rounded-2xl px-5 py-4 border border-sky-100/50 backdrop-blur-sm">
                                                <MapPin className="w-5 h-5 text-sky-600 shrink-0" />
                                                <p className="text-sm font-medium text-sky-900 leading-relaxed">{order.shipping_address || 'No address provided'}</p>
                                            </div>
                                        ) : order.table_id && (
                                            <div className="flex items-start gap-3 bg-orange-50/70 rounded-2xl px-5 py-4 border border-orange-100/50 backdrop-blur-sm">
                                                <UtensilsCrossed className="w-5 h-5 text-orange-600 shrink-0" />
                                                <p className="text-sm font-bold text-orange-900">Table {order.table_id}</p>
                                            </div>
                                        )}

                                        {/* ── Progress Bar ─────────────────────── */}
                                        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-slate-200/60 shadow-sm">
                                            <OrderProgressBar
                                                status={order.status}
                                                orderType={order.order_type}
                                            />
                                        </div>

                                        {/* ── Expandable Items ─────────────────── */}
                                        <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
                                            <button
                                                onClick={() => toggleExpand(order.id)}
                                                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50/80 transition-all text-sm font-bold text-slate-700"
                                                aria-expanded={isExpanded}
                                            >
                                                <span className="flex items-center gap-3">
                                                    <Package className="w-5 h-5 text-slate-400" />
                                                    Order Items
                                                    {items.length > 0 && (
                                                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-lg font-bold">{items.length} items</span>
                                                    )}
                                                </span>
                                                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                            </button>

                                            {isExpanded && (
                                                <div className="px-5 pb-5 pt-1 space-y-3">
                                                    {items.length > 0 ? items.map((item) => (
                                                        <div key={item.id} className="flex items-center gap-4 px-4 py-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all">
                                                            {item.item_image ? (
                                                                <img
                                                                    src={item.item_image}
                                                                    alt={item.item_name}
                                                                    className="w-14 h-14 rounded-xl object-cover shadow-sm border border-slate-100"
                                                                    loading="lazy"
                                                                />
                                                            ) : (
                                                                <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                                                                    <UtensilsCrossed className="w-6 h-6 text-slate-300" />
                                                                </div>
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-base font-bold text-slate-800 truncate">{item.item_name}</p>
                                                                <p className="text-sm font-medium text-slate-500 mt-0.5">Quantity: <span className="text-emerald-600 font-bold">{item.quantity}</span></p>
                                                            </div>
                                                            <p className="text-base font-bold text-slate-800 tabular-nums">
                                                                {Number(item.subtotal).toLocaleString("vi-VN")}đ
                                                            </p>
                                                        </div>
                                                    )) : (
                                                        <div className="flex items-center justify-center gap-3 py-6 text-sm font-medium text-slate-400 bg-white rounded-xl border border-slate-100">
                                                            <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                                                            Loading items...
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* ── Payment Section ──────────────────── */}
                                        {isDelivered && !order.payment_method && (
                                            <div className="pt-2">
                                                {!isPayingThis ? (
                                                    <button
                                                        onClick={() => setPayingOrderId(order.id)}
                                                        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                                                    >
                                                        <CreditCard className="w-5 h-5" />
                                                        Pay Now
                                                    </button>
                                                ) : (
                                                    <div className="border border-emerald-200 rounded-2xl p-6 bg-white/80 backdrop-blur-md shadow-lg">
                                                        <p className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                                                            <CreditCard className="w-5 h-5 text-emerald-600" />
                                                            Select Payment Method
                                                        </p>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            {PAYMENT_METHODS.map((m) => {
                                                                const MIcon = m.icon;
                                                                const active = selectedMethod === m.value;
                                                                return (
                                                                    <button
                                                                        key={m.value}
                                                                        onClick={() => setSelectedMethod(m.value)}
                                                                        className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 text-sm font-bold transition-all ${active
                                                                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                                                                            : 'border-slate-100 bg-white text-slate-500 hover:border-emerald-200 hover:bg-slate-50'
                                                                            }`}
                                                                    >
                                                                        <MIcon className="w-6 h-6" />
                                                                        {m.label}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                        <div className="flex gap-3 mt-6">
                                                            <button
                                                                onClick={() => setPayingOrderId(null)}
                                                                className="flex-1 py-3.5 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    payMutation.mutate({ orderId: order.id, method: selectedMethod })
                                                                }
                                                                disabled={payMutation.isPending}
                                                                className="flex-[2] py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
                                                            >
                                                                {payMutation.isPending ? (
                                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                                ) : (
                                                                    'Confirm Payment'
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* ── Paid confirmation ────────────────── */}
                                        {(isPaid || isCompleted) && order.payment_method && (
                                            <div className="flex items-center gap-3 bg-emerald-50 rounded-2xl px-5 py-4 border border-emerald-200/60 shadow-sm">
                                                <div className="p-1.5 bg-emerald-100 rounded-full">
                                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                                </div>
                                                <span className="text-sm font-medium text-emerald-900">
                                                    Payment completed via <span className="font-bold capitalize">{order.payment_method?.replace('_', ' ')}</span>
                                                </span>
                                            </div>
                                        )}

                                        {/* ── Confirm Delivery ─────────────────── */}
                                        {order.status === 'delivered' && order.order_type === 'shipping' && (
                                            <button
                                                onClick={() => confirmDeliveryMutation.mutate(order.id)}
                                                disabled={confirmDeliveryMutation.isPending}
                                                className="w-full mt-2 py-4 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-sky-200 flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-60"
                                            >
                                                <CheckCircle2 className="w-5 h-5" />
                                                {confirmDeliveryMutation.isPending ? 'Confirming...' : 'Confirm Received'}
                                            </button>
                                        )}

                                        {/* ── Rate Items ────────────────────────── */}
                                        {shouldShowRateButton(order) && (
                                            <button
                                                onClick={() => setRatingOrder(order)}
                                                className="w-full mt-2 py-4 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                                            >
                                                <Sparkles className="w-5 h-5" />
                                                Rate Your Experience
                                            </button>
                                        )}

                                        {/* ── Already rated badge ──────────────── */}
                                        {(isPaid || isCompleted) && isAlreadyRated(order) && (
                                            <div className="flex items-center gap-3 bg-amber-50 rounded-2xl px-5 py-4 border border-amber-200/60 shadow-sm mt-2">
                                                <div className="p-1.5 bg-amber-100 rounded-full">
                                                    <Star className="w-5 h-5 fill-amber-500 text-amber-500 shrink-0" />
                                                </div>
                                                <span className="font-bold text-amber-800">Thanks for your rating!</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── Page Footer ───────────────────────────────── */}
                <footer className="relative overflow-hidden rounded-[2rem] border border-emerald-700/50 bg-gradient-to-br from-emerald-800 via-emerald-900 to-emerald-950 text-white shadow-xl p-8 mt-12">
                    <div className="absolute inset-0 pointer-events-none vietnam-pattern opacity-10"></div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-20"></div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-300/80 mb-2">Customer Dashboard</p>
                            <h2 className="text-2xl font-bold tracking-tight font-serif text-white">Keep track of every order.</h2>
                            <p className="mt-2 text-sm text-emerald-100/70 max-w-md">Your active orders refresh automatically while the kitchen and delivery team update status.</p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => window.location.href = '/menu'}
                                className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-bold text-emerald-900 transition-all hover:scale-[1.02] shadow-lg shadow-black/10"
                            >
                                Browse Menu
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-white/20 backdrop-blur-md"
                            >
                                Refresh Orders
                            </button>
                        </div>
                    </div>
                </footer>

                {/* ── Rating Modal ─────────────────────────────────── */}
                {ratingOrder && (
                    <RatingModal
                        isOpen={!!ratingOrder}
                        onClose={() => setRatingOrder(null)}
                        orderId={ratingOrder.id}
                        customerId={user.id}
                        orderItems={getRatingItems()}
                    />
                )}
            </div>
        </div>
    );
}
