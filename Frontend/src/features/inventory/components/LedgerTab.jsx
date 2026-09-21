import React from "react";
import {
  Search,
  X,
  Boxes,
  Filter,
  Download,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Receipt,
  User,
} from "lucide-react";
import { MOVEMENT_TYPES, STOCK_SOURCES } from "../utils/inventory.utils";

export default function LedgerTab({
  ledgerEntries = [],
  ledgerSummary = { totalEntries: 0, totalInQty: 0, totalOutQty: 0, netFlowQty: 0 },
  ledgerPagination = { page: 1, totalPages: 1, total: 0 },
  storeState = [],
  loading = false,
  ledgerSearchTerm = "",
  setLedgerSearchTerm,
  selectedProductFilter = "ALL",
  setSelectedProductFilter,
  ledgerSourceFilter = "ALL",
  setLedgerSourceFilter,
  ledgerTypeFilter = "ALL",
  setLedgerTypeFilter,
  ledgerDatePreset = "ALL",
  setLedgerDatePreset,
  customStartDate = "",
  setCustomStartDate,
  customEndDate = "",
  setCustomEndDate,
  ledgerPage = 1,
  setLedgerPage,
  onExportCSV,
}) {
  return (
    <div className="space-y-4">
      {/* ── Filter Control Deck & Search ──────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3">
        {/* Top Row: Search & Selectors */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Reference / Actor / Note Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by Reference #, Reason, Supplier, User, or Notes..."
              value={ledgerSearchTerm}
              onChange={(e) => {
                setLedgerSearchTerm(e.target.value);
                setLedgerPage(1);
              }}
              className="w-full bg-secondary/50 border border-border rounded-xl pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {ledgerSearchTerm && (
              <button
                onClick={() => {
                  setLedgerSearchTerm("");
                  setLedgerPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Product Selector */}
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-muted-foreground shrink-0" />
            <select
              value={selectedProductFilter}
              onChange={(e) => {
                setSelectedProductFilter(e.target.value);
                setLedgerPage(1);
              }}
              className="bg-secondary/50 border border-border rounded-xl px-3 py-2 text-xs text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer max-w-[200px] truncate"
            >
              <option value="ALL">📦 All Products</option>
              {storeState.map((item) => (
                <option key={item.productId} value={item.productId}>
                  {item.name || item.productName} ({item.sku || "No SKU"})
                </option>
              ))}
            </select>
          </div>

          {/* Source Category Selector */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <select
              value={ledgerSourceFilter}
              onChange={(e) => {
                setLedgerSourceFilter(e.target.value);
                setLedgerPage(1);
              }}
              className="bg-secondary/50 border border-border rounded-xl px-3 py-2 text-xs text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
            >
              {STOCK_SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* CSV Statement Export */}
          <button
            onClick={onExportCSV}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
            title="Export Statement as CSV"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Middle Row: Movement Type Pills & Date Preset Tabs */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pt-2 border-t border-border/50">
          {/* Movement Type Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mr-1">
              Type:
            </span>
            {MOVEMENT_TYPES.map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setLedgerTypeFilter(tab.value);
                  setLedgerPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer border ${
                  ledgerTypeFilter === tab.value
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-secondary/40 text-muted-foreground hover:text-foreground border-border hover:bg-secondary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Date Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground mr-1 shrink-0" />
            {[
              { label: "All Time", value: "ALL" },
              { label: "Today", value: "TODAY" },
              { label: "7 Days", value: "LAST_7_DAYS" },
              { label: "30 Days", value: "LAST_30_DAYS" },
              { label: "Custom", value: "CUSTOM" },
            ].map((preset) => (
              <button
                key={preset.value}
                onClick={() => {
                  setLedgerDatePreset(preset.value);
                  setLedgerPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer border ${
                  ledgerDatePreset === preset.value
                    ? "bg-foreground text-background border-foreground font-semibold"
                    : "bg-secondary/40 text-muted-foreground hover:text-foreground border-border"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range Selector */}
        {ledgerDatePreset === "CUSTOM" && (
          <div className="flex items-center gap-3 pt-2 border-t border-border/40 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground font-medium">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => {
                  setCustomStartDate(e.target.value);
                  setLedgerPage(1);
                }}
                className="bg-secondary/60 border border-border rounded-lg px-2.5 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground font-medium">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => {
                  setCustomEndDate(e.target.value);
                  setLedgerPage(1);
                }}
                className="bg-secondary/60 border border-border rounded-lg px-2.5 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Statement Summary KPI Bar ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-[11px] font-medium">
            <span>Total Inflow</span>
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-lg font-bold font-mono text-emerald-400 mt-1">
            +{ledgerSummary.totalInQty || 0}
          </p>
          <span className="text-[10px] text-muted-foreground">Units Added</span>
        </div>

        <div className="bg-card border border-border rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-[11px] font-medium">
            <span>Total Outflow</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-destructive" />
          </div>
          <p className="text-lg font-bold font-mono text-destructive mt-1">
            -{ledgerSummary.totalOutQty || 0}
          </p>
          <span className="text-[10px] text-muted-foreground">Units Sold / Dispatched</span>
        </div>

        <div className="bg-card border border-border rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-[11px] font-medium">
            <span>Net Stock Flow</span>
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
          </div>
          <p
            className={`text-lg font-bold font-mono mt-1 ${
              (ledgerSummary.netFlowQty || 0) > 0
                ? "text-emerald-400"
                : (ledgerSummary.netFlowQty || 0) < 0
                ? "text-destructive"
                : "text-foreground"
            }`}
          >
            {(ledgerSummary.netFlowQty || 0) > 0
              ? `+${ledgerSummary.netFlowQty}`
              : ledgerSummary.netFlowQty || 0}
          </p>
          <span className="text-[10px] text-muted-foreground">Delta Net Variance</span>
        </div>

        <div className="bg-card border border-border rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-[11px] font-medium">
            <span>Audited Movements</span>
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          </div>
          <p className="text-lg font-bold font-mono text-foreground mt-1">
            {ledgerPagination.total || ledgerSummary.totalEntries || 0}
          </p>
          <span className="text-[10px] text-muted-foreground">Logged Transactions</span>
        </div>
      </div>

      {/* ── Ledger Trail Table (Who, When, Why, What) ─────────────────────── */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                <th className="py-3 px-4">When (Date & Time)</th>
                <th className="py-3 px-4">What (Product)</th>
                <th className="py-3 px-4 text-center">Movement Type</th>
                <th className="py-3 px-4 text-center">Qty Change</th>
                <th className="py-3 px-4 text-center">Balance After</th>
                <th className="py-3 px-4">Why (Reason & Ref)</th>
                <th className="py-3 px-4">Who (Actor)</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      <span className="font-medium">Loading ledger audit log entries...</span>
                    </div>
                  </td>
                </tr>
              ) : ledgerEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <Boxes className="w-10 h-10 opacity-40" />
                      <p className="font-semibold text-foreground text-sm">No Ledger Entries Found</p>
                      <p className="text-xs">No stock movement matches your active filter criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                ledgerEntries.map((entry) => {
                  const isPositive = entry.qtyChange > 0;
                  const isZero = entry.qtyChange === 0;

                  return (
                    <tr key={entry._id || entry.id} className="hover:bg-secondary/30 transition-colors">
                      {/* When */}
                      <td className="py-3 px-4 align-middle whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                        <span className="text-foreground block font-medium">
                          {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span className="text-[10px]">
                          {new Date(entry.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>

                      {/* What (Product) */}
                      <td className="py-3 px-4 align-middle">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-foreground text-xs">
                            {entry.productId?.name || "Deleted / Unknown Product"}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {entry.productId?.sku || "No SKU"}
                          </span>
                        </div>
                      </td>

                      {/* Movement Type */}
                      <td className="py-3 px-4 text-center align-middle">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            entry.type === "IN"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : entry.type === "OUT"
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : entry.type === "OPENING"
                              ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {entry.type}
                        </span>
                      </td>

                      {/* Qty Change */}
                      <td className="py-3 px-4 text-center align-middle font-mono font-bold text-xs">
                        <span
                          className={
                            isPositive
                              ? "text-emerald-400"
                              : isZero
                              ? "text-muted-foreground"
                              : "text-destructive"
                          }
                        >
                          {isPositive ? `+${entry.qtyChange}` : entry.qtyChange}
                        </span>
                      </td>

                      {/* Balance After */}
                      <td className="py-3 px-4 text-center align-middle font-mono font-semibold text-foreground text-xs">
                        {entry.balanceAfter}
                      </td>

                      {/* Why (Reason, Source, Reference) */}
                      <td className="py-3 px-4 align-middle">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-foreground font-medium truncate max-w-[200px]">
                            {entry.reason || entry.source}
                          </span>
                          {entry.referenceNumber && (
                            <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                              <Receipt className="w-2.5 h-2.5" /> Ref: {entry.referenceNumber}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Who (Actor) */}
                      <td className="py-3 px-4 align-middle text-muted-foreground">
                        <span className="flex items-center gap-1 text-xs truncate max-w-[140px]">
                          <User className="w-3 h-3 text-primary shrink-0" />
                          <span>{entry.createdByName || entry.createdBy?.fullName || "System Admin"}</span>
                        </span>
                      </td>

                      {/* Notes */}
                      <td className="py-3 px-4 align-middle text-muted-foreground italic text-[11px] truncate max-w-[150px]">
                        {entry.notes || "--"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {ledgerPagination.totalPages > 1 && (
          <div className="p-3 border-t border-border bg-secondary/20 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Page {ledgerPagination.page} of {ledgerPagination.totalPages} ({ledgerPagination.total} total)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setLedgerPage((p) => Math.max(p - 1, 1))}
                disabled={ledgerPage <= 1}
                className="p-1.5 rounded-lg border border-border bg-background hover:bg-secondary disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLedgerPage((p) => Math.min(p + 1, ledgerPagination.totalPages))}
                disabled={ledgerPage >= ledgerPagination.totalPages}
                className="p-1.5 rounded-lg border border-border bg-background hover:bg-secondary disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
