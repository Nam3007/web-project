import React, { useState } from 'react';
import {
    AreaChart,
    Area,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Calendar,
    Award,
    CreditCard,
    BarChart2,
    Activity
} from 'lucide-react';

const formatVND = (value) => {
    return (value || 0).toLocaleString('vi-VN') + ' ₫';
};

const formatShortVND = (value) => {
    if (value >= 1_000_000_000) {
        return (value / 1_000_000_000).toFixed(1) + 'B ₫';
    }
    if (value >= 1_000_000) {
        return (value / 1_000_000).toFixed(1) + 'M ₫';
    }
    if (value >= 1_000) {
        return (value / 1_000).toFixed(0) + 'k ₫';
    }
    return (value || 0).toLocaleString('vi-VN') + ' ₫';
};

export default function QuarterLineChart({ summary, year, quarter }) {
    const [viewMode, setViewMode] = useState('monthly'); // 'monthly' | 'daily'

    const totalRevenue = summary?.total_revenue ?? 0;
    const totalPayments = summary?.payments_count ?? 0;

    // Monthly data preparation
    const monthlyList = summary?.monthly_breakdown?.length
        ? summary.monthly_breakdown
        : [
            {
                month: (quarter - 1) * 3 + 1,
                month_name: `Month ${(quarter - 1) * 3 + 1}`,
                total_revenue: 0,
                payments_count: 0,
            },
            {
                month: (quarter - 1) * 3 + 2,
                month_name: `Month ${(quarter - 1) * 3 + 2}`,
                total_revenue: 0,
                payments_count: 0,
            },
            {
                month: (quarter - 1) * 3 + 3,
                month_name: `Month ${(quarter - 1) * 3 + 3}`,
                total_revenue: 0,
                payments_count: 0,
            },
        ];

    const monthlyData = monthlyList.map((item, idx, arr) => {
        const prevRevenue = idx > 0 ? arr[idx - 1].total_revenue : null;
        const growth =
            prevRevenue !== null && prevRevenue > 0
                ? ((item.total_revenue - prevRevenue) / prevRevenue) * 100
                : null;

        return {
            name: item.month_name || `Month ${item.month}`,
            shortName: (item.month_name || `M${item.month}`).slice(0, 3),
            monthNum: item.month,
            revenue: Number(item.total_revenue) || 0,
            payments: item.payments_count || 0,
            percentage: totalRevenue > 0 ? ((item.total_revenue / totalRevenue) * 100).toFixed(1) : 0,
            growth: growth !== null ? growth.toFixed(1) : null,
        };
    });

    // Daily data preparation (if available)
    const dailyData = (summary?.daily_breakdown || []).map((item) => ({
        name: item.date,
        shortName: item.date.slice(5), // MM-DD
        revenue: Number(item.total_revenue) || 0,
        payments: item.payments_count || 0,
    }));

    const activeChartData = viewMode === 'daily' && dailyData.length > 0 ? dailyData : monthlyData;

    // Calculate metrics
    const avgMonthlyRevenue = totalRevenue / 3;
    const maxMonth = [...monthlyData].sort((a, b) => b.revenue - a.revenue)[0];
    const hasData = totalRevenue > 0;

    // Custom Tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-slate-900/95 text-white p-4 rounded-xl shadow-xl border border-slate-700/50 backdrop-blur-md text-xs min-w-[200px] animate-fade-in">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700">
                        <span className="font-bold text-sm text-emerald-400">{data.name}</span>
                        <span className="text-slate-400">Q{quarter} {year}</span>
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Revenue:</span>
                            <span className="font-bold text-white text-sm">{formatVND(data.revenue)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Completed Orders:</span>
                            <span className="font-semibold text-slate-200">{data.payments} orders</span>
                        </div>
                        {data.percentage !== undefined && (
                            <div className="flex justify-between">
                                <span className="text-slate-400">Share of Q{quarter}:</span>
                                <span className="font-semibold text-amber-400">{data.percentage}%</span>
                            </div>
                        )}
                        {data.growth !== null && data.growth !== undefined && (
                            <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                                <span className="text-slate-400">MoM Growth:</span>
                                <span className={`font-semibold flex items-center gap-0.5 ${Number(data.growth) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {Number(data.growth) >= 0 ? '+' : ''}{data.growth}%
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            {/* Header with Title & Granularity Switch */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-gray-100">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                Quarter {quarter} Revenue Trend
                            </h2>
                            <p className="text-xs text-gray-500">
                                Progression across Q{quarter} {year}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {dailyData.length > 0 && (
                        <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-medium">
                            <button
                                onClick={() => setViewMode('monthly')}
                                className={`px-3 py-1.5 rounded-lg transition-all ${
                                    viewMode === 'monthly'
                                        ? 'bg-white text-emerald-700 font-semibold shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                By Month
                            </button>
                            <button
                                onClick={() => setViewMode('daily')}
                                className={`px-3 py-1.5 rounded-lg transition-all ${
                                    viewMode === 'daily'
                                        ? 'bg-white text-emerald-700 font-semibold shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Daily Activity
                            </button>
                        </div>
                    )}

                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        Q{quarter} - {year}
                    </span>
                </div>
            </div>

            {/* KPI Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50/40 border border-emerald-100">
                    <p className="text-xs font-medium text-emerald-700 mb-1">Total Q{quarter} Revenue</p>
                    <p className="text-xl font-bold text-emerald-950">{formatVND(totalRevenue)}</p>
                    <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                        <CreditCard className="w-3 h-3" /> {totalPayments} payments recorded
                    </p>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/40 border border-blue-100">
                    <p className="text-xs font-medium text-blue-700 mb-1">Avg. Monthly Revenue</p>
                    <p className="text-xl font-bold text-blue-950">{formatVND(avgMonthlyRevenue)}</p>
                    <p className="text-[11px] text-blue-600 mt-1">3 months in Q{quarter}</p>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50/40 border border-amber-100">
                    <p className="text-xs font-medium text-amber-700 mb-1">Peak Month</p>
                    <p className="text-xl font-bold text-amber-950">
                        {maxMonth && maxMonth.revenue > 0 ? maxMonth.name : 'N/A'}
                    </p>
                    <p className="text-[11px] text-amber-700 mt-1 font-medium">
                        {maxMonth && maxMonth.revenue > 0 ? formatVND(maxMonth.revenue) : '0 ₫'}
                    </p>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50/40 border border-purple-100">
                    <p className="text-xs font-medium text-purple-700 mb-1">Quarter Status</p>
                    <div className="flex items-center gap-1.5 mt-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <p className="text-base font-bold text-purple-950">Completed</p>
                    </div>
                    <p className="text-[11px] text-purple-600 mt-1">All verified payments</p>
                </div>
            </div>

            {/* Main Line Graph */}
            <div className="pt-2">
                {!hasData ? (
                    <div className="h-64 w-full flex flex-col items-center justify-center bg-gray-50/70 rounded-xl border border-dashed border-gray-200 text-center p-6">
                        <div className="p-3 bg-white rounded-full shadow-2xs mb-2.5 text-gray-400 border border-gray-100">
                            <BarChart2 className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm font-semibold text-gray-700">No revenue data recorded for Q{quarter} {year}</p>
                        <p className="text-xs text-gray-400 mt-1 max-w-sm">
                            Completed customer payments in this quarter will be automatically visualized in this trend line graph.
                        </p>
                    </div>
                ) : (
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={activeChartData}
                                margin={{ top: 20, right: 20, left: 10, bottom: 10 }}
                            >
                                <defs>
                                    <linearGradient id="quarterRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis
                                    dataKey="name"
                                    tickLine={false}
                                    axisLine={{ stroke: '#E2E8F0' }}
                                    tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={{ stroke: '#E2E8F0' }}
                                    tickFormatter={formatShortVND}
                                    tick={{ fill: '#64748B', fontSize: 11 }}
                                    width={70}
                                    domain={[0, 'auto']}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                {avgMonthlyRevenue > 0 && viewMode === 'monthly' && (
                                    <ReferenceLine
                                        y={avgMonthlyRevenue}
                                        stroke="#059669"
                                        strokeDasharray="4 4"
                                        label={{
                                            value: `Avg: ${formatShortVND(avgMonthlyRevenue)}`,
                                            fill: '#059669',
                                            fontSize: 10,
                                            position: 'right',
                                        }}
                                    />
                                )}
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#10B981"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#quarterRevenueGradient)"
                                    activeDot={{
                                        r: 6,
                                        stroke: '#059669',
                                        strokeWidth: 3,
                                        fill: '#FFFFFF',
                                    }}
                                    dot={{
                                        r: 4,
                                        stroke: '#10B981',
                                        strokeWidth: 2,
                                        fill: '#FFFFFF',
                                    }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Monthly Breakdown Cards */}
            <div className="pt-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Months in Quarter {quarter}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {monthlyData.map((item, idx) => (
                        <div
                            key={idx}
                            className="p-4 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-white hover:border-emerald-200 hover:shadow-sm transition-all duration-200"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-gray-800 text-sm">{item.name}</span>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                    {item.percentage}% of Q{quarter}
                                </span>
                            </div>

                            <p className="text-lg font-bold text-gray-900">{formatVND(item.revenue)}</p>

                            <div className="mt-2 w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(Number(item.percentage) || 0, 100)}%` }}
                                />
                            </div>

                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200/60 text-xs text-gray-500">
                                <span>{item.payments} orders</span>
                                {item.growth !== null && (
                                    <span
                                        className={`font-semibold flex items-center gap-0.5 ${
                                            Number(item.growth) >= 0 ? 'text-emerald-600' : 'text-rose-500'
                                        }`}
                                    >
                                        {Number(item.growth) >= 0 ? (
                                            <TrendingUp className="w-3 h-3" />
                                        ) : (
                                            <TrendingDown className="w-3 h-3" />
                                        )}
                                        {Number(item.growth) >= 0 ? '+' : ''}
                                        {item.growth}%
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
