import React from "react";

/**
 * ProfitChartSkeleton (Phase 10 - Task T62)
 * Apple dark-mode styled skeleton loading component for profit visualizers.
 */
export default function ProfitChartSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-[#161617]/70 border border-[#D2D2D7]/10 space-y-3"
          >
            <div className="h-3 w-20 bg-white/5 rounded-full" />
            <div className="h-6 w-28 bg-white/10 rounded-md" />
            <div className="h-2.5 w-16 bg-white/5 rounded-full" />
          </div>
        ))}
      </div>

      {/* Waterfall Chart Skeleton */}
      <div className="p-6 rounded-2xl bg-[#161617]/80 border border-[#D2D2D7]/10 space-y-5">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-4 w-48 bg-white/10 rounded-md" />
            <div className="h-3 w-64 bg-white/5 rounded-full" />
          </div>
          <div className="h-8 w-24 bg-white/5 rounded-lg" />
        </div>
        <div className="h-72 w-full bg-white/[0.02] rounded-xl flex items-end justify-around px-8 pb-6 pt-12">
          <div className="w-16 h-5/6 bg-white/5 rounded-t-lg" />
          <div className="w-16 h-3/5 bg-white/5 rounded-t-lg" />
          <div className="w-16 h-2/5 bg-white/5 rounded-t-lg" />
          <div className="w-16 h-1/4 bg-white/5 rounded-t-lg" />
          <div className="w-16 h-1/3 bg-white/5 rounded-t-lg" />
        </div>
      </div>

      {/* Margin Comparison Skeleton */}
      <div className="p-6 rounded-2xl bg-[#161617]/80 border border-[#D2D2D7]/10 space-y-4">
        <div className="h-4 w-44 bg-white/10 rounded-md" />
        <div className="space-y-3">
          <div className="h-10 w-full bg-white/5 rounded-xl" />
          <div className="h-10 w-full bg-white/5 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
