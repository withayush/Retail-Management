import React, { useMemo } from "react";
import {
  Search,
  Calendar,
  Filter,
  Download,
  RotateCcw,
  Tag,
  DollarSign,
  CreditCard,
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
    const options = [{ id: "ALL", label: "All Time / All Months" }];
    const date = new Date();

    for (let i = 0; i < 12; i++) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const id = `${year}-${month}`;
      const label = date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
      options.push({ id, label });
      date.setMonth(date.getMonth() - 1);
    }

    return options;
  }, []);

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
    <div className="p-4 border-b border-white/10 space-y-3 bg-white/[0.01]">
      {/* Row 1: Search & Month / Category / Payment Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            placeholder="Search by expense #, payee, notes, or ref..."
            className="w-full pl-9 pr-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-[#636366] focus:outline-none focus:border-[#30D158] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Robust Month Dropdown Filter (T50) */}
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#FF9F0A]" />
            <select
              value={filters.month}
              onChange={(e) => onFilterChange("month", e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer pr-2"
            >
              {monthOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-[#1C1C1E] text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Robust Category Filter (T50) */}
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5">
            <Tag className="w-3.5 h-3.5 text-[#64D2FF]" />
            <select
              value={filters.categoryId}
              onChange={(e) => onFilterChange("categoryId", e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer pr-2"
            >
              <option value="ALL" className="bg-[#1C1C1E] text-white">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id} className="bg-[#1C1C1E] text-white">
                  {cat.categoryName}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5">
            <CreditCard className="w-3.5 h-3.5 text-[#30D158]" />
            <select
              value={filters.paymentMethod}
              onChange={(e) => onFilterChange("paymentMethod", e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer pr-2"
            >
              <option value="ALL" className="bg-[#1C1C1E] text-white">All Methods</option>
              <option value="CASH" className="bg-[#1C1C1E] text-white">Cash</option>
              <option value="UPI" className="bg-[#1C1C1E] text-white">UPI</option>
              <option value="BANK_TRANSFER" className="bg-[#1C1C1E] text-white">Bank Transfer</option>
              <option value="CARD" className="bg-[#1C1C1E] text-white">Card</option>
              <option value="CHEQUE" className="bg-[#1C1C1E] text-white">Cheque</option>
              <option value="OTHER" className="bg-[#1C1C1E] text-white">Other</option>
            </select>
          </div>

          {/* CSV Statement Export */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 text-xs font-medium text-white flex items-center gap-1.5 transition-all cursor-pointer"
            title="Download CSV Statement"
          >
            <Download className="w-3.5 h-3.5 text-[#30D158]" />
            <span>Export CSV</span>
          </button>

          {/* Reset Filters */}
          {(filters.search ||
            filters.month !== "ALL" ||
            filters.categoryId !== "ALL" ||
            filters.paymentMethod !== "ALL" ||
            filters.startDate ||
            filters.endDate) && (
            <button
              type="button"
              onClick={onResetFilters}
              className="p-1.5 text-[#FF453A] hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              title="Reset All Filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Date Range Sub-Bar (if custom date range needed) */}
      <div className="flex items-center gap-2 flex-wrap text-xs text-[#8E8E93] pt-1 border-t border-white/5">
        <span>Custom Range:</span>
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => onFilterChange("startDate", e.target.value)}
          className="px-2.5 py-1 bg-black/40 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-[#0066CC] transition-colors [color-scheme:dark]"
        />
        <span>to</span>
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => onFilterChange("endDate", e.target.value)}
          className="px-2.5 py-1 bg-black/40 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-[#0066CC] transition-colors [color-scheme:dark]"
        />

        {/* Sort By Dropdown */}
        <div className="ml-auto flex items-center gap-1.5">
          <span>Sort By:</span>
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange("sortBy", e.target.value)}
            className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none cursor-pointer"
          >
            <option value="date_desc" className="bg-[#1C1C1E] text-white">Most Recent Date</option>
            <option value="date_asc" className="bg-[#1C1C1E] text-white">Oldest Date</option>
            <option value="amount_desc" className="bg-[#1C1C1E] text-white">Highest Amount</option>
            <option value="amount_asc" className="bg-[#1C1C1E] text-white">Lowest Amount</option>
          </select>
        </div>
      </div>
    </div>
  );
}
