import React from "react";
import {
  Search,
  X,
  RefreshCw,
  ShieldCheck,
  Clock,
  AlertOctagon,
  AlertTriangle,
  Zap,
  CheckCheck,
  CheckCircle2,
} from "lucide-react";

export default function AlertsTable({
  loading,
  alerts,
  alertsSummary,
  alertStatusFilter,
  setAlertStatusFilter,
  alertSearchTerm,
  setAlertSearchTerm,
  alertPage,
  setAlertPage,
  alertPagination,
  syncingAlerts,
  onSyncAlerts,
  onQuickRestock,
  onAcknowledge,
  onResolve,
}) {
  return (
    <div className="space-y-4">
      {/* ── Control & Filter Deck ─────────────────────────────────────────── */}
      <div className="bg-[#111113] border border-[#1f1f23] rounded-xl p-3.5 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search alert by Product Name, SKU or Message..."
              value={alertSearchTerm}
              onChange={(e) => {
                setAlertSearchTerm(e.target.value);
                setAlertPage(1);
              }}
              className="w-full bg-[#141417] border border-[#27272a] rounded-lg pl-8 pr-8 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
            />
            {alertSearchTerm && (
              <button
                onClick={() => {
                  setAlertSearchTerm("");
                  setAlertPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sweep & Sync Button */}
          <button
            onClick={onSyncAlerts}
            disabled={syncingAlerts}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#27272a] bg-[#141417] hover:bg-zinc-800 text-zinc-200 text-xs font-medium transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            title="Run Deterministic Reorder Sweep across all products"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${syncingAlerts ? "animate-spin text-white" : ""}`} />
            <span>{syncingAlerts ? "Evaluating..." : "Run Reorder Sweep"}</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-[#1f1f23]">
          {[
            { label: "Active Queue", value: "ALL_ACTIVE", count: alertsSummary?.totalActive },
            { label: "Unread", value: "UNREAD", count: alertsSummary?.unreadCount },
            { label: "Critical (OOS)", value: "CRITICAL", count: alertsSummary?.criticalCount },
            { label: "Low Stock", value: "WARNING", count: alertsSummary?.warningCount },
            { label: "Resolved", value: "RESOLVED", count: alertsSummary?.resolvedCount },
            { label: "All History", value: "ALL", count: null },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setAlertStatusFilter(tab.value);
                setAlertPage(1);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer border ${
                alertStatusFilter === tab.value
                  ? "bg-zinc-100 text-zinc-900 border-zinc-100 font-semibold"
                  : "bg-[#141417] text-zinc-400 hover:text-zinc-200 border-[#27272a] hover:bg-zinc-800"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    alertStatusFilter === tab.value
                      ? "bg-zinc-900 text-zinc-100"
                      : tab.value === "CRITICAL"
                      ? "bg-red-500/20 text-red-400"
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

      {/* ── Alerts Cards Deck ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="bg-[#111113] border border-[#1f1f23] rounded-xl p-12 text-center text-zinc-400">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />
            <span className="text-xs">Loading alerts queue...</span>
          </div>
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-[#111113] border border-[#1f1f23] rounded-xl p-12 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-white">
              {alertStatusFilter === "ALL_ACTIVE" || alertStatusFilter === "UNREAD"
                ? "All Stock Levels Healthy"
                : "No Alerts Found"}
            </h4>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {alertStatusFilter === "ALL_ACTIVE" || alertStatusFilter === "UNREAD"
                ? "Every product in your catalog is currently above its configured reorder threshold."
                : "No alerts match the active filter criteria."}
            </p>
          </div>
          <button
            onClick={onSyncAlerts}
            className="px-3 py-1.5 rounded-lg border border-[#27272a] bg-[#141417] hover:bg-zinc-800 text-xs font-medium text-zinc-300 cursor-pointer"
          >
            Re-scan Inventory
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const isCritical = alert.severity === "CRITICAL" || alert.currentStock <= 0;
            const isResolved = alert.status === "RESOLVED";
            const isUnread = alert.status === "UNREAD";

            const formattedDate = new Date(alert.lastTriggeredAt || alert.createdAt).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            const stockPercentage = alert.reorderLevel > 0
              ? Math.min(100, Math.round((alert.currentStock / alert.reorderLevel) * 100))
              : 0;

            return (
              <div
                key={alert._id}
                className={`bg-[#111113] border rounded-xl p-4 transition-colors ${
                  isResolved
                    ? "border-[#1f1f23] opacity-60"
                    : isCritical
                    ? "border-red-500/30 bg-red-500/[0.02]"
                    : isUnread
                    ? "border-amber-500/30 bg-amber-500/[0.02]"
                    : "border-[#1f1f23]"
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* Left: Product & Severity Badges */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Severity Pill */}
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${
                          isCritical
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {isCritical ? <AlertOctagon className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {isCritical ? "CRITICAL: OUT OF STOCK" : "WARNING: LOW STOCK"}
                      </span>

                      {/* Status Pill */}
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                          isResolved
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : isUnread
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : "bg-[#141417] text-zinc-400 border-[#27272a]"
                        }`}
                      >
                        {alert.status}
                      </span>

                      {/* Trigger Timestamp */}
                      <span className="text-[11px] text-zinc-500 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {formattedDate}
                      </span>
                    </div>

                    {/* Product Details */}
                    <div>
                      <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                        <span>{alert.productId?.name || "Unknown Product"}</span>
                        {alert.productId?.sku && (
                          <span className="text-[10px] font-mono bg-[#141417] border border-[#27272a] px-1.5 py-0.2 rounded text-zinc-400 font-normal">
                            {alert.productId.sku}
                          </span>
                        )}
                        {alert.productId?.categoryId?.name && (
                          <span className="text-[10px] bg-[#141417] px-1.5 py-0.2 rounded text-zinc-500 font-normal">
                            {alert.productId.categoryId.name}
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">{alert.message}</p>
                    </div>
                  </div>

                  {/* Middle: Stock vs Threshold Gauge */}
                  <div className="w-full lg:w-64 bg-[#141417] border border-[#27272a] rounded-lg p-2.5 space-y-1.5 shrink-0">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 font-medium">Stock Gauge:</span>
                      <span className="font-mono font-bold text-white">
                        {alert.currentStock} / {alert.reorderLevel} {alert.productId?.unit || "pcs"}
                      </span>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="w-full bg-[#1f1f23] rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          isCritical ? "bg-red-400" : "bg-amber-400"
                        }`}
                        style={{ width: `${Math.max(4, stockPercentage)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500">
                      <span>0 Units</span>
                      <span className="text-amber-400 font-semibold font-mono">
                        Deficit: -{alert.deficitQty} {alert.productId?.unit || "pcs"}
                      </span>
                      <span>{alert.reorderLevel}</span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 w-full lg:w-auto justify-end shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#1f1f23]">
                    {/* 1-Click Quick Restock */}
                    <button
                      onClick={() => onQuickRestock(alert)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-semibold transition-colors cursor-pointer"
                      title="Restock this item now"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>Restock</span>
                    </button>

                    {/* Acknowledge Action */}
                    {!isResolved && alert.status === "UNREAD" && (
                      <button
                        onClick={() => onAcknowledge(alert._id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#27272a] bg-[#141417] hover:bg-zinc-800 text-zinc-300 text-xs font-medium cursor-pointer"
                        title="Acknowledge alert"
                      >
                        <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                        <span>Ack</span>
                      </button>
                    )}

                    {/* Resolve Action */}
                    {!isResolved && (
                      <button
                        onClick={() => onResolve(alert._id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#27272a] bg-[#141417] hover:bg-zinc-800 text-zinc-300 text-xs font-medium cursor-pointer"
                        title="Mark resolved"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Resolve</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Alerts Pagination */}
          {alertPagination?.totalPages > 1 && (
            <div className="flex items-center justify-between p-3.5 bg-[#111113] border border-[#1f1f23] rounded-xl">
              <span className="text-xs text-zinc-400">
                Page {alertPagination.page} of {alertPagination.totalPages} ({alertPagination.total} total alerts)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={alertPage <= 1}
                  onClick={() => setAlertPage((p) => Math.max(p - 1, 1))}
                  className="px-3 py-1 rounded-lg border border-[#27272a] bg-[#141417] text-xs font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={alertPage >= alertPagination.totalPages}
                  onClick={() => setAlertPage((p) => p + 1)}
                  className="px-3 py-1 rounded-lg border border-[#27272a] bg-[#141417] text-xs font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
