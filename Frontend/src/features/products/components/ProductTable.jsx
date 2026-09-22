import React, { useState } from "react";
import {
  Edit3,
  Archive,
  RotateCcw,
  Copy,
  Check,
  Package,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { fmt, margin } from "../utils/product.utils";

export default function ProductTable({
  products = [],
  loading = false,
  search = "",
  selectedCategory = "",
  page = 1,
  hasMore = false,
  limit = 15,
  onLimitChange,
  onPageChange,
  onEdit,
  onArchive,
  onRestore,
}) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(`Copied: ${text}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-[#111113] border border-[#1f1f23] rounded-xl overflow-hidden flex flex-col shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#1f1f23] bg-[#141417] text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              <th className="py-3 px-4">Product & Category</th>
              <th className="py-3 px-4">SKU / Barcode</th>
              <th className="py-3 px-4 text-right">Cost Price</th>
              <th className="py-3 px-4 text-right">Selling Price</th>
              <th className="py-3 px-4 text-center">Margin</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f1f23]">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-zinc-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-7 h-7 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />
                    <span className="text-xs">Loading products...</span>
                  </div>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-zinc-500">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                    <div className="w-10 h-10 rounded-xl bg-[#141417] border border-[#27272a] flex items-center justify-center">
                      <Package className="w-5 h-5 text-zinc-400" />
                    </div>
                    <p className="font-semibold text-zinc-200 text-xs">No products found</p>
                    <p className="text-[11px] text-zinc-500">
                      {search || selectedCategory
                        ? "No products matching your search or category filter."
                        : "Start adding products to your catalog."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const id = p.id || p._id;
                const cost = parseFloat(p.costPrice ?? p.cost_price ?? 0);
                const sell = parseFloat(p.sellingPrice ?? p.selling_price ?? 0);
                const profMargin = margin(cost, sell);
                const profNum = parseFloat(profMargin);
                const categoryName = p.category?.name || p.category_name || "General";
                const isArchived = p.isArchived || p.status === "ARCHIVED";
                const isActive = p.isActive ?? p.is_active ?? !isArchived;

                return (
                  <tr
                    key={id}
                    className="hover:bg-[#151518] transition-colors"
                  >
                    {/* Product Name & Category */}
                    <td className="py-3 px-4 align-middle">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-xs text-zinc-100">
                          {p.name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[10px] bg-zinc-800/80 px-2 py-0.5 rounded text-zinc-400 font-medium border border-zinc-700/60">
                            <Layers className="w-2.5 h-2.5 text-zinc-400" />
                            {categoryName}
                          </span>
                          {p.unit && (
                            <span className="text-[10px] text-zinc-500">
                              ({p.unit})
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* SKU & Barcode */}
                    <td className="py-3 px-4 align-middle font-mono text-xs">
                      <div className="flex flex-col gap-1">
                        {p.sku ? (
                          <div className="flex items-center gap-1.5">
                            <span className="bg-[#141417] px-1.5 py-0.5 rounded border border-[#27272a] text-zinc-300 font-medium">
                              {p.sku}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(p.sku, `sku-${id}`)}
                              className="text-zinc-500 hover:text-zinc-200 transition-colors p-0.5 cursor-pointer"
                              title="Copy SKU"
                            >
                              {copiedId === `sku-${id}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-zinc-500 text-[11px] italic">No SKU</span>
                        )}

                        {p.barcode && (
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                            <span>{p.barcode}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(p.barcode, `bar-${id}`)}
                              className="text-zinc-500 hover:text-zinc-200 transition-colors p-0.5 cursor-pointer"
                              title="Copy Barcode"
                            >
                              {copiedId === `bar-${id}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Cost Price */}
                    <td className="py-3 px-4 text-right align-middle font-mono text-xs text-zinc-400">
                      {fmt(cost)}
                    </td>

                    {/* Selling Price */}
                    <td className="py-3 px-4 text-right align-middle font-mono text-xs font-semibold text-white">
                      {fmt(sell)}
                    </td>

                    {/* Margin */}
                    <td className="py-3 px-4 text-center align-middle">
                      <span
                        className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                          profNum >= 25
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : profNum >= 10
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {profMargin}%
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center align-middle">
                      {isArchived ? (
                        <span className="inline-flex items-center text-[10px] font-medium bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-zinc-700">
                          Archived
                        </span>
                      ) : isActive ? (
                        <span className="inline-flex items-center text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-medium bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right align-middle">
                      <div className="inline-flex items-center gap-1">
                        {isArchived ? (
                          <button
                            type="button"
                            onClick={() => onRestore(p)}
                            title="Restore Product"
                            className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => onEdit(p)}
                              title="Edit Product"
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onArchive(p)}
                              title="Archive Product"
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 bg-[#141417] border-t border-[#1f1f23] flex items-center justify-between gap-3 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <span>Items per page:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="bg-[#111113] border border-[#27272a] rounded px-2 py-1 text-xs text-zinc-200 outline-none cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span>Page {page}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1 || loading}
              className="p-1 rounded bg-[#111113] border border-[#27272a] text-zinc-300 disabled:opacity-40 hover:bg-zinc-800 disabled:hover:bg-[#111113] cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={!hasMore || loading}
              className="p-1 rounded bg-[#111113] border border-[#27272a] text-zinc-300 disabled:opacity-40 hover:bg-zinc-800 disabled:hover:bg-[#111113] cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
