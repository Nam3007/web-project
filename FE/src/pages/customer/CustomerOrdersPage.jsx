import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, Calendar, DollarSign, ChevronRight, Crown, Loader, QrCode, Banknote, Clock, Bell, CheckCircle, Star } from 'lucide-react';
import RatingModal from '../../components/RatingModal';

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
            <div className="customer-page customer-page-wide pb-12 relative">
                <div className="space-y-4 pt-8">
                    {/* VIP Status Skeleton */}
                    <div className="h-40 rounded-[2rem] bg-slate-200/50 animate-pulse"></div>
                    <div className="flex items-center justify-between px-2 mt-8 mb-4">
                        <div className="h-8 w-40 bg-slate-200/50 rounded-lg animate-pulse"></div>
                        <div className="h-6 w-20 bg-slate-200/50 rounded-full animate-pulse"></div>
                    </div>
                    {/* Order Cards Skeletons */}
                    {[1, 2, 3].map((item) => (
                        <div key={item} className="h-32 rounded-[1.5rem] bg-slate-200/50 animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    const isVip = user.role === 'vip_customer';
    const progress = Math.min((totalSpent / VIP_THRESHOLD) * 100, 100);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-700';
            case 'paid': return 'bg-emerald-100 text-emerald-700';
            case 'confirmed': return 'bg-teal-100 text-teal-700';
            case 'preparing': return 'bg-blue-100 text-blue-700';
            case 'ready': return 'bg-indigo-100 text-indigo-700';
            case 'served': return 'bg-purple-100 text-purple-700';
            case 'completed': return 'bg-green-100 text-green-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'pending': return 'Awaiting Payment';
            case 'paid': return 'Paid — Assigning Chef';
            case 'confirmed': return 'Confirmed — Assigning Chef';
            case 'queued': return 'In Queue';
            case 'preparing': return 'Being Prepared';
            case 'ready': return 'Ready — Assigning Staff';
            case 'served': return 'Served';
            case 'completed': return 'Completed';
            case 'cancelled': return 'Cancelled';
            case 'delivering': return 'Out for Delivery';
            case 'delivered': return 'Delivered';
            default: return status;
        }
    };

    return (
        <div className="customer-page customer-page-wide pb-12 relative">
            <div className="absolute inset-0 pointer-events-none vietnam-pattern opacity-10 z-0"></div>
            
            <div className="relative z-10 space-y-8">
                {/* VIP Status Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-900 to-emerald-950 rounded-[2rem] p-8 text-white shadow-xl shadow-emerald-900/10 border border-emerald-700/50">
                    <div className="absolute inset-0 opacity-30 pointer-events-none vietnam-pattern"></div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-20"></div>
                    <div className="absolute bottom-0 left-0 w-56 h-56 bg-emerald-500 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 opacity-20"></div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-5">
                            <div className={`w-16 h-16 backdrop-blur-md rounded-2xl flex items-center justify-center border shadow-inner ${isVip ? 'bg-amber-500/20 border-amber-400/30' : 'bg-white/10 border-white/20'}`}>
                                <Crown className={`w-8 h-8 ${isVip ? 'text-amber-400' : 'text-emerald-200'}`} />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-300/80 mb-1">
                                    {isVip ? 'VIP Member' : 'Valued Customer'}
                                </p>
                                <h2 className="text-3xl font-bold tracking-tight font-serif text-white">
                                    {user.full_name}
                                </h2>
                            </div>
                        </div>
                        <div className="text-left md:text-right bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/20 shadow-inner w-full md:w-auto">
                            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200/80 mb-1">Total Spent</p>
                            <p className="text-3xl font-bold text-amber-400 tabular-nums">{totalSpent.toLocaleString('vi-VN')}₫</p>
                            {!isVip && (
                                <div className="mt-3">
                                    <div className="flex justify-between text-xs font-medium text-emerald-200 mb-1">
                                        <span>Progress to VIP</span>
                                        <span>{Math.round(progress)}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" style={{ width: `${progress}%` }}></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* History */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h1 className="text-2xl font-bold font-serif text-slate-900 flex items-center gap-2">
                            <ShoppingBag className="w-6 h-6 text-emerald-600" />
                            Order History
                        </h1>
                        <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{myOrders.length} Orders</span>
                    </div>

                    {myOrders.length === 0 ? (
                        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/80 px-6 py-20 text-center shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                            <div className="mb-6 flex h-24 w-24 mx-auto items-center justify-center rounded-full bg-emerald-50 shadow-inner">
                                <ShoppingBag className="w-10 h-10 text-emerald-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 font-serif mb-2">No past orders found</h3>
                            <p className="text-slate-500 max-w-sm mx-auto">Your order history will appear here once you place your first order.</p>
                            <button
                                onClick={() => window.location.href = '/menu'}
                                className="mt-8 rounded-full bg-emerald-600 px-8 py-3 font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:-translate-y-1"
                            >
                                Browse Menu
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {[...myOrders].map(order => (
                                <div key={order.id} className="group relative rounded-[1.5rem] border border-white/70 bg-white/80 p-5 sm:p-6 shadow-sm backdrop-blur-xl transition-all hover:shadow-md hover:border-emerald-200 overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5">
                                    <div className="absolute inset-0 pointer-events-none vietnam-pattern opacity-[0.02]"></div>
                                    
                                    <div className="relative z-10 flex items-start gap-4">
                                        <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100/50 shadow-inner shrink-0">
                                            <ShoppingBag className="w-6 h-6 text-emerald-500" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-lg font-bold tracking-tight text-slate-900">Order #{order.id}</h3>
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(order.status)} border border-current/10`}>
                                                    {getStatusLabel(order.status)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm font-medium text-slate-500 flex-wrap">
                                                <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                    {new Date(order.created_at).toLocaleDateString()}
                                                </span>
                                                {order.table_id && (
                                                    <span className="flex items-center gap-1.5 bg-orange-50 text-orange-700 px-2 py-1 rounded-md border border-orange-100">
                                                        Table {order.table_id}
                                                    </span>
                                                )}
                                                {order.payment_method && (
                                                    <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold uppercase ${order.payment_method === 'QR'
                                                            ? 'bg-sky-50 text-sky-700 border border-sky-100'
                                                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                        }`}>
                                                        {order.payment_method === 'QR' ? <QrCode className="w-3.5 h-3.5" /> : <Banknote className="w-3.5 h-3.5" />}
                                                        {order.payment_method}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative z-10 flex flex-col md:items-end gap-3 border-t border-slate-100 md:border-t-0 pt-4 md:pt-0 mt-2 md:mt-0">
                                        <div className="flex items-center justify-between md:justify-end gap-6 w-full">
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider md:hidden">Total</p>
                                            <p className="text-xl font-bold text-emerald-700 tabular-nums bg-emerald-50/80 px-4 py-1.5 rounded-xl border border-emerald-100/50">
                                                {order.total_amount.toLocaleString('vi-VN')} ₫
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 justify-end w-full">
                                            {/* Status message for pending orders */}
                                            {order.status === 'pending' && order.payment_method === 'cash' && (
                                                <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-amber-200 shadow-sm">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    Waiting for waiter
                                                </span>
                                            )}
                                            {order.status === 'pending' && order.payment_method === 'QR' && (
                                                <span className="text-[11px] text-sky-700 font-bold bg-sky-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-sky-200 shadow-sm">
                                                    <QrCode className="w-3.5 h-3.5" />
                                                    QR payment pending
                                                </span>
                                            )}

                                            {/* Request Complete button for served dine_in orders */}
                                            {order.status === 'served' && order.order_type === 'dine_in' && (
                                                order.completion_requested ? (
                                                    <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-2 rounded-xl flex items-center gap-1.5 border border-emerald-200 shadow-sm">
                                                        <CheckCircle className="w-4 h-4" />
                                                        Completion Requested
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => requestCompleteMutation.mutate(order.id)}
                                                        disabled={requestCompleteMutation.isPending}
                                                        className="text-xs text-white font-bold bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-orange-200 transition-all active:scale-[0.98] disabled:opacity-60"
                                                    >
                                                        <Bell className="w-4 h-4" />
                                                        Request Complete
                                                    </button>
                                                )
                                            )}

                                            {/* Rate Items button for completed dine-in orders */}
                                            {shouldShowRateButton(order) && (
                                                <button
                                                    onClick={() => setRatingOrder(order)}
                                                    className="text-xs text-white font-bold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-200 transition-all active:scale-[0.98]"
                                                >
                                                    <Star className="w-4 h-4" />
                                                    Rate Items
                                                </button>
                                            )}

                                            {/* Already rated badge */}
                                            {order.status === 'completed' && isAlreadyRated(order) && (
                                                <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-amber-200 shadow-sm">
                                                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                                    Rated
                                                </span>
                                            )}
                                        </div>
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
        </div>
    );
}
