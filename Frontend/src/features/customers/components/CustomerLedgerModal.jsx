import React, { useState, useEffect } from "react";
import { X, BookOpen, Plus, Phone, Mail, MapPin, Wallet, CreditCard, Clock, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { getCustomerLedger } from "../../../services/customer.api";

export default function CustomerLedgerModal({ isOpen, onClose, customer, onSettlePayment }) {
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && (customer?.id || customer?._id)) {
      const custId = customer.id || customer._id;
      setLoading(true);
      getCustomerLedger(custId)
        .then((res) => setLedgerData(res.data || res))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, customer]);

  if (!isOpen || !customer) return null;

  const summary = ledgerData?.summary || {};
  const entries = ledgerData?.entries || [];
  const custInfo = ledgerData?.customer || customer;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#111113] border border-[#27272a] rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#1f1f23] bg-[#141417] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">{custInfo.name}</h2>
                <span className="text-xs bg-zinc-800 text-zinc-300 font-mono px-2 py-0.5 rounded border border-zinc-700">
                  {custInfo.phone}
                </span>
              </div>
              <p className="text-xs text-zinc-400">Customer Khata & Credit Transaction Statement (T29)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(custInfo.currentBalance || 0) > 0 && (
              <button
                onClick={() => onSettlePayment(custInfo)}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Settle Khata / Jama
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

        {/* Khata Financial Summary Bar */}
        <div className="p-4 bg-[#0c0c0e] border-b border-[#1f1f23] grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-[#141417] border border-[#27272a] space-y-1">
            <span className="text-[11px] text-zinc-500 font-medium flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-red-400" /> Total Credit / Udhaar Sales
            </span>
            <p className="text-base font-bold font-mono text-red-400">
              ₹{Number(summary.totalCreditSales || 0).toFixed(2)}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#141417] border border-[#27272a] space-y-1">
            <span className="text-[11px] text-zinc-500 font-medium flex items-center gap-1">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" /> Total Payments / Jama Received
            </span>
            <p className="text-base font-bold font-mono text-emerald-400">
              ₹{Number(summary.totalPaymentsReceived || 0).toFixed(2)}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/30 space-y-1">
            <span className="text-[11px] text-amber-300 font-medium flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" /> Current Net Outstanding (Due)
            </span>
            <p className="text-base font-bold font-mono text-amber-400">
              ₹{Number(custInfo.currentBalance || summary.currentOutstanding || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Ledger Entries Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="py-16 text-center text-xs text-zinc-500 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />
              <span>Fetching complete audit statement...</span>
            </div>
          ) : entries.length === 0 ? (
            <div className="py-16 text-center text-xs text-zinc-500 space-y-2">
              <BookOpen className="w-8 h-8 mx-auto text-zinc-600" />
              <p className="font-semibold text-zinc-300 text-sm">No Ledger Transactions Yet</p>
              <p className="text-zinc-500 text-xs max-w-sm mx-auto">
                Transactions will appear here automatically when this customer makes credit purchases at POS or settles debt.
              </p>
            </div>
          ) : (
            <div className="border border-[#1f1f23] rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-[#141417] text-zinc-400 uppercase text-[10px] font-semibold border-b border-[#1f1f23]">
                  <tr>
                    <th className="p-3">Date & Time</th>
                    <th className="p-3">Transaction Type</th>
                    <th className="p-3">Ref / Invoice</th>
                    <th className="p-3 text-right">Debit (+)</th>
                    <th className="p-3 text-right">Credit (-)</th>
                    <th className="p-3 text-right">Balance Snapshot</th>
                    <th className="p-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f1f23]">
                  {entries.map((entry, idx) => {
                    const isDebit = (entry.debitAmount || 0) > 0;
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
                      <tr key={entry._id || idx} className="hover:bg-[#141418] transition-colors">
                        <td className="p-3 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                          {dateStr}
                        </td>
                        <td className="p-3">
                          {isDebit ? (
                            <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-bold uppercase">
                              Credit Sale
                            </span>
                          ) : (
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase">
                              Payment Received
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-zinc-200">
                          {entry.invoiceNumber ? (
                            <span className="text-zinc-100 font-semibold">{entry.invoiceNumber}</span>
                          ) : (
                            <span className="text-zinc-500">Khata Settlement</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-red-400">
                          {isDebit ? `+₹${entry.debitAmount.toFixed(2)}` : "—"}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-400">
                          {!isDebit && entry.creditAmount > 0 ? `-₹${entry.creditAmount.toFixed(2)}` : "—"}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-white">
                          ₹{Number(entry.balanceSnapshot || 0).toFixed(2)}
                        </td>
                        <td className="p-3 text-zinc-400 text-[11px] max-w-[200px] truncate">
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
        <div className="p-3 bg-[#141417] border-t border-[#1f1f23] flex items-center justify-between text-xs text-zinc-500">
          <span>Total Transactions: {entries.length}</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs transition-colors cursor-pointer"
          >
            Close Statement
          </button>
        </div>
      </div>
    </div>
  );
}
