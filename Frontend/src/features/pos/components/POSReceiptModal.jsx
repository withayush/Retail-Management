import React, { useState } from "react";
import { CheckCircle2, FileDown, Printer, RefreshCw } from "lucide-react";
import { downloadInvoicePdf } from "../../../services/sale.api";
import { toast } from "react-hot-toast";

export default function POSReceiptModal({ isOpen, invoice, onClose }) {
  const [downloading, setDownloading] = useState(false);

  if (!isOpen || !invoice) return null;

  const handleDownloadPdf = async () => {
    const saleId = invoice._id || invoice.id;
    if (!saleId) {
      return toast.error("Invoice ID not found.");
    }

    setDownloading(true);
    try {
      await downloadInvoicePdf(saleId, invoice.invoiceNumber);
      toast.success(`PDF Invoice #${invoice.invoiceNumber} downloaded! 📄`);
    } catch (err) {
      console.error("Failed to download invoice PDF:", err);
      toast.error("Failed to generate invoice PDF.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2 border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-foreground">Payment Received</h3>
          <p className="text-xs text-muted-foreground font-mono">
            {invoice.invoiceNumber} • {invoice.date || "Just now"}
          </p>
        </div>

        <div className="bg-secondary/40 border border-border rounded-2xl p-4 text-xs space-y-2">
          <div className="flex justify-between font-semibold">
            <span>Customer:</span>
            <span>{invoice.customerName}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Payment Mode:</span>
            <span className="font-mono font-bold text-foreground">{invoice.paymentMode}</span>
          </div>
          <div className="border-t border-border pt-2 space-y-1">
            {(invoice.items || []).map((item, idx) => {
              const unitPrice = item.soldPrice ?? item.sellingPrice ?? 0;
              const itemTotal = item.totalPrice ?? (unitPrice * (item.quantity || 1));
              return (
                <div key={idx} className="flex justify-between text-muted-foreground">
                  <span className="truncate pr-2">{item.name} × {item.quantity}</span>
                  <span className="font-mono font-medium text-foreground">
                    ₹{Number(itemTotal).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="border-t border-border pt-2 flex justify-between font-bold text-sm text-foreground">
            <span>Total Paid:</span>
            <span className="font-mono text-primary">₹{Number(invoice.total ?? invoice.grandTotal ?? 0).toFixed(2)}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="flex-1 py-2.5 px-3 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            {downloading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5" />
            )}
            Download PDF
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all cursor-pointer"
          >
            New Order
          </button>
        </div>
      </div>
    </div>
  );
}

