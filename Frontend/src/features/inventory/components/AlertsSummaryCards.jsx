import React from "react";
import { BellRing, XCircle, AlertTriangle, ShieldCheck } from "lucide-react";

export default function AlertsSummaryCards({ alertsSummary }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-[#111113] border border-[#1f1f23] rounded-xl p-3.5 space-y-1">
        <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
          <span>Active Triggers</span>
          <BellRing className="w-3.5 h-3.5 text-zinc-300" />
        </div>
        <p className="text-xl font-bold font-mono text-white">
          {alertsSummary?.totalActive || 0}
        </p>
        <span className="text-[11px] text-zinc-500">Require attention</span>
      </div>

      <div className="bg-[#111113] border border-red-500/20 rounded-xl p-3.5 space-y-1">
        <div className="flex items-center justify-between text-red-400 text-xs font-medium">
          <span>Critical (OOS)</span>
          <XCircle className="w-3.5 h-3.5 text-red-400" />
        </div>
        <p className="text-xl font-bold font-mono text-red-400">
          {alertsSummary?.criticalCount || 0}
        </p>
        <span className="text-[11px] text-zinc-500">0 units available</span>
      </div>

      <div className="bg-[#111113] border border-amber-500/20 rounded-xl p-3.5 space-y-1">
        <div className="flex items-center justify-between text-amber-400 text-xs font-medium">
          <span>Low Stock Warnings</span>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <p className="text-xl font-bold font-mono text-amber-400">
          {alertsSummary?.warningCount || 0}
        </p>
        <span className="text-[11px] text-zinc-500">Below reorder level</span>
      </div>

      <div className="bg-[#111113] border border-emerald-500/20 rounded-xl p-3.5 space-y-1">
        <div className="flex items-center justify-between text-emerald-400 text-xs font-medium">
          <span>Auto-Resolved</span>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <p className="text-xl font-bold font-mono text-emerald-400">
          {alertsSummary?.resolvedCount || 0}
        </p>
        <span className="text-[11px] text-zinc-500">Restocked & cleared</span>
      </div>
    </div>
  );
}
