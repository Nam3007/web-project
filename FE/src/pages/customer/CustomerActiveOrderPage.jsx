import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import {
    ClipboardList, MapPin, CheckCircle2, Clock, CreditCard, DollarSign,
    Wallet, Loader2, Star, UtensilsCrossed, Truck, ChevronDown,
    Package, Sparkles, ArrowRight
} from 'lucide-react';
import RatingModal from '../../components/RatingModal';
import OrderProgressBar from '../../components/OrderProgressBar';
import { WarmPageWrapper, PageHero, WarmCard, GoldButton, WarmEmptyState, FlourishOrnament } from '../../components/RestaurantDecorations';

const PAYMENT_METHODS = [
    { value: 'cash', label: 'Cash', icon: DollarSign },
    { value: 'card', label: 'Card', icon: CreditCard },
    { value: 'digital_wallet', label: 'E-Wallet', icon: Wallet },
];

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
            <WarmPageWrapper>
                <div className="max-w-3xl mx-auto space-y-6 py-4 animate-pulse">
                    <div className="h-28 bg-r-warm/10 rounded-2xl" />
                    {[1, 2].map(i => (
                        <div key={i} className="h-64 bg-r-warm/10 rounded-2xl" />
                    ))}
                </div>
            </WarmPageWrapper>
        );
    }

    /* ── Render ───────────────────────────────────────────────── */
    return (
        <WarmPageWrapper pattern="dots">
            <div className="max-w-3xl mx-auto space-y-6 pb-8">
                {/* ── Header ──────────────────────────────────────── */}
                <PageHero
                    title="Active Orders"
                    subtitle="Track your dine-in & delivery orders in real time"
                    icon={ClipboardList}
                    accentWord="Active"
                >
                    <div className="flex items-center gap-2 bg-r-gold/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-r-gold/20">
                        <Package className="w-4 h-4 text-r-gold" />
                        <span className="text-sm font-bold text-r-cream tabular-nums font-sans">{visibleOrders.length}</span>
                        <span className="text-xs text-r-cream/40 hidden sm:inline font-sans">active</span>
                    </div>
                </PageHero>

                {/* ── Empty state ─────────────────────────────────── */}
                {visibleOrders.length === 0 ? (
                    <WarmEmptyState
                        icon={ClipboardList}
                        title="No active orders"
                        subtitle="Place an order from the menu to track it here"
                        action={
                            <GoldButton
                                onClick={() => window.location.href = '/menu'}
                                className="px-6 py-3 text-sm"
                            >
                                Browse Menu
                                <ArrowRight className="w-4 h-4" />
                            </GoldButton>
                        }
                    />
                ) : (
                    <div className="space-y-5">
                        {visibleOrders.map((order, idx) => {
                            const isShipping = order.order_type === 'shipping';
                            const isDelivered = order.status === 'delivered';
                            const isPaid = order.status === 'paid';
                            const isCompleted = order.status === 'completed';
                            const isPayingThis = payingOrderId === order.id;
                            const isExpanded = expandedOrders[order.id];
                            const items = allOrderItems[order.id] || [];
                            const cfg = getConfig(order.status);

                            return (
                                <div
                                    key={order.id}
                                    className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-r-border/40 shadow-sm hover:shadow-lg hover:border-r-gold/20 hover:shadow-r-gold/5 transition-all duration-300 overflow-hidden animate-fade-in-up"
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                >
                                    {/* ── Gradient strip ──────────────────── */}
                                    <div className={`h-1 w-full bg-gradient-to-r ${cfg.strip}`} />

                                    <div className="p-5 sm:p-6 space-y-4">
                                        {/* ── Row 1: Order info ───────────────── */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-lg font-serif font-bold text-r-text tabular-nums">Order #{order.id}</span>

                                                    {/* Type badge */}
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border font-sans ${
                                                        isShipping
                                                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                            : 'bg-orange-50 text-orange-700 border-orange-200'
                                                    }`}>
                                                        {isShipping ? <Truck className="w-3.5 h-3.5" /> : <UtensilsCrossed className="w-3.5 h-3.5" />}
                                                        {isShipping ? 'Delivery' : 'Dine-in'}
                                                    </span>

                                                    {/* Status badge */}
                                                    <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-bold rounded-lg font-sans bg-${cfg.color}-50 text-${cfg.color}-700 border border-${cfg.color}-200 ${
                                                        order.status === 'pending_confirmation' ? 'animate-pulse' : ''
                                                    }`}>
                                                        {cfg.label}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-r-muted/60 flex items-center gap-1.5 mt-1.5 font-sans">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {new Date(order.created_at).toLocaleString()}
                                                </p>
                                            </div>

                                            {/* Total */}
                                            <div className="text-right shrink-0">
                                                <p className="text-[10px] uppercase tracking-wider text-r-muted/60 font-semibold font-sans">Total</p>
                                                <p className="text-xl font-extrabold text-r-gold tabular-nums font-sans">
                                                    {Number(order.total_amount).toLocaleString("vi-VN")}đ
                                                </p>
                                            </div>
                                        </div>

                                        {/* ── Location info ───────────────────── */}
                                        {isShipping ? (
                                            <div className="flex items-start gap-3 bg-blue-50/50 rounded-xl px-4 py-3 border border-blue-100/50">
                                                <MapPin className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                                                <p className="text-sm text-r-text leading-relaxed font-sans">{order.shipping_address || 'No address'}</p>
                                            </div>
                                        ) : order.table_id && (
                                            <div className="flex items-start gap-3 bg-r-gold/5 rounded-xl px-4 py-3 border border-r-gold/15">
                                                <UtensilsCrossed className="w-4 h-4 text-r-gold mt-0.5 shrink-0" />
                                                <p className="text-sm font-medium text-r-text font-sans">Table {order.table_id}</p>
                                            </div>
                                        )}

                                        {/* ── Progress Bar ─────────────────────── */}
                                        <div className="bg-r-cream/50 rounded-xl p-4 border border-r-border/30">
                                            <OrderProgressBar
                                                status={order.status}
                                                orderType={order.order_type}
                                            />
                                        </div>

                                        {/* ── Expandable Items ─────────────────── */}
                                        <button
                                            onClick={() => toggleExpand(order.id)}
                                            className="w-full flex items-center justify-between px-4 py-3 bg-r-cream/50 hover:bg-r-cream rounded-xl transition-all text-sm font-semibold text-r-text group/btn active:scale-[0.99] font-sans border border-r-border/20"
                                            aria-expanded={isExpanded}
                                            aria-label={`Toggle order items for order ${order.id}`}
                                        >
                                            <span className="flex items-center gap-2">
                                                <Package className="w-4 h-4 text-r-muted" />
                                                Order Items
                                                {items.length > 0 && (
                                                    <span className="text-[10px] bg-r-gold/15 text-r-gold px-1.5 py-0.5 rounded-md font-bold">{items.length}</span>
                                                )}
                                            </span>
                                            <ChevronDown className={`w-4 h-4 text-r-muted transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                        </button>

                                        {isExpanded && (
                                            <div className="space-y-2 transition-all duration-200">
                                                {items.length > 0 ? items.map((item) => (
                                                    <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 bg-r-cream/30 rounded-xl hover:bg-r-cream/50 transition-colors border border-r-border/10">
                                                        {item.item_image ? (
                                                            <img
                                                                src={item.item_image}
                                                                alt={item.item_name}
                                                                className="w-11 h-11 rounded-xl object-cover shadow-sm border border-r-border/30"
                                                                loading="lazy"
                                                            />
                                                        ) : (
                                                            <div className="w-11 h-11 rounded-xl bg-r-cream flex items-center justify-center border border-r-border/30">
                                                                <UtensilsCrossed className="w-5 h-5 text-r-muted/40" />
                                                            </div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-r-text truncate font-sans">{item.item_name}</p>
                                                            <p className="text-xs text-r-muted font-sans">×{item.quantity}</p>
                                                        </div>
                                                        <p className="text-sm font-bold text-r-gold tabular-nums font-sans">
                                                            {Number(item.subtotal).toLocaleString("vi-VN")}đ
                                                        </p>
                                                    </div>
                                                )) : (
                                                    <div className="flex items-center justify-center gap-2 py-4 text-sm text-r-muted font-sans">
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
                                                    <GoldButton
                                                        onClick={() => setPayingOrderId(order.id)}
                                                        className="w-full py-3.5 text-sm"
                                                    >
                                                        <CreditCard className="w-5 h-5" />
                                                        Pay Now
                                                    </GoldButton>
                                                ) : (
                                                    <div className="border-2 border-r-gold/30 rounded-xl p-4 space-y-3 bg-r-gold/5">
                                                        <p className="text-sm font-bold text-r-text font-sans">Select Payment Method</p>
                                                        <div className="flex gap-2">
                                                            {PAYMENT_METHODS.map((m) => {
                                                                const MIcon = m.icon;
                                                                const active = selectedMethod === m.value;
                                                                return (
                                                                    <button
                                                                        key={m.value}
                                                                        onClick={() => setSelectedMethod(m.value)}
                                                                        className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-bold transition-all active:scale-[0.97] font-sans ${active
                                                                            ? 'border-r-gold bg-r-gold text-r-dark shadow-md shadow-r-gold/20'
                                                                            : 'border-r-border bg-white text-r-text hover:border-r-gold/30'
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
                                                                className="flex-1 py-2.5 border border-r-border rounded-xl text-sm font-medium text-r-muted hover:bg-r-cream active:scale-[0.98] transition-all font-sans"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <GoldButton
                                                                onClick={() =>
                                                                    payMutation.mutate({ orderId: order.id, method: selectedMethod })
                                                                }
                                                                disabled={payMutation.isPending}
                                                                className="flex-1 py-2.5 text-sm"
                                                            >
                                                                {payMutation.isPending ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    'Confirm Payment'
                                                                )}
                                                            </GoldButton>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {/* ── Paid confirmation ────────────────── */}
                                        {(isPaid || isCompleted) && order.payment_method && (
                                            <div className="flex items-center gap-2.5 text-sm bg-green-50/70 rounded-xl px-4 py-3 border border-green-100/50 font-sans">
                                                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                                <span className="text-r-text">
                                                    Payment complete via <span className="font-bold capitalize text-green-700">{order.payment_method?.replace('_', ' ')}</span>
                                                </span>
                                            </div>
                                        )}

                                        {/* ── Confirm Delivery ─────────────────── */}
                                        {order.status === 'delivered' && order.order_type === 'shipping' && (
                                            <GoldButton
                                                onClick={() => confirmDeliveryMutation.mutate(order.id)}
                                                disabled={confirmDeliveryMutation.isPending}
                                                variant="dark"
                                                className="w-full py-3.5 text-sm"
                                            >
                                                <CheckCircle2 className="w-5 h-5" />
                                                {confirmDeliveryMutation.isPending ? 'Confirming...' : 'Confirm Received'}
                                            </GoldButton>
                                        )}

                                        {/* ── Rate Items ────────────────────────── */}
                                        {shouldShowRateButton(order) && (
                                            <button
                                                onClick={() => setRatingOrder(order)}
                                                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-200/30 flex items-center justify-center gap-2 active:scale-[0.98] font-sans text-sm"
                                            >
                                                <Sparkles className="w-5 h-5" />
                                                Rate Your Experience
                                            </button>
                                        )}

                                        {/* ── Already rated badge ──────────────── */}
                                        {(isPaid || isCompleted) && isAlreadyRated(order) && (
                                            <div className="flex items-center gap-2.5 text-sm bg-amber-50/70 rounded-xl px-4 py-3 border border-amber-100/50 font-sans">
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
        </WarmPageWrapper>
    );
}
