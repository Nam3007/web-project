import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, Calendar, DollarSign, ChevronRight, Crown, Loader } from 'lucide-react';

const VIP_THRESHOLD = 500;

export default function CustomerOrdersPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // 1. Fetch Orders
    const { data: allOrders = [], isLoading } = useQuery({
        queryKey: ['myOrders'],
        queryFn: async () => {
            // Filter logic client side for demo
            const res = await api.get('/orders/');
            return res.data;
        }
    });

    const myOrders = allOrders
        .filter(o => o.customer_id === user.id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Calculate Total Spent (only paid or completed)
    const totalSpent = myOrders
        .filter(o => o.status === 'paid' || o.status === 'completed')
        .reduce((sum, o) => sum + o.total_amount, 0);

    // 2. Fetch My Pending/Rejected requests to know status
    // Ideally GET /vip-requests/me but we have GET /vip-requests?status=...
    // We'll just try to create and catch 400 if exists, or adding checking endpoint.
    // Let's implement optimistic check by assuming we can try.
    // Or better, fetch all requests (?) no that's security issue.
    // Let's just rely on the "Try" action or checking user role.

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

    // Mutation to Request Bill
    const requestBillMutation = useMutation({
        mutationFn: async ({ orderId, paymentMethod }) => {
            // Step 1: Create payment record
            await api.post('/payments/', {
                order_id: orderId,
                payment_method: paymentMethod
            });

            // Step 2: Update order to mark payment_requested
            return api.put(`/orders/${orderId}`, {
                payment_requested: true,
                payment_method: paymentMethod
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['myOrders']);
            alert("Bill requested! Staff has been notified.");
        },
        onError: (err) => {
            alert("Failed to request bill: " + err.message);
        }
    });

    if (isLoading) return <div className="text-center py-20">Loading orders...</div>;

    const isVip = user.role === 'vip_customer';
    const progress = Math.min((totalSpent / VIP_THRESHOLD) * 100, 100);

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* VIP Status Card */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Crown className={`w-6 h-6 ${isVip ? 'text-amber-400' : 'text-gray-400'}`} />
                            {isVip ? 'VIP Member' : 'Member Status'}
                        </h2>
                        <p className="opacity-80 mt-1">
                            {isVip
                                ? "Thank you for being one of our most valued customers!"
                                : `Spend $${VIP_THRESHOLD} to unlock VIP benefits.`}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm opacity-60">Total Spent</p>
                        <p className="text-3xl font-bold text-emerald-400">${totalSpent.toFixed(2)}</p>
                    </div>
                </div>

                {!isVip && (
                    <div className="mt-6 relative z-10">
                        <div className="flex justify-between text-xs mb-2 font-medium opacity-80">
                            <span>$0</span>
                            <span>${VIP_THRESHOLD}</span>
                        </div>
                        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-amber-300 to-amber-500 transition-all duration-1000"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>

                        {totalSpent >= VIP_THRESHOLD && (
                            <button
                                onClick={() => requestVipMutation.mutate()}
                                disabled={requestVipMutation.isPending}
                                className="mt-4 w-full py-3 bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                {requestVipMutation.isPending ? <Loader className="w-5 h-5 animate-spin" /> : <Crown className="w-5 h-5" />}
                                Request VIP Status
                            </button>
                        )}
                    </div>
                )}

                {/* Decoration */}
                <Crown className="absolute -bottom-4 -right-4 w-32 h-32 text-white/5 rotate-12" />
            </div>

            {/* History */}
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-800">Order History</h1>

                {myOrders.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
                        <p className="text-gray-500">No past orders found.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {myOrders.map(order => (
                            <div key={order.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-gray-50 rounded-xl">
                                        <ShoppingBag className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">Order #{order.id}</h3>
                                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
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
                                    <div className="flex items-center gap-6">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${order.status === 'completed' || order.status === 'paid' ? 'bg-green-100 text-green-700' :
                                            order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                'bg-amber-100 text-amber-900'
                                            }`}>
                                            {order.status}
                                        </span>

                                        <p className="font-bold text-lg text-gray-900 flex items-center gap-1">
                                            <DollarSign className="w-4 h-4 text-gray-400" />
                                            {order.total_amount}
                                        </p>

                                        <button className="text-primary hover:bg-primary/5 p-2 rounded-full">
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Request Payment Button */}
                                    {['served'].includes(order.status) && !order.payment_requested && (
                                        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                                            <select
                                                className="bg-transparent text-xs font-medium text-gray-700 outline-none p-1"
                                                onChange={(e) => {
                                                    const el = document.getElementById(`pay-method-${order.id}`);
                                                    if (el) el.value = e.target.value;
                                                }}
                                                defaultValue="cash"
                                                id={`pay-method-select-${order.id}`}
                                            >
                                                <option value="cash">Cash</option>
                                                <option value="card">Card</option>
                                                <option value="digital_wallet">E-Wallet</option>
                                            </select>
                                            <input type="hidden" id={`pay-method-${order.id}`} value="cash" />
                                            <button
                                                onClick={() => {
                                                    const method = document.getElementById(`pay-method-${order.id}`).value;
                                                    requestBillMutation.mutate({ orderId: order.id, paymentMethod: method });
                                                }}
                                                disabled={requestBillMutation.isPending}
                                                className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 rounded-lg font-bold transition-colors"
                                            >
                                                {requestBillMutation.isPending ? '...' : 'Request Bill'}
                                            </button>
                                        </div>
                                    )}
                                    {order.payment_requested && (
                                        <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">Bill Requested</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
