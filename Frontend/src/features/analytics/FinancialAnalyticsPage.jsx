import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  RefreshCw,
  Calendar,
  Layers,
  ShieldCheck,
  FileSpreadsheet,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  getPeriodNetProfit,
  getMonthlyNetProfitOverview,
  getQuarterlyNetProfit,
  getDailyNetProfitLedger,
  recalculateMonthlyNetProfit,
  getReceivablesIndex,
  getPayablesIndex,
} from "../../services/analytics.api";

import NetProfitHeroCards from "./components/NetProfitHeroCards";
import ProfitWaterfallBar from "./components/ProfitWaterfallBar";
import FiscalYearChart from "./components/FiscalYearChart";
import QuarterlyProfitCards from "./components/QuarterlyProfitCards";
import DailyProfitLedgerTable from "./components/DailyProfitLedgerTable";
import ProductProfitMatrix from "./components/ProductProfitMatrix";
import ReceivablesConsolidatedCard from "./components/ReceivablesConsolidatedCard";
import PayablesConsolidatedCard from "./components/PayablesConsolidatedCard";

/**
 * FinancialAnalyticsPage - Phase 9 (Task T56: Net Profit & T58: Payables Consolidated Index)
 * Executive P&L Bottom-Line Command Center
 * Net Profit = Gross Profit - Operating Expenses
 */
