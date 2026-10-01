import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  PackageCheck,
  Search,
  Filter,
  Calendar,
  Truck,
  FileText,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Building2,
  Boxes,
  Barcode,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
} from "lucide-react";
import { getGRNs, getGRNSummary } from "../../../services/purchaseOrder.api";
import toast from "react-hot-toast";

/**
 * Phase 7 - Task T44: Goods Received Notes (GRN) Master Log Modal
 * 
 * Central management and audit view for all physical stock receptions against Purchase Orders.
 * Displays GRN numbers, delivery challans, supplier invoices, received vs ordered variance,
 * and immutable stock increment status.
 */
export default function GoodsReceivedNotesModal({
  isOpen,
  onClose,
  initialPoFilter = null,
  onOpenReceiveForPO = null,
}) {
  const [grns, setGrns] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedGrnId, setExpandedGrnId] = useState(null);

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (initialPoFilter) params.purchaseOrderId = initialPoFilter;

      const [grnRes, summaryRes] = await Promise.all([
        getGRNs(params),
        getGRNSummary().catch(() => ({ data: null })),
      ]);

      setGrns(grnRes.data || []);
      if (grnRes.pagination) {
        setPagination((prev) => ({
          ...prev,
          total: grnRes.pagination.total,
          pages: grnRes.pagination.pages,
        }));
      }
      if (summaryRes?.data) {
        setSummary(summaryRes.data);
      }
    } catch (err) {
      console.error("Failed to load Goods Received Notes:", err);
      toast.error("Failed to load Goods Received Notes.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, initialPoFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  if (!isOpen) return null;

  const toggleExpand = (id) => {
    setExpandedGrnId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-[#0e0e11] border border-[#27272a] shadow-2xl shadow-black/80 overflow-hidden text-zinc-100">
        
        {/* ── Modal Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f23] bg-[#141417]/95 backdrop-blur-sm sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600/30 to-emerald-400/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shadow-inner shrink-0">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Goods Received Notes (GRN)
                </h2>
                <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  T44 Stock Receipt Log
                </span>
                {initialPoFilter && (
                  <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
                    Filtered for PO
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Physical delivery confirmations, audited Stock-In receipts, delivery challans, and line variances
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── KPI Summary Cards ────────────────────────────────────── */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-5 bg-[#111113] border-b border-[#1f1f23] shrink-0">
            <div className="p-3.5 rounded-xl bg-[#151518] border border-[#27272a] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-zinc-400 font-medium block">
                  Total Completed GRNs
                </span>
                <span className="text-lg font-bold font-mono text-white mt-0.5 block">
                  {summary.totalGrns || 0}
                </span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <PackageCheck className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#151518] border border-[#27272a] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-zinc-400 font-medium block">
                  Total Physical Stock In
                </span>
                <span className="text-lg font-bold font-mono text-emerald-400 mt-0.5 block">
                  +{(summary.totalItemsReceived || 0).toLocaleString()} units
                </span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Boxes className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#151518] border border-[#27272a] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-zinc-400 font-medium block">
                  Procured Stock Value
                </span>
                <span className="text-lg font-bold font-mono text-white mt-0.5 block">
                  ₹{(summary.totalCostReceived || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
          </div>
        )}

        {/* ── Search & Filter Toolbar ───────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-b border-[#1f1f23] bg-[#121215] shrink-0">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search GRN #, PO #, supplier, challan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#18181b] border border-[#27272a] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-1 bg-[#18181b] border border-[#27272a] rounded-xl p-1 text-xs">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  statusFilter === "ALL"
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("COMPLETED")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  statusFilter === "COMPLETED"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setStatusFilter("CANCELLED")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  statusFilter === "CANCELLED"
                    ? "bg-rose-500/20 text-rose-400"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Cancelled
              </button>
            </div>

            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-xl bg-[#18181b] hover:bg-zinc-800 text-zinc-400 hover:text-white border border-[#27272a] transition-all disabled:opacity-50 cursor-pointer"
              title="Refresh GRN list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* ── Main GRN List ─────────────────────────────────────────── */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="py-16 text-center text-xs text-zinc-500 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              Loading Goods Received Notes...
            </div>
          ) : grns.length === 0 ? (
            <div className="py-16 text-center space-y-3 border border-dashed border-[#27272a] rounded-2xl bg-[#141417]/40">
              <PackageCheck className="w-10 h-10 text-zinc-600 mx-auto" />
              <h3 className="text-sm font-bold text-zinc-200">
                No Goods Received Notes Found
              </h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Physical receipts against Purchase Orders appear here once stock is delivered by vendors and confirmed via the GRN workflow.
              </p>
            </div>
          ) : (
            grns.map((grn) => {
              const isExpanded = expandedGrnId === grn._id;

              return (
                <div
                  key={grn._id}
                  className="rounded-xl bg-[#141417] border border-[#27272a] hover:border-zinc-700 transition-all overflow-hidden"
                >
                  {/* Top Bar of GRN Card */}
                  <div
                    onClick={() => toggleExpand(grn._id)}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 sm:mt-0">
                        <PackageCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-sm text-emerald-400">
                            {grn.grnNumber}
                          </span>
                          <span className="text-[11px] font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
                            PO: {grn.poNumber || grn.purchaseOrderId?.poNumber || "N/A"}
                          </span>
                          <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            {grn.status}
                          </span>
                          <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Auto Stock IN
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 flex-wrap">
                          <span className="flex items-center gap-1 text-zinc-300 font-semibold">
                            <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                            {grn.supplierCompany || grn.supplierId?.company || "Unknown Supplier"}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                            {new Date(grn.receivedDate).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          {grn.deliveryChallanNumber && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 font-mono text-[11px] text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded">
                                <Truck className="w-3 h-3 text-zinc-400" />
                                Challan: {grn.deliveryChallanNumber}
                              </span>
                            </>
                          )}
                          {grn.invoiceNumber && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 font-mono text-[11px] text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded">
                                <FileText className="w-3 h-3 text-zinc-400" />
                                Inv: {grn.invoiceNumber}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 self-end sm:self-center">
                      <div className="text-right">
                        <span className="text-sm font-mono font-bold text-emerald-400 block">
                          +{grn.totalItemsReceived} units
                        </span>
                        <span className="text-xs font-mono font-bold text-white block">
                          ₹{Number(grn.totalCostReceived || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="p-1 rounded-lg text-zinc-400 hover:text-white bg-zinc-800/40">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Receipt Breakdown Details */}
                  {isExpanded && (
                    <div className="border-t border-[#1f1f23] bg-[#111113] p-4 space-y-3 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-emerald-400" />
                          Physically Received Line Items ({grn.items?.length || 0})
                        </span>
                        {grn.receivedByName && (
                          <span className="text-[11px] text-zinc-500 font-mono">
                            Received by: <strong className="text-zinc-300">{grn.receivedByName}</strong>
                          </span>
                        )}
                      </div>

                      {/* Items Sub-table */}
                      <div className="border border-[#27272a] rounded-lg overflow-hidden bg-[#141417]">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#18181b] border-b border-[#27272a] text-[10px] uppercase font-semibold text-zinc-400">
                            <tr>
                              <th className="py-2 px-3">Item / Product</th>
                              <th className="py-2 px-3 text-center">Ordered</th>
                              <th className="py-2 px-3 text-center">Previously Recv</th>
                              <th className="py-2 px-3 text-center">Received in GRN</th>
                              <th className="py-2 px-3 text-center">Remaining</th>
                              <th className="py-2 px-3 text-center">Variance</th>
                              <th className="py-2 px-3 text-right">Cost Price</th>
                              <th className="py-2 px-3 text-right">Line Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#27272a]/60 text-zinc-300">
                            {(grn.items || []).map((line, idx) => {
                              const variance = Number(line.variance) || 0;

                              return (
                                <tr key={line._id || idx} className="hover:bg-zinc-800/20">
                                  <td className="py-2 px-3">
                                    <span className="font-semibold text-white block">
                                      {line.name}
                                    </span>
                                    <span className="text-[10px] text-zinc-500 font-mono">
                                      {line.sku || "No SKU"} • {line.unit}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-center font-mono text-zinc-400">
                                    {line.orderedQty}
                                  </td>
                                  <td className="py-2 px-3 text-center font-mono text-zinc-400">
                                    {line.previouslyReceivedQty}
                                  </td>
                                  <td className="py-2 px-3 text-center font-mono font-bold text-emerald-400">
                                    +{line.receivedQty}
                                  </td>
                                  <td className="py-2 px-3 text-center font-mono">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        line.remainingQty > 0
                                          ? "bg-amber-500/10 text-amber-400"
                                          : "bg-emerald-500/10 text-emerald-400"
                                      }`}
                                    >
                                      {line.remainingQty}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-center font-mono">
                                    {variance === 0 ? (
                                      <span className="text-emerald-400 text-[10px] font-bold">Exact ✓</span>
                                    ) : variance < 0 ? (
                                      <span className="text-amber-400 text-[10px] font-bold">{variance} Pending</span>
                                    ) : (
                                      <span className="text-blue-400 text-[10px] font-bold">+{variance} Excess</span>
                                    )}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono text-zinc-400">
                                    ₹{Number(line.costPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono font-bold text-white">
                                    ₹{Number(line.totalCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {grn.notes && (
                        <div className="p-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-[11px] text-zinc-400">
                          <span className="font-semibold text-zinc-300">Remarks:</span> {grn.notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Modal Footer ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#1f1f23] bg-[#141417]/95 backdrop-blur-sm sticky bottom-0 z-20 text-xs text-zinc-400 shrink-0">
          <div>
            Showing <span className="text-zinc-200 font-bold">{grns.length}</span> Goods Received Note(s)
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold transition-colors cursor-pointer"
          >
            Close Log
          </button>
        </div>
      </div>
    </div>
  );
}
