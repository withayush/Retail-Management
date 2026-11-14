import React from "react";
import { AlertCircle, AlertTriangle, ShieldCheck } from "lucide-react";

/**
 * Phase 10 - Task T63: Inventory Warning Summary Component
 * Displays total alerts, out-of-stock count, and low-stock count badges
 * with interactive filtering capability (ALL, OUT_OF_STOCK, LOW_STOCK).
 */
export function InventoryWarningSummary({
  summary = { outOfStock: 0, lowStock: 0, totalWarnings: 0 },
  activeFilter = "ALL",
  onSelectFilter,
}) {
  const { outOfStock = 0, lowStock = 0, totalWarnings = 0 } = summary;

  const filters = [
    {
      id: "ALL",
      label: "Total Alerts",
      count: totalWarnings,
      icon: AlertTriangle,
      color: "text-white",
      activeBg: "bg-white/10 border-white/30 text-white shadow-sm",
      inactiveBg: "bg-white/[0.03] border-white/10 text-[#A1A1A6] hover:bg-white/[0.06]",
      badgeBg: "bg-white/10 text-white",
    },
    {
      id: "OUT_OF_STOCK",
      label: "Out of Stock",
      count: outOfStock,
      icon: AlertCircle,
      color: "text-rose-400",
      activeBg: "bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.2)]",
      inactiveBg: "bg-rose-500/5 border-rose-500/20 text-rose-400/80 hover:bg-rose-500/10",
      badgeBg: "bg-rose-500/20 text-rose-300",
    },
    {
      id: "LOW_STOCK",
      label: "Low Stock",
      count: lowStock,
      icon: AlertTriangle,
      color: "text-amber-400",
      activeBg: "bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]",
      inactiveBg: "bg-amber-500/5 border-amber-500/20 text-amber-400/80 hover:bg-amber-500/10",
      badgeBg: "bg-amber-500/20 text-amber-300",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {filters.map((f) => {
        const Icon = f.icon;
        const isActive = activeFilter === f.id;

        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onSelectFilter && onSelectFilter(f.id)}
            className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 cursor-pointer text-left ${
              isActive ? f.activeBg : f.inactiveBg
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive ? "bg-black/20" : "bg-white/5"
                }`}
              >
                <Icon className={`w-4 h-4 ${f.color}`} />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-[#86868B]">
                  {f.label}
                </p>
                <p className="text-xl font-bold tracking-tight text-white mt-0.5">
                  {f.count}
                </p>
              </div>
            </div>

            <span
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide ${f.badgeBg}`}
            >
              {f.id === "ALL"
                ? totalWarnings === 0
                  ? "Healthy"
                  : "Needs Action"
                : f.count > 0
                ? "Urgent"
                : "Clear"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default InventoryWarningSummary;

