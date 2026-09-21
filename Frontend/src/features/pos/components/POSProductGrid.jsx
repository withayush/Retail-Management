import React from "react";
import { Package, Layers, Plus } from "lucide-react";

export default function POSProductGrid({
  products = [],
  loading = false,
  searchTerm = "",
  onAddToCart,
}) {
  return (
    <div className="flex-1 p-4 overflow-y-auto bg-background/50">
      {loading ? (
        <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-sm font-medium">Searching product catalog...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground text-center p-6">
          <div className="w-14 h-14 rounded-2xl bg-secondary/60 border border-border flex items-center justify-center">
            <Package className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground text-base">No Products Found</p>
          <p className="text-xs max-w-sm">
            No active products match "{searchTerm}". Try scanning another barcode or clearing filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {products.map((p) => {
            const prodId = p.id || p._id;
            const price = Number(p.sellingPrice ?? p.selling_price ?? 0);
            const categoryName = p.category?.name || "General";

            return (
              <div
                key={prodId}
                onClick={() => onAddToCart(p)}
                className="bg-card border border-border hover:border-primary/50 hover:shadow-md transition-all rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer group active:scale-[0.98]"
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-secondary px-2 py-0.5 rounded text-muted-foreground border border-border">
                      <Layers className="w-2.5 h-2.5 text-primary" />
                      {categoryName}
                    </span>
                    {p.sku && (
                      <span className="text-[10px] font-mono text-muted-foreground font-semibold">
                        {p.sku}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                    {p.name}
                  </h3>
                </div>

                <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-sm text-foreground">
                      ₹{price.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-1">
                      /{p.unit || "pcs"}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="w-7 h-7 rounded-xl bg-primary/10 group-hover:bg-primary text-primary group-hover:text-primary-foreground flex items-center justify-center transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
