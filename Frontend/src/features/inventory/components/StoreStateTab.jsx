import React from "react";
import {
  Search,
  X,
  Boxes,
  Layers,
  Edit2,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Minus,
  ArrowRightLeft,
  History,
} from "lucide-react";

export default function StoreStateTab({
  storeState = [],
  loading = false,
  searchTerm = "",
  setSearchTerm,
  stockStatusFilter = "ALL",
  setStockStatusFilter,
  onOpenStockIn,
  onOpenStockOut,
  onOpenAdjust,
  onOpenReorder,
  onOpenInspectLedger,
}) {
  return (
    <div className="space-y-4">
      {/* Search & Stock Status Filters */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, SKU or category..."
            className="w-full bg-background border border-border rounded-xl pl-10 pr-8 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { label: "All Items", value: "ALL" },
            { label: "In Stock", value: "IN_STOCK" },
            { label: "Low Stock", value: "LOW_STOCK" },
            { label: "Out of Stock", value: "OUT_OF_STOCK" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStockStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer border ${
                stockStatusFilter === tab.value
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-muted-foreground hover:text-foreground border-border hover:bg-secondary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Store State Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                <th className="py-3 px-4">Product & Category</th>
                <th className="py-3 px-4">SKU / Code</th>
                <th className="py-3 px-4 text-right">Selling / Cost</th>
                <th className="py-3 px-4 text-center">Current Stock</th>
                <th className="py-3 px-4 text-center">Reorder Threshold</th>
                <th className="py-3 px-4 text-right">Valuation (Cost)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      <span className="font-medium">Loading inventory store state...</span>
                    </div>
                  </td>
                </tr>
              ) : storeState.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <Boxes className="w-10 h-10 opacity-40" />
                      <p className="font-semibold text-foreground text-sm">No Inventory Records Found</p>
                      <p className="text-xs">No products match current filter conditions.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                storeState.map((item) => {
                  const isOutOfStock = item.stockStatus === "OUT_OF_STOCK";
                  const isLowStock = item.stockStatus === "LOW_STOCK";

                  return (
                    <tr key={item.productId} className="hover:bg-secondary/30 transition-colors">
                      {/* Product Name & Category */}
                      <td className="py-3 px-4 align-middle">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-foreground text-xs">{item.name}</span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Layers className="w-2.5 h-2.5 text-primary" />
                            {item.category?.name || "Uncategorized"}
                          </span>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-4 align-middle font-mono text-[11px] text-muted-foreground">
                        <span className="bg-secondary px-2 py-0.5 rounded border border-border text-foreground font-semibold">
                          {item.sku}
                        </span>
                      </td>

                      {/* Pricing */}
                      <td className="py-3 px-4 text-right align-middle font-mono">
                        <span className="font-bold text-foreground block">
                          ₹{(item.sellingPrice || 0).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Cost: ₹{(item.costPrice || 0).toFixed(2)}
                        </span>
                      </td>

                      {/* Available Stock */}
                      <td className="py-3 px-4 text-center align-middle font-mono">
                        <span
                          className={`font-bold text-sm px-2 py-0.5 rounded-lg border ${
                            isOutOfStock
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : isLowStock
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          }`}
                        >
                          {item.availableStock} {item.unit}
                        </span>
                      </td>

                      {/* Reorder Level */}
                      <td className="py-3 px-4 text-center align-middle font-mono">
                        <button
                          onClick={() => onOpenReorder(item)}
                          className="inline-flex items-center gap-1 text-xs hover:text-primary transition-colors cursor-pointer"
                          title="Click to change reorder threshold"
                        >
                          <span>{item.reorderLevel} {item.unit}</span>
                          <Edit2 className="w-3 h-3 opacity-60 hover:opacity-100" />
                        </button>
                      </td>

                      {/* Valuation */}
                      <td className="py-3 px-4 text-right align-middle font-mono font-bold text-foreground">
                        ₹{(item.valuation || 0).toFixed(2)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center align-middle">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-destructive/10 text-destructive px-2 py-0.5 rounded-full border border-destructive/20">
                            <XCircle className="w-3 h-3" /> Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 animate-pulse">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> In Stock
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right align-middle">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Stock IN */}
                          <button
                            onClick={() => onOpenStockIn(item)}
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all cursor-pointer"
                            title="Stock In / Purchase Addition (+)"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          {/* Stock OUT */}
                          <button
                            onClick={() => onOpenStockOut(item)}
                            className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 transition-all cursor-pointer"
                            title="Stock Out / Deduction (-)"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          {/* Adjust / Reconcile */}
                          <button
                            onClick={() => onOpenAdjust(item)}
                            className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-all cursor-pointer"
                            title="Adjust / Physical Count Reconciliation"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>

                          {/* Drill-down Ledger Inspector */}
                          <button
                            onClick={() => onOpenInspectLedger(item)}
                            className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground border border-border hover:bg-secondary/80 transition-all cursor-pointer"
                            title="Inspect Item Movement Audit History"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
