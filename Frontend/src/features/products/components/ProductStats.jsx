import React from "react";
import { Package, CheckCircle2, Layers, Percent } from "lucide-react";

export default function ProductStats({ totalItems, loading, activeCount, categoriesCount, avgMargin }) {
  const marginNum = parseFloat(avgMargin) || 0;

  const stats = [
    {
      label: "Total Products",
      value: loading ? "…" : totalItems,
      icon: Package,
    },
    {
      label: "Active In Catalog",
      value: loading ? "…" : activeCount,
      icon: CheckCircle2,
    },
    {
      label: "Categories",
      value: categoriesCount,
      icon: Layers,
    },
    {
      label: "Avg Profit Margin",
      value: loading ? "…" : `${avgMargin}%`,
      icon: Percent,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.label}
            className="bg-[#161617]/90 backdrop-blur-2xl border border-[#D2D2D7]/12 rounded-[18px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-[#D2D2D7]/24 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#6E6E73]">
                {s.label}
              </span>
              <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[#D2D2D7]">
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white tracking-tight">
              {s.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
