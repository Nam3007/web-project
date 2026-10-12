import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import QuarterLineChart from '../../components/dashboard/QuarterLineChart';
import YearBarChart from '../../components/dashboard/YearBarChart';
import PeriodTrendChart from '../../components/dashboard/PeriodTrendChart';
import {
    TrendingUp,
    Users,
    Utensils,
    Clock,
    DollarSign,
    AlertCircle,
    ShoppingBag,
    Calendar,
    ChevronRight,
    CheckCircle2,
    PieChart,
    ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
    const [period, setPeriod] = useState('quarter');
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
    const activeOrders = orders.filter(
        o => o.status !== 'completed' && o.status !== 'cancelled' && o.status !== 'delivered'
    ).length;
    const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'COMPLETED').length;
    const occupiedTables = tables.filter(t => t.is_occupied).length;
    const totalRevenue = revenueSummary?.total_revenue ?? 0;

    const reportLabel = period === 'last_week'
        ? 'Last 7 days'
        : period === 'date_range'
            ? `${startDate || 'Start'} to ${endDate || 'End'}`
            : period === 'quarter'
                ? `Quarter ${reportQuarter} (${reportYear})`
                : `Year ${reportYear}`;

    const stats = [
        {
            label: 'Total Revenue',
            value: totalRevenue.toLocaleString('vi-VN') + " ₫",
            subtext: reportLabel,
            icon: DollarSign,
            color: 'text-emerald-600',
            bg: 'bg-emerald-100'
        },
        {
            label: 'Active Orders',
            value: activeOrders,
            subtext: 'In progress right now',
            icon: Clock,
            color: 'text-amber-600',
            bg: 'bg-amber-100'
        },
        {
            label: 'Table Occupancy',
            value: `${occupiedTables} / ${tables.length}`,
            subtext: `${tables.length > 0 ? ((occupiedTables / tables.length) * 100).toFixed(0) : 0}% occupied`,
            icon: Utensils,
            color: 'text-blue-600',
            bg: 'bg-blue-100'
        },
        {
            label: 'Total Orders',
            value: orders.length,
            subtext: `${completedOrders} completed`,
            icon: TrendingUp,
            color: 'text-indigo-600',
            bg: 'bg-indigo-100'
        },
    ];

    if (ordersLoading || tablesLoading || revenueQuery.isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-sm font-medium text-gray-500">Loading dashboard analytics...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
                <p className="text-gray-500">Welcome back, here's the performance and operational overview.</p>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="flex flex-wrap gap-2">
                    {[
                        ['quarter', 'Quarter'],
                        ['year', 'Year quarters'],
                        ['last_week', 'Last week'],
                        ['date_range', 'Date range'],
                    ].map(([value, label]) => (
                        <button
                            key={value}
                            onClick={() => setPeriod(value)}
                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
                                period === value
                                    ? 'bg-primary text-white border-primary shadow-sm'
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
                    {period === 'date_range' && (
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <span className="text-gray-400 text-sm">to</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    )}

                    {(period === 'quarter' || period === 'year') && (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-gray-500">Year:</span>
                                <input
                                    type="number"
                                    min="2000"
                                    max="2100"
                                    value={reportYear}
                                    onChange={(e) => setReportYear(Number(e.target.value) || new Date().getFullYear())}
                                    className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            {period === 'quarter' && (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold text-gray-500">Quarter:</span>
                                    <select
                                        value={reportQuarter}
                                        onChange={(e) => setReportQuarter(Number(e.target.value))}
                                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white cursor-pointer"
                                    >
                                        {[1, 2, 3, 4].map((q) => (
                                            <option key={q} value={q}>Quarter {q} (Q{q})</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                                    <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                                    <p className="text-xs text-gray-400 mt-1">{stat.subtext}</p>
                                </div>
                                <div className={`p-3 rounded-xl ${stat.bg}`}>
                                    <Icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Visual Analytics Chart Section */}
            <div>
                {period === 'quarter' && (
                    <QuarterLineChart
                        summary={revenueSummary}
                        year={reportYear}
                        quarter={reportQuarter}
                    />
                )}

                {period === 'year' && (
                    <YearBarChart
                        summary={revenueSummary}
                        year={reportYear}
                    />
                )}

                {(period === 'last_week' || period === 'date_range') && (
                    <PeriodTrendChart
                        summary={revenueSummary}
                        periodLabel={reportLabel}
                    />
                )}
            </div>

            {/* Orders & Operational Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Orders */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Recent Orders</h2>
                            <p className="text-xs text-gray-500">Latest customer orders activity</p>
                        </div>
                        <Link
                            to="/manager/orders"
                            className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5"
                        >
                            View all <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {orders.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-gray-500">No orders found</p>
                            <p className="text-xs text-gray-400">Customer orders will appear here as they are placed.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {orders.slice(-5).reverse().map((order) => (
                                <div
                                    key={order.id}
                                    className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50/80 hover:bg-emerald-50/40 hover:border-emerald-100 border border-transparent transition-all"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="p-2.5 bg-white rounded-xl border border-gray-200 shadow-2xs">
                                            <ShoppingBag className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">Order #{order.id}</p>
                                            <p className="text-xs text-gray-500">
                                                {order.table_id ? `Table #${order.table_id}` : 'Takeaway / Delivery'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900 text-sm">
                                            {(order.total_amount || 0).toLocaleString('vi-VN')} ₫
                                        </p>
                                        <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold mt-0.5 ${
                                                order.status === 'COMPLETED' || order.status === 'completed'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : order.status === 'PENDING' || order.status === 'pending'
                                                        ? 'bg-amber-100 text-amber-800'
                                                        : 'bg-blue-100 text-blue-800'
                                            }`}
                                        >
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Operations & Table Summary */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Restaurant Operations</h2>
                            <p className="text-xs text-gray-500">Live tables and order fulfillment</p>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                            Live Status
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="flex items-center gap-2 mb-1">
                                <Utensils className="w-4 h-4 text-emerald-600" />
                                <span className="text-xs font-semibold text-gray-600">Occupied Tables</span>
                            </div>
                            <p className="text-xl font-bold text-gray-900">{occupiedTables} / {tables.length}</p>
                            <div className="mt-2 w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className="bg-emerald-500 h-full rounded-full"
                                    style={{
                                        width: `${tables.length > 0 ? (occupiedTables / tables.length) * 100 : 0}%`
                                    }}
                                />
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="flex items-center gap-2 mb-1">
                                <Clock className="w-4 h-4 text-amber-600" />
                                <span className="text-xs font-semibold text-gray-600">Pending Orders</span>
                            </div>
                            <p className="text-xl font-bold text-gray-900">{activeOrders}</p>
                            <p className="text-[11px] text-gray-500 mt-1">Awaiting completion</p>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-emerald-800">Revenue Settlement</p>
                            <p className="text-xs text-emerald-600">Auto-synchronized with completed payments</p>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>

                    {revenueSummary?.quarterly_breakdown?.length > 0 && period !== 'year' && (
                        <div className="space-y-2 pt-1 border-t border-gray-100">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Annual Quarters Snapshot
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                                {revenueSummary.quarterly_breakdown.map((item) => (
                                    <div
                                        key={item.quarter}
                                        className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-gray-50"
                                    >
                                        <span className="font-bold text-gray-700">Q{item.quarter}</span>
                                        <span className="font-semibold text-gray-900">
                                            {(item.total_revenue || 0).toLocaleString('vi-VN')} ₫
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

