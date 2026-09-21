import React from "react";
import { Link } from "react-router-dom";
import {
  History,
  ChevronRight,
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  RefreshCw,
} from "lucide-react";

export default function DashboardRecentLedger({ recentLedger = [], loading = false }) {
  return (
    <div className="lg:col-span-2 p-5 md:p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/90 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            Recent Stock Movements
          </h3>
          <p className="text-xs text-muted-foreground">
            Immutable audit ledger of physical stock additions, sales, & reconciliations
          </p>
        </div>
        <Link
          to="/inventory"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          Full Ledger <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-muted-foreground">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
          Loading recent transactions...
        </div>
      ) : recentLedger.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-neutral-800 rounded-xl space-y-2">
          <Boxes className="w-8 h-8 text-neutral-600 mx-auto" />
          <p className="text-xs font-medium text-muted-foreground">No stock movements recorded yet</p>
          <Link to="/inventory" className="btn btn-secondary text-xs inline-flex py-1 px-3">
            Record Stock In
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border/40">
          {recentLedger.map((entry) => {
            const isPositive = entry.qtyChange > 0;
            const isZero = entry.qtyChange === 0;

            return (
              <div
                key={entry._id || entry.id}
                className="py-3 flex items-center justify-between gap-3 hover:bg-neutral-800/30 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                      entry.type === "IN" || entry.type === "OPENING"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : entry.type === "OUT"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {entry.type === "IN" ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : entry.type === "OUT" ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowRightLeft className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      {entry.productId?.name || "Product Movement"}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {entry.reason || entry.source} •{" "}
                      {new Date(entry.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p
                    className={`text-xs font-bold font-mono ${
                      isPositive
                        ? "text-emerald-400"
                        : isZero
                        ? "text-muted-foreground"
                        : "text-rose-400"
                    }`}
                  >
                    {isPositive ? `+${entry.qtyChange}` : entry.qtyChange} units
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Bal: {entry.balanceAfter}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
