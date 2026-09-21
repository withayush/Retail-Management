import React from "react";
import { ArrowRightLeft, X } from "lucide-react";

export default function AdjustStockModal({
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

  const current = activeItem.availableStock || 0;
  const target = parseFloat(newStockValue) || 0;
  const discrepancy = target - current;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in-50 zoom-in-95">
        <div className="flex items-center justify-between p-4 border-b border-border bg-amber-500/10">
          <div className="flex items-center gap-2 text-amber-400">
            <ArrowRightLeft className="w-4 h-4" />
            <h3 className="font-bold text-sm text-foreground">Stock Reconciliation & Adjustment</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-4 space-y-3.5 text-xs">
          {/* Target Product */}
          <div className="p-3 rounded-xl bg-secondary/50 border border-border flex items-center justify-between">
            <div>
              <p className="font-bold text-foreground text-xs">{activeItem.name}</p>
              <p className="text-[11px] text-muted-foreground font-mono">SKU: {activeItem.sku}</p>
            </div>
            <span className="text-xs font-mono font-bold text-primary">
              Current System Count: {current} {activeItem.unit}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Physical Stock Count */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                New Physical Count *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                placeholder="Actual counted stock"
                value={newStockValue}
                onChange={(e) => setNewStockValue(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground font-mono font-bold focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Reconciliation Reason Category */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                Audit Category *
              </label>
              <select
                value={actionSource}
                onChange={(e) => setActionSource(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="AUDIT_RECONCILIATION">Physical Audit Reconciliation</option>
                <option value="DAMAGE">Damaged / Broken Goods</option>
                <option value="EXPIRED">Expired Inventory Discard</option>
                <option value="SPILLAGE">Spillage / Leakage Loss</option>
                <option value="THEFT_SHRINKAGE">Theft / Shrinkage</option>
                <option value="FOUND_STOCK">Found Unrecorded Stock</option>
                <option value="CORRECTION">Count Error Correction</option>
              </select>
            </div>
          </div>

          {/* Real-time Discrepancy Indicator */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between font-mono ${
              discrepancy === 0
                ? "bg-secondary/40 border-border text-muted-foreground"
                : discrepancy > 0
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-destructive/10 border-destructive/20 text-destructive"
            }`}
          >
            <span className="text-[11px] font-sans font-medium">Net Discrepancy (Delta):</span>
            <span className="text-sm font-bold">
              {discrepancy >= 0 ? `+${discrepancy}` : discrepancy} {activeItem.unit}
            </span>
          </div>

          {/* Reference Number */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase">
              Audit Reference / Memo #
            </label>
            <input
              type="text"
              placeholder="e.g. AUDIT-2026-SEP"
              value={actionReferenceNumber}
              onChange={(e) => setActionReferenceNumber(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Specific Reason */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase">
              Specific Reason
            </label>
            <input
              type="text"
              placeholder="e.g. Found 2 extra units during shelf audit"
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase">Notes</label>
            <textarea
              rows={2}
              placeholder="Audit remarks or investigation comments..."
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Footer Actions */}
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
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Reconciling..." : "Save Reconciliation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
