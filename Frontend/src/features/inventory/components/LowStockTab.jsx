import React from "react";
import {
  Search,
  X,
  RefreshCw,
  BellRing,
  XCircle,
  AlertTriangle,
  CheckCheck,
  CheckCircle2,
  Plus,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function LowStockTab({
  alerts = [],
  alertsSummary = { totalActive: 0, unreadCount: 0, criticalCount: 0, warningCount: 0, resolvedCount: 0 },
  alertPagination = { page: 1, totalPages: 1, total: 0 },
  loading = false,
  alertSearchTerm = "",
  setAlertSearchTerm,
  alertStatusFilter = "ALL_ACTIVE",
  setAlertStatusFilter,
  alertPage = 1,
  setAlertPage,
  syncingAlerts = false,
  onSyncAlerts,
  onAcknowledgeAlert,
  onResolveAlert,
  onOpenStockIn,
}) {
  return (
    <div className="space-y-4">
      {/* ── Control & Filter Deck ─────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search alert by Product Name, SKU or Message..."
              value={alertSearchTerm}
              onChange={(e) => {
                setAlertSearchTerm(e.target.value);
                setAlertPage(1);
              }}
              className="w-full bg-secondary/50 border border-border rounded-xl pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {alertSearchTerm && (
              <button
                onClick={() => {
                  setAlertSearchTerm("");
                  setAlertPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sweep & Sync Button */}
          <button
            onClick={onSyncAlerts}
            disabled={syncingAlerts}
            className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            title="Run Deterministic Reorder Sweep across all products"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary ${syncingAlerts ? "animate-spin" : ""}`} />
            <span>{syncingAlerts ? "Evaluating Store..." : "Run Reorder Sweep"}</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-border/50 pb-1">
          {[
            { label: "Active Queue", value: "ALL_ACTIVE", count: alertsSummary.totalActive },
            { label: "Unread", value: "UNREAD", count: alertsSummary.unreadCount },
            { label: "Critical (OOS)", value: "CRITICAL", count: alertsSummary.criticalCount },
            { label: "Low Stock", value: "WARNING", count: alertsSummary.warningCount },
            { label: "Resolved", value: "RESOLVED", count: alertsSummary.resolvedCount },
            { label: "All History", value: "ALL", count: null },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setAlertStatusFilter(tab.value);
                setAlertPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer border ${
                alertStatusFilter === tab.value
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-secondary/40 text-muted-foreground hover:text-foreground border-border hover:bg-secondary"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    alertStatusFilter === tab.value
                      ? "bg-primary-foreground text-primary"
                      : tab.value === "CRITICAL"
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Summary KPI Strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-[11px] font-medium">
            <span>Active Triggers</span>
            <BellRing className="w-3.5 h-3.5 text-primary" />
          </div>
          <p className="text-lg font-bold font-mono text-foreground mt-1">
            {alertsSummary.totalActive || 0}
          </p>
          <span className="text-[10px] text-muted-foreground">Require attention</span>
        </div>

        <div className="bg-card border border-destructive/20 bg-destructive/5 rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between text-destructive text-[11px] font-medium">
            <span>Critical Out of Stock</span>
            <XCircle className="w-3.5 h-3.5 text-destructive" />
          </div>
          <p className="text-lg font-bold font-mono text-destructive mt-1">
            {alertsSummary.criticalCount || 0}
          </p>
          <span className="text-[10px] text-muted-foreground">0 available units</span>
        </div>

        <div className="bg-card border border-amber-500/20 bg-amber-500/5 rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between text-amber-400 text-[11px] font-medium">
            <span>Low Stock Warning</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="text-lg font-bold font-mono text-amber-400 mt-1">
            {alertsSummary.warningCount || 0}
          </p>
          <span className="text-[10px] text-muted-foreground">Below reorder level</span>
        </div>

        <div className="bg-card border border-emerald-500/20 bg-emerald-500/5 rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between text-emerald-400 text-[11px] font-medium">
            <span>Resolved History</span>
            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-lg font-bold font-mono text-emerald-400 mt-1">
            {alertsSummary.resolvedCount || 0}
          </p>
          <span className="text-[10px] text-muted-foreground">Auto / Handled alerts</span>
        </div>
      </div>

      {/* ── Alerts Queue List ──────────────────────────────────────────────── */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-muted-foreground bg-card border border-border rounded-2xl">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
            Loading alert queue records...
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center bg-card border border-border rounded-2xl space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <p className="font-bold text-foreground text-sm">No Stock Alerts Found</p>
            <p className="text-xs text-muted-foreground">All items in store are currently at healthy stocking levels.</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const isCritical = alert.severity === "CRITICAL" || alert.alertType === "OUT_OF_STOCK";
            const isResolved = alert.status === "RESOLVED";
            const isAcknowledged = alert.status === "ACKNOWLEDGED";

            return (
              <div
                key={alert._id || alert.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isResolved
                    ? "bg-neutral-900/40 border-border/50 opacity-70"
                    : isCritical
                    ? "bg-destructive/5 border-destructive/30 hover:border-destructive/50"
                    : "bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isCritical
                            ? "bg-destructive/20 text-destructive border-destructive/30"
                            : isResolved
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {alert.alertType}
                      </span>

                      <span className="font-bold text-sm text-foreground">
                        {alert.productId?.name || "Product Alert"}
                      </span>

                      <span className="text-xs text-muted-foreground font-mono bg-secondary px-1.5 py-0.5 rounded">
                        {alert.productId?.sku || "NO-SKU"}
                      </span>
                    </div>

                    <p className="text-xs text-foreground/90">{alert.message}</p>

                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1 flex-wrap font-mono">
                      <span>
                        Current Stock: <b className={isCritical ? "text-destructive" : "text-amber-400"}>{alert.currentStock}</b>
                      </span>
                      <span>
                        Reorder Level: <b>{alert.reorderLevel}</b>
                      </span>
                      {alert.deficitQty > 0 && (
                        <span className="text-destructive font-semibold">
                          Deficit: -{alert.deficitQty} units
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[10px]">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        {new Date(alert.lastTriggeredAt || alert.createdAt).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* Actions for Alert */}
                  {!isResolved && (
                    <div className="flex items-center gap-2 shrink-0">
                      {!isAcknowledged && (
                        <button
                          onClick={() => onAcknowledgeAlert(alert._id || alert.id)}
                          className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-secondary cursor-pointer"
                        >
                          Acknowledge
                        </button>
                      )}

                      <button
                        onClick={() => onOpenStockIn(alert.productId)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Restock
                      </button>

                      <button
                        onClick={() => onResolveAlert(alert._id || alert.id)}
                        className="p-1.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
                        title="Mark as Manually Resolved"
                      >
                        <CheckCheck className="w-4 h-4 text-emerald-400" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Pagination Controls */}
        {alertPagination.totalPages > 1 && (
          <div className="p-3 border border-border bg-card rounded-2xl flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Page {alertPagination.page} of {alertPagination.totalPages} ({alertPagination.total} total alerts)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setAlertPage((p) => Math.max(p - 1, 1))}
                disabled={alertPage <= 1}
                className="p-1.5 rounded-lg border border-border bg-background hover:bg-secondary disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setAlertPage((p) => Math.min(p + 1, alertPagination.totalPages))}
                disabled={alertPage >= alertPagination.totalPages}
                className="p-1.5 rounded-lg border border-border bg-background hover:bg-secondary disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
