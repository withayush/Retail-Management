import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Package, ChevronRight } from "lucide-react";

export default function DashboardRecentProducts({
  recentProducts = [],
  totalProducts = 0,
  loading = false,
}) {
  const navigate = useNavigate();

  return (
    <div className="p-5 md:p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/90 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            Recent Products in Catalog
          </h3>
          <p className="text-xs text-muted-foreground">
            Quick preview of active products, pricing, and category tags
          </p>
        </div>
        <Link
          to="/products"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          View Catalog ({totalProducts}) <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-muted-foreground">Loading products...</div>
      ) : recentProducts.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-neutral-800 rounded-xl space-y-2">
          <Package className="w-7 h-7 text-neutral-600 mx-auto" />
          <p className="text-xs text-muted-foreground">No products added yet.</p>
          <Link to="/products?action=add" className="btn btn-primary text-xs inline-flex">
            Add Your First Product
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {recentProducts.map((prod) => (
            <div
              key={prod._id || prod.id}
              onClick={() => navigate("/products")}
              className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800/80 hover:border-neutral-700 transition-all cursor-pointer group flex items-center justify-between"
            >
              <div className="min-w-0 pr-3">
                <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                  {prod.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono bg-neutral-800 text-muted-foreground px-1.5 py-0.5 rounded">
                    {prod.sku || "NO-SKU"}
                  </span>
                  {prod.categoryId?.name && (
                    <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                      {prod.categoryId.name}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-emerald-400 font-mono">
                  ₹{prod.sellingPrice?.toLocaleString("en-IN")}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  Cost: ₹{prod.costPrice || 0}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
