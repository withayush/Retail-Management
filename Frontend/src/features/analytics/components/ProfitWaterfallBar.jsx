import React from "react";
import { Layers, HelpCircle, ArrowRight } from "lucide-react";

/**
 * ProfitWaterfallBar - Phase 9 (Task T56)
 * Section 6.16 Visual Waterfall Bar:
 * Decomposes 100% of recognized revenue into:
 *  - COGS Share % (Inventory acquisition cost)
 *  - OpEx Share % (Store operational overheads)
 *  - Net Profit Margin % (True retained bottom-line value)
 */
export default function ProfitWaterfallBar({ data }) {
  const formatINR = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  const revenue = data?.revenue ?? 0;
  const cogs = data?.cogs ?? 0;
  const opex = data?.operatingExpenses ?? 0;
  const netProfit = data?.netProfit ?? 0;

  // Safe percentage shares
  const cogsShare = data?.costBreakdown?.cogsShare ?? (revenue > 0 ? Math.round(((cogs / revenue) * 100) * 100) / 100 : 0);
  const opexShare = data?.costBreakdown?.opexShare ?? (revenue > 0 ? Math.round(((opex / revenue) * 100) * 100) / 100 : 0);
  const netProfitShare = data?.costBreakdown?.netProfitShare ?? (revenue > 0 ? Math.round(((netProfit / revenue) * 100) * 100) / 100 : 0);

  const isProfitable = netProfit > 0;
  const isLoss = netProfit < 0;

  // Normalize bar widths (clamp between 0 and 100 for visual sanity)
  const normCogsWidth = Math.min(100, Math.max(0, cogsShare));
  const normOpexWidth = Math.min(100 - normCogsWidth, Math.max(0, opexShare));
  const normProfitWidth = isProfitable
    ? Math.min(100 - normCogsWidth - normOpexWidth, Math.max(0, netProfitShare))
    : 0;

  return (
    <div className="p-6 bg-[#161617]/90 backdrop-blur-2xl border border-[#D2D2D7]/12 rounded-[18px] shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white tracking-tight">
              Fiscal Waterfall Breakdown
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-[#0066CC]/15 text-[#54A7FF] border border-[#0066CC]/30">
              P&L Decomposition
            </span>
          </div>
          <p className="text-xs text-[#6E6E73] mt-0.5">
            Where every ₹100 of recognized store revenue is allocated
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-[#6E6E73]">Recognized Base:</span>
          <span className="text-white font-bold">{formatINR(revenue)}</span>
        </div>
      </div>

      {/* ── 3-STAGE WATERFALL PROPORTION BAR ── */}
      <div className="space-y-2">
        <div className="h-6 w-full bg-[#1F1F23] rounded-full overflow-hidden flex border border-[#D2D2D7]/10 p-0.5">
          {/* Segment 1: COGS Share */}
          {normCogsWidth > 0 && (
            <div
              style={{ width: `${normCogsWidth}%` }}
              className="h-full bg-gradient-to-r from-sky-600 to-sky-400 rounded-l-full transition-all duration-500 relative group flex items-center justify-center text-[10px] font-mono font-bold text-white tracking-tighter"
              title={`COGS: ${cogsShare}% (${formatINR(cogs)})`}
            >
              {normCogsWidth > 12 && <span>{cogsShare}%</span>}
            </div>
          )}

          {/* Segment 2: OpEx Share */}
          {normOpexWidth > 0 && (
            <div
              style={{ width: `${normOpexWidth}%` }}
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500 relative group flex items-center justify-center text-[10px] font-mono font-bold text-white tracking-tighter"
              title={`OpEx: ${opexShare}% (${formatINR(opex)})`}
            >
              {normOpexWidth > 10 && <span>{opexShare}%</span>}
            </div>
          )}

          {/* Segment 3: Net Profit Share */}
          {isProfitable && normProfitWidth > 0 && (
            <div
              style={{ width: `${normProfitWidth}%` }}
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-r-full transition-all duration-500 relative group flex items-center justify-center text-[10px] font-mono font-bold text-white tracking-tighter"
              title={`Net Profit: ${netProfitShare}% (${formatINR(netProfit)})`}
            >
              {normProfitWidth > 8 && <span>{netProfitShare}%</span>}
            </div>
          )}

          {/* Empty / Zero-Revenue placeholder */}
          {revenue === 0 && (
            <div className="h-full w-full flex items-center justify-center text-[11px] text-[#6E6E73] font-medium">
              Zero sales recorded in selected period
            </div>
          )}
        </div>

        {/* Legend Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* COGS Legend */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-sky-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-sky-400 shrink-0 shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
              <div>
                <span className="text-[11px] font-semibold text-[#D2D2D7] block">
                  Product COGS (T53)
                </span>
                <span className="text-[10px] text-[#6E6E73] block">
                  Inventory Acquisition Cost
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold font-mono text-sky-400 block">
                {formatINR(cogs)}
              </span>
              <span className="text-[10px] font-mono text-[#6E6E73]">
                {cogsShare}% share
              </span>
            </div>
          </div>

          {/* OpEx Legend */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
              <div>
                <span className="text-[11px] font-semibold text-[#D2D2D7] block">
                  Operating Expenses (T55)
                </span>
                <span className="text-[10px] text-[#6E6E73] block">
                  Rent, Salaries & Bills
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold font-mono text-amber-400 block">
                {formatINR(opex)}
              </span>
              <span className="text-[10px] font-mono text-[#6E6E73]">
                {opexShare}% share
              </span>
            </div>
          </div>

          {/* Net Profit Legend */}
          <div
            className={`p-3 rounded-xl bg-white/[0.03] border flex items-center justify-between ${
              isProfitable
                ? "border-emerald-500/20"
                : isLoss
                ? "border-rose-500/20"
                : "border-zinc-500/20"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`w-3 h-3 rounded-full shrink-0 ${
                  isProfitable
                    ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                    : isLoss
                    ? "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.5)]"
                    : "bg-zinc-400"
                }`}
              />
              <div>
                <span className="text-[11px] font-semibold text-[#D2D2D7] block">
                  Net Profit (T56)
                </span>
                <span className="text-[10px] text-[#6E6E73] block">
                  {isLoss ? "Net Store Loss" : "Retained Profit"}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span
                className={`text-xs font-bold font-mono block ${
                  isProfitable
                    ? "text-emerald-400"
                    : isLoss
                    ? "text-rose-400"
                    : "text-white"
                }`}
              >
                {formatINR(netProfit)}
              </span>
              <span className="text-[10px] font-mono text-[#6E6E73]">
                {netProfitShare}% margin
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
