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
  TrendingUp,
  Tag,
} from "lucide-react";
import toast from "react-hot-toast";
import { fmt, margin } from "../utils/product.utils";

export default function ProductTable({
  products = [],
  loading = false,
  search = "",
  selectedCategory = "",
  page = 1,
  totalPages = 1,
  totalItems = 0,
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
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              <th className="py-3.5 px-4">Product & Category</th>
              <th className="py-3.5 px-4">SKU / Barcode</th>
              <th className="py-3.5 px-4 text-right">Cost Price</th>
              <th className="py-3.5 px-4 text-right">Selling Price</th>
              <th className="py-3.5 px-4 text-center">Margin</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <span className="text-sm font-medium">Fetching catalog records...</span>
                  </div>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-3 max-w-md mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-secondary/80 border border-border flex items-center justify-center text-muted-foreground">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-base">No products found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {search || selectedCategory
                          ? "No matching products found with current filter criteria."
                          : "Start building your catalog by adding your first product."}
                      </p>
                    </div>
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
                const categoryName = p.category?.name || p.category_name || "Uncategorized";
                const isArchived = p.isArchived || p.status === "ARCHIVED";
                const isActive = p.isActive ?? p.is_active ?? !isArchived;

                return (
                  <tr
                    key={id}
                    className="hover:bg-secondary/30 transition-colors group"
                  >
                    {/* Product Name & Category */}
                    <td className="py-3.5 px-4 align-middle">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {p.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[11px] bg-secondary px-2 py-0.5 rounded-md text-muted-foreground font-medium border border-border">
                            <Layers className="w-3 h-3 text-primary" />
                            {categoryName}
                          </span>
                          {p.unit && (
                            <span className="text-[11px] text-muted-foreground">
                              ({p.unit})
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* SKU & Barcode */}
                    <td className="py-3.5 px-4 align-middle font-mono text-xs">
                      <div className="flex flex-col gap-1">
                        {p.sku ? (
                          <div className="flex items-center gap-1.5">
                            <span className="bg-secondary/80 px-2 py-0.5 rounded border border-border text-foreground font-semibold">
                              {p.sku}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(p.sku, `sku-${id}`)}
                              className="text-muted-foreground hover:text-foreground transition-colors p-0.5 cursor-pointer"
                              title="Copy SKU"
                            >
                              {copiedId === `sku-${id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">No SKU</span>
                        )}

                        {p.barcode && (
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span>{p.barcode}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(p.barcode, `bar-${id}`)}
                              className="text-muted-foreground hover:text-foreground transition-colors p-0.5 cursor-pointer"
                              title="Copy Barcode"
                            >
                              {copiedId === `bar-${id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Cost Price */}
                    <td className="py-3.5 px-4 text-right align-middle font-mono text-xs text-muted-foreground">
                      {fmt(cost)}
                    </td>

                    {/* Selling Price */}
                    <td className="py-3.5 px-4 text-right align-middle font-mono text-xs font-bold text-foreground">
                      {fmt(sell)}
                    </td>

                    {/* Margin */}
                    <td className="py-3.5 px-4 text-center align-middle">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full font-mono ${
                          profNum >= 25
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : profNum > 0
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-destructive/10 text-destructive border border-destructive/20"
                        }`}
                      >
                        <TrendingUp className="w-3 h-3" />
                        {profMargin}%
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center align-middle">
                      {isArchived ? (
                        <span className="inline-flex items-center text-[11px] font-semibold bg-muted px-2.5 py-0.5 rounded-full text-muted-foreground border border-border">
                          Archived
                        </span>
                      ) : isActive ? (
                        <span className="inline-flex items-center text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[11px] font-semibold bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right align-middle">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEdit(p)}
                          className="p-1.5 rounded-lg border border-transparent hover:border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                          title="Edit product"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {isArchived ? (
                          onRestore && (
                            <button
                              onClick={() => onRestore(p)}
                              className="p-1.5 rounded-lg border border-transparent hover:border-emerald-500/30 hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-400 transition-all cursor-pointer"
                              title="Restore product"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => onArchive(p)}
                            className="p-1.5 rounded-lg border border-transparent hover:border-amber-500/30 hover:bg-amber-500/10 text-muted-foreground hover:text-amber-400 transition-all cursor-pointer"
                            title="Archive product"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
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
      {!loading && products.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border bg-secondary/20 text-xs text-muted-foreground">
          <div>
            Showing <strong className="text-foreground">{products.length}</strong> items
            {totalItems > 0 && (
              <span>
                {" "}of <strong className="text-foreground">{totalItems}</strong> total
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-border bg-background text-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center gap-1 cursor-pointer font-medium"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>

            <span className="px-2 font-mono text-foreground font-semibold">
              Page {page} of {totalPages || 1}
            </span>

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-border bg-background text-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center gap-1 cursor-pointer font-medium"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
