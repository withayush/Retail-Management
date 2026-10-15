import React from "react";
import { Calendar, ArrowUpRight, ArrowDownRight, Layers } from "lucide-react";

/**
 * QuarterlyProfitCards - Phase 9 (Task T56)
 * Displays Q1, Q2, Q3, Q4 financial performance:
 * Net Profit, Gross Profit, OpEx, Margin %, and status pill
 */
export default function QuarterlyProfitCards({ quarterlyData, loading = false }) {
  const formatINR = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  const quarters = quarterlyData?.quarters || [];
  const year = quarterlyData?.year || new Date().getUTCFullYear();

  return (
    <div className="p-6 bg-[#161617]/90 backdrop-blur-2xl border border-[#D2D2D7]/12 rounded-[18px] shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white tracking-tight">
              Quarterly Profitability Aggregations
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-white/10 text-[#D2D2D7]">
              Q1 – Q4 ({year})
            </span>
          </div>
          <p className="text-xs text-[#6E6E73] mt-0.5">
            Quarter-over-quarter profitability and margin distribution
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {quarters.map((q) => {
          const isProfitable = (q.netProfit || 0) > 0;
          const isLoss = (q.netProfit || 0) < 0;

          return (
            <div
              key={q.quarter}
              className={`p-4 rounded-xl border backdrop-blur-xl transition-all duration-300 flex flex-col justify-between ${
                isProfitable
                  ? "bg-white/[0.02] border-emerald-500/20 hover:border-emerald-500/40"
                  : isLoss
                  ? "bg-white/[0.02] border-rose-500/20 hover:border-rose-500/40"
                  : "bg-white/[0.02] border-[#D2D2D7]/10"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white tracking-tight">
                      {q.quarterLabel}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                      isProfitable
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : isLoss
                        ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                        : "bg-zinc-500/15 text-zinc-400 border border-zinc-500/30"
                    }`}
                  >
                    {q.status ? q.status.replace("_", " ") : "BREAK EVEN"}
                  </span>
                </div>

                {/* Net Profit Big Figure */}
                <div className="mt-3">
                  <span className="text-[10px] text-[#6E6E73] uppercase tracking-wider block font-medium">
                    Quarterly Net Profit
                  </span>
                  <span
                    className={`text-xl font-bold font-mono tracking-tight block ${
                      isProfitable
                        ? "text-emerald-400"
                        : isLoss
                        ? "text-rose-400"
                        : "text-white"
                    }`}
                  >
                    {formatINR(q.netProfit)}
                  </span>
                  <span className="text-[11px] font-mono text-[#A1A1AA]">
                    Margin: {q.netProfitMargin}%
                  </span>
                </div>
              </div>

              {/* Sub-metrics */}
              <div className="mt-3 pt-2.5 border-t border-[#D2D2D7]/8 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between text-[#6E6E73]">
                  <span>Revenue:</span>
                  <span className="text-[#D2D2D7]">{formatINR(q.revenue)}</span>
                </div>
                <div className="flex justify-between text-[#6E6E73]">
                  <span>COGS:</span>
                  <span className="text-sky-400">{formatINR(q.cogs)}</span>
                </div>
                <div className="flex justify-between text-[#6E6E73]">
                  <span>OpEx:</span>
                  <span className="text-amber-400">{formatINR(q.operatingExpenses)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
