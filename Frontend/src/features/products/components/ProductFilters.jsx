import React from "react";
import { Search, X, Filter, RefreshCw } from "lucide-react";

export default function ProductFilters({
  search,
  onSearchChange,
  onClearSearch,
  selectedCategory,
  onCategoryChange,
  categories,
  sortBy,
  sortDir,
  onSortChange,
  statusFilter,
  onStatusFilterChange,
  onRefresh,
  loading,
}) {
  return (
    <div className="bg-[#111113] border border-[#1f1f23] rounded-xl p-3.5 space-y-3">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, SKU, or barcode..."
            className="w-full pl-10 pr-10 py-2 bg-[#141417] border border-[#27272a] rounded-xl text-xs md:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 font-sans"
          />
          {search && (
            <button
              onClick={onClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white rounded-lg cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Dropdown */}
        <div className="relative min-w-[160px]">
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full appearance-none px-3 py-2 bg-[#141417] border border-[#27272a] rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-zinc-500 font-medium pr-8 cursor-pointer"
          >
            <option value="">All Categories ({categories?.length || 0})</option>
            {categories.map((c) => (
              <option key={c.id || c._id} value={c.id || c._id}>
                {c.name}
              </option>
            ))}
          </select>
          <Filter className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Sort Dropdown */}
        <div className="relative min-w-[130px]">
          <select
            value={`${sortBy}-${sortDir}`}
            onChange={(e) => {
              const [sb, sd] = e.target.value.split("-");
              onSortChange(sb, sd);
            }}
            className="w-full appearance-none px-3 py-2 bg-[#141417] border border-[#27272a] rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-zinc-500 font-medium pr-6 cursor-pointer"
          >
            <option value="created-DESC">Newest First</option>
            <option value="created-ASC">Oldest First</option>
            <option value="name-ASC">Name (A-Z)</option>
            <option value="name-DESC">Name (Z-A)</option>
            <option value="price-DESC">Price: High to Low</option>
            <option value="price-ASC">Price: Low to High</option>
          </select>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-[#141417] p-1 rounded-xl border border-[#27272a]">
          {["ACTIVE", "ALL", "ARCHIVED"].map((st) => (
            <button
              key={st}
              onClick={() => onStatusFilterChange(st)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? "bg-zinc-800 text-white font-semibold shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {st.toLowerCase()}
            </button>
          ))}
        </div>

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Refresh List"
            className="p-2 rounded-xl bg-[#141417] border border-[#27272a] text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-white" : ""}`} />
          </button>
        )}
      </div>
    </div>
  );
}
