import React from "react";
import { Edit2, X } from "lucide-react";

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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in-50 zoom-in-95">
        <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-2 text-primary">
            <Edit2 className="w-4 h-4" />
            <h3 className="font-bold text-sm text-foreground">Set Reorder Threshold</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-4 space-y-3.5 text-xs">
          <div>
            <p className="font-bold text-foreground text-xs">{activeItem.name}</p>
            <p className="text-[11px] text-muted-foreground font-mono">SKU: {activeItem.sku}</p>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase">
              Minimum Alert Level ({activeItem.unit}) *
            </label>
            <input
              type="number"
              step="any"
              min="0"
              required
              placeholder="e.g. 10"
              value={newReorderValue}
              onChange={(e) => setNewReorderValue(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground font-mono font-bold focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-[10px] text-muted-foreground">
              When stock drops to or below this amount, low-stock warnings will trigger automatically.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-secondary cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-sm cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Update Threshold"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
