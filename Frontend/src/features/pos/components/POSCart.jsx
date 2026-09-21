import React from "react";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";

export default function POSCart({
  cart = [],
  customerName = "",
  setCustomerName,
  customerPhone = "",
  setCustomerPhone,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
}) {
  return (
    <>
      {/* Cart Header & Customer Quick Fill */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Current Order</h2>
              <span className="text-[11px] text-muted-foreground">
                {cart.length} distinct item{cart.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          {cart.length > 0 && (
            <button
              onClick={onClearCart}
              className="text-xs text-destructive hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Customer Attach Inputs */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border/60">
          <input
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
          />
          <input
            placeholder="Mobile Phone"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground font-mono"
          />
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2.5 divide-y divide-border/40">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <ShoppingCart className="w-10 h-10 mb-2 opacity-30" />
            <p className="font-semibold text-sm text-foreground">Cart is Empty</p>
            <p className="text-xs mt-1">
              Scan barcodes or click products on the left catalog to start billing.
            </p>
          </div>
        ) : (
          cart.map((item) => {
            const id = item.id || item._id;
            const lineTotal = item.sellingPrice * item.quantity;

            return (
              <div key={id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-xs text-foreground truncate">{item.name}</h4>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    ₹{item.sellingPrice.toFixed(2)} × {item.quantity}
                  </span>
                </div>

                {/* Qty +/- stepper & Item Total */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-border rounded-lg overflow-hidden bg-background">
                    <button
                      onClick={() => onUpdateQuantity(id, -1)}
                      className="p-1 hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2 text-xs font-mono font-bold text-foreground">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(id, 1)}
                      className="p-1 hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="font-mono font-bold text-xs text-foreground w-16 text-right">
                    ₹{lineTotal.toFixed(2)}
                  </span>

                  <button
                    onClick={() => onRemoveFromCart(id)}
                    className="p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
