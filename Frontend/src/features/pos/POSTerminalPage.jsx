import { useState } from "react";
import { ShoppingCart, Search, CreditCard } from "lucide-react";

export default function POSTerminalPage() {
  const [cart, setCart] = useState([]);

  return (
    <div className="h-screen flex flex-col md:flex-row bg-background text-foreground overflow-hidden">
      {/* Product Catalog Panel */}
      <div className="flex-1 flex flex-col border-r border-border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Search product by name, SKU or scan barcode..."
              className="input pl-10"
            />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center border border-dashed border-border rounded-xl text-muted-foreground">
          Scan or search products to begin billing
        </div>
      </div>

      {/* Cart & Billing Panel */}
      <div className="w-full md:w-96 flex flex-col p-6 bg-card border-l border-border justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" /> Current Order
            </h2>
            <span className="badge">{cart.length} items</span>
          </div>

          <div className="py-12 text-center text-muted-foreground text-sm">
            Cart is currently empty
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex justify-between text-lg font-bold">
            <span>Total Payable:</span>
            <span>₹0.00</span>
          </div>
          <button className="btn btn-primary w-full py-3">
            <CreditCard className="w-4 h-4" />
            Charge ₹0.00
          </button>
        </div>
      </div>
    </div>
  );
}
