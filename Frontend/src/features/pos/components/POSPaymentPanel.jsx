import React from "react";
import { CreditCard, CheckCircle2 } from "lucide-react";

export default function POSPaymentPanel({
  subtotal = 0,
  gstAmount = 0,
  grandTotal = 0,
  paymentMode = "CASH",
  setPaymentMode,
  cartCount = 0,
  onCheckout,
}) {
  return (
    <div className="p-4 border-t border-border bg-card space-y-3.5">
      {/* Financial Calculations */}
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="font-mono text-foreground">₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Estimated GST (5%)</span>
          <span className="font-mono text-foreground">₹{gstAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t border-border">
          <span>Grand Total</span>
          <span className="font-mono text-emerald-400 font-black text-lg">
            ₹{grandTotal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Payment Mode Selector */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-muted-foreground uppercase">
          Payment Mode
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {["CASH", "UPI", "CARD", "UDHAR"].map((mode) => (
            <button
              key={mode}
              onClick={() => setPaymentMode(mode)}
              className={`py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                paymentMode === mode
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-background text-muted-foreground hover:text-foreground border-border hover:bg-secondary"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Checkout Submit Button */}
      <button
        onClick={onCheckout}
        disabled={cartCount === 0}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-black font-black text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-40 cursor-pointer active:scale-95 transition-all"
      >
        <CreditCard className="w-4 h-4" />
        <span>Complete Sale (₹{grandTotal.toFixed(2)})</span>
      </button>
    </div>
  );
}
