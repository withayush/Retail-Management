import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useSalesTrends } from "../hooks/useSalesTrends";
import SalesAnalyticsHeader from "../components/SalesAnalyticsHeader";
import SalesMetricSelector from "../components/SalesMetricSelector";
import SalesDateRangeFilter from "../components/SalesDateRangeFilter";
import SalesInsights from "../components/SalesInsights";
import SalesTrendChart from "../components/SalesTrendChart";
import SalesChartSkeleton from "../components/SalesChartSkeleton";

export function SalesPerformancePage() {
  const {
    groupBy,
    setGroupBy,
    selectedMetric,
    setSelectedMetric,
    periodPreset,
    setPeriodPreset,
    customRange,
    setCustomRange,
    singleDate,
    setSingleDate,
    data,
    loading,
    error,
    refresh,
  } = useSalesTrends();

  const activePeriodLabel =
    groupBy === "hour"
      ? singleDate
      : data?.period
      ? `${data.period.from} to ${data.period.to}`
      : null;

  return (
    <div className="p-5 md:p-8 space-y-7 w-full max-w-7xl mx-auto">
      {/* 1. Page Header */}
      <SalesAnalyticsHeader loading={loading} onRefresh={refresh} />

      {/* 2. Grouping & Metric Mode Controls */}
      <SalesMetricSelector
        groupBy={groupBy}
        onSelectGroupBy={setGroupBy}
        selectedMetric={selectedMetric}
        onSelectMetric={setSelectedMetric}
      />

      {/* 3. Reporting Period Filter */}
      <SalesDateRangeFilter
        groupBy={groupBy}
        periodPreset={periodPreset}
        onSelectPreset={setPeriodPreset}
        customRange={customRange}
        onCustomRangeChange={setCustomRange}
        singleDate={singleDate}
        onSingleDateChange={setSingleDate}
        activePeriodLabel={activePeriodLabel}
      />

      {/* 4. Error State */}
      {error && !data && (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-white">Error loading sales trends</p>
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

      {/* 5. Skeleton or Main Content */}
      {loading && !data ? (
        <SalesChartSkeleton />
      ) : (
        <div className="space-y-7">
          {/* Executive Insights Panel */}
          <SalesInsights
            summary={data?.summary}
            comparison={data?.comparison}
            groupBy={groupBy}
          />

          {/* Main Visual Sales Trend Chart */}
          <SalesTrendChart
            data={data?.data || []}
            selectedMetric={selectedMetric}
            groupBy={groupBy}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
}

export default SalesPerformancePage;
