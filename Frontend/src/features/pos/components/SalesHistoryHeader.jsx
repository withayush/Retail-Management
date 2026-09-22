import React from "react";
import { useNavigate } from "react-router-dom";
import { Receipt, ArrowLeft, RefreshCw, Plus } from "lucide-react";

export default function SalesHistoryHeader({ nextInvNum, loading, onRefresh }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-200">
            <Receipt className="w-4 h-4" />
          </div>
          <h1 className="text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Sales & Invoices Ledger</span>
            <span className="text-[11px] bg-zinc-800 text-zinc-400 border border-zinc-700/60 px-2 py-0.5 rounded font-mono font-normal">
              Next: {nextInvNum}
            </span>
          </h1>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Transaction records, invoice flow, and payment settlement tracking
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onRefresh}
          className="px-3 py-2 rounded-xl bg-[#141417] border border-[#27272a] text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-white" : ""}`} />
          <span>Refresh</span>
        </button>

        <button
          onClick={() => navigate("/pos")}
          className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-900 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New POS Sale</span>
        </button>
      </div>
    </div>
  );
}
