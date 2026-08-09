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
            <div className="mx-auto max-w-4xl space-y-6 py-4">
                <div className="h-24 rounded-[2rem] bg-white/70 animate-pulse" />
                {[1, 2].map(i => (
                    <div key={i} className="h-64 rounded-[1.75rem] bg-white/70 animate-pulse" />
                ))}
            </div>
        );
    }

    /* ── Render ───────────────────────────────────────────────── */
    return (
        <div className="relative mx-auto max-w-4xl space-y-6 pb-8">
            {/* ── Header ──────────────────────────────────────── */}
            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <p className="text-xs font-medium text-emerald-700">Live order tracking</p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Active Orders</h1>
                        <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">Track your dine-in and delivery orders, confirm delivery when needed, and keep the flow of your meal clear.</p>
                    </div>
                    <div className="grid gap-3">
                        <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-lg font-medium text-slate-950">Active</p>
                            <p className="mt-1 text-2xl font-semibold text-slate-900">{visibleOrders.length}</p>
                        </div>            
                    </div>
                </div>
            </section>

            {/* ── Empty state ─────────────────────────────────── */}
            {visibleOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-[1.75rem] border border-slate-200 bg-white py-20 shadow-sm">
                    <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-200">
                        <ClipboardList className="w-10 h-10" />
                    </div>
                    <h2 className="mb-1 text-lg font-semibold text-slate-700">No active orders</h2>
                    <p className="mb-6 text-sm text-slate-500">Place an order from the menu to track it here.</p>
                    <button
                        onClick={() => window.location.href = '/menu'}
                        className="group flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-[0.97]"
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

                        return (
                            <div key={order.id} className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                                {/* ── Gradient strip ──────────────────── */}
                                <div className={`h-1 w-full bg-gradient-to-r ${cfg.strip}`} />

                                <div className="p-5 sm:p-6 space-y-4">
                                    {/* ── Row 1: Order info ───────────────── */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-lg font-bold text-gray-900 tabular-nums">Order #{order.id}</span>

                                                {/* Type badge */}
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border ${isShipping
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                        : 'bg-orange-50 text-orange-700 border-orange-200'
                                                    }`}>
                                                    {isShipping ? <Truck className="w-3.5 h-3.5" /> : <UtensilsCrossed className="w-3.5 h-3.5" />}
                                                    {isShipping ? 'Delivery' : 'Dine-in'}
                                                </span>

                                                {/* Status badge */}
                                                <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-bold rounded-lg bg-${cfg.color}-50 text-${cfg.color}-700 border border-${cfg.color}-200 ${order.status === 'pending_confirmation' ? 'animate-pulse' : ''
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
                                                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.98]"
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
                                            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60"
                                        >
                                            <CheckCircle2 className="w-5 h-5" />
                                            {confirmDeliveryMutation.isPending ? 'Confirming...' : 'Confirm Received'}
                                        </button>
                                    )}

                                    {/* ── Rate Items ────────────────────────── */}
                                    {shouldShowRateButton(order) && (
                                        <button
                                            onClick={() => setRatingOrder(order)}
                                            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.98]"
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
