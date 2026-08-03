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

// Keep this empty unless a branded hero image is required.
const ACTIVE_ORDER_HEADER_BACKGROUND_IMAGE = '';
const ACTIVE_ORDER_HEADER_OVERLAY = 'linear-gradient(135deg, rgba(15, 23, 42, 0.94) 0%, rgba(30, 58, 138, 0.88) 55%, rgba(49, 46, 129, 0.86) 100%)';

/* ── Status helpers ─────────────────────────────────────────── */
const STATUS_CONFIG = {
    pending:              { label: 'Pending',            color: 'amber',   strip: 'from-amber-400 to-yellow-400' },
    pending_confirmation: { label: 'Awaiting Confirm',   color: 'amber',   strip: 'from-amber-400 to-orange-400' },
    confirmed:            { label: 'Confirmed',          color: 'teal',    strip: 'from-teal-400 to-emerald-400' },
    paid:                 { label: 'Paid',               color: 'emerald', strip: 'from-emerald-400 to-green-400' },
    queued:               { label: 'In Queue',           color: 'sky',     strip: 'from-sky-400 to-blue-400' },
    preparing:            { label: 'Preparing',          color: 'blue',    strip: 'from-blue-500 to-indigo-500' },
    ready:                { label: 'Ready',              color: 'indigo',  strip: 'from-indigo-500 to-violet-500' },
    served:               { label: 'Served',             color: 'purple',  strip: 'from-purple-500 to-fuchsia-500' },
    delivering:           { label: 'Out for Delivery',   color: 'cyan',    strip: 'from-cyan-400 to-blue-400' },
    delivered:            { label: 'Delivered',          color: 'emerald', strip: 'from-emerald-500 to-green-500' },
    completed:            { label: 'Completed',          color: 'green',   strip: 'from-green-500 to-emerald-600' },
    cancelled:            { label: 'Cancelled',          color: 'red',     strip: 'from-red-400 to-rose-400' },
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
    const shouldShowHeaderBackgroundImage = Boolean(ACTIVE_ORDER_HEADER_BACKGROUND_IMAGE.trim());
    const headerBackgroundStyle = shouldShowHeaderBackgroundImage
        ? {
            backgroundImage: `${ACTIVE_ORDER_HEADER_OVERLAY}, url(${ACTIVE_ORDER_HEADER_BACKGROUND_IMAGE})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        }
        : undefined;

    /* ── Loading skeleton ────────────────────────────────────── */
    if (isLoading) {
        return (
            <div className="customer-page customer-page-regular py-4">
                <div className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
                {[1, 2].map(i => (
                    <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
                ))}
            </div>
        );
    }

    /* ── Render ───────────────────────────────────────────────── */
    return (
        <div className="customer-page customer-page-regular pb-8">
            {/* ── Header ──────────────────────────────────────── */}
            <div
                className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 shadow-xl border border-white/5"
                style={headerBackgroundStyle}
            >
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                    <div className="absolute bottom-0 left-0 w-56 h-56 bg-indigo-400 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
                    <div className="absolute top-1/2 right-1/3 w-44 h-44 bg-violet-400 rounded-full blur-3xl -translate-y-1/2 opacity-70" />
                </div>
                <div
                    className="absolute inset-0 opacity-[0.08] pointer-events-none [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:18px_18px]"
                    aria-hidden="true"
                />
                <Sparkles className="absolute right-5 top-5 w-5 h-5 text-white/35" aria-hidden="true" />
                <Sparkles className="absolute left-6 bottom-4 w-4 h-4 text-blue-200/35" aria-hidden="true" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent pointer-events-none" aria-hidden="true" />
                <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/[0.03] pointer-events-none" aria-hidden="true" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10 pointer-events-none" aria-hidden="true" />
                <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-2xl" aria-hidden="true" />
                <div className="absolute left-0 right-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" aria-hidden="true" />
                <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" aria-hidden="true" />
                <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" aria-hidden="true" />
                <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/12 to-transparent" aria-hidden="true" />
                <div className="absolute right-8 bottom-4 text-[10px] text-blue-100/60 font-semibold tracking-wide uppercase pointer-events-none">
                    Live updates every 10s
                </div>
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                            <ClipboardList className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Active Orders</h1>
                            <p className="text-sm text-blue-200/70 mt-0.5">Track your dine-in & delivery orders</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/10">
                        <Package className="w-4 h-4 text-blue-300" />
                        <span className="text-sm font-bold text-white tabular-nums">{visibleOrders.length}</span>
                        <span className="text-xs text-blue-200/60 hidden sm:inline">active</span>
                    </div>
                </div>
            </div>

            {/* ── Empty state ─────────────────────────────────── */}
            {visibleOrders.length === 0 ? (
                <div className="customer-card flex flex-col items-center justify-center py-20">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-5">
                        <ClipboardList className="w-10 h-10 text-gray-200" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-700 mb-1">No active orders</h2>
                    <p className="text-sm text-gray-400 mb-6">Place an order from the menu to track it here</p>
                    <button
                        onClick={() => window.location.href = '/menu'}
                        className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-[0.97]"
                    >
                        Browse Menu
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            ) : (
                <div className="space-y-5">
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
                                className="group customer-card relative hover:shadow-lg hover:border-gray-200 transition-all duration-300 overflow-hidden"
                            >
                                <div
                                    className="absolute inset-0 bg-center bg-cover opacity-90 pointer-events-none"
                                    style={{ backgroundImage: cardBackgroundImage }}
                                    aria-hidden="true"
                                />
                                <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/82 to-white/95 pointer-events-none" aria-hidden="true" />

                                {/* ── Gradient strip ──────────────────── */}
                                <div className={`h-1 w-full bg-gradient-to-r ${cfg.strip}`} />

                                <div className="relative z-10 p-5 sm:p-6 space-y-4">
                                    {/* ── Row 1: Order info ───────────────── */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-lg font-bold text-gray-900 tabular-nums">Order #{order.id}</span>

                                                {/* Type badge */}
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border ${
                                                    isShipping
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                        : 'bg-orange-50 text-orange-700 border-orange-200'
                                                }`}>
                                                    {isShipping ? <Truck className="w-3.5 h-3.5" /> : <UtensilsCrossed className="w-3.5 h-3.5" />}
                                                    {isShipping ? 'Delivery' : 'Dine-in'}
                                                </span>

                                                {/* Status badge */}
                                                <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-bold rounded-lg bg-${cfg.color}-50 text-${cfg.color}-700 border border-${cfg.color}-200 ${
                                                    order.status === 'pending_confirmation' ? 'animate-pulse' : ''
                                                }`}>
                                                    {cfg.label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-1.5">
                                                <Clock className="w-3.5 h-3.5" />
                                                {new Date(order.created_at).toLocaleString()}
                                            </p>
                                        </div>

                                        {/* Total */}
                                        <div className="text-right shrink-0">
                                            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Total</p>
                                            <p className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 tabular-nums">
                                                {Number(order.total_amount).toLocaleString("vi-VN")}đ
                                            </p>
                                        </div>
                                    </div>

                                    {/* ── Location info ───────────────────── */}
                                    {isShipping ? (
                                        <div className="flex items-start gap-3 bg-blue-50/70 rounded-xl px-4 py-3 border border-blue-100">
                                            <MapPin className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                                            <p className="text-sm text-gray-700 leading-relaxed">{order.shipping_address || 'No address'}</p>
                                        </div>
                                    ) : order.table_id && (
                                        <div className="flex items-start gap-3 bg-orange-50/70 rounded-xl px-4 py-3 border border-orange-100">
                                            <UtensilsCrossed className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                                            <p className="text-sm font-medium text-gray-700">Table {order.table_id}</p>
                                        </div>
                                    )}

                                    {/* ── Progress Bar ─────────────────────── */}
                                    <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-100">
                                        <OrderProgressBar
                                            status={order.status}
                                            orderType={order.order_type}
                                        />
                                    </div>

                                    {/* ── Expandable Items ─────────────────── */}
                                    <button
                                        onClick={() => toggleExpand(order.id)}
                                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all text-sm font-semibold text-gray-600 group/btn active:scale-[0.99]"
                                        aria-expanded={isExpanded}
                                        aria-label={`Toggle order items for order ${order.id}`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Package className="w-4 h-4 text-gray-400" />
                                            Order Items
                                            {items.length > 0 && (
                                                <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-md font-bold">{items.length}</span>
                                            )}
                                        </span>
                                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isExpanded && (
                                        <div className="space-y-2 transition-all duration-200">
                                            {items.length > 0 ? items.map((item) => (
                                                <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                                    {item.item_image ? (
                                                        <img
                                                            src={item.item_image}
                                                            alt={item.item_name}
                                                            className="w-11 h-11 rounded-xl object-cover shadow-sm border border-gray-100"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div className="w-11 h-11 rounded-xl bg-gray-200 flex items-center justify-center">
                                                            <UtensilsCrossed className="w-5 h-5 text-gray-400" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-gray-800 truncate">{item.item_name}</p>
                                                        <p className="text-xs text-gray-400">×{item.quantity}</p>
                                                    </div>
                                                    <p className="text-sm font-bold text-gray-700 tabular-nums">
                                                        {Number(item.subtotal).toLocaleString("vi-VN")}đ
                                                    </p>
                                                </div>
                                            )) : (
                                                <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-400">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Loading items...
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ── Payment Section ──────────────────── */}
                                    {isDelivered && !order.payment_method && (
                                        <>
                                            {!isPayingThis ? (
                                                <button
                                                    onClick={() => setPayingOrderId(order.id)}
                                                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-200/50 flex items-center justify-center gap-2 active:scale-[0.98]"
                                                >
                                                    <CreditCard className="w-5 h-5" />
                                                    Pay Now
                                                </button>
                                            ) : (
                                                <div className="border-2 border-emerald-200 rounded-xl p-4 space-y-3 bg-emerald-50/50">
                                                    <p className="text-sm font-bold text-emerald-800">Select Payment Method</p>
                                                    <div className="flex gap-2">
                                                        {PAYMENT_METHODS.map((m) => {
                                                            const MIcon = m.icon;
                                                            const active = selectedMethod === m.value;
                                                            return (
                                                                <button
                                                                    key={m.value}
                                                                    onClick={() => setSelectedMethod(m.value)}
                                                                    className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-bold transition-all active:scale-[0.97] ${active
                                                                        ? 'border-emerald-500 bg-emerald-600 text-white shadow-md shadow-emerald-200'
                                                                        : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-300'
                                                                    }`}
                                                                >
                                                                    <MIcon className="w-5 h-5" />
                                                                    {m.label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                    <div className="flex gap-2 pt-1">
                                                        <button
                                                            onClick={() => setPayingOrderId(null)}
                                                            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 active:scale-[0.98] transition-all"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                payMutation.mutate({ orderId: order.id, method: selectedMethod })
                                                            }
                                                            disabled={payMutation.isPending}
                                                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1 disabled:opacity-60 active:scale-[0.98]"
                                                        >
                                                            {payMutation.isPending ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                'Confirm Payment'
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* ── Paid confirmation ────────────────── */}
                                    {(isPaid || isCompleted) && order.payment_method && (
                                        <div className="flex items-center gap-2.5 text-sm bg-emerald-50/70 rounded-xl px-4 py-3 border border-emerald-100">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                            <span className="text-gray-600">
                                                Payment complete via <span className="font-bold capitalize text-emerald-700">{order.payment_method?.replace('_', ' ')}</span>
                                            </span>
                                        </div>
                                    )}

                                    {/* ── Confirm Delivery ─────────────────── */}
                                    {order.status === 'delivered' && order.order_type === 'shipping' && (
                                        <button
                                            onClick={() => confirmDeliveryMutation.mutate(order.id)}
                                            disabled={confirmDeliveryMutation.isPending}
                                            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-200/50 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60"
                                        >
                                            <CheckCircle2 className="w-5 h-5" />
                                            {confirmDeliveryMutation.isPending ? 'Confirming...' : 'Confirm Received'}
                                        </button>
                                    )}

                                    {/* ── Rate Items ────────────────────────── */}
                                    {shouldShowRateButton(order) && (
                                        <button
                                            onClick={() => setRatingOrder(order)}
                                            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-200/50 flex items-center justify-center gap-2 active:scale-[0.98]"
                                        >
                                            <Sparkles className="w-5 h-5" />
                                            Rate Your Experience
                                        </button>
                                    )}

                                    {/* ── Already rated badge ──────────────── */}
                                    {(isPaid || isCompleted) && isAlreadyRated(order) && (
                                        <div className="flex items-center gap-2.5 text-sm bg-amber-50/70 rounded-xl px-4 py-3 border border-amber-100">
                                            <Star className="w-5 h-5 fill-amber-400 text-amber-400 shrink-0" />
                                            <span className="font-semibold text-amber-700">Thanks for your rating!</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

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
    );
}
