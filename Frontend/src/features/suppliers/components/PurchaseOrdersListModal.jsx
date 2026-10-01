import React, { useState, useEffect } from "react";
import {
  X,
  ShoppingBag,
  Building2,
  Calendar,
  IndianRupee,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Truck,
  FileText,
  Loader2,
  Tag,
  PackageCheck,
} from "lucide-react";
import { getPurchaseOrders, updatePOStatus, cancelPurchaseOrder } from "../../../services/purchaseOrder.api";
import ReceiveGoodsModal from "./ReceiveGoodsModal";
import toast from "react-hot-toast";

export default function PurchaseOrdersListModal({
  isOpen,
  onClose,
  supplier = null,
  onCreateNewPO,
}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPoId, setExpandedPoId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [poToReceive, setPoToReceive] = useState(null);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);

  const supplierId = supplier?._id || supplier?.id;

  const fetchOrders = () => {
    setLoading(true);
    const params = {};
    if (supplierId) params.supplierId = supplierId;
    if (statusFilter !== "ALL") params.status = statusFilter;
    if (searchQuery.trim()) params.search = searchQuery.trim();

    getPurchaseOrders(params)
      .then((res) => {
        setOrders(res.data || res.orders || []);
      })
      .catch((err) => {
        console.error("Failed to fetch purchase orders:", err);
        toast.error("Failed to load purchase orders.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
    }
  }, [isOpen, supplierId, statusFilter]);

  if (!isOpen) return null;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleStatusChange = async (poId, newStatus) => {
    setUpdatingId(poId);
    try {
      if (newStatus === "CANCELLED") {
        await cancelPurchaseOrder(poId, "Cancelled by user via Purchase Orders Manager");
        toast.success("Purchase Order marked as CANCELLED");
      } else {
        await updatePOStatus(poId, newStatus);
        toast.success(`Purchase Order status updated to ${newStatus}`);
      }
      fetchOrders();
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleExpand = (id) => {
    setExpandedPoId((prev) => (prev === id ? null : id));
  };

  // Status Badge Helper
  const renderStatusBadge = (status) => {
    switch (status) {
      case "RECEIVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            RECEIVED
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            PENDING
          </span>
        );
      case "PARTIAL":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Truck className="w-3 h-3" />
            PARTIAL
          </span>
        );
      case "DRAFT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
            <FileText className="w-3 h-3" />
            DRAFT
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3 h-3" />
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-800 text-zinc-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-[#0e0e11] border border-[#27272a] shadow-2xl shadow-black/80 overflow-hidden text-zinc-100 animate-scaleUp">
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f23] bg-[#141417]/90 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shadow-inner">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Purchase Orders Center (T42)
              </h2>
              <p className="text-xs text-zinc-400">
                {supplier ? `Tracking official orders placed with ${supplier.company}` : "Store-wide Purchase Orders & Procurement Registry"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onCreateNewPO && (
              <button
                onClick={() => {
                  onClose();
                  onCreateNewPO(supplier);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                New Purchase Order
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Toolbar & Filters ─────────────────────────────────────────────── */}
        <div className="px-6 py-3 border-b border-zinc-800/60 bg-[#121215] flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {["ALL", "PENDING", "DRAFT", "PARTIAL", "RECEIVED", "CANCELLED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === st
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/40"
                    : "bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-transparent"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-64">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search PO#, supplier, SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#16161a] border border-zinc-800 rounded-xl text-zinc-200 text-xs focus:border-blue-500 focus:outline-hidden transition-colors placeholder:text-zinc-600"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl border border-zinc-700 cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>

        {/* ── Orders Content ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
              <p className="text-xs text-zinc-400 font-medium">Loading purchase orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-zinc-800/80 rounded-2xl bg-[#121215]/50">
              <ShoppingBag className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-zinc-300">No Purchase Orders Found</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                No orders matching the criteria. Click "+ New Purchase Order" to formally request stock from a supplier.
              </p>
              {onCreateNewPO && (
                <button
                  onClick={() => {
                    onClose();
                    onCreateNewPO(supplier);
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 text-xs font-semibold border border-blue-500/30 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create First Purchase Order
                </button>
              )}
            </div>
          ) : (
            orders.map((po) => {
              const isExpanded = expandedPoId === po._id;
              const formattedDate = po.orderDate
                ? new Date(po.orderDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—";
              const formattedDelivery = po.expectedDelivery
                ? new Date(po.expectedDelivery).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "Not set";

              return (
                <div
                  key={po._id}
                  className="rounded-xl border border-zinc-800 bg-[#121215] hover:border-zinc-700 transition-all overflow-hidden"
                >
                  {/* Card Header Row */}
                  <div
                    onClick={() => toggleExpand(po._id)}
                    className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer select-none hover:bg-zinc-800/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-blue-400 font-mono text-xs font-bold shrink-0">
                        PO
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-white text-sm">
                            {po.poNumber}
                          </span>
                          {renderStatusBadge(po.status)}
                          <span className="text-xs text-zinc-400 font-medium flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-zinc-500" />
                            {po.supplierCompany || po.supplierId?.company || "Supplier"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Ordered: {formattedDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <Truck className="w-3 h-3 text-amber-500/80" /> Expected: {formattedDelivery}
                          </span>
                          <span>• {po.itemsCount || po.items?.length || 0} Line Item(s)</span>
                          <span>• {po.totalQuantity || 0} units</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center">
                      {po.status !== "RECEIVED" && po.status !== "CANCELLED" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPoToReceive(po);
                            setIsReceiveModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                          title="Receive physical stock against this PO (GRN)"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          Receive Stock
                        </button>
                      )}

                      <div className="text-right">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Cost Total</p>
                        <p className="text-base font-bold text-blue-400 font-mono">
                          ₹{Number(po.costTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="p-1 rounded-lg text-zinc-400 hover:text-white bg-zinc-800/40">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Item Details */}
                  {isExpanded && (
                    <div className="border-t border-zinc-800/80 p-4 bg-[#0d0d10] space-y-4 animate-fadeIn">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                            Ordered Product Items & Delivery Status
                          </h4>
                          {po.status !== "RECEIVED" && po.status !== "CANCELLED" && (
                            <button
                              onClick={() => {
                                setPoToReceive(po);
                                setIsReceiveModalOpen(true);
                              }}
                              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              Receive Items (GRN)
                            </button>
                          )}
                        </div>
                        <div className="rounded-lg border border-zinc-800 overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-[#16161a] text-zinc-400 text-[11px] border-b border-zinc-800">
                              <tr>
                                <th className="px-3 py-2">Item Name</th>
                                <th className="px-3 py-2">SKU</th>
                                <th className="px-3 py-2 text-right">Ordered</th>
                                <th className="px-3 py-2 text-right">Received</th>
                                <th className="px-3 py-2 text-right">Pending</th>
                                <th className="px-3 py-2 text-right">Unit Cost</th>
                                <th className="px-3 py-2 text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/60">
                              {(po.items || []).map((item, idx) => {
                                const ordered = Number(item.quantity || item.qty) || 0;
                                const received = Number(item.receivedQuantity || item.receivedQty) || 0;
                                const pending = Math.max(0, ordered - received);
                                return (
                                  <tr key={idx} className="hover:bg-zinc-800/20">
                                    <td className="px-3 py-2 font-medium text-zinc-200">{item.name}</td>
                                    <td className="px-3 py-2 font-mono text-zinc-400 text-[11px]">{item.sku || "—"}</td>
                                    <td className="px-3 py-2 text-right font-medium text-zinc-100">{ordered} {item.unit}</td>
                                    <td className="px-3 py-2 text-right font-mono text-emerald-400 font-semibold">{received}</td>
                                    <td className="px-3 py-2 text-right font-mono">
                                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${pending > 0 ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                                        {pending}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-right font-mono text-zinc-300">
                                      ₹{Number(item.unitCost || item.costPrice || 0).toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 text-right font-mono font-bold text-zinc-200">
                                      ₹{Number(item.totalCost || 0).toFixed(2)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Extra PO Details & Quick Status Updater */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 text-xs">
                        <div className="space-y-1 text-zinc-400">
                          {po.paymentTerms && (
                            <p>
                              <span className="text-zinc-500 font-semibold">Terms:</span> {po.paymentTerms}
                            </p>
                          )}
                          {po.notes && (
                            <p>
                              <span className="text-zinc-500 font-semibold">Notes:</span> {po.notes}
                            </p>
                          )}
                        </div>

                        {/* Status Action Buttons */}
                        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                          {po.status === "DRAFT" && (
                            <button
                              onClick={() => handleStatusChange(po._id, "PENDING")}
                              disabled={updatingId === po._id}
                              className="px-3 py-1 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 text-xs font-semibold border border-blue-500/30 cursor-pointer disabled:opacity-50"
                            >
                              Mark as Placed / PENDING
                            </button>
                          )}

                          {/* Receive Stock (GRN) for PENDING and PARTIAL */}
                          {po.status !== "RECEIVED" && po.status !== "CANCELLED" && (
                            <button
                              onClick={() => {
                                setPoToReceive(po);
                                setIsReceiveModalOpen(true);
                              }}
                              className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-semibold border border-emerald-500/30 flex items-center gap-1.5 cursor-pointer"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              Receive Goods (GRN)
                            </button>
                          )}

                          {/* View Past GRN Receipts for PARTIAL and RECEIVED */}
                          {(po.status === "PARTIAL" || po.status === "RECEIVED") && (
                            <button
                              onClick={() => {
                                setPoToReceive(po);
                                setIsReceiveModalOpen(true);
                              }}
                              className="px-3 py-1 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 text-xs font-semibold border border-[#27272a] flex items-center gap-1.5 cursor-pointer"
                            >
                              <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
                              View GRN Receipts
                            </button>
                          )}

                          {po.status !== "RECEIVED" && po.status !== "CANCELLED" && (
                            <button
                              onClick={() => handleStatusChange(po._id, "CANCELLED")}
                              disabled={updatingId === po._id}
                              className="px-3 py-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold border border-rose-500/20 cursor-pointer disabled:opacity-50"
                            >
                              Cancel Order
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Modal Footer ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#1f1f23] bg-[#141417]/90 backdrop-blur-sm sticky bottom-0 z-20 text-xs text-zinc-400">
          <div>
            Showing <span className="text-zinc-200 font-bold">{orders.length}</span> Purchase Order(s)
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* ── Task T44: Receive Goods Modal (GRN) ─────────────────────────── */}
        <ReceiveGoodsModal
          isOpen={isReceiveModalOpen}
          onClose={() => {
            setIsReceiveModalOpen(false);
            setPoToReceive(null);
          }}
          purchaseOrder={poToReceive}
          onReceivedSuccess={() => {
            fetchOrders();
          }}
        />
      </div>
    </div>
  );
}
