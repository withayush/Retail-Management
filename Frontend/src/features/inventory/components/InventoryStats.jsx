import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, TrendingUp, Package } from "lucide-react";

export default function InventoryStats({ summary, loading }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {/* Card 1: Total SKUs */}
      <div className="bg-[#111113] border border-[#1f1f23] rounded-xl p-3.5 space-y-1">
        <span className="text-xs font-medium text-zinc-400">
          Catalog SKUs
        </span>
        <div className="text-xl font-bold text-white">
          {loading && !summary ? "…" : summary?.totalProducts || 0}
        </div>
        <span className="text-[11px] text-zinc-500">Tracked products</span>
      </div>

      {/* Card 2: In-Stock */}
      <div className="bg-[#111113] border border-[#1f1f23] rounded-xl p-3.5 space-y-1">
        <span className="text-xs font-medium text-zinc-400 flex items-center gap-1">
          In Stock
        </span>
        <div className="text-xl font-bold text-emerald-400">
          {loading && !summary ? "…" : summary?.inStockCount || 0}
        </div>
        <span className="text-[11px] text-zinc-500">Healthy inventory</span>
      </div>

      {/* Card 3: Low Stock Alerts */}
      <div className="bg-[#111113] border border-[#1f1f23] rounded-xl p-3.5 space-y-1">
        <span className="text-xs font-medium text-zinc-400 flex items-center gap-1">
          Low Stock
        </span>
        <div className="text-xl font-bold text-amber-400">
          {loading && !summary ? "…" : summary?.lowStockCount || 0}
        </div>
        <span className="text-[11px] text-zinc-500">Below reorder level</span>
      </div>

      {/* Card 4: Out of Stock */}
      <div className="bg-[#111113] border border-[#1f1f23] rounded-xl p-3.5 space-y-1">
        <span className="text-xs font-medium text-zinc-400 flex items-center gap-1">
          Out of Stock
        </span>
        <div className="text-xl font-bold text-red-400">
          {loading && !summary ? "…" : summary?.outOfStockCount || 0}
        </div>
        <span className="text-[11px] text-zinc-500">Zero available units</span>
      </div>

      {/* Card 5: Inventory Valuation */}
      <div className="bg-[#111113] border border-[#1f1f23] rounded-xl p-3.5 space-y-1 col-span-2 md:col-span-1">
        <span className="text-xs font-medium text-zinc-400 flex items-center gap-1">
          Total Asset Val.
        </span>
        <div className="text-xl font-bold font-mono text-white">
          ₹{loading && !summary ? "…" : (summary?.totalValuation || 0).toLocaleString("en-IN")}
        </div>
        <span className="text-[11px] text-zinc-500">Based on cost price</span>
      </div>
    </div>
  );
}
