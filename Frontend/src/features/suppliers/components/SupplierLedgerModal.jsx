import React, { useState, useEffect } from "react";
import {
  X,
  BookOpen,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Building2,
  FileText,
  CreditCard,
} from "lucide-react";
import { getSupplierLedger, appendSupplierLedgerEntry } from "../../../services/supplier.api";
import { generateIdempotencyKey } from "../../../services/api";
import toast from "react-hot-toast";

export default function SupplierLedgerModal({
  isOpen,
  onClose,
  supplier,
  onSettlePayment,
}) {
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);

  // Manual Adjustment Form State
  const [entryType, setEntryType] = useState("ADJUSTMENT");
  const [invoiceVal, setInvoiceVal] = useState("");
  const [paymentVal, setPaymentVal] = useState("");
  const [notes, setNotes] = useState("");
  const [submittingManual, setSubmittingManual] = useState(false);

  const fetchLedger = () => {
    if (supplier?.id || supplier?._id) {
      const suppId = supplier.id || supplier._id;
      setLoading(true);
      getSupplierLedger(suppId)
        .then((res) => setLedgerData(res.data || res))
        .catch((err) => {
          console.error("Failed to load supplier ledger:", err);
          toast.error("Failed to load supplier ledger history.");
        })
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    if (isOpen && supplier) {
      fetchLedger();
      setShowManualEntry(false);
    }
  }, [isOpen, supplier]);

  if (!isOpen || !supplier) return null;

  const summary = ledgerData?.summary || {};
  const entries = ledgerData?.entries || [];
  const suppInfo = ledgerData?.supplier || supplier;

  const handleManualEntrySubmit = async (e) => {
    e.preventDefault();
    const numInv = Number(invoiceVal) || 0;
    const numPay = Number(paymentVal) || 0;

    if (numInv === 0 && numPay === 0) {
      return toast.error("Please specify either an Invoice Value (+) or Payment Amount (-).");
    }

    setSubmittingManual(true);
    try {
      const suppId = supplier.id || supplier._id;
      const idempotencyKey = generateIdempotencyKey();
      await appendSupplierLedgerEntry(
        suppId,
        {
          entryType,
          invoiceValue: numInv,
          paymentAmount: numPay,
          notes: notes.trim() || undefined,
        },
        idempotencyKey
      );

      toast.success("Manual ledger adjustment appended successfully.");
      setInvoiceVal("");
      setPaymentVal("");
      setNotes("");
      setShowManualEntry(false);
      fetchLedger();
    } catch (err) {
      console.error("Manual adjustment error:", err);
      toast.error(err.response?.data?.message || "Failed to append ledger entry.");
    } finally {
      setSubmittingManual(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#111113] border border-[#27272a] rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#1f1f23] bg-[#141417] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm md:text-base font-bold text-white">
                  {suppInfo.company || suppInfo.name}
                </h2>
                {suppInfo.phone && (
                  <span className="text-xs bg-[#18181b] text-zinc-300 font-mono px-2 py-0.5 rounded border border-[#27272a]">
                    {suppInfo.phone}
                  </span>
                )}
                {suppInfo.gstin && (
                  <span className="text-[11px] bg-amber-500/10 text-amber-400 font-mono px-2 py-0.5 rounded border border-amber-500/20">
                    GST: {suppInfo.gstin}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Supplier Accounts Payable Ledger & Audit Statement (T39)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowManualEntry(!showManualEntry)}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-all border border-zinc-700 cursor-pointer"
              title="Add manual adjustment entry (Append-only)"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              {showManualEntry ? "Hide Adjustment" : "Manual Entry"}
            </button>

            {(suppInfo.currentBalance || summary.currentPayableOutstanding || 0) > 0 && onSettlePayment && (
              <button
                onClick={() => {
                  onClose();
                  onSettlePayment(suppInfo);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Disburse Payment
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Financial Summary KPI Bar */}
        <div className="p-4 bg-[#0c0c0e] border-b border-[#1f1f23] grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-[#141417] border border-[#27272a] space-y-1">
            <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" /> Total Purchases Delivered (+)
            </span>
            <p className="text-base font-bold font-mono text-blue-400">
              ₹{Number(summary.totalPurchasesValue || 0).toFixed(2)}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#141417] border border-[#27272a] space-y-1">
            <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" /> Total Payments Made (-)
            </span>
            <p className="text-base font-bold font-mono text-emerald-400">
              ₹{Number(summary.totalPaymentsMade || 0).toFixed(2)}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/30 space-y-1">
            <span className="text-[11px] text-amber-300 font-medium flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" /> Current Net Payable Owed
            </span>
            <p className="text-base font-bold font-mono text-amber-400">
              ₹{Number(suppInfo.currentBalance || summary.currentPayableOutstanding || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Manual Adjustment Dropdown Panel */}
        {showManualEntry && (
          <form
            onSubmit={handleManualEntrySubmit}
            className="p-4 bg-[#141417] border-b border-[#1f1f23] space-y-3 animate-fadeIn"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                Append Manual Ledger Entry (Append-Only Audit Log)
              </span>
              <span className="text-[11px] text-zinc-400">
                Formula: New Balance = Current Balance + Invoice Value - Payment
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Entry Type</label>
                <select
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                >
                  <option value="ADJUSTMENT">ADJUSTMENT</option>
                  <option value="OPENING_BALANCE">OPENING_BALANCE</option>
                  <option value="PURCHASE_CREDIT">PURCHASE_CREDIT</option>
                  <option value="PAYMENT_MADE">PAYMENT_MADE</option>
                  <option value="REFUND">REFUND</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Invoice Value (+) ₹
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={invoiceVal}
                  onChange={(e) => setInvoiceVal(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-2.5 py-1.5 text-xs font-mono text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Payment Amount (-) ₹
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentVal}
                  onChange={(e) => setPaymentVal(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-2.5 py-1.5 text-xs font-mono text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Remarks / Reason</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Volume discount rebate"
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowManualEntry(false)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingManual}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 disabled:opacity-50"
              >
                {submittingManual ? "Saving..." : "Append Entry"}
              </button>
            </div>
          </form>
        )}

        {/* Ledger Entries Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="py-16 text-center text-xs text-zinc-500 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />
              <span>Fetching supplier audit statement...</span>
            </div>
          ) : entries.length === 0 ? (
            <div className="py-16 text-center text-xs text-zinc-500 space-y-2">
              <Building2 className="w-8 h-8 mx-auto text-zinc-600" />
              <p className="font-semibold text-zinc-300 text-sm">No Ledger Transactions Yet</p>
              <p className="text-zinc-500 text-xs max-w-sm mx-auto">
                Transactions will appear here automatically when inventory purchases are received from this supplier or payout disbursements are recorded.
              </p>
            </div>
          ) : (
            <div className="border border-[#1f1f23] rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-[#141417] text-zinc-400 uppercase text-[10px] font-semibold border-b border-[#1f1f23] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Ref / Invoice / Mode</th>
                    <th className="py-2.5 px-3 text-right">Invoice Value (+)</th>
                    <th className="py-2.5 px-3 text-right">Payment Paid (-)</th>
                    <th className="py-2.5 px-3 text-right">Payable Balance</th>
                    <th className="py-2.5 px-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f1f23]">
                  {entries.map((entry, idx) => {
                    const invVal = Number(entry.invoiceValue || 0);
                    const payVal = Number(entry.paymentAmount || 0);
                    const balVal = Number(
                      entry.balance !== undefined ? entry.balance : entry.balanceSnapshot || 0
                    );

                    const dateStr = entry.createdAt
                      ? new Date(entry.createdAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—";

                    return (
                      <tr key={entry._id || idx} className="hover:bg-[#151518] transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                          {dateStr}
                        </td>
                        <td className="py-2.5 px-3">
                          {entry.entryType === "PURCHASE_CREDIT" || invVal > 0 ? (
                            <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-semibold uppercase">
                              Purchase Delivery
                            </span>
                          ) : entry.entryType === "PAYMENT_MADE" || payVal > 0 ? (
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-semibold uppercase">
                              Payment Disbursed
                            </span>
                          ) : (
                            <span className="text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700 px-2 py-0.5 rounded font-semibold uppercase">
                              {entry.entryType || "ADJUSTMENT"}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-zinc-200">
                          {entry.purchaseInvoiceNumber ? (
                            <span className="text-zinc-100 font-semibold">
                              #{entry.purchaseInvoiceNumber}
                            </span>
                          ) : entry.paymentMethod ? (
                            <span className="text-zinc-300 font-medium">
                              {entry.paymentMethod}
                              {entry.referenceId ? ` (${entry.referenceId})` : ""}
                            </span>
                          ) : (
                            <span className="text-zinc-500">Khata Entry</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-400">
                          {invVal > 0 ? `+₹${invVal.toFixed(2)}` : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                          {payVal > 0 ? `-₹${payVal.toFixed(2)}` : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                          ₹{balVal.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-400 text-[11px] max-w-[200px] truncate">
                          {entry.notes || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#141417] border-t border-[#1f1f23] flex items-center justify-between text-xs text-zinc-400">
          <span>Total Transactions: {entries.length}</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-[#18181b] hover:bg-zinc-800 text-zinc-200 text-xs border border-[#27272a] transition-colors cursor-pointer"
          >
            Close Statement
          </button>
        </div>
      </div>
    </div>
  );
}
