import React from "react";
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Coins,
  Receipt,
  Scale,
  Percent,
} from "lucide-react";

/**
 * ProfitSummaryCards (Phase 10 - Task T62)
 * Renders compact, high-precision financial summary metric cards with
 * period-over-period variance indicators.
 */
export default function ProfitSummaryCards({ data }) {
  const formatINR = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  const revenue = data?.revenue ?? 0;
  const cogs = data?.cogs ?? 0;
  const grossProfit = data?.grossProfit ?? 0;
  const opEx = data?.operatingExpenses ?? 0;
  const operatingProfit = data?.operatingProfit ?? 0;
  const grossMargin = data?.grossMargin ?? 0;
  const operatingMargin = data?.operatingMargin ?? 0;

  const comparison = data?.comparison?.metrics;

  const cards = [
    {
      id: "revenue",
      title: "Recognized Revenue",
      amount: revenue,
      subtitle: "Gross Sales Recognized",
      icon: ShoppingBag,
      color: "emerald",
      badge: null,
      comparison: comparison?.revenue,
    },
    {
      id: "cogs",
      title: "Cost of Goods Sold",
      amount: cogs,
      subtitle: "Inventory Line Costs",
      icon: Coins,
      color: "rose",
      badge: null,
      comparison: comparison?.cogs,
      isExpense: true,
    },
    {
      id: "grossProfit",
      title: "Gross Profit",
      amount: grossProfit,
      subtitle: "Revenue − COGS",
      icon: Scale,
      color: "blue",
      badge: `${grossMargin}% margin`,
      comparison: comparison?.grossProfit,
    },
    {
      id: "operatingExpenses",
      title: "Operating Expenses",
      amount: opEx,
      subtitle: "Store Overheads & OpEx",
      icon: Receipt,
      color: "amber",
      badge: null,
      comparison: comparison?.operatingExpenses,
      isExpense: true,
    },
    {
      id: "operatingProfit",
      title: "Operating Profit",
      amount: operatingProfit,
      subtitle: "Gross Profit − OpEx",
      icon: TrendingUp,
      color: operatingProfit >= 0 ? "purple" : "rose",
      badge: `${operatingMargin}% margin`,
      comparison: comparison?.operatingProfit,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
      {cards.map((card) => {
        const Icon = card.icon;
        const changePercent = card.comparison?.changePercent;
        const hasChange = changePercent !== undefined && changePercent !== null;
        const isPositiveChange = hasChange && changePercent > 0;
        const isNegativeChange = hasChange && changePercent < 0;

        // For expenses, an increase is colored red/amber; for revenue/profit, an increase is green
        const isFavorable = card.isExpense ? isNegativeChange : isPositiveChange;
        const isUnfavorable = card.isExpense ? isPositiveChange : isNegativeChange;

        return (
          <div
            key={card.id}
            className="p-4 rounded-2xl bg-[#161617]/90 backdrop-blur-xl border border-[#D2D2D7]/12 shadow-[0_2px_12px_rgba(0,0,0,0.2)] hover:border-[#D2D2D7]/25 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-[11px] font-medium text-[#86868B] uppercase tracking-wider truncate">
                  {card.title}
                </span>
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                    card.color === "emerald"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : card.color === "rose"
                      ? "bg-rose-500/10 text-rose-400"
                      : card.color === "blue"
                      ? "bg-blue-500/10 text-blue-400"
                      : card.color === "amber"
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-purple-500/10 text-purple-400"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="text-lg sm:text-xl font-bold font-mono tracking-tight text-white mb-1">
                {card.amount < 0 ? "-" : ""}
                {formatINR(Math.abs(card.amount))}
              </div>
            </div>

            <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[10px] mt-2">
              <span className="text-[#6E6E73] truncate">{card.subtitle}</span>

              {card.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded-md font-mono font-bold ${
                    card.id === "grossProfit"
                      ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                      : operatingProfit >= 0
                      ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                      : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                  }`}
                >
                  {card.badge}
                </span>
              )}

              {hasChange && !card.badge && (
                <span
                  className={`flex items-center font-mono font-medium ${
                    isFavorable
                      ? "text-emerald-400"
                      : isUnfavorable
                      ? "text-rose-400"
                      : "text-[#86868B]"
                  }`}
                  title={`Previous: ${formatINR(card.comparison?.previous || 0)}`}
                >
                  {isPositiveChange ? "+" : ""}
                  {changePercent}%
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
