import React, { useState, useEffect } from "react";
import {
  X,
  Receipt,
  User,
  Phone,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  BookOpen,
  TrendingUp,
  Printer,
  Package,
  CheckCircle2,
  AlertTriangle,
  FileDown,
  Eye,
} from "lucide-react";
import { getSaleItems, getPaymentsByInvoice, downloadInvoicePdf, previewInvoicePdf } from "../../../services/sale.api";
import { toast } from "react-hot-toast";

export default function SaleDetailModal({ isOpen, sale, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  useEffect(() => {
    if (!isOpen || !sale) return;

    if (sale.items && sale.items.length > 0) {
      setItems(sale.items);
    } else if (sale._id) {
      const fetchItems = async () => {
        setLoading(true);
        try {
          const res = await getSaleItems(sale._id);
          const list = res.data || res || [];
          setItems(list);
        } catch (err) {
          console.error("Failed to load sale items:", err);
          setItems([]);
        } finally {
          setLoading(false);
        }
      };
      fetchItems();
    }

    if (sale._id) {
      const fetchPayments = async () => {
        setLoadingPayments(true);
        try {
          const pRes = await getPaymentsByInvoice(sale._id);
          const pList = pRes.data || pRes || [];
          setPayments(pList);
        } catch (pErr) {
          console.error("Failed to load payments:", pErr);
          setPayments([]);
        } finally {
          setLoadingPayments(false);
        }
      };
      fetchPayments();
    }
  }, [isOpen, sale]);

  if (!isOpen || !sale) return null;

  const formattedDate = new Date(sale.createdAt || Date.now()).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  let ModeIcon = Banknote;
  if (sale.paymentMode === "UPI") ModeIcon = Smartphone;
  else if (sale.paymentMode === "CARD") ModeIcon = CreditCard;
  else if (sale.paymentMode === "CREDIT_UDHAR") ModeIcon = BookOpen;

  // Calculate gross profit aggregate for this sale
  const totalGrossProfit = items.reduce((acc, it) => {
    const sold = Number(it.soldPrice ?? it.sellingPrice ?? 0);
    const cost = Number(it.costPrice ?? 0);
    const qty = Number(it.quantity || it.qty || 1);
    const profit = it.grossProfit !== undefined ? Number(it.grossProfit) : (sold - cost) * qty;
    return acc + profit;
  }, 0);

  const profitMarginPercent =
    sale.subtotal > 0 ? Math.round((totalGrossProfit / sale.subtotal) * 10000) / 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#111113] border border-[#27272a] rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* ── Modal Header ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between p-4 border-b border-[#1f1f23] bg-[#141417]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-200">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white font-mono">
                  {sale.invoiceNumber}
                </h3>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                    sale.paymentStatus === "PAID"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : sale.paymentStatus === "PARTIAL"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}
                >
                  {sale.paymentStatus}
                </span>
              </div>
              <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5 font-mono">
                <Calendar className="w-3 h-3 text-zinc-500" />
                {formattedDate} • Billed by {sale.createdByName || "Staff"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scrollable Body ─────────────────────────────────────────── */}
        <div className="p-4 overflow-y-auto space-y-3.5 text-xs">
          {/* Customer & Payment Meta Strip */}
          <div className="grid grid-cols-2 gap-3 bg-[#141417] border border-[#27272a] rounded-xl p-3">
            <div>
              <span className="text-[10px] font-semibold text-zinc-400 block mb-1">
                Customer
              </span>
              <p className="font-medium text-white flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                {sale.customerName || "Walk-in Customer"}
              </p>
              {sale.customerPhone && (
                <p className="text-zinc-400 font-mono flex items-center gap-1 mt-0.5 text-[11px]">
                  <Phone className="w-3 h-3" />
                  {sale.customerPhone}
                </p>
              )}
            </div>

            <div>
              <span className="text-[10px] font-semibold text-zinc-400 block mb-1">
                Payment Method
              </span>
              <p className="font-semibold text-white flex items-center gap-1.5">
                <ModeIcon className="w-3.5 h-3.5 text-zinc-300" />
                {sale.paymentMode}
              </p>
              {sale.notes && (
                <p className="text-zinc-400 text-[11px] italic mt-0.5 truncate">
                  “{sale.notes}”
                </p>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-[#1f1f23] rounded-xl overflow-hidden bg-[#111113]">
            <div className="bg-[#141417] px-3.5 py-2 border-b border-[#1f1f23] flex items-center justify-between">
              <span className="font-semibold text-xs text-white flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-zinc-300" />
                <span>Sold Line Items ({items.length})</span>
              </span>
            </div>

            {loading ? (
              <div className="py-6 text-center text-zinc-400">
                <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin mx-auto mb-1.5" />
                <span className="text-xs">Loading items...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="py-6 text-center text-zinc-500 text-xs">
                <span>No item snapshot records attached to this invoice.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#1f1f23] bg-[#141417]/50 text-[10px] font-semibold text-zinc-400">
                      <th className="py-2 px-3">Item / SKU</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Sold Price</th>
                      <th className="py-2 px-3 text-right">Cost Price</th>
                      <th className="py-2 px-3 text-right">Line Total</th>
                      <th className="py-2 px-3 text-right">Gross Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f1f23] font-mono">
                    {items.map((it, idx) => {
                      const sold = Number(it.soldPrice ?? it.sellingPrice ?? 0);
                      const cost = Number(it.costPrice ?? 0);
                      const qty = Number(it.quantity || it.qty || 1);
                      const lineTot = Number(it.totalPrice ?? sold * qty);
                      const profit = Number(it.grossProfit ?? (sold - cost) * qty);

                      return (
                        <tr key={idx} className="hover:bg-zinc-800/20">
                          <td className="py-2 px-3 font-sans">
                            <span className="font-medium text-white block">
                              {it.name || "Product Item"}
                            </span>
                            {it.sku && (
                              <span className="text-[10px] text-zinc-500 font-mono">
                                SKU: {it.sku}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center text-white font-medium">
                            {qty} <span className="text-[10px] text-zinc-500 font-sans">{it.unit || "pcs"}</span>
                          </td>
                          <td className="py-2 px-3 text-right text-zinc-200">
                            ₹{sold.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right text-zinc-400">
                            ₹{cost.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-white">
                            ₹{lineTot.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-emerald-400">
                            +₹{profit.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payment Transactions */}
          {payments.length > 0 && (
            <div className="border border-[#1f1f23] rounded-xl overflow-hidden bg-[#111113]">
              <div className="bg-[#141417] px-3.5 py-2 border-b border-[#1f1f23] flex items-center justify-between">
                <span className="font-semibold text-xs text-white flex items-center gap-1.5">
                  <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Payment Receipts ({payments.length})</span>
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead>
                    <tr className="border-b border-[#1f1f23] bg-[#141417]/50 text-[10px] font-semibold text-zinc-400 font-sans">
                      <th className="py-1.5 px-3">Date</th>
                      <th className="py-1.5 px-3">Method</th>
                      <th className="py-1.5 px-3">Reference ID</th>
                      <th className="py-1.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f1f23]">
                    {payments.map((p, pIdx) => (
                      <tr key={pIdx} className="hover:bg-zinc-800/20">
                        <td className="py-1.5 px-3 text-zinc-400 text-[11px] font-sans">
                          {new Date(p.createdAt || Date.now()).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-1.5 px-3 font-semibold text-white">
                          <span className="px-1.5 py-0.2 rounded bg-[#141417] text-[10px] border border-[#27272a]">
                            {p.method}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-zinc-400 text-[11px]">
                          {p.referenceId || "—"}
                        </td>
                        <td className="py-1.5 px-3 text-right font-semibold text-emerald-400">
                          ₹{Number(p.amount || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Financial Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Profit Analytics Card */}
            <div className="bg-[#141417] border border-[#27272a] rounded-xl p-3 space-y-1">
              <div className="flex items-center justify-between text-zinc-400 text-[10px] font-semibold">
                <span>Gross Profit</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-xl font-bold font-mono text-emerald-400">
                +₹{totalGrossProfit.toFixed(2)}
              </p>
              <p className="text-[11px] text-zinc-500">
                Margin: <span className="text-emerald-400 font-semibold font-mono">{profitMarginPercent}%</span>
              </p>
            </div>

            {/* Financial Totals */}
            <div className="bg-[#141417] border border-[#27272a] rounded-xl p-3 space-y-1 font-mono">
              <div className="flex justify-between text-zinc-400 text-xs">
                <span className="font-sans">Subtotal:</span>
                <span>₹{(sale.subtotal || 0).toFixed(2)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-emerald-400 text-xs">
                  <span className="font-sans">Discount:</span>
                  <span>-₹{sale.discount.toFixed(2)}</span>
                </div>
              )}
              {sale.tax > 0 && (
                <div className="flex justify-between text-zinc-400 text-xs">
                  <span className="font-sans">Tax:</span>
                  <span>+₹{sale.tax.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-[#1f1f23] pt-1 flex justify-between font-bold text-sm text-white">
                <span className="font-sans">Grand Total:</span>
                <span className="text-zinc-100">₹{(sale.total || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px] pt-0.5">
                <span className="font-sans text-emerald-400 font-medium">Paid: ₹{(sale.paidAmount || 0).toFixed(2)}</span>
                {sale.dueAmount > 0 ? (
                  <span className="font-sans text-red-400 font-semibold">Due: ₹{sale.dueAmount.toFixed(2)}</span>
                ) : (
                  <span className="font-sans text-zinc-500">Fully Settled</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Modal Footer ────────────────────────────────────────────── */}
        <div className="p-3.5 border-t border-[#1f1f23] bg-[#141417] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  await downloadInvoicePdf(sale._id || sale.id, sale.invoiceNumber);
                  toast.success(`PDF Invoice #${sale.invoiceNumber} downloaded! 📄`);
                } catch (err) {
                  console.error(err);
                  toast.error("Failed to download invoice PDF.");
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#27272a] bg-[#111113] hover:bg-zinc-800 text-zinc-200 font-medium text-xs transition-colors cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                try {
                  await previewInvoicePdf(sale._id || sale.id);
                } catch (err) {
                  console.error(err);
                  toast.error("Failed to preview invoice PDF.");
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#27272a] bg-[#111113] hover:bg-zinc-800 text-zinc-200 font-medium text-xs transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-zinc-400" />
              <span>Preview</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#27272a] bg-[#111113] hover:bg-zinc-800 text-zinc-200 font-medium text-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-zinc-400" />
              <span>Print</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-900 font-semibold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
