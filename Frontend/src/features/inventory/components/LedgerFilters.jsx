import React from "react";
import { Search, X, Boxes, Filter, Download } from "lucide-react";

export default function LedgerFilters({
  ledgerSearchTerm,
  setLedgerSearchTerm,
  selectedProductFilter,
  setSelectedProductFilter,
  storeState,
  ledgerSourceFilter,
  setLedgerSourceFilter,
  ledgerTypeFilter,
  setLedgerTypeFilter,
  ledgerDatePreset,
  setLedgerDatePreset,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  setLedgerPage,
  onExportCSV,
}) {
  return (
    <div className="bg-[#111113] border border-[#1f1f23] rounded-xl p-3.5 shadow-xs space-y-3">
      {/* Top Row: Search & Actions */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        {/* Reference / Actor / Note Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by Reference #, Reason, Supplier, or Notes..."
            value={ledgerSearchTerm}
            onChange={(e) => {
              setLedgerSearchTerm(e.target.value);
              setLedgerPage(1);
            }}
            className="w-full bg-[#141417] border border-[#27272a] rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
          />
          {ledgerSearchTerm && (
            <button
              onClick={() => {
                setLedgerSearchTerm("");
                setLedgerPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Product Selector */}
        <div className="flex items-center gap-2">
          <Boxes className="w-4 h-4 text-zinc-500 shrink-0" />
          <select
            value={selectedProductFilter}
            onChange={(e) => {
              setSelectedProductFilter(e.target.value);
              setLedgerPage(1);
            }}
            className="bg-[#141417] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none cursor-pointer min-w-[160px]"
          >
            <option value="">All Products</option>
            {storeState.map((it) => (
              <option key={it.productId} value={it.productId}>
                {it.name} ({it.sku})
              </option>
            ))}
          </select>
        </div>

        {/* Export Button */}
        <button
          onClick={onExportCSV}
          className="px-3 py-2 rounded-lg bg-[#141417] border border-[#27272a] text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Bottom Row: Source, Type, Date Filters */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#1f1f23] text-xs">
        <span className="text-zinc-500 flex items-center gap-1">
          <Filter className="w-3 h-3" /> Filters:
        </span>

        {/* Type Filter */}
        <div className="flex items-center gap-1 bg-[#141417] p-1 rounded-lg border border-[#27272a]">
          {[
            { label: "All Movements", value: "ALL" },
            { label: "Stock IN", value: "IN" },
            { label: "Stock OUT", value: "OUT" },
            { label: "Adjustment", value: "ADJUSTMENT" },
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => {
                setLedgerTypeFilter(t.value);
                setLedgerPage(1);
              }}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                ledgerTypeFilter === t.value
                  ? "bg-zinc-800 text-white font-semibold shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Date Preset */}
        <select
          value={ledgerDatePreset}
          onChange={(e) => {
            setLedgerDatePreset(e.target.value);
            setLedgerPage(1);
          }}
          className="bg-[#141417] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 outline-none cursor-pointer"
        >
          <option value="ALL">All Time</option>
          <option value="TODAY">Today</option>
          <option value="WEEK">This Week</option>
          <option value="MONTH">This Month</option>
          <option value="CUSTOM">Custom Range</option>
        </select>

        {ledgerDatePreset === "CUSTOM" && (
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-[#141417] border border-[#27272a] rounded px-2 py-1 text-xs text-zinc-200"
            />
            <span className="text-zinc-500">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-[#141417] border border-[#27272a] rounded px-2 py-1 text-xs text-zinc-200"
            />
          </div>
        )}
      </div>
    </div>
  );
}
