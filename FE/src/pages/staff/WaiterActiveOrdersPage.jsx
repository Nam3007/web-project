import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { Clock, DollarSign, Utensils, ArrowRight, CheckCircle, Banknote, QrCode } from 'lucide-react';

export default function WaiterActiveOrdersPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['activeOrders'],
        queryFn: async () => {
            // Fetch pending (cash awaiting confirmation) + ready + served orders
            const [pendingRes, readyRes, servedRes] = await Promise.all([
                api.get('/orders/status/pending/type/dine_in'),
                api.get('/orders/status/ready/type/dine_in'),
                api.get('/orders/status/served/type/dine_in')
            ]);
            return [...pendingRes.data, ...readyRes.data, ...servedRes.data];
        },
        refetchInterval: 10000, // Poll every 10 seconds for real-time updates
    });

    // Sort by newest first
    const allOrders = orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }) => {
            return api.put(`/orders/${id}`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['activeOrders']);
            alert("Order updated!");
        },
        onError: (err) => {
            alert("Failed to update status: " + err.message);
        }
    });

    // Confirm cash payment: update payment to completed + order to paid
    const confirmCashMutation = useMutation({
        mutationFn: async ({ orderId }) => {
            // Step 1: Get payment for this order
            const paymentsRes = await api.get(`/payments/order/${orderId}`);
            const payments = paymentsRes.data;

            if (payments && payments.length > 0) {
                const payment = payments[0];
                // Step 2: Update payment status to completed
                await api.patch(`/payments/${payment.id}/status?payment_status=completed`);
            }

            // Step 3: Update order status to paid
            await api.put(`/orders/${orderId}`, { status: 'paid' });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['activeOrders']);
            alert("Cash payment confirmed! Order sent to kitchen.");
        },
        onError: (err) => {
            alert("Failed to confirm payment: " + err.message);
        }
    });

    // Mark completed: update order to completed + free table
    const markCompletedMutation = useMutation({
        mutationFn: async ({ orderId, tableId }) => {
            // Step 1: Mark order as completed
            await api.put(`/orders/${orderId}`, { status: 'completed' });

            // Step 2: Free the table
            if (tableId) {
                await api.patch(`/tables/status/${tableId}/`, {
                    is_occupied: false
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['activeOrders']);
            queryClient.invalidateQueries(['tables']);
            alert("Order completed! Table freed.");
        },
        onError: (err) => {
            alert("Failed to complete order: " + err.message);
        }
    });

    if (isLoading) return <div className="text-center p-10">Loading orders...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">All Orders</h1>
                <p className="text-gray-500 text-sm">Manage order flow: Pending (Cash) → Paid → Preparing → Ready → Served → Completed</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allOrders.map(order => (
                    <div
                        key={order.id}
                        className={`bg-white p-5 rounded-xl border transition-all relative group ${
                            order.status === 'pending' ? 'border-amber-200 ring-2 ring-amber-100' :
                            order.status === 'ready' ? 'border-green-200' :
                            order.status === 'served' ? 'border-purple-200' :
                            'border-gray-100 opacity-75'
                        }`}
                    >
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
                                    order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                    order.status === 'ready' ? 'bg-green-100 text-green-700' :
                                    order.status === 'served' ? 'bg-purple-100 text-purple-700' :
                                    order.status === 'paid' || order.status === 'completed' ? 'bg-gray-100 text-gray-500' :
                                    'bg-blue-100 text-blue-700'
                                }`}>
                                    {order.status}
                                </span>
                                {/* Payment method badge */}
                                {order.payment_method && (
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 ${
                                        order.payment_method === 'QR' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-green-50 text-green-600 border border-green-200'
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
                                <p className="font-bold text-gray-900 text-lg flex items-center gap-1">
            
                                    {order.total_amount.toLocaleString('vi-VN')} ₫
                                </p>
                            </div>
                        </div>

                        {/* PENDING + CASH: Confirm cash payment */}
                        {order.status === 'pending' && order.payment_method === 'cash' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
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

                        {/* PENDING + QR: Show waiting indicator */}
                        {order.status === 'pending' && order.payment_method === 'QR' && (
                            <div className="w-full py-2.5 bg-blue-50 text-blue-600 font-medium rounded-lg flex items-center justify-center gap-2 text-sm border border-blue-100">
                                <QrCode className="w-4 h-4" />
                                Awaiting QR Payment...
                            </div>
                        )}

                        {/* READY: Mark as served */}
                        {order.status === 'ready' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    updateStatusMutation.mutate({ id: order.id, status: 'served' });
                                }}
                                className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Mark Served
                            </button>
                        )}

                        {/* SERVED: Mark as completed + free table */}
                        {order.status === 'served' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    markCompletedMutation.mutate({ orderId: order.id, tableId: order.table_id });
                                }}
                                disabled={markCompletedMutation.isPending}
                                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Mark Completed
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
