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
    <div className="w-full md:w-[420px] flex flex-col bg-[#161617]/95 backdrop-blur-2xl border-l border-[#D2D2D7]/12 h-full justify-between select-none shadow-[0_0_32px_rgba(0,0,0,0.5)]">
      {/* ── Cart Header & Customer Indicator ──────────────────────────── */}
      <div className="p-4 border-b border-[#D2D2D7]/10 bg-black/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#0066CC]/20 border border-[#0066CC]/30 text-[#54A7FF] flex items-center justify-center font-bold shadow-sm">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white flex items-center gap-2 tracking-tight">
                Active Order
                <span className="text-[10px] bg-white/10 text-[#D2D2D7] px-2 py-0.5 rounded-full font-mono">
                  {cart.length} {cart.length === 1 ? "item" : "items"}
                </span>
              </h2>
            </div>
          </div>

          {cart.length > 0 && (
            <button
              onClick={onClearCart}
              title="Clear Cart (Ctrl+D)"
              className="text-xs text-[#6E6E73] hover:text-[#FF791B] flex items-center gap-1.5 cursor-pointer transition-colors px-2.5 py-1 rounded-full hover:bg-[#B64400]/15"
            >
              <Trash2 className="w-3 h-3" />
              <span className="text-[11px] font-medium">Clear</span>
            </button>
          )}
        </div>

        {/* Customer Selector / Banner (F4) */}
        <div
          onClick={onOpenCustomerModal}
          className="p-3 rounded-[18px] bg-[#1D1D1F] border border-[#D2D2D7]/14 hover:border-[#0066CC]/60 flex items-center justify-between cursor-pointer transition-all group shadow-sm"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#D2D2D7] group-hover:text-white group-hover:border-[#0066CC]/50 transition-colors">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              {customer ? (
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-white truncate">{customer.name}</span>
                    {(customer.currentBalance || 0) > 0 && (
                      <span className="text-[9px] bg-[#FF791B]/15 text-[#FFA466] px-2 py-0.5 rounded-full font-mono border border-[#FF791B]/30">
                        Khata: ₹{customer.currentBalance.toFixed(0)}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#6E6E73] font-mono">{customer.phone}</span>
                </div>
              ) : (
                <div>
                  <span className="text-xs text-white font-medium">Walk-in Customer</span>
                  <span className="text-[10px] text-[#6E6E73] block">Click or press F4 to attach customer</span>
                </div>
              )}
            </div>
          </div>

          <kbd className="text-[10px] font-mono text-[#D2D2D7] bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
            F4
          </kbd>
        </div>
      </div>

      {/* ── Cart Items List ───────────────────────────────────────────── */}
      <div className="flex-1 p-3 overflow-y-auto space-y-1.5 divide-y divide-[#D2D2D7]/8">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#6E6E73]">
            <div className="w-14 h-14 rounded-[18px] bg-[#1D1D1F] border border-[#D2D2D7]/12 flex items-center justify-center mb-3 shadow-lg">
              <ShoppingCart className="w-6 h-6 text-[#6E6E73]" />
            </div>
            <p className="font-semibold text-xs text-white">Cart is Empty</p>
            <p className="text-[11px] text-[#6E6E73] mt-1 max-w-[220px]">
              Scan barcodes or select products from catalog to build invoice.
            </p>
            <span className="mt-4 text-[10px] bg-white/5 text-[#D2D2D7] border border-white/10 px-3 py-1 rounded-full font-mono">
              Press [F2] to Scan / Search
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
      <div className="p-4 bg-black/50 border-t border-[#D2D2D7]/12 space-y-3">
        {/* Quick Order Discount Row (F8) */}
        <div className="flex items-center justify-between gap-2 bg-[#1D1D1F] p-2 rounded-[18px] border border-[#D2D2D7]/14">
          <div className="flex items-center gap-2 text-xs text-[#D2D2D7] pl-1.5">
            <Tag className="w-3.5 h-3.5 text-[#0066CC]" />
            <span className="text-[11px] font-semibold">Discount (F8):</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex rounded-full overflow-hidden border border-[#D2D2D7]/16 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setDiscountType("flat")}
                className={`px-2.5 py-0.5 transition-colors ${
                  discountType === "flat" ? "bg-[#0066CC] text-white" : "bg-[#1D1D1F] text-[#6E6E73]"
                }`}
              >
                ₹
              </button>
              <button
                type="button"
                onClick={() => setDiscountType("percent")}
                className={`px-2.5 py-0.5 transition-colors ${
                  discountType === "percent" ? "bg-[#0066CC] text-white" : "bg-[#1D1D1F] text-[#6E6E73]"
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
              className="w-16 bg-black/40 border border-[#D2D2D7]/16 rounded-full px-2.5 py-1 text-xs font-mono text-right text-white focus:outline-none focus:border-[#0066CC]"
            />
          </div>
        </div>

        {/* Payment Mode Segmented Control */}
        <div className="grid grid-cols-4 gap-1.5 bg-[#1D1D1F] p-1.5 rounded-full border border-[#D2D2D7]/14 text-xs text-center font-semibold">
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
                className={`py-1.5 rounded-full transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                  isSelected
                    ? isUdhar
                      ? "bg-[#FF791B] text-white font-bold shadow-[0_2px_10px_rgba(255,121,27,0.4)]"
                      : "bg-[#0066CC] text-white font-bold shadow-[0_2px_10px_rgba(0,102,204,0.4)]"
                    : isUdhar
                    ? "text-[#FF791B]/70 hover:text-[#FF791B]"
                    : "text-[#6E6E73] hover:text-white"
                }`}
              >
                <span className="text-[11px] leading-none">{mode.label}</span>
                <span className="text-[8px] opacity-60 font-mono">^{mode.key}</span>
              </button>
            );
          })}
        </div>

        {/* UPI Ref ID Input */}
        {paymentMode === "UPI" && (
          <div className="animate-fade-in">
            <input
              placeholder="UPI Reference ID / UTR (Optional)"
              value={upiRefId}
              onChange={(e) => setUpiRefId(e.target.value)}
              className="w-full bg-[#1D1D1F] border border-[#D2D2D7]/16 rounded-full px-3.5 py-1.5 text-xs text-white placeholder-[#6E6E73] font-mono focus:outline-none focus:border-[#0066CC]"
            />
          </div>
        )}

        {/* Udhaar Helper Banner */}
        {paymentMode === "UDHAR" && (
          <div className="bg-[#B64400]/15 border border-[#B64400]/30 rounded-[18px] p-2.5 text-[11px] text-[#FFA466] flex items-center gap-2 animate-fade-in">
            <span className="text-sm">📒</span>
            <span>
              {customer
                ? `Booking ₹${grandTotal.toFixed(2)} to ${customer.name}'s Khata ledger.`
                : "Attach customer (F4) to book sale on Udhaar."}
            </span>
          </div>
        )}

        {/* Billing Math Breakdown */}
        <div className="space-y-1.5 text-xs pt-1">
          <div className="flex justify-between text-[#6E6E73]">
            <span>Subtotal:</span>
            <span className="font-mono text-[#D2D2D7]">₹{subtotal.toFixed(2)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-[#54A7FF] font-medium">
              <span>Applied Discount:</span>
              <span className="font-mono">-₹{discountAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-[#6E6E73]">
            <span>GST (5%):</span>
            <span className="font-mono text-[#D2D2D7]">₹{gstAmount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-[#D2D2D7]/10">
            <span>Grand Total:</span>
            <span className="font-mono text-lg text-white font-bold">
              ₹{grandTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Complete Sale Action Button (F9) */}
        <button
          disabled={cart.length === 0 || checkingOut}
          onClick={onCheckout}
          className={`w-full py-3 rounded-full font-bold text-xs shadow-lg active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
            paymentMode === "UDHAR"
              ? "bg-[#FF791B] hover:bg-[#FF8A4C] text-white shadow-[0_4px_20px_rgba(255,121,27,0.4)]"
              : "bg-[#0066CC] hover:bg-[#0077ED] text-white shadow-[0_4px_20px_rgba(0,102,204,0.4)]"
          }`}
        >
          <CreditCard className={`w-4 h-4 ${checkingOut ? "animate-pulse" : ""}`} />
          {checkingOut
            ? "Processing Checkout..."
            : paymentMode === "UDHAR"
            ? `Book ₹${grandTotal.toFixed(2)} on Udhaar [F9]`
            : `Charge ₹${grandTotal.toFixed(2)} (${paymentMode}) [F9]`}
        </button>
      </div>
    </div>
  );
}
