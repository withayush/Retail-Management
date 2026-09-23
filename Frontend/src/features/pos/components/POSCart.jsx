import React from "react";
import { ShoppingCart, Trash2, CreditCard, User, Tag, Sparkles } from "lucide-react";
import POSCartItem from "./POSCartItem";

export default function POSCart({
  cart,
  customer,
  onOpenCustomerModal,
  discountType,
  setDiscountType,
  discountValue,
  setDiscountValue,
  discountInputRef,
  paymentMode,
  setPaymentMode,
  upiRefId,
  setUpiRefId,
  subtotal,
  discountAmount,
  gstAmount,
  grandTotal,
  checkingOut = false,
  onUpdateQuantity,
  onSetQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
}) {
  return (
    <div className="w-full md:w-[410px] flex flex-col bg-[#0c0c0e] border-l border-[#1f1f23] h-full justify-between select-none">
      {/* ── Cart Header & Customer Indicator ──────────────────────────── */}
      <div className="p-3 border-b border-[#1f1f23] bg-[#0c0c0e] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-200 flex items-center justify-center font-bold shadow-inner">
              <ShoppingCart className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                Current Order
                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.2 rounded font-mono">
                  {cart.length} item{cart.length === 1 ? "" : "s"}
                </span>
              </h2>
            </div>
          </div>

          {cart.length > 0 && (
            <button
              onClick={onClearCart}
              title="Clear Cart (Ctrl+D)"
              className="text-xs text-zinc-400 hover:text-red-400 flex items-center gap-1 cursor-pointer transition-colors px-1.5 py-0.5 rounded hover:bg-red-500/10"
            >
              <Trash2 className="w-3 h-3" />
              <span className="text-[10px]">Clear</span>
            </button>
          )}
        </div>

        {/* Customer Selector / Banner (F4) */}
        <div
          onClick={onOpenCustomerModal}
          className="p-2 rounded-xl bg-[#141417] border border-[#27272a] hover:border-zinc-500 flex items-center justify-between cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              {customer ? (
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-zinc-100 truncate">{customer.name}</span>
                    {(customer.currentBalance || 0) > 0 && (
                      <span className="text-[9px] bg-red-500/10 text-red-400 px-1 py-0.2 rounded font-mono border border-red-500/20">
                        Khata: ₹{customer.currentBalance.toFixed(0)}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">{customer.phone}</span>
                </div>
              ) : (
                <div>
                  <span className="text-xs text-zinc-300 font-medium">Walk-in Customer</span>
                  <span className="text-[10px] text-zinc-500 block">Click or press F4 to attach</span>
                </div>
              )}
            </div>
          </div>

          <kbd className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">
            F4
          </kbd>
        </div>
      </div>

      {/* ── Cart Items List ───────────────────────────────────────────── */}
      <div className="flex-1 p-3 overflow-y-auto space-y-1 divide-y divide-[#1f1f23]">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
            <div className="w-12 h-12 rounded-2xl bg-[#141417] border border-[#27272a] flex items-center justify-center mb-2">
              <ShoppingCart className="w-6 h-6 text-zinc-500" />
            </div>
            <p className="font-semibold text-xs text-zinc-300">Terminal Cart is Empty</p>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-[220px]">
              Scan barcodes or select items from catalog to start billing.
            </p>
            <span className="mt-3 text-[10px] bg-zinc-800/80 text-zinc-400 border border-zinc-700 px-2 py-1 rounded font-mono">
              Press [F2] to Search / Scan
            </span>
          </div>
        ) : (
          cart.map((item) => (
            <POSCartItem
              key={item.id || item._id}
              item={item}
              onUpdateQuantity={onUpdateQuantity}
              onSetQuantity={onSetQuantity}
              onRemove={onRemoveItem}
            />
          ))
        )}
      </div>

      {/* ── Cart Billing Summary, Discount & Checkout ─────────────────── */}
      <div className="p-3 bg-[#0c0c0e] border-t border-[#1f1f23] space-y-2.5">
        {/* Quick Order Discount Row (F8) */}
        <div className="flex items-center justify-between gap-2 bg-[#141417] p-1.5 rounded-xl border border-[#27272a]">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 pl-1">
            <Tag className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[11px] font-medium">Discount (F8):</span>
          </div>

          <div className="flex items-center gap-1">
            <div className="flex rounded-lg overflow-hidden border border-[#27272a] text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setDiscountType("flat")}
                className={`px-1.5 py-0.5 ${
                  discountType === "flat" ? "bg-zinc-700 text-white" : "bg-[#18181b] text-zinc-400"
                }`}
              >
                ₹
              </button>
              <button
                type="button"
                onClick={() => setDiscountType("percent")}
                className={`px-1.5 py-0.5 ${
                  discountType === "percent" ? "bg-zinc-700 text-white" : "bg-[#18181b] text-zinc-400"
                }`}
              >
                %
              </button>
            </div>

            <input
              ref={discountInputRef}
              type="number"
              min="0"
              placeholder="0"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className="w-14 bg-[#18181b] border border-[#27272a] rounded-lg px-2 py-0.5 text-xs font-mono text-right text-zinc-100 focus:outline-none focus:border-zinc-500"
            />
          </div>
        </div>

        {/* Payment Mode Selector */}
        <div className="grid grid-cols-4 gap-1 bg-[#141417] p-1 rounded-xl border border-[#27272a] text-xs text-center font-medium">
          {[
            { id: "CASH", label: "CASH", key: "1" },
            { id: "UPI", label: "UPI", key: "2" },
            { id: "CARD", label: "CARD", key: "3" },
            { id: "UDHAR", label: "UDHAAR", key: "4" },
          ].map((mode) => {
            const isSelected = paymentMode === mode.id;
            const isUdhar = mode.id === "UDHAR";
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setPaymentMode(mode.id)}
                className={`py-1.5 rounded-lg transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                  isSelected
                    ? isUdhar
                      ? "bg-amber-400 text-zinc-950 font-bold shadow-xs"
                      : "bg-white text-zinc-950 font-semibold shadow-xs"
                    : isUdhar
                    ? "text-amber-400/80 hover:text-amber-300"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <span className="text-[11px] font-bold leading-none">{mode.label}</span>
                <span className="text-[8px] opacity-60 font-mono">^{mode.key}</span>
              </button>
            );
          })}
        </div>

        {/* UPI Ref ID Input (If UPI is selected) */}
        {paymentMode === "UPI" && (
          <div className="animate-fadeIn">
            <input
              placeholder="UPI Reference ID / UTR (Optional)"
              value={upiRefId}
              onChange={(e) => setUpiRefId(e.target.value)}
              className="w-full bg-[#141417] border border-[#27272a] rounded-lg px-2.5 py-1 text-xs text-zinc-100 placeholder:text-zinc-500 font-mono focus:outline-none focus:border-zinc-500"
            />
          </div>
        )}

        {/* Udhaar Helper Banner */}
        {paymentMode === "UDHAR" && (
          <div className="bg-amber-950/30 border border-amber-800/40 rounded-lg p-2 text-[11px] text-amber-300 flex items-center gap-1.5 animate-fadeIn">
            <span className="text-sm">📒</span>
            <span>
              {customer
                ? `Routes ₹${grandTotal.toFixed(2)} to ${customer.name}'s Khata.`
                : "Attach customer (F4) to book sale on Udhaar."}
            </span>
          </div>
        )}

        {/* Billing Math Breakdown */}
        <div className="space-y-1 text-xs pt-1">
          <div className="flex justify-between text-zinc-400">
            <span>Subtotal:</span>
            <span className="font-mono text-zinc-300">₹{subtotal.toFixed(2)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-400 font-medium">
              <span>Discount:</span>
              <span className="font-mono">-₹{discountAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-zinc-400">
            <span>GST (5%):</span>
            <span className="font-mono text-zinc-300">₹{gstAmount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm font-bold text-white pt-1.5 border-t border-[#1f1f23]">
            <span>Grand Total:</span>
            <span className="font-mono text-base text-white">
              ₹{grandTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Complete Sale Action Button (F9) */}
        <button
          disabled={cart.length === 0 || checkingOut}
          onClick={onCheckout}
          className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-md active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer ${
            paymentMode === "UDHAR"
              ? "bg-amber-400 hover:bg-amber-300 text-zinc-950 shadow-amber-950/20"
              : "bg-white hover:bg-zinc-200 text-zinc-950"
          }`}
        >
          <CreditCard className={`w-3.5 h-3.5 ${checkingOut ? "animate-pulse" : ""}`} />
          {checkingOut
            ? "Processing Checkout..."
            : paymentMode === "UDHAR"
            ? `Book ₹${grandTotal.toFixed(2)} on Udhaar [F9] 📒`
            : `Charge ₹${grandTotal.toFixed(2)} (${paymentMode}) [F9]`}
        </button>
      </div>
    </div>
  );
}
