import React from "react";
import { Boxes, Plus, Minus, RefreshCw } from "lucide-react";

export default function InventoryHeader({
  loading,
  onStockIn,
  onStockOut,
  onRefresh,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-200">
            <Boxes className="w-4 h-4" />
          </div>
          <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
            Inventory & Stock Ledger
          </h1>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Live stock levels, movement ledger audit trail, and low-stock alerts
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onStockIn}
          className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Stock In</span>
        </button>

        <button
          onClick={onStockOut}
          className="px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
        >
          <Minus className="w-3.5 h-3.5" />
          <span>Stock Out</span>
        </button>

        <button
          onClick={onRefresh}
          className="px-3 py-2 rounded-xl bg-[#141417] border border-[#27272a] text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-white" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
}
