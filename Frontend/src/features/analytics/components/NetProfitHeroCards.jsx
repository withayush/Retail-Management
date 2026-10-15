import React from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Wallet,
  ShieldCheck,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
} from "lucide-react";

/**
 * NetProfitHeroCards - Phase 9 (Task T56)
 * Displays the core 4 profitability metrics:
 * 1. Net Profit (Bottom-Line Truth) = Gross Profit - Operating Expenses
 * 2. Gross Profit (T54) = Revenue - COGS
 * 3. Total Recognized Revenue (T52)
 * 4. Operating Expenses (T55 / T51)
 */
export default function NetProfitHeroCards({ data, loading = false }) {
  const formatINR = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  const netProfit = data?.netProfit ?? 0;
  const netMargin = data?.netProfitMargin ?? 0;
  const grossProfit = data?.grossProfit ?? 0;
  const grossMargin = data?.grossMarginPercentage ?? 0;
  const revenue = data?.revenue ?? 0;
  const operatingExpenses = data?.operatingExpenses ?? 0;
  const opexRatio = data?.opexToRevenueRatio ?? 0;
  const status = data?.status || "BREAK_EVEN";
  const healthRating = data?.healthRating || "BREAK_EVEN";
  const coverageRatio = data?.coverageRatio ?? 0;
  const cashBurn = data?.cashBurn;

  // Determine Net Profit Color Theme
  const isProfitable = netProfit > 0;
  const isLoss = netProfit < 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* ── CARD 1: NET PROFIT (T56 BOTTOM LINE) ── */}
      <div
        className={`relative p-5 rounded-[18px] backdrop-blur-2xl border transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.45)] hover:-translate-y-0.5 overflow-hidden flex flex-col justify-between ${
          isProfitable
            ? "bg-gradient-to-br from-[#161617]/95 via-[#0A2616]/40 to-[#161617]/95 border-emerald-500/30"
            : isLoss
            ? "bg-gradient-to-br from-[#161617]/95 via-[#2E0B0E]/40 to-[#161617]/95 border-rose-500/30"
            : "bg-[#161617]/90 border-[#D2D2D7]/12"
        }`}
      >
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#D2D2D7]/20 to-transparent" />

        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#D2D2D7] tracking-tight">
                Net Profit
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-white/10 text-[#A1A1AA]">
                T56
              </span>
            </div>

            {/* Health Rating Pill */}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                healthRating === "EXCELLENT" || healthRating === "HEALTHY"
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : healthRating === "SLIM_PROFIT"
                  ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                  : isLoss
                  ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                  : "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
              }`}
            >
              {healthRating.replace("_", " ")}
            </span>
          </div>

          <div className="mt-3">
            {loading ? (
              <div className="h-8 w-32 bg-white/10 animate-pulse rounded-lg" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-2xl lg:text-3xl font-bold font-mono tracking-tight ${
                    isProfitable
                      ? "text-emerald-400"
                      : isLoss
                      ? "text-rose-400"
                      : "text-white"
                  }`}
                >
                  {formatINR(netProfit)}
                </span>
              </div>
            )}
            <p className="text-[11px] text-[#A1A1AA] mt-1 font-normal">
              Formula: Gross Profit − OpEx
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#D2D2D7]/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-[#6E6E73]">Net Margin:</span>
            <span
              className={`font-mono font-bold ${
                isProfitable
                  ? "text-emerald-400"
                  : isLoss
                  ? "text-rose-400"
                  : "text-white"
              }`}
            >
              {netMargin}%
            </span>
          </div>

          <span className="text-[11px] text-[#6E6E73] capitalize font-mono">
            {status.toLowerCase().replace("_", " ")}
          </span>
        </div>
      </div>

      {/* ── CARD 2: GROSS PROFIT (T54) ── */}
      <div className="relative p-5 bg-[#161617]/90 backdrop-blur-2xl border border-[#D2D2D7]/12 rounded-[18px] shadow-[0_4px_24px_rgba(0,0,0,0.3)] hover:border-[#D2D2D7]/28 hover:shadow-[0_12px_36px_rgba(0,0,0,0.45)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#D2D2D7]/20 to-transparent" />

        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#6E6E73] tracking-tight">
                Gross Profit
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-white/5 text-[#6E6E73]">
                T54
              </span>
            </div>
            <div className="w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="mt-3">
            {loading ? (
              <div className="h-8 w-32 bg-white/10 animate-pulse rounded-lg" />
            ) : (
              <span className="text-2xl lg:text-3xl font-bold font-mono tracking-tight text-white">
                {formatINR(grossProfit)}
              </span>
            )}
            <p className="text-[11px] text-[#6E6E73] mt-1 font-normal">
              Revenue − COGS (Product Acquisition)
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#D2D2D7]/8 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[#6E6E73]">Gross Margin:</span>
            <span className="font-mono font-bold text-sky-400">
              {grossMargin}%
            </span>
          </div>
          <span className="text-[11px] text-[#6E6E73] font-mono">
            Coverage: {coverageRatio}x
          </span>
        </div>
      </div>

      {/* ── CARD 3: TOTAL RECOGNIZED REVENUE (T52) ── */}
      <div className="relative p-5 bg-[#161617]/90 backdrop-blur-2xl border border-[#D2D2D7]/12 rounded-[18px] shadow-[0_4px_24px_rgba(0,0,0,0.3)] hover:border-[#D2D2D7]/28 hover:shadow-[0_12px_36px_rgba(0,0,0,0.45)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#D2D2D7]/20 to-transparent" />

        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#6E6E73] tracking-tight">
                Recognized Revenue
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-white/5 text-[#6E6E73]">
                T52
              </span>
            </div>
            <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="mt-3">
            {loading ? (
              <div className="h-8 w-32 bg-white/10 animate-pulse rounded-lg" />
            ) : (
              <span className="text-2xl lg:text-3xl font-bold font-mono tracking-tight text-white">
                {formatINR(revenue)}
              </span>
            )}
            <p className="text-[11px] text-[#6E6E73] mt-1 font-normal">
              Accrual Sales Basis (Cash + Credit Khata)
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#D2D2D7]/8 flex items-center justify-between text-xs">
          <span className="text-[#6E6E73] text-[11px]">
            Product COGS:{" "}
            <span className="text-white font-mono font-medium">
              {formatINR(data?.cogs || 0)}
            </span>
          </span>
          <span className="text-[11px] text-[#6E6E73] font-mono">
            {revenue > 0 ? Math.round(((data?.cogs || 0) / revenue) * 100) : 0}% COGS
          </span>
        </div>
      </div>

      {/* ── CARD 4: OPERATING EXPENSES (T55 / T51) ── */}
      <div className="relative p-5 bg-[#161617]/90 backdrop-blur-2xl border border-[#D2D2D7]/12 rounded-[18px] shadow-[0_4px_24px_rgba(0,0,0,0.3)] hover:border-[#D2D2D7]/28 hover:shadow-[0_12px_36px_rgba(0,0,0,0.45)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#D2D2D7]/20 to-transparent" />

        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#6E6E73] tracking-tight">
                Operating Expenses (OpEx)
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-white/5 text-[#6E6E73]">
                T55
              </span>
            </div>
            <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="mt-3">
            {loading ? (
              <div className="h-8 w-32 bg-white/10 animate-pulse rounded-lg" />
            ) : (
              <span className="text-2xl lg:text-3xl font-bold font-mono tracking-tight text-white">
                {formatINR(operatingExpenses)}
              </span>
            )}
            <p className="text-[11px] text-[#6E6E73] mt-1 font-normal">
              Store Rent, Staff Salaries, Electricity & Overheads
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#D2D2D7]/8 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[#6E6E73]">OpEx/Revenue:</span>
            <span className="font-mono font-bold text-amber-400">
              {opexRatio}%
            </span>
          </div>
          {cashBurn?.dailyCashBurn ? (
            <span className="text-[11px] text-[#6E6E73] font-mono flex items-center gap-1">
              <Flame className="w-3 h-3 text-orange-400" />
              {formatINR(cashBurn.dailyCashBurn)}/day
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
