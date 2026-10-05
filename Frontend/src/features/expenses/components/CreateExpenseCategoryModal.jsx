import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Edit2,
  Building,
  Users,
  Zap,
  Wifi,
  Truck,
  Wrench,
  Megaphone,
  Package,
  Tag,
  Laptop,
  CreditCard,
  Briefcase,
  Coffee,
  Shield,
  DollarSign,
  AlertCircle,
  Sparkles,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  createExpenseCategory,
  updateExpenseCategory,
} from "../../../services/expenseCategory.api";

// Icon mapping dictionary
export const ICON_MAP = {
  Building,
  Users,
  Zap,
  Wifi,
  Truck,
  Wrench,
  Megaphone,
  Package,
  Tag,
  Laptop,
  CreditCard,
  Briefcase,
  Coffee,
  Shield,
  DollarSign,
};

const COLOR_PALETTE = [
  { name: "Orange", hex: "#FF9F0A" },
  { name: "Green", hex: "#30D158" },
  { name: "Yellow", hex: "#FFD60A" },
  { name: "Sky", hex: "#64D2FF" },
  { name: "Purple", hex: "#BF5AF2" },
  { name: "Red", hex: "#FF453A" },
  { name: "Pink", hex: "#FF375F" },
  { name: "Brown", hex: "#AC8E68" },
  { name: "Blue", hex: "#0066CC" },
  { name: "Teal", hex: "#00C7BE" },
  { name: "Indigo", hex: "#5856D6" },
  { name: "Gray", hex: "#8E8E93" },
];

const AVAILABLE_ICONS = [
  "Building",
  "Users",
  "Zap",
  "Wifi",
  "Truck",
  "Wrench",
  "Megaphone",
  "Package",
  "Tag",
  "Laptop",
  "CreditCard",
  "Briefcase",
  "Coffee",
  "Shield",
  "DollarSign",
];

