import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Percent,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Info,
} from "lucide-react";

/**
 * ProfitMarginComparison (Phase 10 - Task T62)
 *
 * Implements the Profit Margin Comparison component titled:
 * "Profitability Breakdown"
 *
 * Displays:
 * - Gross Profit Margin vs Operating Profit Margin
 * - Margin Retention Drop (absorbed by OpEx)
 * - Gross Profit Amount & Operating Profit Amount
 * - Recognized Revenue as common denominator
 * - Explicit unclamped handling for negative operating profit
 */
export default function ProfitMarginComparison({ data }) {
  const formatINR = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  const revenue = data?.revenue ?? 0;
  const grossProfit = data?.grossProfit ?? 0;
  const operatingProfit = data?.operatingProfit ?? 0;
  const grossMargin = data?.grossMargin ?? 0;
  const operatingMargin = data?.operatingMargin ?? 0;
  const period = data?.period;

  // Margin absorption by OpEx: difference between gross and operating margin
  const marginAbsorbedByOpEx =
    revenue > 0 ? Math.round((grossMargin - operatingMargin) * 10) / 10 : 0;

  // Health assessment
  const isLoss = operatingProfit < 0;
  const isSlim = operatingProfit >= 0 && operatingMargin < 10;
  const isHealthy = operatingMargin >= 10 && operatingMargin < 20;
  const isExcellent = operatingMargin >= 20;

  return (
    <div className="p-6 bg-[#161617]/90 backdrop-blur-2xl border border-[#D2D2D7]/12 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Profitability Breakdown
            </h2>
            <span
              className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold uppercase border ${
                isLoss
                  ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                  : isSlim
                  ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                  : isHealthy
                  ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                  : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              }`}
            >
              {data?.healthRating || (isLoss ? "LOSS" : isSlim ? "SLIM" : "HEALTHY")}
            </span>
          </div>
          <p className="text-xs text-[#86868B] mt-1">
            Comparative margin analysis showing retained capital after direct costs and overhead deductions
          </p>
        </div>

        {/* Reporting Period & Denominator Badge */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          <div className="px-3 py-1 bg-white/[0.04] border border-white/10 rounded-xl text-[#86868B]">
            <span>Denominator (Revenue): </span>
            <span className="text-white font-bold">{formatINR(revenue)}</span>
          </div>
          {period?.from && period?.to && (
            <div className="px-2.5 py-1 bg-white/[0.02] border border-white/5 rounded-xl text-[#6E6E73] text-[11px]">
              {period.from} to {period.to}
            </div>
          )}
        </div>
      </div>

      {/* Margin Comparison Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Gross Profit Margin */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-xs font-semibold text-white">Gross Profit Margin</span>
            </div>
            <span className="text-xs text-[#86868B] font-mono">
              (Gross Profit / Revenue)
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <span className="text-3xl font-bold font-mono text-white tracking-tight">
              {grossMargin}%
            </span>
            <span className="text-sm font-mono text-blue-400 font-semibold">
              {formatINR(grossProfit)}
            </span>
          </div>

          {/* Progress Visualizer */}
          <div className="space-y-1">
            <div className="h-3 w-full bg-[#1F1F23] rounded-full overflow-hidden p-0.5 border border-white/5">
              <div
                style={{ width: `${Math.min(100, Math.max(0, grossMargin))}%` }}
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-500"
              />
            </div>
            <div className="flex justify-between text-[10px] text-[#6E6E73] font-mono">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          <p className="text-[11px] text-[#86868B] pt-1 border-t border-white/5">
            Retained from sales after deducting direct product procurement cost (COGS).
          </p>
        </div>

        {/* Card 2: Operating Profit Margin */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  operatingProfit >= 0 ? "bg-purple-500" : "bg-rose-500"
                }`}
              />
              <span className="text-xs font-semibold text-white">Operating Profit Margin</span>
            </div>
            <span className="text-xs text-[#86868B] font-mono">
              (Operating Profit / Revenue)
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <span
              className={`text-3xl font-bold font-mono tracking-tight ${
                operatingProfit >= 0 ? "text-white" : "text-rose-400"
              }`}
            >
              {operatingMargin}%
            </span>
            <span
              className={`text-sm font-mono font-semibold ${
                operatingProfit >= 0 ? "text-purple-400" : "text-rose-400"
              }`}
            >
              {formatINR(operatingProfit)}
            </span>
          </div>

          {/* Progress Visualizer */}
          <div className="space-y-1">
            <div className="h-3 w-full bg-[#1F1F23] rounded-full overflow-hidden p-0.5 border border-white/5">
              {operatingMargin >= 0 ? (
                <div
                  style={{ width: `${Math.min(100, Math.max(0, operatingMargin))}%` }}
                  className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-500"
                />
              ) : (
                <div
                  style={{ width: `${Math.min(100, Math.abs(operatingMargin))}%` }}
                  className="h-full bg-gradient-to-r from-rose-700 to-rose-500 rounded-full transition-all duration-500"
                  title="Negative Operating Margin"
                />
              )}
            </div>
            <div className="flex justify-between text-[10px] text-[#6E6E73] font-mono">
              <span>{operatingMargin < 0 ? "Negative Loss" : "0%"}</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          <p className="text-[11px] text-[#86868B] pt-1 border-t border-white/5">
            Final operational bottom-line margin after absorbing store operational overheads.
          </p>
        </div>
      </div>

      {/* Margin Spread & OpEx Absorption Meter */}
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white">OpEx Margin Absorption</div>
            <div className="text-[11px] text-[#86868B]">
              Store operational overheads consume{" "}
              <span className="text-amber-400 font-bold font-mono">{marginAbsorbedByOpEx}%</span> of
              total gross revenue
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center font-mono text-xs">
          <div className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400">
            Gross: {grossMargin}%
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[#6E6E73]" />
          <div
            className={`px-2.5 py-1 rounded-lg ${
              operatingProfit >= 0
                ? "bg-purple-500/10 text-purple-400"
                : "bg-rose-500/10 text-rose-400"
            }`}
          >
            Operating: {operatingMargin}%
          </div>
        </div>
      </div>
    </div>
  );
}
