import React from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";

export default function DashboardStockHealth({
  invSummary,
  inStockPct,
  lowStockPct,
  outOfStockPct,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="p-5 md:p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800/90 shadow-sm space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Store Inventory Health Status
          </h4>
          <p className="text-xs text-muted-foreground">
            Real-time stock ratio across {invSummary.totalProducts} tracked products
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            In Stock ({inStockPct}%)
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            Low Stock ({lowStockPct}%)
          </span>
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            Out of Stock ({outOfStockPct}%)
          </span>
        </div>
      </div>

      {/* Visual Multi-Segment Bar */}
      <div className="w-full h-3.5 rounded-full bg-neutral-800 overflow-hidden flex p-0.5 border border-neutral-700/50">
        <div
          style={{ width: `${inStockPct}%` }}
          className="h-full bg-emerald-500 rounded-l-full transition-all duration-500 hover:brightness-110"
          title={`In Stock: ${invSummary.inStockCount} items (${inStockPct}%)`}
        />
        <div
          style={{ width: `${lowStockPct}%` }}
          className="h-full bg-amber-500 transition-all duration-500 hover:brightness-110"
          title={`Low Stock: ${invSummary.lowStockCount} items (${lowStockPct}%)`}
        />
        <div
          style={{ width: `${outOfStockPct}%` }}
          className="h-full bg-rose-500 rounded-r-full transition-all duration-500 hover:brightness-110"
          title={`Out of Stock: ${invSummary.outOfStockCount} items (${outOfStockPct}%)`}
        />
      </div>

      {/* Quick Metrics Breakdown */}
      <div className="grid grid-cols-3 gap-3 pt-2">
        <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 text-center">
          <p className="text-[11px] text-muted-foreground uppercase font-semibold">Healthy Items</p>
          <p className="text-base font-bold text-emerald-400 mt-0.5 font-mono">
            {invSummary.inStockCount} SKUs
          </p>
        </div>
        <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 text-center">
          <p className="text-[11px] text-muted-foreground uppercase font-semibold">Low Limit Warnings</p>
          <p className="text-base font-bold text-amber-400 mt-0.5 font-mono">
            {invSummary.lowStockCount} SKUs
          </p>
        </div>
        <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 text-center">
          <p className="text-[11px] text-muted-foreground uppercase font-semibold">Zero Stock Critical</p>
          <p className="text-base font-bold text-rose-400 mt-0.5 font-mono">
            {invSummary.outOfStockCount} SKUs
          </p>
        </div>
      </div>
    </motion.div>
  );
}
