import React from "react";
import { Boxes, History, BellRing } from "lucide-react";

export default function InventoryTabs({
  activeTab,
  setActiveTab,
  alertsTotalActive = 0,
}) {
  return (
    <div className="flex items-center gap-2 border-b border-border/70 pb-3 overflow-x-auto">
      <button
        onClick={() => setActiveTab("STORE_STATE")}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
          activeTab === "STORE_STATE"
            ? "bg-neutral-800 text-foreground border border-neutral-700 shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-neutral-800/40"
        }`}
      >
        <Boxes className="w-4 h-4 text-emerald-400" />
        <span>Current Stock State (T15)</span>
      </button>

      <button
        onClick={() => setActiveTab("LEDGER_TRAIL")}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
          activeTab === "LEDGER_TRAIL"
            ? "bg-neutral-800 text-foreground border border-neutral-700 shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-neutral-800/40"
        }`}
      >
        <History className="w-4 h-4 text-primary" />
        <span>Movement Ledger Audit Trail (T16)</span>
      </button>

      <button
        onClick={() => setActiveTab("ALERTS_QUEUE")}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
          activeTab === "ALERTS_QUEUE"
            ? "bg-neutral-800 text-foreground border border-neutral-700 shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-neutral-800/40"
        }`}
      >
        <BellRing className="w-4 h-4 text-amber-400" />
        <span>Low-Stock Alerts Queue (T22)</span>
        {alertsTotalActive > 0 && (
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            {alertsTotalActive}
          </span>
        )}
      </button>
    </div>
  );
}
