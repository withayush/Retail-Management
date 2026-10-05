import React, { useState, useEffect } from "react";
import {
  X,
  Clock,
  Calendar,
  Truck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  PackagePlus,
  RefreshCw,
  Send,
  Receipt,
  User,
  Info,
  ChevronRight,
  Filter,
  Plus,
  ArrowRight,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  getPurchaseOrderTimeline,
  addPurchaseOrderHistoryLog,
} from "../../../services/purchaseOrder.api";
import { toast } from "react-hot-toast";

/**
 * Phase 7 - Task T47: Purchase Order Workflow History & Visual Timeline Modal
 * 
 * Interactive audit trail displaying the complete chronological journey of a Purchase Order
 * from creation to deliveries, cost negotiations, expected date changes, and payable liability updates.
 */
export default function PurchaseOrderHistoryModal({
  isOpen,
  onClose,
  purchaseOrder,
  onOpenReceiveGoods = null,
}) {
  const [loading, setLoading] = useState(false);
  const [timelineData, setTimelineData] = useState(null);
  const [activeFilter, setActiveFilter] = useState("ALL"); // ALL | RECEIPTS | CHANGES | STATUS | NOTES

  // Manual Log Form State
  const [showLogForm, setShowLogForm] = useState(false);
  const [logTitle, setLogTitle] = useState("");
  const [logNote, setLogNote] = useState("");
  const [submittingLog, setSubmittingLog] = useState(false);

  useEffect(() => {
    if (isOpen && purchaseOrder?._id) {
      loadTimeline(purchaseOrder._id);
    }
  }, [isOpen, purchaseOrder]);

  const loadTimeline = async (poId) => {
    try {
      setLoading(true);
      const res = await getPurchaseOrderTimeline(poId);
      setTimelineData(res.data);
    } catch (err) {
      console.error("Failed to load PO timeline history:", err);
      toast.error(
        err.response?.data?.message || "Failed to load Purchase Order history."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddLogSubmit = async (e) => {
    e.preventDefault();
    if (!logTitle.trim()) {
      toast.error("Please enter a note title.");
      return;
    }

    try {
      setSubmittingLog(true);
      await addPurchaseOrderHistoryLog(purchaseOrder._id, {
        title: logTitle.trim(),
        note: logNote.trim(),
      });

      toast.success("Operational note recorded on timeline.");
      setLogTitle("");
      setLogNote("");
      setShowLogForm(false);
      // Reload timeline
      await loadTimeline(purchaseOrder._id);
    } catch (err) {
      console.error("Failed to add audit log:", err);
      toast.error(err.response?.data?.message || "Failed to add audit log.");
    } finally {
      setSubmittingLog(false);
    }
  };

  if (!isOpen || !purchaseOrder) return null;

  const events = timelineData?.events || [];
  const poInfo = timelineData?.purchaseOrder || purchaseOrder;
  const analytics = timelineData?.analytics || {};

  // Filter events based on active tab
  const filteredEvents = events.filter((e) => {
    if (activeFilter === "ALL") return true;
    if (activeFilter === "RECEIPTS")
      return ["GRN_CREATED", "PARTIAL_RECEIPT", "FULL_RECEIPT", "PAYABLE_CREATED"].includes(e.eventType);
    if (activeFilter === "CHANGES")
      return ["COST_CHANGED", "EXPECTED_DELIVERY_CHANGED", "PO_UPDATED"].includes(e.eventType);
    if (activeFilter === "STATUS")
      return ["PO_CREATED", "PO_SUBMITTED", "STATUS_CHANGED", "PO_CANCELLED"].includes(e.eventType);
    if (activeFilter === "NOTES")
      return ["MANUAL_LOG"].includes(e.eventType);
    return true;
  });

  // Event icon and color mapping
  const getEventMeta = (eventType) => {
    switch (eventType) {
      case "PO_CREATED":
        return {
          icon: PackagePlus,
          color: "text-emerald-400",
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/20",
          badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          label: "Order Created",
        };
      case "PO_SUBMITTED":
        return {
          icon: Send,
          color: "text-blue-400",
          bg: "bg-blue-500/10",
          border: "border-blue-500/20",
          badgeBg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          label: "Order Submitted",
        };
      case "STATUS_CHANGED":
        return {
          icon: RefreshCw,
          color: "text-purple-400",
          bg: "bg-purple-500/10",
          border: "border-purple-500/20",
          badgeBg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
          label: "Status Updated",
        };
      case "PARTIAL_RECEIPT":
        return {
          icon: Truck,
          color: "text-amber-400",
          bg: "bg-amber-500/10",
          border: "border-amber-500/20",
          badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          label: "Partial Receipt (GRN)",
        };
      case "FULL_RECEIPT":
        return {
          icon: CheckCircle2,
          color: "text-emerald-400",
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/20",
          badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          label: "Full Receipt Complete",
        };
      case "COST_CHANGED":
        return {
          icon: DollarSign,
          color: "text-indigo-400",
          bg: "bg-indigo-500/10",
          border: "border-indigo-500/20",
          badgeBg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
          label: "Cost Variance",
        };
      case "EXPECTED_DELIVERY_CHANGED":
        return {
          icon: Calendar,
          color: "text-yellow-400",
          bg: "bg-yellow-500/10",
          border: "border-yellow-500/20",
          badgeBg: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
          label: "Delivery Rescheduled",
        };
      case "PAYABLE_CREATED":
        return {
          icon: Receipt,
          color: "text-cyan-400",
          bg: "bg-cyan-500/10",
          border: "border-cyan-500/20",
          badgeBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
          label: "Payable Recognized",
        };
      case "PO_CANCELLED":
        return {
          icon: AlertTriangle,
          color: "text-rose-400",
          bg: "bg-rose-500/10",
          border: "border-rose-500/20",
          badgeBg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
          label: "Cancelled",
        };
      case "MANUAL_LOG":
        return {
          icon: FileText,
          color: "text-zinc-300",
          bg: "bg-zinc-800/60",
          border: "border-zinc-700/60",
          badgeBg: "bg-zinc-800 text-zinc-300 border-zinc-700",
          label: "Internal Note",
        };
      default:
        return {
          icon: Clock,
          color: "text-zinc-400",
          bg: "bg-zinc-800",
          border: "border-zinc-700",
          badgeBg: "bg-zinc-800 text-zinc-400 border-zinc-700",
          label: "Update",
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#111113] border border-[#27272a] rounded-2xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        
        {/* ── Modal Header ─────────────────────────────────────────── */}
        <div className="p-5 border-b border-[#27272a] bg-[#141417] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Purchase Order Journey & Audit Timeline
                </h2>
                <span className="text-[11px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md">
                  {poInfo.poNumber}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    poInfo.status === "RECEIVED"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : poInfo.status === "PARTIAL"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : poInfo.status === "CANCELLED"
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  }`}
                >
                  {poInfo.status}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Supplier: <span className="text-zinc-200 font-semibold">{poInfo.supplierCompany}</span> • Immutable operational log (T47)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLogForm(!showLogForm)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-300 bg-[#18181b] hover:bg-zinc-800 border border-[#27272a] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Note
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── KPI Analytics Ribbon ─────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#141417]/60 border-b border-[#27272a] shrink-0 text-xs">
          {/* Delivery Timeliness */}
          <div className="p-2.5 rounded-xl bg-[#18181b] border border-[#27272a]">
            <span className="text-[10px] uppercase font-semibold text-zinc-500 block mb-0.5">
              Delivery Timeliness
            </span>
            <div className="flex items-center gap-1.5 font-bold">
              {analytics.deliveryStatus === "DELAYED" ? (
                <span className="text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Delayed ({analytics.delayDays}d)
                </span>
              ) : analytics.deliveryStatus === "ON_TIME" ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  On-Time Delivery
                </span>
              ) : analytics.deliveryStatus === "EARLY" ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Early Delivery
                </span>
              ) : analytics.deliveryStatus === "OVERDUE" ? (
                <span className="text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Overdue ({analytics.delayDays}d)
                </span>
              ) : (
                <span className="text-blue-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  On Schedule
                </span>
              )}
            </div>
          </div>

          {/* Lead Time */}
          <div className="p-2.5 rounded-xl bg-[#18181b] border border-[#27272a]">
            <span className="text-[10px] uppercase font-semibold text-zinc-500 block mb-0.5">
              Procurement Lead Time
            </span>
            <span className="font-mono font-bold text-white text-sm">
              {analytics.totalLeadTimeDays !== undefined ? `${analytics.totalLeadTimeDays} day(s)` : "—"}
            </span>
          </div>

          {/* Cost & Received Value */}
          <div className="p-2.5 rounded-xl bg-[#18181b] border border-[#27272a]">
            <span className="text-[10px] uppercase font-semibold text-zinc-500 block mb-0.5">
              Ordered vs Received Value
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono font-bold text-emerald-400">
                ₹{Number(analytics.totalCostReceived || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                / ₹{Number(poInfo.costTotal || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* GRN Receipts Count */}
          <div className="p-2.5 rounded-xl bg-[#18181b] border border-[#27272a]">
            <span className="text-[10px] uppercase font-semibold text-zinc-500 block mb-0.5">
              Fulfillment Milestones
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-purple-400">
                {analytics.totalGrnsCount || 0} GRN(s)
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {analytics.totalItemsReceived || 0}/{poInfo.totalQuantity || 0} pcs
              </span>
            </div>
          </div>
        </div>

        {/* ── Filter Tabs Bar ──────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 px-5 py-2.5 border-b border-[#1f1f23] bg-[#111113] shrink-0 overflow-x-auto">
          {[
            { id: "ALL", label: `All Events (${events.length})` },
            { id: "RECEIPTS", label: "Stock Receipts (GRN)" },
            { id: "CHANGES", label: "Cost & Date Changes" },
            { id: "STATUS", label: "Status Transitions" },
            { id: "NOTES", label: "Operational Notes" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeFilter === tab.id
                  ? "bg-zinc-100 text-zinc-900 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Inline Manual Log Form ───────────────────────────────── */}
        {showLogForm && (
          <form
            onSubmit={handleAddLogSubmit}
            className="p-4 bg-[#141417] border-b border-[#27272a] space-y-3 shrink-0 animate-fadeIn"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                Record Operational Audit Note
              </span>
              <button
                type="button"
                onClick={() => setShowLogForm(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs"
              >
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                required
                placeholder="Log Title (e.g. Inspected batch sealing)"
                value={logTitle}
                onChange={(e) => setLogTitle(e.target.value)}
                className="sm:col-span-1 bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-purple-500 outline-none"
              />
              <input
                type="text"
                placeholder="Remarks / Details..."
                value={logNote}
                onChange={(e) => setLogNote(e.target.value)}
                className="sm:col-span-2 bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-purple-500 outline-none"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingLog || !logTitle.trim()}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-purple-500 hover:bg-purple-400 text-white transition-colors disabled:opacity-50 cursor-pointer"
              >
                {submittingLog ? "Saving..." : "Append to Timeline"}
              </button>
            </div>
          </form>
        )}

        {/* ── Timeline Events Stream ───────────────────────────────── */}
        <div className="p-5 flex-1 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-16 text-center text-xs text-zinc-500 flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              Loading workflow history timeline...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Clock className="w-8 h-8 text-zinc-600 mx-auto" />
              <h4 className="text-xs font-bold text-zinc-300">
                No Events Found
              </h4>
              <p className="text-[11px] text-zinc-500">
                No history events match the selected filter.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
              {filteredEvents.map((evt, idx) => {
                const meta = getEventMeta(evt.eventType);
                const IconComponent = meta.icon;
                const dateStr = new Date(evt.createdAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div key={evt._id || idx} className="relative group">
                    {/* Glowing Node Dot on Timeline */}
                    <div
                      className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full ${meta.bg} border ${meta.border} flex items-center justify-center ${meta.color} shadow-sm z-10`}
                    >
                      <IconComponent className="w-3 h-3" />
                    </div>

                    {/* Event Details Card */}
                    <div className="p-4 rounded-xl bg-[#141417] border border-[#27272a] hover:border-zinc-700 transition-all space-y-2.5">
                      
                      {/* Top Header of Card */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white">
                            {evt.title}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${meta.badgeBg}`}
                          >
                            {meta.label}
                          </span>
                          {evt.details?.delayDays > 0 && (
                            <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded">
                              +{evt.details.delayDays}d Delayed
                            </span>
                          )}
                          {evt.details?.isOnTime && evt.details?.expectedDeliveryDate && (
                            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                              On-Time
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
                          <span>{dateStr}</span>
                          {evt.performedByName && (
                            <span className="flex items-center gap-1 text-zinc-400 font-sans">
                              • <User className="w-3 h-3" /> {evt.performedByName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Event Description */}
                      {evt.description && (
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          {evt.description}
                        </p>
                      )}

                      {/* Detailed Breakdown Panels */}
                      {/* 1. Cost Changed Panel */}
                      {evt.eventType === "COST_CHANGED" && evt.details?.costBefore !== undefined && (
                        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-zinc-500 line-through font-mono">
                              ₹{Number(evt.details.costBefore).toLocaleString()}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />
                            <span className="font-bold text-white font-mono">
                              ₹{Number(evt.details.costAfter).toLocaleString()}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              evt.details.diffAmount < 0
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-amber-500/10 text-amber-400"
                            }`}
                          >
                            {evt.details.diffAmount < 0 ? "Saving" : "Increase"}: ₹{Math.abs(evt.details.diffAmount)}
                          </span>
                        </div>
                      )}

                      {/* 2. Expected Delivery Changed Panel */}
                      {evt.eventType === "EXPECTED_DELIVERY_CHANGED" && (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-zinc-300">
                          <Calendar className="w-3.5 h-3.5 text-yellow-400" />
                          <span>
                            Rescheduled to{" "}
                            <span className="font-bold text-white">
                              {evt.details?.expectedDeliveryAfter
                                ? new Date(evt.details.expectedDeliveryAfter).toLocaleDateString()
                                : "None"}
                            </span>
                          </span>
                        </div>
                      )}

                      {/* 3. Goods Receipt Items Breakdown */}
                      {(evt.eventType === "PARTIAL_RECEIPT" || evt.eventType === "FULL_RECEIPT") &&
                        evt.details?.items &&
                        evt.details.items.length > 0 && (
                          <div className="pt-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {evt.details.items.map((item, idx2) => (
                                <div
                                  key={idx2}
                                  className="flex items-center justify-between p-2 rounded-lg bg-[#18181b]/70 border border-[#27272a]/60 text-[11px]"
                                >
                                  <span className="font-medium text-zinc-200 truncate max-w-[180px]">
                                    {item.name}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-emerald-400">
                                      +{item.receivedQty} pcs
                                    </span>
                                    <span className="font-mono text-zinc-400">
                                      ₹{Number(item.totalCost).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Modal Footer ─────────────────────────────────────────── */}
        <div className="p-4 border-t border-[#27272a] bg-[#141417] flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-zinc-400 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-purple-400" />
            <span>
              All {events.length} timeline milestones are immutably signed and audit-locked.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {poInfo.status !== "RECEIVED" && poInfo.status !== "CANCELLED" && onOpenReceiveGoods && (
              <button
                onClick={() => {
                  onClose();
                  onOpenReceiveGoods(poInfo);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
              >
                <Truck className="w-3.5 h-3.5" />
                Receive Goods (GRN)
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 bg-[#18181b] hover:bg-zinc-800 border border-[#27272a] transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
