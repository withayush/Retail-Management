import React from "react";
import { TrendingUp, CheckCircle2, AlertTriangle, Receipt } from "lucide-react";

export default function SalesHistoryStats({ summary }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Total Billed Revenue */}
      <div className="bg-[#111113] border border-[#1f1f23] rounded-xl p-3.5 space-y-1 hover-lift cursor-default">
        <span className="text-xs font-medium text-zinc-400">
          Total Sales Billed
        </span>
        <div className="text-xl font-bold font-mono text-white">
          ₹{(summary?.totalSalesAmount || 0).toLocaleString("en-IN")}
        </div>
        <span className="text-[11px] text-zinc-500">
          Across {summary?.totalInvoicesCount || 0} invoices
        </span>
      </div>

      {/* Total Paid / Collected */}
      <div className="bg-[#111113] border border-[#1f1f23] rounded-xl p-3.5 space-y-1 hover-lift cursor-default">
        <span className="text-xs font-medium text-zinc-400">
          Collected Revenue
        </span>
        <div className="text-xl font-bold font-mono text-emerald-400">
          ₹{(summary?.totalPaidAmount || 0).toLocaleString("en-IN")}
        </div>
        <span className="text-[11px] text-zinc-500">
          {summary?.paidCount || 0} settled orders
        </span>
      </div>

      {/* Total Outstanding Udhar */}
      <div className="bg-[#111113] border border-[#1f1f23] rounded-xl p-3.5 space-y-1 hover-lift cursor-default">
        <span className="text-xs font-medium text-zinc-400">
          Pending / Udhar Balance
        </span>
        <div className="text-xl font-bold font-mono text-amber-400">
          ₹{(summary?.totalDueAmount || 0).toLocaleString("en-IN")}
        </div>
        <span className="text-[11px] text-zinc-500">
          {(summary?.pendingCount || 0) + (summary?.partialCount || 0)} credit receivables
        </span>
      </div>

      {/* Invoice Count Breakdown */}
      <div className="bg-[#111113] border border-[#1f1f23] rounded-xl p-3.5 space-y-1 hover-lift cursor-default">
        <span className="text-xs font-medium text-zinc-400">
          Invoice Status
        </span>
        <div className="flex items-center gap-1.5 pt-0.5">
          <span className="text-[11px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-semibold">
            {summary?.paidCount || 0} Paid
          </span>
          <span className="text-[11px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-semibold">
            {summary?.partialCount || 0} Part
          </span>
          <span className="text-[11px] bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded font-semibold">
            {summary?.pendingCount || 0} Due
          </span>
        </div>
        <span className="text-[11px] text-zinc-500">Live order statuses</span>
      </div>
    </div>
  );
}
