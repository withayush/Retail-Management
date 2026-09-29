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
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#0066CC]/20 border border-[#0066CC]/30 flex items-center justify-center text-[#54A7FF]">
            <Boxes className="w-4 h-4" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Inventory & Stock Ledger
          </h1>
        </div>
        <p className="text-xs text-[#6E6E73] mt-1">
          Real-time stock audit, movement trail, and proactive catalog alerts
        </p>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onStockIn}
          className="apple-btn-primary text-xs py-2 px-4 shadow-[0_2px_12px_rgba(0,102,204,0.35)]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Stock In</span>
        </button>

        <button
          onClick={onStockOut}
          className="apple-btn-secondary text-xs py-2 px-4"
        >
          <Minus className="w-3.5 h-3.5 text-[#FF791B]" />
          <span>Stock Out</span>
        </button>

        <button
          onClick={onRefresh}
          className="apple-btn-secondary text-xs py-2 px-3.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0066CC]" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
}
