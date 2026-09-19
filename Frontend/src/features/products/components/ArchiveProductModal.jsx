import React from "react";
import { Archive, Loader2, AlertTriangle } from "lucide-react";
import ProductModal from "./ProductModal";

export default function ArchiveProductModal({
  open,
  onClose,
  archiveTarget,
  onArchive,
  submitting,
}) {
  return (
    <ProductModal open={open} onClose={onClose} title="Archive Product" icon={Archive}>
      <div className="space-y-4">
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Archive Product Confirmation</span>
          </div>
          <p className="text-sm text-foreground font-medium">
            Are you sure you want to archive{" "}
            <span className="text-amber-400 font-bold underline">
              {archiveTarget?.name}
            </span>
            ?
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This product will be hidden from active POS and quick sale selectors. All historical invoices, audit trails, and tax reports will remain 100% intact and unaffected.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onClose}
            type="button"
            className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onArchive}
            disabled={submitting}
            type="button"
            className="flex-1 px-4 py-2.5 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-destructive/20"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirm Archive
          </button>
        </div>
      </div>
    </ProductModal>
  );
}
