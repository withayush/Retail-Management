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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-white tracking-tight">Expense Management</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live OpEx Engine
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Monitor shop overheads, operational expenditures, supplier disbursements, and category budget limits in real time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Seed Defaults Button */}
          <button
            onClick={handleSeedDefaults}
            disabled={isSeeding}
            className="h-9 px-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] active:bg-white/[0.05] border border-white/10 text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
            title="Populate standard retail overhead categories"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isSeeding ? "Seeding..." : "Seed Defaults"}</span>
          </button>

          {/* New Category Button */}
          <button
            onClick={() => {
              setCategoryToEdit(null);
              setIsCreateCategoryModalOpen(true);
            }}
            className="h-9 px-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] active:bg-white/[0.05] border border-white/10 text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>New Category</span>
          </button>

          {/* Primary Action: Record Expense */}
          <button
            onClick={() => {
              setExpenseToEdit(null);
              setIsRecordExpenseModalOpen(true);
            }}
            className="h-9 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-xs font-semibold text-zinc-950 flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* 2. Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Overheads Recorded */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/[0.08] hover:border-white/20 transition-all relative overflow-hidden group shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              {filters.month !== "ALL" ? `Spent in ${filters.month}` : "Total Overheads"}
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">
              ₹{Number(expenseSummary?.totalExpenseAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>{expenseSummary?.totalExpensesCount || 0} recorded statements</span>
            </div>
          </div>
        </div>

        {/* This Month's Expenses */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/[0.08] hover:border-white/20 transition-all relative overflow-hidden group shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              This Month
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-400 tracking-tight">
              ₹{Number(expenseSummary?.monthExpenseAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>{expenseSummary?.monthExpenseCount || 0} entries this month</span>
            </div>
          </div>
        </div>

        {/* Average Expense per Transaction */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/[0.08] hover:border-white/20 transition-all relative overflow-hidden group shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Avg per Expense
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">
              ₹{Number(expenseSummary?.averageExpenseAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Per transaction average</span>
            </div>
          </div>
        </div>

        {/* Active Categories Count */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/[0.08] hover:border-white/20 transition-all relative overflow-hidden group shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Active Headings
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-sky-400 tracking-tight">
              {categorySummary?.activeCategories || categories.length || 0}
            </div>
            <div className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span>{categorySummary?.customCategories || 0} custom, {categorySummary?.defaultCategories || 0} standard</span>
            </div>
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

      {/* 4. Main Content Container with Modern Segmented Tabs */}
      <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
        {/* Navigation Tabs Bar */}
        <div className="p-3 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950/40">
          <div className="flex items-center gap-1.5 p-1 bg-zinc-950/70 border border-white/[0.06] rounded-xl flex-wrap">
            <button
              onClick={() => setActiveTab("EXPENSES")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "EXPENSES"
                  ? "bg-zinc-800 text-white shadow-sm border border-white/10"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.03]"
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-400" />
              <span>Historical Expense Ledger</span>
              <span className="px-1.5 py-0.2 rounded-md bg-white/10 text-[10px] font-mono text-zinc-300">
                {pagination?.totalRecords || expenses.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("MONTHLY_OPEX")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "MONTHLY_OPEX"
                  ? "bg-zinc-800 text-white shadow-sm border border-white/10"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.03]"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Monthly OpEx Aggregator</span>
            </button>

            <button
              onClick={() => setActiveTab("CATEGORIES")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "CATEGORIES"
                  ? "bg-zinc-800 text-white shadow-sm border border-white/10"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.03]"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Category Master</span>
              <span className="px-1.5 py-0.2 rounded-md bg-white/10 text-[10px] font-mono text-zinc-300">
                {categories.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => {
                loadExpensesData();
                loadCategoriesData();
              }}
              className="h-8 px-2.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 border border-white/[0.06] flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Refresh ledger and categories"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${expensesLoading || categoriesLoading ? "animate-spin text-emerald-400" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
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
              filters={filters}
              onPageChange={handlePageChange}
              onRecordNewExpense={() => {
                setExpenseToEdit(null);
                setIsRecordExpenseModalOpen(true);
              }}
              onResetFilters={handleResetFilters}
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight">Expense Categories Configuration</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Anchor headings for store overheads and monthly budget allocations
                </p>
              </div>
              <button
                onClick={() => {
                  setCategoryToEdit(null);
                  setIsCreateCategoryModalOpen(true);
                }}
                className="h-8.5 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-1.5 shadow-sm shadow-blue-500/20 cursor-pointer self-start sm:self-auto transition-all"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Category</span>
              </button>
            </div>

            {categoriesLoading ? (
              <div className="py-16 text-center">
                <RefreshCw className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
                <p className="text-xs text-zinc-400">Loading categories...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => {
                  const IconComp = ICON_MAP[cat.icon] || Tag;
                  const color = cat.color || "#8E8E93";

                  return (
                    <div
                      key={cat._id}
                      className="p-4 rounded-2xl bg-zinc-950/40 border border-white/[0.06] hover:border-white/15 transition-all flex flex-col justify-between group shadow-sm"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs group-hover:scale-105 transition-transform"
                            style={{
                              backgroundColor: `${color}18`,
                              borderColor: `${color}35`,
                            }}
                          >
                            <IconComp className="w-5 h-5" style={{ color }} />
                          </div>

                          <div className="flex items-center gap-1.5">
                            {cat.isDefault ? (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/10">
                                Default
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                Custom
                              </span>
                            )}
                          </div>
                        </div>

                        <h4 className="text-sm font-semibold text-white tracking-tight">{cat.categoryName}</h4>
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2 min-h-[32px] leading-relaxed">
                          {cat.description || "General store operational overhead heading."}
                        </p>

                        {cat.budgetLimit > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                            <span className="text-zinc-500 text-[11px]">Monthly Cap:</span>
                            <span className="font-semibold text-emerald-400">
                              ₹{Number(cat.budgetLimit).toLocaleString("en-IN")}/mo
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
