import React, { useState, useEffect } from "react";
import {
  Calendar,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  BarChart3,
  Flame,
  Layers,
  Wallet,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Clock,
  PieChart,
  Tag,
  Sliders,
  X,
  Search,
  FileText,
  ChevronRight,
  ShieldCheck,
  Building2,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getPeriodOpExAnalytics,
  getMonthlyOpExFinancialOverview,
  getQuarterlyOpExAggregations,
} from "../../../services/sale.api";

export default function MonthlyOpExAggregations() {
  const currentYear = new Date().getUTCFullYear();
  const currentMonth = new Date().getUTCMonth() + 1;

  // Selected period preset: "THIS_MONTH" | "LAST_MONTH" | "Q1" | "Q2" | "Q3" | "Q4" | "YTD" | "CUSTOM"
  const [periodPreset, setPeriodPreset] = useState("THIS_MONTH");
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [customFrom, setCustomFrom] = useState(
    `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`
  );
  const [customTo, setCustomTo] = useState(
    new Date().toISOString().slice(0, 10)
  );

  // Data states
  const [loading, setLoading] = useState(true);
  const [periodData, setPeriodData] = useState(null);
  const [overview12M, setOverview12M] = useState(null);
  const [quarterlyData, setQuarterlyData] = useState(null);
  const [categorySearch, setCategorySearch] = useState("");
  const [activeViewMode, setActiveViewMode] = useState("STATEMENT"); // "STATEMENT" | "CHART_12M" | "QUARTERS"

  // Fetch OpEx Analytics according to active period selection
  const fetchOpExAnalytics = async () => {
    setLoading(true);
    try {
      let params = {};

      if (periodPreset === "THIS_MONTH") {
        params = { year: selectedYear, month: currentMonth };
      } else if (periodPreset === "LAST_MONTH") {
        const lastM = currentMonth === 1 ? 12 : currentMonth - 1;
        const lastY = currentMonth === 1 ? selectedYear - 1 : selectedYear;
        params = { year: lastY, month: lastM };
      } else if (periodPreset === "Q1") {
        params = { year: selectedYear, quarter: 1 };
      } else if (periodPreset === "Q2") {
        params = { year: selectedYear, quarter: 2 };
      } else if (periodPreset === "Q3") {
        params = { year: selectedYear, quarter: 3 };
      } else if (periodPreset === "Q4") {
        params = { year: selectedYear, quarter: 4 };
      } else if (periodPreset === "YTD") {
        params = { year: selectedYear, periodType: "YTD" };
      } else if (periodPreset === "CUSTOM") {
        params = { from: customFrom, to: customTo };
      }

      const [pRes, oRes, qRes] = await Promise.all([
        getPeriodOpExAnalytics(params),
        getMonthlyOpExFinancialOverview({ year: selectedYear }),
        getQuarterlyOpExAggregations({ year: selectedYear }),
      ]);

      setPeriodData(pRes.data || pRes);
      setOverview12M(oRes.data || oRes);
      setQuarterlyData(qRes.data || qRes);
    } catch (err) {
      console.error("Failed to load OpEx analytics:", err);
      toast.error(err?.response?.data?.message || "Failed to load operating expense analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpExAnalytics();
  }, [periodPreset, selectedYear]);

  const handleApplyCustomDates = (e) => {
    e.preventDefault();
    if (!customFrom || !customTo) {
      toast.error("Please select both start and end dates.");
      return;
    }
    if (new Date(customFrom) > new Date(customTo)) {
      toast.error("Start date cannot be after end date.");
      return;
    }
    setPeriodPreset("CUSTOM");
    fetchOpExAnalytics();
  };

  const totals = periodData || {};
  const cashBurn = totals.cashBurn || {};
  const costStructure = totals.costStructure || {};
  const bridge = totals.financialBridge || {};
  const periodMeta = totals.period || {};

  const filteredCategories = (totals.categories || []).filter((c) =>
    (c.categoryName || "").toLowerCase().includes(categorySearch.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in text-[#F5F5F7]">
      {/* Top Header & Range Filter Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#1C1C1E]/90 via-[#2C2C2E]/60 to-[#1C1C1E]/90 border border-white/10 shadow-xl backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#FF453A]/10 border border-[#FF453A]/30 text-[#FF453A]">
              <Flame className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Operating Expense Aggregations & Cash Burn
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FF453A]/20 text-[#FF453A] border border-[#FF453A]/30">
                Phase 9 • T55
              </span>
            </h2>
          </div>
          <p className="text-xs text-[#8E8E93] max-w-2xl">
            Consolidates all operating expenditures over active financial ranges. Computes daily cash burns,
            fixed overhead vs variable cost ratios, and bridges into operating profitability.
          </p>
        </div>

        {/* Period Selector Chips */}
        <div className="flex flex-wrap items-center gap-1.5 bg-black/40 p-1.5 rounded-xl border border-white/10">
          {[
            { id: "THIS_MONTH", label: "This Month" },
            { id: "LAST_MONTH", label: "Last Month" },
            { id: "Q1", label: "Q1" },
            { id: "Q2", label: "Q2" },
            { id: "Q3", label: "Q3" },
            { id: "Q4", label: "Q4" },
            { id: "YTD", label: "Full Year YTD" },
            { id: "CUSTOM", label: "Custom Range" },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => setPeriodPreset(chip.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                periodPreset === chip.id
                  ? "bg-[#FF453A] text-white shadow-md shadow-[#FF453A]/20"
                  : "text-[#8E8E93] hover:text-white hover:bg-white/5"
              }`}
            >
              {chip.label}
            </button>
          ))}

          <button
            onClick={fetchOpExAnalytics}
            disabled={loading}
            className="p-1.5 rounded-lg text-[#8E8E93] hover:text-white hover:bg-white/10 transition-all cursor-pointer disabled:opacity-50 ml-1"
            title="Refresh OpEx Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker Deck (Visible when CUSTOM is selected) */}
      {periodPreset === "CUSTOM" && (
        <form
          onSubmit={handleApplyCustomDates}
          className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-wrap items-center gap-4 animate-fade-in"
        >
          <div className="flex items-center gap-2 text-xs font-medium text-[#8E8E93]">
            <Calendar className="w-4 h-4 text-[#FF453A]" />
            <span>Accounting Range:</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[11px] text-[#8E8E93]">From</label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/15 text-xs text-white focus:outline-none focus:border-[#FF453A]"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[11px] text-[#8E8E93]">To</label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/15 text-xs text-white focus:outline-none focus:border-[#FF453A]"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-[#FF453A] hover:bg-[#FF453A]/90 text-xs font-semibold text-white shadow-md transition-all cursor-pointer"
          >
            Apply Range
          </button>
        </form>
      )}

      {/* 4x Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Operating Expense */}
        <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8E8E93]">Total OpEx (Overheads)</span>
            <span className="p-2 rounded-xl bg-[#FF453A]/10 text-[#FF453A]">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-white">
              ₹{(totals.totalOperatingExpense || 0).toLocaleString()}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-[#8E8E93]">
              <span className="text-white font-medium">{totals.expenseCount || 0}</span> vouchers
              <span>•</span>
              <span>Avg ₹{(totals.averageExpense || 0).toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-[#8E8E93]">
            <span>Period:</span>
            <span className="text-[#FF9F0A] font-semibold">{periodMeta.periodLabel || "Active"}</span>
          </div>
        </div>

        {/* KPI 2: Daily Cash Burn Rate */}
        <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8E8E93]">Daily Cash Burn Rate</span>
            <span className="p-2 rounded-xl bg-[#FF9F0A]/10 text-[#FF9F0A]">
              <Flame className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-[#FF9F0A]">
              ₹{(cashBurn.dailyBurnRate || 0).toLocaleString()}
              <span className="text-xs font-normal text-[#8E8E93]"> /day</span>
            </div>
            <div className="mt-1 text-xs text-[#8E8E93]">
              Run-Rate: <span className="text-white font-medium">₹{(cashBurn.annualizedRunRate || 0).toLocaleString()}</span> /yr
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-[#8E8E93]">
            <span>Active Outflow Days:</span>
            <span className="text-white font-medium">
              {periodMeta.activeExpenseDays || 0} / {periodMeta.daysInPeriod || 1} days
            </span>
          </div>
        </div>

        {/* KPI 3: Operating Profit Bridge */}
        <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8E8E93]">Operating Profit Bridge</span>
            <span
              className={`p-2 rounded-xl ${
                bridge.operatingProfit >= 0
                  ? "bg-[#30D158]/10 text-[#30D158]"
                  : "bg-[#FF453A]/10 text-[#FF453A]"
              }`}
            >
              {bridge.operatingProfit >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
            </span>
          </div>
          <div className="mt-4">
            <div
              className={`text-2xl font-bold tracking-tight ${
                bridge.operatingProfit >= 0 ? "text-[#30D158]" : "text-[#FF453A]"
              }`}
            >
              ₹{(bridge.operatingProfit || 0).toLocaleString()}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-[#8E8E93]">
              <span>Margin:</span>
              <span
                className={`font-semibold ${
                  bridge.operatingProfit >= 0 ? "text-[#30D158]" : "text-[#FF453A]"
                }`}
              >
                {bridge.operatingMarginPercentage || 0}%
              </span>
              <span>•</span>
              <span>GP Coverage: {bridge.coverageRatio || 0}x</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
            <span className="text-[#8E8E93]">Status:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${
                bridge.profitabilityStatus === "PROFITABLE"
                  ? "bg-[#30D158]/20 text-[#30D158] border border-[#30D158]/30"
                  : bridge.profitabilityStatus === "BREAK_EVEN"
                  ? "bg-[#FF9F0A]/20 text-[#FF9F0A] border border-[#FF9F0A]/30"
                  : "bg-[#FF453A]/20 text-[#FF453A] border border-[#FF453A]/30"
              }`}
            >
              {bridge.profitabilityStatus || "PENDING"}
            </span>
          </div>
        </div>

        {/* KPI 4: OpEx Burden on Sales */}
        <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8E8E93]">OpEx Burden on Sales</span>
            <span className="p-2 rounded-xl bg-[#2997FF]/10 text-[#2997FF]">
              <PieChart className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-[#2997FF]">
              {bridge.opexToRevenueRatio || 0}%
              <span className="text-xs font-normal text-[#8E8E93]"> of Revenue</span>
            </div>
            <div className="mt-1 text-xs text-[#8E8E93]">
              Fixed: <span className="text-white font-medium">{costStructure.fixedPercentage || 0}%</span> • Variable:{" "}
              <span className="text-white font-medium">{costStructure.variablePercentage || 0}%</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-[#8E8E93]">
            <span>Recognized Sales:</span>
            <span className="text-white font-semibold">₹{(bridge.revenue || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* P&L Financial Chain & Peak Burn Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-black/60 via-white/[0.03] to-black/60 border border-white/10 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold tracking-wider uppercase text-[#8E8E93] flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#FF9F0A]" />
              Full P&L Financial Chain Synthesis (T52 ➔ T53 ➔ T54 ➔ T55)
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm font-semibold">
              <span className="text-[#2997FF]">Revenue: ₹{(bridge.revenue || 0).toLocaleString()}</span>
              <span className="text-[#8E8E93]">−</span>
              <span className="text-[#FF9F0A]">COGS: ₹{(bridge.cogs || 0).toLocaleString()}</span>
              <span className="text-[#8E8E93]">=</span>
              <span className="text-[#30D158]">Gross Profit: ₹{(bridge.grossProfit || 0).toLocaleString()}</span>
              <span className="text-[#8E8E93]">−</span>
              <span className="text-[#FF453A]">OpEx: ₹{(totals.totalOperatingExpense || 0).toLocaleString()}</span>
              <span className="text-[#8E8E93]">=</span>
              <span
                className={`px-2 py-0.5 rounded-lg border ${
                  bridge.operatingProfit >= 0
                    ? "bg-[#30D158]/10 text-[#30D158] border-[#30D158]/30"
                    : "bg-[#FF453A]/10 text-[#FF453A] border-[#FF453A]/30"
                }`}
              >
                Operating Profit: ₹{(bridge.operatingProfit || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Peak Outflow Callout */}
          {cashBurn.peakBurnDay && (
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[#FF453A]/10 border border-[#FF453A]/20">
              <span className="p-1.5 rounded-lg bg-[#FF453A]/20 text-[#FF453A]">
                <Activity className="w-4 h-4" />
              </span>
              <div className="text-xs">
                <div className="text-[#8E8E93]">Peak Burn Day</div>
                <div className="font-bold text-white">
                  ₹{(cashBurn.peakBurnDay.amount || 0).toLocaleString()} on {cashBurn.peakBurnDay.date}
                </div>
                <div className="text-[10px] text-[#FF453A]">
                  Primary: {cashBurn.peakBurnDay.topCategory}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cost Structure Ratio Bar: Fixed vs Variable */}
        <div className="pt-2 border-t border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#8E8E93]">
            <span className="flex items-center gap-1.5 text-white font-medium">
              <Building2 className="w-3.5 h-3.5 text-[#5856D6]" />
              Fixed Overheads: ₹{(costStructure.fixedOpEx || 0).toLocaleString()} ({costStructure.fixedPercentage || 0}%)
            </span>
            <span className="flex items-center gap-1.5 text-white font-medium">
              <Zap className="w-3.5 h-3.5 text-[#FF9500]" />
              Variable Operations: ₹{(costStructure.variableOpEx || 0).toLocaleString()} ({costStructure.variablePercentage || 0}%)
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-black/40 border border-white/10 overflow-hidden flex">
            <div
              style={{ width: `${costStructure.fixedPercentage || 50}%` }}
              className="h-full bg-gradient-to-r from-[#5856D6] to-[#007AFF] transition-all duration-500"
              title={`Fixed: ₹${costStructure.fixedOpEx}`}
            />
            <div
              style={{ width: `${costStructure.variablePercentage || 50}%` }}
              className="h-full bg-gradient-to-r from-[#FF9500] to-[#FF453A] transition-all duration-500"
              title={`Variable: ₹${costStructure.variableOpEx}`}
            />
          </div>
        </div>
      </div>

      {/* View Switcher: Statement / 12-Month Progression / Quarters */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveViewMode("STATEMENT")}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeViewMode === "STATEMENT"
                ? "bg-white/[0.08] text-white border border-white/20 shadow-md"
                : "text-[#8E8E93] hover:text-white"
            }`}
          >
            Cost Breakdown & Ledger
          </button>
          <button
            onClick={() => setActiveViewMode("CHART_12M")}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeViewMode === "CHART_12M"
                ? "bg-white/[0.08] text-white border border-white/20 shadow-md"
                : "text-[#8E8E93] hover:text-white"
            }`}
          >
            12-Month OpEx vs Profit Trend
          </button>
          <button
            onClick={() => setActiveViewMode("QUARTERS")}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeViewMode === "QUARTERS"
                ? "bg-white/[0.08] text-white border border-white/20 shadow-md"
                : "text-[#8E8E93] hover:text-white"
            }`}
          >
            Quarterly Breakdowns (Q1-Q4)
          </button>
        </div>

        <div className="text-xs text-[#8E8E93]">
          Year: <span className="text-white font-semibold">{selectedYear}</span>
        </div>
      </div>

      {/* VIEW 1: STATEMENT & CATEGORY LEDGER */}
      {activeViewMode === "STATEMENT" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Category Distribution Breakdown (Left 2 cols) */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#FF453A]" />
                  Operating Expenditure Categories ({filteredCategories.length})
                </h3>
                <p className="text-xs text-[#8E8E93]">
                  Ranked by expenditure amount and operational overhead share.
                </p>
              </div>

              {/* Search Category */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8E8E93]" />
                <input
                  type="text"
                  placeholder="Filter category..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[#FF453A]"
                />
              </div>
            </div>

            {filteredCategories.length === 0 ? (
              <div className="py-12 text-center text-[#8E8E93] text-xs">
                No expense categories recorded for this period.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCategories.map((cat, idx) => (
                  <div
                    key={cat.categoryId || idx}
                    className="p-3.5 rounded-xl bg-black/30 border border-white/5 hover:border-white/15 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.categoryColor || "#8E8E93" }}
                        />
                        <span className="text-xs font-semibold text-white">{cat.categoryName}</span>
                        <span
                          className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                            cat.classification === "FIXED_OVERHEAD"
                              ? "bg-[#5856D6]/20 text-[#5856D6] border border-[#5856D6]/30"
                              : "bg-[#FF9500]/20 text-[#FF9500] border border-[#FF9500]/30"
                          }`}
                        >
                          {cat.classification === "FIXED_OVERHEAD" ? "Fixed" : "Variable"}
                        </span>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-bold text-white">
                          ₹{(cat.amount || 0).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-[#8E8E93]">{cat.percentage}% of OpEx</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, cat.percentage || 0)}%`,
                          backgroundColor: cat.categoryColor || "#FF453A",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Daily Cash Burn Ledger (Right 1 col) */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#FF9F0A]" />
                Daily Cash Burn Flow ({totals.dailyBurnLedger?.length || 0} Days)
              </h3>
              <p className="text-xs text-[#8E8E93]">Chronological outflow audit timeline.</p>
            </div>

            {(!totals.dailyBurnLedger || totals.dailyBurnLedger.length === 0) ? (
              <div className="py-12 text-center text-[#8E8E93] text-xs">
                Zero outflow days recorded in selected range.
              </div>
            ) : (
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {totals.dailyBurnLedger.map((day, idx) => (
                  <div
                    key={day.date || idx}
                    className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between text-xs hover:border-white/15 transition-all"
                  >
                    <div>
                      <div className="font-semibold text-white">{day.date}</div>
                      <div className="text-[10px] text-[#8E8E93]">
                        {day.topCategory} • {day.count} bill(s)
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-[#FF453A]">
                        ₹{(day.amount || 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-[#8E8E93]">
                        {day.shareOfPeriodBurn}% share
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: 12-MONTH OPEX VS OPERATING PROFIT TREND */}
      {activeViewMode === "CHART_12M" && (
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-6 animate-fade-in">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#2997FF]" />
              12-Month Financial Timeline & Cash Burn Trajectory ({selectedYear})
            </h3>
            <p className="text-xs text-[#8E8E93]">
              Side-by-side progression of recognized Revenue, Gross Profit, OpEx, and Operating Profit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(overview12M?.months || []).map((m) => (
              <div
                key={m.month}
                className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3 hover:border-white/20 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{m.monthName}</span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      m.totalOperatingExpense > 0
                        ? "bg-[#FF453A]/20 text-[#FF453A]"
                        : "bg-white/5 text-[#8E8E93]"
                    }`}
                  >
                    {m.totalOperatingExpense > 0 ? "Active" : "No Spend"}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#8E8E93]">OpEx:</span>
                    <span className="font-bold text-[#FF453A]">
                      ₹{(m.totalOperatingExpense || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[#8E8E93]">Gross Profit:</span>
                    <span className="font-semibold text-[#30D158]">
                      ₹{(m.financialBridge?.grossProfit || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between pt-1 border-t border-white/5">
                    <span className="text-[#8E8E93]">Operating Profit:</span>
                    <span
                      className={`font-bold ${
                        (m.financialBridge?.operatingProfit || 0) >= 0
                          ? "text-[#30D158]"
                          : "text-[#FF453A]"
                      }`}
                    >
                      ₹{(m.financialBridge?.operatingProfit || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between text-[11px] text-[#8E8E93]">
                    <span>Daily Burn:</span>
                    <span>₹{(m.dailyBurnRate || 0).toLocaleString()}/day</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: QUARTERLY BREAKDOWNS (Q1 - Q4) */}
      {activeViewMode === "QUARTERS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
          {(quarterlyData?.quarters || []).map((q) => (
            <div
              key={q.quarter}
              className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4 hover:border-white/20 transition-all flex flex-col justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-white">{q.quarterLabel}</span>
                  <span className="text-[10px] font-semibold text-[#8E8E93]">
                    {q.from} to {q.to}
                  </span>
                </div>
                <div className="text-2xl font-bold text-[#FF453A] mt-2">
                  ₹{(q.totalOperatingExpense || 0).toLocaleString()}
                </div>
                <div className="text-xs text-[#8E8E93]">
                  {q.expenseCount || 0} vouchers • ₹{(q.dailyBurnRate || 0).toLocaleString()}/day
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8E8E93]">Operating Profit:</span>
                  <span
                    className={`font-bold ${
                      (q.financialBridge?.operatingProfit || 0) >= 0
                        ? "text-[#30D158]"
                        : "text-[#FF453A]"
                    }`}
                  >
                    ₹{(q.financialBridge?.operatingProfit || 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#8E8E93]">Fixed vs Variable:</span>
                  <span className="text-white">
                    {q.costStructure?.fixedPercentage || 0}% / {q.costStructure?.variablePercentage || 0}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
