import React from "react";
import { Plus, RefreshCw, Users } from "lucide-react";

export default function CustomersHeader({ onAddCustomer, onRefresh, loading }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-zinc-950 flex items-center justify-center font-bold">
            <Users className="w-4 h-4" />
          </div>
          Customers & Khata Ledger
        </h1>
        <p className="text-xs text-zinc-400">
          Track customer accounts, outstanding debt, and audit trail of credit sales (T29)
        </p>
      </div>

      <div className="flex items-center gap-2">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-[#141417] border border-[#27272a] hover:bg-[#18181b] text-zinc-400 hover:text-white transition-all cursor-pointer"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-white" : ""}`} />
          </button>
        )}

        <button
          onClick={onAddCustomer}
          className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>
    </div>
  );
}
