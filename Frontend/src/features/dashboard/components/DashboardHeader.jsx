import React from "react";
import { RefreshCw, Activity, ShieldCheck } from "lucide-react";
import DateRangeFilter from "./DateRangeFilter";

export function DashboardHeader({
  periodPreset,
  onSelectPreset,
  customRange,
  onCustomRangeChange,
  activePeriodLabel,
  loading,
  onRefresh,
}) {
  return (
    <div className="space-y-4 pb-4 border-b border-[#D2D2D7]/10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title & Subtitle */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Business Overview
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Accrual Ledger
            </span>
          </div>
          <p className="text-xs md:text-sm text-[#8E8E93] font-normal">
            Financial performance at a glance.
          </p>
        </div>

        {/* Refresh & Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={onRefresh}
            disabled={loading}
            title="Refresh Financial Summary"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1A1A1E] border border-[#D2D2D7]/15 text-[#D2D2D7] text-xs font-medium hover:text-white hover:bg-white/[0.05] transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0066CC]" : ""}`} />
            <span>Sync Metrics</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector Bar */}
      <DateRangeFilter
        periodPreset={periodPreset}
        onSelectPreset={onSelectPreset}
        customRange={customRange}
        onCustomRangeChange={onCustomRangeChange}
        activePeriodLabel={activePeriodLabel}
      />
    </div>
  );
}

export default DashboardHeader;
