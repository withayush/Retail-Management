import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Plus,
  Search,
  Edit2,
  Trash2,
  Archive,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  Tag,
  Layers,
  DollarSign,
  AlertCircle,
  TrendingDown,
  RefreshCw,
  Building,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getExpenseCategories,
  getExpenseCategorySummary,
  toggleExpenseCategoryStatus,
  archiveExpenseCategory,
  restoreExpenseCategory,
  seedDefaultExpenseCategories,
} from "../../../services/expenseCategory.api";
import CreateExpenseCategoryModal, { ICON_MAP } from "./CreateExpenseCategoryModal";

export default function ExpenseCategoriesModal({ isOpen, onClose, onCategoryChange }) {
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | ACTIVE | INACTIVE
  const [typeFilter, setTypeFilter] = useState("ALL"); // ALL | DEFAULT | CUSTOM

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState(null);
  const [seeding, setSeeding] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (typeFilter === "DEFAULT") params.isDefault = true;
      if (typeFilter === "CUSTOM") params.isDefault = false;

      const [listRes, summaryRes] = await Promise.all([
        getExpenseCategories(params),
        getExpenseCategorySummary(),
      ]);

      setCategories(listRes.data || []);
      setSummary(summaryRes.data || null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load expense categories.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, typeFilter]);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen, fetchCategories]);

  if (!isOpen) return null;

  const handleToggleStatus = async (cat) => {
    try {
      await toggleExpenseCategoryStatus(cat._id);
      toast.success(
        `Category '${cat.categoryName}' is now ${cat.isActive ? "inactive" : "active"}.`
      );
      fetchCategories();
      if (onCategoryChange) onCategoryChange();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update category status.");
    }
  };

  const handleArchive = async (cat) => {
    if (!window.confirm(`Are you sure you want to archive '${cat.categoryName}'?`)) return;
    try {
      await archiveExpenseCategory(cat._id);
      toast.success(`Category '${cat.categoryName}' archived.`);
      fetchCategories();
      if (onCategoryChange) onCategoryChange();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to archive category.");
    }
  };

  const handleRestore = async (cat) => {
    try {
      await restoreExpenseCategory(cat._id);
      toast.success(`Category '${cat.categoryName}' restored to active list.`);
      fetchCategories();
      if (onCategoryChange) onCategoryChange();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to restore category.");
    }
  };

  const handleSeedDefaults = async () => {
    try {
      setSeeding(true);
      const res = await seedDefaultExpenseCategories();
      toast.success(res.message || "Default expense categories seeded successfully!");
      fetchCategories();
      if (onCategoryChange) onCategoryChange();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to seed default categories.");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
        <div className="bg-[#161617] border border-white/10 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-modal-pop flex flex-col max-h-[90vh]">
          {/* 1. Header */}
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0066CC]/20 border border-[#0066CC]/40 flex items-center justify-center text-[#0066CC] shadow-md">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-white">
                    Expense Category Master
                  </h2>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#0066CC]/20 text-[#0066CC] border border-[#0066CC]/30">
                    Phase 8 • T48
                  </span>
                </div>
                <p className="text-xs text-[#8E8E93]">
                  Configure store overhead accounts, monthly budget caps, and multi-tenant categorization
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSeedDefaults}
                disabled={seeding}
                className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-xs font-medium text-white flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                title="Populate standard retail default categories (Rent, Salary, Utilities, etc.)"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FFD60A]" />
                <span>{seeding ? "Seeding..." : "Seed Defaults"}</span>
              </button>

              <button
                onClick={() => {
                  setCategoryToEdit(null);
                  setCreateModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#0066CC] hover:bg-[#0077ED] text-xs font-semibold text-white flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Category</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-[#8E8E93] hover:text-white hover:bg-white/10 transition-colors ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 2. KPI Summary Banner */}
          {summary && (
            <div className="grid grid-cols-4 gap-3 px-6 py-3 bg-black/40 border-b border-white/5">
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-[#8E8E93] uppercase tracking-wider block">Total Categories</span>
                <span className="text-base font-bold text-white">{summary.totalCategories || 0}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-[#30D158] uppercase tracking-wider block">Active Headings</span>
                <span className="text-base font-bold text-[#30D158]">{summary.activeCategories || 0}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-[#64D2FF] uppercase tracking-wider block">Custom Categories</span>
                <span className="text-base font-bold text-[#64D2FF]">{summary.customCategories || 0}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-[#FF9F0A] uppercase tracking-wider block">System Defaults</span>
                <span className="text-base font-bold text-[#FF9F0A]">{summary.defaultCategories || 0}</span>
              </div>
            </div>
          )}

          {/* 3. Toolbar & Filters */}
          <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-white/[0.01]">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search expense categories..."
                className="w-full pl-9 pr-3.5 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-[#636366] focus:outline-none focus:border-[#0066CC] transition-colors"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Status Filter */}
              <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-0.5 text-xs">
                {["ALL", "ACTIVE", "INACTIVE"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      statusFilter === st
                        ? "bg-[#0066CC] text-white shadow-sm"
                        : "text-[#8E8E93] hover:text-white"
                    }`}
                  >
                    {st === "ALL" ? "All" : st === "ACTIVE" ? "Active" : "Inactive"}
                  </button>
                ))}
              </div>

              {/* Type Filter */}
              <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-0.5 text-xs">
                {[
                  { id: "ALL", label: "All Types" },
                  { id: "DEFAULT", label: "Defaults" },
                  { id: "CUSTOM", label: "Custom" },
                ].map((tp) => (
                  <button
                    key={tp.id}
                    onClick={() => setTypeFilter(tp.id)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      typeFilter === tp.id
                        ? "bg-white/15 text-white"
                        : "text-[#8E8E93] hover:text-white"
                    }`}
                  >
                    {tp.label}
                  </button>
                ))}
              </div>

              <button
                onClick={fetchCategories}
                className="p-1.5 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
                title="Refresh Categories"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* 4. Categories Table / Grid */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {loading ? (
              <div className="py-16 text-center">
                <RefreshCw className="w-6 h-6 text-[#0066CC] animate-spin mx-auto mb-2" />
                <p className="text-xs text-[#8E8E93]">Loading expense categories...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                <Layers className="w-8 h-8 text-[#8E8E93]/40 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-white">No Expense Categories Found</h4>
                <p className="text-xs text-[#8E8E93] max-w-sm mx-auto mt-1 mb-4">
                  Organize store operational overheads by creating custom categories or seeding standard retail defaults.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={handleSeedDefaults}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#FFD60A]" />
                    <span>Seed Standard Defaults</span>
                  </button>
                  <button
                    onClick={() => {
                      setCategoryToEdit(null);
                      setCreateModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#0066CC] hover:bg-[#0077ED] text-xs font-semibold text-white flex items-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create First Category</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categories.map((cat) => {
                  const IconComp = ICON_MAP[cat.icon] || Tag;
                  const color = cat.color || "#8E8E93";

                  return (
                    <div
                      key={cat._id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                        cat.isActive
                          ? "bg-white/[0.02] border-white/10 hover:border-white/20"
                          : "bg-black/30 border-white/5 opacity-60"
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm"
                          style={{
                            backgroundColor: `${color}20`,
                            borderColor: `${color}40`,
                          }}
                        >
                          <IconComp className="w-5 h-5" style={{ color }} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-semibold text-white truncate">
                              {cat.categoryName}
                            </h4>

                            {cat.isDefault ? (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/10 text-[#8E8E93] border border-white/10">
                                Default
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#64D2FF]/10 text-[#64D2FF] border border-[#64D2FF]/20">
                                Custom
                              </span>
                            )}

                            {!cat.isActive && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/30">
                                Inactive
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-[#8E8E93] mt-0.5 line-clamp-1">
                            {cat.description || "No description"}
                          </p>

                          {cat.budgetLimit > 0 && (
                            <div className="flex items-center gap-1.5 mt-2">
                              <span className="text-[11px] font-medium text-[#30D158]">
                                Budget: ₹{cat.budgetLimit.toLocaleString("en-IN")}/mo
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Toggle Active Switch */}
                        <button
                          onClick={() => handleToggleStatus(cat)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            cat.isActive
                              ? "bg-[#30D158]/10 border-[#30D158]/30 text-[#30D158] hover:bg-[#30D158]/20"
                              : "bg-white/5 border-white/10 text-[#8E8E93] hover:text-white"
                          }`}
                          title={cat.isActive ? "Deactivate Category" : "Activate Category"}
                        >
                          {cat.isActive ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => {
                            setCategoryToEdit(cat);
                            setCreateModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
                          title="Edit Category Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Archive / Delete Button */}
                        <button
                          onClick={() => handleArchive(cat)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-[#8E8E93] hover:text-red-400 transition-colors cursor-pointer"
                          title="Archive Category"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 5. Footer */}
          <div className="px-6 py-3 border-t border-white/10 flex items-center justify-between bg-white/[0.02] text-xs text-[#8E8E93]">
            <span>
              Configured categories anchor all future store expense entries & profit/loss statements.
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Create / Edit Category Modal */}
      <CreateExpenseCategoryModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setCategoryToEdit(null);
        }}
        categoryToEdit={categoryToEdit}
        onSuccess={() => {
          fetchCategories();
          if (onCategoryChange) onCategoryChange();
        }}
      />
    </>
  );
}
