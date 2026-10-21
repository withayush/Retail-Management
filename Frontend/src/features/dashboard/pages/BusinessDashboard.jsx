import React from "react";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Percent,
  AlertTriangle,
  RefreshCw,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { useBusinessSummary } from "../hooks/useBusinessSummary";
import DashboardHeader from "../components/DashboardHeader";
import SummaryCard, { formatINR } from "../components/SummaryCard";
import RevenueTrendChart from "../components/RevenueTrendChart";
import RevenueExpenseChart from "../components/RevenueExpenseChart";
import ProfitTrendChart from "../components/ProfitTrendChart";
import DashboardSkeleton from "../components/DashboardSkeleton";

export function BusinessDashboard() {
  const {
    periodPreset,
    setPeriodPreset,
    customRange,
    setCustomRange,
    data,
    loading,
    error,
    refresh,
  } = useBusinessSummary();

  const activePeriodLabel = data?.period
    ? `${data.period.from} to ${data.period.to}`
    : null;

  return (
    <div className="space-y-7 w-full">
      {/* 1. Header & Date Range Filter Bar */}
      <DashboardHeader
        periodPreset={periodPreset}
        onSelectPreset={setPeriodPreset}
        customRange={customRange}
        onCustomRangeChange={setCustomRange}
        activePeriodLabel={activePeriodLabel}
        loading={loading}
        onRefresh={refresh}
      />

      {/* 2. Error & Retry State */}
      {error && !data && (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-white">Error loading business metrics</p>
              <p className="text-xs text-rose-200">{error}</p>
            </div>
          </div>
          <button
            onClick={refresh}
            className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-white text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* 3. Skeleton Loading State (when first loading with no cached data) */}
      {loading && !data ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-7">
          {/* 4. Primary Summary Cards (Cards 1 to 4) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1 — Revenue (Source: T52) */}
            <SummaryCard
              title="Revenue"
              value={data?.revenue ?? 0}
              isCurrency={true}
              sourceTag="T52"
              subtitle="Recognized sales revenue in period"
              variant="default"
              tooltip="Recognized sales revenue under accrual accounting (excludes voided/cancelled sales)."
            />

            {/* Card 2 — Profit (Operating Profit, Source: T56) */}
            <SummaryCard
              title="Operating Profit"
              value={data?.operatingProfit ?? 0}
              isCurrency={true}
              sourceTag="T56"
              subtitle={
                (data?.operatingProfit || 0) >= 0
                  ? "Gross Profit minus OpEx (Profitable)"
                  : "Gross Profit minus OpEx (Loss-making)"
              }
              variant={(data?.operatingProfit || 0) >= 0 ? "profit" : "loss"}
              tooltip="Gross Profit minus Operating Expenses. True operational bottom-line for the period."
            />

            {/* Card 3 — Cash Position (Source: T59, Snapshot Semantics) */}
            <SummaryCard
              title="Current Cash Position"
              value={data?.cashPosition}
              isCurrency={true}
              sourceTag="T59"
              isSnapshot={true}
              variant={data?.cashPositionStatus?.isAvailable ? "snapshot" : "unavailable"}
              unavailableMessage="Feature Pending (T59)"
              subtitle="Current consolidated balance of financial accounts"
              tooltip="Point-in-time consolidated balance of eligible financial accounts. T59 accounts integration pending."
            />

            {/* Card 4 — Gross Profit Margin (Sources: T52 & T54) */}
            <SummaryCard
              title="Gross Profit Margin"
              value={data?.grossMargin ?? 0}
              isCurrency={false}
              suffix="%"
              sourceTag="T54"
              subtitle={`Gross Profit: ${formatINR(data?.grossProfit || 0)}`}
              variant={(data?.grossMargin || 0) >= 20 ? "profit" : (data?.grossMargin || 0) > 0 ? "alert" : "default"}
              tooltip="(Gross Profit / Revenue) × 100. Measures retail markup efficiency."
            />
          </div>

          {/* 5. Additional Metric Cards (Operating Margin, Receivables, Payables) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Additional Card: Operating Profit Margin */}
            <SummaryCard
              title="Operating Profit Margin"
              value={data?.operatingMargin ?? 0}
              isCurrency={false}
              suffix="%"
              sourceTag="T56"
              subtitle={`OpEx: ${formatINR(data?.operatingExpenses || 0)}`}
              variant={(data?.operatingMargin || 0) >= 15 ? "profit" : (data?.operatingMargin || 0) > 0 ? "alert" : "loss"}
              tooltip="(Operating Profit / Revenue) × 100. Operational efficiency after operating expenses."
            />

            {/* Additional Card: Receivables (Source: T57) */}
            <SummaryCard
              title="Receivables"
              value={data?.receivables ?? 0}
              isCurrency={true}
              sourceTag="T57"
              isSnapshot={true}
              subtitle="Outstanding customer balances (Udhar)"
              variant="snapshot"
              tooltip="Total active debt legally owed by customers to the store under accrual accounting."
            />

            {/* Additional Card: Payables (Source: T58) */}
            <SummaryCard
              title="Payables"
              value={data?.payables ?? 0}
              isCurrency={true}
              sourceTag="T58"
              isSnapshot={true}
              subtitle="Outstanding supplier procurement liabilities"
              variant="alert"
              tooltip="Total procurement liabilities currently owed by the business to suppliers."
            />
          </div>

          {/* 6. Interactive Financial Charts */}
          <div className="space-y-6">
            {/* Top Row: Chart A (Revenue Trend) & Chart B (Revenue vs OpEx) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueTrendChart
                data={data?.trends || []}
                loading={loading}
              />
              <RevenueExpenseChart
                data={data?.trends || []}
                loading={loading}
              />
            </div>

            {/* Bottom Row: Chart C (Profit and Margin Trend) */}
            <ProfitTrendChart
              data={data?.trends || []}
              loading={loading}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default BusinessDashboard;
