import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Receipt,
  DollarSign,
  Calendar,
  CreditCard,
  Building,
  Upload,
  FileText,
  Tag,
  CheckCircle2,
  Trash2,
  Sparkles,
  Layers,
} from "lucide-react";
import toast from "react-hot-toast";
import { getExpenseCategories } from "../../../services/expenseCategory.api";
import { createExpense, updateExpense } from "../../../services/expense.api";
import { ICON_MAP } from "./CreateExpenseCategoryModal";

const PAYMENT_METHODS = [
  { id: "CASH", label: "Cash" },
  { id: "UPI", label: "UPI" },
  { id: "BANK_TRANSFER", label: "Bank Transfer (NEFT/IMPS)" },
  { id: "CARD", label: "Debit/Credit Card" },
  { id: "CHEQUE", label: "Cheque" },
  { id: "OTHER", label: "Other" },
];

export default function RecordExpenseModal({
  isOpen,
  onClose,
  expenseToEdit = null,
  onSuccess,
}) {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    categoryId: "",
    amount: "",
    expenseDate: new Date().toISOString().split("T")[0],
    paymentMethod: "CASH",
    referenceNumber: "",
    payee: "",
    description: "",
    taxAmount: "",
    attachment: null, // { fileName, url, fileType, fileSize }
  });

  const [filePreview, setFilePreview] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      if (expenseToEdit) {
        setFormData({
          categoryId: expenseToEdit.categoryId?._id || expenseToEdit.categoryId || "",
          amount: expenseToEdit.amount ? String(expenseToEdit.amount) : "",
          expenseDate: expenseToEdit.expenseDate
            ? new Date(expenseToEdit.expenseDate).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          paymentMethod: expenseToEdit.paymentMethod || "CASH",
          referenceNumber: expenseToEdit.referenceNumber || "",
          payee: expenseToEdit.payee || "",
          description: expenseToEdit.description || "",
          taxAmount: expenseToEdit.taxAmount ? String(expenseToEdit.taxAmount) : "",
          attachment: expenseToEdit.attachment || null,
        });
        if (expenseToEdit.attachment?.url) {
          setFilePreview(expenseToEdit.attachment.url);
        }
      } else {
        setFormData({
          categoryId: "",
          amount: "",
          expenseDate: new Date().toISOString().split("T")[0],
          paymentMethod: "CASH",
          referenceNumber: "",
          payee: "",
          description: "",
          taxAmount: "",
          attachment: null,
        });
        setFilePreview(null);
      }
    }
  }, [isOpen, expenseToEdit]);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const res = await getExpenseCategories({ status: "ACTIVE" });
      setCategories(res.data || []);
      if (!expenseToEdit && res.data?.length > 0) {
        setFormData((prev) => ({
          ...prev,
          categoryId: prev.categoryId || res.data[0]._id,
        }));
      }
    } catch (err) {
      toast.error("Failed to load expense categories.");
    } finally {
      setLoadingCategories(false);
    }
  };

  if (!isOpen) return null;

  const selectedCategory = categories.find((c) => c._id === formData.categoryId);
  const SelectedIcon = selectedCategory ? ICON_MAP[selectedCategory.icon] || Tag : Tag;
  const categoryColor = selectedCategory?.color || "#0066CC";

  // Handle Receipt Upload (stores metadata & base64 preview)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size cannot exceed 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result;
      setFormData((prev) => ({
        ...prev,
        attachment: {
          fileName: file.name,
          url: base64Url,
          fileType: file.type,
          fileSize: file.size,
        },
      }));
      setFilePreview(base64Url);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = () => {
    setFormData((prev) => ({
      ...prev,
      attachment: null,
    }));
    setFilePreview(null);
  };

  const handleAddPresetAmount = (preset) => {
    const current = Number(formData.amount) || 0;
    setFormData({
      ...formData,
      amount: String(current + preset),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const categoryIdToUse = formData.categoryId || (categories.length > 0 ? categories[0]._id : "");

    if (!categoryIdToUse) {
      toast.error("Please select or create an expense category first.");
      return;
    }

    const amt = Number(formData.amount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid expense amount greater than 0.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        categoryId: categoryIdToUse,
        amount: amt,
        expenseDate: formData.expenseDate || new Date().toISOString().split("T")[0],
        paymentMethod: formData.paymentMethod || "CASH",
        referenceNumber: formData.referenceNumber ? formData.referenceNumber.trim() : "",
        payee: formData.payee ? formData.payee.trim() : "",
        description: formData.description ? formData.description.trim() : "",
        taxAmount: formData.taxAmount ? Number(formData.taxAmount) : 0,
        attachment: formData.attachment || undefined,
      };

      if (expenseToEdit) {
        await updateExpense(expenseToEdit._id, payload);
        toast.success("Expense updated successfully!");
      } else {
        const res = await createExpense(payload);
        toast.success(
          `Expense ${res.data?.expenseNumber || ""} of ₹${amt.toLocaleString("en-IN")} recorded successfully!`
        );
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to save expense.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#1C1C1E] border border-white/10 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-modal-pop flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md transition-all"
              style={{
                backgroundColor: `${categoryColor}25`,
                borderColor: `${categoryColor}60`,
                borderWidth: 1,
              }}
            >
              <SelectedIcon className="w-5 h-5" style={{ color: categoryColor }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">
                  {expenseToEdit ? "Edit Expense Transaction" : "Record Business Expense"}
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#30D158]/20 text-[#30D158] border border-[#30D158]/30">
                  T49 • API
                </span>
              </div>
              <p className="text-xs text-[#8E8E93]">
                Log operational costs, upload invoice receipts, and anchor to expense categories
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8E8E93] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/* 1. Category & Amount Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category Selector */}
            <div>
              <label className="block text-xs font-medium text-[#8E8E93] uppercase tracking-wider mb-1.5">
                Expense Category <span className="text-red-400">*</span>
              </label>
              {loadingCategories ? (
                <div className="h-10 bg-black/40 border border-white/10 rounded-xl animate-pulse" />
              ) : (
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#0066CC] transition-colors"
                >
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id} className="bg-[#1C1C1E] text-white">
                      {cat.categoryName} {cat.isDefault ? "(Standard)" : "(Custom)"}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-medium text-[#8E8E93] uppercase tracking-wider mb-1.5">
                Amount (₹) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-white">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm font-bold text-white placeholder-[#636366] focus:outline-none focus:border-[#30D158] transition-colors"
                />
              </div>

              {/* Quick Amount Increment Pills */}
              <div className="flex items-center gap-1.5 mt-1.5">
                {[500, 1000, 5000, 10000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleAddPresetAmount(preset)}
                    className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-medium text-[#8E8E93] hover:text-white border border-white/5 transition-colors cursor-pointer"
                  >
                    +₹{preset >= 1000 ? `${preset / 1000}k` : preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Date & Payment Method Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Expense Date */}
            <div>
              <label className="block text-xs font-medium text-[#8E8E93] uppercase tracking-wider mb-1.5">
                Expense Date <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={formData.expenseDate}
                  onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#0066CC] transition-colors [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-medium text-[#8E8E93] uppercase tracking-wider mb-1.5">
                Payment Method
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#0066CC] transition-colors"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm.id} value={pm.id} className="bg-[#1C1C1E] text-white">
                    {pm.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Payee & Reference Number Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Payee / Vendor */}
            <div>
              <label className="block text-xs font-medium text-[#8E8E93] uppercase tracking-wider mb-1.5">
                Payee / Paid To (Optional)
              </label>
              <input
                type="text"
                value={formData.payee}
                onChange={(e) => setFormData({ ...formData, payee: e.target.value })}
                placeholder="e.g. State Electricity Corp, Landlord, Cleaner"
                className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-[#636366] focus:outline-none focus:border-[#0066CC] transition-colors"
              />
            </div>

            {/* Reference Number / UTR / Bill No */}
            <div>
              <label className="block text-xs font-medium text-[#8E8E93] uppercase tracking-wider mb-1.5">
                Bill / Ref / UTR # (Optional)
              </label>
              <input
                type="text"
                value={formData.referenceNumber}
                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                placeholder="e.g. UTR-998822, BILL-2026-09"
                className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-[#636366] focus:outline-none focus:border-[#0066CC] transition-colors"
              />
            </div>
          </div>

          {/* 4. Description & Tax Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#8E8E93] uppercase tracking-wider mb-1.5">
                Description / Notes
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief reason for expense..."
                className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-[#636366] focus:outline-none focus:border-[#0066CC] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8E8E93] uppercase tracking-wider mb-1.5">
                GST / Tax (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.taxAmount}
                onChange={(e) => setFormData({ ...formData, taxAmount: e.target.value })}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-[#636366] focus:outline-none focus:border-[#0066CC] transition-colors"
              />
            </div>
          </div>

          {/* 5. Invoice / Receipt Attachment Upload */}
          <div>
            <label className="block text-xs font-medium text-[#8E8E93] uppercase tracking-wider mb-1.5">
              Attach Invoice / Bill Proof (Optional)
            </label>
            {formData.attachment?.fileName ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#0066CC]/20 border border-[#0066CC]/40 flex items-center justify-center text-[#0066CC] shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {formData.attachment.fileName}
                    </p>
                    <p className="text-[10px] text-[#8E8E93]">
                      {formData.attachment.fileSize
                        ? `${(formData.attachment.fileSize / 1024).toFixed(1)} KB`
                        : "Uploaded file"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {filePreview && (
                    <a
                      href={filePreview}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-medium text-[#64D2FF] hover:underline"
                    >
                      Preview
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={handleRemoveAttachment}
                    className="p-1.5 text-[#8E8E93] hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                    title="Remove Attachment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-4 border border-dashed border-white/15 rounded-xl bg-black/20 hover:bg-white/[0.02] transition-colors cursor-pointer group">
                <Upload className="w-5 h-5 text-[#8E8E93] group-hover:text-white mb-1 transition-colors" />
                <span className="text-xs font-medium text-[#8E8E93] group-hover:text-white transition-colors">
                  Upload bill, invoice, or receipt (PDF/Image max 5MB)
                </span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* 6. Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#8E8E93] hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#30D158] hover:bg-[#34C759] active:scale-95 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 text-black font-bold"
            >
              {submitting ? (
                <span>Recording...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-black" />
                  <span className="text-black font-bold">
                    {expenseToEdit ? "Update Expense" : "Record Expense"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
