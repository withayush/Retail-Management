const mongoose = require("mongoose");
const Expense = require("../models/expense.model");
const ExpenseCategory = require("../models/expenseCategory.model");
const monthlyOpExRepository = require("../repositories/monthlyOpEx.repository");

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Monthly OpEx Aggregator Engine Service (Phase 8 - T51)
 * Calculates consolidated operational expenditure totals per calendar month.
 * Implements high-performance aggregation and materialized caching for financial statements.
 */
class MonthlyOpExService {
  /**
   * Helper to compute calendar month UTC boundaries and metadata
   */
  getMonthBoundaries(year, month) {
    const y = Number(year);
    const m = Number(month); // 1-12

    const startDate = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
    // Day 0 of next month is the last day of current month
    const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
    const daysInMonth = new Date(y, m, 0).getDate();

    const monthKey = `${y}-${String(m).padStart(2, "0")}`;
    const monthName = `${MONTH_NAMES[m - 1]} ${y}`;

    return {
      year: y,
      month: m,
      monthKey,
      monthName,
      startDate,
      endDate,
      daysInMonth,
    };
  }

  /**
   * Determine lifecycle status of calendar month
   */
  getMonthStatus(year, month) {
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth() + 1;

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return "FINALIZED";
    }
    if (year === currentYear && month === currentMonth) {
      return "ACTIVE";
    }
    return "PROJECTED";
  }

  /**
   * Primary Engine Aggregator: Computes exact OpEx totals for a calendar month from raw transactions,
   * evaluates MoM variance, enriches category budget leakages, and saves materialized cache.
   */
  async aggregateAndCacheMonth(businessId, year, month, trigger = "AUTO_ENGINE") {
    if (!businessId) {
      throw new Error("Business ID is required for multi-tenant isolation.");
    }

    const {
      year: y,
      month: m,
      monthKey,
      monthName,
      startDate,
      endDate,
      daysInMonth,
    } = this.getMonthBoundaries(year, month);

    const bId = new mongoose.Types.ObjectId(businessId);

    // 1. Run Aggregation Pipeline across raw Expense records
    const [aggregationResults] = await Expense.aggregate([
      {
        $match: {
          businessId: bId,
          isArchived: { $ne: true },
          status: { $ne: "CANCELLED" },
          expenseDate: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $facet: {
          overall: [
            {
              $group: {
                _id: null,
                totalOpEx: { $sum: "$amount" },
                totalTax: { $sum: "$taxAmount" },
                expenseCount: { $sum: 1 },
                avgAmount: { $avg: "$amount" },
              },
            },
          ],
          byCategory: [
            {
              $group: {
                _id: "$categoryId",
                categoryName: { $first: "$categoryName" },
                categoryIcon: { $first: "$categoryIcon" },
                categoryColor: { $first: "$categoryColor" },
                totalAmount: { $sum: "$amount" },
                count: { $sum: 1 },
              },
            },
            { $sort: { totalAmount: -1 } },
          ],
          byPaymentMethod: [
            {
              $group: {
                _id: "$paymentMethod",
                totalAmount: { $sum: "$amount" },
                count: { $sum: 1 },
              },
            },
            { $sort: { totalAmount: -1 } },
          ],
        },
      },
    ]);

    const overall = aggregationResults?.overall?.[0] || {
      totalOpEx: 0,
      totalTax: 0,
      expenseCount: 0,
      avgAmount: 0,
    };

    const rawCategoryList = aggregationResults?.byCategory || [];
    const rawPaymentMethods = aggregationResults?.byPaymentMethod || [];

    const totalOpEx = overall.totalOpEx || 0;
    const totalTax = overall.totalTax || 0;
    const expenseCount = overall.expenseCount || 0;
    const averageExpense = Math.round(overall.avgAmount || 0);

    // Calculate daily average burn rate
    const now = new Date();
    const isCurrentMonth = y === now.getUTCFullYear() && m === now.getUTCMonth() + 1;
    const daysElapsed = isCurrentMonth ? Math.max(1, now.getUTCDate()) : daysInMonth;
    const averageDailyOpEx = Math.round((totalOpEx / daysElapsed) * 100) / 100;

    // 2. Fetch category master documents for budget caps and leakage calculation
    const allCategories = await ExpenseCategory.find({
      businessId,
      isArchived: { $ne: true },
    }).lean();
    const catMap = new Map(allCategories.map((c) => [c._id.toString(), c]));

    const categoryBreakdown = rawCategoryList.map((item) => {
      const catIdStr = item._id ? item._id.toString() : "";
      const catDoc = catMap.get(catIdStr);
      const budgetLimit = catDoc?.budgetLimit || 0;
      const amount = item.totalAmount || 0;
      const percentage = totalOpEx > 0
        ? Math.round((amount / totalOpEx) * 1000) / 10
        : 0;

      return {
        categoryId: item._id,
        categoryName: item.categoryName || catDoc?.categoryName || "Uncategorized",
        categoryIcon: item.categoryIcon || catDoc?.icon || "Tag",
        categoryColor: item.categoryColor || catDoc?.color || "#8E8E93",
        totalAmount: amount,
        count: item.count || 0,
        percentage,
        budgetLimit,
        isOverBudget: budgetLimit > 0 && amount > budgetLimit,
        budgetVariance: budgetLimit > 0 ? amount - budgetLimit : 0,
      };
    });

    const paymentMethodBreakdown = rawPaymentMethods.map((pm) => ({
      method: pm._id || "CASH",
      totalAmount: pm.totalAmount || 0,
      count: pm.count || 0,
      percentage: totalOpEx > 0
        ? Math.round((pm.totalAmount / totalOpEx) * 1000) / 10
        : 0,
    }));

    // 3. Month-over-Month (MoM) Variance Calculation
    let prevYear = y;
    let prevMonth = m - 1;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = y - 1;
    }

    let previousMonthSummary = await monthlyOpExRepository.findByBusinessAndMonth(
      businessId,
      prevYear,
      prevMonth
    );

    // If previous month summary is not yet cached, run quick aggregation for it
    if (!previousMonthSummary) {
      const prevBoundaries = this.getMonthBoundaries(prevYear, prevMonth);
      const prevAgg = await Expense.aggregate([
        {
          $match: {
            businessId: bId,
            isArchived: { $ne: true },
            status: { $ne: "CANCELLED" },
            expenseDate: { $gte: prevBoundaries.startDate, $lte: prevBoundaries.endDate },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]);
      const prevTotal = prevAgg?.[0]?.total || 0;
      previousMonthSummary = { totalOpEx: prevTotal };
    }

    const previousMonthOpEx = previousMonthSummary?.totalOpEx || 0;
    const momVariance = totalOpEx - previousMonthOpEx;
    let momGrowthRate = 0;
    if (previousMonthOpEx > 0) {
      momGrowthRate = Math.round(((totalOpEx - previousMonthOpEx) / previousMonthOpEx) * 1000) / 10;
    } else if (previousMonthOpEx === 0 && totalOpEx > 0) {
      momGrowthRate = 100;
    }

    const status = this.getMonthStatus(y, m);

    // 4. Upsert Consolidated Materialized Cache
    const materializedSummary = await monthlyOpExRepository.upsertMonthlySummary(
      businessId,
      y,
      m,
      {
        monthName,
        startDate,
        endDate,
        totalOpEx,
        totalTax,
        expenseCount,
        averageExpense,
        averageDailyOpEx,
        categoryBreakdown,
        paymentMethodBreakdown,
        previousMonthOpEx,
        momVariance,
        momGrowthRate,
        status,
        aggregatedBy: trigger,
      }
    );

    return materializedSummary;
  }

  /**
   * Get single calendar month OpEx summary.
   * Reads from materialized cache if present (unless forceRefresh is true).
   */
  async getMonthlyOpExSummary(businessId, { year, month, forceRefresh = false }) {
    if (!businessId) throw new Error("Business ID is required.");

    const now = new Date();
    const targetYear = Number(year) || now.getUTCFullYear();
    const targetMonth = Number(month) || now.getUTCMonth() + 1;

    if (!forceRefresh) {
      const cached = await monthlyOpExRepository.findByBusinessAndMonth(
        businessId,
        targetYear,
        targetMonth
      );
      if (cached) return cached;
    }

    // Run engine and materialize cache
    return await this.aggregateAndCacheMonth(
      businessId,
      targetYear,
      targetMonth,
      forceRefresh ? "MANUAL_RECALCULATE" : "AUTO_ENGINE"
    );
  }

  /**
   * Get current calendar month OpEx summary
   */
  async getCurrentMonthOpEx(businessId, forceRefresh = false) {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;

    return await this.getMonthlyOpExSummary(businessId, {
      year,
      month,
      forceRefresh,
    });
  }

  /**
   * Get full calendar year OpEx progression & executive metrics for financial statements
   */
  async getYearlyOpExOverview(businessId, year, { forceRefresh = false } = {}) {
    if (!businessId) throw new Error("Business ID is required.");

    const now = new Date();
    const targetYear = Number(year) || now.getUTCFullYear();

    // If forceRefresh, sweep and re-aggregate all months for that year
    if (forceRefresh) {
      await this.recalculateYear(businessId, targetYear);
    }

    let summaries = await monthlyOpExRepository.findByBusinessAndYear(
      businessId,
      targetYear
    );

    // If no summaries exist at all, populate current year's active months
    if (!summaries || summaries.length === 0) {
      await this.recalculateYear(businessId, targetYear);
      summaries = await monthlyOpExRepository.findByBusinessAndYear(
        businessId,
        targetYear
      );
    }

    const summaryMap = new Map(summaries.map((s) => [s.month, s]));

    // Build complete 12-calendar-month array (Jan to Dec)
    const monthsList = [];
    let totalYearlyOpEx = 0;
    let totalYearlyTax = 0;
    let totalYearlyExpensesCount = 0;
    let activeMonthsCount = 0;

    let peakMonth = { month: 1, monthName: "January", amount: 0 };
    let lowestMonth = { month: 1, monthName: "January", amount: Infinity };

    for (let m = 1; m <= 12; m++) {
      const existing = summaryMap.get(m);
      const monthMeta = this.getMonthBoundaries(targetYear, m);

      if (existing) {
        monthsList.push(existing);
        totalYearlyOpEx += existing.totalOpEx || 0;
        totalYearlyTax += existing.totalTax || 0;
        totalYearlyExpensesCount += existing.expenseCount || 0;

        if (existing.totalOpEx > 0) {
          activeMonthsCount++;
          if (existing.totalOpEx > peakMonth.amount) {
            peakMonth = {
              month: m,
              monthName: monthMeta.monthName,
              amount: existing.totalOpEx,
            };
          }
          if (existing.totalOpEx < lowestMonth.amount) {
            lowestMonth = {
              month: m,
              monthName: monthMeta.monthName,
              amount: existing.totalOpEx,
            };
          }
        }
      } else {
        // Placeholder for unrecorded future/empty month
        monthsList.push({
          businessId,
          year: targetYear,
          month: m,
          monthKey: monthMeta.monthKey,
          monthName: monthMeta.monthName,
          startDate: monthMeta.startDate,
          endDate: monthMeta.endDate,
          totalOpEx: 0,
          totalTax: 0,
          expenseCount: 0,
          averageExpense: 0,
          averageDailyOpEx: 0,
          categoryBreakdown: [],
          paymentMethodBreakdown: [],
          previousMonthOpEx: 0,
          momVariance: 0,
          momGrowthRate: 0,
          status: this.getMonthStatus(targetYear, m),
          lastAggregatedAt: null,
          aggregatedBy: "AUTO_ENGINE",
        });
      }
    }

    if (lowestMonth.amount === Infinity) {
      lowestMonth = { month: 1, monthName: "January", amount: 0 };
    }

    const averageMonthlyOpEx = activeMonthsCount > 0
      ? Math.round(totalYearlyOpEx / activeMonthsCount)
      : 0;

    // Current active month summary
    const currentMonthNum = now.getUTCMonth() + 1;
    const currentMonthSummary = summaryMap.get(currentMonthNum) || monthsList[currentMonthNum - 1];

    return {
      year: targetYear,
      totalYearlyOpEx,
      totalYearlyTax,
      totalYearlyExpensesCount,
      activeMonthsCount,
      averageMonthlyOpEx,
      peakMonth,
      lowestMonth,
      currentMonthSummary,
      months: monthsList,
    };
  }

  /**
   * Recalculate specific calendar month on demand
   */
  async recalculateMonth(businessId, year, month) {
    return await this.aggregateAndCacheMonth(
      businessId,
      year,
      month,
      "MANUAL_RECALCULATE"
    );
  }

  /**
   * Sweep and recalculate all active months for a given calendar year
   */
  async recalculateYear(businessId, year) {
    if (!businessId) throw new Error("Business ID is required.");
    const targetYear = Number(year) || new Date().getUTCFullYear();

    // Find all distinct months where expenses were recorded in that year
    const startOfYear = new Date(Date.UTC(targetYear, 0, 1, 0, 0, 0, 0));
    const endOfYear = new Date(Date.UTC(targetYear, 11, 31, 23, 59, 59, 999));

    const distinctMonths = await Expense.distinct("expenseDate", {
      businessId: new mongoose.Types.ObjectId(businessId),
      isArchived: { $ne: true },
      status: { $ne: "CANCELLED" },
      expenseDate: { $gte: startOfYear, $lte: endOfYear },
    });

    const monthSet = new Set();
    distinctMonths.forEach((d) => {
      const dateObj = new Date(d);
      monthSet.add(dateObj.getUTCMonth() + 1);
    });

    // Always include current month if targeting current year
    const now = new Date();
    if (targetYear === now.getUTCFullYear()) {
      monthSet.add(now.getUTCMonth() + 1);
    }

    // Always ensure at least month 1 is evaluated if set is empty
    if (monthSet.size === 0) {
      monthSet.add(1);
    }

    const sortedMonths = Array.from(monthSet).sort((a, b) => a - b);
    const results = [];
    for (const m of sortedMonths) {
      const summary = await this.aggregateAndCacheMonth(
        businessId,
        targetYear,
        m,
        "MANUAL_RECALCULATE"
      );
      results.push(summary);
    }

    return results;
  }

  /**
   * Automatic Real-Time Cache Sync Hook
   * Invoked after T49 Expense creation, update, or archival to guarantee zero staleness.
   */
  async autoSyncOnExpenseChange(businessId, expenseDate) {
    if (!businessId || !expenseDate) return;

    try {
      const dateObj = new Date(expenseDate);
      if (isNaN(dateObj.getTime())) return;

      const year = dateObj.getUTCFullYear();
      const month = dateObj.getUTCMonth() + 1;

      // Recalculate this month
      await this.aggregateAndCacheMonth(businessId, year, month, "AUTO_ENGINE");

      // Also recalculate next month (if it exists) to keep its MoM accurate
      let nextYear = year;
      let nextMonth = month + 1;
      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear = year + 1;
      }

      const nextMonthExists = await monthlyOpExRepository.findByBusinessAndMonth(
        businessId,
        nextYear,
        nextMonth
      );
      if (nextMonthExists) {
        await this.aggregateAndCacheMonth(businessId, nextYear, nextMonth, "AUTO_ENGINE");
      }
    } catch (err) {
      console.error("[MonthlyOpExService] AutoSync warning:", err.message);
    }
  }
}

module.exports = new MonthlyOpExService();
