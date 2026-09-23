import React from "react";
import { BookOpen, Plus, Phone, AlertCircle, CheckCircle, Clock } from "lucide-react";

export default function CustomersTable({ loading, customers = [], onViewLedger, onSettlePayment }) {
  if (loading) {
    return (
      <div className="p-12 rounded-2xl bg-[#111113] border border-[#1f1f23] text-center text-zinc-500 flex flex-col items-center justify-center gap-3">
        <div className="w-7 h-7 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />
        <span className="text-xs font-medium">Loading customers & khata ledgers...</span>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="p-16 rounded-2xl bg-[#111113] border border-[#1f1f23] text-center text-zinc-500 space-y-2">
        <BookOpen className="w-10 h-10 mx-auto text-zinc-600" />
        <p className="font-semibold text-zinc-200 text-sm">No Customers Found</p>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
          No customer profiles match your search criteria. Add a new customer to start maintaining their Khata.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-[#1f1f23] rounded-2xl overflow-hidden bg-[#111113] shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="bg-[#141417] text-zinc-400 uppercase text-[10px] font-semibold border-b border-[#1f1f23]">
            <tr>
              <th className="p-3.5">Customer Name</th>
              <th className="p-3.5">Mobile Phone</th>
              <th className="p-3.5 text-right">Outstanding Debt (Khata)</th>
              <th className="p-3.5 text-right">Credit Limit</th>
              <th className="p-3.5">Last Activity</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f1f23]">
            {customers.map((c) => {
              const custId = c.id || c._id;
              const debt = Number(c.currentBalance || c.outstandingBalance || 0);
              const limit = Number(c.creditLimit || 0);
              const isLimitExceeded = limit > 0 && debt > limit;

              const lastDate = c.lastPaymentDate || c.lastPurchaseDate || c.updatedAt;
              const dateDisplay = lastDate
                ? new Date(lastDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—";

              return (
                <tr key={custId} className="hover:bg-[#141418] transition-colors group">
                  <td className="p-3.5">
                    <div className="space-y-0.5">
                      <span className="font-bold text-xs text-zinc-100 group-hover:text-white transition-colors">
                        {c.name}
                      </span>
                      {c.address && (
                        <p className="text-[11px] text-zinc-500 truncate max-w-[200px]">{c.address}</p>
                      )}
                    </div>
                  </td>

                  <td className="p-3.5 font-mono text-zinc-300">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-zinc-500" />
                      {c.phone}
                    </span>
                  </td>

                  <td className="p-3.5 text-right">
                    {debt > 0 ? (
                      <div className="flex flex-col items-end">
                        <span className="font-bold font-mono text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                          ₹{debt.toFixed(2)}
                        </span>
                        {isLimitExceeded && (
                          <span className="text-[9px] text-red-400 flex items-center gap-0.5 mt-0.5 font-medium">
                            <AlertCircle className="w-2.5 h-2.5" /> Limit Exceeded
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-emerald-400 font-mono text-xs flex items-center justify-end gap-1">
                        <CheckCircle className="w-3 h-3" /> ₹0.00
                      </span>
                    )}
                  </td>

                  <td className="p-3.5 text-right font-mono text-zinc-400">
                    {limit > 0 ? `₹${limit.toFixed(2)}` : <span className="text-zinc-600">Unlimited</span>}
                  </td>

                  <td className="p-3.5 text-zinc-400 text-[11px] font-mono whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      {dateDisplay}
                    </span>
                  </td>

                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onViewLedger(c)}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                        title="View Full Khata Statement"
                      >
                        <BookOpen className="w-3 h-3 text-amber-400" />
                        <span>Ledger</span>
                      </button>

                      {debt > 0 && (
                        <button
                          onClick={() => onSettlePayment(c)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                          title="Record Payment / Jama"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Settle</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
