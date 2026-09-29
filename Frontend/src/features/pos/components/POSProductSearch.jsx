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
    <div className="p-4 bg-black/60 backdrop-blur-xl border-b border-[#D2D2D7]/10 space-y-3">
      {/* Search Input Bar */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex-1 flex items-center">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6E6E73]" />
          <input
            ref={searchInputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search catalog by name, SKU, or scan barcode..."
            className="w-full bg-[#1D1D1F] border border-[#D2D2D7]/16 rounded-full pl-11 pr-24 py-2.5 text-xs md:text-sm text-white placeholder-[#6E6E73] focus:outline-none focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/30 transition-all shadow-inner"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-16 text-[#6E6E73] hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <div className="absolute right-3 flex items-center gap-1.5 text-[10px] font-mono text-[#D2D2D7] bg-white/10 px-2 py-0.5 rounded-full border border-white/15">
            <Barcode className="w-3.5 h-3.5 text-[#0066CC]" />
            <span>SCAN</span>
          </div>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Reload Catalog"
            className="p-2.5 rounded-full bg-[#1D1D1F] border border-[#D2D2D7]/16 text-[#6E6E73] hover:text-white hover:border-[#0066CC] transition-all shrink-0 cursor-pointer active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#0066CC]" : ""}`} />
          </button>
        )}
      </div>

      {/* Category Filter Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory("")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 cursor-pointer border ${
            selectedCategory === ""
              ? "bg-[#0066CC] text-white border-transparent shadow-[0_2px_10px_rgba(0,102,204,0.35)]"
              : "bg-[#1D1D1F] text-[#D2D2D7] hover:text-white border-[#D2D2D7]/14 hover:bg-white/10"
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
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 cursor-pointer border ${
                isSelected
                  ? "bg-[#0066CC] text-white border-transparent shadow-[0_2px_10px_rgba(0,102,204,0.35)]"
                  : "bg-[#1D1D1F] text-[#D2D2D7] hover:text-white border-[#D2D2D7]/14 hover:bg-white/10"
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
