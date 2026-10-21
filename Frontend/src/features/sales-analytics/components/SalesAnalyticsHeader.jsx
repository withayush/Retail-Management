import React from "react";
import { RefreshCw, BarChart3, TrendingUp } from "lucide-react";

export function SalesAnalyticsHeader({
  loading,
  onRefresh,
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D2D2D7]/10">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-[#0066CC]" />
            Sales Performance
          </h1>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#0066CC]/15 text-[#54A7FF] border border-[#0066CC]/30">
            <TrendingUp className="w-3 h-3 text-[#54A7FF]" />
            T61 Analytics
          </span>
        </div>
        <p className="text-xs md:text-sm text-[#8E8E93] font-normal">
          Analyze sales trends, compare periods, and identify high-performing days.
        </p>
      </div>

      <div className="flex items-center gap-2 self-start md:self-auto">
        <button
          onClick={onRefresh}
          disabled={loading}
          title="Refresh Sales Performance"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1A1A1E] border border-[#D2D2D7]/15 text-[#D2D2D7] text-xs font-medium hover:text-white hover:bg-white/[0.05] transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0066CC]" : ""}`} />
          <span>Refresh Data</span>
        </button>
      </div>
    </div>
  );
}

export default SalesAnalyticsHeader;
