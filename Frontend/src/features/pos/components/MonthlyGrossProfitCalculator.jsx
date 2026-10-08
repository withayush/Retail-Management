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
  Sparkles,
  Activity,
  Flame,
  ShieldAlert,
  Sliders,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getMonthlyGrossProfitOverview,
  recalculateMonthlyGrossProfit,
  getMonthlyGrossProfitDetail,
  getCustomPeriodGrossProfit,
  getVitalHealthCheck,
} from "../../../services/sale.api";

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

export default function MonthlyGrossProfitCalculator() {
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [data, setData] = useState(null);
  const [healthCheck, setHealthCheck] = useState(null);

  // Custom Date Range State
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customRangeData, setCustomRangeData] = useState(null);
  const [customLoading, setCustomLoading] = useState(false);

  // Product Matrix Filter State
  const [matrixFilter, setMatrixFilter] = useState("ALL"); // ALL | STAR_PERFORMER | VOLUME_DRIVER | MARGIN_DRAG | LOSS_MAKING
  const [productSearch, setProductSearch] = useState("");
  const [productSortBy, setProductSortBy] = useState("grossProfit"); // grossProfit | grossMarginPercentage | totalRevenue

  // Inspection Modal State for Daily Statement Audit
  const [selectedMonthDetail, setSelectedMonthDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadData = async (forceRefresh = false) => {
    try {
      if (forceRefresh) setSyncing(true);
      else setLoading(true);

      const [resOverview, resHealth] = await Promise.all([
        getMonthlyGrossProfitOverview({
          year: selectedYear,
          forceRefresh,
        }),
        getVitalHealthCheck({
          year: selectedYear,
        }),
      ]);

      setData(resOverview.data);
      setHealthCheck(resHealth.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load Gross Profit analytics.");
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
      await recalculateMonthlyGrossProfit({ year: selectedYear });
      toast.success(`Consolidated Gross Profit summaries for ${selectedYear} recalculated successfully!`);
      await loadData(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to recalculate Gross Profit summaries.");
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
      const res = await getCustomPeriodGrossProfit({ startDate, endDate });
      setCustomRangeData(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to calculate custom period profit.");
    } finally {
      setCustomLoading(false);
    }
  };

  const handleOpenMonthDetail = async (monthNum) => {
    try {
      setDetailLoading(true);
      const res = await getMonthlyGrossProfitDetail(selectedYear, monthNum);
      setSelectedMonthDetail(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load monthly profit statement.");
    } finally {
      setDetailLoading(false);
    }
  };

  const months = data?.months || [];
  const maxMonthlyRevenue = Math.max(...months.map((m) => m.revenue || 0), 1);
  const currentMonthNum = new Date().getMonth() + 1;
  const currentMonthData = data?.currentMonthSummary || months[currentMonthNum - 1];

  // Peak Profit Month Calculation
  const peakProfitMonth = months.reduce((prev, curr) =>
    (curr.grossProfit || 0) > (prev.grossProfit || 0) ? curr : prev,
    months[0] || {}
  );

  // Aggregate Product List across all months for matrix analysis
  const allProductsMap = new Map();
  months.forEach((m) => {
    (m.productBreakdown || []).forEach((p) => {
      const key = p.productId ? p.productId.toString() : p.name;
      const existing = allProductsMap.get(key) || {
        productId: p.productId,
        name: p.name,
        sku: p.sku,
        unitsSold: 0,
        totalRevenue: 0,
        totalCogs: 0,
        grossProfit: 0,
      };
      existing.unitsSold += p.unitsSold || 0;
      existing.totalRevenue += p.totalRevenue || 0;
      existing.totalCogs += p.totalCogs || 0;
      existing.grossProfit += p.grossProfit || 0;
      allProductsMap.set(key, existing);
    });
  });

  const totalAnnualProfit = data?.yearlyAggregates?.totalGrossProfit || 1;
  let allProducts = Array.from(allProductsMap.values()).map((p) => {
    const rev = Math.round(p.totalRevenue * 100) / 100;
    const cost = Math.round(p.totalCogs * 100) / 100;
    const profit = Math.round((rev - cost) * 100) / 100;
    const margin = rev > 0 ? Math.round(((profit / rev) * 100) * 100) / 100 : 0;
    const contribution =
      totalAnnualProfit > 0
        ? Math.round(((profit / totalAnnualProfit) * 100) * 100) / 100
        : 0;

    let matrixQuadrant = "STAR_PERFORMER";
    if (margin < 0) matrixQuadrant = "LOSS_MAKING";
    else if (margin < 15) matrixQuadrant = "MARGIN_DRAG";
    else if (margin < 30) matrixQuadrant = "VOLUME_DRIVER";

    return {
      ...p,
      totalRevenue: rev,
      totalCogs: cost,
      grossProfit: profit,
      grossMarginPercentage: margin,
      profitContributionPercentage: contribution,
      historicalCostPrice:
        p.unitsSold > 0 ? Math.round((cost / p.unitsSold) * 100) / 100 : 0,
      sellingPrice:
        p.unitsSold > 0 ? Math.round((rev / p.unitsSold) * 100) / 100 : 0,
      matrixQuadrant,
    };
  });

  if (matrixFilter !== "ALL") {
    allProducts = allProducts.filter((p) => p.matrixQuadrant === matrixFilter);
  }

  if (productSearch.trim()) {
    const q = productSearch.toLowerCase().trim();
    allProducts = allProducts.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
  }

  allProducts.sort((a, b) => (b[productSortBy] || 0) - (a[productSortBy] || 0));

  const healthColor =
    data?.yearlyAggregates?.marginHealth === "HEALTHY"
      ? "text-[#30D158] bg-[#30D158]/20 border-[#30D158]/30"
      : data?.yearlyAggregates?.marginHealth === "MODERATE"
      ? "text-[#FF9F0A] bg-[#FF9F0A]/20 border-[#FF9F0A]/30"
      : "text-[#FF453A] bg-[#FF453A]/20 border-[#FF453A]/30";

  return (
    <div className="space-y-6 animate-fade-in text-[#D2D2D7]">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#30D158]/15 border border-[#30D158]/30 flex items-center justify-center text-[#30D158]">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Gross Profit & Margin Analytics Engine
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#30D158]/20 text-[#30D158] border border-[#30D158]/30">
                T54 • Vital Health Check
              </span>
            </div>
            <p className="text-xs text-[#8E8E93]">
              Core retail profitability: Gross Profit = Revenue − COGS, and GP Margin %
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
                title="Recalculate & refresh materialized Gross Profit summaries"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin text-[#30D158]" : ""}`} />
                <span>{syncing ? "Recalculating..." : "Sync Engine"}</span>
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
                className="px-3 py-1.5 rounded-xl bg-[#30D158] hover:bg-[#34C759] text-black text-xs font-bold transition-all cursor-pointer"
              >
                {customLoading ? "Calculating..." : "Compute"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* 2. P&L Financial Chain & Vital Health Diagnostic Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#30D158]/10 via-[#30D158]/5 to-transparent border border-[#30D158]/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#30D158]/20 border border-[#30D158]/30 flex items-center justify-center text-[#30D158] shrink-0 mt-0.5">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Financial Health Check: Complete P&L Profit Chain
              </span>
              <span className={`text-[10px] px-2 py-0.2 rounded font-bold border ${healthColor}`}>
                {data?.yearlyAggregates?.marginHealth || "HEALTHY"}
              </span>
            </div>
            <p className="text-xs text-[#8E8E93] mt-0.5 leading-relaxed">
              <span className="text-white font-medium">Revenue (T52)</span> ₹{Number(data?.yearlyAggregates?.totalRevenue || 0).toLocaleString("en-IN")} − <span className="text-[#FF9F0A] font-medium">COGS (T53)</span> ₹{Number(data?.yearlyAggregates?.totalCogs || 0).toLocaleString("en-IN")} = <span className="text-[#30D158] font-bold">Gross Profit (T54)</span> ₹{Number(data?.yearlyAggregates?.totalGrossProfit || 0).toLocaleString("en-IN")} ({data?.yearlyAggregates?.grossMarginPercentage || 0}% Margin).
            </p>
          </div>
        </div>

        {/* Operating Profit Bridge */}
        <div className="flex items-center gap-4 bg-black/40 px-3.5 py-2 rounded-xl border border-white/10 shrink-0 text-xs">
          <div>
            <span className="text-[10px] text-[#8E8E93] block">OpEx (T51)</span>
            <span className="font-bold text-[#FF9F0A]">
              ₹{Number(data?.yearlyAggregates?.totalOpEx || 0).toLocaleString("en-IN")}
            </span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div>
            <span className="text-[10px] text-[#8E8E93] block">Operating Profit</span>
            <span className={`font-bold ${data?.yearlyAggregates?.operatingProfit >= 0 ? "text-[#30D158]" : "text-[#FF453A]"}`}>
              ₹{Number(data?.yearlyAggregates?.operatingProfit || 0).toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {/* Margin Compression Warning Alert (if detected) */}
      {healthCheck?.isMarginCompressing && (
        <div className="p-3.5 rounded-xl bg-[#FF453A]/10 border border-[#FF453A]/30 flex items-center gap-3 text-xs text-[#FF453A]">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <div>
            <span className="font-bold">Vital Warning: Margin Compression Detected!</span>
            <p className="text-[11px] text-[#FF453A]/80 mt-0.5">
              Gross margin eroded by {Math.abs(healthCheck.marginChangeRate)}% MoM. Review selling prices, supplier cost increases, or excessive checkout discounts.
            </p>
          </div>
        </div>
      )}

      {/* Custom Range KPI View */}
      {isCustomRange && customRangeData && (
        <div className="p-5 rounded-2xl bg-[#161617]/90 border border-[#30D158]/30 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Custom Accounting Period Performance ({startDate} to {endDate})</span>
            </h3>
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${healthColor}`}>
              {customRangeData.marginHealth}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[10px] text-[#8E8E93] block uppercase">Gross Revenue</span>
              <span className="text-xl font-bold text-white">
                ₹{Number(customRangeData.revenue || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[10px] text-[#8E8E93] block uppercase">COGS</span>
              <span className="text-xl font-bold text-[#FF9F0A]">
                ₹{Number(customRangeData.cogs || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[10px] text-[#8E8E93] block uppercase">Gross Profit</span>
              <span className="text-xl font-bold text-[#30D158]">
                ₹{Number(customRangeData.grossProfit || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[10px] text-[#8E8E93] block uppercase">GP Margin %</span>
              <span className="text-xl font-bold text-[#2997FF]">
                {customRangeData.grossMarginPercentage}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. 4x Key Performance Indicators (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Current Month Gross Profit */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider">
              {currentMonthData?.monthName || "Current Month"} Profit
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#30D158]/15 flex items-center justify-center text-[#30D158]">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-[#30D158] tracking-tight">
              ₹{Number(currentMonthData?.grossProfit || 0).toLocaleString("en-IN")}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#30D158]/20 text-[#30D158]">
                {currentMonthData?.grossMarginPercentage || 0}% Margin
              </span>
              {currentMonthData?.momProfitGrowthRate !== null && currentMonthData?.momProfitGrowthRate !== undefined && (
                <span className="text-[11px] text-[#8E8E93]">
                  {currentMonthData.momProfitGrowthRate >= 0 ? "+" : ""}
                  {currentMonthData.momProfitGrowthRate}% MoM
                </span>
              )}
            </div>
          </div>
        </div>

        {/* KPI 2: FY Total Gross Profit (YTD) */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider">
              FY {selectedYear} Gross Profit
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#30D158]/15 flex items-center justify-center text-[#30D158]">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-white tracking-tight">
              ₹{Number(data?.yearlyAggregates?.totalGrossProfit || 0).toLocaleString("en-IN")}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-[#8E8E93]">
                From ₹{Number(data?.yearlyAggregates?.totalRevenue || 0).toLocaleString("en-IN")} Sales
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Gross Profit Margin % */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider">
              Gross Margin (GP %)
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#2997FF]/15 flex items-center justify-center text-[#2997FF]">
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-[#2997FF] tracking-tight">
              {data?.yearlyAggregates?.grossMarginPercentage || 0}%
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold border ${healthColor}`}>
                {data?.yearlyAggregates?.marginHealth || "HEALTHY"}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: Operating Profit (Trading Profit) */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider">
              Operating Profit (Net Trading)
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#BF5AF2]/15 flex items-center justify-center text-[#BF5AF2]">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className={`text-2xl font-bold tracking-tight ${data?.yearlyAggregates?.operatingProfit >= 0 ? "text-[#30D158]" : "text-[#FF453A]"}`}>
              ₹{Number(data?.yearlyAggregates?.operatingProfit || 0).toLocaleString("en-IN")}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-[#8E8E93]">
                {data?.yearlyAggregates?.operatingMarginPercentage || 0}% Operating Margin
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. 12-Month Revenue, COGS & Gross Profit Trajectory Chart */}
      <div className="p-5 rounded-2xl bg-[#161617]/80 backdrop-blur-xl border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>12-Month Profitability Trajectory ({selectedYear})</span>
            </h3>
            <p className="text-xs text-[#8E8E93]">
              Side-by-side Revenue (T52), COGS (T53), and Gross Profit (T54)
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#2997FF]" />
              <span className="text-[#8E8E93]">Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF9F0A]" />
              <span className="text-[#8E8E93]">COGS</span>
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
            const heightPercent = maxMonthlyRevenue > 0 ? ((m.revenue || 0) / maxMonthlyRevenue) * 100 : 0;
            const cogsPercent = maxMonthlyRevenue > 0 ? ((m.cogs || 0) / maxMonthlyRevenue) * 100 : 0;
            const profitPercent = maxMonthlyRevenue > 0 ? ((m.grossProfit || 0) / maxMonthlyRevenue) * 100 : 0;
            const isCurrent = m.month === currentMonthNum && selectedYear === CURRENT_YEAR;
            const isPeak = m.month === peakProfitMonth?.month && (m.grossProfit || 0) > 0;

            return (
              <div
                key={m.month}
                onClick={() => handleOpenMonthDetail(m.month)}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                title={`${m.monthName} ${selectedYear}: Gross Profit ₹${Number(m.grossProfit || 0).toLocaleString("en-IN")} (${m.grossMarginPercentage || 0}%)`}
              >
                {/* Floating Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -translate-y-28 bg-black/95 border border-white/20 text-white p-2.5 rounded-xl text-[10px] pointer-events-none shadow-xl z-20 whitespace-nowrap">
                  <div className="font-bold text-[#30D158]">{m.monthName} {selectedYear}</div>
                  <div className="text-white">Revenue: ₹{Number(m.revenue || 0).toLocaleString("en-IN")}</div>
                  <div className="text-[#FF9F0A]">COGS: ₹{Number(m.cogs || 0).toLocaleString("en-IN")}</div>
                  <div className="text-[#30D158] font-bold">Gross Profit: ₹{Number(m.grossProfit || 0).toLocaleString("en-IN")} ({m.grossMarginPercentage || 0}%)</div>
                  <div className="text-[#BF5AF2]">Operating Profit: ₹{Number(m.operatingProfit || 0).toLocaleString("en-IN")}</div>
                </div>

                {/* Amount on top of bar */}
                <span className="text-[9px] text-[#30D158] group-hover:text-white transition-colors mb-1 font-mono truncate max-w-full font-bold">
                  {m.grossProfit > 0 ? `₹${(m.grossProfit / 1000).toFixed(0)}k` : "—"}
                </span>

                {/* Combined Tri-Color Bars Container */}
                <div className="w-full max-w-[36px] bg-white/[0.04] rounded-t-lg flex items-end overflow-hidden h-full relative group-hover:bg-white/[0.08] transition-all justify-center gap-0.5 px-0.5">
                  {/* COGS Column */}
                  <div
                    style={{ height: `${Math.max(cogsPercent, m.cogs > 0 ? 4 : 0)}%` }}
                    className="w-1/2 bg-[#FF9F0A]/80 rounded-t-sm"
                  />
                  {/* Gross Profit Column */}
                  <div
                    style={{ height: `${Math.max(profitPercent, m.grossProfit > 0 ? 4 : 0)}%` }}
                    className={`w-1/2 rounded-t-sm ${
                      isCurrent
                        ? "bg-[#30D158] shadow-md shadow-[#30D158]/30"
                        : isPeak
                        ? "bg-gradient-to-t from-[#208B3A] to-[#30D158]"
                        : "bg-[#30D158]/80 group-hover:bg-[#30D158]"
                    }`}
                  />
                </div>

                {/* Month Name */}
                <span
                  className={`text-[10px] mt-2 font-medium transition-colors ${
                    isCurrent ? "text-[#30D158] font-bold" : "text-[#8E8E93] group-hover:text-white"
                  }`}
                >
                  {m.monthName.slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Product Profitability Matrix & Strategic Classification Table */}
      <div className="rounded-2xl bg-[#161617]/80 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Product Profitability Matrix ({selectedYear})</span>
            </h3>
            <p className="text-xs text-[#8E8E93]">
              Classify catalog products by profit yield and margin strength
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quadrant Filter Pills */}
            <div className="flex items-center p-0.5 bg-black/40 border border-white/10 rounded-xl text-xs">
              <button
                onClick={() => setMatrixFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  matrixFilter === "ALL" ? "bg-white/10 text-white font-bold" : "text-[#8E8E93] hover:text-white"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setMatrixFilter("STAR_PERFORMER")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  matrixFilter === "STAR_PERFORMER" ? "bg-[#30D158]/20 text-[#30D158] font-bold" : "text-[#8E8E93] hover:text-white"
                }`}
              >
                ⭐ Stars (&gt;30%)
              </button>
              <button
                onClick={() => setMatrixFilter("VOLUME_DRIVER")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  matrixFilter === "VOLUME_DRIVER" ? "bg-[#2997FF]/20 text-[#2997FF] font-bold" : "text-[#8E8E93] hover:text-white"
                }`}
              >
                ⚡ Volume (15-30%)
              </button>
              <button
                onClick={() => setMatrixFilter("MARGIN_DRAG")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  matrixFilter === "MARGIN_DRAG" ? "bg-[#FF9F0A]/20 text-[#FF9F0A] font-bold" : "text-[#8E8E93] hover:text-white"
                }`}
              >
                ⚠️ Drag (&lt;15%)
              </button>
              <button
                onClick={() => setMatrixFilter("LOSS_MAKING")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  matrixFilter === "LOSS_MAKING" ? "bg-[#FF453A]/20 text-[#FF453A] font-bold" : "text-[#8E8E93] hover:text-white"
                }`}
              >
                🛑 Loss (&lt;0%)
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search..."
                className="bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-1 text-xs text-white placeholder-[#8E8E93] focus:outline-none w-36"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#D2D2D7]">
            <thead className="bg-white/[0.02] border-b border-white/10 text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Product Name & SKU</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4 text-right">Units Sold</th>
                <th className="py-3 px-4 text-right">Cost Price</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-right">Gross Profit</th>
                <th className="py-3 px-4 text-right">GP Margin %</th>
                <th className="py-3 px-4 text-right">Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {allProducts.length > 0 ? (
                allProducts.slice(0, 15).map((p, idx) => (
                  <tr key={p.productId || idx} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-4 font-medium text-white">
                      <div>
                        <div>{p.name}</div>
                        <span className="text-[10px] text-[#8E8E93] font-mono">{p.sku}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          p.matrixQuadrant === "STAR_PERFORMER"
                            ? "bg-[#30D158]/20 text-[#30D158] border border-[#30D158]/30"
                            : p.matrixQuadrant === "VOLUME_DRIVER"
                            ? "bg-[#2997FF]/20 text-[#2997FF] border border-[#2997FF]/30"
                            : p.matrixQuadrant === "MARGIN_DRAG"
                            ? "bg-[#FF9F0A]/20 text-[#FF9F0A] border border-[#FF9F0A]/30"
                            : "bg-[#FF453A]/20 text-[#FF453A] border border-[#FF453A]/30"
                        }`}
                      >
                        {p.matrixQuadrant === "STAR_PERFORMER"
                          ? "⭐ Star Performer"
                          : p.matrixQuadrant === "VOLUME_DRIVER"
                          ? "⚡ Volume Driver"
                          : p.matrixQuadrant === "MARGIN_DRAG"
                          ? "⚠️ Margin Drag"
                          : "🛑 Loss Making"}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono">
                      {p.unitsSold}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-[#8E8E93]">
                      ₹{Number(p.historicalCostPrice || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-white">
                      ₹{Number(p.sellingPrice || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-[#30D158]">
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
                        <span>{p.profitContributionPercentage}%</span>
                        <div className="w-12 bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, Math.max(0, p.profitContributionPercentage))}%` }}
                            className="bg-[#30D158] h-full"
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#8E8E93]">
                    No items match the selected filter.
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
            <h3 className="text-sm font-bold text-white">Monthly Gross Profit Statements</h3>
            <p className="text-xs text-[#8E8E93]">
              Consolidated revenue, COGS, gross margin %, and operating profit reconciliations
            </p>
          </div>
          <span className="text-xs text-[#8E8E93] font-mono">
            {months.filter((m) => (m.revenue || 0) > 0).length} Active Months
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#D2D2D7]">
            <thead className="bg-white/[0.02] border-b border-white/10 text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4 text-right">Revenue</th>
                <th className="py-3 px-4 text-right">COGS</th>
                <th className="py-3 px-4 text-right">Gross Profit</th>
                <th className="py-3 px-4 text-right">GP Margin %</th>
                <th className="py-3 px-4 text-right">OpEx</th>
                <th className="py-3 px-4 text-right">Operating Profit</th>
                <th className="py-3 px-4 text-right">MoM Growth</th>
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
                      isCurrent ? "bg-[#30D158]/5" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4 font-medium text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#30D158]" />
                      <span>{m.monthName}</span>
                      {isCurrent && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#30D158]/20 text-[#30D158] font-semibold">
                          Active
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-white">
                      ₹{Number(m.revenue || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-[#FF9F0A]">
                      ₹{Number(m.cogs || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#30D158]">
                      ₹{Number(m.grossProfit || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold">
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

                    <td className="py-3.5 px-4 text-right font-mono text-[#FF9F0A]">
                      ₹{Number(m.opEx || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                      ₹{Number(m.operatingProfit || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {m.momProfitGrowthRate !== null && m.momProfitGrowthRate !== undefined ? (
                        <span
                          className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            m.momProfitGrowthRate >= 0
                              ? "bg-[#30D158]/20 text-[#30D158]"
                              : "bg-[#FF453A]/20 text-[#FF453A]"
                          }`}
                        >
                          {m.momProfitGrowthRate >= 0 ? "+" : ""}
                          {m.momProfitGrowthRate}%
                        </span>
                      ) : (
                        <span className="text-[#8E8E93] text-[10px]">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleOpenMonthDetail(m.month)}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-[11px] font-medium text-[#30D158] hover:text-white transition-all cursor-pointer"
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

      {/* 7. Granular Statement Audit Modal */}
      {selectedMonthDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{selectedMonthDetail.monthName} Profit Statement Audit</span>
                  <span className="text-[10px] bg-[#30D158]/20 text-[#30D158] px-2 py-0.5 rounded-full font-bold">
                    T54 Granular
                  </span>
                </h3>
                <p className="text-xs text-[#8E8E93]">
                  Day-by-day gross profit and gross margin reconciliation
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
                  <span className="text-[10px] text-[#8E8E93] block uppercase">Revenue</span>
                  <span className="text-lg font-bold text-white">
                    ₹{Number(selectedMonthDetail.revenue || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-[10px] text-[#8E8E93] block uppercase">COGS</span>
                  <span className="text-lg font-bold text-[#FF9F0A]">
                    ₹{Number(selectedMonthDetail.cogs || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-[10px] text-[#8E8E93] block uppercase">Gross Profit</span>
                  <span className="text-lg font-bold text-[#30D158]">
                    ₹{Number(selectedMonthDetail.grossProfit || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-[10px] text-[#8E8E93] block uppercase">GP Margin %</span>
                  <span className="text-lg font-bold text-[#2997FF]">
                    {selectedMonthDetail.grossMarginPercentage || 0}%
                  </span>
                </div>
              </div>

              {/* Daily Ledger Table */}
              <div>
                <h4 className="text-xs font-bold text-white mb-2">Daily Profit Reconciliation</h4>
                <div className="rounded-xl border border-white/10 overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs text-[#D2D2D7]">
                    <thead className="bg-white/[0.04] text-[10px] font-bold text-[#8E8E93] uppercase sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3 text-right">Invoices</th>
                        <th className="py-2 px-3 text-right">Revenue</th>
                        <th className="py-2 px-3 text-right">COGS</th>
                        <th className="py-2 px-3 text-right">Gross Profit</th>
                        <th className="py-2 px-3 text-right">Margin %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {selectedMonthDetail.dailyBreakdown && selectedMonthDetail.dailyBreakdown.length > 0 ? (
                        selectedMonthDetail.dailyBreakdown.map((d) => (
                          <tr key={d.date} className="hover:bg-white/[0.02]">
                            <td className="py-2 px-3 text-white font-sans">{d.date}</td>
                            <td className="py-2 px-3 text-right">{d.invoiceCount}</td>
                            <td className="py-2 px-3 text-right text-white">
                              ₹{Number(d.revenue || 0).toLocaleString("en-IN")}
                            </td>
                            <td className="py-2 px-3 text-right text-[#FF9F0A]">
                              ₹{Number(d.cogs || 0).toLocaleString("en-IN")}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-[#30D158]">
                              ₹{Number(d.grossProfit || 0).toLocaleString("en-IN")}
                            </td>
                            <td className="py-2 px-3 text-right text-[#2997FF]">
                              {d.grossMarginPercentage || 0}%
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