export default function FinancialAnalyticsPage() {
  const [periodPreset, setPeriodPreset] = useState("THIS_MONTH"); // THIS_MONTH | LAST_MONTH | THIS_QUARTER | YTD | CUSTOM
  const [customRange, setCustomRange] = useState({
    from: "",
    to: "",
  });

  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [activeModuleTab, setActiveModuleTab] = useState("ALL"); // ALL | PNL | RECEIVABLES | PAYABLES

  // Core Data States
  const [netProfitData, setNetProfitData] = useState(null);
  const [yearlyOverview, setYearlyOverview] = useState(null);
  const [quarterlyData, setQuarterlyData] = useState(null);
  const [dailyData, setDailyData] = useState(null);
  const [receivablesData, setReceivablesData] = useState(null);
  const [payablesData, setPayablesData] = useState(null);
  const [payablesError, setPayablesError] = useState(null);

  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;

  // Resolve query params based on selected preset
  const resolveQueryParams = useCallback(() => {
    if (periodPreset === "THIS_MONTH") {
      const monthStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
      return { month: monthStr };
    }
    if (periodPreset === "LAST_MONTH") {
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const monthStr = `${prevYear}-${String(prevMonth).padStart(2, "0")}`;
      return { month: monthStr };
    }
    if (periodPreset === "THIS_QUARTER") {
      const currentQuarter = Math.floor((currentMonth - 1) / 3) + 1;
      return { year: currentYear, quarter: currentQuarter };
    }
    if (periodPreset === "YTD") {
      return { year: currentYear };
    }
    if (periodPreset === "CUSTOM" && customRange.from && customRange.to) {
      return { from: customRange.from, to: customRange.to };
    }
    return {};
  }, [periodPreset, customRange, currentYear, currentMonth]);

  // Load all analytics data concurrently
  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const params = resolveQueryParams();

      const [npRes, yearRes, quarterRes, dailyRes, recRes, payRes] = await Promise.allSettled([
        getPeriodNetProfit(params),
        getMonthlyNetProfitOverview({ year: currentYear }),
        getQuarterlyNetProfit({ year: currentYear }),
        getDailyNetProfitLedger({ year: currentYear, month: currentMonth }),
        getReceivablesIndex({ limit: 10 }),
        getPayablesIndex({ limit: 10 }),
      ]);

      if (npRes.status === "fulfilled" && npRes.value?.data) {
        setNetProfitData(npRes.value.data);
      }

      if (yearRes.status === "fulfilled" && yearRes.value?.data) {
        setYearlyOverview(yearRes.value.data);
      }

      if (quarterRes.status === "fulfilled" && quarterRes.value?.data) {
        setQuarterlyData(quarterRes.value.data);
      }

      if (dailyRes.status === "fulfilled" && dailyRes.value?.data) {
        setDailyData(dailyRes.value.data);
      }

      if (recRes.status === "fulfilled" && recRes.value?.data) {
        setReceivablesData(recRes.value.data);
      }

      if (payRes.status === "fulfilled" && payRes.value?.data) {
        setPayablesData(payRes.value.data);
        setPayablesError(null);
      } else if (payRes.status === "rejected") {
        setPayablesError(payRes.reason);
      }
    } catch (err) {
      console.error("Failed to load financial analytics:", err);
      toast.error("Failed to load net profit analytics.");
    } finally {
      setLoading(false);
    }
  }, [resolveQueryParams, currentYear, currentMonth]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Manual Cache Recalculation Trigger
  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      toast.loading("Recalculating monthly P&L summaries...", { id: "recalc" });

      await recalculateMonthlyNetProfit({
        year: currentYear,
        month: currentMonth,
      });

      toast.success("Net profit summaries recalculated and cached!", { id: "recalc" });
      await loadAnalytics();
    } catch (err) {
      toast.error("Recalculation error: " + (err.response?.data?.message || err.message), {
        id: "recalc",
      });
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <div className="p-5 md:p-8 space-y-7 w-full max-w-7xl mx-auto select-none">
      {/* ── TOP HERO BANNER: BOTTOM-LINE TRUTH ── */}
      <div className="relative overflow-hidden rounded-[18px] bg-gradient-to-r from-[#161617] via-[#1D1D1F] to-[#161617] border border-[#D2D2D7]/12 p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Phase 9 — Financial Analytics Engine (T56 Active)</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Profitability & P&L Statement
            </h1>
            <p className="text-xs md:text-sm text-[#A1A1AA] font-normal leading-relaxed">
              Consolidating Recognized Sales (T52), Cost of Goods Sold (T53), Gross Profit (T54), and Operating Expenses (T55) into the bottom-line truth.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <Link
              to="/profit"
              className="px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Profit Waterfall (T62)</span>
            </Link>
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="apple-btn-secondary text-xs flex items-center gap-2 py-2 px-4 cursor-pointer disabled:opacity-50"
              title="Recalculate and re-cache current month summary"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? "animate-spin" : ""}`} />
              <span>{recalculating ? "Recomputing..." : "Recalculate & Sync"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── MODULE SWITCHER TABS ── */}
      <div className="flex items-center gap-2 border-b border-[#D2D2D7]/12 pb-3 overflow-x-auto">
        {[
          { id: "ALL", label: "Full Financial Overview" },
          { id: "PNL", label: "P&L & Net Profit (T56)" },
          { id: "RECEIVABLES", label: "Receivables Index (T57)" },
          { id: "PAYABLES", label: "Payables Consolidated Index (T58)" },
        ].map((mod) => (
          <button
            key={mod.id}
            onClick={() => setActiveModuleTab(mod.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeModuleTab === mod.id
                ? "bg-[#0066CC] text-white shadow-[0_2px_12px_rgba(0,102,204,0.35)]"
                : "bg-white/[0.04] text-[#D2D2D7]/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            {mod.label}
          </button>
        ))}
      </div>

      {/* ── REPORTING PERIOD CONTROLS (For P&L) ── */}
      {(activeModuleTab === "ALL" || activeModuleTab === "PNL") && (
        <div className="p-4 bg-[#161617]/90 backdrop-blur-2xl border border-[#D2D2D7]/12 rounded-[18px] shadow-[0_4px_24px_rgba(0,0,0,0.3)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Preset Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "THIS_MONTH", label: "This Month" },
              { id: "LAST_MONTH", label: "Last Month" },
              { id: "THIS_QUARTER", label: "This Quarter" },
              { id: "YTD", label: "Year To Date" },
              { id: "CUSTOM", label: "Custom Range" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPeriodPreset(tab.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  periodPreset === tab.id
                    ? "bg-[#0066CC] text-white shadow-[0_2px_12px_rgba(0,102,204,0.35)]"
                    : "text-[#D2D2D7]/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Custom Range Picker */}
          {periodPreset === "CUSTOM" && (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={customRange.from}
                onChange={(e) => setCustomRange((prev) => ({ ...prev, from: e.target.value }))}
                className="bg-black/30 border border-[#D2D2D7]/15 rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none focus:border-[#0066CC]"
              />
              <span className="text-[#6E6E73]">to</span>
              <input
                type="date"
                value={customRange.to}
                onChange={(e) => setCustomRange((prev) => ({ ...prev, to: e.target.value }))}
                className="bg-black/30 border border-[#D2D2D7]/15 rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none focus:border-[#0066CC]"
              />
              <button
                onClick={loadAnalytics}
                className="apple-btn-primary text-xs py-1 px-3"
              >
                Apply
              </button>
            </div>
          )}

          {/* Active Period Label */}
          <div className="text-right text-xs font-mono text-[#A1A1AA] shrink-0">
            <span>Active Period: </span>
            <span className="text-white font-medium">
              {netProfitData?.period?.periodLabel || "Selected Range"}
            </span>
          </div>
        </div>
      )}

      {/* ── SECTION 1: P&L & NET PROFIT ENGINE (T56) ── */}
      {(activeModuleTab === "ALL" || activeModuleTab === "PNL") && (
        <>
          <NetProfitHeroCards data={netProfitData} loading={loading} />
          <ProfitWaterfallBar data={netProfitData} />
          <FiscalYearChart overviewData={yearlyOverview} loading={loading} />
          <QuarterlyProfitCards quarterlyData={quarterlyData} loading={loading} />
          <ProductProfitMatrix products={netProfitData?.productBreakdown || []} loading={loading} />
          <DailyProfitLedgerTable dailyData={dailyData} loading={loading} />
        </>
      )}

      {/* ── SECTION 2: RECEIVABLES CONSOLIDATED INDEX (T57) ── */}
      {(activeModuleTab === "ALL" || activeModuleTab === "RECEIVABLES") && (
        <ReceivablesConsolidatedCard data={receivablesData} loading={loading} />
      )}

      {/* ── SECTION 3: PAYABLES CONSOLIDATED INDEX (T58) ── */}
      {(activeModuleTab === "ALL" || activeModuleTab === "PAYABLES") && (
        <PayablesConsolidatedCard
          data={payablesData}
          loading={loading}
          error={payablesError}
          onRetry={loadAnalytics}
        />
      )}

      {/* ── ACCRUAL & ACCOUNTING METHODOLOGY NOTICE ── */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-[#D2D2D7]/10 flex items-start gap-3 text-xs text-[#A1A1AA]">
        <div className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
          <HelpCircle className="w-3 h-3" />
        </div>
        <div className="space-y-1">
          <span className="font-semibold text-white block">
            Accrual Profitability vs Cash Flow Note
          </span>
          <p className="text-[11px] leading-relaxed text-[#6E6E73]">
            Under VendorOS accrual accounting standards, <strong>Net Profit (T56)</strong> measures operating revenue minus product costs and overhead expenses. In parallel, the <strong>Receivables Consolidated Index (T57)</strong> tracks all customer credit (Udhaar) owed to the store, and the <strong>Payables Consolidated Index (T58)</strong> tracks outstanding accounts payable owed to suppliers for delivered inventory procurement.
          </p>
        </div>
      </div>
    </div>
  );
}
