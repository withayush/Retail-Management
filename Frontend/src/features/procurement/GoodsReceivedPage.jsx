import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  PackageCheck,
  Search,
  RefreshCw,
  Boxes,
  Truck,
  ShoppingBag,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  FileText,
  Barcode,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { getGRNs, getGRNSummary } from "../../services/purchaseOrder.api";
import toast from "react-hot-toast";

export default function GoodsReceivedPage() {
  const [grns, setGrns] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedGrnId, setExpandedGrnId] = useState(null);

  const loadGRNData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();

      const [grnRes, summaryRes] = await Promise.all([
        getGRNs(params),
        getGRNSummary().catch(() => null),
      ]);

      const list = grnRes.data || grnRes.grns || [];
      setGrns(list);

      if (summaryRes) {
        setSummary(summaryRes.data || summaryRes);
      }
    } catch (err) {
      console.error("Failed to load GRNs:", err);
      toast.error("Failed to load Goods Received Notes.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadGRNData();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadGRNData]);

  return (
    <div className="w-full p-6 md:p-8 space-y-6 min-h-[calc(100vh-4rem)]">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Goods Received Notes (GRN)
            </h1>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 font-mono px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
              Physical Inward Stock
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Central ledger and physical intake records. Audit received vs ordered stock variance, delivery challans, and real-time inventory ledger increments.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to="/purchase-orders"
            className="px-3.5 py-2.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            Purchase Orders
          </Link>

          <Link
            to="/inventory"
            className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Boxes className="w-4 h-4" />
            Inventory Stock Audit
          </Link>

          <button
            onClick={loadGRNData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-[#18181b] hover:bg-zinc-800 text-zinc-400 hover:text-white border border-[#27272a] transition-all disabled:opacity-50 cursor-pointer"
            title="Refresh GRN Master Log"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#18181b] border border-border/40 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Total GRNs</p>
            <p className="text-xl md:text-2xl font-bold text-white mt-1">
              {summary?.totalGRNs ?? grns.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#18181b] border border-border/40 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Received Units</p>
            <p className="text-xl md:text-2xl font-bold text-emerald-400 mt-1">
              {summary?.totalReceivedUnits ??
                grns.reduce(
                  (acc, grn) =>
                    acc + (grn.items || []).reduce((sub, item) => sub + (item.receivedQuantity || 0), 0),
                  0
                )}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#18181b] border border-border/40 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Total Received Value</p>
            <p className="text-xl md:text-2xl font-bold text-blue-400 mt-1">
              ₹
              {Math.round(
                summary?.totalReceivedValue ??
                  grns.reduce(
                    (acc, grn) =>
                      acc +
                      (grn.items || []).reduce(
                        (sub, item) => sub + (item.receivedQuantity || 0) * (item.unitCost || 0),
                        0
                      ),
                    0
                  )
              ).toLocaleString()}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#18181b] border border-border/40 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Active Suppliers</p>
            <p className="text-xl md:text-2xl font-bold text-purple-400 mt-1">
              {new Set(grns.map((g) => g.supplierId?._id || g.supplierId)).size}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Search Bar ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 bg-[#18181b] border border-border/40 p-3 rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by GRN number, PO number, or supplier..."
            className="w-full bg-zinc-900 border border-zinc-700/60 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* ── GRN Master Log Table ─────────────────────────────────────── */}
      <div className="bg-[#18181b] border border-border/40 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
            <p className="text-xs text-zinc-400 font-medium">Loading Goods Received Notes...</p>
          </div>
        ) : grns.length === 0 ? (
          <div className="p-12 text-center">
            <PackageCheck className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white">No Goods Received Notes found</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Physical inventory receipts against approved purchase orders will appear here automatically.
            </p>
            <Link
              to="/purchase-orders"
              className="mt-4 px-4 py-2 rounded-xl gradient-primary text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Go to Purchase Orders
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/60 font-medium">
                  <th className="py-3 px-4">GRN Number</th>
                  <th className="py-3 px-4">Associated PO</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Received Date</th>
                  <th className="py-3 px-4">Challan / Inv #</th>
                  <th className="py-3 px-4">Received Items</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {grns.map((grn) => {
                  const isExpanded = expandedGrnId === grn._id;

                  return (
                    <React.Fragment key={grn._id}>
                      <tr className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-white">
                          <button
                            onClick={() => setExpandedGrnId(isExpanded ? null : grn._id)}
                            className="inline-flex items-center gap-1.5 hover:text-emerald-400 cursor-pointer"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                            )}
                            {grn.grnNumber || "GRN-UNSET"}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-blue-400 font-semibold">
                          {grn.purchaseOrderId?.poNumber || grn.poNumber || "Direct"}
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-white">
                            {grn.supplierId?.company || grn.supplierName || "Supplier"}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 text-zinc-400">
                          {new Date(grn.receivedDate || grn.createdAt).toLocaleDateString()}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-zinc-300">
                          {grn.deliveryChallanNumber || grn.invoiceNumber || "—"}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-[11px] text-zinc-300">
                            {grn.items?.length || 0} items
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full border text-[10px] font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                            VERIFIED & INWARDED
                          </span>
                        </td>
                      </tr>

                      {/* Expandable Line Items */}
                      {isExpanded && (
                        <tr className="bg-zinc-900/80">
                          <td colSpan={7} className="p-4 border-b border-zinc-800/80">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-xs">
                                <h4 className="font-semibold text-zinc-300 flex items-center gap-1.5">
                                  <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
                                  Received Stock Details & Ledger Reconciliation
                                </h4>
                                {grn.notes && (
                                  <p className="text-[11px] text-zinc-400 italic">
                                    Notes: {grn.notes}
                                  </p>
                                )}
                              </div>

                              <div className="bg-zinc-950/70 rounded-xl border border-zinc-800/60 overflow-hidden">
                                <table className="w-full text-left text-[11px]">
                                  <thead>
                                    <tr className="border-b border-zinc-800/60 text-zinc-400 bg-zinc-900/50">
                                      <th className="py-2 px-3">Product Name</th>
                                      <th className="py-2 px-3">Batch Number</th>
                                      <th className="py-2 px-3">Ordered Qty</th>
                                      <th className="py-2 px-3">Received Qty</th>
                                      <th className="py-2 px-3">Unit Cost</th>
                                      <th className="py-2 px-3 text-right">Inward Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-zinc-900 text-zinc-300 font-mono">
                                    {(grn.items || []).map((item, idx) => (
                                      <tr key={idx} className="hover:bg-zinc-900/30">
                                        <td className="py-2 px-3 font-sans font-medium text-white">
                                          {item.productName || item.productId?.name || "Product"}
                                          {item.barcode && (
                                            <span className="text-[10px] text-zinc-500 block font-mono">
                                              Barcode: {item.barcode}
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-2 px-3 text-zinc-400">
                                          {item.batchNumber || "—"}
                                        </td>
                                        <td className="py-2 px-3 text-zinc-400">
                                          {item.orderedQuantity ?? "—"}
                                        </td>
                                        <td className="py-2 px-3 text-emerald-400 font-bold">
                                          +{item.receivedQuantity} {item.unit || "pcs"}
                                        </td>
                                        <td className="py-2 px-3">
                                          ₹{Number(item.unitCost || 0).toFixed(2)}
                                        </td>
                                        <td className="py-2 px-3 text-right text-white font-bold">
                                          ₹{Number((item.receivedQuantity || 0) * (item.unitCost || 0)).toFixed(2)}
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
    </div>
  );
}
