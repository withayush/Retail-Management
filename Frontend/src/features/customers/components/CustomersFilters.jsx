import React from "react";
import { Search, X, Filter } from "lucide-react";

export default function CustomersFilters({
  searchTerm,
  setSearchTerm,
  debtFilter,
  setDebtFilter,
  onRefresh,
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#111113] p-3 rounded-2xl border border-[#1f1f23]">
      {/* Search Input */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by customer name, phone, or email..."
          className="w-full bg-[#18181b] border border-[#27272a] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
        <button
          onClick={() => setDebtFilter("ALL")}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
            debtFilter === "ALL"
              ? "bg-white text-zinc-950 font-bold border-white shadow-xs"
              : "bg-[#18181b] text-zinc-400 hover:text-zinc-200 border-[#27272a]"
          }`}
        >
          All Customers
        </button>

        <button
          onClick={() => setDebtFilter("DEBT_ONLY")}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border flex items-center gap-1.5 ${
            debtFilter === "DEBT_ONLY"
              ? "bg-amber-400 text-zinc-950 font-bold border-amber-400 shadow-xs"
              : "bg-[#18181b] text-amber-400/80 hover:text-amber-300 border-[#27272a]"
          }`}
        >
          <span>📒 Active Udhaar (Debtors Only)</span>
        </button>
      </div>
    </div>
  );
}
