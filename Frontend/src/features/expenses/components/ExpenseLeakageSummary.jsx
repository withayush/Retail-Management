import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  PieChart,
  Tag,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { ICON_MAP } from "./CreateExpenseCategoryModal";

export default function ExpenseLeakageSummary({
  categoryBreakdown = [],
  totalAmount = 0,
  onSelectCategory,
  activeCategoryId = "ALL",
}) {
  if (!categoryBreakdown || categoryBreakdown.length === 0) return null;

  // Identify categories exceeding their monthly budget cap (leakages)
  const overBudgetCategories = categoryBreakdown.filter((c) => c.isOverBudget);

  return (
    <div className="p-5 rounded-2xl bg-[#161617]/90 backdrop-blur-xl border border-white/10 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#FF9F0A]/15 border border-[#FF9F0A]/30 flex items-center justify-center text-[#FF9F0A]">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Expenditure Breakdown & Budget Variances
            </h3>
            <p className="text-[11px] text-[#8E8E93]">
              Visual breakdown of store overheads with automatic expenditure leakage alerts
            </p>
          </div>
        </div>

        {/* Over-Budget Alert Badge */}
        {overBudgetCategories.length > 0 ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF453A]/15 border border-[#FF453A]/30 text-[#FF453A] text-xs font-semibold animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{overBudgetCategories.length} Category Exceeding Budget Cap</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#30D158]/15 border border-[#30D158]/30 text-[#30D158] text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>All Spending Within Budget Limits</span>
          </div>
        )}
      </div>

      {/* Category Progress Bars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
        {categoryBreakdown.map((cat) => {
          const IconComp = ICON_MAP[cat.categoryIcon] || Tag;
          const color = cat.categoryColor || "#8E8E93";
          const isSelected = activeCategoryId === (cat._id?.toString() || cat._id);

          const budgetLimit = cat.budgetLimit || 0;
          const totalSpent = cat.totalAmount || 0;
          const percentOfTotal = cat.percentageOfTotal || 0;

          // Budget utilization %
          const budgetUtilization = budgetLimit > 0 ? Math.round((totalSpent / budgetLimit) * 100) : 0;

          return (
            <button
              key={cat._id || cat.categoryName}
              type="button"
              onClick={() => onSelectCategory(cat._id ? cat._id.toString() : "ALL")}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer group ${
                isSelected
                  ? "bg-white/10 border-[#0066CC] shadow-md ring-1 ring-[#0066CC]"
                  : "bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border shadow-xs"
                    style={{
                      backgroundColor: `${color}20`,
                      borderColor: `${color}40`,
                    }}
                  >
                    <IconComp className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-white">
                      {cat.categoryName}
                    </h4>
                    <span className="text-[10px] text-[#8E8E93]">
                      {cat.count} {cat.count === 1 ? "expense" : "expenses"} ({percentOfTotal}% of total)
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-white">
                    ₹{totalSpent.toLocaleString("en-IN")}
                  </span>
                  {budgetLimit > 0 && (
                    <span className="block text-[10px] text-[#8E8E93]">
                      Cap: ₹{budgetLimit.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-black/50 rounded-full h-1.5 overflow-hidden my-2 border border-white/5">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, percentOfTotal * 2 || 5)}%`,
                    backgroundColor: cat.isOverBudget ? "#FF453A" : color,
                  }}
                />
              </div>

              {/* Leakage Status Footer */}
              <div className="flex items-center justify-between text-[10px]">
                {cat.isOverBudget ? (
                  <span className="font-semibold text-[#FF453A] flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Over Budget by +₹{cat.budgetVariance.toLocaleString("en-IN")} ({budgetUtilization}%)
                  </span>
                ) : budgetLimit > 0 ? (
                  <span className="text-[#30D158] font-medium">
                    {budgetUtilization}% of ₹{budgetLimit.toLocaleString("en-IN")} budget
                  </span>
                ) : (
                  <span className="text-[#8E8E93]">No monthly cap set</span>
                )}

                <span className="text-[#8E8E93] group-hover:text-[#64D2FF] transition-colors flex items-center gap-0.5">
                  Filter <ArrowRight className="w-2.5 h-2.5" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
