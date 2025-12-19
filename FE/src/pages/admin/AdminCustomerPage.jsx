import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { Search, ShieldAlert, CheckCircle, XCircle, User } from 'lucide-react';

export default function AdminCustomerPage() {
    const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'all'
    const [searchQuery, setSearchQuery] = useState('');
    const queryClient = useQueryClient();

    // Fetch VIP Requests
    const { data: vipRequests = [], isLoading: loadingRequests } = useQuery({
        queryKey: ['vipRequests'],
        queryFn: async () => {
            const res = await api.get('/vip-requests/?status=pending');
            return res.data;
        }
    });

    // Fetch All Customers
    const { data: customers = [] } = useQuery({
        queryKey: ['customers'],
        queryFn: async () => {
            const res = await api.get('/customers/');
            return res.data;
        }
    });

    // Update Status Mutation
    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }) => {
            return api.put(`/vip-requests/${id}`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['vipRequests']);
            queryClient.invalidateQueries(['customers']); // Refresh roles
            alert("Request updated successfully!");
        },
        onError: (err) => {
            alert("Failed to update: " + err.message);
        }
    });

    const filteredCustomers = customers.filter(c =>
        c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Customer Management</h1>
                    <p className="text-gray-500 text-sm">Manage user roles and VIP requests</p>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'requests' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        VIP Requests
                        {vipRequests.length > 0 && (
                            <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{vipRequests.length}</span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'all' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        All Customers
                    </button>
                </div>
            </div>

            {activeTab === 'requests' ? (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-amber-500" />
                            Pending Requests
                        </h2>
                    </div>

                    {loadingRequests ? (
                        <div className="p-10 text-center text-gray-400">Loading requests...</div>
                    ) : vipRequests.length === 0 ? (
                        <div className="p-10 text-center text-gray-400">
                            No pending VIP requests.
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {vipRequests.map(req => (
                                <div key={req.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                                            <User className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">Customer ID: {req.customer_id}</h3>
                                            <p className="text-sm text-gray-500">Reason: <span className="italic">"{req.reason || 'No reason provided'}"</span></p>
                                            <p className="text-xs text-gray-400 mt-1">Requested on: {new Date(req.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        <button
                                            onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'rejected' })}
                                            className="flex-1 md:flex-none px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium flex items-center justify-center gap-2"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'approved' })}
                                            className="flex-1 md:flex-none px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Approve
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search customers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3">ID</th>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Username</th>
                                    <th className="px-6 py-3">Role</th>
                                    <th className="px-6 py-3">Joined</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredCustomers.map(c => (
                                    <tr key={c.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-gray-500">#{c.id}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{c.full_name}</td>
                                        <td className="px-6 py-4 text-gray-600">{c.username}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${c.role === 'vip_customer' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {c.role ? c.role.replace('_', ' ') : 'Regular'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{new Date(c.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
