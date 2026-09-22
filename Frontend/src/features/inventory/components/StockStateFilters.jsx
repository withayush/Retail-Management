import React from "react";
import { Search, X } from "lucide-react";

export default function StockStateFilters({
  searchTerm,
  setSearchTerm,
  stockStatusFilter,
  setStockStatusFilter,
}) {
  return (
    <div className="bg-[#111113] border border-[#1f1f23] rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
      {/* Search Input */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by product name, SKU or category..."
          className="w-full bg-[#141417] border border-[#27272a] rounded-lg pl-10 pr-8 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
        {[
          { label: "All Items", value: "ALL" },
          { label: "In Stock", value: "IN_STOCK" },
          { label: "Low Stock", value: "LOW_STOCK" },
          { label: "Out of Stock", value: "OUT_OF_STOCK" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStockStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer border ${
              stockStatusFilter === tab.value
                ? "bg-zinc-800 text-white font-semibold border-zinc-700 shadow-xs"
                : "bg-[#141417] text-zinc-400 hover:text-zinc-200 border-[#27272a] hover:bg-[#18181b]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
