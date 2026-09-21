import React from "react";
import { CheckCircle2, X, Receipt } from "lucide-react";

export default function POSReceiptModal({
  isOpen,
  onClose,
  invoice,
}) {
  if (!isOpen || !invoice) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl animate-in fade-in-50 zoom-in-95">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-foreground">Sale Completed!</h3>
          <p className="text-xs text-muted-foreground">Invoice #{invoice.invoiceNumber}</p>
        </div>

        {/* Invoice Summary Box */}
        <div className="p-3.5 rounded-xl bg-secondary/50 border border-border space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Customer:</span>
            <span className="font-semibold text-foreground">{invoice.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phone:</span>
            <span className="font-mono text-foreground">{invoice.customerPhone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payment Mode:</span>
            <span className="font-bold text-primary">{invoice.paymentMode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date:</span>
            <span className="text-muted-foreground">{invoice.date}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-border font-bold text-sm">
            <span>Total Paid:</span>
            <span className="font-mono text-emerald-400">₹{invoice.grandTotal?.toFixed(2)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex-1 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs font-semibold hover:bg-neutral-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5 text-primary" />
            Print Bill
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer"
          >
            New Sale
          </button>
        </div>
      </div>
    </div>
  );
}
