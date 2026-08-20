import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { Activity, DollarSign, Calendar, CreditCard, BarChart2 } from 'lucide-react';

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

export default function PeriodTrendChart({ summary, periodLabel }) {
    const totalRevenue = summary?.total_revenue ?? 0;
    const totalPayments = summary?.payments_count ?? 0;
    const dailyList = summary?.daily_breakdown || [];

    const chartData = dailyList.map((item) => ({
        name: item.date,
        shortName: item.date.slice(5),
        revenue: Number(item.total_revenue) || 0,
        payments: item.payments_count || 0,
    }));

    const hasData = chartData.length > 0 && totalRevenue > 0;

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-slate-900/95 text-white p-4 rounded-xl shadow-xl border border-slate-700/50 backdrop-blur-md text-xs min-w-[180px] animate-fade-in">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700">
                        <span className="font-bold text-sm text-emerald-400">{data.name}</span>
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Revenue:</span>
                            <span className="font-bold text-white text-sm">{formatVND(data.revenue)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Orders:</span>
                            <span className="font-semibold text-slate-200">{data.payments} orders</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Revenue Trend</h2>
                        <p className="text-xs text-gray-500">{periodLabel}</p>
                    </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    {periodLabel}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50/40 border border-emerald-100">
                    <p className="text-xs font-medium text-emerald-700 mb-1">Total Period Revenue</p>
                    <p className="text-xl font-bold text-emerald-950">{formatVND(totalRevenue)}</p>
                    <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                        <CreditCard className="w-3 h-3" /> {totalPayments} payments recorded
                    </p>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/40 border border-blue-100">
                    <p className="text-xs font-medium text-blue-700 mb-1">Active Days with Revenue</p>
                    <p className="text-xl font-bold text-blue-950">
                        {chartData.filter((d) => d.revenue > 0).length} days
                    </p>
                    <p className="text-[11px] text-blue-600 mt-1">Within selected period</p>
                </div>
            </div>

            <div className="pt-2">
                {!hasData ? (
                    <div className="h-64 w-full flex flex-col items-center justify-center bg-gray-50/70 rounded-xl border border-dashed border-gray-200 text-center p-6">
                        <div className="p-3 bg-white rounded-full shadow-2xs mb-2.5 text-gray-400 border border-gray-100">
                            <BarChart2 className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm font-semibold text-gray-700">No daily revenue records in this timeframe</p>
                        <p className="text-xs text-gray-400 mt-1 max-w-sm">
                            Completed customer payments will appear here automatically.
                        </p>
                    </div>
                ) : (
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={chartData}
                                margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                            >
                                <defs>
                                    <linearGradient id="periodRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis
                                    dataKey="shortName"
                                    tickLine={false}
                                    axisLine={{ stroke: '#E2E8F0' }}
                                    tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={{ stroke: '#E2E8F0' }}
                                    tickFormatter={formatShortVND}
                                    tick={{ fill: '#64748B', fontSize: 11 }}
                                    width={65}
                                    domain={[0, 'auto']}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#10B981"
                                    strokeWidth={2.5}
                                    fillOpacity={1}
                                    fill="url(#periodRevenueGradient)"
                                    dot={{ r: 3, stroke: '#10B981', fill: '#FFFFFF', strokeWidth: 2 }}
                                    activeDot={{ r: 5, stroke: '#059669', fill: '#FFFFFF', strokeWidth: 2.5 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
}
