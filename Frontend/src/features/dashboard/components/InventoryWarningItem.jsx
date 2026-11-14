import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, AlertTriangle, ArrowUpRight, PlusCircle } from "lucide-react";

/**
 * Phase 10 - Task T63: Inventory Warning Item Component
 * Renders an individual product warning card with stock stats, deficit,
 * urgency badges, and quick-replenish action.
 */
export function InventoryWarningItem({ item, onStockIn }) {
  const navigate = useNavigate();

  if (!item) return null;

  const isOutOfStock = item.status === "OUT_OF_STOCK" || item.availableStock === 0;
  const unit = item.unit || "units";
  const reorderLevel = item.reorderLevel ?? 0;
  const availableStock = item.availableStock ?? 0;

  // Deficit to reach reorder target
  const deficit = item.deficit !== undefined ? item.deficit : Math.max(0, reorderLevel - availableStock);

  // Fill percentage for progress bar (capped at 100%)
  const percentage = reorderLevel > 0 ? Math.min(100, Math.round((availableStock / reorderLevel) * 100)) : 0;

  const handleNavigateToInventory = () => {
    // Navigate to Inventory page pre-filtered or searching this product
    if (item.productName) {
      navigate(`/inventory?search=${encodeURIComponent(item.productName)}`);
    } else {
      navigate("/inventory");
    }
  };

  return (
    <div
      onClick={handleNavigateToInventory}
      className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-[#D2D2D7]/10 hover:border-[#D2D2D7]/20 rounded-xl transition-all duration-200 cursor-pointer gap-4"
    >
      {/* Left: Urgency Badge + Product Info */}
      <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
        {/* Status Badge: OUT or LOW */}
        <div
          className={`shrink-0 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase border flex items-center gap-1 ${
            isOutOfStock
              ? "bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.15)]"
              : "bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]"
          }`}
        >
          {isOutOfStock ? (
            <>
              <AlertCircle className="w-3 h-3" />
              <span>OUT</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3 h-3" />
              <span>LOW</span>
            </>
          )}
        </div>

        {/* Product Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-white truncate group-hover:text-sky-400 transition-colors">
              {item.productName}
            </h4>
            {item.sku && (
              <span className="font-mono text-[10px] text-[#86868B] bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/5">
                {item.sku}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-[#A1A1A6]">
            <span>
              Available: <strong className="text-white font-medium">{availableStock}</strong>
            </span>
            <span className="text-[#555]">·</span>
            <span>
              Reorder at: <strong className="text-white font-medium">{reorderLevel}</strong>
            </span>
            {deficit > 0 && (
              <>
                <span className="text-[#555]">·</span>
                <span className="text-rose-400 font-medium">
                  Need {deficit} {unit}
                </span>
              </>
            )}
          </div>

          {/* Micro Progress Bar */}
          <div className="w-full max-w-xs mt-2 bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isOutOfStock ? "bg-rose-500 w-0" : "bg-amber-400"
              }`}
              style={{ width: `${isOutOfStock ? 0 : Math.max(5, percentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Right: Stock Count Pill & Action Button */}
      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
        <div className="text-right">
          <span
            className={`inline-block text-sm font-bold font-mono ${
              isOutOfStock ? "text-rose-400" : "text-amber-400"
            }`}
          >
            {availableStock} {unit}
          </span>
          <p className="text-[10px] text-[#6E6E73] capitalize">
            {isOutOfStock ? "Zero Stock" : `${percentage}% of threshold`}
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onStockIn) {
              onStockIn(item);
            } else {
              handleNavigateToInventory();
            }
          }}
          title="Replenish Stock in Inventory"
          className="apple-btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 hover:border-sky-500/40 hover:text-white transition-all cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5 text-sky-400" />
          <span>Replenish</span>
          <ArrowUpRight className="w-3 h-3 text-[#6E6E73] group-hover:text-white transition-colors" />
        </button>
      </div>
    </div>
  );
}

export default InventoryWarningItem;

