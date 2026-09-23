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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Total Customers */}
      <div className="bg-[#111113] border border-[#1f1f23] rounded-xl p-3.5 space-y-1 hover-lift cursor-default">
        <span className="text-xs font-medium text-zinc-400">
          Total Customers
        </span>
        <div className="text-xl font-bold font-mono text-white">
          {loading ? "…" : totalCustomers}
        </div>
        <span className="text-[11px] text-zinc-500">Registered accounts</span>
      </div>

      {/* Total Udhaar Outstanding */}
      <div className="bg-[#111113] border border-[#1f1f23] rounded-xl p-3.5 space-y-1 hover-lift cursor-default">
        <span className="text-xs font-medium text-zinc-400">
          Total Udhaar Outstanding
        </span>
        <div className="text-xl font-bold font-mono text-amber-400">
          {loading ? "…" : `₹${Number(totalOutstanding).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        </div>
        <span className="text-[11px] text-zinc-500">
          {totalOutstanding > 0 ? "Receivable credit" : "All cleared"}
        </span>
      </div>

      {/* Active Khata Debtors */}
      <div className="bg-[#111113] border border-[#1f1f23] rounded-xl p-3.5 space-y-1 hover-lift cursor-default">
        <span className="text-xs font-medium text-zinc-400">
          Active Khata Debtors
        </span>
        <div className="text-xl font-bold font-mono text-red-400">
          {loading ? "…" : debtorCount}
        </div>
        <span className="text-[11px] text-zinc-500">
          {totalCustomers > 0 ? `${Math.round((debtorCount / totalCustomers) * 100)}% of customers` : "0%"}
        </span>
      </div>

      {/* Settled / Clear Accounts */}
      <div className="bg-[#111113] border border-[#1f1f23] rounded-xl p-3.5 space-y-1 hover-lift cursor-default">
        <span className="text-xs font-medium text-zinc-400">
          Settled Accounts
        </span>
        <div className="text-xl font-bold font-mono text-emerald-400">
          {loading ? "…" : totalCustomers - debtorCount}
        </div>
        <span className="text-[11px] text-zinc-500">Zero pending dues</span>
      </div>
    </div>
  );
}
