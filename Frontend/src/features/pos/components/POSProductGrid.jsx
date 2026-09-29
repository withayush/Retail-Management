import React from "react";
import { Package, Plus, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

export default function POSProductGrid({ loading, products, searchTerm, onAddToCart }) {
  if (loading) {
    return (
      <div className="flex-1 p-6 overflow-y-auto bg-black">
        <div className="h-full flex flex-col items-center justify-center gap-3 text-[#6E6E73]">
          <div className="w-8 h-8 rounded-full border-2 border-[#0066CC] border-t-transparent animate-spin" />
          <span className="text-xs font-medium">Searching catalog...</span>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex-1 p-6 overflow-y-auto bg-black">
        <div className="h-full flex flex-col items-center justify-center gap-3 text-[#6E6E73] text-center p-8">
          <div className="w-14 h-14 rounded-[18px] bg-[#161617] border border-[#D2D2D7]/15 flex items-center justify-center shadow-lg">
            <Package className="w-7 h-7 text-[#6E6E73]" />
          </div>
          <p className="font-semibold text-white text-sm">No Products Found</p>
          <p className="text-xs text-[#6E6E73] max-w-sm">
            {searchTerm
              ? `No active items match "${searchTerm}". Try adjusting your keywords or scan a barcode.`
              : "No items currently registered in catalog."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-5 overflow-y-auto bg-black">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
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
              className={`relative bg-[#161617]/90 backdrop-blur-xl border transition-all duration-300 rounded-[18px] p-4 flex flex-col justify-between cursor-pointer group active:scale-[0.98] shadow-[0_4px_20px_rgba(0,0,0,0.3)] ${
                isOutOfStock
                  ? "border-[#D2D2D7]/8 opacity-50 hover:border-[#D2D2D7]/16"
                  : isLowStock
                  ? "border-[#FF791B]/35 hover:border-[#FF791B]/60 hover:bg-[#1D1D1F]"
                  : "border-[#D2D2D7]/12 hover:border-[#D2D2D7]/28 hover:bg-[#1D1D1F]"
              }`}
            >
              {/* Top subtle highlight */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#D2D2D7]/15 to-transparent" />

              <div>
                <div className="flex items-start justify-between gap-1.5 mb-2.5 flex-wrap">
                  <span className="text-[10px] font-medium text-[#D2D2D7] bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                    {categoryName}
                  </span>

                  {/* Stock Badges */}
                  {isOutOfStock ? (
                    <span className="text-[9px] font-bold text-[#FF791B] bg-[#B64400]/15 px-2 py-0.5 rounded-full border border-[#B64400]/30">
                      Out of Stock
                    </span>
                  ) : isLowStock ? (
                    <span className="text-[9px] font-bold text-[#FFA466] bg-[#FF791B]/15 px-2 py-0.5 rounded-full border border-[#FF791B]/30">
                      {stock} left
                    </span>
                  ) : stock !== null ? (
                    <span className="text-[9px] font-medium text-[#54A7FF] bg-[#0066CC]/15 px-2 py-0.5 rounded-full border border-[#0066CC]/30">
                      {stock} {p.unit || "pcs"}
                    </span>
                  ) : null}
                </div>

                <h3 className="font-semibold text-xs text-white group-hover:text-white transition-colors line-clamp-2 leading-snug tracking-tight">
                  {p.name}
                </h3>
                {p.sku && (
                  <p className="text-[10px] font-mono text-[#6E6E73] mt-1">
                    {p.sku}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-[#D2D2D7]/8 flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-white">
                    ₹{price.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-[#6E6E73] ml-1">
                    /{p.unit || "pcs"}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isOutOfStock}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isOutOfStock
                      ? "bg-white/5 text-[#6E6E73] cursor-not-allowed"
                      : "bg-[#0066CC] text-white shadow-[0_2px_8px_rgba(0,102,204,0.35)] group-hover:bg-[#0077ED] group-hover:scale-110 active:scale-95"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
