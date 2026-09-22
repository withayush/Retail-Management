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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.label}
            className="bg-[#111113] border border-[#1f1f23] rounded-xl p-4 shadow-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-400">
                {s.label}
              </span>
              <Icon className="w-4 h-4 text-zinc-500" />
            </div>
            <p className="text-xl font-bold text-white tracking-tight">
              {s.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
