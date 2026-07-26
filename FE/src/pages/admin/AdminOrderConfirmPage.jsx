import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import {
    Truck, MapPin, CheckCircle2, XCircle, Clock, Loader2, ShieldCheck,
    Package, ChevronDown, ChevronUp, AlertCircle, Bell
} from 'lucide-react';
import OrderProgressBar from '../../components/OrderProgressBar';

export default function AdminOrderConfirmPage() {
    const queryClient = useQueryClient();
    const [expandedOrders, setExpandedOrders] = useState({});
    const [flashNew, setFlashNew] = useState(false);
    const prevCountRef = useRef(0);

    // Fetch all today's shipping orders
    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['todayShippingOrders'],
        queryFn: async () => {
            const res = await api.get('/orders/shipping/today');
            return res.data;
        },
        refetchInterval: 10000,
    });

    // Detect new orders arriving and flash notification
    useEffect(() => {
        const pendingCount = orders.filter(o => o.status === 'pending_confirmation').length;
        if (pendingCount > prevCountRef.current && prevCountRef.current > 0) {
            setFlashNew(true);
            setTimeout(() => setFlashNew(false), 3000);
        }
        prevCountRef.current = pendingCount;
    }, [orders]);

    // Fetch order items for expanded orders
    const expandedOrderIds = Object.keys(expandedOrders).filter(id => expandedOrders[id]);

    const orderItemsQueries = useQuery({
        queryKey: ['adminOrderItems', expandedOrderIds],
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

    // Confirm shipping order
    const confirmMutation = useMutation({
        mutationFn: async (orderId) => {
            return api.patch(`/orders/${orderId}/confirm-shipping`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['todayShippingOrders']);
        },
        onError: (err) => {
            alert('Failed to confirm: ' + (err.response?.data?.detail || err.message));
        },
    });

    // Reject (cancel) shipping order
    const rejectMutation = useMutation({
        mutationFn: async (orderId) => {
            return api.put(`/orders/${orderId}`, { status: 'cancelled' });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['todayShippingOrders']);
        },
        onError: (err) => {
            alert('Failed to reject: ' + (err.response?.data?.detail || err.message));
        },
    });

    const toggleExpand = (orderId) => {
        setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
    };

    // Sort: pending_confirmation first, then by creation time desc
    const sortedOrders = [...orders].sort((a, b) => {
        const aPending = a.status === 'pending_confirmation' ? 0 : 1;
        const bPending = b.status === 'pending_confirmation' ? 0 : 1;
        if (aPending !== bPending) return aPending - bPending;
        return new Date(b.created_at) - new Date(a.created_at);
    });

    const pendingCount = orders.filter(o => o.status === 'pending_confirmation').length;

    const getStatusLabel = (status) => {
        switch (status) {
            case 'pending': return 'Pending Payment';
            case 'pending_confirmation': return 'Awaiting Confirmation';
            case 'paid': return 'Paid';
            case 'queued': return 'In Queue';
            case 'preparing': return 'Preparing';
            case 'ready': return 'Ready';
            case 'delivering': return 'Delivering';
            case 'delivered': return 'Delivered';
            case 'completed': return 'Completed';
            case 'cancelled': return 'Cancelled';
            default: return status;
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'pending_confirmation': return 'bg-amber-100 text-amber-800 border-amber-300';
            case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'ready': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case 'delivering': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
            case 'delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'completed': return 'bg-green-100 text-green-800 border-green-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all ${
                        flashNew
                            ? 'bg-amber-500 shadow-amber-300 animate-bounce'
                            : 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-200'
                    }`}>
                        <Truck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Shipping Orders</h1>
                        <p className="text-sm text-gray-500">Today's shipping orders — confirm before kitchen</p>
                    </div>
                </div>

                {/* Pending badge */}
                {pendingCount > 0 && (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${
                        flashNew
                            ? 'bg-amber-100 border-amber-400 shadow-lg shadow-amber-200'
                            : 'bg-amber-50 border-amber-300'
                    }`}>
                        <Bell className={`w-5 h-5 text-amber-600 ${flashNew ? 'animate-bounce' : ''}`} />
                        <span className="text-sm font-bold text-amber-700">
                            {pendingCount} order{pendingCount !== 1 ? 's' : ''} awaiting confirmation
                        </span>
                    </div>
                )}
            </div>

            {/* Orders List */}
            {sortedOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <Package className="w-16 h-16 text-gray-200 mb-4" />
                    <h2 className="text-xl font-bold text-gray-600 mb-1">No Shipping Orders Today</h2>
                    <p className="text-gray-400 text-sm">Shipping orders placed today will appear here.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {sortedOrders.map((order) => {
                        const isPendingConfirm = order.status === 'pending_confirmation';
                        const isCancelled = order.status === 'cancelled';
                        const isCompleted = order.status === 'completed';
                        const isExpanded = expandedOrders[order.id];
                        const items = allOrderItems[order.id] || [];

                        return (
                            <div
                                key={order.id}
                                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                                    isPendingConfirm
                                        ? 'border-amber-200 ring-2 ring-amber-100 hover:shadow-lg'
                                        : 'border-gray-100 hover:shadow-md'
                                }`}
                            >
                                {/* Top strip */}
                                <div className={`h-1.5 w-full ${
                                    isPendingConfirm
                                        ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                                        : isCancelled
                                            ? 'bg-red-400'
                                            : isCompleted
                                                ? 'bg-green-400'
                                                : 'bg-blue-500'
                                }`} />

                                <div className="p-6 space-y-4">
                                    {/* Row 1: Order info + status */}
                                    <div className="flex items-start justify-between flex-wrap gap-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className="text-lg font-bold text-gray-900">
                                                    Order #{order.id}
                                                </span>
                                                <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${getStatusStyle(order.status)}`}>
                                                    {getStatusLabel(order.status)}
                                                </span>
                                                {isPendingConfirm && (
                                                    <span className="relative flex h-3 w-3">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(order.created_at).toLocaleString()}
                                                </span>
                                                {order.customer_id && (
                                                    <span>Customer #{order.customer_id}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400">Total</p>
                                            <p className="text-xl font-bold text-primary">
                                                {Number(order.total_amount).toLocaleString("vi-VN")}đ
                                            </p>
                                        </div>
                                    </div>

                                    {/* Shipping address */}
                                    <div className="flex items-start gap-2 bg-blue-50 rounded-xl px-4 py-3">
                                        <MapPin className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                                        <p className="text-sm text-gray-700">{order.shipping_address || 'No address provided'}</p>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <OrderProgressBar
                                            status={order.status}
                                            orderType="shipping"
                                        />
                                    </div>

                                    {/* Expandable Items */}
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
                                                        <p className="text-xs text-gray-400">x{item.quantity} · {Number(item.unit_price).toLocaleString("vi-VN")}đ each</p>
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

                                    {/* Action buttons — only for pending_confirmation */}
                                    {isPendingConfirm && (
                                        <div className="flex gap-3 pt-2">
                                            <button
                                                onClick={() => {
                                                    if (window.confirm(`Reject and cancel order #${order.id}?`)) {
                                                        rejectMutation.mutate(order.id);
                                                    }
                                                }}
                                                disabled={rejectMutation.isPending}
                                                className="flex-1 py-3 border-2 border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                <XCircle className="w-5 h-5" />
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => confirmMutation.mutate(order.id)}
                                                disabled={confirmMutation.isPending}
                                                className="flex-[2] py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {confirmMutation.isPending ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <>
                                                        <ShieldCheck className="w-5 h-5" />
                                                        Confirm & Send to Kitchen
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    {/* Completed/Cancelled info */}
                                    {isCompleted && (
                                        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-xl px-4 py-3 border border-green-200">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span className="font-semibold">Order completed</span>
                                        </div>
                                    )}
                                    {isCancelled && (
                                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 border border-red-200">
                                            <AlertCircle className="w-4 h-4" />
                                            <span className="font-semibold">Order cancelled / rejected</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
