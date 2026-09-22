import React from "react";
import {
  History,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
} from "lucide-react";

export default function LedgerTable({
  loading,
  ledgerEntries,
  ledgerPagination,
  ledgerPage,
  setLedgerPage,
}) {
  return (
    <div className="bg-[#111113] border border-[#1f1f23] rounded-xl shadow-xs overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#1f1f23] bg-[#141417] text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              <th className="py-3 px-4">Date & Time</th>
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4 text-center">Movement Type</th>
              <th className="py-3 px-4 text-center">Qty Change</th>
              <th className="py-3 px-4 text-center">Balance After</th>
              <th className="py-3 px-4">Reason & Ref</th>
              <th className="py-3 px-4">User / Staff</th>
              <th className="py-3 px-4">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f1f23]">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-zinc-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-7 h-7 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />
                    <span className="text-xs">Loading ledger entries...</span>
                  </div>
                </td>
              </tr>
            ) : ledgerEntries.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-zinc-500">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                    <History className="w-8 h-8 opacity-40 text-zinc-400" />
                    <p className="font-semibold text-zinc-200 text-xs">No Ledger Entries Found</p>
                    <p className="text-[11px] text-zinc-500">
                      No stock movement matches your active filter criteria.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              ledgerEntries.map((log) => {
                const isPositive = log.qtyChange > 0;
                const isNegative = log.qtyChange < 0;

                return (
                  <tr key={log._id || log.id} className="hover:bg-[#151518] transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-4 text-zinc-400 font-mono">
                      <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                      <div className="text-[10px] text-zinc-500">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>

                    {/* Product */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-zinc-200 text-xs">{log.productName || "Item"}</div>
                      <div className="text-[10px] font-mono text-zinc-500">{log.sku || "No SKU"}</div>
                    </td>

                    {/* Movement Type Badge */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded ${
                          log.movementType === "IN"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : log.movementType === "OUT"
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}
                      >
                        {log.movementType === "IN" ? (
                          <ArrowDownLeft className="w-3 h-3" />
                        ) : log.movementType === "OUT" ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <SlidersHorizontal className="w-3 h-3" />
                        )}
                        {log.movementType}
                      </span>
                    </td>

                    {/* Qty Change */}
                    <td className="py-3 px-4 text-center font-mono font-semibold">
                      <span
                        className={
                          isPositive
                            ? "text-emerald-400"
                            : isNegative
                            ? "text-red-400"
                            : "text-zinc-300"
                        }
                      >
                        {isPositive ? `+${log.qtyChange}` : log.qtyChange}
                      </span>
                    </td>

                    {/* Balance After */}
                    <td className="py-3 px-4 text-center font-mono font-bold text-white">
                      {log.balanceAfter ?? log.newStock ?? "—"}
                    </td>

                    {/* Reason & Reference */}
                    <td className="py-3 px-4 text-zinc-300">
                      <div className="font-medium text-xs">{log.reason || "Manual Operation"}</div>
                      {log.referenceNumber && (
                        <div className="text-[10px] font-mono text-zinc-500">Ref: #{log.referenceNumber}</div>
                      )}
                    </td>

                    {/* Actor */}
                    <td className="py-3 px-4 text-zinc-400">
                      {log.performedByName || log.actor || "System"}
                    </td>

                    {/* Notes */}
                    <td className="py-3 px-4 text-zinc-500 text-[11px] max-w-[150px] truncate">
                      {log.notes || "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 bg-[#141417] border-t border-[#1f1f23] flex items-center justify-between gap-3 text-xs text-zinc-400">
        <span>Total records: {ledgerPagination?.total || ledgerEntries.length}</span>
        <div className="flex items-center gap-2">
          <span>Page {ledgerPage} of {ledgerPagination?.totalPages || 1}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setLedgerPage(Math.max(1, ledgerPage - 1))}
              disabled={ledgerPage <= 1 || loading}
              className="px-2 py-1 rounded bg-[#111113] border border-[#27272a] text-zinc-300 disabled:opacity-40 hover:bg-zinc-800 cursor-pointer disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              onClick={() => setLedgerPage(ledgerPage + 1)}
              disabled={ledgerPage >= (ledgerPagination?.totalPages || 1) || loading}
              className="px-2 py-1 rounded bg-[#111113] border border-[#27272a] text-zinc-300 disabled:opacity-40 hover:bg-zinc-800 cursor-pointer disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
