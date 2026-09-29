import React from "react";
import { Truck, CheckCircle2, Clock, IndianRupee, ArrowUpRight } from "lucide-react";

export default function SupplierStatsCards({ summary, loading, onOpenPayables }) {
  const stats = [
    {
      id: "total",
      label: "Total Suppliers",
      value: loading ? "..." : (summary?.totalSuppliers || 0).toLocaleString(),
      subtext: "Registered vendors & distributors",
      icon: Truck,
      accent: "blue",
      badgeClass: "bg-[#0066CC]/20 text-[#54A7FF] border-[#0066CC]/30",
    },
    {
      id: "active",
      label: "Active Vendors",
      value: loading ? "..." : (summary?.activeSuppliers || 0).toLocaleString(),
      subtext: "Ready for procurement orders",
      icon: CheckCircle2,
      accent: "emerald",
      badgeClass: "bg-[#0066CC]/20 text-[#54A7FF] border-[#0066CC]/30",
    },
    {
      id: "payables",
      label: "Payable Balance",
      value: loading
        ? "..."
        : `₹${(summary?.totalPayableOutstanding || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
      subtext: `${summary?.suppliersWithPayablesCount || 0} vendors with pending dues`,
      icon: Clock,
      clickable: true,
      badge: "Open Indexer",
      badgeClass: "bg-[#FF791B]/20 text-[#FFA466] border-[#FF791B]/30",
    },
    {
      id: "procurements",
      label: "Procurement Volume",
      value: loading
        ? "..."
        : `₹${(summary?.totalPurchasesVolume || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
      subtext: "Lifetime inventory spend",
      icon: IndianRupee,
      accent: "violet",
      badgeClass: "bg-[#0066CC]/20 text-[#54A7FF] border-[#0066CC]/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        const isPayables = stat.id === "payables" && onOpenPayables;

        return (
          <div
            key={i}
            onClick={isPayables ? onOpenPayables : undefined}
            className={`bg-[#161617]/90 backdrop-blur-2xl border border-[#D2D2D7]/12 rounded-[18px] p-5 flex items-start justify-between shadow-[0_4px_20px_rgba(0,0,0,0.3)] relative overflow-hidden group transition-all duration-300 ${
              isPayables
                ? "cursor-pointer hover:border-[#FF791B]/50 hover:-translate-y-1 hover:shadow-[0_12px_36px_rgba(0,0,0,0.45)]"
                : "hover:border-[#D2D2D7]/24 hover:-translate-y-1"
            }`}
            title={isPayables ? "Click to view Outstanding Payables Indexer" : undefined}
          >
            <div className="space-y-1.5 z-10 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#6E6E73] tracking-wide block">
                  {stat.label}
                </span>
                {stat.badge && (
                  <span className="text-[10px] bg-[#FF791B]/15 text-[#FFA466] border border-[#FF791B]/30 px-2 py-0.5 rounded-full font-semibold flex items-center gap-0.5">
                    {stat.badge} <ArrowUpRight className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold text-white tracking-tight truncate">
                {stat.value}
              </div>
              <p className="text-xs text-[#6E6E73] truncate">{stat.subtext}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#D2D2D7] group-hover:text-white group-hover:border-[#0066CC]/50 transition-all duration-300 shrink-0">
              <Icon className="w-4 h-4" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
