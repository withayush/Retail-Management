import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, IndianRupee } from "lucide-react";

export default function InventorySummary({ summary }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {/* 1. Catalog SKUs */}
      <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 shadow-sm space-y-1">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Catalog SKUs
        </p>
        <p className="text-2xl font-black text-foreground font-mono">
          {summary ? summary.totalProducts : "--"}
        </p>
        <p className="text-[10px] text-muted-foreground">Active products tracked</p>
      </div>

      {/* 2. In Stock */}
      <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 shadow-sm space-y-1">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <p className="text-[11px] font-semibold uppercase tracking-wider">In Stock</p>
        </div>
        <p className="text-2xl font-black text-emerald-400 font-mono">
          {summary ? summary.inStockCount : "--"}
        </p>
        <p className="text-[10px] text-muted-foreground">Healthy inventory</p>
      </div>

      {/* 3. Low Stock */}
      <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 shadow-sm space-y-1">
        <div className="flex items-center gap-1.5 text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5" />
          <p className="text-[11px] font-semibold uppercase tracking-wider">Low Stock</p>
        </div>
        <p className="text-2xl font-black text-amber-400 font-mono">
          {summary ? summary.lowStockCount : "--"}
        </p>
        <p className="text-[10px] text-muted-foreground">Below reorder level</p>
      </div>

      {/* 4. Out of Stock */}
      <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 shadow-sm space-y-1">
        <div className="flex items-center gap-1.5 text-rose-400">
          <XCircle className="w-3.5 h-3.5" />
          <p className="text-[11px] font-semibold uppercase tracking-wider">Out of Stock</p>
        </div>
        <p className="text-2xl font-black text-rose-400 font-mono">
          {summary ? summary.outOfStockCount : "--"}
        </p>
        <p className="text-[10px] text-muted-foreground">Zero available units</p>
      </div>

      {/* 5. Total Asset Valuation */}
      <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 shadow-sm space-y-1 col-span-2 sm:col-span-1">
        <div className="flex items-center gap-1.5 text-primary">
          <IndianRupee className="w-3.5 h-3.5" />
          <p className="text-[11px] font-semibold uppercase tracking-wider">Total Asset Val.</p>
        </div>
        <p className="text-2xl font-black text-foreground font-mono">
          ₹{summary?.totalValuation ? summary.totalValuation.toLocaleString("en-IN") : "0"}
        </p>
        <p className="text-[10px] text-muted-foreground">Based on cost prices</p>
      </div>
    </div>
  );
}
