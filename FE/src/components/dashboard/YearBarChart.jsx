import React, { useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Cell,
} from 'recharts';
import {
    TrendingUp,
    TrendingDown,
    Award,
    CreditCard,
    BarChart3,
    Layers,
    Calendar
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

const QUARTER_MONTHS = {
    1: 'Jan – Mar',
    2: 'Apr – Jun',
    3: 'Jul – Sep',
    4: 'Oct – Dec',
};

export default function YearBarChart({ summary, year }) {
    const [activeIndex, setActiveIndex] = useState(null);

    const totalRevenue = summary?.total_revenue ?? 0;
    const totalPayments = summary?.payments_count ?? 0;

    // Prepare all 4 quarters
    const rawBreakdown = summary?.quarterly_breakdown || [];
    const quartersData = [1, 2, 3, 4].map((qNum) => {
        const found = rawBreakdown.find((item) => item.quarter === qNum);
        return {
            quarter: qNum,
            name: `Quarter ${qNum}`,
            shortName: `Q${qNum}`,
            dateSpan: QUARTER_MONTHS[qNum],
            revenue: Number(found?.total_revenue) || 0,
            payments: found?.payments_count || 0,
            monthly_breakdown: found?.monthly_breakdown || [],
        };
    });

    // Compute QoQ Growth & percentage of total
    const enrichedData = quartersData.map((item, idx, arr) => {
        const prevRevenue = idx > 0 ? arr[idx - 1].revenue : null;
        const growth =
            prevRevenue !== null && prevRevenue > 0
                ? ((item.revenue - prevRevenue) / prevRevenue) * 100
                : null;
        const percentage =
            totalRevenue > 0 ? ((item.revenue / totalRevenue) * 100).toFixed(1) : '0.0';

        return {
            ...item,
            percentage,
            growth: growth !== null ? growth.toFixed(1) : null,
        };
    });

    const avgQuarterRevenue = totalRevenue / 4;
    const bestQuarter = [...enrichedData].sort((a, b) => b.revenue - a.revenue)[0];
    const hasData = totalRevenue > 0;

    // Custom Tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-slate-900/95 text-white p-4 rounded-xl shadow-xl border border-slate-700/50 backdrop-blur-md text-xs min-w-[220px] animate-fade-in">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700">
                        <div>
                            <span className="font-bold text-sm text-emerald-400">Q{data.quarter}</span>
                            <span className="text-slate-400 ml-1.5 font-medium">({data.dateSpan})</span>
                        </div>
                        <span className="text-slate-400">{year}</span>
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
                        <div className="flex justify-between">
                            <span className="text-slate-400">Annual Share:</span>
                            <span className="font-semibold text-amber-400">{data.percentage}%</span>
                        </div>
                        {data.growth !== null && (
                            <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                                <span className="text-slate-400">QoQ Growth:</span>
                                <span
                                    className={`font-semibold flex items-center gap-0.5 ${
                                        Number(data.growth) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                    }`}
                                >
                                    {Number(data.growth) >= 0 ? '+' : ''}
                                    {data.growth}%
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
            {/* Header with Title */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                        <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">
                            Quarterly Revenue Comparison
                        </h2>
                        <p className="text-xs text-gray-500">
                            Performance across all 4 quarters of {year}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        Year {year}
                    </span>
                </div>
            </div>

            {/* KPI Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50/40 border border-emerald-100">
                    <p className="text-xs font-medium text-emerald-700 mb-1">Total Year Revenue</p>
                    <p className="text-xl font-bold text-emerald-950">{formatVND(totalRevenue)}</p>
                    <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                        <CreditCard className="w-3 h-3" /> {totalPayments} payments recorded
                    </p>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/40 border border-blue-100">
                    <p className="text-xs font-medium text-blue-700 mb-1">Avg. Quarter Revenue</p>
                    <p className="text-xl font-bold text-blue-950">{formatVND(avgQuarterRevenue)}</p>
                    <p className="text-[11px] text-blue-600 mt-1">4 quarters baseline</p>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50/40 border border-amber-100">
                    <p className="text-xs font-medium text-amber-700 mb-1 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-600" /> Top Quarter
                    </p>
                    <p className="text-xl font-bold text-amber-950">
                        {bestQuarter && bestQuarter.revenue > 0 ? `Q${bestQuarter.quarter}` : 'N/A'}
                    </p>
                    <p className="text-[11px] text-amber-700 mt-1 font-medium">
                        {bestQuarter && bestQuarter.revenue > 0 ? `${formatVND(bestQuarter.revenue)} (${bestQuarter.percentage}%)` : '0 ₫'}
                    </p>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50/40 border border-purple-100">
                    <p className="text-xs font-medium text-purple-700 mb-1">Active Quarters</p>
                    <p className="text-xl font-bold text-purple-950">
                        {enrichedData.filter((q) => q.revenue > 0).length} / 4
                    </p>
                    <p className="text-[11px] text-purple-600 mt-1">Quarters with revenue</p>
                </div>
            </div>

            {/* Main Bar Chart */}
            <div className="pt-2">
                {!hasData ? (
                    <div className="h-64 w-full flex flex-col items-center justify-center bg-gray-50/70 rounded-xl border border-dashed border-gray-200 text-center p-6">
                        <div className="p-3 bg-white rounded-full shadow-2xs mb-2.5 text-gray-400 border border-gray-100">
                            <BarChart3 className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm font-semibold text-gray-700">No revenue data recorded for {year}</p>
                        <p className="text-xs text-gray-400 mt-1 max-w-sm">
                            Quarterly completed customer payments will be visualized in this comparison bar chart.
                        </p>
                    </div>
                ) : (
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={enrichedData}
                                margin={{ top: 20, right: 20, left: 10, bottom: 10 }}
                                onMouseMove={(state) => {
                                    if (state.isTooltipActive) {
                                        setActiveIndex(state.activeTooltipIndex);
                                    } else {
                                        setActiveIndex(null);
                                    }
                                }}
                                onMouseLeave={() => setActiveIndex(null)}
                            >
                                <defs>
                                    <linearGradient id="barGradientPrimary" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10B981" />
                                        <stop offset="100%" stopColor="#059669" />
                                    </linearGradient>
                                    <linearGradient id="barGradientHover" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#34D399" />
                                        <stop offset="100%" stopColor="#10B981" />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis
                                    dataKey="shortName"
                                    tickLine={false}
                                    axisLine={{ stroke: '#E2E8F0' }}
                                    tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={{ stroke: '#E2E8F0' }}
                                    tickFormatter={formatShortVND}
                                    tick={{ fill: '#64748B', fontSize: 11 }}
                                    width={70}
                                    domain={[0, 'auto']}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }} />
                                {avgQuarterRevenue > 0 && (
                                    <ReferenceLine
                                        y={avgQuarterRevenue}
                                        stroke="#F59E0B"
                                        strokeDasharray="4 4"
                                        strokeWidth={1.5}
                                        label={{
                                            value: `Avg: ${formatShortVND(avgQuarterRevenue)}`,
                                            fill: '#D97706',
                                            fontSize: 10,
                                            fontWeight: 600,
                                            position: 'right',
                                        }}
                                    />
                                )}
                                <Bar
                                    dataKey="revenue"
                                    radius={[8, 8, 0, 0]}
                                    maxBarSize={60}
                                >
                                    {enrichedData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={
                                                activeIndex === index
                                                    ? 'url(#barGradientHover)'
                                                    : 'url(#barGradientPrimary)'
                                            }
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Quarterly Comparison Cards */}
            <div className="pt-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Quarter Breakdown & Comparison
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {enrichedData.map((item) => (
                        <div
                            key={item.quarter}
                            className={`p-4 rounded-xl border transition-all duration-200 ${
                                bestQuarter && bestQuarter.quarter === item.quarter && item.revenue > 0
                                    ? 'bg-emerald-50/40 border-emerald-200 shadow-sm ring-1 ring-emerald-300/50'
                                    : 'bg-gray-50/70 border-gray-100 hover:bg-white hover:border-gray-200 hover:shadow-sm'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-gray-900 text-sm">{item.shortName}</span>
                                    <span className="text-[11px] text-gray-400 font-medium">({item.dateSpan})</span>
                                </div>
                                {bestQuarter && bestQuarter.quarter === item.quarter && item.revenue > 0 && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 flex items-center gap-0.5">
                                        <Award className="w-2.5 h-2.5" /> Top
                                    </span>
                                )}
                            </div>

                            <p className="text-lg font-bold text-gray-900">{formatVND(item.revenue)}</p>

                            <div className="mt-2 w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(Number(item.percentage) || 0, 100)}%` }}
                                />
                            </div>

                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200/60 text-xs text-gray-500">
                                <span>{item.percentage}% of year</span>
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
