import React from "react";
import { Minus, X } from "lucide-react";

export default function StockOutModal({
  isOpen,
  onClose,
  activeItem,
  storeState,
  selectedProductId,
  setSelectedProductId,
  actionQuantity,
  setActionQuantity,
  actionSource,
  setActionSource,
  actionReason,
  setActionReason,
  actionReferenceNumber,
  setActionReferenceNumber,
  actionNotes,
  setActionNotes,
  submitting,
  onSubmit,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#111113] border border-[#27272a] rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#1f1f23] pb-3">
          <h3 className="font-semibold text-sm text-white flex items-center gap-2">
            <Minus className="w-4 h-4 text-red-400" /> Stock Out (Deduction / Dispatch)
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5">
          {/* Product Select if not preset */}
          {!activeItem ? (
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">
                Select Product:
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                required
                className="w-full bg-[#141417] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
              >
                {storeState.map((p) => (
                  <option key={p.productId} value={p.productId}>
                    {p.name} ({p.sku}) — Available: {p.availableStock} {p.unit}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="bg-[#141417] border border-[#27272a] p-3 rounded-lg space-y-1 text-xs">
              <p className="font-semibold text-white">{activeItem.name}</p>
              <p className="text-zinc-400 font-mono">SKU: {activeItem.sku}</p>
              <p className="text-zinc-400">
                Available Stock: <strong className="text-white">{activeItem.availableStock} {activeItem.unit}</strong>
              </p>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1">
              Stock Out Quantity (-):
            </label>
            <input
              type="number"
              step="any"
              min="0.01"
              required
              value={actionQuantity}
              onChange={(e) => setActionQuantity(e.target.value)}
              className="w-full bg-[#141417] border border-[#27272a] rounded-lg px-3 py-1.5 text-sm font-mono text-zinc-100 focus:outline-none focus:border-zinc-500"
              placeholder="e.g. 5"
              autoFocus
            />
          </div>

          {/* Source Type */}
          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1">
              Stock-Out Source / Category:
            </label>
            <select
              value={actionSource}
              onChange={(e) => setActionSource(e.target.value)}
              className="w-full bg-[#141417] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
            >
              <option value="SALE">Customer Sale / POS Bill</option>
              <option value="DAMAGE">Damaged / Broken Packaging</option>
              <option value="EXPIRED">Expired Goods Write-Off</option>
              <option value="RETURN_TO_VENDOR">Return to Vendor / Supplier</option>
              <option value="SAMPLE">Store Demonstration / Internal Sample</option>
              <option value="MANUAL">Manual Stock Deduction</option>
              <option value="OTHER">Other / Discrepancy</option>
            </select>
          </div>

          {/* Reference # */}
          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1">
              Invoice / Bill / Reference # (Optional):
            </label>
            <input
              type="text"
              value={actionReferenceNumber}
              onChange={(e) => setActionReferenceNumber(e.target.value)}
              className="w-full bg-[#141417] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
              placeholder="e.g. INV-2026-1001 or DMG-01"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1">
              Reason Description:
            </label>
            <input
              type="text"
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              className="w-full bg-[#141417] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
              placeholder="e.g. Counter sale or broken during unloading"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1">
              Additional Notes (Optional):
            </label>
            <input
              type="text"
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              className="w-full bg-[#141417] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
              placeholder="e.g. Discarded in garbage / batch #B10"
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
              className="px-4 py-1.5 rounded-lg bg-red-500 text-white font-semibold text-xs hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Recording..." : "Record Stock Out"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
