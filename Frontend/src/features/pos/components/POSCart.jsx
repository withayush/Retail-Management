import React from "react";
import { ShoppingCart, Trash2, CreditCard } from "lucide-react";
import POSCartItem from "./POSCartItem";

export default function POSCart({
  cart,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  paymentMode,
  setPaymentMode,
  subtotal,
  gstAmount,
  grandTotal,
  checkingOut = false,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
}) {
  return (
    <div className="w-full md:w-[400px] flex flex-col bg-[#0c0c0e] border-l border-[#1f1f23] h-full justify-between select-none">
      {/* Cart Header */}
      <div className="p-3.5 border-b border-[#1f1f23] bg-[#0c0c0e]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-200 flex items-center justify-center font-bold">
              <ShoppingCart className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Current Order</h2>
              <span className="text-[11px] text-zinc-500">
                {cart.length} distinct item{cart.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          {cart.length > 0 && (
            <button
              onClick={onClearCart}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {/* Quick Customer Attach */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-[#1f1f23]">
          <input
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="bg-[#141417] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 placeholder:text-zinc-500"
          />
          <input
            placeholder="Mobile Phone"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="bg-[#141417] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 placeholder:text-zinc-500 font-mono"
          />
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2 divide-y divide-[#1f1f23]">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
            <ShoppingCart className="w-8 h-8 mb-2 opacity-30 text-zinc-400" />
            <p className="font-medium text-xs text-zinc-300">Cart is Empty</p>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-[200px]">
              Scan barcodes or select items to add to order.
            </p>
          </div>
        ) : (
          cart.map((item) => (
            <POSCartItem
              key={item.id || item._id}
              item={item}
              onUpdateQuantity={onUpdateQuantity}
              onRemove={onRemoveItem}
            />
          ))
        )}
      </div>

      {/* Cart Billing Summary & Checkout */}
      <div className="p-3.5 bg-[#0c0c0e] border-t border-[#1f1f23] space-y-3">
        {/* Payment Mode Selector */}
        <div className="grid grid-cols-4 gap-1 bg-[#141417] p-1 rounded-lg border border-[#27272a] text-xs text-center font-medium">
          {["CASH", "UPI", "CARD", "UDHAR"].map((mode) => (
            <button
              key={mode}
              onClick={() => setPaymentMode(mode)}
              className={`py-1 rounded-md transition-all cursor-pointer ${
                paymentMode === mode
                  ? "bg-white text-zinc-950 font-semibold shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-zinc-400">
            <span>Subtotal:</span>
            <span className="font-mono text-zinc-300">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>GST (5%):</span>
            <span className="font-mono text-zinc-300">₹{gstAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-white pt-1.5 border-t border-[#1f1f23]">
            <span>Grand Total:</span>
            <span className="font-mono text-base text-white">
              ₹{grandTotal.toFixed(2)}
            </span>
          </div>
        </div>

        <button
          disabled={cart.length === 0 || checkingOut}
          onClick={onCheckout}
          className="w-full py-2.5 rounded-xl bg-white text-zinc-950 font-bold text-xs shadow-md hover:bg-zinc-200 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <CreditCard className={`w-3.5 h-3.5 ${checkingOut ? "animate-pulse" : ""}`} />
          {checkingOut
            ? "Processing Checkout..."
            : `Charge ₹${grandTotal.toFixed(2)} (${paymentMode})`}
        </button>
      </div>
    </div>
  );
}
