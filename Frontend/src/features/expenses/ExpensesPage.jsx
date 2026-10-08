import React, { useState, useEffect, useCallback } from "react";
import {
  Layers,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Sparkles,
  TrendingDown,
  DollarSign,
  Tag,
  Edit2,
  CheckCircle2,
  XCircle,
  Archive,
  Receipt,
  Calendar,
  Wallet,
  Sliders,
  ArrowUpRight,
  PieChart,
  BarChart3,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getExpenseCategories,
  getExpenseCategorySummary,
  toggleExpenseCategoryStatus,
  archiveExpenseCategory,
  seedDefaultExpenseCategories,
} from "../../services/expenseCategory.api";
import {
  getExpenses,
  getExpenseSummary,
  archiveExpense,
} from "../../services/expense.api";

import CreateExpenseCategoryModal, { ICON_MAP } from "./components/CreateExpenseCategoryModal";
import ExpenseCategoriesModal from "./components/ExpenseCategoriesModal";
import RecordExpenseModal from "./components/RecordExpenseModal";
import ExpensesTable from "./components/ExpensesTable";
import ExpenseLeakageSummary from "./components/ExpenseLeakageSummary";
import ExpenseLedgerFilters from "./components/ExpenseLedgerFilters";
import MonthlyOpExAggregator from "./components/MonthlyOpExAggregator";

