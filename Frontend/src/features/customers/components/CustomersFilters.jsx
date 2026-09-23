import React from "react";
import { Search, X } from "lucide-react";

export default function CustomersFilters({
  searchTerm,
  setSearchTerm,
  debtFilter,
  setDebtFilter,
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#111113] p-2.5 sm:p-3 rounded-xl border border-[#1f1f23]">
      {/* Search Input */}
      <div className="relative w-full sm:w-80 md:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by customer name, phone, or email..."
          className="w-full bg-[#141417] border border-[#27272a] rounded-lg pl-9 pr-8 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 w-full sm:w-auto bg-[#141417] p-1 rounded-lg border border-[#27272a]">
        <button
          onClick={() => setDebtFilter("ALL")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
            debtFilter === "ALL"
              ? "bg-zinc-100 text-zinc-900 font-semibold shadow-xs"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          All Customers
        </button>

        <button
          onClick={() => setDebtFilter("DEBT_ONLY")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
            debtFilter === "DEBT_ONLY"
              ? "bg-amber-400 text-zinc-950 font-bold shadow-xs"
              : "text-amber-400/90 hover:text-amber-300"
          }`}
        >
          <span>Active Udhaar (Debtors Only)</span>
        </button>
      </div>
    </div>
  );
}

