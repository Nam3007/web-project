import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import {
    ChefHat,
    Clock,
    CheckCircle,
    AlertCircle,
    Coffee,
    ArrowRight,
    Inbox
} from 'lucide-react';

export default function ChefDashboard() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const chefVisibleStatuses = new Set(['queued', 'preparing']);

    // Only fetch orders assigned to this chef
    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['chefOrders', user?.id],
        queryFn: async () => {
            const res = await api.get(`/orders/staff/${user.id}`);
            return res.data;
        },
        refetchInterval: 2000,
        enabled: !!user?.id
    });

    // Update Status Mutation
    const updateStatusMutation = useMutation({
        mutationFn: async ({ orderId, status }) => {
            return api.put(`/orders/${orderId}`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['chefOrders', user?.id]);
        }
    });

    const handleStatusUpdate = (orderId, newStatus) => {
        updateStatusMutation.mutate({ orderId, status: newStatus });
    };

    const visibleOrders = orders.filter(order => chefVisibleStatuses.has(order.status));
    const preparingOrders = visibleOrders.filter(order => order.status === 'preparing');

    if (isLoading) return <div className="text-center p-10">Loading orders...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <ChefHat className="w-8 h-8 text-primary" />
                    Kitchen Display System
                </h1>
                <p className="text-gray-500 text-lg">Your assigned orders</p>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <h2 className="text-xl font-bold text-blue-800 flex items-center gap-2">
                        <Coffee className="w-6 h-6" />
                        Kitchen Orders
                    </h2>
                    <span className="bg-blue-200 text-blue-900 px-3 py-1 rounded-full text-sm font-bold">
                        {visibleOrders.length}
                    </span>
                </div>

                <div className="space-y-4">
                    {visibleOrders.length === 0 ? (
                        <div className="text-center p-12 bg-white rounded-xl border border-gray-100 border-dashed text-gray-400 flex flex-col items-center gap-3">
                            <Inbox className="w-12 h-12 text-gray-300" />
                            <p className="font-medium">No kitchen orders are ready yet</p>
                            <p className="text-sm">Orders will appear here when they are queued or assigned for preparation</p>
                        </div>
                    ) : (
                        visibleOrders.map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                actionLabel="Mark Ready"
                                onAction={() => handleStatusUpdate(order.id, 'ready')}
                                actionColor="bg-green-600 text-white hover:bg-green-700"
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function OrderCard({ order, actionLabel, onAction, actionColor }) {
    const canMarkReady = order.status === 'preparing';

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-4 border-b border-gray-50 flex justify-between items-start bg-gray-50/50">
                <div>
                    <h3 className="font-bold text-lg text-gray-900">Order #{order.id}</h3>
                    <p className="text-sm text-gray-500">
                        {order.order_type === 'dine_in' ? `Table ${order.table_id}` : 'Shipping'}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-mono text-gray-400">
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <span className="text-xs font-semibold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded">
                        {order.status}
                    </span>
                </div>
            </div>

            <div className="p-4">
                <OrderItemsList orderId={order.id} />
                {order.notes && (
                    <div className="mt-3 p-2 bg-yellow-50 text-yellow-800 text-sm rounded border border-yellow-100">
                        <span className="font-bold">Note:</span> {order.notes}
                    </div>
                )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100">
                {canMarkReady ? (
                    <button
                        onClick={onAction}
                        className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 ${actionColor} transition-colors shadow-sm`}
                    >
                        {actionLabel}
                        <ArrowRight className="w-5 h-5" />
                    </button>
                ) : (
                    <div className="w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 bg-gray-100 text-gray-500">
                        {order.status === 'paid' ? 'Waiting for kitchen assignment' : `Status: ${order.status}`}
                    </div>
                )}
            </div>
        </div>
    );
}

function OrderItemsList({ orderId }) {
    const { data: items = [], isLoading } = useQuery({
        queryKey: ['orderItems', orderId],
        queryFn: async () => {
            const res = await api.get(`/order-items/order/${orderId}`);
            return res.data;
        },
        staleTime: 1000 * 60 * 5,
        enabled: !!orderId
    });

    if (isLoading) return <div className="text-sm text-gray-400 py-2">Loading items...</div>;

    return (
        <ul className="space-y-2">
            {items.map(item => (
                <li key={item.id} className="flex justify-between items-start text-sm">
                    <span className="text-gray-800 font-medium">
                        <span className="inline-block w-6 h-6 text-center bg-gray-100 rounded-md mr-2">{item.quantity}x</span>
                        {item.item_name}
                    </span>
                    {item.special_instructions && <span className="text-xs text-red-500 text-right max-w-[40%]">{item.special_instructions}</span>}
                </li>
            ))}
        </ul>
    );
}
        