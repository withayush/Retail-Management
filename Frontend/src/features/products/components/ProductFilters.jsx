import React from "react";
import { Search, X, Filter, ArrowUpDown, RefreshCw, Layers } from "lucide-react";

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
  onResetFilters,
}) {
  const hasActiveFilters = Boolean(search || selectedCategory || statusFilter !== "ACTIVE");

  return (
    <div className="bg-card border border-border rounded-2xl p-4 mb-5 shadow-sm space-y-3">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, SKU, or barcode..."
            className="w-full pl-10 pr-10 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-sans"
          />
          {search && (
            <button
              onClick={onClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category & Sort Dropdowns */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          {/* Category Filter */}
          <div className="relative flex-1 sm:w-48 min-w-[150px]">
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full appearance-none px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium pr-8 cursor-pointer"
            >
              <option value="">All Categories ({categories?.length || 0})</option>
              {categories.map((c) => (
                <option key={c.id || c._id} value={c.id || c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Sort Dropdown */}
          <div className="relative flex-1 sm:w-44 min-w-[140px]">
            <select
              value={`${sortBy}-${sortDir}`}
              onChange={(e) => {
                const [sb, sd] = e.target.value.split("-");
                onSortChange(sb, sd);
              }}
              className="w-full appearance-none px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium pr-8 cursor-pointer"
            >
              <option value="created-DESC">Newest First</option>
              <option value="name-ASC">Name (A to Z)</option>
              <option value="price-ASC">Price (Low to High)</option>
              <option value="price-DESC">Price (High to Low)</option>
              <option value="margin-DESC">Highest Margin</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Status filter tabs */}
        <div className="flex bg-background border border-border rounded-xl p-1 text-xs self-start lg:self-auto">
          {["ACTIVE", "ALL", "ARCHIVED"].map((f) => (
            <button
              key={f}
              onClick={() => onStatusFilterChange(f)}
              className={`px-3 py-1.5 rounded-lg transition-all capitalize font-semibold cursor-pointer ${
                statusFilter === f
                  ? "bg-secondary text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.toLowerCase()}
            </button>
          ))}
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          className="p-2.5 border border-border bg-background rounded-xl hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground self-start lg:self-auto cursor-pointer"
          title="Refresh products"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
          <span className="text-[11px] font-medium">Active filters:</span>
          {search && (
            <span className="inline-flex items-center gap-1 bg-secondary/80 px-2.5 py-1 rounded-lg border border-border text-foreground text-xs font-mono">
              Query: &quot;{search}&quot;
            </span>
          )}
          {selectedCategory && (
            <span className="inline-flex items-center gap-1 bg-secondary/80 px-2.5 py-1 rounded-lg border border-border text-foreground text-xs font-medium">
              <Layers className="w-3 h-3 text-primary" />
              {categories.find((c) => (c.id || c._id) === selectedCategory)?.name || "Category"}
            </span>
          )}
          {statusFilter !== "ACTIVE" && (
            <span className="inline-flex items-center gap-1 bg-secondary/80 px-2.5 py-1 rounded-lg border border-border text-foreground text-xs capitalize font-medium">
              Status: {statusFilter.toLowerCase()}
            </span>
          )}
          <button
            onClick={onResetFilters}
            className="text-xs text-primary hover:underline font-semibold ml-auto cursor-pointer"
          >
            Reset all
          </button>
        </div>
      )}
    </div>
  );
}
