import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ReferenceLine,
} from "recharts";
import { DollarSign, Percent, AlertCircle, Sparkles } from "lucide-react";

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
    const profit = dataPoint?.operatingProfit || 0;
    const margin = dataPoint?.operatingMargin || 0;
    const grossProfit = dataPoint?.grossProfit || 0;

    return (
      <div className="p-3 bg-[#1A1A1E] border border-[#D2D2D7]/20 rounded-xl shadow-2xl text-xs space-y-1.5 z-50">
        <p className="font-semibold text-white border-b border-[#D2D2D7]/10 pb-1">
          {dataPoint?.date} ({dataPoint?.label})
        </p>
        <div className="space-y-1 font-mono text-[11px]">
          <div className="flex justify-between gap-4 text-[#A1A1AA]">
            <span>Gross Profit:</span>
            <span className="text-white">{formatINR(grossProfit)}</span>
          </div>
          <div
            className={`flex justify-between gap-4 font-bold ${
              profit >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            <span>Operating Profit (T56):</span>
            <span>{formatINR(profit)}</span>
          </div>
          <div className="flex justify-between gap-4 text-sky-400 pt-1 border-t border-[#D2D2D7]/10">
            <span>Operating Margin:</span>
            <span className="font-bold">{dataPoint?.revenue > 0 ? `${margin}%` : "—"}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function ProfitTrendChart({ data = [], loading = false }) {
  const hasData =
    Array.isArray(data) &&
    data.some((d) => (d.operatingProfit || 0) !== 0 || (d.revenue || 0) > 0);

  return (
    <div className="p-6 bg-[#161617]/90 border border-[#D2D2D7]/12 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-4 flex flex-col justify-between">
      {/* Chart Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Chart C — Profit and Margin Trend
            </h3>
            <span className="text-[10px] font-mono text-[#A1A1AA] bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
              Source: T56
            </span>
          </div>
          <p className="text-xs text-[#8E8E93]">
            Operating profit (Gross Profit - OpEx) and bottom-line margin over timeline
          </p>
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-72 w-full">
        {!hasData && !loading ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
            <AlertCircle className="w-8 h-8 text-[#6E6E73]" />
            <p className="text-xs font-medium text-[#8E8E93]">
              No profit data recorded in this period.
            </p>
            <p className="text-[11px] text-[#6E6E73]">
              Once sales and expenses are recorded, profitability trajectory will plot here.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D2D30" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#6E6E73"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                minTickGap={20}
              />
              {/* Left Axis: Currency */}
              <YAxis
                yAxisId="currency"
                stroke="#6E6E73"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              {/* Right Axis: Percentage */}
              <YAxis
                yAxisId="percent"
                orientation="right"
                stroke="#38BDF8"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}%`}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: "11px", paddingBottom: "8px" }}
              />
              <ReferenceLine yAxisId="currency" y={0} stroke="#4B5563" strokeDasharray="2 2" />

              <Bar
                yAxisId="currency"
                dataKey="operatingProfit"
                name="Operating Profit (₹)"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.operatingProfit >= 0 ? "#10B981" : "#F43F5E"}
                  />
                ))}
              </Bar>

              <Line
                yAxisId="percent"
                type="monotone"
                dataKey="operatingMargin"
                name="Operating Margin (%)"
                stroke="#38BDF8"
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: "#38BDF8" }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default ProfitTrendChart;
