import React from "react";
import { BookOpen, Plus, Phone, AlertCircle, CheckCircle, Clock, Pencil, History, UserCheck } from "lucide-react";

export default function CustomersTable({
  loading,
  customers = [],
  onViewProfile,
  onViewLedger,
  onViewPaymentHistory,
  onSettlePayment,
  onEditCustomer,
}) {
  if (loading) {
    return (
      <div className="p-12 rounded-xl bg-[#111113] border border-[#1f1f23] text-center text-zinc-500 flex flex-col items-center justify-center gap-3">
        <div className="w-6 h-6 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />
        <span className="text-xs font-medium">Loading customers & khata ledgers...</span>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="p-16 rounded-xl bg-[#111113] border border-[#1f1f23] text-center text-zinc-500 space-y-2">
        <BookOpen className="w-10 h-10 mx-auto text-zinc-600" />
        <p className="font-semibold text-zinc-200 text-sm">No Customers Found</p>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
          No customer profiles match your search criteria. Add a new customer to start maintaining their Khata.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-[#1f1f23] rounded-xl overflow-hidden bg-[#111113]">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="bg-[#141417] text-zinc-400 uppercase text-[10px] font-semibold border-b border-[#1f1f23] tracking-wider">
            <tr>
              <th className="py-3 px-4">Customer Name</th>
              <th className="py-3 px-4">Mobile Phone</th>
              <th className="py-3 px-4 text-right">Outstanding Debt (Khata)</th>
              <th className="py-3 px-4 text-right">Credit Limit</th>
              <th className="py-3 px-4">Last Activity</th>
              <th className="py-3 px-4 text-right">Actions</th>
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
                <tr key={custId} className="hover:bg-[#151518] transition-colors group">
                  <td className="py-3 px-4">
                    <div className="space-y-0.5">
                      <button
                        onClick={() => onViewProfile && onViewProfile(c)}
                        className="font-semibold text-xs text-zinc-100 group-hover:text-amber-400 transition-colors text-left flex items-center gap-1.5 cursor-pointer hover:underline"
                        title="Open 360° Customer Profile (T36)"
                      >
                        <span>{c.name}</span>
                        <span className="text-[10px] text-zinc-600 group-hover:text-amber-500/70 font-mono">↗</span>
                      </button>
                      {c.address && (
                        <p className="text-[11px] text-zinc-500 truncate max-w-[220px]">{c.address}</p>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 font-mono text-zinc-300">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-zinc-500" />
                      {c.phone || "—"}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    {debt > 0 ? (
                      <div className="flex flex-col items-end">
                        <span className="font-semibold font-mono text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          ₹{debt.toFixed(2)}
                        </span>
                        {isLimitExceeded && (
                          <span className="text-[9px] text-rose-400 flex items-center gap-0.5 mt-0.5 font-medium">
                            <AlertCircle className="w-2.5 h-2.5" /> Limit Exceeded
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-400 font-mono text-xs flex items-center justify-end gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-400" /> ₹0.00
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right font-mono text-zinc-400">
                    {limit > 0 ? `₹${limit.toFixed(2)}` : <span className="text-zinc-600">Unlimited</span>}
                  </td>

                  <td className="py-3 px-4 text-zinc-400 text-[11px] font-mono whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      {dateDisplay}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {onViewProfile && (
                        <button
                          onClick={() => onViewProfile(c)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#18181b] hover:bg-zinc-800 text-amber-400 hover:text-amber-300 border border-[#27272a] text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                          title="Open 360° Customer Profile (T36)"
                        >
                          <UserCheck className="w-3 h-3 text-amber-400" />
                          <span>360° Profile</span>
                        </button>
                      )}

                      {onEditCustomer && (
                        <button
                          onClick={() => onEditCustomer(c)}
                          className="p-1.5 rounded-lg bg-[#18181b] hover:bg-zinc-800 text-zinc-400 hover:text-white border border-[#27272a] transition-colors cursor-pointer"
                          title="Edit Customer Profile"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => onViewLedger(c)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#18181b] hover:bg-zinc-800 text-zinc-200 hover:text-white border border-[#27272a] text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                        title="View Full Khata Statement"
                      >
                        <BookOpen className="w-3 h-3 text-amber-400" />
                        <span>Ledger</span>
                      </button>

                      {onViewPaymentHistory && (
                        <button
                          onClick={() => onViewPaymentHistory(c)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#18181b] hover:bg-zinc-800 text-zinc-200 hover:text-white border border-[#27272a] text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                          title="View Repayment History (T35)"
                        >
                          <History className="w-3 h-3 text-emerald-400" />
                          <span>Payments</span>
                        </button>
                      )}

                      {debt > 0 && (
                        <button
                          onClick={() => onSettlePayment(c)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
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

