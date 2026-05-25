import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import {
    Truck, MapPin, CheckCircle2, Clock, CreditCard, DollarSign,
    Wallet, PackageCheck, Loader2
} from 'lucide-react';

const STATUS_CONFIG = {
    delivering: {
        label: 'Out for Delivery',
        badge: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Truck,
    },
    delivered: {
        label: 'Delivered',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: PackageCheck,
    },
    paid: {
        label: 'Paid',
        badge: 'bg-gray-100 text-gray-600 border-gray-200',
        icon: CheckCircle2,
    },
};

const PAYMENT_METHODS = [
    { value: 'cash', label: 'Cash', icon: DollarSign },
    { value: 'card', label: 'Card', icon: CreditCard },
    { value: 'digital_wallet', label: 'E-Wallet', icon: Wallet },
];

export default function CustomerShippingPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [payingOrderId, setPayingOrderId] = useState(null);
    const [selectedMethod, setSelectedMethod] = useState('cash');

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['myShippingOrders', user?.id],
        queryFn: async () => {
            const res = await api.get(`/orders/shipping/customer/${user.id}`);
            return res.data;
        },
        refetchInterval: 20000,
    });

    const payMutation = useMutation({
        mutationFn: async ({ orderId, method }) => {
            // 1. Create payment record
            const res = await api.post('/payments/', {
                order_id: orderId,
                payment_method: method,
            });
            const paymentId = res.data.id;
            // 2. Mark payment as completed (backend handles marking order as 'completed' for delivered orders)
            return api.patch(`/payments/${paymentId}/status?payment_status=completed`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['myShippingOrders']);
            setPayingOrderId(null);
        },
        onError: (err) => {
            alert('Payment failed: ' + (err.response?.data?.detail || err.message));
        },
    });

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
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                    <Truck className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Deliveries</h1>
                    <p className="text-sm text-gray-500">Track your shipping orders</p>
                </div>
            </div>

            {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <Truck className="w-16 h-16 text-gray-200 mb-4" />
                    <h2 className="text-xl font-bold text-gray-600 mb-1">No Deliveries Yet</h2>
                    <p className="text-gray-400 text-sm">Place a shipping order to see it tracked here.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => {
                        const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.delivering;
                        const StatusIcon = cfg.icon;
                        const isDelivered = order.status === 'delivered';
                        const isPaid = order.status === 'paid';
                        const isPayingThis = payingOrderId === order.id;

                        return (
                            <div
                                key={order.id}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
                            >
                                {/* Card top strip */}
                                <div className={`h-1.5 w-full ${isDelivered ? 'bg-emerald-400' : isPaid ? 'bg-gray-300' : 'bg-blue-500'}`} />

                                <div className="p-6 space-y-4">
                                    {/* Row 1: ID + status + amount */}
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-lg font-bold text-gray-900">Order #{order.id}</span>
                                                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${cfg.badge} flex items-center gap-1`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {cfg.label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(order.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400">Total</p>
                                            <p className="text-xl font-bold text-primary">
                                                ${Number(order.total_amount).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Address */}
                                    <div className="flex items-start gap-2 bg-gray-50 rounded-xl px-4 py-3">
                                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                        <p className="text-sm text-gray-700">{order.shipping_address || 'No address'}</p>
                                    </div>

                                    {/* Payment Section — only if delivered and not yet paid */}
                                    {isDelivered && !isPaid && (
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
                                    {isPaid && (
                                        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            Payment complete via <span className="font-bold capitalize ml-1">{order.payment_method?.replace('_', ' ')}</span>
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
