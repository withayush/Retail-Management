import React, { useState, useEffect } from "react";
import {
  X,
  PackageCheck,
  Truck,
  AlertCircle,
  CheckCircle2,
  Calendar,
  FileText,
  Clock,
  Layers,
  Info,
  ChevronDown,
  ChevronUp,
  History,
  Barcode,
} from "lucide-react";
import { receiveStock, getGRNsByPoId } from "../../../services/purchaseOrder.api";
import { toast } from "react-hot-toast";

/**
 * Phase 7 - Task T44: Goods Received Note (GRN) & Stock Receive Modal
 * 
 * Allows receiving partial or full stock shipments against an official Purchase Order.
 * Incrementing inventory counts and creating immutable Inventory Ledger logs.
 */
export default function ReceiveGoodsModal({
  isOpen,
  onClose,
  purchaseOrder,
  onReceivedSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("RECEIVE"); // "RECEIVE" | "HISTORY"
  const [grnHistory, setGrnHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // GRN Form State
  const [receivedDate, setReceivedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [deliveryChallanNumber, setDeliveryChallanNumber] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [allowOverdelivery, setAllowOverdelivery] = useState(false);

  // Line items state
  const [receiptLines, setReceiptLines] = useState([]);

  // Initialize receipt lines when purchaseOrder opens
  useEffect(() => {
    if (purchaseOrder && isOpen) {
      setReceivedDate(new Date().toISOString().split("T")[0]);
      setDeliveryChallanNumber("");
      setInvoiceNumber("");
      setNotes("");
      setAllowOverdelivery(false);
      setActiveTab("RECEIVE");

      const lines = (purchaseOrder.items || []).map((item) => {
        const ordered = Number(item.quantity || item.qty) || 0;
        const previouslyReceived = Number(item.receivedQuantity || item.receivedQty) || 0;
        const remaining = Math.max(0, ordered - previouslyReceived);
        const costPrice = Number(item.unitCost || item.costPrice) || 0;

        return {
          productId: item.productId?._id || item.productId || null,
          itemId: item._id,
          name: item.name,
          sku: item.sku || "",
          unit: item.unit || "pcs",
          costPrice,
          orderedQty: ordered,
          previouslyReceivedQty: previouslyReceived,
          remainingQty: remaining,
          // Prefill with remaining qty if pending, otherwise 0
          receivedQty: remaining > 0 ? remaining : 0,
          notes: "",
        };
      });

      setReceiptLines(lines);

      // Load past GRN history for this PO
      loadHistory(purchaseOrder._id);
    }
  }, [purchaseOrder, isOpen]);

  const loadHistory = async (poId) => {
    if (!poId) return;
    try {
      setLoadingHistory(true);
      const res = await getGRNsByPoId(poId);
      setGrnHistory(res.data || []);
    } catch (err) {
      console.error("Failed to load GRN history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!isOpen || !purchaseOrder) return null;

  const handleQtyChange = (index, val) => {
    const num = Math.max(0, parseFloat(val) || 0);
    setReceiptLines((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], receivedQty: num };
      return copy;
    });
  };

  const handleSetAllRemaining = () => {
    setReceiptLines((prev) =>
      prev.map((item) => ({
        ...item,
        receivedQty: item.remainingQty,
      }))
    );
  };

  const handleClearAll = () => {
    setReceiptLines((prev) =>
      prev.map((item) => ({
        ...item,
        receivedQty: 0,
      }))
    );
  };

  // Calculations
  const totalIncomingUnits = receiptLines.reduce(
    (sum, line) => sum + (Number(line.receivedQty) || 0),
    0
  );

  const totalIncomingCost = receiptLines.reduce(
    (sum, line) =>
      sum + (Number(line.receivedQty) || 0) * (Number(line.costPrice) || 0),
    0
  );

  // Projected status after this receipt
  let projectedAllComplete = true;
  receiptLines.forEach((line) => {
    const totalAfter = (line.previouslyReceivedQty || 0) + (Number(line.receivedQty) || 0);
    if (totalAfter < line.orderedQty) projectedAllComplete = false;
  });

  const projectedStatus =
    totalIncomingUnits === 0
      ? purchaseOrder.status
      : projectedAllComplete
      ? "RECEIVED"
      : "PARTIAL";

  const handleSubmitReceive = async (e) => {
    e.preventDefault();

    if (totalIncomingUnits <= 0) {
      toast.error("Please enter at least 1 unit to receive into stock.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        purchaseOrderId: purchaseOrder._id,
        receivedDate,
        deliveryChallanNumber: deliveryChallanNumber.trim(),
        invoiceNumber: invoiceNumber.trim(),
        notes: notes.trim(),
        allowOverdelivery,
        items: receiptLines.map((line) => ({
          productId: line.productId,
          name: line.name,
          sku: line.sku,
          receivedQty: Number(line.receivedQty) || 0,
          costPrice: line.costPrice,
          notes: line.notes,
        })),
      };

      const res = await receiveStock(payload);

      toast.success(
        `GRN (${res.data?.grn?.grnNumber || "Confirmed"}) created! Stock incremented (+${totalIncomingUnits} units).`,
        { duration: 4500 }
      );

      if (onReceivedSuccess) {
        onReceivedSuccess(res.data);
      }
      onClose();
    } catch (err) {
      console.error("Receive stock error:", err);
      toast.error(
        err.response?.data?.message ||
          "Failed to process Goods Received Note. Check received quantities."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#111113] border border-[#27272a] rounded-2xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        
        {/* ── Modal Header ─────────────────────────────────────────── */}
        <div className="p-5 border-b border-[#27272a] bg-[#141417] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Goods Received Note (GRN)
                </h2>
                <span className="text-[11px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md">
                  {purchaseOrder.poNumber}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    purchaseOrder.status === "RECEIVED"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : purchaseOrder.status === "PARTIAL"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  }`}
                >
                  {purchaseOrder.status}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Supplier: <span className="text-zinc-200 font-semibold">{purchaseOrder.supplierCompany}</span> • Confirm incoming delivery & update inventory
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Navigation Tabs ──────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-5 pt-3 pb-2 border-b border-[#1f1f23] bg-[#111113] shrink-0">
          <button
            onClick={() => setActiveTab("RECEIVE")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "RECEIVE"
                ? "bg-zinc-100 text-zinc-900 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            Receive Items
          </button>
          <button
            onClick={() => setActiveTab("HISTORY")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "HISTORY"
                ? "bg-zinc-100 text-zinc-900 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Receipt History
            {grnHistory.length > 0 && (
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                {grnHistory.length}
              </span>
            )}
          </button>
        </div>

        {/* ── Tab 1: Receive Form ──────────────────────────────────── */}
        {activeTab === "RECEIVE" && (
          <form onSubmit={handleSubmitReceive} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-5 space-y-5 overflow-y-auto flex-1">
              
              {/* Architecture Info Callout */}
              <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-3">
                <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-300 leading-relaxed">
                  <span className="font-semibold text-emerald-400">Stock In Guarantee (T44):</span> Receiving quantities here will physically increase product available stock and generate audited <span className="font-mono text-zinc-200">GOODS_RECEIPT</span> entries in the Inventory Movement Ledger.
                </div>
              </div>

              {/* GRN Delivery Meta Header */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#141417] p-3.5 rounded-xl border border-[#27272a]">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Receipt Date *
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      required
                      value={receivedDate}
                      onChange={(e) => setReceivedDate(e.target.value)}
                      className="w-full bg-[#18181b] border border-[#27272a] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Delivery Challan / LR #
                  </label>
                  <div className="relative">
                    <Truck className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. DC-9842"
                      value={deliveryChallanNumber}
                      onChange={(e) => setDeliveryChallanNumber(e.target.value)}
                      className="w-full bg-[#18181b] border border-[#27272a] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Supplier Invoice #
                  </label>
                  <div className="relative">
                    <FileText className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. INV-2026-441"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="w-full bg-[#18181b] border border-[#27272a] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Line Items Receive Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200">
                    Order Line Items ({receiptLines.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSetAllRemaining}
                      className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
                    >
                      Receive All Remaining
                    </button>
                    <span className="text-zinc-600">•</span>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="text-[11px] text-zinc-400 hover:text-zinc-200 hover:underline cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="border border-[#27272a] rounded-xl overflow-hidden bg-[#141417]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#18181b] border-b border-[#27272a] text-[10px] uppercase font-semibold text-zinc-400">
                      <tr>
                        <th className="py-2.5 px-3">Product / Item</th>
                        <th className="py-2.5 px-3 text-center">Ordered</th>
                        <th className="py-2.5 px-3 text-center">Previously Recv</th>
                        <th className="py-2.5 px-3 text-center">Remaining</th>
                        <th className="py-2.5 px-3 text-center w-32">Receiving Now</th>
                        <th className="py-2.5 px-3 text-right">Unit Cost</th>
                        <th className="py-2.5 px-3 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272a]/60">
                      {receiptLines.map((line, idx) => {
                        const lineTotal =
                          (Number(line.receivedQty) || 0) * (Number(line.costPrice) || 0);
                        const isOver =
                          (line.previouslyReceivedQty || 0) + (Number(line.receivedQty) || 0) >
                          line.orderedQty;

                        return (
                          <tr
                            key={line.itemId || idx}
                            className="hover:bg-zinc-800/30 transition-colors"
                          >
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-white">
                                {line.name}
                              </div>
                              <div className="text-[10px] text-zinc-500 font-mono">
                                {line.sku || "No SKU"} • {line.unit}
                              </div>
                            </td>

                            <td className="py-2.5 px-3 text-center font-mono text-zinc-300">
                              {line.orderedQty}
                            </td>

                            <td className="py-2.5 px-3 text-center font-mono text-zinc-400">
                              {line.previouslyReceivedQty}
                            </td>

                            <td className="py-2.5 px-3 text-center font-mono">
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

                            <td className="py-2.5 px-3 text-center">
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={line.receivedQty}
                                onChange={(e) => handleQtyChange(idx, e.target.value)}
                                className={`w-24 text-center font-mono font-bold bg-[#111113] border rounded-lg py-1 text-xs outline-none transition-colors ${
                                  isOver
                                    ? "border-amber-500 text-amber-300 focus:border-amber-400"
                                    : line.receivedQty > 0
                                    ? "border-emerald-500/60 text-emerald-400 focus:border-emerald-400"
                                    : "border-[#27272a] text-zinc-400 focus:border-zinc-500"
                                }`}
                              />
                            </td>

                            <td className="py-2.5 px-3 text-right font-mono text-zinc-400">
                              ₹{Number(line.costPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>

                            <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-100">
                              ₹{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Additional Options & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Inspection Remarks / Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Verified batch packaging, condition intact..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-[#141417] border border-[#27272a] rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 outline-none resize-none"
                  />
                </div>

                <div className="flex flex-col justify-center p-3 bg-[#141417] border border-[#27272a] rounded-xl">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowOverdelivery}
                      onChange={(e) => setAllowOverdelivery(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-0"
                    />
                    <span className="text-xs font-semibold text-zinc-200">
                      Allow Excess / Over-Delivery
                    </span>
                  </label>
                  <p className="text-[11px] text-zinc-400 mt-1 pl-5">
                    Enable if the supplier delivered extra bonus units beyond the original PO quantity.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Modal Footer with Live Receipt Summary ────────────── */}
            <div className="p-4 border-t border-[#27272a] bg-[#141417] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">
                    Total Units Receiving
                  </span>
                  <span className="text-sm font-mono font-bold text-emerald-400">
                    +{totalIncomingUnits} units
                  </span>
                </div>
                <div className="h-6 w-px bg-zinc-800" />
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">
                    Batch Stock Cost
                  </span>
                  <span className="text-sm font-mono font-bold text-white">
                    ₹{totalIncomingCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="h-6 w-px bg-zinc-800" />
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">
                    Projected PO Status
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      projectedStatus === "RECEIVED"
                        ? "text-emerald-400"
                        : "text-amber-400"
                    }`}
                  >
                    {projectedStatus}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-[#18181b] hover:bg-zinc-800 border border-[#27272a] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || totalIncomingUnits <= 0}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <PackageCheck className="w-4 h-4" />
                  {loading ? "Processing GRN..." : "Confirm & Receive Stock"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ── Tab 2: GRN Receipts History ──────────────────────────── */}
        {activeTab === "HISTORY" && (
          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            {loadingHistory ? (
              <div className="py-12 text-center text-xs text-zinc-500 flex flex-col items-center gap-2">
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                Loading receiving history...
              </div>
            ) : grnHistory.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <PackageCheck className="w-8 h-8 text-zinc-600 mx-auto" />
                <h4 className="text-xs font-bold text-zinc-300">
                  No Goods Received Notes Yet
                </h4>
                <p className="text-[11px] text-zinc-500">
                  No physical stock has been received against this Purchase Order yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {grnHistory.map((grn) => (
                  <div
                    key={grn._id}
                    className="p-4 rounded-xl bg-[#141417] border border-[#27272a] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {grn.grnNumber}
                        </span>
                        <span className="text-xs text-zinc-400">
                          {new Date(grn.receivedDate).toLocaleDateString()}
                        </span>
                        {grn.deliveryChallanNumber && (
                          <span className="text-[10px] text-zinc-400 font-mono bg-zinc-800 px-1.5 py-0.5 rounded">
                            Challan: {grn.deliveryChallanNumber}
                          </span>
                        )}
                        {grn.invoiceNumber && (
                          <span className="text-[10px] text-zinc-400 font-mono bg-zinc-800 px-1.5 py-0.5 rounded">
                            Invoice: {grn.invoiceNumber}
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-white">
                          +{grn.totalItemsReceived} units
                        </span>
                        <span className="text-[11px] text-zinc-400 font-mono block">
                          ₹{Number(grn.totalCostReceived).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Received line items */}
                    <div className="border-t border-[#1f1f23] pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        {grn.items.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-2 rounded-lg bg-[#18181b]/60 border border-[#27272a]/60"
                          >
                            <span className="font-medium text-zinc-200 truncate max-w-[180px]">
                              {item.name}
                            </span>
                            <span className="font-mono font-bold text-emerald-400 shrink-0">
                              +{item.receivedQty} {item.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {grn.notes && (
                      <p className="text-[11px] text-zinc-400 italic">
                        "{grn.notes}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
