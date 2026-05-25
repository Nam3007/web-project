import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import {
    Clock, Utensils, ArrowRight, CheckCircle,
    Banknote, QrCode, Bell, Inbox
} from 'lucide-react';

export default function WaiterActiveOrdersPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Only fetch orders assigned to this waiter
    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['waiterOrders', user?.id],
        queryFn: async () => {
            const res = await api.get(`/orders/staff/${user.id}`);
            return res.data;
        },
        refetchInterval: 8000,
    });

    // Also fetch pending cash/QR orders for confirmation (unassigned, pending)
    const { data: pendingOrders = [] } = useQuery({
        queryKey: ['pendingOrders'],
        queryFn: async () => {
            const [cashRes, qrRes] = await Promise.all([
                api.get('/orders/status/pending/type/dine_in'),
            ]);
            return cashRes.data;
        },
        refetchInterval: 8000,
    });

    const allOrders = [...orders, ...pendingOrders.filter(p => !orders.find(o => o.id === p.id))]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }) => api.put(`/orders/${id}`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries(['waiterOrders', user?.id]);
            queryClient.invalidateQueries(['pendingOrders']);
        },
        onError: (err) => alert('Failed to update status: ' + err.message)
    });

    // Confirm cash payment → triggers auto-assignment of chef via backend
    const confirmCashMutation = useMutation({
        mutationFn: async ({ orderId }) => {
            const paymentsRes = await api.get(`/payments/order/${orderId}`);
            const payments = paymentsRes.data;
            if (payments?.length > 0) {
                await api.patch(`/payments/${payments[0].id}/status?payment_status=completed`);
            }
            // Payment service now handles order status + chef assignment automatically
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['waiterOrders', user?.id]);
            queryClient.invalidateQueries(['pendingOrders']);
            alert('Cash payment confirmed! Order sent to kitchen.');
        },
        onError: (err) => alert('Failed to confirm payment: ' + err.message)
    });

    // Mark completed: update order to completed + free table
    const markCompletedMutation = useMutation({
        mutationFn: async ({ orderId, tableId }) => {
            await api.put(`/orders/${orderId}`, { status: 'completed' });
            if (tableId) {
                await api.patch(`/tables/status/${tableId}/`, { is_occupied: false });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['waiterOrders', user?.id]);
            queryClient.invalidateQueries(['tables']);
            alert('Order completed! Table freed.');
        },
        onError: (err) => alert('Failed to complete order: ' + err.message)
    });

    if (isLoading) return <div className="text-center p-10">Loading orders...</div>;

    if (allOrders.length === 0) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">My Orders</h1>
                    <p className="text-gray-500 text-sm">Orders assigned to you will appear here</p>
                </div>
                <div className="text-center p-16 bg-white rounded-xl border border-dashed border-gray-200 flex flex-col items-center gap-3 text-gray-400">
                    <Inbox className="w-12 h-12 text-gray-300" />
                    <p className="font-medium">No active orders assigned to you</p>
                    <p className="text-sm">New orders will appear automatically when assigned</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">My Orders</h1>
                <p className="text-gray-500 text-sm">Manage your assigned orders</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allOrders.map(order => (
                    <div
                        key={order.id}
                        className={`bg-white p-5 rounded-xl border transition-all relative group ${
                            order.status === 'pending' ? 'border-amber-200 ring-2 ring-amber-100' :
                            order.status === 'ready'   ? 'border-green-200 ring-2 ring-green-100' :
                            order.status === 'served'  ? 'border-purple-200' :
                            'border-gray-100'
                        }`}
                    >
                        {/* Completion requested banner */}
                        {order.completion_requested && order.status === 'served' && (
                            <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm font-semibold">
                                <Bell className="w-4 h-4 animate-pulse" />
                                Customer requested completion!
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">Order #{order.id}</h3>
                                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                    <Utensils className="w-4 h-4" />
                                    <span>Table {order.table_id}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                                    order.status === 'pending'  ? 'bg-amber-100 text-amber-700' :
                                    order.status === 'ready'    ? 'bg-green-100 text-green-700' :
                                    order.status === 'served'   ? 'bg-purple-100 text-purple-700' :
                                    'bg-blue-100 text-blue-700'
                                }`}>
                                    {order.status}
                                </span>
                                {order.payment_method && (
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 ${
                                        order.payment_method === 'QR'
                                            ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                            : 'bg-green-50 text-green-600 border border-green-200'
                                    }`}>
                                        {order.payment_method === 'QR' ? <QrCode className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
                                        {order.payment_method}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between items-end border-t border-gray-100 pt-4 mb-4">
                            <div>
                                <p className="text-xs text-gray-400 mb-0.5">Total Amount</p>
                                <p className="font-bold text-gray-900 text-lg">
                                    {order.total_amount.toLocaleString('vi-VN')} ₫
                                </p>
                            </div>
                        </div>

                        {/* PENDING + CASH: Confirm cash payment */}
                        {order.status === 'pending' && order.payment_method === 'cash' && (
                            <button
                                onClick={() => {
                                    if (confirm('Confirm cash payment received for Order #' + order.id + '?')) {
                                        confirmCashMutation.mutate({ orderId: order.id });
                                    }
                                }}
                                disabled={confirmCashMutation.isPending}
                                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm"
                            >
                                <Banknote className="w-4 h-4" />
                                Confirm Cash Payment
                            </button>
                        )}

                        {/* PENDING + QR: Awaiting */}
                        {order.status === 'pending' && order.payment_method === 'QR' && (
                            <div className="w-full py-2.5 bg-blue-50 text-blue-600 font-medium rounded-lg flex items-center justify-center gap-2 text-sm border border-blue-100">
                                <QrCode className="w-4 h-4" />
                                Awaiting QR Payment...
                            </div>
                        )}

                        {/* READY: Mark as served (sets waiter back to available via backend) */}
                        {order.status === 'ready' && (
                            <button
                                onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'served' })}
                                className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Mark Served
                            </button>
                        )}

                        {/* SERVED: Mark as completed + free table */}
                        {order.status === 'served' && (
                            <button
                                onClick={() => markCompletedMutation.mutate({ orderId: order.id, tableId: order.table_id })}
                                disabled={markCompletedMutation.isPending}
                                className={`w-full py-2 font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm text-white ${
                                    order.completion_requested
                                        ? 'bg-orange-600 hover:bg-orange-700 ring-2 ring-orange-300'
                                        : 'bg-purple-600 hover:bg-purple-700'
                                }`}
                            >
                                <CheckCircle className="w-4 h-4" />
                                {order.completion_requested ? 'Complete Order (Requested)' : 'Mark Completed'}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
