import React from "react";
import { SlidersHorizontal, X } from "lucide-react";

export default function ReorderLevelModal({
  isOpen,
  onClose,
  activeItem,
  newReorderValue,
  setNewReorderValue,
  submitting,
  onSubmit,
}) {
  if (!isOpen || !activeItem) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#111113] border border-[#27272a] rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#1f1f23] pb-3">
          <h3 className="font-semibold text-sm text-white flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-zinc-300" /> Low Stock Reorder Threshold
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-[#141417] border border-[#27272a] p-3 rounded-lg space-y-1 text-xs">
          <p className="font-semibold text-white">{activeItem.name}</p>
          <p className="text-zinc-400 font-mono">SKU: {activeItem.sku}</p>
          <p className="text-zinc-400">
            Current Level: <strong className="text-white">{activeItem.reorderLevel} {activeItem.unit}</strong>
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1">
              Set Reorder Alert Threshold ({activeItem.unit}):
            </label>
            <p className="text-[11px] text-zinc-500 mb-2">
              When available physical stock drops to or below this quantity, a low stock warning will be triggered.
            </p>
            <input
              type="number"
              step="any"
              min="0"
              required
              value={newReorderValue}
              onChange={(e) => setNewReorderValue(e.target.value)}
              className="w-full bg-[#141417] border border-[#27272a] rounded-lg px-3 py-1.5 text-sm font-mono font-bold text-zinc-100 focus:outline-none focus:border-zinc-500"
              placeholder="e.g. 10"
              autoFocus
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
              {submitting ? "Updating..." : "Update Threshold"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
