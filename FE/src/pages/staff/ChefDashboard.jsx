import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import {
    ChefHat,
    Clock,
    CheckCircle,
    AlertCircle,
    Coffee,
    ArrowRight
} from 'lucide-react';

export default function ChefDashboard() {
    const queryClient = useQueryClient();

    // Fetch Orders
    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['orders'],
        queryFn: async () => {
            const res = await api.get('/orders/');
            return res.data;
        },
        refetchInterval: 10000 // Refresh every 10s
    });

    // Filter for Chef relevant active orders
    const activeOrders = orders.filter(o =>
        ['pending', 'preparing'].includes(o.status)
    ).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); // Oldest first

    // Update Status Mutation
    const updateStatusMutation = useMutation({
        mutationFn: async ({ orderId, status }) => {
            return api.put(`/orders/${orderId}`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['orders']);
        }
    });

    const handleStatusUpdate = (orderId, newStatus) => {
        updateStatusMutation.mutate({ orderId, status: newStatus });
    };

    // Group by status
    const pendingOrders = activeOrders.filter(o => o.status === 'pending');
    const preparingOrders = activeOrders.filter(o => o.status === 'preparing');

    if (isLoading) return <div className="text-center p-10">Loading orders...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <ChefHat className="w-8 h-8 text-primary" />
                    Kitchen Display System
                </h1>
                <p className="text-gray-500 text-lg">Manage incoming orders and cooking status</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pending Column */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-amber-50 p-4 rounded-xl border border-amber-100">
                        <h2 className="text-xl font-bold text-amber-800 flex items-center gap-2">
                            <AlertCircle className="w-6 h-6" />
                            Pending Orders
                        </h2>
                        <span className="bg-amber-200 text-amber-900 px-3 py-1 rounded-full text-sm font-bold">
                            {pendingOrders.length}
                        </span>
                    </div>

                    <div className="space-y-4">
                        {pendingOrders.length === 0 ? (
                            <div className="text-center p-8 bg-white rounded-xl border border-gray-100 border-dashed text-gray-400">
                                No pending orders
                            </div>
                        ) : (
                            pendingOrders.map(order => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    actionLabel="Start Cooking"
                                    onAction={() => handleStatusUpdate(order.id, 'preparing')}
                                    actionColor="bg-primary text-white hover:bg-primary/90"
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Preparing Column */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <h2 className="text-xl font-bold text-blue-800 flex items-center gap-2">
                            <Coffee className="w-6 h-6" />
                            Preparing
                        </h2>
                        <span className="bg-blue-200 text-blue-900 px-3 py-1 rounded-full text-sm font-bold">
                            {preparingOrders.length}
                        </span>
                    </div>

                    <div className="space-y-4">
                        {preparingOrders.length === 0 ? (
                            <div className="text-center p-8 bg-white rounded-xl border border-gray-100 border-dashed text-gray-400">
                                Nothing cooking right now
                            </div>
                        ) : (
                            preparingOrders.map(order => (
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
        </div>
    );
}

function OrderCard({ order, actionLabel, onAction, actionColor }) {
    // Fetch items for this order individually or assume we need to update the API to return items with orders
    // The current GET /orders/ endpoint might NOT return items. 
    // AdminOrdersPage fetched items separately on click. 
    // For a KDS (Kitchen Display System), we need to see items immediately.
    // I will use a sub-query component here to fetch items for each card. 

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-4 border-b border-gray-50 flex justify-between items-start bg-gray-50/50">
                <div>
                    <h3 className="font-bold text-lg text-gray-900">Order #{order.id}</h3>
                    <p className="text-sm text-gray-500">Table {order.table_id}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-mono text-gray-400">
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <span className="text-xs font-semibold text-gray-500 uppercase">{order.status}</span>
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
                <button
                    onClick={onAction}
                    className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 ${actionColor} transition-colors shadow-sm`}
                >
                    {actionLabel}
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    )
}

function OrderItemsList({ orderId }) {
    const { data: items = [], isLoading } = useQuery({
        queryKey: ['orderItems', orderId],
        queryFn: async () => {
            const res = await api.get(`/order-items/order/${orderId}`);
            return res.data;
        },
        staleTime: 1000 * 60 * 5 // Cache for 5 mins unless invalidated
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
                    {item.notes && <span className="text-xs text-red-500 text-right max-w-[40%]">{item.notes}</span>}
                </li>
            ))}
        </ul>
    )
}
