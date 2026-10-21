import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { TrendingUp, ShoppingBag, AlertCircle } from "lucide-react";

const formatINR = (val) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(val) || 0);
};

const CustomTooltip = ({ active, payload, selectedMetric }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0]?.payload;
    const sales = dataPoint?.sales || 0;
    const orders = dataPoint?.orderCount || 0;
    const aov = dataPoint?.averageOrderValue || 0;

    return (
      <div className="p-3 bg-[#1A1A1E] border border-[#D2D2D7]/20 rounded-xl shadow-2xl text-xs space-y-1.5 z-50">
        <p className="font-semibold text-white border-b border-[#D2D2D7]/10 pb-1">
          {dataPoint?.date} ({dataPoint?.label || dataPoint?.time})
        </p>
        <div className="space-y-1 font-mono text-[11px]">
          <div className="flex justify-between gap-4 text-emerald-400">
            <span>Sales Revenue:</span>
            <span className="font-bold">{formatINR(sales)}</span>
          </div>
          <div className="flex justify-between gap-4 text-sky-400">
            <span>Orders Count:</span>
            <span className="font-bold">{orders} orders</span>
          </div>
          {orders > 0 && (
            <div className="flex justify-between gap-4 text-[#A1A1AA] pt-1 border-t border-[#D2D2D7]/10">
              <span>Avg Order Value:</span>
              <span className="text-white">{formatINR(aov)}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export function SalesTrendChart({
  data = [],
  selectedMetric = "revenue",
  groupBy = "day",
  loading = false,
}) {
  const isRevenue = selectedMetric === "revenue";
  const hasData =
    Array.isArray(data) &&
    data.some((d) => (isRevenue ? (d.sales || 0) > 0 : (d.orderCount || 0) > 0));

  return (
    <div className="p-6 bg-[#161617]/90 border border-[#D2D2D7]/12 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-4 flex flex-col justify-between">
      {/* Chart Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5">
              {isRevenue ? (
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              ) : (
                <ShoppingBag className="w-4 h-4 text-sky-400" />
              )}
              {isRevenue ? "Sales Revenue Trajectory" : "Order Volume Distribution"}
            </h3>
            <span className="text-[10px] font-mono text-[#A1A1AA] bg-white/5 px-2 py-0.5 rounded-full border border-white/10 uppercase">
              {groupBy} View
            </span>
          </div>
          <p className="text-xs text-[#8E8E93]">
            {isRevenue
              ? "Recognized accrual sales plotted over selected timeline"
              : "Completed order counts across time buckets"}
          </p>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-80 w-full">
        {!hasData && !loading ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
            <AlertCircle className="w-8 h-8 text-[#6E6E73]" />
            <p className="text-xs font-medium text-[#8E8E93]">
              No sales or orders recorded for this period/grouping.
            </p>
            <p className="text-[11px] text-[#6E6E73]">
              Transactions billed in POS terminal will automatically graph here.
            </p>
          </div>
        ) : isRevenue ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="salesTrendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D2D30" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#6E6E73"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                minTickGap={15}
              />
              <YAxis
                stroke="#6E6E73"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip content={<CustomTooltip selectedMetric="revenue" />} />
              <Area
                type="monotone"
                dataKey="sales"
                name="Sales Revenue (₹)"
                stroke="#10B981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#salesTrendGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="orderVolumeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#0284C7" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D2D30" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#6E6E73"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                minTickGap={15}
              />
              <YAxis
                stroke="#6E6E73"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip selectedMetric="orderCount" />} />
              <Bar
                dataKey="orderCount"
                name="Order Count"
                fill="url(#orderVolumeGradient)"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default SalesTrendChart;
