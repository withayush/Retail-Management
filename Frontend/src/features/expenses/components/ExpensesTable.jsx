import React, { useState } from "react";
import {
  Receipt,
  FileText,
  Eye,
  Edit2,
  Archive,
  Tag,
  Calendar,
  CreditCard,
  Building,
  DollarSign,
  Download,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { ICON_MAP } from "./CreateExpenseCategoryModal";

export default function ExpensesTable({
  expenses = [],
  pagination = null,
  loading = false,
  filters = {},
  onPageChange,
  onLimitChange,
  onRecordNewExpense,
  onResetFilters,
  onEditExpense,
  onArchiveExpense,
}) {
  const [previewAttachment, setPreviewAttachment] = useState(null);

  const hasActiveFilters = Boolean(
    filters.search?.trim() ||
    (filters.month && filters.month !== "ALL") ||
    (filters.categoryId && filters.categoryId !== "ALL") ||
    (filters.paymentMethod && filters.paymentMethod !== "ALL") ||
    filters.startDate ||
    filters.endDate
  );

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-9 h-9 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-zinc-400 font-medium">Fetching expense ledger and statements...</p>
      </div>
    );
  }

  if (expenses.length === 0) {
    if (hasActiveFilters) {
      return (
        <div className="py-20 px-6 text-center border border-dashed border-white/[0.08] rounded-2xl bg-zinc-950/30 m-4 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-sm">
            <Receipt className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h4 className="text-sm font-semibold text-white">No Matching Expenses Found</h4>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              No transactions match your current search query, category, or selected date range.
            </p>
          </div>
          {onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="h-9 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.03] border border-white/10 text-xs font-medium text-zinc-200 hover:text-white transition-all cursor-pointer inline-flex items-center gap-2 shadow-sm"
            >
              <span>Clear Filter Criteria</span>
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="py-16 px-6 text-center border border-white/[0.08] rounded-2xl bg-gradient-to-b from-zinc-900/40 to-zinc-950/60 m-4 relative overflow-hidden shadow-inner">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <Receipt className="w-7 h-7" />
          </div>

          <div>
            <h4 className="text-base font-bold text-white tracking-tight">No Expenses Recorded Yet</h4>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Start tracking overheads like rent, electricity bills, packaging, tea/refreshments, and logistics to keep accurate profit margins and tax books.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onRecordNewExpense}
              className="h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-xs font-semibold text-zinc-950 inline-flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <Receipt className="w-4 h-4 stroke-[2.5]" />
              <span>Record First Expense</span>
            </button>
          </div>

          {/* Quick Category Hints */}
          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-center gap-2 flex-wrap text-[11px] text-zinc-500">
            <span className="font-medium text-zinc-400">Popular Headings:</span>
            <span className="px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-zinc-400">🏢 Store Rent</span>
            <span className="px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-zinc-400">⚡ Electricity</span>
            <span className="px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-zinc-400">📦 Packaging</span>
            <span className="px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-zinc-400">☕ Tea & Snacks</span>
          </div>
        </div>
      </div>
    );
  }

  // Calculate sum of visible page records
  const pageTotal = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.08] bg-zinc-950/40 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Expense #</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Payee & Purpose</th>
              <th className="py-3 px-4">Payment Method</th>
              <th className="py-3 px-4 text-right">Amount (₹)</th>
              <th className="py-3 px-4 text-center">Invoice Proof</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] text-xs text-zinc-300">
            {expenses.map((exp) => {
              const IconComp = ICON_MAP[exp.categoryIcon] || Tag;
              const color = exp.categoryColor || "#8E8E93";
              const formattedDate = new Date(exp.expenseDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              return (
                <tr
                  key={exp._id}
                  className="hover:bg-white/[0.03] transition-colors group"
                >
                  {/* Expense Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-white font-medium">
                    {formattedDate}
                  </td>

                  {/* Expense Number */}
                  <td className="py-3.5 px-4 font-mono font-semibold text-sky-400">
                    {exp.expenseNumber}
                  </td>

                  {/* Category Badge */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border shadow-xs"
                        style={{
                          backgroundColor: `${color}18`,
                          borderColor: `${color}35`,
                        }}
                      >
                        <IconComp className="w-3.5 h-3.5" style={{ color }} />
                      </div>
                      <span className="font-semibold text-white">{exp.categoryName}</span>
                    </div>
                  </td>

                  {/* Payee & Description */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div>
                      <p className="font-semibold text-white truncate">
                        {exp.payee || "General Store Overhead"}
                      </p>
                      {exp.description && (
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5">{exp.description}</p>
                      )}
                      {exp.referenceNumber && (
                        <p className="text-[10px] text-sky-400/90 font-mono mt-0.5">
                          Ref: {exp.referenceNumber}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Payment Method */}
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.06] text-zinc-300 border border-white/[0.08]">
                      {exp.paymentMethod}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <span className="font-bold text-white text-sm font-mono">
                      ₹{Number(exp.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                    {exp.taxAmount > 0 && (
                      <span className="block text-[10px] font-normal text-zinc-400">
                        Incl. ₹{exp.taxAmount} GST
                      </span>
                    )}
                  </td>

                  {/* Receipt Attachment Proof */}
                  <td className="py-3.5 px-4 text-center">
                    {exp.attachment?.url ? (
                      <button
                        type="button"
                        onClick={() => setPreviewAttachment(exp.attachment)}
                        className="h-7 px-2.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-400 transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                        title={exp.attachment.fileName || "View Attachment Proof"}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-medium">View</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-zinc-600">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEditExpense(exp)}
                        className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                        title="Edit Expense"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onArchiveExpense(exp)}
                        className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-rose-500/15 border border-white/[0.06] hover:border-rose-500/30 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer flex items-center justify-center"
                        title="Archive Expense"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer & Server-Side Pagination Bar */}
      <div className="px-5 py-3.5 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-950/40 text-xs text-zinc-400">
        {/* Left: Visible Records & Page Sum */}
        <div className="flex items-center gap-3">
          <span>
            Showing <strong className="text-white font-semibold">{expenses.length}</strong> of{" "}
            <strong className="text-white font-semibold">{pagination?.totalRecords || expenses.length}</strong> records
          </span>
          <span className="hidden sm:inline-block text-zinc-600">•</span>
          <span className="hidden sm:inline-block">
            Page Total: <strong className="text-emerald-400 font-mono font-semibold">₹{pageTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
          </span>
        </div>

        {/* Right: Pagination Controls */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!pagination.hasPrevPage}
              onClick={() => onPageChange(pagination.page - 1)}
              className="h-8 px-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            <span className="px-2 font-medium text-zinc-200">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={() => onPageChange(pagination.page + 1)}
              className="h-8 px-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Attachment Preview Modal */}
      {previewAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#1C1C1E] border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-modal-pop flex flex-col max-h-[90vh]">
            <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-[#64D2FF]" />
                <span className="text-sm font-semibold text-white truncate">
                  {previewAttachment.fileName || "Expense Receipt"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewAttachment.url}
                  download={previewAttachment.fileName || "receipt"}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer flex items-center gap-1 text-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full</span>
                </a>
                <button
                  onClick={() => setPreviewAttachment(null)}
                  className="p-1.5 rounded-full text-[#8E8E93] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-black/50">
              {previewAttachment.url?.startsWith("data:image") ||
              previewAttachment.fileType?.startsWith("image/") ? (
                <img
                  src={previewAttachment.url}
                  alt={previewAttachment.fileName}
                  className="max-h-[70vh] max-w-full object-contain rounded-lg border border-white/10 shadow-lg"
                />
              ) : (
                <iframe
                  src={previewAttachment.url}
                  title="Receipt Preview"
                  className="w-full h-[70vh] rounded-lg border border-white/10"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
