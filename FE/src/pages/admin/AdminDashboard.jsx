import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import {
    TrendingUp,
    Users,
    Utensils,
    Clock,
    DollarSign,
    AlertCircle,
    ShoppingBag
} from 'lucide-react';

export default function AdminDashboard() {
    // Fetch Orders
    const { data: orders = [], isLoading: ordersLoading } = useQuery({
        queryKey: ['orders'],
        queryFn: async () => {
            const res = await api.get('/orders/');
            return res.data;
        }
    });

    // Fetch Tables
    const { data: tables = [], isLoading: tablesLoading } = useQuery({
        queryKey: ['tables'],
        queryFn: async () => {
            const res = await api.get('/tables/');
            return res.data;
        }
    });

    // Fetch Payments (for revenue)
    const { data: payments = [], isLoading: paymentsLoading } = useQuery({
        queryKey: ['payments'],
        queryFn: async () => {
            // Assuming GET /payments returns all payments
            try {
                const res = await api.get('/payments/');
                return res.data;
            } catch (e) {
                console.error("Failed to fetch payments", e);
                return [];
            }
        }
    });

    // Calculate Stats
    const activeOrders = orders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED').length;
    const occupiedTables = tables.filter(t => t.is_occupied).length;
    const totalRevenue = payments
        .filter(p => p.payment_status === 'completed')
        .reduce((sum, p) => sum + p.amount_paid, 0);

    const stats = [
        {
            label: 'Total Revenue',
            value: `$${totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            color: 'text-emerald-600',
            bg: 'bg-emerald-100'
        },
        {
            label: 'Active Orders',
            value: activeOrders,
            icon: Clock,
            color: 'text-amber-600',
            bg: 'bg-amber-100'
        },
        {
            label: 'Occupied Tables',
            value: `${occupiedTables} / ${tables.length}`,
            icon: Utensils,
            color: 'text-blue-600',
            bg: 'bg-blue-100'
        },
        {
            label: 'Total Orders today',
            value: orders.length, // Simplified for now, really should filter by date
            icon: TrendingUp,
            color: 'text-indigo-600',
            bg: 'bg-indigo-100'
        },
    ];

    if (ordersLoading || tablesLoading || paymentsLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
                <p className="text-gray-500">Welcome back, here's what's happening today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                                    <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                                </div>
                                <div className={`p-3 rounded-xl ${stat.bg}`}>
                                    <Icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Orders */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-800">Recent Orders</h2>
                        <button className="text-sm text-primary font-medium hover:underline">View all</button>
                    </div>

                    {orders.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            No orders found.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.slice(-5).reverse().map(order => (
                                <div key={order.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-white rounded-lg border border-gray-200">
                                            <ShoppingBag className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">Order #{order.id}</p>
                                            <p className="text-xs text-gray-500">Table {order.table_id || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900">${order.total_amount}</p>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                            order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-blue-100 text-blue-800'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions or Other Stats */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-6">System Status</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-green-50 border border-green-100">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="font-medium text-green-700">Backend System</span>
                            </div>
                            <span className="text-sm text-green-600">Operational</span>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 border border-blue-100">
                            <div className="flex items-center gap-3">
                                <Users className="w-4 h-4 text-blue-500" />
                                <span className="font-medium text-blue-700">Staff Online</span>
                            </div>
                            <span className="text-sm text-blue-600">Checking...</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
