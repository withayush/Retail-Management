import React from "react";
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Award,
  ArrowDownCircle,
  IndianRupee,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from "lucide-react";

export const formatINR = (val) => {
  if (val === null || val === undefined || isNaN(val)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(val));
};

export function SalesInsights({ summary, comparison, groupBy }) {
  if (!summary) return null;

  const {
    totalSales = 0,
    totalOrders = 0,
    averageOrderValue = 0,
    peakPeriod,
    lowestPeriod,
  } = summary;

  const salesGrowth = comparison?.salesGrowthPercentage || 0;
  const ordersGrowth = comparison?.ordersGrowthPercentage || 0;
  const isSalesPositive = salesGrowth >= 0;
  const isOrdersPositive = ordersGrowth >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Sales Revenue */}
      <div className="p-5 rounded-2xl bg-[#161617]/90 border border-[#D2D2D7]/12 shadow-[0_4px_24px_rgba(0,0,0,0.25)] flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#8E8E93]">Total Sales Revenue</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
            T52 Accrual
          </span>
        </div>
        <div>
          <span className="text-2xl md:text-3xl font-extrabold text-white font-mono">
            {formatINR(totalSales)}
          </span>
          {comparison && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <span
                className={`flex items-center text-xs font-semibold ${
                  isSalesPositive ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {isSalesPositive ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                {salesGrowth > 0 ? `+${salesGrowth}%` : `${salesGrowth}%`}
              </span>
              <span className="text-[11px] text-[#6E6E73]">vs prev period</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Total Valid Orders & AOV */}
      <div className="p-5 rounded-2xl bg-[#161617]/90 border border-[#D2D2D7]/12 shadow-[0_4px_24px_rgba(0,0,0,0.25)] flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#8E8E93]">Total Valid Orders</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold">
            Distinct Invoices
          </span>
        </div>
        <div>
          <span className="text-2xl md:text-3xl font-extrabold text-white font-mono">
            {totalOrders}
          </span>
          <div className="flex items-center justify-between gap-2 mt-1.5">
            <span className="text-[11px] text-[#8E8E93]">
              Avg Order Value (AOV):{" "}
              <strong className="text-white font-mono font-medium">
                {formatINR(averageOrderValue)}
              </strong>
            </span>
            {comparison && (
              <span
                className={`text-[11px] font-semibold ${
                  isOrdersPositive ? "text-sky-400" : "text-rose-400"
                }`}
              >
                {ordersGrowth > 0 ? `+${ordersGrowth}%` : `${ordersGrowth}%`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Peak Performing Period */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-[#161617] to-amber-950/20 border border-amber-500/20 shadow-[0_4px_24px_rgba(0,0,0,0.25)] flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-amber-300 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            Peak Sales Period
          </span>
          <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            Highest Volume
          </span>
        </div>
        <div>
          {peakPeriod ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-xl md:text-2xl font-bold text-white font-mono">
                  {formatINR(peakPeriod.sales)}
                </span>
                <span className="text-xs text-[#8E8E93]">({peakPeriod.orderCount} orders)</span>
              </div>
              <p className="text-xs text-amber-200/80 font-medium mt-1 font-mono">
                {peakPeriod.label || peakPeriod.date}
              </p>
            </>
          ) : (
            <p className="text-xs text-[#6E6E73] italic">No sales in period</p>
          )}
        </div>
      </div>

      {/* 4. Lowest Performing Period */}
      <div className="p-5 rounded-2xl bg-[#161617]/90 border border-[#D2D2D7]/12 shadow-[0_4px_24px_rgba(0,0,0,0.25)] flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#8E8E93] flex items-center gap-1.5">
            <ArrowDownCircle className="w-3.5 h-3.5 text-rose-400" />
            Lowest Period
          </span>
          <span className="text-[10px] font-mono text-[#8E8E93] bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
            Observation
          </span>
        </div>
        <div>
          {lowestPeriod ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-xl md:text-2xl font-bold text-[#D2D2D7] font-mono">
                  {formatINR(lowestPeriod.sales)}
                </span>
                <span className="text-xs text-[#6E6E73]">({lowestPeriod.orderCount} orders)</span>
              </div>
              <p className="text-xs text-[#8E8E93] font-medium mt-1 font-mono">
                {lowestPeriod.label || lowestPeriod.date}
              </p>
            </>
          ) : (
            <p className="text-xs text-[#6E6E73] italic">No sales in period</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default SalesInsights;
