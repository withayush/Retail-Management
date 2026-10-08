import React, { useMemo } from "react";
import {
  Search,
  Calendar,
  Filter,
  Download,
  RotateCcw,
  Tag,
  CreditCard,
  X,
  ArrowUpDown,
} from "lucide-react";
import toast from "react-hot-toast";

export default function ExpenseLedgerFilters({
  filters,
  onFilterChange,
  categories = [],
  expenses = [],
  onResetFilters,
}) {
  // Generate last 12 months options for quick dropdown
  const monthOptions = useMemo(() => {
    const options = [{ id: "ALL", label: "All Months" }];
    const date = new Date();

    for (let i = 0; i < 12; i++) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const id = `${year}-${month}`;
      const label = date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
      options.push({ id, label });
      date.setMonth(date.getMonth() - 1);
    }

    return options;
  }, []);

  // Compute number of active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search?.trim()) count++;
    if (filters.month && filters.month !== "ALL") count++;
    if (filters.categoryId && filters.categoryId !== "ALL") count++;
    if (filters.paymentMethod && filters.paymentMethod !== "ALL") count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    return count;
  }, [filters]);

  // 1-Click CSV Export
  const handleExportCSV = () => {
    if (!expenses || expenses.length === 0) {
      toast.error("No expense records to export.");
      return;
    }

    const headers = [
      "Expense Number",
      "Date",
      "Category",
      "Payee",
      "Description",
      "Payment Method",
      "Amount (INR)",
      "Tax / GST (INR)",
      "Reference Number",
      "Status",
    ];

    const rows = expenses.map((exp) => [
      `"${exp.expenseNumber || ""}"`,
      `"${new Date(exp.expenseDate).toLocaleDateString("en-IN")}"`,
      `"${exp.categoryName || ""}"`,
      `"${(exp.payee || "").replace(/"/g, '""')}"`,
      `"${(exp.description || "").replace(/"/g, '""')}"`,
      `"${exp.paymentMethod || ""}"`,
      exp.amount || 0,
      exp.taxAmount || 0,
      `"${exp.referenceNumber || ""}"`,
      `"${exp.status || "PAID"}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `VendorOS_Expense_Statement_${filters.month !== "ALL" ? filters.month : "All"}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Expense statement exported to CSV!");
  };

  return (
    <div className="p-4 border-b border-white/[0.08] space-y-3 bg-zinc-950/20">
      {/* Row 1: Search & Dropdowns */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            placeholder="Search by expense #, payee, note, or ref..."
            className="w-full h-9 pl-9 pr-8 bg-zinc-900/80 border border-white/[0.08] hover:border-white/15 focus:border-emerald-500/50 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none transition-all shadow-inner"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange("search", "")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Month Selector */}
          <div className="h-9 flex items-center gap-2 bg-zinc-900/80 border border-white/[0.08] hover:border-white/15 rounded-xl px-2.5 transition-colors">
            <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <select
              value={filters.month}
              onChange={(e) => onFilterChange("month", e.target.value)}
              className="bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer pr-1"
            >
              {monthOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-zinc-900 text-zinc-100">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category Selector */}
          <div className="h-9 flex items-center gap-2 bg-zinc-900/80 border border-white/[0.08] hover:border-white/15 rounded-xl px-2.5 transition-colors max-w-[170px]">
            <Tag className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <select
              value={filters.categoryId}
              onChange={(e) => onFilterChange("categoryId", e.target.value)}
              className="bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer pr-1 truncate"
            >
              <option value="ALL" className="bg-zinc-900 text-zinc-100">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id} className="bg-zinc-900 text-zinc-100">
                  {cat.categoryName}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Selector */}
          <div className="h-9 flex items-center gap-2 bg-zinc-900/80 border border-white/[0.08] hover:border-white/15 rounded-xl px-2.5 transition-colors">
            <CreditCard className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <select
              value={filters.paymentMethod}
              onChange={(e) => onFilterChange("paymentMethod", e.target.value)}
              className="bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="ALL" className="bg-zinc-900 text-zinc-100">All Methods</option>
              <option value="CASH" className="bg-zinc-900 text-zinc-100">Cash</option>
              <option value="UPI" className="bg-zinc-900 text-zinc-100">UPI</option>
              <option value="BANK_TRANSFER" className="bg-zinc-900 text-zinc-100">Bank Transfer</option>
              <option value="CARD" className="bg-zinc-900 text-zinc-100">Card</option>
              <option value="CHEQUE" className="bg-zinc-900 text-zinc-100">Cheque</option>
              <option value="OTHER" className="bg-zinc-900 text-zinc-100">Other</option>
            </select>
          </div>

          {/* CSV Statement Export */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="h-9 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.03] border border-white/[0.08] text-xs font-medium text-zinc-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="Download CSV Statement"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          {/* Reset Filters Button */}
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={onResetFilters}
              className="h-9 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              title="Reset All Filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset ({activeFiltersCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Date Range & Sort Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-white/[0.04] text-xs text-zinc-400">
        {/* Date Range Sub-Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-zinc-900/60 border border-white/[0.06] rounded-xl px-2.5 py-1">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[11px] text-zinc-400 font-medium">Custom Range:</span>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => onFilterChange("startDate", e.target.value)}
              className="px-2 py-0.5 bg-zinc-950/80 border border-white/[0.08] focus:border-emerald-500/50 rounded-md text-xs text-zinc-200 focus:outline-none transition-colors [color-scheme:dark]"
            />
            <span className="text-zinc-500 text-[11px]">to</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => onFilterChange("endDate", e.target.value)}
              className="px-2 py-0.5 bg-zinc-950/80 border border-white/[0.08] focus:border-emerald-500/50 rounded-md text-xs text-zinc-200 focus:outline-none transition-colors [color-scheme:dark]"
            />
            {(filters.startDate || filters.endDate) && (
              <button
                type="button"
                onClick={() => {
                  onFilterChange("startDate", "");
                  onFilterChange("endDate", "");
                }}
                className="text-zinc-500 hover:text-rose-400 p-0.5 rounded transition-colors"
                title="Clear date range"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Sort By Dropdown */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-[11px] text-zinc-500 font-medium flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3" />
            Sort:
          </span>
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange("sortBy", e.target.value)}
            className="h-8 bg-zinc-900/80 border border-white/[0.08] hover:border-white/15 rounded-lg px-2 text-xs text-zinc-200 focus:outline-none cursor-pointer transition-colors"
          >
            <option value="date_desc" className="bg-zinc-900 text-zinc-100">Most Recent Date</option>
            <option value="date_asc" className="bg-zinc-900 text-zinc-100">Oldest Date</option>
            <option value="amount_desc" className="bg-zinc-900 text-zinc-100">Highest Amount</option>
            <option value="amount_asc" className="bg-zinc-900 text-zinc-100">Lowest Amount</option>
          </select>
        </div>
      </div>
    </div>
  );
}
