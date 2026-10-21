import React from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  BarChart3,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";

import useProfitAnalytics from "../hooks/useProfitAnalytics";
import ProfitPeriodFilter from "../components/ProfitPeriodFilter";
import ProfitSummaryCards from "../components/ProfitSummaryCards";
import ProfitBreakdownChart from "../components/ProfitBreakdownChart";
import ProfitMarginComparison from "../components/ProfitMarginComparison";
import ProfitChartSkeleton from "../components/ProfitChartSkeleton";

/**
 * ProfitAnalyticsPage (Phase 10 - Task T62)
 *
 * Full-stack interface visually explaining how recognized revenue flows
 * through COGS and operating expenses to produce gross and operating profit.
 */
export default function ProfitAnalyticsPage() {
  const {
    periodPreset,
    setPeriodPreset,
    customRange,
    handleApplyCustomRange,
    data,
    loading,
    error,
    refresh,
  } = useProfitAnalytics();

  return (
    <div className="min-h-screen bg-[#000000] text-[#D2D2D7] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ── 1. PAGE HEADER & NAVIGATION SWITCHER ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#D2D2D7]/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Gross / Operating Profit Visualizers
                </h1>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-[#8B5CF6]/15 text-[#C4B5FD] border border-[#8B5CF6]/30">
                  Task T62
                </span>
              </div>
              <p className="text-xs text-[#86868B] mt-0.5">
                Accrual accounting waterfall explaining revenue deductions, gross margin, and operating profitability
              </p>
            </div>
          </div>
        </div>

        {/* Cross-Module Navigation Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/dashboard"
            className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-[#A1A1A6] hover:text-white transition-all flex items-center gap-1.5 border border-white/5"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Executive Dashboard</span>
          </Link>
          <Link
            to="/sales-analytics"
            className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-[#A1A1A6] hover:text-white transition-all flex items-center gap-1.5 border border-white/5"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Sales Trends</span>
          </Link>
          <Link
            to="/analytics"
            className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-[#A1A1A6] hover:text-white transition-all flex items-center gap-1.5 border border-white/5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>P&L Overview</span>
          </Link>
        </div>
      </div>

      {/* ── 2. DATE-RANGE FILTERING TOOLBAR ── */}
      <ProfitPeriodFilter
        periodPreset={periodPreset}
        setPeriodPreset={setPeriodPreset}
        customRange={customRange}
        onApplyCustomRange={handleApplyCustomRange}
        loading={loading}
        onRefresh={refresh}
        currentPeriod={data?.period}
      />

      {/* ── 3. ERROR & RETRY STATE ── */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 text-rose-300">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <div className="text-xs font-semibold">Error Loading Profit Analytics</div>
              <div className="text-[11px] text-rose-200/80">{error}</div>
            </div>
          </div>
          <button
            onClick={refresh}
            className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-xl text-xs font-medium transition-all"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── 4. MAIN CONTENT / SKELETON ── */}
      {loading && !data ? (
        <ProfitChartSkeleton />
      ) : (
        <div className="space-y-6">
          {/* Section A: Profit Summary Cards */}
          <ProfitSummaryCards data={data} />

          {/* Section B: Where Your Revenue Goes - Waterfall Breakdown */}
          <ProfitBreakdownChart data={data} loading={loading} />

          {/* Section C: Profitability Breakdown - Margin Comparison */}
          <ProfitMarginComparison data={data} />
        </div>
      )}

      {/* ── 5. ACCOUNTING METHODOLOGY & INTEGRITY FOOTNOTE ── */}
      <div className="p-5 rounded-2xl bg-[#161617]/50 border border-[#D2D2D7]/10 text-xs text-[#86868B] space-y-3">
        <div className="flex items-center gap-2 text-[#A1A1A6] font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Accounting Truth & Source of Truth (T52–T56 Shared Engine)</span>
        </div>
        <p className="text-[11px] leading-relaxed text-[#6E6E73]">
          All figures are computed in real time from the canonical financial services: recognized sales revenue
          (T52), Cost of Goods Sold directly linked to inventory acquisition (T53), gross profit (T54),
          operating expenses (T55), and operating profit (T56). In compliance with accounting standards, customer
          receivable collections and supplier invoice totals are isolated to avoid double counting.
        </p>
        <div className="flex flex-wrap gap-4 pt-1 font-mono text-[10px] text-[#55555B]">
          <span>• Revenue − COGS = Gross Profit</span>
          <span>• Gross Profit − Operating Expenses = Operating Profit</span>
          <span>• Gross Margin = (Gross Profit / Revenue) × 100</span>
          <span>• Operating Margin = (Operating Profit / Revenue) × 100</span>
        </div>
      </div>
    </div>
  );
}
