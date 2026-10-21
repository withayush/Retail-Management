import React from "react";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D2D2D7]/10">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-white/10 rounded-lg" />
          <div className="h-4 w-64 bg-white/5 rounded" />
        </div>
        <div className="h-9 w-72 bg-white/10 rounded-full" />
      </div>

      {/* Metric Cards Skeleton Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="p-5 bg-[#161617]/80 border border-[#D2D2D7]/10 rounded-2xl space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-white/10 rounded" />
              <div className="h-7 w-7 bg-white/5 rounded-full" />
            </div>
            <div className="h-8 w-36 bg-white/15 rounded-lg" />
            <div className="h-3 w-28 bg-white/5 rounded" />
          </div>
        ))}
      </div>

      {/* Secondary Cards Skeleton Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="p-4 bg-[#161617]/60 border border-[#D2D2D7]/10 rounded-2xl space-y-2"
          >
            <div className="h-3.5 w-20 bg-white/10 rounded" />
            <div className="h-6 w-28 bg-white/15 rounded" />
            <div className="h-3 w-32 bg-white/5 rounded" />
          </div>
        ))}
      </div>

      {/* Charts Skeleton Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-[#161617]/80 border border-[#D2D2D7]/10 rounded-2xl h-80 space-y-4">
          <div className="h-5 w-40 bg-white/10 rounded" />
          <div className="h-56 w-full bg-white/5 rounded-xl" />
        </div>
        <div className="p-6 bg-[#161617]/80 border border-[#D2D2D7]/10 rounded-2xl h-80 space-y-4">
          <div className="h-5 w-48 bg-white/10 rounded" />
          <div className="h-56 w-full bg-white/5 rounded-xl" />
        </div>
      </div>
      <div className="p-6 bg-[#161617]/80 border border-[#D2D2D7]/10 rounded-2xl h-84 space-y-4">
        <div className="h-5 w-48 bg-white/10 rounded" />
        <div className="h-60 w-full bg-white/5 rounded-xl" />
      </div>
    </div>
  );
}

export default DashboardSkeleton;
