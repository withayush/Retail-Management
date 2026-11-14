import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  Boxes,
} from "lucide-react";
import { useInventoryWarnings } from "../hooks/useInventoryWarnings";
import InventoryWarningSummary from "./InventoryWarningSummary";
import InventoryWarningItem from "./InventoryWarningItem";
import InventoryWarningSkeleton from "./InventoryWarningSkeleton";

/**
 * Phase 10 - Task T63: Inventory Warning Center Widget
 * Highlights urgent products needing replenishment directly on the dashboard.
 * Categorizes OUT_OF_STOCK and LOW_STOCK items, provides direct replenishment actions,
 * interactive filtering, and real-time empty/error states.
 */
export function InventoryWarningCenter({ className = "" }) {
  const navigate = useNavigate();
  const {
    summary,
    items,
    loading,
    refreshing,
    error,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    refresh,
  } = useInventoryWarnings({ initialLimit: 15 });

  if (loading && !refreshing) {
    return <InventoryWarningSkeleton />;
  }

  const totalWarnings = summary?.totalWarnings || 0;
  const outOfStock = summary?.outOfStock || 0;
  const lowStock = summary?.lowStock || 0;

  return (
    <div
      className={`p-6 bg-[#161617]/90 backdrop-blur-2xl border border-[#D2D2D7]/12 rounded-[18px] shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-6 ${className}`}
    >
      {/* ── 1. Widget Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D2D2D7]/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white tracking-tight">
                  Inventory Warning Center
                </h2>
                {totalWarnings > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                    {totalWarnings} {totalWarnings === 1 ? "Alert" : "Alerts"}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#86868B] mt-0.5">
                Automated stock surveillance: Immediate replenishment recommendations
              </p>
            </div>
          </div>
        </div>

        {/* Top Actions: Refresh + View All in Inventory */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            title="Refresh warnings"
            className="p-2 rounded-xl text-[#86868B] hover:text-white hover:bg-white/5 border border-white/5 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-sky-400" : ""}`}
            />
          </button>

          <Link
            to="/inventory"
            className="apple-btn-secondary text-xs py-1.5 px-3.5 flex items-center gap-1.5"
          >
            <span>Inventory Management</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── 2. Error Banner ── */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={refresh}
            className="underline font-semibold hover:text-white cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── 3. Summary Alert Cards / Filter Tabs ── */}
      <InventoryWarningSummary
        summary={summary}
        activeFilter={statusFilter}
        onSelectFilter={setStatusFilter}
      />

      {/* ── 4. Main Section: Urgent Replenishment List OR Empty State ── */}
      {totalWarnings === 0 ? (
        /* Empty State: All Stock Levels Healthy */
        <div className="p-8 rounded-2xl bg-gradient-to-b from-emerald-500/5 to-transparent border border-emerald-500/20 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white">
              All Stock Levels Healthy
            </h3>
            <p className="text-xs text-[#86868B] max-w-md mx-auto">
              Every tracked product in your store is comfortably above its reorder threshold. No out-of-stock or low-stock items detected.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/inventory")}
            className="apple-btn-secondary text-xs py-1.5 px-4 inline-flex items-center gap-1.5 mt-2 cursor-pointer"
          >
            <Package className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audit Full Inventory</span>
          </button>
        </div>
      ) : (
        /* Warning Items List */
        <div className="space-y-3.5">
          {/* Subheader with Product Count & Quick Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                Urgent replenishment
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-[#D2D2D7]">
                {items.length} {items.length === 1 ? "product" : "products"}
              </span>
            </div>

            {/* Micro Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6E73]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by product or SKU..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white/[0.04] border border-[#D2D2D7]/10 text-white placeholder-[#6E6E73] focus:outline-none focus:border-sky-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Items Container */}
          {items.length === 0 ? (
            <div className="p-8 rounded-xl bg-white/[0.02] border border-[#D2D2D7]/8 text-center text-xs text-[#86868B]">
              No products match the selected filter ({statusFilter === "OUT_OF_STOCK" ? "Out of Stock" : "Low Stock"}).
            </div>
          ) : (
            <div className="space-y-2.5">
              {items.map((item) => (
                <InventoryWarningItem
                  key={item._id || item.productId}
                  item={item}
                  onStockIn={() =>
                    navigate(
                      `/inventory?action=stock-in&productId=${item.productId}&search=${encodeURIComponent(
                        item.productName
                      )}`
                    )
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default InventoryWarningCenter;

