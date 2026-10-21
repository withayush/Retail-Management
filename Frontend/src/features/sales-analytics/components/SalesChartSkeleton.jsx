import React from "react";

export function SalesChartSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D2D2D7]/10">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-white/10 rounded-lg" />
          <div className="h-4 w-72 bg-white/5 rounded" />
        </div>
        <div className="h-9 w-60 bg-white/10 rounded-xl" />
      </div>

      {/* Metric Selector & Filter Bar Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#161617]/60 border border-[#D2D2D7]/10 rounded-2xl">
        <div className="h-8 w-64 bg-white/10 rounded-lg" />
        <div className="h-8 w-72 bg-white/10 rounded-lg" />
      </div>

      {/* Insights Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="p-5 bg-[#161617]/80 border border-[#D2D2D7]/10 rounded-2xl space-y-3"
          >
            <div className="h-3.5 w-24 bg-white/10 rounded" />
            <div className="h-7 w-32 bg-white/15 rounded-lg" />
            <div className="h-3 w-40 bg-white/5 rounded" />
          </div>
        ))}
      </div>

      {/* Main Chart Skeleton */}
      <div className="p-6 bg-[#161617]/80 border border-[#D2D2D7]/10 rounded-2xl h-96 space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-5 w-44 bg-white/10 rounded" />
          <div className="h-4 w-28 bg-white/5 rounded" />
        </div>
        <div className="h-72 w-full bg-white/5 rounded-xl" />
      </div>
    </div>
  );
}

export default SalesChartSkeleton;
