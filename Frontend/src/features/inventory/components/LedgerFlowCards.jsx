import React from "react";
import { ArrowDownLeft, ArrowUpRight, TrendingUp, ShieldCheck } from "lucide-react";

export default function LedgerFlowCards({ ledgerSummary, ledgerPagination }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-[#111113] border border-[#1f1f23] rounded-xl p-3 shadow-xs">
        <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
          <span>Total Inflow</span>
          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <p className="text-lg font-bold font-mono text-emerald-400 mt-1">
          +{ledgerSummary?.totalInQty || 0}
        </p>
        <span className="text-[11px] text-zinc-500">Units Added</span>
      </div>

      <div className="bg-[#111113] border border-[#1f1f23] rounded-xl p-3 shadow-xs">
        <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
          <span>Total Outflow</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-red-400" />
        </div>
        <p className="text-lg font-bold font-mono text-red-400 mt-1">
          -{ledgerSummary?.totalOutQty || 0}
        </p>
        <span className="text-[11px] text-zinc-500">Units Dispatched</span>
      </div>

      <div className="bg-[#111113] border border-[#1f1f23] rounded-xl p-3 shadow-xs">
        <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
          <span>Net Stock Flow</span>
          <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
        </div>
        <p
          className={`text-lg font-bold font-mono mt-1 ${
            (ledgerSummary?.netFlowQty || 0) > 0
              ? "text-emerald-400"
              : (ledgerSummary?.netFlowQty || 0) < 0
              ? "text-red-400"
              : "text-white"
          }`}
        >
          {(ledgerSummary?.netFlowQty || 0) > 0
            ? `+${ledgerSummary.netFlowQty}`
            : ledgerSummary?.netFlowQty || 0}
        </p>
        <span className="text-[11px] text-zinc-500">Net Variance</span>
      </div>

      <div className="bg-[#111113] border border-[#1f1f23] rounded-xl p-3 shadow-xs">
        <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
          <span>Total Records</span>
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
        </div>
        <p className="text-lg font-bold font-mono text-white mt-1">
          {ledgerPagination?.total || ledgerSummary?.totalEntries || 0}
        </p>
        <span className="text-[11px] text-zinc-500">Logged Entries</span>
      </div>
    </div>
  );
}
