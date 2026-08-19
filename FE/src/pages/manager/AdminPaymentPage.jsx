import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import {
    Search,
    Filter,
    DollarSign,
    CreditCard,
    CheckCircle,
    XCircle,
    Clock,
    RefreshCcw
} from 'lucide-react';

const PAYMENT_METHODS = ['cash', 'credit_card', 'debit_card', 'mobile_payment'];
const PAYMENT_STATUSES = ['pending', 'completed', 'failed', 'refunded'];

export default function AdminPaymentPage() {
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    const queryClient = useQueryClient();

    // Fetch Payments
    const { data: payments = [], isLoading } = useQuery({
        queryKey: ['payments'],
        queryFn: async () => {
            const res = await api.get('/payments/');
            return res.data;
        }
    });

    // Update Status Mutation
    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }) => {
            // Backend expects query param for status? Checking controller: 
            // @router.patch("/{payment_id}/status", ...)
            // def update_payment_status(..., payment_status: PaymentStatus, ...)
            // It likely expects a query param 'payment_status' 
            return api.patch(`/payments/${id}/status?payment_status=${status}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['payments']);
        },
        onError: (err) => {
            alert("Failed to update status: " + (err.response?.data?.detail || err.message));
        }
    });

    const handleStatusChange = (id, newStatus) => {
        if (window.confirm(`Mark payment #${id} as ${newStatus}?`)) {
            updateStatusMutation.mutate({ id, status: newStatus });
        }
    };

    const filteredPayments = payments.filter(payment => {
        const matchesStatus = filterStatus === 'ALL' || payment.payment_status === filterStatus;
        // Search by Transaction ID or Order ID
        const matchesSearch =
            (payment.transaction_id && payment.transaction_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
            payment.order_id.toString().includes(searchQuery);

        return matchesStatus && matchesSearch;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800 border-green-200';
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'failed': return 'bg-red-100 text-red-800 border-red-200';
            case 'refunded': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-50 text-gray-500';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Payment History</h1>
                <p className="text-gray-500 text-sm">View and manage transaction records</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search Order ID or Transaction ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    />
                </div>

                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm appearance-none bg-white cursor-pointer capitalize"
                    >
                        <option value="ALL">All Status</option>
                        {PAYMENT_STATUSES.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Date</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Order ID</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Transaction ID</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Method</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Amount</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                                        Loading payments...
                                    </td>
                                </tr>
                            ) : filteredPayments.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-10 text-center text-gray-400">
                                        No payments found.
                                    </td>
                                </tr>
                            ) : (
                                filteredPayments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-gray-500 text-sm whitespace-nowrap">
                                            {new Date(payment.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            #{payment.order_id}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-sm font-mono text-xs">
                                            {payment.transaction_id || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 text-sm capitalize">
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="w-4 h-4 text-gray-400" />
                                                {payment.payment_method.replace('_', ' ')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-900">
                                            ${payment.amount_paid.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${getStatusColor(payment.payment_status)}`}>
                                                {payment.payment_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {payment.payment_status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusChange(payment.id, 'completed')}
                                                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg tooltip"
                                                            title="Mark Completed"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(payment.id, 'failed')}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                                            title="Mark Failed"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                                {/* Allow refund for completed? */}
                                                {payment.payment_status === 'completed' && (
                                                    <button
                                                        onClick={() => handleStatusChange(payment.id, 'refunded')}
                                                        className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                                                        title="Mark Refunded"
                                                    >
                                                        <RefreshCcw className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
