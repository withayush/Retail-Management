import React from "react";
import { Plus, X } from "lucide-react";

export default function StockInModal({
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
  actionSupplier,
  setActionSupplier,
  actionUnitCost,
  setActionUnitCost,
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
            <Plus className="w-4 h-4 text-emerald-400" /> Stock In (Purchase / Restock)
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
                Current Stock: <strong className="text-white">{activeItem.availableStock} {activeItem.unit}</strong>
              </p>
            </div>
          )}

          {/* Source Type */}
          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1">
              Stock-In Source:
            </label>
            <select
              value={actionSource}
              onChange={(e) => setActionSource(e.target.value)}
              className="w-full bg-[#141417] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
            >
              <option value="PURCHASE">Supplier Purchase / Invoice</option>
              <option value="GOODS_RECEIPT">Goods Receipt Note (GRN)</option>
              <option value="MANUAL">Manual Stock Addition</option>
              <option value="RETURN">Customer Return Restock</option>
              <option value="TRANSFER">Stock Transfer</option>
              <option value="OTHER">Other / Miscellaneous</option>
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1">
              Stock In Quantity (+):
            </label>
            <input
              type="number"
              step="any"
              min="0.01"
              required
              value={actionQuantity}
              onChange={(e) => setActionQuantity(e.target.value)}
              className="w-full bg-[#141417] border border-[#27272a] rounded-lg px-3 py-1.5 text-sm font-mono text-zinc-100 focus:outline-none focus:border-zinc-500"
              placeholder="e.g. 50"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Supplier */}
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">
                Supplier Name (Optional):
              </label>
              <input
                type="text"
                value={actionSupplier}
                onChange={(e) => setActionSupplier(e.target.value)}
                className="w-full bg-[#141417] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
                placeholder="e.g. Wholesaler"
              />
            </div>

            {/* Unit Cost */}
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">
                Purchase Price / Unit (₹):
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={actionUnitCost}
                onChange={(e) => setActionUnitCost(e.target.value)}
                className="w-full bg-[#141417] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
                placeholder="e.g. 10.50"
              />
            </div>
          </div>

          {/* Reference # */}
          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1">
              PO / Bill / Challan Ref # (Optional):
            </label>
            <input
              type="text"
              value={actionReferenceNumber}
              onChange={(e) => setActionReferenceNumber(e.target.value)}
              className="w-full bg-[#141417] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
              placeholder="e.g. PO-8819 or INV-1002"
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
              placeholder="e.g. Good condition"
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
              className="px-4 py-1.5 rounded-lg bg-emerald-500 text-zinc-950 font-semibold text-xs hover:bg-emerald-400 transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Recording..." : "Record Stock In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
