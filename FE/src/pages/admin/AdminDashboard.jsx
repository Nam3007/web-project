import { useState } from 'react';
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
    const [period, setPeriod] = useState('last_week');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reportYear, setReportYear] = useState(new Date().getFullYear());
    const [reportQuarter, setReportQuarter] = useState(1);

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

    const revenueQuery = useQuery({
        queryKey: ['revenue-summary', period, startDate, endDate, reportYear, reportQuarter],
        enabled: period !== 'date_range' || Boolean(startDate && endDate),
        queryFn: async () => {
            try {
                const params = new URLSearchParams({ period });

                if (period === 'date_range') {
                    if (startDate) params.set('start_date', startDate);
                    if (endDate) params.set('end_date', endDate);
                }

                if (period === 'quarter') {
                    params.set('year', String(reportYear));
                    params.set('quarter', String(reportQuarter));
                }

                if (period === 'year') {
                    params.set('year', String(reportYear));
                }

                const res = await api.get(`/payments/summary?${params.toString()}`);
                return res.data;
            } catch (e) {
                console.error('Failed to fetch revenue summary', e);
                return null;
            }
        }
    });

    const revenueSummary = revenueQuery.data;

    // Calculate Stats
    const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled' && o.status !=='delivered').length;
    const occupiedTables = tables.filter(t => t.is_occupied).length;
    const totalRevenue = revenueSummary?.total_revenue ?? 0;
    const reportLabel = period === 'last_week'
        ? 'Last 7 days'
        : period === 'date_range'
            ? 'Custom range'
            : period === 'quarter'
                ? `Q${reportQuarter} ${reportYear}`
                : `Year ${reportYear}`;

    const stats = [
        {
            label: 'Total Revenue',
            value: totalRevenue.toLocaleString('vi-VN') + " ₫",
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

    if (ordersLoading || tablesLoading || revenueQuery.isLoading) {
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

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="flex flex-wrap gap-2">
                    {[
                        ['last_week', 'Last week'],
                        ['date_range', 'Date range'],
                        ['quarter', 'Quarter'],
                        ['year', 'Year quarters'],
                    ].map(([value, label]) => (
                        <button
                            key={value}
                            onClick={() => setPeriod(value)}
                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${period === value ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
                    {period === 'date_range' && (
                        <>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </>
                    )}

                    {(period === 'quarter' || period === 'year') && (
                        <>
                            <input
                                type="number"
                                min="2000"
                                value={reportYear}
                                onChange={(e) => setReportYear(Number(e.target.value) || new Date().getFullYear())}
                                className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            {period === 'quarter' && (
                                <select
                                    value={reportQuarter}
                                    onChange={(e) => setReportQuarter(Number(e.target.value))}
                                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                                >
                                    {[1, 2, 3, 4].map((q) => (
                                        <option key={q} value={q}>Q{q}</option>
                                    ))}
                                </select>
                            )}
                        </>
                    )}
                </div>
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
                                        <p className="font-bold text-gray-900">{order.total_amount.toLocaleString('vi-VN')} ₫</p>
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
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-800">Revenue Report</h2>
                        <span className="text-sm text-gray-500">{reportLabel}</span>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                            <div>
                                <p className="font-medium text-emerald-700">Total revenue</p>
                                <p className="text-sm text-emerald-600">Completed payments only</p>
                            </div>
                            <span className="text-lg font-bold text-emerald-700">{totalRevenue.toLocaleString('vi-VN')} ₫</span>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 border border-blue-100">
                            <div className="flex items-center gap-3">
                                <Users className="w-4 h-4 text-blue-500" />
                                <span className="font-medium text-blue-700">Staff Online</span>
                            </div>
                            <span className="text-sm text-blue-600">Checking...</span>
                        </div>

                        {revenueSummary?.quarterly_breakdown?.length > 0 && (
                            <div className="space-y-2 pt-2">
                                {revenueSummary.quarterly_breakdown.map((item) => (
                                    <div key={item.quarter} className="flex items-center justify-between text-sm p-3 rounded-lg bg-gray-50">
                                        <span className="font-medium text-gray-700">Q{item.quarter}</span>
                                        <span className="text-gray-900">{item.total_revenue.toLocaleString('vi-VN')} ₫</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
