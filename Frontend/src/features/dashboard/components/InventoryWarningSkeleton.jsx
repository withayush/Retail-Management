import React from "react";

/**
 * Phase 10 - Task T63: Skeleton loader for Inventory Warning Center
 */
export function InventoryWarningSkeleton() {
  return (
    <div className="p-6 bg-[#161617]/90 backdrop-blur-2xl border border-[#D2D2D7]/12 rounded-[18px] shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D2D2D7]/10">
        <div className="space-y-2">
          <div className="h-6 w-56 bg-white/10 rounded-lg" />
          <div className="h-3.5 w-72 bg-white/5 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 bg-white/10 rounded-full" />
          <div className="h-8 w-24 bg-white/10 rounded-full" />
        </div>
      </div>

      {/* Summary Badges Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="p-3.5 bg-white/[0.02] border border-[#D2D2D7]/8 rounded-xl space-y-2"
          >
            <div className="h-3.5 w-20 bg-white/10 rounded" />
            <div className="h-7 w-12 bg-white/15 rounded" />
          </div>
        ))}
      </div>

      {/* Item Rows Skeleton */}
      <div className="space-y-3">
        <div className="h-4 w-36 bg-white/10 rounded" />
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="p-4 bg-white/[0.02] border border-[#D2D2D7]/8 rounded-xl flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-6 bg-white/10 rounded-md" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-40 bg-white/15 rounded" />
                <div className="h-3 w-56 bg-white/5 rounded" />
              </div>
            </div>
            <div className="h-7 w-20 bg-white/10 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default InventoryWarningSkeleton;

