import React from "react";
import { motion } from "framer-motion";
import { Package, CheckCircle2, Layers, Percent } from "lucide-react";

export default function ProductStats({ totalItems, loading, activeCount, categoriesCount, avgMargin }) {
  const marginNum = parseFloat(avgMargin) || 0;

  const stats = [
    {
      label: "Total Products",
      value: loading ? "…" : totalItems,
      icon: Package,
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20",
    },
    {
      label: "Active In Catalog",
      value: loading ? "…" : activeCount,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Categories",
      value: categoriesCount,
      icon: Layers,
      color: "text-violet-400",
      bg: "bg-violet-500/10 border-violet-500/20",
    },
    {
      label: "Avg Profit Margin",
      value: loading ? "…" : `${avgMargin}%`,
      icon: Percent,
      color: marginNum >= 20 ? "text-emerald-400" : "text-amber-400",
      bg: marginNum >= 20 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-amber-500/10 border-amber-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-card border border-border rounded-2xl p-4 shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {s.label}
            </span>
            <div className={`w-8 h-8 rounded-xl ${s.bg} border flex items-center justify-center`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
          </div>
          <p className={`text-2xl font-black ${s.color} tracking-tight`}>
            {s.value}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
