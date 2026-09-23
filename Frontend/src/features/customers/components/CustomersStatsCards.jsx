import React from "react";
import { Users, AlertTriangle, Wallet, CreditCard } from "lucide-react";

export default function CustomersStatsCards({ customers = [], totals = null, loading = false }) {
  const totalCustomers = customers.length;
  const debtorCustomers = customers.filter((c) => (c.currentBalance || c.outstandingBalance || 0) > 0);
  const totalOutstanding =
    totals?.totalOutstanding ??
    customers.reduce((sum, c) => sum + (c.currentBalance || c.outstandingBalance || 0), 0);
  const debtorCount = totals?.debtorCustomersCount ?? debtorCustomers.length;

  const stats = [
    {
      label: "Total Customers",
      value: totalCustomers,
      icon: Users,
      color: "text-zinc-100",
      bgColor: "bg-zinc-800/60",
      borderColor: "border-zinc-700/60",
    },
    {
      label: "Total Udhaar Outstanding",
      value: `₹${Number(totalOutstanding).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: Wallet,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
      badge: totalOutstanding > 0 ? "Receivable" : "All Clear",
    },
    {
      label: "Active Khata Debtors",
      value: debtorCount,
      icon: AlertTriangle,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      subtext: totalCustomers > 0 ? `${Math.round((debtorCount / totalCustomers) * 100)}% of customers` : "0%",
    },
    {
      label: "Settled / Clear Accounts",
      value: totalCustomers - debtorCount,
      icon: CreditCard,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      subtext: "0 Pending Dues",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {stats.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-[#111113] border border-[#1f1f23] flex flex-col justify-between shadow-xs transition-all hover:border-zinc-700"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-400">{item.label}</span>
              <div className={`w-8 h-8 rounded-xl ${item.bgColor} border ${item.borderColor} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${item.color}`} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className={`text-xl font-bold font-mono ${item.color}`}>
                  {loading ? "..." : item.value}
                </span>
                {item.badge && (
                  <span className="text-[10px] bg-amber-400/10 text-amber-400 border border-amber-400/20 px-1.5 py-0.2 rounded font-medium">
                    {item.badge}
                  </span>
                )}
              </div>
              {item.subtext && <p className="text-[11px] text-zinc-500 font-mono">{item.subtext}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
