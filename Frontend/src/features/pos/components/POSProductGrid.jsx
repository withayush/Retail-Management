import React from "react";
import { Package, Layers, Plus, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

export default function POSProductGrid({ loading, products, searchTerm, onAddToCart }) {
  if (loading) {
    return (
      <div className="flex-1 p-4 overflow-y-auto bg-[#09090b]">
        <div className="h-full flex flex-col items-center justify-center gap-3 text-zinc-500">
          <div className="w-8 h-8 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />
          <span className="text-xs font-medium">Searching catalog...</span>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex-1 p-4 overflow-y-auto bg-[#09090b]">
        <div className="h-full flex flex-col items-center justify-center gap-3 text-zinc-500 text-center p-6">
          <div className="w-12 h-12 rounded-xl bg-[#141417] border border-[#27272a] flex items-center justify-center">
            <Package className="w-6 h-6 text-zinc-400" />
          </div>
          <p className="font-semibold text-zinc-200 text-sm">No Products Found</p>
          <p className="text-xs text-zinc-500 max-w-sm">
            {searchTerm
              ? `No active products match "${searchTerm}". Try another term or scan barcode.`
              : "No active products available in catalog."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 overflow-y-auto bg-[#09090b]">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {products.map((p) => {
          const prodId = p.id || p._id;
          const price = Number(p.sellingPrice ?? p.selling_price ?? 0);
          const categoryName = p.category?.name || "General";
          const stock = p.availableStock !== undefined ? Number(p.availableStock) : null;
          const isOutOfStock = stock !== null && stock <= 0;
          const isLowStock = stock !== null && stock > 0 && stock <= (p.reorderLevel ?? 5);

          return (
            <div
              key={prodId}
              onClick={() => onAddToCart(p)}
              className={`bg-[#111113] border transition-all rounded-xl p-3.5 flex flex-col justify-between cursor-pointer group active:scale-[0.98] ${
                isOutOfStock
                  ? "border-zinc-800/80 opacity-60 hover:border-zinc-700"
                  : isLowStock
                  ? "border-amber-500/30 hover:border-amber-500/60 hover:bg-[#141418]"
                  : "border-[#1f1f23] hover:border-zinc-600 hover:bg-[#151518]"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-1 mb-2 flex-wrap">
                  <span className="text-[10px] font-medium text-zinc-400 bg-zinc-800/60 px-2 py-0.5 rounded border border-zinc-700/60">
                    {categoryName}
                  </span>

                  {/* Stock Status Badge */}
                  {isOutOfStock ? (
                    <span className="text-[9px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                      Out of Stock
                    </span>
                  ) : isLowStock ? (
                    <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      {stock} left
                    </span>
                  ) : stock !== null ? (
                    <span className="text-[9px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      {stock} {p.unit || "pcs"}
                    </span>
                  ) : null}
                </div>

                <h3 className="font-semibold text-xs text-zinc-200 group-hover:text-white transition-colors line-clamp-2 leading-snug">
                  {p.name}
                </h3>
                {p.sku && (
                  <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                    {p.sku}
                  </p>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#1f1f23] flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-white">
                    ₹{price.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-zinc-500 ml-1">
                    /{p.unit || "pcs"}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isOutOfStock}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                    isOutOfStock
                      ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                      : "bg-zinc-800 group-hover:bg-white text-zinc-300 group-hover:text-zinc-950"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
