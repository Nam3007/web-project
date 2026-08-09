import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, Calendar, Crown, Loader, QrCode, Banknote, Clock, Bell, CheckCircle, Star, History } from 'lucide-react';
import RatingModal from '../../components/RatingModal';
import { WarmPageWrapper, SectionHeading, WarmCard, GoldButton, FlourishOrnament } from '../../components/RestaurantDecorations';

const VIP_THRESHOLD = 500;

export default function CustomerOrdersPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [ratingOrder, setRatingOrder] = useState(null); // order object to rate

    // 1. Fetch Orders
    const { data: allOrders = [], isLoading } = useQuery({
        queryKey: ['myOrders'],
        queryFn: async () => {
            const res = await api.get(`/orders/customer/${user.id}`);
            return res.data;
        }
    });

    // 2. Fetch order items for the order being rated
    const { data: orderItems = [] } = useQuery({
        queryKey: ['orderItems', ratingOrder?.id],
        queryFn: async () => {
            const res = await api.get(`/order-items/order/${ratingOrder.id}`);
            return res.data;
        },
        enabled: !!ratingOrder,
    });

    const myOrders = allOrders
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Calculate Total Spent (only paid or completed)
    const totalSpent = myOrders
        .filter(o => o.status === 'paid' || o.status === 'completed')
        .reduce((sum, o) => sum + o.total_amount, 0);

    // Mutation to Request VIP
    const requestVipMutation = useMutation({
        mutationFn: async () => {
            return api.post('/vip-requests/', {
                customer_id: user.id,
                reason: "I love this restaurant! Spent over $" + VIP_THRESHOLD
            });
        },
        onSuccess: () => {
            alert("VIP Request Sent! Please wait for admin approval.");
        },
        onError: (err) => {
            alert(err.response?.data?.detail || "Failed to send request.");
        }
    });

    // Mutation to request order completion (customer signals waiter)
    const requestCompleteMutation = useMutation({
        mutationFn: async (orderId) => {
            return api.patch(`/orders/${orderId}/request-complete`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['myOrders']);
        },
        onError: (err) => {
            alert(err.response?.data?.detail || "Failed to send request.");
        }
    });

    // Check if rating should be shown for a completed order
    const shouldShowRateButton = (order) => {
        // Only for completed dine-in orders
        if (order.status !== 'completed' || order.order_type !== 'dine_in') return false;

        // Check if already rated (localStorage)
        if (localStorage.getItem(`rated_order_${order.id}`) === 'true') return false;

        // Check if skipped
        const skippedAt = localStorage.getItem(`skipped_rating_${order.id}`);
        if (skippedAt) return false;

        // Check 24h window
        const completedAt = new Date(order.updated_at || order.created_at);
        const now = new Date();
        const hoursSinceCompletion = (now - completedAt) / (1000 * 60 * 60);
        if (hoursSinceCompletion > 24) return false;

        return true;
    };

    const isAlreadyRated = (order) => {
        return localStorage.getItem(`rated_order_${order.id}`) === 'true';
    };

    // Build unique items for rating modal
    const getRatingItems = () => {
        if (!orderItems.length) return [];
        // Deduplicate by menu_item_id
        const seen = new Set();
        return orderItems
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

    if (isLoading) {
        return (
            <WarmPageWrapper>
                <div className="max-w-3xl mx-auto space-y-8 animate-pulse">
                    <div className="h-44 bg-r-warm/10 rounded-2xl" />
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-r-warm/10 rounded-2xl" />
                    ))}
                </div>
            </WarmPageWrapper>
        );
    }

    const isVip = user.role === 'vip_customer';
    const progress = Math.min((totalSpent / VIP_THRESHOLD) * 100, 100);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'paid': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'confirmed': return 'bg-teal-50 text-teal-700 border-teal-200';
            case 'preparing': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'ready': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
            case 'served': return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'completed': return 'bg-green-50 text-green-700 border-green-200';
            case 'cancelled': return 'bg-red-50 text-red-600 border-red-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'pending':   return 'Awaiting Payment';
            case 'paid':      return 'Paid — Assigning Chef';
            case 'confirmed': return 'Confirmed — Assigning Chef';
            case 'queued':    return 'In Queue';
            case 'preparing': return 'Being Prepared';
            case 'ready':     return 'Ready — Assigning Staff';
            case 'served':    return 'Served';
            case 'completed': return 'Completed';
            case 'cancelled': return 'Cancelled';
            case 'delivering': return 'Out for Delivery';
            case 'delivered': return 'Delivered';
            default: return status;
        }
    };

    return (
        <WarmPageWrapper pattern="dots">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* ── VIP Status Card ──────────────────────────────── */}
                <div className="relative overflow-hidden bg-gradient-to-br from-r-dark via-r-wood to-r-warm rounded-2xl p-6 md:p-8 text-r-cream shadow-xl grain-overlay">
                    {/* Warm glow effects */}
                    <div className="absolute inset-0">
                        <div className="absolute top-0 right-0 w-56 h-56 bg-r-gold/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-700/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
                    </div>

                    <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-serif font-bold flex items-center gap-3">
                                <Crown className={`w-7 h-7 ${isVip ? 'text-r-gold animate-gentle-float' : 'text-r-cream/30'}`} />
                                {isVip ? 'VIP Member' : 'Member Status'}
                            </h2>
                            <p className="text-r-cream/50 mt-1.5 font-sans text-sm max-w-sm">
                                {isVip
                                    ? "Thank you for being one of our most valued guests!"
                                    : `Spend $${VIP_THRESHOLD} to unlock VIP benefits.`}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-r-cream/30 font-sans uppercase tracking-wider font-semibold">Total Spent</p>
                            <p className="text-3xl md:text-4xl font-bold text-r-gold font-sans tabular-nums">{totalSpent.toLocaleString('vi-VN')}₫</p>
                        </div>
                    </div>

                    {!isVip && (
                        <div className="mt-6 relative z-10">
                            <div className="flex justify-between text-xs mb-2 font-medium text-r-cream/40 font-sans">
                                <span>$0</span>
                                <span>${VIP_THRESHOLD}</span>
                            </div>
                            <div className="h-3 bg-r-cream/10 rounded-full overflow-hidden backdrop-blur-sm border border-r-cream/5">
                                <div
                                    className="h-full bg-gradient-to-r from-r-gold to-r-gold-light transition-all duration-1000 rounded-full"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            {totalSpent >= VIP_THRESHOLD && (
                                <GoldButton
                                    onClick={() => requestVipMutation.mutate()}
                                    disabled={requestVipMutation.isPending}
                                    className="mt-5 w-full py-3 text-sm"
                                >
                                    {requestVipMutation.isPending ? <Loader className="w-5 h-5 animate-spin" /> : <Crown className="w-5 h-5" />}
                                    Request VIP Status
                                </GoldButton>
                            )}
                        </div>
                    )}

                    <FlourishOrnament className="mt-5 opacity-30" size="sm" />

                    {/* Background decoration */}
                    <Crown className="absolute -bottom-6 -right-6 w-36 h-36 text-r-cream/[0.03] rotate-12" />
                </div>

                {/* ── Order History ─────────────────────────────────── */}
                <div className="space-y-6">
                    <SectionHeading
                        title="Order History"
                        subtitle={`${myOrders.length} order${myOrders.length !== 1 ? 's' : ''} placed`}
                        icon={History}
                    />

                    {myOrders.length === 0 ? (
                        <div className="text-center py-14 bg-white/60 backdrop-blur-sm rounded-2xl border border-r-border/40">
                            <ShoppingBag className="w-10 h-10 text-r-muted/30 mx-auto mb-3" />
                            <p className="text-r-muted font-sans">No past orders found.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {[...myOrders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((order, idx) => (
                                <div
                                    key={order.id}
                                    className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-r-border/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-lg hover:border-r-gold/20 hover:shadow-r-gold/5 transition-all duration-300 animate-fade-in"
                                    style={{ animationDelay: `${Math.min(idx * 60, 400)}ms` }}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-r-cream rounded-xl border border-r-border/30">
                                            <ShoppingBag className="w-5 h-5 text-r-muted" />
                                        </div>
                                        <div>
                                            <h3 className="font-serif font-bold text-r-text text-base">Order #{order.id}</h3>
                                            <div className="flex items-center gap-3 text-sm text-r-muted mt-1 font-sans">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(order.created_at).toLocaleDateString()}
                                                </span>
                                                <span className="text-r-border">•</span>
                                                <span>Table {order.table_id}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex items-center gap-3 flex-wrap justify-end">
                                            {/* Payment method badge */}
                                            {order.payment_method && (
                                                <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase font-sans ${
                                                    order.payment_method === 'QR'
                                                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                                        : 'bg-green-50 text-green-600 border border-green-200'
                                                }`}>
                                                    {order.payment_method === 'QR' ? <QrCode className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
                                                    {order.payment_method}
                                                </span>
                                            )}

                                            <span className={`px-3 py-1 rounded-full text-xs font-bold font-sans border ${getStatusStyle(order.status)}`}>
                                                {getStatusLabel(order.status)}
                                            </span>

                                            <p className="font-bold text-lg text-r-gold font-sans tabular-nums">
                                                {order.total_amount.toLocaleString('vi-VN')} ₫
                                            </p>
                                        </div>

                                        {/* Status message for pending orders */}
                                        {order.status === 'pending' && order.payment_method === 'cash' && (
                                            <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-lg flex items-center gap-1 border border-amber-200/50 font-sans">
                                                <Clock className="w-3 h-3" />
                                                Waiting for waiter to confirm cash
                                            </span>
                                        )}
                                        {order.status === 'pending' && order.payment_method === 'QR' && (
                                            <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-lg flex items-center gap-1 border border-blue-200/50 font-sans">
                                                <QrCode className="w-3 h-3" />
                                                QR payment in progress
                                            </span>
                                        )}

                                        {/* Request Complete button for served dine_in orders */}
                                        {order.status === 'served' && order.order_type === 'dine_in' && (
                                            order.completion_requested ? (
                                                <span className="text-xs text-green-600 font-semibold bg-green-50 px-2.5 py-1.5 rounded-lg flex items-center gap-1 border border-green-200/50 font-sans">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Completion Requested
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => requestCompleteMutation.mutate(order.id)}
                                                    disabled={requestCompleteMutation.isPending}
                                                    className="text-xs text-r-dark font-semibold bg-r-gold hover:bg-r-gold-light px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-60 font-sans shadow-sm"
                                                >
                                                    <Bell className="w-3 h-3" />
                                                    Request Complete
                                                </button>
                                            )
                                        )}

                                        {/* Rate Items button for completed dine-in orders */}
                                        {shouldShowRateButton(order) && (
                                            <button
                                                onClick={() => setRatingOrder(order)}
                                                className="text-xs text-white font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all shadow-sm shadow-amber-200/30 font-sans"
                                            >
                                                <Star className="w-3 h-3" />
                                                Rate Items
                                            </button>
                                        )}

                                        {/* Already rated badge */}
                                        {order.status === 'completed' && isAlreadyRated(order) && (
                                            <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-1 rounded-lg flex items-center gap-1 border border-amber-200/50 font-sans">
                                                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                                Rated
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Rating Modal */}
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
