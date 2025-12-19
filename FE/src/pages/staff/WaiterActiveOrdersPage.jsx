import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { Clock, DollarSign, Utensils, ArrowRight, CheckCircle } from 'lucide-react';

export default function WaiterActiveOrdersPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['activeOrders'], // Keeping key name for consistency or cache
        queryFn: async () => {
            const res = await api.get('/orders/');
            return res.data;
        },
        refetchInterval: 10000
    });

    // Sort by newest first, show ALL orders as requested
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

    if (isLoading) return <div className="text-center p-10">Loading orders...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">All Orders</h1>
                <p className="text-gray-500 text-sm">Manage order status: Ready → Served → Paid.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allOrders.map(order => (
                    <div
                        key={order.id}
                        onClick={() => {
                            // Only navigate if order is active (not paid/served/completed/cancelled) for adding items
                            if (['pending', 'preparing', 'ready'].includes(order.status)) {
                                navigate(`/staff/orders/new?tableId=${order.table_id}&tableNum=${order.table_id}&orderId=${order.id}`);
                            }
                        }}
                        className={`bg-white p-5 rounded-xl border transition-all relative group ${['pending', 'preparing', 'ready'].includes(order.status) ? 'cursor-pointer hover:shadow-md border-gray-200' : 'cursor-default border-gray-100 opacity-75'
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
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${order.status === 'ready' ? 'bg-green-100 text-green-700' :
                                order.status === 'served' ? 'bg-purple-100 text-purple-700' :
                                    order.status === 'preparing' ? 'bg-blue-100 text-blue-700' :
                                        order.status === 'paid' || order.status === 'completed' ? 'bg-gray-100 text-gray-500 line-through' :
                                            'bg-amber-100 text-amber-700'
                                }`}>
                                {order.status}
                            </span>
                            {order.payment_requested && (
                                <span className="ml-2 animate-pulse px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold uppercase rounded border border-red-200">
                                    Bill Requested
                                </span>
                            )}
                        </div>

                        <div className="flex justify-between items-end border-t border-gray-100 pt-4 mb-4">
                            <div>
                                <p className="text-xs text-gray-400 mb-0.5">Total Amount</p>
                                <p className="font-bold text-gray-900 text-lg flex items-center gap-1">
                                    <DollarSign className="w-4 h-4 text-primary" />
                                    {order.total_amount}
                                </p>
                            </div>
                            {['pending', 'preparing', 'ready'].includes(order.status) && (
                                <div className="text-primary group-hover:translate-x-1 transition-transform">
                                    <ArrowRight className="w-5 h-5" />
                                </div>
                            )}
                        </div>

                        {/* Status Action Button */}
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

                        {order.status === 'served' && (
                            <button
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                        // Step 1: Get payment for this order
                                        const paymentsRes = await api.get(`/payments/order/${order.id}`);
                                        const payments = paymentsRes.data;

                                        if (payments && payments.length > 0) {
                                            const payment = payments[0]; // Get the first/latest payment

                                            // Step 2: Update payment status to completed
                                            await api.patch(`/payments/${payment.id}/status?payment_status=completed`);
                                        }

                                        // Step 3: Update order status to paid
                                        updateStatusMutation.mutate({ id: order.id, status: 'paid' });
                                    } catch (error) {
                                        console.error('Error updating payment:', error);
                                        alert('Failed to process payment. Please try again.');
                                    }
                                }}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
                            >
                                <DollarSign className="w-4 h-4" />
                                Mark Paid
                            </button>
                        )}

                        {/* Helper text for active orders */}
                        {['pending', 'preparing'].includes(order.status) && (
                            <div className="text-xs text-center text-gray-400 bg-gray-50 rounded py-1">
                                Click to add items
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
