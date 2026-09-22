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
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-200">
            <Package className="w-4 h-4" />
          </div>
          <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
            Product Catalog
          </h1>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Manage product inventory, pricing, barcodes, and profit margins
        </p>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onOpenCategoriesModal}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#141417] border border-[#27272a] text-zinc-200 hover:text-white hover:border-zinc-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5 text-zinc-400" />
          <span>Categories</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-zinc-800 text-zinc-300 font-mono">
            {categoryCount}
          </span>
        </button>

        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-zinc-950 rounded-xl text-xs font-bold hover:bg-zinc-200 transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>
    </div>
  );
}
