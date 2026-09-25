import React, { useState, useEffect } from "react";
import { X, History, Plus, Calendar, Filter, Wallet, ArrowDownLeft, CreditCard, Banknote, QrCode } from "lucide-react";
import { getCustomerPaymentHistory } from "../../../services/customer.api";

export default function CustomerPaymentHistoryModal({ isOpen, onClose, customer, onSettlePayment, onViewProfile }) {
  const [paymentsData, setPaymentsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [methodFilter, setMethodFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const loadPaymentHistory = () => {
    if (!customer?.id && !customer?._id) return;
    const custId = customer.id || customer._id;
    setLoading(true);
    getCustomerPaymentHistory(custId, {
      method: methodFilter || undefined,
      from: fromDate || undefined,
      to: toDate || undefined,
    })
      .then((res) => setPaymentsData(res.data || res))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen && (customer?.id || customer?._id)) {
      loadPaymentHistory();
    }
  }, [isOpen, customer, methodFilter, fromDate, toDate]);

  if (!isOpen || !customer) return null;

  const summary = paymentsData?.summary || {};
  const payments = paymentsData?.payments || [];
  const custInfo = paymentsData?.customer || customer;

  const getMethodIcon = (method) => {
    const m = (method || "").toUpperCase();
    if (m === "UPI") return <QrCode className="w-3.5 h-3.5 text-indigo-400" />;
    if (m === "CARD") return <CreditCard className="w-3.5 h-3.5 text-sky-400" />;
    return <Banknote className="w-3.5 h-3.5 text-emerald-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#111113] border border-[#27272a] rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#1f1f23] bg-[#141417] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm md:text-base font-bold text-white">{custInfo.name}</h2>
                <span className="text-xs bg-[#18181b] text-zinc-300 font-mono px-2 py-0.5 rounded border border-[#27272a]">
                  {custInfo.phone || "No phone"}
                </span>
              </div>
              <p className="text-xs text-zinc-400">Credit Payment History & Repayment Settlements (T35)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onViewProfile && (
              <button
                onClick={() => {
                  onClose();
                  onViewProfile(custInfo);
                }}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer border border-zinc-700"
                title="Open Customer 360° Profile (T36)"
              >
                360° Profile
              </button>
            )}
            {(custInfo.currentBalance || 0) > 0 && (
              <button
                onClick={() => {
                  onClose();
                  onSettlePayment(custInfo);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Record Payment
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

        {/* Financial KPI Summary Bar */}
        <div className="p-4 bg-[#0c0c0e] border-b border-[#1f1f23] grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-[#141417] border border-[#27272a] space-y-1">
            <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" /> Total Repayments Made
            </span>
            <p className="text-base font-bold font-mono text-emerald-400">
              ₹{Number(summary.totalAmountPaid || 0).toFixed(2)}
            </p>
            <span className="text-[10px] text-zinc-500 font-mono">
              {summary.totalPaymentsCount || 0} transaction{summary.totalPaymentsCount === 1 ? "" : "s"}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#141417] border border-[#27272a] space-y-1">
            <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-indigo-400" /> Average Settlement
            </span>
            <p className="text-base font-bold font-mono text-zinc-200">
              ₹{Number(summary.averagePaymentAmount || 0).toFixed(2)}
            </p>
            <span className="text-[10px] text-zinc-500">per repayment event</span>
          </div>

          <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/30 space-y-1">
            <span className="text-[11px] text-amber-300 font-medium flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" /> Remaining Outstanding Debt
            </span>
            <p className="text-base font-bold font-mono text-amber-400">
              ₹{Number(custInfo.currentBalance || 0).toFixed(2)}
            </p>
            <span className="text-[10px] text-amber-400/70">
              {custInfo.currentBalance > 0 ? "Pending to clear" : "All debt settled"}
            </span>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="p-3 bg-[#141417] border-b border-[#1f1f23] flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#18181b] border border-[#27272a] rounded-xl px-2.5 py-1 text-xs text-zinc-300">
              <Filter className="w-3 h-3 text-zinc-400" />
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="">All Payment Modes</option>
                <option value="CASH">Cash Only</option>
                <option value="UPI">UPI Only</option>
                <option value="CARD">Card Only</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-[#18181b] border border-[#27272a] rounded-xl px-2.5 py-1 text-xs text-zinc-300">
              <Calendar className="w-3 h-3 text-zinc-400" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                placeholder="From Date"
                className="bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer font-mono"
              />
              <span className="text-zinc-500">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                placeholder="To Date"
                className="bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer font-mono"
              />
            </div>

            {(methodFilter || fromDate || toDate) && (
              <button
                onClick={() => {
                  setMethodFilter("");
                  setFromDate("");
                  setToDate("");
                }}
                className="text-[11px] text-amber-400 hover:underline px-1.5 py-0.5 cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>

          <span className="text-xs text-zinc-500 font-mono">
            Showing {payments.length} payment{payments.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* Payments History List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="py-16 text-center text-xs text-zinc-500 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />
              <span>Fetching payment history...</span>
            </div>
          ) : payments.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 space-y-2">
              <History className="w-8 h-8 mx-auto text-zinc-600" />
              <p className="text-xs font-medium text-zinc-300">No Repayments Recorded</p>
              <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                No payment settlements match the selected filter criteria. Payments recorded via POS or Khata Settle will appear here.
              </p>
            </div>
          ) : (
            <div className="border border-[#1f1f23] rounded-xl overflow-hidden bg-[#141417]">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-[#18181b] text-zinc-400 uppercase text-[10px] font-semibold border-b border-[#1f1f23]">
                  <tr>
                    <th className="p-3">Payment Date</th>
                    <th className="p-3">Payment Mode</th>
                    <th className="p-3 text-right">Amount Repaid</th>
                    <th className="p-3 text-right">Balance After</th>
                    <th className="p-3">Reference / Notes</th>
                    <th className="p-3 text-right">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f1f23]">
                  {payments.map((p) => {
                    const dateObj = new Date(p.date || p.createdAt);
                    const formattedDate = !isNaN(dateObj.getTime())
                      ? dateObj.toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }) +
                        " " +
                        dateObj.toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "—";

                    return (
                      <tr key={p._id || p.paymentId} className="hover:bg-[#18181c] transition-colors">
                        <td className="p-3 font-mono text-[11px] text-zinc-300">{formattedDate}</td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-200 border border-zinc-700 text-[11px] font-semibold">
                            {getMethodIcon(p.paymentMethod)}
                            {p.paymentMethod || "CASH"}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-400 text-xs">
                          -₹{Number(p.amount || 0).toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-mono text-zinc-400 text-xs">
                          ₹{Number(p.balanceAfter ?? p.balanceSnapshot ?? 0).toFixed(2)}
                        </td>
                        <td className="p-3 text-zinc-400 max-w-[200px]">
                          <div className="space-y-0.5">
                            {p.invoiceNumber && (
                              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20 mr-1.5">
                                #{p.invoiceNumber}
                              </span>
                            )}
                            <span className="text-[11px] truncate block">{p.notes || "Repayment settlement"}</span>
                          </div>
                        </td>
                        <td className="p-3 text-right text-zinc-500 text-[11px]">{p.recordedBy || "Cashier"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#141417] border-t border-[#1f1f23] flex items-center justify-between text-xs text-zinc-500">
          <span>T35 Customer Credit Payment History • Append-Only Repayment Log</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
