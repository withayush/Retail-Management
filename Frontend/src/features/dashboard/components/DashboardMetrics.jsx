import React from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Receipt, AlertTriangle, Users } from "lucide-react";

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
      subtitle: `${totalInvoicesCount} invoices`,
      icon: TrendingUp,
      link: "/sales",
    },
    {
      title: "Pending Invoices",
      value: pendingCount,
      subtitle: "Unpaid sales",
      icon: Receipt,
      link: "/sales",
    },
    {
      title: "Low Stock Items",
      value: lowStockAlerts + outOfStockAlerts,
      subtitle: `${outOfStockAlerts} out of stock`,
      icon: AlertTriangle,
      link: "/inventory",
    },
    {
      title: "Customer Udhaar",
      value: formatCurrency(totalOutstanding),
      subtitle: `${totalCustomers} customers`,
      icon: Users,
      link: "/customers",
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
            className="p-4 bg-[#111113] border border-[#1f1f23] rounded-xl hover-lift transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-medium">
                {card.title}
              </span>
              <Icon className="w-4 h-4 text-zinc-400" />
            </div>

            <div className="mt-2">
              {loading ? (
                <div className="h-7 w-20 bg-zinc-800 animate-pulse rounded" />
              ) : (
                <p className="text-xl font-bold text-white">{card.value}</p>
              )}
            </div>

            <p className="mt-1 text-xs text-zinc-500">{card.subtitle}</p>
          </Link>
        );
      })}
    </div>
  );
}
