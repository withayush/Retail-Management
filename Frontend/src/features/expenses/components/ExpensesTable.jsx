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
  onPageChange,
  onLimitChange,
  onEditExpense,
  onArchiveExpense,
}) {
  const [previewAttachment, setPreviewAttachment] = useState(null);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-2 border-[#30D158] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-[#8E8E93]">Loading expense records & statements...</p>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="py-16 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01] m-4">
        <Receipt className="w-10 h-10 text-[#8E8E93]/40 mx-auto mb-3" />
        <h4 className="text-sm font-semibold text-white">No Expense Transactions Found</h4>
        <p className="text-xs text-[#8E8E93] max-w-sm mx-auto mt-1">
          No expenses match the selected month, category, or search filters.
        </p>
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
            <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider">
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
          <tbody className="divide-y divide-white/5 text-xs text-[#D2D2D7]">
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
                  <td className="py-3.5 px-4 font-mono font-semibold text-[#64D2FF]">
                    {exp.expenseNumber}
                  </td>

                  {/* Category Badge */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border shadow-xs"
                        style={{
                          backgroundColor: `${color}20`,
                          borderColor: `${color}40`,
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
                        <p className="text-[11px] text-[#8E8E93] truncate">{exp.description}</p>
                      )}
                      {exp.referenceNumber && (
                        <p className="text-[10px] text-[#64D2FF] font-mono mt-0.5">
                          Ref: {exp.referenceNumber}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Payment Method */}
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white border border-white/10">
                      {exp.paymentMethod}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className="py-3.5 px-4 text-right font-bold text-white whitespace-nowrap">
                    ₹{Number(exp.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    {exp.taxAmount > 0 && (
                      <span className="block text-[10px] font-normal text-[#8E8E93]">
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
                        className="p-1.5 rounded-lg bg-[#0066CC]/20 hover:bg-[#0066CC]/35 border border-[#0066CC]/40 text-[#64D2FF] transition-colors cursor-pointer inline-flex items-center gap-1 shadow-xs"
                        title={exp.attachment.fileName || "View Attachment Proof"}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-medium">View</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#8E8E93]/40">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEditExpense(exp)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
                        title="Edit Expense"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onArchiveExpense(exp)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-[#8E8E93] hover:text-red-400 transition-colors cursor-pointer"
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
      <div className="px-5 py-3.5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/[0.01] text-xs text-[#8E8E93]">
        {/* Left: Visible Records & Page Sum */}
        <div className="flex items-center gap-3">
          <span>
            Showing <strong className="text-white">{expenses.length}</strong> of{" "}
            <strong className="text-white">{pagination?.totalRecords || expenses.length}</strong> records
          </span>
          <span className="hidden sm:inline-block">•</span>
          <span className="hidden sm:inline-block">
            Page Total: <strong className="text-[#30D158]">₹{pageTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
          </span>
        </div>

        {/* Right: Pagination Controls */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!pagination.hasPrevPage}
              onClick={() => onPageChange(pagination.page - 1)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            <span className="px-2 font-medium text-white">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={() => onPageChange(pagination.page + 1)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
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
