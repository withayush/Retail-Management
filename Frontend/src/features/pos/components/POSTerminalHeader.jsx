import React from "react";
import { useNavigate } from "react-router-dom";
import { Receipt, ArrowLeft, RefreshCw, Keyboard, History, Zap } from "lucide-react";

export default function POSTerminalHeader({ loading, onRefresh, onOpenShortcuts }) {
  const navigate = useNavigate();

  return (
    <div className="px-4 py-2.5 border-b border-[#1f1f23] bg-[#0c0c0e] flex items-center justify-between gap-3 select-none">
      {/* Left: Brand & Return */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/dashboard")}
          className="p-1.5 rounded-lg border border-[#27272a] hover:bg-[#18181b] text-zinc-400 hover:text-white transition-all cursor-pointer"
          title="Return to Dashboard"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-white text-zinc-950 flex items-center justify-center font-black text-xs">
            <Zap className="w-3.5 h-3.5 fill-current" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-white flex items-center gap-1.5 leading-none">
              Billing Checkout Terminal
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-mono font-normal">
                READY
              </span>
            </h1>
            <span className="text-[10px] text-zinc-500">Rapid POS & Barcode Engine</span>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate("/sales")}
          className="px-2.5 py-1.5 rounded-lg border border-[#27272a] bg-[#141417] hover:bg-[#18181b] text-zinc-300 hover:text-white text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5"
          title="View Invoices & Sales History"
        >
          <History className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden sm:inline text-[11px]">Sales History</span>
        </button>

        <button
          onClick={onOpenShortcuts}
          className="px-2.5 py-1.5 rounded-lg border border-[#27272a] bg-[#141417] hover:bg-[#18181b] text-zinc-300 hover:text-amber-400 text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5"
          title="Keyboard Shortcuts Cheat Sheet (F1)"
        >
          <Keyboard className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline text-[11px]">Shortcuts</span>
          <kbd className="text-[9px] bg-zinc-800 text-zinc-400 px-1 py-0.2 rounded font-mono">F1</kbd>
        </button>

        <button
          onClick={onRefresh}
          className="p-1.5 rounded-lg border border-[#27272a] bg-[#141417] hover:bg-[#18181b] text-zinc-400 hover:text-white transition-all cursor-pointer"
          title="Refresh Catalog (F5)"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-white" : ""}`} />
        </button>
      </div>
    </div>
  );
}
