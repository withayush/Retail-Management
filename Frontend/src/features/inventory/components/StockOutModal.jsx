import React from "react";
import { Minus, X } from "lucide-react";

export default function StockOutModal({
  isOpen,
  onClose,
  activeItem,
  storeState = [],
  selectedProductId,
  setSelectedProductId,
  actionQuantity,
  setActionQuantity,
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in-50 zoom-in-95">
        <div className="flex items-center justify-between p-4 border-b border-border bg-destructive/10">
          <div className="flex items-center gap-2 text-destructive">
            <Minus className="w-4 h-4" />
            <h3 className="font-bold text-sm text-foreground">Record Stock Out / Deduction</h3>
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
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase">
              Target Product *
            </label>
            {activeItem ? (
              <div className="p-2.5 rounded-xl bg-secondary/50 border border-border flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground text-xs">{activeItem.name}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">SKU: {activeItem.sku}</p>
                </div>
                <span className="text-xs font-mono font-bold text-destructive">
                  Available: {activeItem.availableStock} {activeItem.unit}
                </span>
              </div>
            ) : (
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select a product...</option>
                {storeState.map((p) => (
                  <option key={p.productId} value={p.productId}>
                    {p.name} ({p.sku}) — {p.availableStock} available
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Quantity */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                Deduct Qty *
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                placeholder="e.g. 5"
                value={actionQuantity}
                onChange={(e) => setActionQuantity(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Source Type */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                Reason Category *
              </label>
              <select
                value={actionSource}
                onChange={(e) => setActionSource(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="SALE">Direct Sale</option>
                <option value="DAMAGE">Damaged Goods</option>
                <option value="EXPIRED">Expired Inventory</option>
                <option value="RETURN_TO_VENDOR">Return to Vendor</option>
                <option value="SAMPLE">Sample / Store Use</option>
                <option value="OTHER">Other Deduction</option>
              </select>
            </div>
          </div>

          {/* Reference # */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase">
              Invoice / Sales Ref #
            </label>
            <input
              type="text"
              placeholder="e.g. INV-2026-001"
              value={actionReferenceNumber}
              onChange={(e) => setActionReferenceNumber(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Reason */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase">
              Specific Reason / Description
            </label>
            <input
              type="text"
              placeholder="e.g. Broken packaging during shelf restocking"
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
              placeholder="Additional internal audit notes..."
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
              className="px-4 py-2 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Processing..." : "Deduct from Stock (-)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
