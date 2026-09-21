import React from "react";
import { Search, X, Barcode } from "lucide-react";

export default function POSSearchBar({
  searchInputRef,
  searchTerm,
  setSearchTerm,
  onKeyDown,
}) {
  return (
    <div className="relative flex items-center">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        ref={searchInputRef}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Search by Name, SKU, Category or Scan Barcode (Press Enter)..."
        className="w-full bg-background border border-border rounded-xl pl-10 pr-24 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
      />
      {searchTerm && (
        <button
          onClick={() => setSearchTerm("")}
          className="absolute right-12 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      <div className="absolute right-3 flex items-center gap-1 text-[11px] font-mono text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded border border-border">
        <Barcode className="w-3.5 h-3.5 text-primary" />
        <span>SCAN</span>
      </div>
    </div>
  );
}