export default function CreateExpenseCategoryModal({
  isOpen,
  onClose,
  categoryToEdit = null,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    categoryName: "",
    description: "",
    icon: "Tag",
    color: "#0066CC",
    budgetLimit: "",
    sortOrder: 0,
    isActive: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (categoryToEdit) {
      setFormData({
        categoryName: categoryToEdit.categoryName || "",
        description: categoryToEdit.description || "",
        icon: categoryToEdit.icon || "Tag",
        color: categoryToEdit.color || "#0066CC",
        budgetLimit: categoryToEdit.budgetLimit ? String(categoryToEdit.budgetLimit) : "",
        sortOrder: categoryToEdit.sortOrder || 0,
        isActive: categoryToEdit.isActive !== false,
      });
    } else {
      setFormData({
        categoryName: "",
        description: "",
        icon: "Tag",
        color: "#0066CC",
        budgetLimit: "",
        sortOrder: 0,
        isActive: true,
      });
    }
  }, [categoryToEdit, isOpen]);

  if (!isOpen) return null;

  const SelectedIconComponent = ICON_MAP[formData.icon] || Tag;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.categoryName.trim()) {
      toast.error("Please enter a category name.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        categoryName: formData.categoryName.trim(),
        description: formData.description.trim(),
        icon: formData.icon,
        color: formData.color,
        budgetLimit: formData.budgetLimit ? Number(formData.budgetLimit) : 0,
        sortOrder: Number(formData.sortOrder) || 0,
        isActive: formData.isActive,
      };

      if (categoryToEdit) {
        await updateExpenseCategory(categoryToEdit._id, payload);
        toast.success(`Category '${formData.categoryName}' updated successfully!`);
      } else {
        await createExpenseCategory(payload);
        toast.success(`Category '${formData.categoryName}' created successfully!`);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to save category.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#1C1C1E] border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-modal-pop flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md transition-all"
              style={{ backgroundColor: `${formData.color}25`, borderColor: `${formData.color}60`, borderWidth: 1 }}
            >
              <SelectedIconComponent className="w-5 h-5" style={{ color: formData.color }} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {categoryToEdit ? "Edit Expense Category" : "New Expense Category"}
              </h2>
              <p className="text-xs text-[#8E8E93]">
                {categoryToEdit
                  ? "Update configuration and monthly budget limits"
                  : "Organize store overheads into structured accounts"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8E8E93] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Category Name */}
          <div>
            <label className="block text-xs font-medium text-[#8E8E93] uppercase tracking-wider mb-1.5">
              Category Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.categoryName}
              onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
              placeholder="e.g. Electricity, Staff Salary, Shop Rent, Cloud Hosting"
              className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-[#636366] focus:outline-none focus:border-[#0066CC] transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-[#8E8E93] uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief note about the nature of this expense category..."
              className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-[#636366] focus:outline-none focus:border-[#0066CC] transition-colors resize-none"
            />
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-medium text-[#8E8E93] uppercase tracking-wider mb-2">
              Select Icon
            </label>
            <div className="grid grid-cols-5 gap-2">
              {AVAILABLE_ICONS.map((iconName) => {
                const IconComp = ICON_MAP[iconName] || Tag;
                const isSelected = formData.icon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: iconName })}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#0066CC]/20 border-[#0066CC] text-white shadow-sm"
                        : "bg-white/[0.03] border-white/5 text-[#8E8E93] hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    <IconComp className="w-5 h-5 mb-1" style={isSelected ? { color: formData.color } : {}} />
                    <span className="text-[10px] truncate max-w-[50px]">{iconName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Palette Selector */}
          <div>
            <label className="block text-xs font-medium text-[#8E8E93] uppercase tracking-wider mb-2">
              Badge Color
            </label>
            <div className="flex flex-wrap gap-2.5">
              {COLOR_PALETTE.map((c) => {
                const isSelected = formData.color.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: c.hex })}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isSelected ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#1C1C1E]" : "hover:scale-105 opacity-80 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-black font-bold" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Monthly Budget Limit (Optional) */}
          <div>
            <label className="block text-xs font-medium text-[#8E8E93] uppercase tracking-wider mb-1.5">
              Monthly Budget Limit (₹) (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#8E8E93]">₹</span>
              <input
                type="number"
                min="0"
                step="100"
                value={formData.budgetLimit}
                onChange={(e) => setFormData({ ...formData, budgetLimit: e.target.value })}
                placeholder="0 (No budget cap)"
                className="w-full pl-8 pr-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-[#636366] focus:outline-none focus:border-[#0066CC] transition-colors"
              />
            </div>
            <p className="text-[11px] text-[#8E8E93] mt-1">
              Set a monthly spending threshold to monitor budget variances and over-spending.
            </p>
          </div>

          {/* Live Preview Card */}
          <div className="p-3.5 rounded-xl bg-black/50 border border-white/10">
            <span className="text-[10px] uppercase font-semibold text-[#8E8E93] tracking-wider block mb-2">
              Preview Badge
            </span>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center border shadow-sm"
                  style={{
                    backgroundColor: `${formData.color}20`,
                    borderColor: `${formData.color}50`,
                  }}
                >
                  <SelectedIconComponent className="w-4 h-4" style={{ color: formData.color }} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    {formData.categoryName.trim() || "Untitled Category"}
                  </h4>
                  <p className="text-xs text-[#8E8E93]">
                    {formData.description.trim() || "No description provided"}
                  </p>
                </div>
              </div>
              {formData.budgetLimit && Number(formData.budgetLimit) > 0 && (
                <span
                  className="text-xs font-medium px-2.5 py-1 rounded-full border"
                  style={{
                    backgroundColor: `${formData.color}15`,
                    borderColor: `${formData.color}40`,
                    color: formData.color,
                  }}
                >
                  Budget: ₹{Number(formData.budgetLimit).toLocaleString("en-IN")}/mo
                </span>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#8E8E93] hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#0066CC] hover:bg-[#0077ED] active:scale-95 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Saving...</span>
              ) : categoryToEdit ? (
                <>
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Update Category</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Category</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
