import React from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

export default function DashboardPriorityAlerts({
  activeAlerts = [],
  alertsSummary = { totalActive: 0 },
  loading = false,
}) {
  return (
    <div className="p-5 md:p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/90 shadow-sm space-y-4 flex flex-col justify-between">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Priority Restock Queue
            </h3>
            <p className="text-xs text-muted-foreground">Immediate low-stock threshold alerts</p>
          </div>
          <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {alertsSummary.totalActive} Active
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-primary" />
            Checking alerts...
          </div>
        ) : activeAlerts.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-neutral-800 rounded-xl space-y-2">
            <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto" />
            <p className="text-xs font-semibold text-foreground">Stock Levels Optimal</p>
            <p className="text-[11px] text-muted-foreground">No active low-stock or out-of-stock items.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeAlerts.slice(0, 4).map((alert) => {
              const isCritical = alert.severity === "CRITICAL" || alert.alertType === "OUT_OF_STOCK";

              return (
                <div
                  key={alert._id || alert.id}
                  className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800/80 space-y-1.5 hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-foreground truncate">
                      {alert.productId?.name || "Stock Alert"}
                    </p>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                        isCritical
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {isCritical ? "Out of Stock" : "Low Stock"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>
                      Stock: <b className={isCritical ? "text-rose-400" : "text-amber-400"}>{alert.currentStock}</b> / Min: {alert.reorderLevel}
                    </span>
                    <Link
                      to="/inventory"
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
                    >
                      Restock <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Link
        to="/inventory"
        className="w-full py-2.5 rounded-xl bg-neutral-800/80 border border-neutral-700/60 text-xs font-semibold text-foreground hover:bg-neutral-700/80 text-center block transition-all mt-4"
      >
        Manage All Alerts & Inventory
      </Link>
    </div>
  );
}
