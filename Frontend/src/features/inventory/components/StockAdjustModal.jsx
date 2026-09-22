import React from "react";
import { PackageCheck, X } from "lucide-react";

export default function StockAdjustModal({
  isOpen,
  onClose,
  activeItem,
  newStockValue,
  setNewStockValue,
  actionSource,
  setActionSource,
  actionReferenceNumber,
  setActionReferenceNumber,
  actionReason,
  setActionReason,
  actionNotes,
  setActionNotes,
  submitting,
  onSubmit,
}) {
  if (!isOpen || !activeItem) return null;

  const currentStock = activeItem.availableStock || 0;
  const targetCount = parseFloat(newStockValue);
  const discrepancy = !isNaN(targetCount) ? targetCount - currentStock : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#111113] border border-[#27272a] rounded-2xl p-5 max-w-lg w-full shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#1f1f23] pb-3">
          <h3 className="font-semibold text-sm text-white flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-zinc-300" /> Physical Stock Reconciliation
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product Header & Live Comparison */}
        <div className="bg-[#141417] border border-[#27272a] p-3.5 rounded-xl space-y-2 text-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-white text-sm">{activeItem.name}</p>
              <p className="text-zinc-400 font-mono text-[11px]">SKU: {activeItem.sku}</p>
            </div>
            <span className="text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700 font-medium px-2 py-0.5 rounded">
              {activeItem.category?.name || "General"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#1f1f23] text-center font-mono">
            <div className="bg-[#111113] p-2 rounded-lg border border-[#27272a]">
              <span className="text-[10px] text-zinc-400 block">System Stock</span>
              <strong className="text-white text-xs">{currentStock} {activeItem.unit}</strong>
            </div>
            <div className="bg-[#111113] p-2 rounded-lg border border-[#27272a]">
              <span className="text-[10px] text-zinc-400 block">Physical Count</span>
              <strong className="text-zinc-200 text-xs">{!isNaN(targetCount) ? targetCount : "—"} {activeItem.unit}</strong>
            </div>
            <div className={`p-2 rounded-lg border font-semibold text-xs ${
              discrepancy > 0
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : discrepancy < 0
                ? "bg-red-500/10 text-red-400 border-red-500/20"
                : "bg-[#111113] text-zinc-400 border-[#27272a]"
            }`}>
              <span className="text-[10px] opacity-80 block font-normal">Discrepancy</span>
              {discrepancy > 0 ? `+${discrepancy}` : discrepancy} {activeItem.unit}
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5">
          {/* Physical Count Input */}
          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1">
              New Physical Count ({activeItem.unit}):
            </label>
            <input
              type="number"
              step="any"
              min="0"
              required
              value={newStockValue}
              onChange={(e) => setNewStockValue(e.target.value)}
              className="w-full bg-[#141417] border border-[#27272a] rounded-lg px-3 py-1.5 text-sm font-mono font-bold text-zinc-100 focus:outline-none focus:border-zinc-500"
              placeholder="Enter physical count"
              autoFocus
            />
          </div>

          {/* Reason Category / Source */}
          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1">
              Adjustment Reason / Category:
            </label>
            <select
              value={actionSource}
              onChange={(e) => setActionSource(e.target.value)}
              className="w-full bg-[#141417] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
            >
              <option value="AUDIT_RECONCILIATION">Physical Store Audit (Periodic Count)</option>
              <option value="DAMAGE">Damaged / Broken Goods Write-Off</option>
              <option value="EXPIRED">Expired Stock Discard</option>
              <option value="SPILLAGE">Spillage / Leakage Loss</option>
              <option value="THEFT_SHRINKAGE">Theft / Shrinkage Discrepancy</option>
              <option value="FOUND_STOCK">Found Unrecorded Stock (Surplus)</option>
              <option value="CORRECTION">Recount / Data Entry Correction</option>
              <option value="MANUAL">Manual Stock Adjustment</option>
              <option value="OTHER">Other Reason</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Audit Reference # */}
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">
                Audit Ref / Batch # (Optional):
              </label>
              <input
                type="text"
                value={actionReferenceNumber}
                onChange={(e) => setActionReferenceNumber(e.target.value)}
                className="w-full bg-[#141417] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
                placeholder="e.g. AUDIT-2026-Q1"
              />
            </div>

            {/* Custom Reason */}
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">
                Reason Description (Optional):
              </label>
              <input
                type="text"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full bg-[#141417] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
                placeholder="e.g. Broken packaging"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1">
              Auditor Notes (Optional):
            </label>
            <textarea
              rows={2}
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              className="w-full bg-[#141417] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
              placeholder="e.g. Verified and approved"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#1f1f23]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-[#27272a] bg-[#141417] hover:bg-zinc-800 text-zinc-300 font-medium text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-900 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Reconciling..." : "Save Reconciliation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
