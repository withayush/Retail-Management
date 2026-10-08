import React, { useState, useEffect } from "react";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Layers,
  PieChart,
  BarChart3,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Clock,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  X,
  FileText,
  Tag,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getMonthlyOpExOverview,
  recalculateMonthlyOpEx,
} from "../../../services/expense.api";
import { ICON_MAP } from "./CreateExpenseCategoryModal";

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

export default function MonthlyOpExAggregator({ onJumpToLedgerMonth }) {
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [data, setData] = useState(null);

  // Inspection Modal State
  const [selectedMonthDetail, setSelectedMonthDetail] = useState(null);

  const loadData = async (forceRefresh = false) => {
    try {
      if (forceRefresh) setSyncing(true);
      else setLoading(true);

      const res = await getMonthlyOpExOverview({
        year: selectedYear,
        forceRefresh,
      });
      setData(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load monthly OpEx data.");
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadData(false);
  }, [selectedYear]);

  const handleRecalculate = async () => {
    try {
      setSyncing(true);
      await recalculateMonthlyOpEx({ year: selectedYear });
      toast.success(`Consolidated OpEx cache for ${selectedYear} recalculated successfully!`);
      await loadData(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to recalculate OpEx cache.");
    } finally {
      setSyncing(false);
    }
  };

  const months = data?.months || [];
  const maxMonthlyAmount = Math.max(...months.map((m) => m.totalOpEx || 0), 1);
  const currentMonthNum = new Date().getMonth() + 1;
  const currentMonthData = data?.currentMonthSummary || months[currentMonthNum - 1];

  return (
    <div className="space-y-6 animate-fade-in text-[#D2D2D7]">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#30D158]/15 border border-[#30D158]/30 flex items-center justify-center text-[#30D158]">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Monthly OpEx Aggregator Engine
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Consolidated Analytics
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Calendar-month consolidated operating expenditures and financial statement summaries
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Year Selector */}
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#8E8E93]" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              {YEAR_OPTIONS.map((yr) => (
                <option key={yr} value={yr} className="bg-[#1C1C1E] text-white">
                  FY {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Sync / Recalculate Button */}
          <button
            onClick={handleRecalculate}
            disabled={syncing}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            title="Force re-aggregate all months and refresh cache"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#30D158] ${syncing ? "animate-spin" : ""}`} />
            <span>{syncing ? "Aggregating..." : "Sync Engine Cache"}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-7 h-7 text-[#30D158] animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#8E8E93]">Consolidating monthly operational expenditures...</p>
        </div>
      ) : (
        <>
          {/* 2. Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Current Month OpEx */}
            <div className="p-5 rounded-2xl bg-[#161617]/80 backdrop-blur-xl border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#8E8E93] uppercase tracking-wider">
                  Current Month OpEx
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#30D158]/15 flex items-center justify-center text-[#30D158]">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-white tracking-tight">
                  ₹{Number(currentMonthData?.totalOpEx || 0).toLocaleString("en-IN")}
                </span>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {/* MoM Pill */}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                      (currentMonthData?.momGrowthRate || 0) > 0
                        ? "bg-[#FF453A]/15 text-[#FF453A] border-[#FF453A]/30"
                        : "bg-[#30D158]/15 text-[#30D158] border-[#30D158]/30"
                    }`}
                  >
                    {(currentMonthData?.momGrowthRate || 0) > 0 ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {currentMonthData?.momGrowthRate > 0 ? "+" : ""}
                    {currentMonthData?.momGrowthRate || 0}% MoM
                  </span>

                  <span className="text-[11px] text-[#8E8E93]">
                    ₹{Number(currentMonthData?.averageDailyOpEx || 0).toLocaleString("en-IN")}/day
                  </span>
                </div>
              </div>
            </div>

            {/* 2. YTD Total OpEx */}
            <div className="p-5 rounded-2xl bg-[#161617]/80 backdrop-blur-xl border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#8E8E93] uppercase tracking-wider">
                  YTD Total Spend ({selectedYear})
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#0066CC]/15 flex items-center justify-center text-[#0066CC]">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-white tracking-tight">
                  ₹{Number(data?.totalYearlyOpEx || 0).toLocaleString("en-IN")}
                </span>
                <p className="text-[11px] text-[#8E8E93] mt-1">
                  Across {data?.activeMonthsCount || 0} active calendar months ({data?.totalYearlyExpensesCount || 0} bills)
                </p>
              </div>
            </div>

            {/* 3. Average Monthly Overhead */}
            <div className="p-5 rounded-2xl bg-[#161617]/80 backdrop-blur-xl border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#8E8E93] uppercase tracking-wider">
                  Monthly Average
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#FF9F0A]/15 flex items-center justify-center text-[#FF9F0A]">
                  <BarChart3 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-[#FF9F0A] tracking-tight">
                  ₹{Number(data?.averageMonthlyOpEx || 0).toLocaleString("en-IN")}
                </span>
                <p className="text-[11px] text-[#8E8E93] mt-1">
                  Normalized store operating cost/mo
                </p>
              </div>
            </div>

            {/* 4. Peak Spending Month */}
            <div className="p-5 rounded-2xl bg-[#161617]/80 backdrop-blur-xl border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#8E8E93] uppercase tracking-wider">
                  Peak Overhead Month
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#BF5AF2]/15 flex items-center justify-center text-[#BF5AF2]">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-[#BF5AF2] tracking-tight">
                  {data?.peakMonth?.monthName ? data.peakMonth.monthName.split(" ")[0] : "—"}
                </span>
                <p className="text-[11px] text-[#8E8E93] mt-1">
                  ₹{Number(data?.peakMonth?.amount || 0).toLocaleString("en-IN")} recorded peak
                </p>
              </div>
            </div>
          </div>

          {/* 3. Visual 12-Month OpEx Progression Bar Chart */}
          <div className="p-5 rounded-2xl bg-[#161617]/80 backdrop-blur-xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Calendar Year OpEx Trajectory ({selectedYear})
                </h3>
                <p className="text-xs text-[#8E8E93]">
                  Consolidated monthly overhead trends across calendar months
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#8E8E93]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#30D158]" /> Normal OpEx
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#BF5AF2]" /> Peak Month
                </span>
              </div>
            </div>

            {/* Interactive Bar Chart Grid */}
            <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-white/10">
              {months.map((m) => {
                const heightPercent = maxMonthlyAmount > 0
                  ? Math.round(((m.totalOpEx || 0) / maxMonthlyAmount) * 100)
                  : 0;
                const isPeak = (m.totalOpEx || 0) > 0 && m.totalOpEx === data?.peakMonth?.amount;
                const isCurrent = m.month === currentMonthNum && selectedYear === CURRENT_YEAR;

                return (
                  <div
                    key={m.month}
                    onClick={() => {
                      if (m.totalOpEx > 0) setSelectedMonthDetail(m);
                    }}
                    className={`flex-1 flex flex-col items-center justify-end h-full group relative ${
                      m.totalOpEx > 0 ? "cursor-pointer" : ""
                    }`}
                  >
                    {/* Hover Floating Tooltip */}
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white border border-white/10 rounded-lg px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap pointer-events-none z-20 shadow-xl">
                      <p>{m.monthName}</p>
                      <p className="text-[#30D158]">
                        ₹{Number(m.totalOpEx || 0).toLocaleString("en-IN")} ({m.expenseCount} bills)
                      </p>
                    </div>

                    {/* Bar Pillar */}
                    <div className="w-full max-w-[36px] bg-white/[0.04] rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                      <div
                        className={`w-full rounded-t-lg transition-all duration-500 ${
                          isPeak
                            ? "bg-gradient-to-t from-[#BF5AF2]/80 to-[#BF5AF2] shadow-[0_0_12px_rgba(191,90,242,0.4)]"
                            : isCurrent
                            ? "bg-gradient-to-t from-[#30D158]/80 to-[#30D158]"
                            : m.totalOpEx > 0
                            ? "bg-gradient-to-t from-[#0066CC]/60 to-[#0066CC] group-hover:from-[#0066CC] group-hover:to-[#64D2FF]"
                            : "bg-white/5"
                        }`}
                        style={{ height: `${Math.max(4, heightPercent)}%` }}
                      />
                    </div>

                    {/* Month Label */}
                    <span
                      className={`text-[11px] mt-2 font-medium ${
                        isCurrent
                          ? "text-[#30D158] font-bold"
                          : isPeak
                          ? "text-[#BF5AF2] font-bold"
                          : "text-[#8E8E93]"
                      }`}
                    >
                      {m.monthName ? m.monthName.slice(0, 3) : `M${m.month}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Consolidated Calendar Months Statements Table */}
          <div className="bg-[#161617]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.01]">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Consolidated Monthly Expenditure Ledger
                </h3>
                <p className="text-xs text-[#8E8E93]">
                  Immutable calendar-month operational totals, MoM variances, and category distributions
                </p>
              </div>
              <span className="text-xs text-[#8E8E93] bg-white/5 px-3 py-1 rounded-full border border-white/5">
                12 Months Consolidated
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-[#8E8E93] uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4 font-medium">Calendar Month</th>
                    <th className="py-3.5 px-4 font-medium">Status</th>
                    <th className="py-3.5 px-4 font-medium">Total OpEx</th>
                    <th className="py-3.5 px-4 font-medium">MoM Variance</th>
                    <th className="py-3.5 px-4 font-medium">Transactions</th>
                    <th className="py-3.5 px-4 font-medium">Daily Burn</th>
                    <th className="py-3.5 px-4 font-medium">Top Category Distribution</th>
                    <th className="py-3.5 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {months.map((m) => {
                    const isZero = !m.totalOpEx || m.totalOpEx === 0;

                    return (
                      <tr
                        key={m.month}
                        className={`hover:bg-white/[0.02] transition-colors ${
                          isZero ? "opacity-50" : ""
                        }`}
                      >
                        {/* Month Name */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[#8E8E93]" />
                            <span className="font-semibold text-white">{m.monthName}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {m.status === "FINALIZED" ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-[#8E8E93] border border-white/10">
                              FINALIZED
                            </span>
                          ) : m.status === "ACTIVE" ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30">
                              ACTIVE
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-[#636366]">
                              PROJECTED
                            </span>
                          )}
                        </td>

                        {/* Total OpEx */}
                        <td className="py-3 px-4 font-bold text-white">
                          ₹{Number(m.totalOpEx || 0).toLocaleString("en-IN")}
                        </td>

                        {/* MoM Variance & Growth Rate */}
                        <td className="py-3 px-4">
                          {isZero ? (
                            <span className="text-[#636366]">—</span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                                  (m.momGrowthRate || 0) > 0
                                    ? "bg-[#FF453A]/15 text-[#FF453A] border-[#FF453A]/30"
                                    : (m.momGrowthRate || 0) < 0
                                    ? "bg-[#30D158]/15 text-[#30D158] border-[#30D158]/30"
                                    : "bg-white/5 text-[#8E8E93] border-white/10"
                                }`}
                              >
                                {(m.momGrowthRate || 0) > 0 ? (
                                  <TrendingUp className="w-3 h-3" />
                                ) : (m.momGrowthRate || 0) < 0 ? (
                                  <TrendingDown className="w-3 h-3" />
                                ) : null}
                                {m.momGrowthRate > 0 ? "+" : ""}
                                {m.momGrowthRate || 0}%
                              </span>
                              <span className="text-[10px] text-[#8E8E93]">
                                ({m.momVariance > 0 ? "+" : ""}₹
                                {Number(m.momVariance || 0).toLocaleString("en-IN")})
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Bills Count */}
                        <td className="py-3 px-4 text-[#D2D2D7]">
                          {m.expenseCount > 0 ? `${m.expenseCount} entries` : "—"}
                        </td>

                        {/* Daily Burn Rate */}
                        <td className="py-3 px-4 text-[#8E8E93]">
                          {m.averageDailyOpEx > 0
                            ? `₹${Number(m.averageDailyOpEx).toLocaleString("en-IN")}/day`
                            : "—"}
                        </td>

                        {/* Top Categories Pills */}
                        <td className="py-3 px-4">
                          {m.categoryBreakdown?.length > 0 ? (
                            <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                              {m.categoryBreakdown.slice(0, 3).map((cat, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] font-medium px-2 py-0.5 rounded-lg border flex items-center gap-1"
                                  style={{
                                    backgroundColor: `${cat.categoryColor || "#8E8E93"}15`,
                                    borderColor: `${cat.categoryColor || "#8E8E93"}40`,
                                    color: cat.categoryColor || "#D2D2D7",
                                  }}
                                >
                                  {cat.categoryName}: {cat.percentage}%
                                </span>
                              ))}
                              {m.categoryBreakdown.length > 3 && (
                                <span className="text-[10px] text-[#8E8E93]">
                                  +{m.categoryBreakdown.length - 3} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#636366]">No expenses</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Drilldown Statement */}
                            <button
                              disabled={isZero}
                              onClick={() => setSelectedMonthDetail(m)}
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-medium text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              <span>Statement</span>
                              <ChevronRight className="w-3 h-3 text-[#8E8E93]" />
                            </button>

                            {/* Jump to T50 Historical Ledger */}
                            <button
                              disabled={isZero}
                              onClick={() => {
                                if (onJumpToLedgerMonth) {
                                  onJumpToLedgerMonth(m.monthKey);
                                }
                              }}
                              className="p-1 rounded-lg hover:bg-white/10 text-[#8E8E93] hover:text-[#64D2FF] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              title="Filter Historical Ledger for this month"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 5. Detailed Month Statement Inspection Modal */}
      {selectedMonthDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#1C1C1E] border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-modal-pop">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0066CC]/20 border border-[#0066CC]/40 flex items-center justify-center text-[#0066CC]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-white">
                      {selectedMonthDetail.monthName} Financial Statement
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-[#8E8E93]">
                      {selectedMonthDetail.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#8E8E93]">
                    Consolidated operational overhead audit statement & category distribution
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMonthDetail(null)}
                className="p-1.5 rounded-full text-[#8E8E93] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Snapshot Metrics Banner */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-black/40 border border-white/10">
                <div>
                  <span className="text-[10px] uppercase font-medium text-[#8E8E93]">Total OpEx</span>
                  <p className="text-lg font-bold text-white mt-0.5">
                    ₹{Number(selectedMonthDetail.totalOpEx || 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-medium text-[#8E8E93]">MoM Growth</span>
                  <p
                    className={`text-lg font-bold mt-0.5 ${
                      (selectedMonthDetail.momGrowthRate || 0) > 0
                        ? "text-[#FF453A]"
                        : "text-[#30D158]"
                    }`}
                  >
                    {selectedMonthDetail.momGrowthRate > 0 ? "+" : ""}
                    {selectedMonthDetail.momGrowthRate || 0}%
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-medium text-[#8E8E93]">Entries</span>
                  <p className="text-lg font-bold text-[#64D2FF] mt-0.5">
                    {selectedMonthDetail.expenseCount || 0} Bills
                  </p>
                </div>
              </div>

              {/* Category-Wise Breakdown Table */}
              <div>
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Category Breakdown</span>
                  <span className="text-[10px] text-[#8E8E93] lowercase font-normal">
                    {selectedMonthDetail.categoryBreakdown?.length || 0} headings recorded
                  </span>
                </h4>

                <div className="divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden bg-black/20">
                  {selectedMonthDetail.categoryBreakdown?.map((cat, i) => {
                    const IconComp = ICON_MAP[cat.categoryIcon] || Tag;
                    const color = cat.categoryColor || "#8E8E93";

                    return (
                      <div key={i} className="p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center border shrink-0"
                            style={{
                              backgroundColor: `${color}20`,
                              borderColor: `${color}40`,
                              color,
                            }}
                          >
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate">{cat.categoryName}</p>
                            <p className="text-[10px] text-[#8E8E93]">
                              {cat.count} bills • {cat.percentage}% of month OpEx
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-bold text-white">
                            ₹{Number(cat.totalAmount || 0).toLocaleString("en-IN")}
                          </span>
                          {cat.isOverBudget && (
                            <div className="flex items-center gap-1 text-[10px] text-[#FF453A] font-semibold mt-0.5 justify-end">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Over by ₹{Number(cat.budgetVariance).toLocaleString("en-IN")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Methods Breakdown */}
              {selectedMonthDetail.paymentMethodBreakdown?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">
                    Disbursement Methods
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {selectedMonthDetail.paymentMethodBreakdown.map((pm, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-black/30 border border-white/10 flex flex-col justify-between"
                      >
                        <span className="text-[10px] font-medium text-[#8E8E93] uppercase">
                          {pm.method}
                        </span>
                        <div className="mt-1 flex items-baseline justify-between">
                          <span className="font-bold text-white">
                            ₹{Number(pm.totalAmount || 0).toLocaleString("en-IN")}
                          </span>
                          <span className="text-[10px] text-[#8E8E93]">{pm.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 flex items-center justify-between bg-white/[0.02]">
              <span className="text-[11px] text-[#8E8E93]">
                Aggregated by: {selectedMonthDetail.aggregatedBy || "AUTO_ENGINE"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (onJumpToLedgerMonth) {
                      onJumpToLedgerMonth(selectedMonthDetail.monthKey);
                    }
                    setSelectedMonthDetail(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0066CC] hover:bg-[#0077ED] text-xs font-semibold text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Historical Ledger</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
