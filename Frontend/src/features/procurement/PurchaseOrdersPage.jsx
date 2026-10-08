import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Plus,
  RefreshCw,
  Search,
  Filter,
  PackageCheck,
  Truck,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Boxes,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import {
  getPurchaseOrders,
  getPOSummary,
  updatePOStatus,
  cancelPurchaseOrder,
} from "../../services/purchaseOrder.api";
import CreatePurchaseOrderModal from "../suppliers/components/CreatePurchaseOrderModal";
import ReceiveGoodsModal from "../suppliers/components/ReceiveGoodsModal";
import PurchaseOrderHistoryModal from "../suppliers/components/PurchaseOrderHistoryModal";
import GoodsReceivedNotesModal from "../suppliers/components/GoodsReceivedNotesModal";
import toast from "react-hot-toast";

const STATUS_TABS = [
  { id: "ALL", label: "All Orders" },
  { id: "PENDING", label: "Pending Approval" },
  { id: "APPROVED", label: "Approved / In-Transit" },
  { id: "PARTIALLY_RECEIVED", label: "Partially Received" },
  { id: "RECEIVED", label: "Fully Received" },
  { id: "CANCELLED", label: "Cancelled" },
];

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPoId, setExpandedPoId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [poToReceive, setPoToReceive] = useState(null);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [selectedPoForTimeline, setSelectedPoForTimeline] = useState(null);
  const [isGRNModalOpen, setIsGRNModalOpen] = useState(false);

  // Load POs and KPI Summary
  const loadOrdersData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const [ordersRes, summaryRes] = await Promise.all([
        getPurchaseOrders(params),
        getPOSummary().catch(() => null),
      ]);

      const list = ordersRes.data || ordersRes.purchaseOrders || [];
      setOrders(list);

      if (summaryRes) {
        setSummary(summaryRes.data || summaryRes);
      }
    } catch (err) {
      console.error("Failed to load purchase orders:", err);
      toast.error("Failed to fetch purchase orders.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrdersData();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadOrdersData]);

  // Action handlers
  const handleApprovePO = async (poId) => {
    setUpdatingId(poId);
    try {
      await updatePOStatus(poId, "APPROVED", "Approved for dispatch via Purchase Orders Hub");
      toast.success("Purchase order approved successfully!");
      loadOrdersData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve purchase order.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancelPO = async (poId) => {
    if (!window.confirm("Are you sure you want to cancel this purchase order?")) return;
    setUpdatingId(poId);
    try {
      await cancelPurchaseOrder(poId, "Cancelled by store operator");
      toast.success("Purchase order cancelled.");
      loadOrdersData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel order.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenReceive = (po) => {
    setPoToReceive(po);
    setIsReceiveModalOpen(true);
  };

  const handleOpenTimeline = (po) => {
    setSelectedPoForTimeline(po);
    setIsTimelineModalOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "APPROVED":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "PARTIALLY_RECEIVED":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "RECEIVED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "CANCELLED":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/30";
    }
  };

  return (
    <div className="w-full p-6 md:p-8 space-y-6 min-h-[calc(100vh-4rem)]">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Purchase Orders & Procurement
            </h1>
            <span className="text-xs bg-blue-500/10 text-blue-400 font-mono px-2 py-0.5 rounded-full border border-blue-500/20 font-semibold">
              Procurement Center
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Create supplier purchase orders, track order approval cycles, receive physical GRN stock, and manage procurement pipelines.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to="/goods-received"
            className="px-3.5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <PackageCheck className="w-4 h-4" />
            Goods Receipts (GRN) Log
          </Link>

          <Link
            to="/suppliers"
            className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Truck className="w-4 h-4" />
            Suppliers Directory
          </Link>

          <button
            onClick={loadOrdersData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-[#18181b] hover:bg-zinc-800 text-zinc-400 hover:text-white border border-[#27272a] transition-all disabled:opacity-50 cursor-pointer"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl gradient-primary text-white text-xs font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-primary/25 transition-all cursor-pointer shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Create Purchase Order
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#18181b] border border-border/40 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Total Orders</p>
            <p className="text-xl md:text-2xl font-bold text-white mt-1">
              {summary?.totalOrders ?? orders.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#18181b] border border-border/40 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Pending Approval</p>
            <p className="text-xl md:text-2xl font-bold text-amber-400 mt-1">
              {summary?.pendingOrders ?? orders.filter((o) => o.status === "PENDING").length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#18181b] border border-border/40 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Approved / In-Transit</p>
            <p className="text-xl md:text-2xl font-bold text-blue-400 mt-1">
              {summary?.approvedOrders ?? orders.filter((o) => o.status === "APPROVED").length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#18181b] border border-border/40 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Fully Received</p>
            <p className="text-xl md:text-2xl font-bold text-emerald-400 mt-1">
              {summary?.receivedOrders ?? orders.filter((o) => o.status === "RECEIVED").length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Procurement Lifecycle Pipeline Banner ─────────────────────── */}
      <div className="bg-[#18181b]/60 border border-border/40 rounded-2xl p-3.5 flex items-center justify-between overflow-x-auto text-xs text-zinc-400">
        <div className="flex items-center gap-2 min-w-max">
          <span className="w-5 h-5 rounded-full bg-blue-500 text-white font-bold text-[10px] flex items-center justify-center">1</span>
          <span className="font-semibold text-zinc-200">1. Draft PO</span>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-zinc-600 shrink-0 mx-2" />
        <div className="flex items-center gap-2 min-w-max">
          <span className="w-5 h-5 rounded-full bg-amber-500 text-zinc-950 font-bold text-[10px] flex items-center justify-center">2</span>
          <span className="font-semibold text-zinc-200">2. Pending Approval</span>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-zinc-600 shrink-0 mx-2" />
        <div className="flex items-center gap-2 min-w-max">
          <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">3</span>
          <span className="font-semibold text-zinc-200">3. Approved & Dispatched</span>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-zinc-600 shrink-0 mx-2" />
        <div className="flex items-center gap-2 min-w-max">
          <span className="w-5 h-5 rounded-full bg-purple-500 text-white font-bold text-[10px] flex items-center justify-center">4</span>
          <span className="font-semibold text-zinc-200">4. Physical Intake (GRN)</span>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-zinc-600 shrink-0 mx-2" />
        <div className="flex items-center gap-2 min-w-max">
          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center">5</span>
          <span className="font-semibold text-emerald-400 font-bold">5. Inventory IN (Ledger Updated)</span>
        </div>
      </div>

      {/* ── Search & Filter Tabs ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#18181b] border border-border/40 p-3 rounded-2xl">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search PO number or supplier..."
            className="w-full bg-zinc-900 border border-zinc-700/60 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* ── Purchase Orders Table ────────────────────────────────────── */}
      <div className="bg-[#18181b] border border-border/40 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
            <p className="text-xs text-zinc-400 font-medium">Loading purchase orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white">No purchase orders found</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== "ALL"
                ? "No purchase orders matched your search or status filter."
                : "You have not created any purchase orders yet. Click 'Create Purchase Order' to initiate vendor procurement."}
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl gradient-primary text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Create First PO
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/60 font-medium">
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Order Date</th>
                  <th className="py-3 px-4">Expected Date</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {orders.map((po) => {
                  const isExpanded = expandedPoId === po._id;
                  const isUpdating = updatingId === po._id;

                  return (
                    <React.Fragment key={po._id}>
                      <tr className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-white">
                          <button
                            onClick={() => setExpandedPoId(isExpanded ? null : po._id)}
                            className="inline-flex items-center gap-1.5 hover:text-blue-400 cursor-pointer"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                            )}
                            {po.poNumber || "PO-UNSET"}
                          </button>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-white">
                            {po.supplierId?.company || po.supplierName || "Direct Supplier"}
                          </p>
                          {po.supplierId?.contactPerson && (
                            <p className="text-[10px] text-zinc-500">
                              {po.supplierId.contactPerson} • {po.supplierId.phone}
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-zinc-400">
                          {new Date(po.orderDate || po.createdAt).toLocaleDateString()}
                        </td>

                        <td className="py-3.5 px-4 text-zinc-400">
                          {po.expectedDeliveryDate
                            ? new Date(po.expectedDeliveryDate).toLocaleDateString()
                            : "—"}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-[11px] text-zinc-300">
                            {po.items?.length || 0} line items
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-white">
                          ₹{Number(po.totalAmount || 0).toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full border text-[10px] font-bold tracking-wide uppercase ${getStatusBadge(
                              po.status
                            )}`}
                          >
                            {po.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {po.status === "PENDING" && (
                              <button
                                onClick={() => handleApprovePO(po._id)}
                                disabled={isUpdating}
                                className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/40 text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                Approve
                              </button>
                            )}

                            {(po.status === "APPROVED" || po.status === "PARTIALLY_RECEIVED") && (
                              <button
                                onClick={() => handleOpenReceive(po)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <PackageCheck className="w-3 h-3" />
                                Receive (GRN)
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenTimeline(po)}
                              className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                              title="Audit Timeline"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>

                            {po.status === "PENDING" && (
                              <button
                                onClick={() => handleCancelPO(po._id)}
                                disabled={isUpdating}
                                className="px-2 py-1 rounded-lg hover:bg-rose-500/20 text-rose-400 text-[11px] font-medium transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Line Items */}
                      {isExpanded && (
                        <tr className="bg-zinc-900/80">
                          <td colSpan={8} className="p-4 border-b border-zinc-800/80">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-xs">
                                <h4 className="font-semibold text-zinc-300 flex items-center gap-1.5">
                                  <Boxes className="w-3.5 h-3.5 text-blue-400" />
                                  Ordered Line Items ({po.items?.length || 0})
                                </h4>
                                {po.notes && (
                                  <p className="text-[11px] text-zinc-400 italic">
                                    Note: {po.notes}
                                  </p>
                                )}
                              </div>

                              <div className="bg-zinc-950/70 rounded-xl border border-zinc-800/60 overflow-hidden">
                                <table className="w-full text-left text-[11px]">
                                  <thead>
                                    <tr className="border-b border-zinc-800/60 text-zinc-400 bg-zinc-900/50">
                                      <th className="py-2 px-3">Item / SKU</th>
                                      <th className="py-2 px-3">Ordered Qty</th>
                                      <th className="py-2 px-3">Unit Cost</th>
                                      <th className="py-2 px-3">Tax Rate</th>
                                      <th className="py-2 px-3 text-right">Line Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-zinc-900 text-zinc-300 font-mono">
                                    {(po.items || []).map((item, idx) => (
                                      <tr key={idx} className="hover:bg-zinc-900/30">
                                        <td className="py-2 px-3 font-sans font-medium text-white">
                                          {item.productName || item.productId?.name || "Product Item"}
                                          {item.sku && (
                                            <span className="text-[10px] text-zinc-500 block font-mono">
                                              SKU: {item.sku}
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-2 px-3">
                                          {item.quantity} {item.unit || "pcs"}
                                        </td>
                                        <td className="py-2 px-3">
                                          ₹{Number(item.unitCost || 0).toFixed(2)}
                                        </td>
                                        <td className="py-2 px-3">
                                          {item.taxRate || 0}%
                                        </td>
                                        <td className="py-2 px-3 text-right text-white font-bold">
                                          ₹{Number(item.totalCost || item.quantity * item.unitCost || 0).toFixed(2)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modals Integrated ────────────────────────────────────────── */}
      <CreatePurchaseOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={() => {
          setIsCreateModalOpen(false);
          loadOrdersData();
        }}
      />

      {poToReceive && (
        <ReceiveGoodsModal
          isOpen={isReceiveModalOpen}
          onClose={() => {
            setIsReceiveModalOpen(false);
            setPoToReceive(null);
          }}
          purchaseOrder={poToReceive}
          onReceived={() => {
            setIsReceiveModalOpen(false);
            setPoToReceive(null);
            loadOrdersData();
          }}
        />
      )}

      {selectedPoForTimeline && (
        <PurchaseOrderHistoryModal
          isOpen={isTimelineModalOpen}
          onClose={() => {
            setIsTimelineModalOpen(false);
            setSelectedPoForTimeline(null);
          }}
          purchaseOrder={selectedPoForTimeline}
        />
      )}

      <GoodsReceivedNotesModal
        isOpen={isGRNModalOpen}
        onClose={() => setIsGRNModalOpen(false)}
      />
    </div>
  );
}
