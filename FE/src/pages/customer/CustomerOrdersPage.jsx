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

    if (isLoading) return <div className="text-center py-20">Loading orders...</div>;

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
        <div className="max-w-3xl mx-auto space-y-8">
            {/* VIP Status Card */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Crown className={`w-6 h-6 ${isVip ? 'text-amber-400' : 'text-gray-400'}`} />
                            {isVip ? 'VIP Member' : 'Member Status'}
                        </h2>
                        <p className="opacity-80 mt-1">
                            {isVip
                                ? "Thank you for being one of our most valued customers!"
                                : `Spend $${VIP_THRESHOLD} to unlock VIP benefits.`}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm opacity-60">Total Spent</p>
                        <p className="text-3xl font-bold text-emerald-400">{totalSpent.toLocaleString('vi-VN')}₫</p>
                    </div>
                </div>

                {!isVip && (
                    <div className="mt-6 relative z-10">
                        <div className="flex justify-between text-xs mb-2 font-medium opacity-80">
                            <span>$0</span>
                            <span>${VIP_THRESHOLD}</span>
                        </div>
                        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-amber-300 to-amber-500 transition-all duration-1000"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>

                        {totalSpent >= VIP_THRESHOLD && (
                            <button
                                onClick={() => requestVipMutation.mutate()}
                                disabled={requestVipMutation.isPending}
                                className="mt-4 w-full py-3 bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                {requestVipMutation.isPending ? <Loader className="w-5 h-5 animate-spin" /> : <Crown className="w-5 h-5" />}
                                Request VIP Status
                            </button>
                        )}
                    </div>
                )}

                {/* Decoration */}
                <Crown className="absolute -bottom-4 -right-4 w-32 h-32 text-white/5 rotate-12" />
            </div>

            {/* History */}
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-800">Order History</h1>

                {myOrders.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
                        <p className="text-gray-500">No past orders found.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {[...myOrders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(order => (
                            <div key={order.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-gray-50 rounded-xl">
                                        <ShoppingBag className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">Order #{order.id}</h3>
                                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </span>
                                            <span>•</span>
                                            <span>Table {order.table_id}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    <div className="flex items-center gap-4">
                                        {/* Payment method badge */}
                                        {order.payment_method && (
                                            <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                order.payment_method === 'QR'
                                                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                                    : 'bg-green-50 text-green-600 border border-green-200'
                                            }`}>
                                                {order.payment_method === 'QR' ? <QrCode className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
                                                {order.payment_method}
                                            </span>
                                        )}

                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(order.status)}`}>
                                            {getStatusLabel(order.status)}
                                        </span>

                                        <p className="font-bold text-lg text-gray-900 flex items-center gap-1">
                                           
                                            {order.total_amount.toLocaleString('vi-VN')} ₫
                                        </p>
                                    </div>

                                    {/* Status message for pending orders */}
                                    {order.status === 'pending' && order.payment_method === 'cash' && (
                                        <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            Waiting for waiter to confirm cash
                                        </span>
                                    )}
                                    {order.status === 'pending' && order.payment_method === 'QR' && (
                                        <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded flex items-center gap-1">
                                            <QrCode className="w-3 h-3" />
                                            QR payment in progress
                                        </span>
                                    )}

                                    {/* Request Complete button for served dine_in orders */}
                                    {order.status === 'served' && order.order_type === 'dine_in' && (
                                        order.completion_requested ? (
                                            <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded flex items-center gap-1 border border-green-200">
                                                <CheckCircle className="w-3 h-3" />
                                                Completion Requested
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => requestCompleteMutation.mutate(order.id)}
                                                disabled={requestCompleteMutation.isPending}
                                                className="text-xs text-white font-semibold bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded flex items-center gap-1 transition-colors disabled:opacity-60"
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
                                            className="text-xs text-white font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all shadow-sm shadow-amber-200"
                                        >
                                            <Star className="w-3 h-3" />
                                            Rate Items
                                        </button>
                                    )}

                                    {/* Already rated badge */}
                                    {order.status === 'completed' && isAlreadyRated(order) && (
                                        <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-1 rounded flex items-center gap-1 border border-amber-200">
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
    );
}
