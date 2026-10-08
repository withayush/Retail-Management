import React, { useState, useEffect } from "react";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Clock,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  X,
  FileText,
  CreditCard,
  Receipt,
  Scale,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getMonthlyRevenueOverview,
  recalculateMonthlyRevenue,
  getMonthlyRevenueDetail,
} from "../../../services/sale.api";

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

export default function MonthlyRevenueAggregator() {
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [data, setData] = useState(null);

  // Inspection Modal State for Daily Statement Audit
  const [selectedMonthDetail, setSelectedMonthDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadData = async (forceRefresh = false) => {
    try {
      if (forceRefresh) setSyncing(true);
      else setLoading(true);

      const res = await getMonthlyRevenueOverview({
        year: selectedYear,
        forceRefresh,
      });
      setData(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load monthly revenue aggregations.");
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
      await recalculateMonthlyRevenue({ year: selectedYear });
      toast.success(`Consolidated revenue summaries for ${selectedYear} recalculated successfully!`);
      await loadData(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to recalculate revenue summaries.");
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenMonthDetail = async (monthNum) => {
    try {
      setDetailLoading(true);
      const res = await getMonthlyRevenueDetail(selectedYear, monthNum);
      setSelectedMonthDetail(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load monthly revenue statement.");
    } finally {
      setDetailLoading(false);
    }
  };

  const months = data?.months || [];
  const maxMonthlyRevenue = Math.max(...months.map((m) => m.totalRevenue || 0), 1);
  const currentMonthNum = new Date().getMonth() + 1;
  const currentMonthData = data?.currentMonthSummary || months[currentMonthNum - 1];

  // Best / Peak Month Calculation
  const peakMonth = months.reduce((prev, curr) =>
    (curr.totalRevenue || 0) > (prev.totalRevenue || 0) ? curr : prev,
    months[0] || {}
  );

  return (
    <div className="space-y-6 animate-fade-in text-[#D2D2D7]">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0066CC]/15 border border-[#0066CC]/30 flex items-center justify-center text-[#2997FF]">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Monthly Revenue Aggregations
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#2997FF]/20 text-[#2997FF] border border-[#2997FF]/30">
                T52 • Accrual Accounting Engine
              </span>
            </div>
            <p className="text-xs text-[#8E8E93]">
              Recognized revenue grouped by calendar dates, months & years from completed invoices
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
            disabled={syncing || loading}
            className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-medium text-white flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Recalculate & refresh materialized monthly summaries from source invoices"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin text-[#2997FF]" : ""}`} />
            <span>{syncing ? "Recalculating..." : "Sync Aggregates"}</span>
          </button>
        </div>
      </div>

      {/* 2. Accrual vs Cash Principles Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0066CC]/10 via-[#2997FF]/5 to-transparent border border-[#2997FF]/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#2997FF]/20 border border-[#2997FF]/30 flex items-center justify-center text-[#2997FF] shrink-0 mt-0.5">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Source of Revenue Truth (Accrual Accounting Foundation)
              </span>
              <span className="text-[10px] bg-[#30D158]/20 text-[#30D158] px-2 py-0.2 rounded font-medium">
                Verified
              </span>
            </div>
            <p className="text-xs text-[#8E8E93] mt-0.5 leading-relaxed">
              Revenue is recognized upon invoice creation regardless of whether payment status is <span className="text-white font-medium">PAID</span>, <span className="text-[#FF9F0A] font-medium">PARTIAL</span>, or <span className="text-[#FF453A] font-medium">CREDIT (Udhar)</span>. Cancelled invoices are strictly filtered out.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-black/40 px-3.5 py-2 rounded-xl border border-white/10 shrink-0 text-xs">
          <div>
            <span className="text-[10px] text-[#8E8E93] block">Cash Inflow (Paid)</span>
            <span className="font-bold text-[#30D158]">
              ₹{Number(data?.yearlyAggregates?.totalCashCollected || 0).toLocaleString("en-IN")}
            </span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div>
            <span className="text-[10px] text-[#8E8E93] block">Receivables (Udhar)</span>
            <span className="font-bold text-[#FF453A]">
              ₹{Number(data?.yearlyAggregates?.totalReceivables || 0).toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {/* 3. 4x Key Performance Indicators (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Current Month Recognized Revenue */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider">
              {currentMonthData?.monthName || "Current Month"} Revenue
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#2997FF]/15 flex items-center justify-center text-[#2997FF]">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-white tracking-tight">
              ₹{Number(currentMonthData?.totalRevenue || 0).toLocaleString("en-IN")}
            </span>
            <div className="flex items-center gap-2 mt-1">
              {currentMonthData?.momGrowthPercentage !== null && currentMonthData?.momGrowthPercentage !== undefined ? (
                <span
                  className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    currentMonthData.momGrowthPercentage >= 0
                      ? "bg-[#30D158]/20 text-[#30D158]"
                      : "bg-[#FF453A]/20 text-[#FF453A]"
                  }`}
                >
                  {currentMonthData.momGrowthPercentage >= 0 ? (
                    <ArrowUpRight className="w-3 h-3 mr-0.5" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 mr-0.5" />
                  )}
                  {Math.abs(currentMonthData.momGrowthPercentage)}% MoM
                </span>
              ) : (
                <span className="text-[10px] text-[#8E8E93]">First Period</span>
              )}
              <span className="text-[11px] text-[#8E8E93]">
                Run rate: ₹{Number(currentMonthData?.dailyRunRate || 0).toLocaleString("en-IN")}/day
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: FY Total Revenue (YTD) */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider">
              FY {selectedYear} Total Revenue
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#30D158]/15 flex items-center justify-center text-[#30D158]">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-[#30D158] tracking-tight">
              ₹{Number(data?.yearlyAggregates?.totalRevenue || 0).toLocaleString("en-IN")}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-[#8E8E93]">
                {data?.yearlyAggregates?.totalInvoices || 0} completed invoices recorded
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Average Order Value (AOV) */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider">
              Average Order Value (AOV)
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#FF9F0A]/15 flex items-center justify-center text-[#FF9F0A]">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-white tracking-tight">
              ₹{Number(data?.yearlyAggregates?.averageInvoiceValue || 0).toLocaleString("en-IN")}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-[#8E8E93]">
                Subtotal ₹{Number(data?.yearlyAggregates?.totalSubtotal || 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: Peak Revenue Month */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider">
              Peak Month ({peakMonth?.monthName || "N/A"})
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#BF5AF2]/15 flex items-center justify-center text-[#BF5AF2]">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-[#BF5AF2] tracking-tight">
              ₹{Number(peakMonth?.totalRevenue || 0).toLocaleString("en-IN")}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-[#8E8E93]">
                {peakMonth?.invoiceCount || 0} invoices in {peakMonth?.monthName || "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. 12-Month Revenue Progression Bar Chart */}
      <div className="p-5 rounded-2xl bg-[#161617]/80 backdrop-blur-xl border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>12-Month Revenue Trajectory ({selectedYear})</span>
            </h3>
            <p className="text-xs text-[#8E8E93]">
              Accrual recognized gross invoice values compared across fiscal periods
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#2997FF]" />
              <span className="text-[#8E8E93]">Recognized Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#30D158]" />
              <span className="text-[#8E8E93]">Cash Collected</span>
            </div>
          </div>
        </div>

        {/* Bar Chart Grid */}
        <div className="h-56 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-white/10">
          {months.map((m) => {
            const heightPercent = maxMonthlyRevenue > 0 ? ((m.totalRevenue || 0) / maxMonthlyRevenue) * 100 : 0;
            const isCurrent = m.month === currentMonthNum && selectedYear === CURRENT_YEAR;
            const isPeak = m.month === peakMonth?.month && (m.totalRevenue || 0) > 0;

            return (
              <div
                key={m.month}
                onClick={() => handleOpenMonthDetail(m.month)}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                title={`${m.monthName} ${selectedYear}: ₹${Number(m.totalRevenue || 0).toLocaleString("en-IN")} (${m.invoiceCount || 0} invoices)`}
              >
                {/* Floating Tooltip on Hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -translate-y-24 bg-black/90 border border-white/20 text-white p-2 rounded-xl text-[10px] pointer-events-none shadow-xl z-20 whitespace-nowrap">
                  <div className="font-bold text-[#2997FF]">{m.monthName} {selectedYear}</div>
                  <div>Revenue: ₹{Number(m.totalRevenue || 0).toLocaleString("en-IN")}</div>
                  <div className="text-[#30D158]">Cash: ₹{Number(m.cashCollected || 0).toLocaleString("en-IN")}</div>
                  <div className="text-[#FF453A]">Due: ₹{Number(m.receivablesCreated || 0).toLocaleString("en-IN")}</div>
                  <div className="text-[#8E8E93]">{m.invoiceCount || 0} Invoices • AOV: ₹{Number(m.averageInvoiceValue || 0).toLocaleString("en-IN")}</div>
                </div>

                {/* Amount on top of bar */}
                <span className="text-[9px] text-[#8E8E93] group-hover:text-white transition-colors mb-1 font-mono truncate max-w-full">
                  {m.totalRevenue > 0 ? `₹${(m.totalRevenue / 1000).toFixed(0)}k` : "—"}
                </span>

                {/* Bar Column */}
                <div className="w-full max-w-[36px] bg-white/[0.04] rounded-t-lg flex items-end overflow-hidden h-full relative group-hover:bg-white/[0.08] transition-all">
                  <div
                    style={{ height: `${Math.max(heightPercent, m.totalRevenue > 0 ? 6 : 0)}%` }}
                    className={`w-full transition-all duration-500 rounded-t-lg ${
                      isCurrent
                        ? "bg-gradient-to-t from-[#0066CC] to-[#2997FF] shadow-lg shadow-[#0066CC]/20"
                        : isPeak
                        ? "bg-gradient-to-t from-[#5E5CE6] to-[#BF5AF2]"
                        : "bg-gradient-to-t from-[#004080] to-[#2997FF]/80 group-hover:to-[#2997FF]"
                    }`}
                  />
                </div>

                {/* Month Name */}
                <span
                  className={`text-[10px] mt-2 font-medium transition-colors ${
                    isCurrent ? "text-[#2997FF] font-bold" : "text-[#8E8E93] group-hover:text-white"
                  }`}
                >
                  {m.monthName.slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Consolidated Monthly Statements Table */}
      <div className="rounded-2xl bg-[#161617]/80 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Monthly Statement Summaries</h3>
            <p className="text-xs text-[#8E8E93]">
              Accrual revenue recognitions and cash reconciliations by calendar month
            </p>
          </div>
          <span className="text-xs text-[#8E8E93] font-mono">
            {months.filter((m) => m.invoiceCount > 0).length} Active Months
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#D2D2D7]">
            <thead className="bg-white/[0.02] border-b border-white/10 text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4 text-right">Invoices</th>
                <th className="py-3 px-4 text-right">Gross Revenue (Accrual)</th>
                <th className="py-3 px-4 text-right">Cash Inflow</th>
                <th className="py-3 px-4 text-right">Receivables (Udhar)</th>
                <th className="py-3 px-4 text-right">MoM Growth</th>
                <th className="py-3 px-4 text-right">AOV</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {months.map((m) => {
                const isCurrent = m.month === currentMonthNum && selectedYear === CURRENT_YEAR;

                return (
                  <tr
                    key={m.month}
                    className={`hover:bg-white/[0.03] transition-colors ${
                      isCurrent ? "bg-[#0066CC]/5" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4 font-medium text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#2997FF]" />
                      <span>{m.monthName} {selectedYear}</span>
                      {isCurrent && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#2997FF]/20 text-[#2997FF] font-semibold">
                          Active
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono">
                      {m.invoiceCount || 0}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                      ₹{Number(m.totalRevenue || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-[#30D158]">
                      ₹{Number(m.cashCollected || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-[#FF453A]">
                      ₹{Number(m.receivablesCreated || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {m.momGrowthPercentage !== null && m.momGrowthPercentage !== undefined ? (
                        <span
                          className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            m.momGrowthPercentage >= 0
                              ? "bg-[#30D158]/20 text-[#30D158]"
                              : "bg-[#FF453A]/20 text-[#FF453A]"
                          }`}
                        >
                          {m.momGrowthPercentage >= 0 ? "+" : ""}
                          {m.momGrowthPercentage}%
                        </span>
                      ) : (
                        <span className="text-[#8E8E93] text-[10px]">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-[#8E8E93]">
                      ₹{Number(m.averageInvoiceValue || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleOpenMonthDetail(m.month)}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-[11px] font-medium text-[#2997FF] hover:text-white transition-all cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Detailed Inspection Modal (Daily Breakdown & Audit) */}
      {selectedMonthDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{selectedMonthDetail.monthName} {selectedMonthDetail.year} Statement Audit</span>
                  <span className="text-[10px] bg-[#2997FF]/20 text-[#2997FF] px-2 py-0.5 rounded-full font-bold">
                    T52 Granular Ledger
                  </span>
                </h3>
                <p className="text-xs text-[#8E8E93]">
                  Accrual revenue daily breakdown & payment mode distribution
                </p>
              </div>
              <button
                onClick={() => setSelectedMonthDetail(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5">
              {/* Top Stats Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-[10px] text-[#8E8E93] block uppercase">Gross Revenue</span>
                  <span className="text-lg font-bold text-white">
                    ₹{Number(selectedMonthDetail.totalRevenue || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-[10px] text-[#8E8E93] block uppercase">Cash Collected</span>
                  <span className="text-lg font-bold text-[#30D158]">
                    ₹{Number(selectedMonthDetail.cashCollected || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-[10px] text-[#8E8E93] block uppercase">Receivables</span>
                  <span className="text-lg font-bold text-[#FF453A]">
                    ₹{Number(selectedMonthDetail.receivablesCreated || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-[10px] text-[#8E8E93] block uppercase">Invoices Count</span>
                  <span className="text-lg font-bold text-[#2997FF]">
                    {selectedMonthDetail.invoiceCount || 0}
                  </span>
                </div>
              </div>

              {/* Payment Mode Breakdown */}
              {selectedMonthDetail.paymentModesBreakdown && (
                <div className="p-4 rounded-xl bg-black/30 border border-white/10">
                  <h4 className="text-xs font-bold text-white mb-3">Tender & Payment Mode Composition</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                    {Object.entries(selectedMonthDetail.paymentModesBreakdown).map(([mode, amt]) => (
                      <div key={mode} className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                        <span className="text-[10px] text-[#8E8E93] block">{mode}</span>
                        <span className="font-semibold text-white font-mono">
                          ₹{Number(amt || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Daily Revenue Distribution Table */}
              <div>
                <h4 className="text-xs font-bold text-white mb-2">Daily Revenue Ledger</h4>
                <div className="rounded-xl border border-white/10 overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs text-[#D2D2D7]">
                    <thead className="bg-white/[0.04] text-[10px] font-bold text-[#8E8E93] uppercase sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3 text-right">Invoices</th>
                        <th className="py-2 px-3 text-right">Revenue</th>
                        <th className="py-2 px-3 text-right">Cash Inflow</th>
                        <th className="py-2 px-3 text-right">Receivables</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {selectedMonthDetail.dailyBreakdown && selectedMonthDetail.dailyBreakdown.length > 0 ? (
                        selectedMonthDetail.dailyBreakdown.map((d) => (
                          <tr key={d.date} className="hover:bg-white/[0.02]">
                            <td className="py-2 px-3 text-white font-sans">{d.date}</td>
                            <td className="py-2 px-3 text-right">{d.invoiceCount}</td>
                            <td className="py-2 px-3 text-right font-bold text-white">
                              ₹{Number(d.revenue || 0).toLocaleString("en-IN")}
                            </td>
                            <td className="py-2 px-3 text-right text-[#30D158]">
                              ₹{Number(d.cashCollected || 0).toLocaleString("en-IN")}
                            </td>
                            <td className="py-2 px-3 text-right text-[#FF453A]">
                              ₹{Number(d.receivablesCreated || 0).toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-[#8E8E93] font-sans">
                            No sales recorded in this calendar month yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 bg-white/[0.02] flex justify-end">
              <button
                onClick={() => setSelectedMonthDetail(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all cursor-pointer"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
