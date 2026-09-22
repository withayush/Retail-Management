import React from "react";
import { Search, X, Filter, Download } from "lucide-react";

export default function SalesHistoryFilters({
  searchTerm,
  setSearchTerm,
  paymentModeFilter,
  setPaymentModeFilter,
  paymentStatusFilter,
  setPaymentStatusFilter,
  setPage,
  onExportCSV,
}) {
  return (
    <div className="bg-[#111113] border border-[#1f1f23] rounded-xl p-3.5 space-y-3">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by Invoice # (e.g. INV-1001), Customer Name, Phone, or Notes..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full bg-[#141417] border border-[#27272a] rounded-lg pl-8 pr-8 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                setPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Payment Mode Selector */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <select
            value={paymentModeFilter}
            onChange={(e) => {
              setPaymentModeFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#141417] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 font-medium focus:outline-none focus:border-zinc-500 cursor-pointer"
          >
            <option value="ALL">All Payment Modes</option>
            <option value="CASH">Cash</option>
            <option value="UPI">UPI / QR</option>
            <option value="CARD">Card / POS</option>
            <option value="CREDIT_UDHAR">Credit / Udhar</option>
            <option value="SPLIT">Split Payment</option>
          </select>
        </div>

        {/* CSV Export */}
        <button
          onClick={onExportCSV}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#27272a] bg-[#141417] hover:bg-zinc-800 text-zinc-200 text-xs font-medium transition-colors cursor-pointer shrink-0"
          title="Export Sales Ledger as CSV"
        >
          <Download className="w-3.5 h-3.5 text-zinc-400" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Payment Status Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-[#1f1f23]">
        {[
          { label: "All Sales", value: "ALL" },
          { label: "Paid", value: "PAID" },
          { label: "Partial", value: "PARTIAL" },
          { label: "Pending (Due)", value: "PENDING" },
          { label: "Cancelled", value: "CANCELLED" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setPaymentStatusFilter(tab.value);
              setPage(1);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer border ${
              paymentStatusFilter === tab.value
                ? "bg-zinc-100 text-zinc-900 border-zinc-100 font-semibold"
                : "bg-[#141417] text-zinc-400 hover:text-zinc-200 border-[#27272a] hover:bg-zinc-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
