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
  Package,
  Layers,
  PieChart,
  Percent,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getMonthlyCogsOverview,
  recalculateMonthlyCogs,
  getMonthlyCogsDetail,
  getCustomPeriodCogs,
} from "../../../services/sale.api";

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

export default function MonthlyCogsCalculator() {
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [data, setData] = useState(null);

  // Custom Date Range State
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customRangeData, setCustomRangeData] = useState(null);
  const [customLoading, setCustomLoading] = useState(false);

  // Product Ranking Sort State
  const [productSortBy, setProductSortBy] = useState("totalCogs"); // totalCogs | grossProfit | unitsSold | grossMarginPercentage
  const [productSearch, setProductSearch] = useState("");

  // Inspection Modal State for Daily Statement Audit
  const [selectedMonthDetail, setSelectedMonthDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadData = async (forceRefresh = false) => {
    try {
      if (forceRefresh) setSyncing(true);
      else setLoading(true);

      const res = await getMonthlyCogsOverview({
        year: selectedYear,
        forceRefresh,
      });
      setData(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load COGS analytics data.");
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (!isCustomRange) {
      loadData(false);
    }
  }, [selectedYear, isCustomRange]);

  const handleRecalculate = async () => {
    try {
      setSyncing(true);
      await recalculateMonthlyCogs({ year: selectedYear });
      toast.success(`Consolidated COGS summaries for ${selectedYear} recalculated successfully!`);
      await loadData(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to recalculate COGS summaries.");
    } finally {
      setSyncing(false);
    }
  };

  const handleCustomRangeQuery = async (e) => {
    if (e) e.preventDefault();
    if (!startDate || !endDate) {
      toast.error("Please specify both start date and end date.");
      return;
    }

    try {
      setCustomLoading(true);
      const res = await getCustomPeriodCogs({ startDate, endDate });
      setCustomRangeData(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to calculate custom period COGS.");
    } finally {
      setCustomLoading(false);
    }
  };

  const handleOpenMonthDetail = async (monthNum) => {
    try {
      setDetailLoading(true);
      const res = await getMonthlyCogsDetail(selectedYear, monthNum);
      setSelectedMonthDetail(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load monthly COGS statement.");
    } finally {
      setDetailLoading(false);
    }
  };

  const months = data?.months || [];
  const maxMonthlyCogs = Math.max(...months.map((m) => m.totalCogs || 0), 1);
  const currentMonthNum = new Date().getMonth() + 1;
  const currentMonthData = data?.currentMonthSummary || months[currentMonthNum - 1];

  // Best / Peak Month Calculation
  const peakCogsMonth = months.reduce((prev, curr) =>
    (curr.totalCogs || 0) > (prev.totalCogs || 0) ? curr : prev,
    months[0] || {}
  );

  // Aggregate Product List across all months for ranking
  const allProductsMap = new Map();
  months.forEach((m) => {
    (m.productBreakdown || []).forEach((p) => {
      const key = p.productId ? p.productId.toString() : p.name;
      const existing = allProductsMap.get(key) || {
        productId: p.productId,
        name: p.name,
        sku: p.sku,
        unit: p.unit,
        unitsSold: 0,
        totalCogs: 0,
        totalRevenue: 0,
        grossProfit: 0,
      };
      existing.unitsSold += p.unitsSold || 0;
      existing.totalCogs += p.totalCogs || 0;
      existing.totalRevenue += p.totalRevenue || 0;
      existing.grossProfit += p.grossProfit || 0;
      allProductsMap.set(key, existing);
    });
  });

  const totalAnnualCogs = data?.yearlyAggregates?.totalCogs || 1;
  let allProducts = Array.from(allProductsMap.values()).map((p) => {
    const cogs = Math.round(p.totalCogs * 100) / 100;
    const rev = Math.round(p.totalRevenue * 100) / 100;
    const profit = Math.round((rev - cogs) * 100) / 100;
    const margin = rev > 0 ? Math.round(((profit / rev) * 100) * 100) / 100 : 0;
    const share = totalAnnualCogs > 0 ? Math.round(((cogs / totalAnnualCogs) * 100) * 100) / 100 : 0;
    const avgCost = p.unitsSold > 0 ? Math.round((cogs / p.unitsSold) * 100) / 100 : 0;

    return {
      ...p,
      totalCogs: cogs,
      totalRevenue: rev,
      grossProfit: profit,
      grossMarginPercentage: margin,
      costSharePercentage: share,
      historicalCostPrice: avgCost,
    };
  });

  if (productSearch.trim()) {
    const q = productSearch.toLowerCase().trim();
    allProducts = allProducts.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
  }

  allProducts.sort((a, b) => (b[productSortBy] || 0) - (a[productSortBy] || 0));

  return (
    <div className="space-y-6 animate-fade-in text-[#D2D2D7]">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF9F0A]/15 border border-[#FF9F0A]/30 flex items-center justify-center text-[#FF9F0A]">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Cost of Goods Sold (COGS) Calculator
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FF9F0A]/20 text-[#FF9F0A] border border-[#FF9F0A]/30">
                T53 • Inventory Cost Engine
              </span>
            </div>
            <p className="text-xs text-[#8E8E93]">
              Raw inventory acquisition costs: SUM(Sale Item Cost × Quantity Sold) from historical snapshots
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Mode Selector */}
          <div className="flex items-center p-0.5 bg-black/40 border border-white/10 rounded-xl text-xs font-medium">
            <button
              onClick={() => setIsCustomRange(false)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                !isCustomRange ? "bg-white/10 text-white font-semibold" : "text-[#8E8E93] hover:text-white"
              }`}
            >
              Fiscal Year
            </button>
            <button
              onClick={() => setIsCustomRange(true)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                isCustomRange ? "bg-white/10 text-white font-semibold" : "text-[#8E8E93] hover:text-white"
              }`}
            >
              Custom Period
            </button>
          </div>

          {!isCustomRange ? (
            <>
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
                title="Recalculate & refresh materialized monthly COGS summaries"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin text-[#FF9F0A]" : ""}`} />
                <span>{syncing ? "Recalculating..." : "Sync COGS"}</span>
              </button>
            </>
          ) : (
            <form onSubmit={handleCustomRangeQuery} className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none"
              />
              <span className="text-[#8E8E93] text-xs">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={customLoading}
                className="px-3 py-1.5 rounded-xl bg-[#FF9F0A] hover:bg-[#FF9F0A]/90 text-black text-xs font-bold transition-all cursor-pointer"
              >
                {customLoading ? "Calculating..." : "Compute"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* 2. Mathematical Foundation & Historical Snapshot Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FF9F0A]/10 via-[#FF9F0A]/5 to-transparent border border-[#FF9F0A]/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FF9F0A]/20 border border-[#FF9F0A]/30 flex items-center justify-center text-[#FF9F0A] shrink-0 mt-0.5">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Historical Cost Snapshot Guarantee (COGS Formula)
              </span>
              <span className="text-[10px] bg-[#30D158]/20 text-[#30D158] px-2 py-0.2 rounded font-medium">
                Accrual Preserved
              </span>
            </div>
            <p className="text-xs text-[#8E8E93] mt-0.5 leading-relaxed">
              <span className="text-white font-mono font-semibold">COGS = SUM(SaleItem.costPrice × Quantity)</span>. Cost is frozen at the moment of sale and will <span className="text-white font-medium">never change</span> even if catalog product cost prices increase later. Cancelled invoices are strictly filtered out.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-black/40 px-3.5 py-2 rounded-xl border border-white/10 shrink-0 text-xs">
          <div>
            <span className="text-[10px] text-[#8E8E93] block">Gross Profit</span>
            <span className="font-bold text-[#30D158]">
              ₹{Number(data?.yearlyAggregates?.grossProfit || 0).toLocaleString("en-IN")}
            </span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div>
            <span className="text-[10px] text-[#8E8E93] block">Gross Margin</span>
            <span className="font-bold text-[#2997FF]">
              {data?.yearlyAggregates?.grossMarginPercentage || 0}%
            </span>
          </div>
        </div>
      </div>

      {/* If Custom Date Range Mode is Active */}
      {isCustomRange && customRangeData && (
        <div className="p-5 rounded-2xl bg-[#161617]/90 border border-[#FF9F0A]/30 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Custom Accounting Period COGS ({startDate} to {endDate})</span>
            </h3>
            <span className="text-xs text-[#FF9F0A] font-mono">
              {customRangeData.invoiceCount} Invoices Analyzed
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[10px] text-[#8E8E93] block uppercase">Total Period COGS</span>
              <span className="text-xl font-bold text-[#FF9F0A]">
                ₹{Number(customRangeData.totalCogs || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[10px] text-[#8E8E93] block uppercase">Recognized Revenue</span>
              <span className="text-xl font-bold text-white">
                ₹{Number(customRangeData.totalRevenue || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[10px] text-[#8E8E93] block uppercase">Gross Profit</span>
              <span className="text-xl font-bold text-[#30D158]">
                ₹{Number(customRangeData.grossProfit || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[10px] text-[#8E8E93] block uppercase">Gross Margin %</span>
              <span className="text-xl font-bold text-[#2997FF]">
                {customRangeData.grossMarginPercentage}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. 4x Key Performance Indicators (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Current Month COGS */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider">
              {currentMonthData?.monthName || "Current Month"} COGS
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#FF9F0A]/15 flex items-center justify-center text-[#FF9F0A]">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-[#FF9F0A] tracking-tight">
              ₹{Number(currentMonthData?.totalCogs || 0).toLocaleString("en-IN")}
            </span>
            <div className="flex items-center gap-2 mt-1">
              {currentMonthData?.momGrowthRate !== null && currentMonthData?.momGrowthRate !== undefined ? (
                <span
                  className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    currentMonthData.momGrowthRate <= 0
                      ? "bg-[#30D158]/20 text-[#30D158]"
                      : "bg-[#FF453A]/20 text-[#FF453A]"
                  }`}
                >
                  {currentMonthData.momGrowthRate >= 0 ? (
                    <ArrowUpRight className="w-3 h-3 mr-0.5" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 mr-0.5" />
                  )}
                  {Math.abs(currentMonthData.momGrowthRate)}% MoM
                </span>
              ) : (
                <span className="text-[10px] text-[#8E8E93]">First Period</span>
              )}
              <span className="text-[11px] text-[#8E8E93]">
                Cost run rate: ₹{Number(currentMonthData?.dailyRunRate || 0).toLocaleString("en-IN")}/day
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: FY Total COGS (YTD) */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider">
              FY {selectedYear} Total COGS
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#FF9F0A]/15 flex items-center justify-center text-[#FF9F0A]">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-white tracking-tight">
              ₹{Number(data?.yearlyAggregates?.totalCogs || 0).toLocaleString("en-IN")}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-[#8E8E93]">
                {data?.yearlyAggregates?.totalUnitsSold || 0} units sold across {data?.yearlyAggregates?.totalInvoices || 0} invoices
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Gross Profit & Margin */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider">
              Gross Profit (Margin)
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#30D158]/15 flex items-center justify-center text-[#30D158]">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-[#30D158] tracking-tight">
              ₹{Number(data?.yearlyAggregates?.grossProfit || 0).toLocaleString("en-IN")}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#30D158]/20 text-[#30D158]">
                {data?.yearlyAggregates?.grossMarginPercentage || 0}% Gross Margin
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: Average Unit Cost */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider">
              Average Unit Cost
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#2997FF]/15 flex items-center justify-center text-[#2997FF]">
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-[#2997FF] tracking-tight">
              ₹{Number(data?.yearlyAggregates?.averageUnitCost || 0).toLocaleString("en-IN")}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-[#8E8E93]">
                Monthly Avg: ₹{Number(data?.yearlyAggregates?.averageMonthlyCogs || 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. 12-Month COGS Trajectory Bar Chart */}
      <div className="p-5 rounded-2xl bg-[#161617]/80 backdrop-blur-xl border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>12-Month COGS Progression ({selectedYear})</span>
            </h3>
            <p className="text-xs text-[#8E8E93]">
              Acquisition costs of goods sold compared across calendar months
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF9F0A]" />
              <span className="text-[#8E8E93]">COGS (Inventory Cost)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#30D158]" />
              <span className="text-[#8E8E93]">Gross Profit</span>
            </div>
          </div>
        </div>

        {/* Bar Chart Grid */}
        <div className="h-56 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-white/10">
          {months.map((m) => {
            const heightPercent = maxMonthlyCogs > 0 ? ((m.totalCogs || 0) / maxMonthlyCogs) * 100 : 0;
            const isCurrent = m.month === currentMonthNum && selectedYear === CURRENT_YEAR;
            const isPeak = m.month === peakCogsMonth?.month && (m.totalCogs || 0) > 0;

            return (
              <div
                key={m.month}
                onClick={() => handleOpenMonthDetail(m.month)}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                title={`${m.monthName} ${selectedYear}: COGS ₹${Number(m.totalCogs || 0).toLocaleString("en-IN")} (${m.totalUnitsSold || 0} units)`}
              >
                {/* Floating Tooltip on Hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -translate-y-24 bg-black/90 border border-white/20 text-white p-2 rounded-xl text-[10px] pointer-events-none shadow-xl z-20 whitespace-nowrap">
                  <div className="font-bold text-[#FF9F0A]">{m.monthName} {selectedYear}</div>
                  <div>COGS: ₹{Number(m.totalCogs || 0).toLocaleString("en-IN")}</div>
                  <div className="text-white">Revenue: ₹{Number(m.totalRevenue || 0).toLocaleString("en-IN")}</div>
                  <div className="text-[#30D158]">Profit: ₹{Number(m.grossProfit || 0).toLocaleString("en-IN")} ({m.grossMarginPercentage || 0}%)</div>
                  <div className="text-[#8E8E93]">{m.totalUnitsSold || 0} Units Sold • Avg Cost: ₹{Number(m.averageUnitCost || 0).toLocaleString("en-IN")}</div>
                </div>

                {/* Amount on top of bar */}
                <span className="text-[9px] text-[#8E8E93] group-hover:text-white transition-colors mb-1 font-mono truncate max-w-full">
                  {m.totalCogs > 0 ? `₹${(m.totalCogs / 1000).toFixed(0)}k` : "—"}
                </span>

                {/* Bar Column */}
                <div className="w-full max-w-[36px] bg-white/[0.04] rounded-t-lg flex items-end overflow-hidden h-full relative group-hover:bg-white/[0.08] transition-all">
                  <div
                    style={{ height: `${Math.max(heightPercent, m.totalCogs > 0 ? 6 : 0)}%` }}
                    className={`w-full transition-all duration-500 rounded-t-lg ${
                      isCurrent
                        ? "bg-gradient-to-t from-[#D27D00] to-[#FF9F0A] shadow-lg shadow-[#FF9F0A]/20"
                        : isPeak
                        ? "bg-gradient-to-t from-[#B3261E] to-[#FF453A]"
                        : "bg-gradient-to-t from-[#995C00] to-[#FF9F0A]/80 group-hover:to-[#FF9F0A]"
                    }`}
                  />
                </div>

                {/* Month Name */}
                <span
                  className={`text-[10px] mt-2 font-medium transition-colors ${
                    isCurrent ? "text-[#FF9F0A] font-bold" : "text-[#8E8E93] group-hover:text-white"
                  }`}
                >
                  {m.monthName.slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Top Product Cost Drivers & Ranking Table */}
      <div className="rounded-2xl bg-[#161617]/80 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Top Product Cost Drivers & Margins ({selectedYear})</span>
            </h3>
            <p className="text-xs text-[#8E8E93]">
              Breakdown of sold items ranked by COGS acquisition cost and profit generation
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search product or SKU..."
                className="bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-1 text-xs text-white placeholder-[#8E8E93] focus:outline-none w-48"
              />
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-2.5 py-1 text-xs">
              <span className="text-[#8E8E93] text-[10px]">Sort:</span>
              <select
                value={productSortBy}
                onChange={(e) => setProductSortBy(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
              >
                <option value="totalCogs" className="bg-[#1C1C1E] text-white">Highest COGS</option>
                <option value="grossProfit" className="bg-[#1C1C1E] text-white">Highest Gross Profit</option>
                <option value="unitsSold" className="bg-[#1C1C1E] text-white">Most Units Sold</option>
                <option value="grossMarginPercentage" className="bg-[#1C1C1E] text-white">Highest Margin %</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#D2D2D7]">
            <thead className="bg-white/[0.02] border-b border-white/10 text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Product Name & SKU</th>
                <th className="py-3 px-4 text-right">Units Sold</th>
                <th className="py-3 px-4 text-right">Historical Unit Cost</th>
                <th className="py-3 px-4 text-right">Total COGS</th>
                <th className="py-3 px-4 text-right">Total Revenue</th>
                <th className="py-3 px-4 text-right">Gross Profit</th>
                <th className="py-3 px-4 text-right">Margin %</th>
                <th className="py-3 px-4 text-right">Cost Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {allProducts.length > 0 ? (
                allProducts.slice(0, 15).map((p, idx) => (
                  <tr key={p.productId || idx} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-4 font-medium text-white">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center text-[10px] font-bold text-[#8E8E93]">
                          #{idx + 1}
                        </span>
                        <div>
                          <div>{p.name}</div>
                          <span className="text-[10px] text-[#8E8E93] font-mono">{p.sku}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono">
                      {p.unitsSold} {p.unit}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-[#8E8E93]">
                      ₹{Number(p.historicalCostPrice || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-[#FF9F0A]">
                      ₹{Number(p.totalCogs || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-white">
                      ₹{Number(p.totalRevenue || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-[#30D158]">
                      ₹{Number(p.grossProfit || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span
                        className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          p.grossMarginPercentage >= 30
                            ? "bg-[#30D158]/20 text-[#30D158]"
                            : p.grossMarginPercentage >= 15
                            ? "bg-[#FF9F0A]/20 text-[#FF9F0A]"
                            : "bg-[#FF453A]/20 text-[#FF453A]"
                        }`}
                      >
                        {p.grossMarginPercentage}%
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-[#8E8E93]">
                      <div className="flex items-center justify-end gap-2">
                        <span>{p.costSharePercentage}%</span>
                        <div className="w-12 bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, p.costSharePercentage)}%` }}
                            className="bg-[#FF9F0A] h-full"
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#8E8E93]">
                    No sales items recorded for FY {selectedYear}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Consolidated Monthly Statements Table */}
      <div className="rounded-2xl bg-[#161617]/80 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Monthly COGS Statements</h3>
            <p className="text-xs text-[#8E8E93]">
              Calendar-month consolidated raw inventory costs & gross margin reconciliations
            </p>
          </div>
          <span className="text-xs text-[#8E8E93] font-mono">
            {months.filter((m) => m.totalCogs > 0).length} Active Months
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#D2D2D7]">
            <thead className="bg-white/[0.02] border-b border-white/10 text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4 text-right">Units Sold</th>
                <th className="py-3 px-4 text-right">Total COGS</th>
                <th className="py-3 px-4 text-right">Revenue</th>
                <th className="py-3 px-4 text-right">Gross Profit</th>
                <th className="py-3 px-4 text-right">Gross Margin</th>
                <th className="py-3 px-4 text-right">MoM Growth</th>
                <th className="py-3 px-4 text-right">Avg Unit Cost</th>
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
                      isCurrent ? "bg-[#FF9F0A]/5" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4 font-medium text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#FF9F0A]" />
                      <span>{m.monthName}</span>
                      {isCurrent && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#FF9F0A]/20 text-[#FF9F0A] font-semibold">
                          Active
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono">
                      {m.totalUnitsSold || 0}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#FF9F0A]">
                      ₹{Number(m.totalCogs || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-white">
                      ₹{Number(m.totalRevenue || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-[#30D158]">
                      ₹{Number(m.grossProfit || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          m.grossMarginPercentage >= 30
                            ? "bg-[#30D158]/20 text-[#30D158]"
                            : m.grossMarginPercentage >= 15
                            ? "bg-[#FF9F0A]/20 text-[#FF9F0A]"
                            : "bg-[#FF453A]/20 text-[#FF453A]"
                        }`}
                      >
                        {m.grossMarginPercentage || 0}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {m.momGrowthRate !== null && m.momGrowthRate !== undefined ? (
                        <span
                          className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            m.momGrowthRate <= 0
                              ? "bg-[#30D158]/20 text-[#30D158]"
                              : "bg-[#FF453A]/20 text-[#FF453A]"
                          }`}
                        >
                          {m.momGrowthRate >= 0 ? "+" : ""}
                          {m.momGrowthRate}%
                        </span>
                      ) : (
                        <span className="text-[#8E8E93] text-[10px]">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-[#8E8E93]">
                      ₹{Number(m.averageUnitCost || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleOpenMonthDetail(m.month)}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-[11px] font-medium text-[#FF9F0A] hover:text-white transition-all cursor-pointer"
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

      {/* 7. Detailed Inspection Modal (Daily COGS Breakdown & Product Audit) */}
      {selectedMonthDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{selectedMonthDetail.monthName} COGS Statement Audit</span>
                  <span className="text-[10px] bg-[#FF9F0A]/20 text-[#FF9F0A] px-2 py-0.5 rounded-full font-bold">
                    T53 Granular
                  </span>
                </h3>
                <p className="text-xs text-[#8E8E93]">
                  Day-by-day inventory cost of goods sold & line item profit ledger
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
                  <span className="text-[10px] text-[#8E8E93] block uppercase">Month COGS</span>
                  <span className="text-lg font-bold text-[#FF9F0A]">
                    ₹{Number(selectedMonthDetail.totalCogs || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-[10px] text-[#8E8E93] block uppercase">Month Revenue</span>
                  <span className="text-lg font-bold text-white">
                    ₹{Number(selectedMonthDetail.totalRevenue || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-[10px] text-[#8E8E93] block uppercase">Gross Profit</span>
                  <span className="text-lg font-bold text-[#30D158]">
                    ₹{Number(selectedMonthDetail.grossProfit || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-[10px] text-[#8E8E93] block uppercase">Margin %</span>
                  <span className="text-lg font-bold text-[#2997FF]">
                    {selectedMonthDetail.grossMarginPercentage || 0}%
                  </span>
                </div>
              </div>

              {/* Daily COGS Distribution Table */}
              <div>
                <h4 className="text-xs font-bold text-white mb-2">Daily Inventory Cost Ledger</h4>
                <div className="rounded-xl border border-white/10 overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs text-[#D2D2D7]">
                    <thead className="bg-white/[0.04] text-[10px] font-bold text-[#8E8E93] uppercase sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3 text-right">Invoices</th>
                        <th className="py-2 px-3 text-right">Units Sold</th>
                        <th className="py-2 px-3 text-right">COGS</th>
                        <th className="py-2 px-3 text-right">Revenue</th>
                        <th className="py-2 px-3 text-right">Gross Profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {selectedMonthDetail.dailyBreakdown && selectedMonthDetail.dailyBreakdown.length > 0 ? (
                        selectedMonthDetail.dailyBreakdown.map((d) => (
                          <tr key={d.date} className="hover:bg-white/[0.02]">
                            <td className="py-2 px-3 text-white font-sans">{d.date}</td>
                            <td className="py-2 px-3 text-right">{d.invoiceCount}</td>
                            <td className="py-2 px-3 text-right">{d.unitsSold}</td>
                            <td className="py-2 px-3 text-right font-bold text-[#FF9F0A]">
                              ₹{Number(d.cogs || 0).toLocaleString("en-IN")}
                            </td>
                            <td className="py-2 px-3 text-right text-white">
                              ₹{Number(d.revenue || 0).toLocaleString("en-IN")}
                            </td>
                            <td className="py-2 px-3 text-right text-[#30D158]">
                              ₹{Number(d.grossProfit || 0).toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-[#8E8E93] font-sans">
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
