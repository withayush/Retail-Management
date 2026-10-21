import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { ArrowLeftRight, AlertCircle } from "lucide-react";

const formatINR = (val) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(val) || 0);
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0]?.payload;
    const rev = dataPoint?.revenue || 0;
    const exp = dataPoint?.operatingExpenses || 0;
    const net = rev - exp;

    return (
      <div className="p-3 bg-[#1A1A1E] border border-[#D2D2D7]/20 rounded-xl shadow-2xl text-xs space-y-1.5 z-50">
        <p className="font-semibold text-white border-b border-[#D2D2D7]/10 pb-1">
          {dataPoint?.date} ({dataPoint?.label})
        </p>
        <div className="space-y-1 font-mono text-[11px]">
          <div className="flex justify-between gap-4 text-emerald-400">
            <span>Revenue:</span>
            <span className="font-bold">{formatINR(rev)}</span>
          </div>
          <div className="flex justify-between gap-4 text-amber-400">
            <span>Operating Expenses:</span>
            <span className="font-bold">{formatINR(exp)}</span>
          </div>
          <div
            className={`flex justify-between gap-4 pt-1 border-t border-[#D2D2D7]/10 font-bold ${
              net >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            <span>Spread (Rev - OpEx):</span>
            <span>{formatINR(net)}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function RevenueExpenseChart({ data = [], loading = false }) {
  const hasData =
    Array.isArray(data) &&
    data.some((d) => (d.revenue || 0) > 0 || (d.operatingExpenses || 0) > 0);

  return (
    <div className="p-6 bg-[#161617]/90 border border-[#D2D2D7]/12 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-4 flex flex-col justify-between">
      {/* Chart Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5">
              <ArrowLeftRight className="w-4 h-4 text-sky-400" />
              Chart B — Revenue vs Operating Expenses
            </h3>
            <span className="text-[10px] font-mono text-[#A1A1AA] bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
              Sources: T52 & T55
            </span>
          </div>
          <p className="text-xs text-[#8E8E93]">
            Comparing top-line sales recognition against store cash burn OpEx
          </p>
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-64 w-full">
        {!hasData && !loading ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
            <AlertCircle className="w-8 h-8 text-[#6E6E73]" />
            <p className="text-xs font-medium text-[#8E8E93]">
              No transactions or operating expenses recorded in this period.
            </p>
            <p className="text-[11px] text-[#6E6E73]">
              Billed invoices and logged expenses will display a comparison here.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D2D30" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#6E6E73"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                minTickGap={20}
              />
              <YAxis
                stroke="#6E6E73"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: "11px", paddingBottom: "8px" }}
              />
              <Bar
                dataKey="revenue"
                name="Revenue"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
              <Bar
                dataKey="operatingExpenses"
                name="Operating Expenses"
                fill="#F59E0B"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default RevenueExpenseChart;
