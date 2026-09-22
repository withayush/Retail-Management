import React from "react";
import {
  Receipt,
  Calendar,
  User,
  Phone,
  Banknote,
  Smartphone,
  CreditCard,
  BookOpen,
  Edit2,
  Eye,
  FileDown,
} from "lucide-react";
import { downloadInvoicePdf } from "../../../services/sale.api";
import { toast } from "react-hot-toast";

export default function SalesHistoryTable({
  loading,
  sales,
  pagination,
  page,
  setPage,
  onOpenStatusModal,
  onViewDetailModal,
}) {
  return (
    <div className="bg-[#111113] border border-[#1f1f23] rounded-xl overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#1f1f23] bg-[#141417] text-[11px] font-semibold text-zinc-400">
              <th className="py-2.5 px-3.5">Invoice #</th>
              <th className="py-2.5 px-3.5">Date & Time</th>
              <th className="py-2.5 px-3.5">Customer</th>
              <th className="py-2.5 px-3.5 text-right">Subtotal</th>
              <th className="py-2.5 px-3.5 text-right">Discount</th>
              <th className="py-2.5 px-3.5 text-right">Tax</th>
              <th className="py-2.5 px-3.5 text-right">Grand Total</th>
              <th className="py-2.5 px-3.5 text-center">Payment Status</th>
              <th className="py-2.5 px-3.5 text-center">Paid / Due</th>
              <th className="py-2.5 px-3.5">Billed By</th>
              <th className="py-2.5 px-3.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f1f23]">
            {loading ? (
              <tr>
                <td colSpan={11} className="py-14 text-center text-zinc-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />
                    <span className="text-xs">Loading sales records...</span>
                  </div>
                </td>
              </tr>
            ) : sales.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-14 text-center text-zinc-400">
                  <div className="flex flex-col items-center justify-center gap-1.5 max-w-xs mx-auto">
                    <Receipt className="w-8 h-8 opacity-30" />
                    <p className="font-semibold text-zinc-200 text-sm">No Sales Records Found</p>
                    <p className="text-[11px] text-zinc-500">
                      Completed sales invoices and billing records will appear here automatically.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              sales.map((sale) => {
                const formattedDate = new Date(sale.createdAt).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                let statusBadge = "bg-[#141417] text-zinc-400 border-[#27272a]";
                if (sale.paymentStatus === "PAID") {
                  statusBadge = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                } else if (sale.paymentStatus === "PARTIAL") {
                  statusBadge = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                } else if (sale.paymentStatus === "PENDING") {
                  statusBadge = "bg-red-500/10 text-red-400 border-red-500/20";
                } else if (sale.paymentStatus === "CANCELLED") {
                  statusBadge = "bg-[#141417] text-zinc-500 border-[#27272a]";
                }

                let ModeIcon = Banknote;
                if (sale.paymentMode === "UPI") ModeIcon = Smartphone;
                else if (sale.paymentMode === "CARD") ModeIcon = CreditCard;
                else if (sale.paymentMode === "CREDIT_UDHAR") ModeIcon = BookOpen;

                return (
                  <tr key={sale._id} className="hover:bg-zinc-800/30 transition-colors">
                    {/* Invoice # */}
                    <td className="py-2.5 px-3.5 align-middle font-mono font-semibold text-white">
                      <span className="flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-zinc-400" />
                        {sale.invoiceNumber}
                      </span>
                    </td>

                    {/* Date & Time */}
                    <td className="py-2.5 px-3.5 align-middle whitespace-nowrap font-mono text-[11px] text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-zinc-500" />
                        {formattedDate}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="py-2.5 px-3.5 align-middle">
                      <div className="flex flex-col">
                        <span className="font-medium text-zinc-200 flex items-center gap-1.5">
                          <User className="w-3 h-3 text-zinc-500" />
                          {sale.customerName || "Walk-in Customer"}
                        </span>
                        {sale.customerPhone && (
                          <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5" />
                            {sale.customerPhone}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Subtotal */}
                    <td className="py-2.5 px-3.5 text-right align-middle font-mono text-zinc-400">
                      ₹{(sale.subtotal || 0).toFixed(2)}
                    </td>

                    {/* Discount */}
                    <td className="py-2.5 px-3.5 text-right align-middle font-mono text-emerald-400">
                      {sale.discount > 0 ? `-₹${sale.discount.toFixed(2)}` : "—"}
                    </td>

                    {/* Tax */}
                    <td className="py-2.5 px-3.5 text-right align-middle font-mono text-zinc-400">
                      {sale.tax > 0 ? `+₹${sale.tax.toFixed(2)}` : "—"}
                    </td>

                    {/* Grand Total */}
                    <td className="py-2.5 px-3.5 text-right align-middle font-mono font-bold text-white">
                      ₹{(sale.total || 0).toFixed(2)}
                    </td>

                    {/* Payment Status & Mode */}
                    <td className="py-2.5 px-3.5 text-center align-middle">
                      <div className="inline-flex flex-col items-center gap-1">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${statusBadge}`}
                        >
                          {sale.paymentStatus}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-400 uppercase flex items-center gap-1 bg-[#141417] px-1.5 py-0.2 rounded border border-[#27272a]">
                          <ModeIcon className="w-2.5 h-2.5" />
                          {sale.paymentMode}
                        </span>
                      </div>
                    </td>

                    {/* Paid / Due Breakdown */}
                    <td className="py-2.5 px-3.5 text-center align-middle font-mono">
                      <div className="flex flex-col items-center text-[11px]">
                        <span className="text-emerald-400 font-medium">
                          Paid: ₹{(sale.paidAmount || 0).toFixed(2)}
                        </span>
                        {sale.dueAmount > 0 ? (
                          <span className="text-red-400 font-semibold">
                            Due: ₹{sale.dueAmount.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-zinc-500 text-[10px]">Settled</span>
                        )}
                      </div>
                    </td>

                    {/* Billed By */}
                    <td className="py-2.5 px-3.5 align-middle text-xs text-zinc-400 whitespace-nowrap">
                      {sale.createdByName || "Staff"}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3.5 text-center align-middle">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onViewDetailModal && onViewDetailModal(sale)}
                          className="px-2 py-1 rounded-lg border border-[#27272a] bg-[#141417] hover:bg-zinc-800 text-[11px] font-medium text-zinc-300 flex items-center gap-1 cursor-pointer"
                          title="View Items & Snapshot Details"
                        >
                          <Eye className="w-3 h-3 text-zinc-400" />
                          <span>Items</span>
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await downloadInvoicePdf(sale._id || sale.id, sale.invoiceNumber);
                              toast.success(`PDF Invoice #${sale.invoiceNumber} downloaded! 📄`);
                            } catch (err) {
                              console.error(err);
                              toast.error("Failed to download PDF.");
                            }
                          }}
                          className="px-2 py-1 rounded-lg border border-[#27272a] bg-[#141417] hover:bg-zinc-800 text-[11px] font-medium text-zinc-300 flex items-center gap-1 cursor-pointer"
                          title="Download PDF Bill"
                        >
                          <FileDown className="w-3 h-3" />
                          <span>PDF</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenStatusModal(sale)}
                          className="px-2 py-1 rounded-lg border border-[#27272a] bg-[#141417] hover:bg-zinc-800 text-[11px] font-medium text-zinc-300 flex items-center gap-1 cursor-pointer"
                          title="Update Payment / Settle Balance"
                        >
                          <Edit2 className="w-3 h-3 text-zinc-400" />
                          <span>Status</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {pagination?.totalPages > 1 && (
        <div className="flex items-center justify-between p-3.5 border-t border-[#1f1f23] bg-[#141417]">
          <span className="text-xs text-zinc-400">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total sales)
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="px-3 py-1 rounded-lg border border-[#27272a] bg-[#111113] text-xs font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded-lg border border-[#27272a] bg-[#111113] text-xs font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
