import React from "react";
import { IndianRupee, ShoppingBag, Clock, Calendar, BarChart2, Layers } from "lucide-react";

const GROUPING_OPTIONS = [
  { id: "hour", label: "Hourly", icon: Clock },
  { id: "day", label: "Daily", icon: Calendar },
  { id: "week", label: "Weekly", icon: Layers },
  { id: "month", label: "Monthly", icon: BarChart2 },
];

export function SalesMetricSelector({
  groupBy,
  onSelectGroupBy,
  selectedMetric,
  onSelectMetric,
}) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-3.5 bg-[#161617]/90 border border-[#D2D2D7]/12 rounded-2xl shadow-sm backdrop-blur-xl">
      {/* 1. Grouping Mode Selector */}
      <div className="flex items-center gap-1.5 p-1 bg-[#1A1A1E] border border-[#D2D2D7]/15 rounded-xl">
        <span className="text-[11px] font-semibold text-[#8E8E93] px-2 uppercase tracking-wider hidden md:inline">
          View:
        </span>
        {GROUPING_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = groupBy === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onSelectGroupBy(opt.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? "bg-[#0066CC] text-white shadow-sm font-semibold"
                  : "text-[#A1A1AA] hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Metric Mode Selector */}
      <div className="flex items-center gap-1.5 p-1 bg-[#1A1A1E] border border-[#D2D2D7]/15 rounded-xl self-end sm:self-auto">
        <span className="text-[11px] font-semibold text-[#8E8E93] px-2 uppercase tracking-wider hidden md:inline">
          Metric:
        </span>
        <button
          onClick={() => onSelectMetric("revenue")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            selectedMetric === "revenue"
              ? "bg-emerald-600 text-white shadow-sm font-semibold"
              : "text-[#A1A1AA] hover:text-white hover:bg-white/[0.05]"
          }`}
        >
          <IndianRupee className="w-3.5 h-3.5 text-emerald-300" />
          <span>Sales Revenue</span>
        </button>

        <button
          onClick={() => onSelectMetric("orderCount")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            selectedMetric === "orderCount"
              ? "bg-sky-600 text-white shadow-sm font-semibold"
              : "text-[#A1A1AA] hover:text-white hover:bg-white/[0.05]"
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5 text-sky-300" />
          <span>Order Count</span>
        </button>
      </div>
    </div>
  );
}

export default SalesMetricSelector;
