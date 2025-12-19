import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import {
    Search,
    Filter,
    CheckCircle,
    XCircle,
    ChefHat,
    Eye,
    Trash2
} from 'lucide-react';

export default function AdminOrdersPage() {
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [searchId, setSearchId] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const queryClient = useQueryClient();

    // Fetch Orders
    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['orders'],
        queryFn: async () => {
            const res = await api.get('/orders/');
            return res.data;
        }
    });

    // Fetch Order Items for selected order
    const { data: orderItems = [], isLoading: itemsLoading } = useQuery({
        queryKey: ['orderItems', selectedOrder],
        queryFn: async () => {
            if (!selectedOrder) return [];
            const res = await api.get(`/order-items/order/${selectedOrder}`);
            return res.data;
        },
        enabled: !!selectedOrder
    });

    // Update Status Mutation
    const updateStatusMutation = useMutation({
        mutationFn: async ({ orderId, status }) => {
            return api.put(`/orders/${orderId}`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['orders']);
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (orderId) => {
            return api.delete(`/orders/${orderId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['orders']);
        }
    });

    const handleStatusChange = (orderId, newStatus) => {
        if (window.confirm(`Change order #${orderId} status to ${newStatus}?`)) {
            updateStatusMutation.mutate({ orderId, status: newStatus });
        }
    };

    const handleDelete = (orderId) => {
        if (window.confirm(`Are you sure you want to delete order #${orderId}?`)) {
            deleteMutation.mutate(orderId);
        }
    }

    // Filter Logic
    const filteredOrders = orders.filter(order => {
        const matchesStatus = filterStatus === 'ALL' || order.status === filterStatus;
        const matchesSearch = searchId === '' || order.id.toString().includes(searchId);
        return matchesStatus && matchesSearch;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'preparing': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (isLoading) return <div className="p-10 text-center">Loading orders...</div>;

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Order Management</h1>
                    <p className="text-gray-500 text-sm">Manage and track all customer orders</p>
                </div>

                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search Order ID..."
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm w-full md:w-64"
                        />
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm appearance-none bg-white cursor-pointer"
                        >
                            <option value="ALL">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="preparing">Preparing</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Order ID</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Date</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Table</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Total</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-10 text-center text-gray-400">
                                        No orders found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">#{order.id}</td>
                                        <td className="px-6 py-4 text-gray-500 text-sm">
                                            {new Date(order.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-sm">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 font-medium">
                                                <UtensilsCrossedIcon className="w-3 h-3" />
                                                {order.table_id}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            ${order.final_amount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Quick Actions based on status */}
                                                {order.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleStatusChange(order.id, 'confirmed')}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg tooltip"
                                                        title="Confirm Order"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {order.status === 'confirmed' && (
                                                    <button
                                                        onClick={() => handleStatusChange(order.id, 'preparing')}
                                                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"
                                                        title="Start Preparing"
                                                    >
                                                        <ChefHat className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {order.status === 'preparing' && (
                                                    <button
                                                        onClick={() => handleStatusChange(order.id, 'delivered')}
                                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                                                        title="Mark Delivered"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => setSelectedOrder(order.id)}
                                                    className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-lg"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => handleDelete(order.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">Order #{selectedOrder} Details</h3>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full">
                                <XCircle className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            {itemsLoading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                    <p className="mt-2 text-gray-500">Loading items...</p>
                                </div>
                            ) : orderItems.length === 0 ? (
                                <p className="text-center text-gray-500">No items found for this order.</p>
                            ) : (
                                <div className="space-y-4">
                                    {orderItems.map((item) => (
                                        <div key={item.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="font-semibold text-gray-800">Item #{item.menu_item_id}</p>
                                                <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                                                {item.notes && <p className="text-xs text-amber-600 mt-1">Note: {item.notes}</p>}
                                            </div>
                                            <p className="font-bold text-gray-900">${item.sub_total.toFixed(2)}</p>
                                        </div>
                                    ))}

                                    <div className="border-t border-gray-200 pt-4 mt-4 flex justify-between items-center">
                                        <span className="font-bold text-gray-900">Total</span>
                                        <span className="font-bold text-primary text-lg">
                                            ${orderItems.reduce((acc, curr) => acc + curr.sub_total, 0).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function UtensilsCrossedIcon({ className }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8" />
            <path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2 0L19 10" />
            <line x1="2" x2="22" y1="2" y2="22" />
        </svg>
    )
}
