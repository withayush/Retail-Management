import React from "react";
import { TrendingUp, CheckCircle2, AlertTriangle, Receipt } from "lucide-react";

export default function SalesHistoryStats({ summary }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* Total Billed Revenue */}
      <div className="bg-[#161617]/90 backdrop-blur-2xl border border-[#D2D2D7]/12 rounded-[18px] p-4 space-y-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-[#D2D2D7]/24 transition-all duration-300">
        <span className="text-xs font-semibold text-[#6E6E73] block">
          Total Sales Billed
        </span>
        <div className="text-2xl font-bold font-mono text-white">
          ₹{(summary?.totalSalesAmount || 0).toLocaleString("en-IN")}
        </div>
        <span className="text-[11px] text-[#6E6E73] block">
          Across {summary?.totalInvoicesCount || 0} invoices
        </span>
      </div>

      {/* Total Paid / Collected */}
      <div className="bg-[#161617]/90 backdrop-blur-2xl border border-[#0066CC]/30 rounded-[18px] p-4 space-y-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-[#0066CC]/50 transition-all duration-300">
        <span className="text-xs font-semibold text-[#54A7FF] block">
          Collected Revenue
        </span>
        <div className="text-2xl font-bold font-mono text-[#54A7FF]">
          ₹{(summary?.totalPaidAmount || 0).toLocaleString("en-IN")}
        </div>
        <span className="text-[11px] text-[#6E6E73] block">
          {summary?.paidCount || 0} settled orders
        </span>
      </div>

      {/* Total Outstanding Udhar */}
      <div className="bg-[#161617]/90 backdrop-blur-2xl border border-[#FF791B]/30 rounded-[18px] p-4 space-y-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-[#FF791B]/50 transition-all duration-300">
        <span className="text-xs font-semibold text-[#FF791B] block">
          Pending / Udhar Balance
        </span>
        <div className="text-2xl font-bold font-mono text-[#FFA466]">
          ₹{(summary?.totalDueAmount || 0).toLocaleString("en-IN")}
        </div>
        <span className="text-[11px] text-[#6E6E73] block">
          {(summary?.pendingCount || 0) + (summary?.partialCount || 0)} credit receivables
        </span>
      </div>

      {/* Invoice Count Breakdown */}
      <div className="bg-[#161617]/90 backdrop-blur-2xl border border-[#D2D2D7]/12 rounded-[18px] p-4 space-y-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-[#D2D2D7]/24 transition-all duration-300">
        <span className="text-xs font-semibold text-[#6E6E73] block">
          Invoice Status
        </span>
        <div className="flex items-center gap-1.5 pt-1 flex-wrap">
          <span className="text-[10px] bg-[#0066CC]/20 border border-[#0066CC]/30 text-[#54A7FF] px-2.5 py-0.5 rounded-full font-semibold">
            {summary?.paidCount || 0} Paid
          </span>
          <span className="text-[10px] bg-[#FF791B]/20 border border-[#FF791B]/30 text-[#FFA466] px-2.5 py-0.5 rounded-full font-semibold">
            {summary?.partialCount || 0} Part
          </span>
          <span className="text-[10px] bg-[#B64400]/20 border border-[#B64400]/30 text-[#FF791B] px-2.5 py-0.5 rounded-full font-semibold">
            {summary?.pendingCount || 0} Due
          </span>
        </div>
        <span className="text-[11px] text-[#6E6E73] block">Live order statuses</span>
      </div>
    </div>
  );
}
