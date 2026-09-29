import React from "react";
import { Plus, Layers, Package } from "lucide-react";

export default function ProductHeader({
  onOpenAddModal,
  onOpenCategoriesModal,
  categoryCount = 0,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#0066CC]/20 border border-[#0066CC]/30 flex items-center justify-center text-[#54A7FF]">
            <Package className="w-4 h-4" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Product Catalog
          </h1>
        </div>
        <p className="text-xs text-[#6E6E73] mt-1">
          Catalog management, real-time pricing, barcodes, and profit yield
        </p>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onOpenCategoriesModal}
          className="apple-btn-secondary text-xs py-2 px-4"
        >
          <Layers className="w-3.5 h-3.5 text-[#0066CC]" />
          <span>Categories</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-[#D2D2D7] font-mono">
            {categoryCount}
          </span>
        </button>

        <button
          onClick={onOpenAddModal}
          className="apple-btn-primary text-xs py-2 px-4.5 shadow-[0_2px_12px_rgba(0,102,204,0.35)]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>
    </div>
  );
}
