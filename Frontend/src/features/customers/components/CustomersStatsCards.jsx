import React from "react";
import { Users, AlertTriangle, Wallet, CreditCard } from "lucide-react";

export default function CustomersStatsCards({ customers = [], totals = null, loading = false }) {
  const totalCustomers = customers.length;
  const debtorCustomers = customers.filter((c) => (c.currentBalance || c.outstandingBalance || 0) > 0);
  const totalOutstanding =
    totals?.totalOutstanding ??
    customers.reduce((sum, c) => sum + (c.currentBalance || c.outstandingBalance || 0), 0);
  const debtorCount = totals?.debtorCustomersCount ?? debtorCustomers.length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* Total Customers */}
      <div className="bg-[#161617]/90 backdrop-blur-2xl border border-[#D2D2D7]/12 rounded-[18px] p-4 space-y-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-[#D2D2D7]/24 transition-all duration-300">
        <span className="text-xs font-semibold text-[#6E6E73] block">
          Total Customers
        </span>
        <div className="text-2xl font-bold font-mono text-white">
          {loading ? "…" : totalCustomers}
        </div>
        <span className="text-[11px] text-[#6E6E73] block">Registered accounts</span>
      </div>

      {/* Total Udhaar Outstanding */}
      <div className="bg-[#161617]/90 backdrop-blur-2xl border border-[#FF791B]/30 rounded-[18px] p-4 space-y-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-[#FF791B]/50 transition-all duration-300">
        <span className="text-xs font-semibold text-[#FF791B] block">
          Total Udhaar Outstanding
        </span>
        <div className="text-2xl font-bold font-mono text-[#FFA466]">
          {loading ? "…" : `₹${Number(totalOutstanding).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        </div>
        <span className="text-[11px] text-[#6E6E73] block">
          {totalOutstanding > 0 ? "Receivable credit" : "All cleared"}
        </span>
      </div>

      {/* Active Khata Debtors */}
      <div className="bg-[#161617]/90 backdrop-blur-2xl border border-[#B64400]/30 rounded-[18px] p-4 space-y-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-[#B64400]/50 transition-all duration-300">
        <span className="text-xs font-semibold text-[#FF791B] block">
          Active Khata Debtors
        </span>
        <div className="text-2xl font-bold font-mono text-[#FF791B]">
          {loading ? "…" : debtorCount}
        </div>
        <span className="text-[11px] text-[#6E6E73] block">
          {totalCustomers > 0 ? `${Math.round((debtorCount / totalCustomers) * 100)}% of customer base` : "0%"}
        </span>
      </div>

      {/* Settled / Clear Accounts */}
      <div className="bg-[#161617]/90 backdrop-blur-2xl border border-[#0066CC]/30 rounded-[18px] p-4 space-y-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-[#0066CC]/50 transition-all duration-300">
        <span className="text-xs font-semibold text-[#54A7FF] block">
          Settled Accounts
        </span>
        <div className="text-2xl font-bold font-mono text-[#54A7FF]">
          {loading ? "…" : totalCustomers - debtorCount}
        </div>
        <span className="text-[11px] text-[#6E6E73] block">Zero pending dues</span>
      </div>
    </div>
  );
}
