import React from "react";
import { BellRing, XCircle, AlertTriangle, ShieldCheck } from "lucide-react";

export default function AlertsSummaryCards({ alertsSummary }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
      <div className="bg-[#161617]/90 backdrop-blur-2xl border border-[#D2D2D7]/12 rounded-[18px] p-4 space-y-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between text-[#6E6E73] text-xs font-semibold">
          <span>Active Triggers</span>
          <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[#D2D2D7]">
            <BellRing className="w-3.5 h-3.5" />
          </div>
        </div>
        <p className="text-2xl font-bold font-mono text-white">
          {alertsSummary?.totalActive || 0}
        </p>
        <span className="text-[11px] text-[#6E6E73] block">Require attention</span>
      </div>

      <div className="bg-[#161617]/90 backdrop-blur-2xl border border-[#B64400]/30 rounded-[18px] p-4 space-y-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between text-[#FF791B] text-xs font-semibold">
          <span>Critical (OOS)</span>
          <div className="w-6 h-6 rounded-full bg-[#B64400]/20 flex items-center justify-center text-[#FF791B]">
            <XCircle className="w-3.5 h-3.5" />
          </div>
        </div>
        <p className="text-2xl font-bold font-mono text-[#FF791B]">
          {alertsSummary?.criticalCount || 0}
        </p>
        <span className="text-[11px] text-[#6E6E73] block">0 units available</span>
      </div>

      <div className="bg-[#161617]/90 backdrop-blur-2xl border border-[#FF791B]/30 rounded-[18px] p-4 space-y-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between text-[#FFA466] text-xs font-semibold">
          <span>Low Stock Warnings</span>
          <div className="w-6 h-6 rounded-full bg-[#FF791B]/20 flex items-center justify-center text-[#FFA466]">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
        </div>
        <p className="text-2xl font-bold font-mono text-[#FFA466]">
          {alertsSummary?.warningCount || 0}
        </p>
        <span className="text-[11px] text-[#6E6E73] block">Below reorder level</span>
      </div>

      <div className="bg-[#161617]/90 backdrop-blur-2xl border border-[#0066CC]/30 rounded-[18px] p-4 space-y-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between text-[#54A7FF] text-xs font-semibold">
          <span>Auto-Resolved</span>
          <div className="w-6 h-6 rounded-full bg-[#0066CC]/20 flex items-center justify-center text-[#54A7FF]">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
        </div>
        <p className="text-2xl font-bold font-mono text-[#54A7FF]">
          {alertsSummary?.resolvedCount || 0}
        </p>
        <span className="text-[11px] text-[#6E6E73] block">Restocked & healthy</span>
      </div>
    </div>
  );
}
