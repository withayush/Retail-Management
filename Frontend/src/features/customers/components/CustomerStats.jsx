import React from "react";
import { Users, IndianRupee, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function CustomerStats({
  customers = [],
  loading = false,
}) {
  const totalCustomers = customers.length;
  const totalOutstanding = customers.reduce(
    (sum, c) => sum + Number(c.outstandingBalance || 0),
    0
  );
  const customersWithDebt = customers.filter(
    (c) => Number(c.outstandingBalance || 0) > 0
  ).length;
  const totalCreditLimit = customers.reduce(
    (sum, c) => sum + Number(c.creditLimit || 0),
    0
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* Total Customers */}
      <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
          Total Customers
        </span>
        <div className="text-2xl font-black text-foreground font-mono">
          {loading ? "..." : totalCustomers}
        </div>
        <span className="text-[10px] text-muted-foreground">Registered in CRM</span>
      </div>

      {/* Total Outstanding Khata Debt */}
      <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
        <div className="flex items-center gap-1.5 text-rose-400">
          <IndianRupee className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold uppercase tracking-wider block">
            Total Outstanding
          </span>
        </div>
        <div className="text-2xl font-black text-rose-400 font-mono">
          {loading ? "..." : `₹${totalOutstanding.toLocaleString("en-IN")}`}
        </div>
        <span className="text-[10px] text-muted-foreground">Pending credit receivables</span>
      </div>

      {/* Accounts with Active Balance */}
      <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
        <div className="flex items-center gap-1.5 text-amber-400">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold uppercase tracking-wider block">
            Active Debtors
          </span>
        </div>
        <div className="text-2xl font-black text-amber-400 font-mono">
          {loading ? "..." : customersWithDebt}
        </div>
        <span className="text-[10px] text-muted-foreground">Accounts with balance &gt; 0</span>
      </div>

      {/* Total Approved Credit Line */}
      <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold uppercase tracking-wider block">
            Total Credit Line
          </span>
        </div>
        <div className="text-2xl font-black text-emerald-400 font-mono">
          {loading ? "..." : `₹${totalCreditLimit.toLocaleString("en-IN")}`}
        </div>
        <span className="text-[10px] text-muted-foreground">Combined credit limits</span>
      </div>
    </div>
  );
}
