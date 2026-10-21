import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from "recharts";
import {
  TrendingDown,
  TrendingUp,
  Info,
  Layers,
  ArrowRight,
  Maximize2,
} from "lucide-react";

/**
 * ProfitBreakdownChart (Phase 10 - Task T62)
 *
 * Implements a true Waterfall visualization titled:
 * "Where Your Revenue Goes"
 *
 * Visually depicts the progression:
 * 1. Revenue (Total)
 * 2. COGS (Floating Deduction)
 * 3. Gross Profit (Subtotal)
 * 4. Operating Expenses (Floating Deduction)
 * 5. Operating Profit (Final Subtotal/Total)
 */
export default function ProfitBreakdownChart({ data, loading }) {
  const [activeStep, setActiveStep] = useState(null);

  const formatINR = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  const revenue = data?.revenue ?? 0;
  const cogs = data?.cogs ?? 0;
  const grossProfit = data?.grossProfit ?? 0;
  const operatingExpenses = data?.operatingExpenses ?? 0;
  const operatingProfit = data?.operatingProfit ?? 0;

  // Prepare chart data points
  // For stacked Recharts: base (invisible float) + barValue (visible portion)
  const chartData = [
    {
      id: "revenue",
      name: "Revenue",
      type: "total",
      isDeduction: false,
      startLevel: 0,
      endLevel: revenue,
      base: 0,
      barValue: Math.max(0, revenue),
      displayAmount: revenue,
      color: "#10B981", // Emerald
      label: "Gross Sales",
    },
    {
      id: "cogs",
      name: "COGS",
      type: "deduction",
      isDeduction: true,
      startLevel: revenue,
      endLevel: grossProfit,
      // Floating base: sits on top of gross profit level
      base: Math.max(0, grossProfit),
      barValue: cogs,
      displayAmount: -cogs,
      color: "#EF4444", // Rose / Red
      label: "Direct Cost Deduction",
    },
    {
      id: "grossProfit",
      name: "Gross Profit",
      type: "subtotal",
      isDeduction: false,
      startLevel: 0,
      endLevel: grossProfit,
      base: 0,
      barValue: Math.max(0, grossProfit),
      displayAmount: grossProfit,
      color: "#3B82F6", // Royal Blue
      label: "Revenue − COGS",
    },
    {
      id: "operatingExpenses",
      name: "OpEx",
      type: "deduction",
      isDeduction: true,
      startLevel: grossProfit,
      endLevel: operatingProfit,
      // Floating base: sits on top of operating profit level
      base: Math.max(0, operatingProfit),
      barValue: operatingExpenses,
      displayAmount: -operatingExpenses,
      color: "#F59E0B", // Amber
      label: "Overhead Deduction",
    },
    {
      id: "operatingProfit",
      name: "Operating Profit",
      type: "total",
      isDeduction: false,
      startLevel: 0,
      endLevel: operatingProfit,
      base: 0,
      barValue: Math.max(0, operatingProfit),
      displayAmount: operatingProfit,
      color: operatingProfit >= 0 ? "#8B5CF6" : "#EF4444", // Purple or Red
      label: "Retained Earnings",
    },
  ];

  // Custom Waterfall Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0]?.payload;
    if (!item) return null;

    return (
      <div className="bg-[#1C1C1E]/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-4 shadow-2xl space-y-2 min-w-56 font-sans">
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
          <span className="text-xs font-semibold text-white">{item.name}</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase ${
              item.isDeduction
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                : item.type === "subtotal"
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            }`}
          >
            {item.type}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#86868B]">Step Amount:</span>
            <span
              className={`font-mono font-bold ${
                item.isDeduction
                  ? "text-rose-400"
                  : item.displayAmount < 0
                  ? "text-rose-400"
                  : "text-white"
              }`}
            >
              {item.isDeduction ? "-" : ""}
              {formatINR(Math.abs(item.displayAmount))}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[#86868B]">Cumulative Level:</span>
            <span className="font-mono font-semibold text-white">
              {formatINR(item.endLevel)}
            </span>
          </div>

          {revenue > 0 && (
            <div className="flex items-center justify-between text-[11px] text-[#86868B]">
              <span>% of Revenue:</span>
              <span className="font-mono text-white">
                {Math.round((Math.abs(item.displayAmount) / revenue) * 100 * 10) / 10}%
              </span>
            </div>
          )}
        </div>

        <div className="text-[10px] text-[#A1A1A6] italic border-t border-white/5 pt-1.5">
          {item.label}
        </div>
      </div>
    );
  };

  const isEmpty = revenue === 0 && operatingExpenses === 0;

  return (
    <div className="p-6 bg-[#161617]/90 backdrop-blur-2xl border border-[#D2D2D7]/12 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Where Your Revenue Goes
            </h2>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-[#0066CC]/15 text-[#54A7FF] border border-[#0066CC]/30">
              Waterfall Breakdown
            </span>
          </div>
          <p className="text-xs text-[#86868B] mt-1">
            Visual cascade from recognized revenue through COGS and operational overheads to bottom-line operating profit
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981]" />
            <span className="text-[#86868B]">Total / Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#EF4444]" />
            <span className="text-[#86868B]">COGS Deduction</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#3B82F6]" />
            <span className="text-[#86868B]">Gross Subtotal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B]" />
            <span className="text-[#86868B]">OpEx Deduction</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#8B5CF6]" />
            <span className="text-[#86868B]">Operating Profit</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      {isEmpty ? (
        <div className="h-72 flex flex-col items-center justify-center text-center p-6 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
          <Layers className="w-10 h-10 text-[#86868B] mb-2 stroke-[1.5]" />
          <p className="text-sm font-semibold text-white">No Financial Activity in Period</p>
          <p className="text-xs text-[#86868B] max-w-sm mt-1">
            There were no recognized sales or recorded expenses during this timeframe. Try adjusting your date filter above.
          </p>
        </div>
      ) : (
        <div className="h-80 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 25, right: 20, left: 10, bottom: 25 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255, 255, 255, 0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="#6E6E73"
                tick={{ fill: "#A1A1A6", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
              />
              <YAxis
                stroke="#6E6E73"
                tick={{ fill: "#6E6E73", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => {
                  if (Math.abs(val) >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
                  if (Math.abs(val) >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
                  if (Math.abs(val) >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
                  return `₹${val}`;
                }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <ReferenceLine y={0} stroke="rgba(255, 255, 255, 0.2)" />

              {/* Invisible floating base */}
              <Bar dataKey="base" stackId="waterfall" fill="transparent" />

              {/* Visible Waterfall Bar */}
              <Bar
                dataKey="barValue"
                stackId="waterfall"
                radius={[6, 6, 2, 2]}
                onMouseEnter={(_, index) => setActiveStep(index)}
                onMouseLeave={() => setActiveStep(null)}
              >
                {chartData.map((entry, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={entry.color}
                    opacity={activeStep === null || activeStep === idx ? 1 : 0.6}
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth={1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Progression Flow Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 pt-4 border-t border-white/10">
        {chartData.map((step, idx) => (
          <div
            key={step.id}
            className={`p-3 rounded-xl border transition-all duration-200 ${
              activeStep === idx
                ? "bg-white/[0.08] border-white/30 scale-[1.02]"
                : "bg-white/[0.03] border-white/5"
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-[#86868B] mb-1">
              <span>Step {idx + 1}</span>
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: step.color }}
              />
            </div>
            <div className="text-xs font-semibold text-white truncate">{step.name}</div>
            <div
              className={`text-sm font-mono font-bold mt-1 ${
                step.isDeduction ? "text-rose-400" : "text-white"
              }`}
            >
              {step.isDeduction ? "-" : ""}
              {formatINR(Math.abs(step.displayAmount))}
            </div>
            <div className="text-[10px] text-[#6E6E73] mt-1 truncate">
              {step.isDeduction
                ? `Reduces to ${formatINR(step.endLevel)}`
                : `Level: ${formatINR(step.endLevel)}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
