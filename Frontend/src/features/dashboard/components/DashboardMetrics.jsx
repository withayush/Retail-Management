import React from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Receipt, AlertTriangle, Users, ArrowUpRight } from "lucide-react";

export default function DashboardMetrics({
  totalSalesAmount = 0,
  totalInvoicesCount = 0,
  pendingCount = 0,
  lowStockAlerts = 0,
  outOfStockAlerts = 0,
  totalCustomers = 0,
  totalOutstanding = 0,
  loading = false,
}) {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  const cards = [
    {
      title: "Total Revenue",
      value: formatCurrency(totalSalesAmount),
      subtitle: `${totalInvoicesCount} invoices settled`,
      icon: TrendingUp,
      link: "/sales",
      accent: "blue",
      badge: "Gross Sales",
    },
    {
      title: "Pending Invoices",
      value: pendingCount,
      subtitle: "Awaiting payment settlement",
      icon: Receipt,
      link: "/sales",
      accent: "orange",
      badge: "Action Required",
    },
    {
      title: "Stock Health",
      value: lowStockAlerts + outOfStockAlerts,
      subtitle: `${outOfStockAlerts} critical / ${lowStockAlerts} low`,
      icon: AlertTriangle,
      link: "/inventory",
      accent: "vibrant",
      badge: "Catalog Alerts",
    },
    {
      title: "Customer Khata",
      value: formatCurrency(totalOutstanding),
      subtitle: `${totalCustomers} active customer ledger`,
      icon: Users,
      link: "/customers",
      accent: "neutral",
      badge: "Credit Balance",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Link
            key={idx}
            to={card.link}
            className="group relative p-5 bg-[#161617]/90 backdrop-blur-2xl border border-[#D2D2D7]/12 rounded-[18px] shadow-[0_4px_24px_rgba(0,0,0,0.3)] hover:border-[#D2D2D7]/28 hover:shadow-[0_12px_36px_rgba(0,0,0,0.45)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            {/* Top specular reflection */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#D2D2D7]/20 to-transparent" />

            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#6E6E73] tracking-tight group-hover:text-[#D2D2D7] transition-colors">
                  {card.title}
                </span>
                <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#D2D2D7] group-hover:text-white group-hover:scale-110 group-hover:border-[#0066CC]/50 transition-all duration-300">
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="mt-3">
                {loading ? (
                  <div className="h-8 w-28 bg-white/10 animate-pulse rounded-lg" />
                ) : (
                  <p className="text-2xl font-bold text-white tracking-tight">
                    {card.value}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#D2D2D7]/8 flex items-center justify-between">
              <span className="text-[11px] text-[#6E6E73] font-normal truncate">
                {card.subtitle}
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#6E6E73] group-hover:text-[#0066CC] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 shrink-0" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
