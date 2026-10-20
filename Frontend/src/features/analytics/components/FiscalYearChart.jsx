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
} from "recharts";
import { Trophy, AlertCircle, Calendar } from "lucide-react";

/**
 * FiscalYearChart - Phase 9 (Task T56)
 * 12-Month Fiscal Year Progression & Annual Bottom-Line Summary
 * Visualizes Monthly Net Profit, Revenue, COGS, and OpEx
 */
const formatINR = (val) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(val) || 0);
};

const CustomTooltip = ({ active, payload, year }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0]?.payload;
    return (
      <div className="p-3 bg-[#1A1A1E] border border-[#D2D2D7]/20 rounded-xl shadow-xl text-xs space-y-1.5 z-50">
        <p className="font-semibold text-white border-b border-[#D2D2D7]/10 pb-1">
          {dataPoint?.name} {year}
        </p>
        <div className="space-y-1 font-mono text-[11px]">
          <div className="flex justify-between gap-4 text-[#A1A1AA]">
            <span>Revenue:</span>
            <span className="text-white font-medium">{formatINR(dataPoint?.revenue)}</span>
          </div>
          <div className="flex justify-between gap-4 text-sky-400">
            <span>COGS:</span>
            <span>{formatINR(dataPoint?.cogs)}</span>
          </div>
          <div className="flex justify-between gap-4 text-amber-400">
            <span>OpEx:</span>
            <span>{formatINR(dataPoint?.opex)}</span>
          </div>
          <div className="flex justify-between gap-4 text-[#D2D2D7] pt-1 border-t border-[#D2D2D7]/10">
            <span>Gross Profit:</span>
            <span>{formatINR(dataPoint?.grossProfit)}</span>
          </div>
          <div
            className={`flex justify-between gap-4 font-bold pt-1 border-t border-[#D2D2D7]/10 ${
              (dataPoint?.netProfit || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            <span>Net Profit:</span>
            <span>{formatINR(dataPoint?.netProfit)} ({dataPoint?.margin}%)</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function FiscalYearChart({ overviewData, loading = false }) {
  const months = overviewData?.months || [];
  const year = overviewData?.year || new Date().getUTCFullYear();
  const ytdNetProfit = overviewData?.ytdNetProfit ?? 0;
  const ytdMargin = overviewData?.ytdNetProfitMargin ?? 0;
  const peakMonth = overviewData?.peakMonth;
  const lowestMonth = overviewData?.lowestMonth;

  // Transform data for recharts
  const chartData = months.map((m) => {
    const shortName = (m.monthName || "").split(" ")[0]?.slice(0, 3) || `M${m.month}`;
    return {
      name: shortName,
      month: m.month,
      revenue: m.revenue || 0,
      cogs: m.cogs || 0,
      opex: m.operatingExpenses || 0,
      netProfit: m.netProfit || 0,
      grossProfit: m.grossProfit || 0,
      margin: m.netProfitMargin || 0,
    };
  });

  return (
    <div className="p-6 bg-[#161617]/90 backdrop-blur-2xl border border-[#D2D2D7]/12 rounded-[18px] shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white tracking-tight">
              12-Month Fiscal Year Trend ({year})
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-white/10 text-[#D2D2D7]">
              P&L Progression
            </span>
          </div>
          <p className="text-xs text-[#6E6E73] mt-0.5">
            Monthly bottom-line net profit vs top-line sales, product cost & overheads
          </p>
        </div>

        {/* YTD Summary Badge */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-[#D2D2D7]/10">
            <span className="text-[#6E6E73] block text-[10px]">Annual YTD Net Profit:</span>
            <span
              className={`text-sm font-bold ${
                ytdNetProfit >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {formatINR(ytdNetProfit)}
            </span>
            <span className="text-[10px] text-[#A1A1AA] ml-1.5">({ytdMargin}%)</span>
          </div>
        </div>
      </div>

      {/* ── PEAK & LOWEST MONTH CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {peakMonth?.monthName && (
          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                <Trophy className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">
                  Peak Profit Month
                </span>
                <span className="text-xs font-semibold text-white block">
                  {peakMonth.monthName}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold font-mono text-emerald-400 block">
                {formatINR(peakMonth.netProfit)}
              </span>
              <span className="text-[10px] font-mono text-[#6E6E73]">
                {peakMonth.margin}% margin
              </span>
            </div>
          </div>
        )}

        {lowestMonth?.monthName && (
          <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-rose-500/15 flex items-center justify-center text-rose-400">
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider block">
                  Lowest Month
                </span>
                <span className="text-xs font-semibold text-white block">
                  {lowestMonth.monthName}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span
                className={`text-xs font-bold font-mono block ${
                  lowestMonth.netProfit >= 0 ? "text-white" : "text-rose-400"
                }`}
              >
                {formatINR(lowestMonth.netProfit)}
              </span>
              <span className="text-[10px] font-mono text-[#6E6E73]">
                {lowestMonth.margin}% margin
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── RECHARTS VISUALIZATION ── */}
      <div className="h-72 w-full pt-4">
        {loading ? (
          <div className="h-full w-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0066CC]" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.5} />
              <XAxis dataKey="name" stroke="#6E6E73" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#6E6E73"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v) => (v >= 1000 ? `₹${v / 1000}k` : `₹${v}`)}
              />
              <Tooltip content={<CustomTooltip year={year} />} />
              <Legend
                wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                formatter={(value) => <span className="text-[#A1A1AA]">{value}</span>}
              />
              <Bar
                dataKey="netProfit"
                name="Net Profit (T56)"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Revenue (T52)"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="opex"
                name="OpEx (T55)"
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
