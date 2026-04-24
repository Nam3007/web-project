import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { Truck, MapPin, Package, CheckCircle2, Clock, Loader2 } from 'lucide-react';

const statusConfig = {
    ready: {
        label: 'Ready for Pickup',
        badge: 'bg-amber-100 text-amber-800 border-amber-200',
        icon: Package,
        nextAction: 'Start Delivery',
        nextStatus: 'delivering',
        actionClass: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200',
    },
    delivering: {
        label: 'Out for Delivery',
        badge: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Truck,
        nextAction: 'Mark Delivered',
        nextStatus: 'delivered',
        actionClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200',
    },
};

export default function DeliveryManDashboard() {
    const queryClient = useQueryClient();

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['shippingActive'],
        queryFn: async () => {
            const res = await api.get('/orders/shipping/active');
            return res.data;
        },
        refetchInterval: 15000,
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ orderId, newStatus }) => {
            return api.put(`/orders/${orderId}`, { status: newStatus });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['shippingActive']);
        },
        onError: (err) => {
            alert('Failed to update status: ' + (err.response?.data?.detail || err.message));
        },
    });

    const readyOrders = orders.filter((o) => o.status === 'ready');
    const deliveringOrders = orders.filter((o) => o.status === 'delivering');

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                    <Truck className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Delivery Dashboard</h1>
                    <p className="text-sm text-gray-500">Manage your active shipping orders</p>
                </div>
                <div className="ml-auto flex gap-3">
                    <StatBadge label="Ready" count={readyOrders.length} color="bg-amber-100 text-amber-800" />
                    <StatBadge label="Delivering" count={deliveringOrders.length} color="bg-blue-100 text-blue-800" />
                </div>
            </div>

            {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <CheckCircle2 className="w-16 h-16 text-emerald-300 mb-4" />
                    <h2 className="text-xl font-bold text-gray-700 mb-1">All Clear!</h2>
                    <p className="text-gray-400">No active shipping orders right now.</p>
                </div>
            ) : (
                <div className="space-y-10">
                    <OrderSection
                        title="Ready for Pickup"
                        icon={Package}
                        iconColor="text-amber-600"
                        orders={readyOrders}
                        onAction={(orderId) =>
                            updateStatusMutation.mutate({ orderId, newStatus: 'delivering' })
                        }
                        isPending={updateStatusMutation.isPending}
                    />
                    <OrderSection
                        title="Out for Delivery"
                        icon={Truck}
                        iconColor="text-blue-600"
                        orders={deliveringOrders}
                        onAction={(orderId) =>
                            updateStatusMutation.mutate({ orderId, newStatus: 'delivered' })
                        }
                        isPending={updateStatusMutation.isPending}
                    />
                </div>
            )}
        </div>
    );
}

function StatBadge({ label, count, color }) {
    return (
        <div className={`px-4 py-2 rounded-xl text-sm font-bold ${color}`}>
            {count} {label}
        </div>
    );
}

function OrderSection({ title, icon: Icon, iconColor, orders, onAction, isPending }) {
    if (orders.length === 0) return null;

    return (
        <div>
            <div className={`flex items-center gap-2 mb-4 ${iconColor}`}>
                <Icon className="w-5 h-5" />
                <h2 className="text-lg font-bold text-gray-800">{title}</h2>
                <span className="ml-1 text-sm text-gray-400">({orders.length})</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {orders.map((order) => {
                    const cfg = statusConfig[order.status];
                    if (!cfg) return null;
                    return (
                        <div
                            key={order.id}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col gap-4"
                        >
                            {/* Top row */}
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-lg font-bold text-gray-900">Order #{order.id}</span>
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${cfg.badge}`}>
                                            {cfg.label}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400">
                                        <Clock className="w-3 h-3 inline mr-1" />
                                        {new Date(order.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <p className="text-xl font-bold text-primary">
                                    ${Number(order.total_amount).toFixed(2)}
                                </p>
                            </div>

                            {/* Address */}
                            <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-3">
                                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    {order.shipping_address || 'No address provided'}
                                </p>
                            </div>

                            {/* Action */}
                            <button
                                onClick={() => onAction(order.id)}
                                disabled={isPending}
                                className={`w-full py-3 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${cfg.actionClass}`}
                            >
                                {isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <cfg.icon className="w-4 h-4" />
                                        {cfg.nextAction}
                                    </>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
