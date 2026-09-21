import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Boxes, RefreshCw, Zap } from "lucide-react";

export default function InventoryHeader({
  syncingAlerts,
  onSyncAlerts,
  onRefresh,
  loading,
}) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/dashboard")}
          className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-neutral-800 transition-all cursor-pointer"
          title="Return to Dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Inventory Store & Ledger System
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Phase 3 T15/T16: Current physical stock & immutable movement audit ledger
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={onSyncAlerts}
          disabled={syncingAlerts}
          className="btn btn-secondary text-xs flex items-center gap-1.5 py-2 px-3 disabled:opacity-50"
          title="Run background deterministic stock alert scanner"
        >
          <Zap className={`w-3.5 h-3.5 text-amber-400 ${syncingAlerts ? "animate-bounce" : ""}`} />
          <span>{syncingAlerts ? "Evaluating Limits..." : "Sync Stock Limits"}</span>
        </button>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-neutral-800 transition-all cursor-pointer disabled:opacity-50"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-primary" : ""}`} />
        </button>
      </div>
    </div>
  );
}
