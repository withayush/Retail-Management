import React from "react";
import { Search, X, Barcode, RefreshCw } from "lucide-react";

export default function POSProductSearch({
  searchInputRef,
  searchTerm,
  setSearchTerm,
  onKeyDown,
  categories,
  selectedCategory,
  setSelectedCategory,
  onRefresh,
  loading,
}) {
  return (
    <div className="p-3.5 bg-[#0c0c0e] border-b border-[#1f1f23] space-y-2.5">
      {/* Search Input Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 flex items-center">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            ref={searchInputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search by product name, SKU, or scan barcode..."
            className="w-full bg-[#141417] border border-[#27272a] rounded-xl pl-10 pr-20 py-2 text-xs md:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 shadow-inner"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-12 text-zinc-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <div className="absolute right-2.5 flex items-center gap-1 text-[10px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">
            <Barcode className="w-3 h-3 text-zinc-300" />
            <span>SCAN</span>
          </div>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Reload Products"
            className="p-2 rounded-xl bg-[#141417] border border-[#27272a] text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-white" : ""}`} />
          </button>
        )}
      </div>

      {/* Category Filter Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        <button
          onClick={() => setSelectedCategory("")}
          className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer border ${
            selectedCategory === ""
              ? "bg-white text-zinc-950 border-white font-semibold shadow-xs"
              : "bg-[#141417] text-zinc-400 hover:text-zinc-200 border-[#27272a] hover:bg-[#1a1a1e]"
          }`}
        >
          All Items
        </button>
        {categories.map((cat) => {
          const catId = cat.id || cat._id;
          const isSelected = selectedCategory === catId;
          return (
            <button
              key={catId}
              onClick={() => setSelectedCategory(isSelected ? "" : catId)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer border ${
                isSelected
                  ? "bg-white text-zinc-950 border-white font-semibold shadow-xs"
                  : "bg-[#141417] text-zinc-400 hover:text-zinc-200 border-[#27272a] hover:bg-[#1a1a1e]"
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
