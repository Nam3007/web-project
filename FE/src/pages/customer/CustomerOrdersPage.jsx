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
        <div className="relative mx-auto max-w-4xl space-y-8 pb-8">
            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between flex-wrap">
                    <div className="max-w-2x7">
                        <p className="text-xs font-medium text-emerald-700">Guest Profile</p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Order History</h1>
                        <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">Review previous visits, payment methods, and total spend at a glance. Your loyalty progress and rating actions live here too.</p>
                    </div>
                    
                    <div className="grid grid-cols-2 flex-wrap gap-4 lg:gap-10">
                        <div className="rounded-2x1 bg-slate-50 p-4">
                            <p className="text-lg font-medium text-slate-500">Orders</p>
                            <p className="mt-1 text-2xl font-semibold text-slate-900">{myOrders.length}</p>
                        </div>
                        <div className="rounded-2xl bg-emerald-50 p-4">
                            <p className="text-lg font-medium text-emerald-600">Spent</p>
                            <p className="mt-1 text-2xl font-semibold text-emerald-700">{totalSpent.toLocaleString('vi-VN')}₫</p>
                        </div>
                        
                    </div>
                </div>
            </section>

        

            {/* History */}
            <div className="space-y-6">
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">Recent orders</h2>

                {myOrders.length === 0 ? (
                    <div className="rounded-[1.75rem] border border-slate-200 bg-white py-10 text-center shadow-sm">
                        <p className="text-slate-500">No past orders found.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {[...myOrders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(order => (
                            <div key={order.id} className="flex flex-col justify-between gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md md:flex-row md:items-center">
                                <div className="flex items-start gap-4">
                                    <div className="rounded-xl bg-slate-50 p-3">
                                        <ShoppingBag className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold tracking-tight text-slate-900">Order #{order.id}</h3>
                                        <div className="mt-1 flex items-center gap-4 text-sm text-slate-500">
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
                                            <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase ${order.payment_method === 'QR'
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

                                        <p className="flex items-center gap-1 text-lg font-semibold text-slate-900">

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
                                            className="text-xs text-white font-semibold bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
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
