import React from "react";
import {
  Boxes,
  Layers,
  Edit2,
  Plus,
  Minus,
  Settings2,
} from "lucide-react";

export default function StockStateTable({
  loading,
  storeState,
  onOpenStockIn,
  onOpenStockOut,
  onOpenAdjust,
  onOpenReorder,
}) {
  return (
    <div className="bg-[#111113] border border-[#1f1f23] rounded-xl shadow-xs overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#1f1f23] bg-[#141417] text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              <th className="py-3 px-4">Product & Category</th>
              <th className="py-3 px-4">SKU / Code</th>
              <th className="py-3 px-4 text-right">Selling / Cost</th>
              <th className="py-3 px-4 text-center">Current Stock</th>
              <th className="py-3 px-4 text-center">Reorder Threshold</th>
              <th className="py-3 px-4 text-right">Valuation (Cost)</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f1f23]">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-zinc-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-7 h-7 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />
                    <span className="text-xs">Loading inventory store state...</span>
                  </div>
                </td>
              </tr>
            ) : storeState.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-zinc-500">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                    <Boxes className="w-8 h-8 opacity-40 text-zinc-400" />
                    <p className="font-semibold text-zinc-200 text-xs">No Inventory Records Found</p>
                    <p className="text-[11px] text-zinc-500">No products match current filter conditions.</p>
                  </div>
                </td>
              </tr>
            ) : (
              storeState.map((item) => {
                const isOutOfStock = item.stockStatus === "OUT_OF_STOCK";
                const isLowStock = item.stockStatus === "LOW_STOCK";

                return (
                  <tr key={item.productId} className="hover:bg-[#151518] transition-colors">
                    {/* Product Name & Category */}
                    <td className="py-3 px-4 align-middle">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-zinc-200 text-xs">{item.name}</span>
                        <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500">
                          <Layers className="w-2.5 h-2.5 text-zinc-400" />
                          {item.category?.name || "General"}
                        </span>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="py-3 px-4 align-middle font-mono text-xs text-zinc-400">
                      <span className="bg-[#141417] px-2 py-0.5 rounded border border-[#27272a] text-zinc-300 font-medium">
                        {item.sku}
                      </span>
                    </td>

                    {/* Pricing */}
                    <td className="py-3 px-4 text-right align-middle font-mono">
                      <span className="font-semibold text-white block">₹{item.sellingPrice?.toFixed(2) || "0.00"}</span>
                      <span className="text-[10px] text-zinc-500">Cost: ₹{item.costPrice?.toFixed(2) || "0.00"}</span>
                    </td>

                    {/* Available Stock */}
                    <td className="py-3 px-4 text-center align-middle font-mono">
                      <span
                        className={`font-semibold text-xs px-2 py-0.5 rounded ${
                          isOutOfStock
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : isLowStock
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {item.availableStock} {item.unit}
                      </span>
                    </td>

                    {/* Reorder Level */}
                    <td className="py-3 px-4 text-center align-middle font-mono">
                      <button
                        onClick={() => onOpenReorder(item)}
                        className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        title="Change reorder threshold"
                      >
                        <span>{item.reorderLevel} {item.unit}</span>
                        <Edit2 className="w-3 h-3 opacity-60 hover:opacity-100" />
                      </button>
                    </td>

                    {/* Valuation */}
                    <td className="py-3 px-4 text-right align-middle font-mono font-semibold text-zinc-200">
                      ₹{(item.valuation || 0).toFixed(2)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center align-middle">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center text-[10px] font-bold bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20">
                          Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center text-[10px] font-bold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                          In Stock
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right align-middle">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => onOpenStockIn(item)}
                          className="p-1.5 rounded-lg border border-[#27272a] bg-[#141417] text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all cursor-pointer"
                          title="Add Stock (IN)"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onOpenStockOut(item)}
                          className="p-1.5 rounded-lg border border-[#27272a] bg-[#141417] text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all cursor-pointer"
                          title="Deduct Stock (OUT)"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onOpenAdjust(item)}
                          className="px-2 py-1 rounded-lg border border-[#27272a] bg-[#141417] text-zinc-400 hover:text-white hover:border-zinc-600 transition-all cursor-pointer text-[11px] font-medium"
                          title="Audit Reconciliation"
                        >
                          Adjust
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