export default function ExpensesPage() {
  // Active View Tab: "EXPENSES" (T50 Historical Statement) | "MONTHLY_OPEX" (T51 Aggregator) | "CATEGORIES" (T48 Master)
  const [activeTab, setActiveTab] = useState("EXPENSES");

  // Expenses State (T49 & T50)
  const [expenses, setExpenses] = useState([]);
  const [expenseSummary, setExpenseSummary] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [expensesLoading, setExpensesLoading] = useState(true);

  // Categories State (T48)
  const [categories, setCategories] = useState([]);
  const [categorySummary, setCategorySummary] = useState(null);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Multi-Dimensional Filters State (T50)
  const [filters, setFilters] = useState({
    search: "",
    month: "ALL", // "ALL" | "YYYY-MM"
    categoryId: "ALL",
    paymentMethod: "ALL",
    startDate: "",
    endDate: "",
    sortBy: "date_desc",
    page: 1,
    limit: 20,
  });

  // Modals State
  const [isRecordExpenseModalOpen, setIsRecordExpenseModalOpen] = useState(false);
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [categoryToEdit, setCategoryToEdit] = useState(null);
  const [isSeeding, setIsSeeding] = useState(false);

  // Load Categories (T48)
  const loadCategoriesData = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const [catList, catSummary] = await Promise.all([
        getExpenseCategories(),
        getExpenseCategorySummary(),
      ]);
      setCategories(catList.data || []);
      setCategorySummary(catSummary.data || null);
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  // Load Expenses (T49/T50)
  const loadExpensesData = useCallback(async () => {
    try {
      setExpensesLoading(true);
      const params = {
        page: filters.page,
        limit: filters.limit,
        sortBy: filters.sortBy,
      };

      if (filters.search.trim()) params.search = filters.search.trim();
      if (filters.month !== "ALL") params.month = filters.month;
      if (filters.categoryId !== "ALL") params.categoryId = filters.categoryId;
      if (filters.paymentMethod !== "ALL") params.paymentMethod = filters.paymentMethod;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const summaryParams = { ...params };
      delete summaryParams.page;
      delete summaryParams.limit;

      const [expRes, expSummaryRes] = await Promise.all([
        getExpenses(params),
        getExpenseSummary(summaryParams),
      ]);

      setExpenses(expRes.data || []);
      setPagination(expRes.pagination || null);
      setExpenseSummary(expSummaryRes.data || null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load expenses.");
    } finally {
      setExpensesLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadCategoriesData();
    loadExpensesData();
  }, [loadCategoriesData, loadExpensesData]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to page 1 on filter modification
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      month: "ALL",
      categoryId: "ALL",
      paymentMethod: "ALL",
      startDate: "",
      endDate: "",
      sortBy: "date_desc",
      page: 1,
      limit: 20,
    });
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  // 1-Click Jump from T51 Monthly OpEx into T50 Historical Statement
  const handleJumpToLedgerMonth = (monthKey) => {
    handleFilterChange("month", monthKey);
    setActiveTab("EXPENSES");
  };

  // Handle Archive Expense
  const handleArchiveExpense = async (exp) => {
    if (!window.confirm(`Are you sure you want to archive expense ${exp.expenseNumber}?`)) return;
    try {
      await archiveExpense(exp._id);
      toast.success(`Expense ${exp.expenseNumber} archived.`);
      loadExpensesData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to archive expense.");
    }
  };

  // Handle Seed Defaults (T48)
  const handleSeedDefaults = async () => {
    try {
      setIsSeeding(true);
      const res = await seedDefaultExpenseCategories();
      toast.success(res.message || "Default categories seeded!");
      loadCategoriesData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to seed defaults.");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-[#D2D2D7]">
      {/* 1. Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Expense Management</h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#30D158]/20 text-[#30D158] border border-[#30D158]/30">
              Phase 8 • T51 OpEx Engine
            </span>
          </div>
          <p className="text-xs text-[#8E8E93] mt-1">
            Categorized historical expense ledger, calendar-month OpEx aggregator engine, and expenditure leakage tracking
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Seed Defaults Button */}
          <button
            onClick={handleSeedDefaults}
            disabled={isSeeding}
            className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-medium text-white flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            title="Populate standard retail categories"
          >
            <Sparkles className="w-4 h-4 text-[#FFD60A]" />
            <span>{isSeeding ? "Seeding..." : "Seed Defaults"}</span>
          </button>

          {/* New Category Button */}
          <button
            onClick={() => {
              setCategoryToEdit(null);
              setIsCreateCategoryModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-medium text-white flex items-center gap-2 transition-all cursor-pointer"
          >
            <Layers className="w-4 h-4 text-[#64D2FF]" />
            <span>New Category</span>
          </button>

          {/* Primary Action: Record Expense (T49) */}
          <button
            onClick={() => {
              setExpenseToEdit(null);
              setIsRecordExpenseModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#30D158] hover:bg-[#34C759] text-xs font-bold text-black flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-black font-bold" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* 2. Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Overheads Recorded */}
        <div className="p-5 rounded-2xl bg-[#161617]/80 backdrop-blur-xl border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8E8E93] uppercase tracking-wider">
              {filters.month !== "ALL" ? `Spent in ${filters.month}` : "Total Expenses"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#0066CC]/15 flex items-center justify-center text-[#0066CC]">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">
              ₹{Number(expenseSummary?.totalExpenseAmount || 0).toLocaleString("en-IN")}
            </span>
            <p className="text-[11px] text-[#8E8E93] mt-1">
              {expenseSummary?.totalExpensesCount || 0} recorded statements
            </p>
          </div>
        </div>

        {/* This Month's Expenses */}
        <div className="p-5 rounded-2xl bg-[#161617]/80 backdrop-blur-xl border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8E8E93] uppercase tracking-wider">
              This Month
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FF9F0A]/15 flex items-center justify-center text-[#FF9F0A]">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-[#FF9F0A] tracking-tight">
              ₹{Number(expenseSummary?.monthExpenseAmount || 0).toLocaleString("en-IN")}
            </span>
            <p className="text-[11px] text-[#8E8E93] mt-1">
              {expenseSummary?.monthExpenseCount || 0} entries this month
            </p>
          </div>
        </div>

        {/* Average Expense per Transaction */}
        <div className="p-5 rounded-2xl bg-[#161617]/80 backdrop-blur-xl border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8E8E93] uppercase tracking-wider">
              Average Expense
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#30D158]/15 flex items-center justify-center text-[#30D158]">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-[#30D158] tracking-tight">
              ₹{Number(expenseSummary?.averageExpenseAmount || 0).toLocaleString("en-IN")}
            </span>
            <p className="text-[11px] text-[#8E8E93] mt-1">Per transaction average</p>
          </div>
        </div>

        {/* Active Categories Count */}
        <div className="p-5 rounded-2xl bg-[#161617]/80 backdrop-blur-xl border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8E8E93] uppercase tracking-wider">
              Active Headings
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#64D2FF]/15 flex items-center justify-center text-[#64D2FF]">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-[#64D2FF] tracking-tight">
              {categorySummary?.activeCategories || categories.length || 0}
            </span>
            <p className="text-[11px] text-[#8E8E93] mt-1">
              {categorySummary?.customCategories || 0} custom, {categorySummary?.defaultCategories || 0} standard
            </p>
          </div>
        </div>
      </div>

      {/* 3. Visual Expenditure Leakage & Category Breakdown Widget (T50) */}
      {expenseSummary?.categoryBreakdown?.length > 0 && (
        <ExpenseLeakageSummary
          categoryBreakdown={expenseSummary.categoryBreakdown}
          totalAmount={expenseSummary.totalExpenseAmount}
          activeCategoryId={filters.categoryId}
          onSelectCategory={(catId) => handleFilterChange("categoryId", catId)}
        />
      )}

      {/* 4. Main Content Container with Tabs */}
      <div className="bg-[#161617]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Navigation Tabs Bar */}
        <div className="px-5 pt-3 border-b border-white/10 flex items-center justify-between gap-4 bg-white/[0.01]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("EXPENSES")}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === "EXPENSES"
                  ? "border-[#30D158] text-white bg-white/[0.03]"
                  : "border-transparent text-[#8E8E93] hover:text-white"
              }`}
            >
              <Receipt className="w-4 h-4 text-[#30D158]" />
              <span>Historical Expense Ledger ({pagination?.totalRecords || expenses.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("MONTHLY_OPEX")}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === "MONTHLY_OPEX"
                  ? "border-[#FF9F0A] text-white bg-white/[0.03]"
                  : "border-transparent text-[#8E8E93] hover:text-white"
              }`}
            >
              <BarChart3 className="w-4 h-4 text-[#FF9F0A]" />
              <span>Monthly OpEx Aggregator</span>
            </button>

            <button
              onClick={() => setActiveTab("CATEGORIES")}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === "CATEGORIES"
                  ? "border-[#0066CC] text-white bg-white/[0.03]"
                  : "border-transparent text-[#8E8E93] hover:text-white"
              }`}
            >
              <Layers className="w-4 h-4 text-[#0066CC]" />
              <span>Category Master ({categories.length})</span>
            </button>
          </div>

          <button
            onClick={() => {
              loadExpensesData();
              loadCategoriesData();
            }}
            className="p-1.5 text-[#8E8E93] hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            title="Refresh All"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* TAB 1: HISTORICAL EXPENSE LEDGER (T50) */}
        {activeTab === "EXPENSES" && (
          <div>
            {/* Filter Toolbar (T50 Month & Category Filtering + CSV Export) */}
            <ExpenseLedgerFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              categories={categories}
              expenses={expenses}
              onResetFilters={handleResetFilters}
            />

            {/* Expenses Table with Pagination */}
            <ExpensesTable
              expenses={expenses}
              pagination={pagination}
              loading={expensesLoading}
              onPageChange={handlePageChange}
              onEditExpense={(exp) => {
                setExpenseToEdit(exp);
                setIsRecordExpenseModalOpen(true);
              }}
              onArchiveExpense={handleArchiveExpense}
            />
          </div>
        )}

        {/* TAB 2: MONTHLY OPEX AGGREGATOR (T51) */}
        {activeTab === "MONTHLY_OPEX" && (
          <div className="p-5">
            <MonthlyOpExAggregator onJumpToLedgerMonth={handleJumpToLedgerMonth} />
          </div>
        )}

        {/* TAB 3: CATEGORY MASTER (T48) */}
        {activeTab === "CATEGORIES" && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Expense Categories Configuration</h3>
                <p className="text-xs text-[#8E8E93]">
                  Anchor headings for store overheads and monthly budget allocations
                </p>
              </div>
              <button
                onClick={() => {
                  setCategoryToEdit(null);
                  setIsCreateCategoryModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#0066CC] hover:bg-[#0077ED] text-xs font-semibold text-white flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category</span>
              </button>
            </div>

            {categoriesLoading ? (
              <div className="py-16 text-center">
                <RefreshCw className="w-6 h-6 text-[#0066CC] animate-spin mx-auto mb-2" />
                <p className="text-xs text-[#8E8E93]">Loading categories...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => {
                  const IconComp = ICON_MAP[cat.icon] || Tag;
                  const color = cat.color || "#8E8E93";

                  return (
                    <div
                      key={cat._id}
                      className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm group-hover:scale-105 transition-all"
                            style={{
                              backgroundColor: `${color}20`,
                              borderColor: `${color}45`,
                            }}
                          >
                            <IconComp className="w-5 h-5" style={{ color }} />
                          </div>

                          <div className="flex items-center gap-1.5">
                            {cat.isDefault ? (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-[#8E8E93] border border-white/10">
                                Default
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#64D2FF]/10 text-[#64D2FF] border border-[#64D2FF]/20">
                                Custom
                              </span>
                            )}
                          </div>
                        </div>

                        <h4 className="text-sm font-bold text-white">{cat.categoryName}</h4>
                        <p className="text-xs text-[#8E8E93] mt-1 line-clamp-2 min-h-[32px]">
                          {cat.description || "General store operational overhead heading."}
                        </p>

                        {cat.budgetLimit > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                            <span className="text-[#8E8E93] text-[11px]">Monthly Cap:</span>
                            <span className="font-semibold text-[#30D158]">
                              ₹{cat.budgetLimit.toLocaleString("en-IN")}/mo
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setCategoryToEdit(cat);
                            setIsCreateCategoryModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
                          title="Edit Category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Record Expense Modal (T49) */}
      <RecordExpenseModal
        isOpen={isRecordExpenseModalOpen}
        onClose={() => {
          setIsRecordExpenseModalOpen(false);
          setExpenseToEdit(null);
        }}
        expenseToEdit={expenseToEdit}
        onSuccess={() => {
          loadExpensesData();
          loadCategoriesData();
        }}
      />

      {/* Create / Edit Category Modal (T48) */}
      <CreateExpenseCategoryModal
        isOpen={isCreateCategoryModalOpen}
        onClose={() => {
          setIsCreateCategoryModalOpen(false);
          setCategoryToEdit(null);
        }}
        categoryToEdit={categoryToEdit}
        onSuccess={() => {
          loadCategoriesData();
        }}
      />
    </div>
  );
}
