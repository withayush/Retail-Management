import React from "react";
import { useNavigate } from "react-router-dom";
import { Receipt, ArrowLeft, RefreshCw, Keyboard, History, Zap, ShieldCheck } from "lucide-react";

export default function POSTerminalHeader({ loading, onRefresh, onOpenShortcuts }) {
  const navigate = useNavigate();

  return (
    <div className="px-5 py-3 border-b border-[#D2D2D7]/12 bg-black/80 backdrop-blur-2xl flex items-center justify-between gap-3 select-none sticky top-0 z-20">
      {/* Left: Brand & Return */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/dashboard")}
          className="p-2 rounded-full border border-[#D2D2D7]/16 hover:bg-white/10 text-[#D2D2D7] hover:text-white transition-all cursor-pointer active:scale-95"
          title="Return to Dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#0066CC] text-white flex items-center justify-center font-bold text-xs shadow-[0_2px_8px_rgba(0,102,204,0.4)]">
            <Zap className="w-3.5 h-3.5 fill-current" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-white flex items-center gap-2 leading-none">
              POS Terminal
              <span className="text-[10px] bg-[#0066CC]/20 text-[#54A7FF] border border-[#0066CC]/30 px-2 py-0.5 rounded-full font-semibold">
                IDEMPOTENT ENGINE READY
              </span>
            </h1>
            <span className="text-[10px] text-[#6E6E73] font-normal">Atomic Zero-Overselling Register</span>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate("/sales")}
          className="apple-btn-secondary text-xs py-1.5 px-3.5"
          title="View Invoices & Sales History"
        >
          <History className="w-3.5 h-3.5 text-[#0066CC]" />
          <span className="hidden sm:inline text-xs font-medium">Sales Records</span>
        </button>

        <button
          onClick={onOpenShortcuts}
          className="apple-btn-secondary text-xs py-1.5 px-3.5"
          title="Keyboard Shortcuts Cheat Sheet (F1)"
        >
          <Keyboard className="w-3.5 h-3.5 text-[#FF791B]" />
          <span className="hidden sm:inline text-xs font-medium">Shortcuts</span>
          <kbd className="text-[9px] bg-white/10 text-[#D2D2D7] px-1.5 py-0.5 rounded-full font-mono">F1</kbd>
        </button>

        <button
          onClick={onRefresh}
          className="p-2 rounded-full border border-[#D2D2D7]/16 bg-white/5 hover:bg-white/10 text-[#D2D2D7] hover:text-white transition-all cursor-pointer active:scale-95"
          title="Refresh Catalog (F5)"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0066CC]" : ""}`} />
        </button>
      </div>
    </div>
  );
}
