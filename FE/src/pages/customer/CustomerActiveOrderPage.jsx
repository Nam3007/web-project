import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import {
    ClipboardList, MapPin, CheckCircle2, Clock, CreditCard, DollarSign,
    Wallet, PackageCheck, Loader2, Star, UtensilsCrossed, Truck, ChevronDown, ChevronUp
} from 'lucide-react';
import RatingModal from '../../components/RatingModal';
import OrderProgressBar from '../../components/OrderProgressBar';

const PAYMENT_METHODS = [
    { value: 'cash', label: 'Cash', icon: DollarSign },
    { value: 'card', label: 'Card', icon: CreditCard },
    { value: 'digital_wallet', label: 'E-Wallet', icon: Wallet },
];

export default function CustomerActiveOrderPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [payingOrderId, setPayingOrderId] = useState(null);
    const [selectedMethod, setSelectedMethod] = useState('cash');
    const [ratingOrder, setRatingOrder] = useState(null);
    const [expandedOrders, setExpandedOrders] = useState({});

    // Fetch active orders (both dine-in and shipping)
    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['myActiveOrders', user?.id],
        queryFn: async () => {
            const res = await api.get(`/orders/active/customer/${user.id}`);
            return res.data;
        },
        refetchInterval: 10000,
    });

    // Fetch order items for each expanded order
    const expandedOrderIds = Object.keys(expandedOrders).filter(id => expandedOrders[id]);

    // Fetch items for all expanded orders
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

    // Fetch order items for the order being rated
    const { data: ratingOrderItems = [] } = useQuery({
        queryKey: ['orderItems', ratingOrder?.id],
        queryFn: async () => {
            const res = await api.get(`/order-items/order/${ratingOrder.id}`);
            return res.data;
        },
        enabled: !!ratingOrder,
    });

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

    const toggleExpand = (orderId) => {
        setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
    };

    // Auto-expand first order
    useEffect(() => {
        if (orders.length > 0 && Object.keys(expandedOrders).length === 0) {
            setExpandedOrders({ [orders[0].id]: true });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orders]);

    // Rating helpers
    const shouldShowRateButton = (order) => {
        // Allow rating for completed orders (both dine-in and shipping)
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

    // Check if a completed order should still be visible (for rating)
    const shouldShowCompletedOrder = (order) => {
        if (order.status !== 'completed') return true; // always show non-completed
        if (isAlreadyRated(order)) return false; // hide once rated
        // Show if rating is still available
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                    <ClipboardList className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Active Orders</h1>
                    <p className="text-sm text-gray-500">Track your current dine-in & delivery orders</p>
                </div>
            </div>

            {orders.filter(shouldShowCompletedOrder).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <ClipboardList className="w-16 h-16 text-gray-200 mb-4" />
                    <p className="text-gray-500 font-medium">You have no active orders</p>
                    <button
                        onClick={() => window.location.href = '/menu'}
                        className="mt-4 px-6 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-xl transition-colors text-sm"
                    >
                        Browse Menu
                    </button>
                </div>
            ) : (
                <div className="space-y-5">
                    {orders
                        .filter(shouldShowCompletedOrder)
                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                        .map((order) => {
                        const isShipping = order.order_type === 'shipping';
                        const isDelivered = order.status === 'delivered';
                        const isPaid = order.status === 'paid';
                        const isCompleted = order.status === 'completed';
                        const isPayingThis = payingOrderId === order.id;
                        const isExpanded = expandedOrders[order.id];
                        const items = allOrderItems[order.id] || [];

                        return (
                            <div
                                key={order.id}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
                            >
                                {/* Card top strip */}
                                <div className={`h-1.5 w-full ${
                                    order.status === 'pending_confirmation'
                                        ? 'bg-amber-400'
                                        : isDelivered
                                            ? 'bg-emerald-400'
                                            : isPaid || isCompleted
                                                ? 'bg-gray-300'
                                                : isShipping
                                                    ? 'bg-blue-500'
                                                    : 'bg-primary'
                                }`} />

                                <div className="p-6 space-y-4">
                                    {/* Row 1: ID + type badge + amount */}
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className="text-lg font-bold text-gray-900">Order #{order.id}</span>
                                                <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border flex items-center gap-1 ${
                                                    isShipping
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                        : 'bg-orange-50 text-orange-700 border-orange-200'
                                                }`}>
                                                    {isShipping ? <Truck className="w-3 h-3" /> : <UtensilsCrossed className="w-3 h-3" />}
                                                    {isShipping ? 'Delivery' : 'Dine-in'}
                                                </span>
                                                {order.status === 'pending_confirmation' && (
                                                    <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700 border border-amber-200 animate-pulse">
                                                        Awaiting Confirmation
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(order.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400">Total</p>
                                            <p className="text-xl font-bold text-primary">
                                                {Number(order.total_amount).toLocaleString("vi-VN")}đ
                                            </p>
                                        </div>
                                    </div>

                                    {/* Location info */}
                                    {isShipping ? (
                                        <div className="flex items-start gap-2 bg-blue-50 rounded-xl px-4 py-3">
                                            <MapPin className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                                            <p className="text-sm text-gray-700">{order.shipping_address || 'No address'}</p>
                                        </div>
                                    ) : order.table_id && (
                                        <div className="flex items-start gap-2 bg-orange-50 rounded-xl px-4 py-3">
                                            <UtensilsCrossed className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                                            <p className="text-sm text-gray-700">Table {order.table_id}</p>
                                        </div>
                                    )}

                                    {/* Progress Bar */}
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <OrderProgressBar
                                            status={order.status}
                                            orderType={order.order_type}
                                        />
                                    </div>

                                    {/* Expandable Items Section */}
                                    <button
                                        onClick={() => toggleExpand(order.id)}
                                        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-sm font-medium text-gray-600"
                                    >
                                        <span>Order Items</span>
                                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>

                                    {isExpanded && (
                                        <div className="space-y-2 animate-in fade-in duration-200">
                                            {items.length > 0 ? items.map((item) => (
                                                <div key={item.id} className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl">
                                                    {item.item_image && (
                                                        <img src={item.item_image} alt={item.item_name} className="w-10 h-10 rounded-lg object-cover" />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-800 truncate">{item.item_name}</p>
                                                        <p className="text-xs text-gray-400">x{item.quantity}</p>
                                                    </div>
                                                    <p className="text-sm font-bold text-gray-700">
                                                        {Number(item.subtotal).toLocaleString("vi-VN")}đ
                                                    </p>
                                                </div>
                                            )) : (
                                                <p className="text-sm text-gray-400 text-center py-3">
                                                    <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
                                                    Loading items...
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Payment Section — only if delivered and no prior payment */}
                                    {isDelivered && !order.payment_method && (
                                        <>
                                            {!isPayingThis ? (
                                                <button
                                                    onClick={() => setPayingOrderId(order.id)}
                                                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                                                >
                                                    <CreditCard className="w-5 h-5" />
                                                    Pay Now
                                                </button>
                                            ) : (
                                                <div className="border border-emerald-200 rounded-xl p-4 space-y-3 bg-emerald-50">
                                                    <p className="text-sm font-bold text-emerald-800">Select Payment Method</p>
                                                    <div className="flex gap-2">
                                                        {PAYMENT_METHODS.map((m) => {
                                                            const MIcon = m.icon;
                                                            const active = selectedMethod === m.value;
                                                            return (
                                                                <button
                                                                    key={m.value}
                                                                    onClick={() => setSelectedMethod(m.value)}
                                                                    className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-xs font-bold transition-all ${active
                                                                        ? 'border-emerald-500 bg-emerald-600 text-white'
                                                                        : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-300'
                                                                        }`}
                                                                >
                                                                    <MIcon className="w-4 h-4" />
                                                                    {m.label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                    <div className="flex gap-2 pt-1">
                                                        <button
                                                            onClick={() => setPayingOrderId(null)}
                                                            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                payMutation.mutate({ orderId: order.id, method: selectedMethod })
                                                            }
                                                            disabled={payMutation.isPending}
                                                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1 disabled:opacity-60"
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

                                    {/* Paid confirmation */}
                                    {(isPaid || isCompleted) && order.payment_method && (
                                        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            Payment complete via <span className="font-bold capitalize ml-1">{order.payment_method?.replace('_', ' ')}</span>
                                        </div>
                                    )}

                                    {/* Confirm Delivery button for Shipping orders */}
                                    {order.status === 'delivered' && order.order_type === 'shipping' && (
                                        <button
                                            onClick={() => {
                                                    confirmDeliveryMutation.mutate(order.id);
                                                
                                            }}
                                            disabled={confirmDeliveryMutation.isPending}
                                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 className="w-5 h-5" />
                                            {confirmDeliveryMutation.isPending ? 'Confirming...' : 'Confirm Received'}
                                        </button>
                                    )}

                                    {/* Rate Items button */}
                                    {shouldShowRateButton(order) && (
                                        <button
                                            onClick={() => setRatingOrder(order)}
                                            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-200 flex items-center justify-center gap-2"
                                        >
                                            <Star className="w-5 h-5" />
                                            Rate Your Items
                                        </button>
                                    )}

                                    {/* Already rated badge */}
                                    {(isPaid || isCompleted) && isAlreadyRated(order) && (
                                        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 rounded-xl px-4 py-3 border border-amber-200">
                                            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                                            <span className="font-semibold">You rated this order</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

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
