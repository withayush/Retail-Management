const mongoose = require("mongoose");
const Expense = require("../models/expense.model");
const MonthlyOpExSummary = require("../models/monthlyOpExSummary.model");
const monthlyOpExRepository = require("../repositories/monthlyOpEx.repository");
const cogsAnalyticsService = require("./cogsAnalytics.service");

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

const FIXED_CATEGORIES_REGEX = /rent|salary|salaries|wage|payroll|internet|phone|broadband|software|saas|subscription|insurance|lease/i;

/**
 * Operating Expense Analytics Engine Service (Phase 9 - Task T55)
 * Consolidator: SUM(All Expenses) over active financial month ranges, quarters, and custom periods.
 * Essential layer for mapping store cash burns, fixed vs variable structures, and operating profitability.
 */
class OpExAnalyticsService {
  /**
   * Helper to resolve start & end dates from diverse period options
   */
  resolveDateRange(options = {}) {
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth() + 1;

    let startDate;
    let endDate;
    let periodType = options.periodType || "CUSTOM";
    let periodLabel = "";

    // 1. Month string ("2026-10") or numeric year + month
    if (options.month) {
      let y = currentYear;
      let m = currentMonth;
      if (typeof options.month === "string" && options.month.includes("-")) {
        const parts = options.month.split("-");
        y = Number(parts[0]);
        m = Number(parts[1]);
      } else {
        m = Number(options.month);
        y = Number(options.year) || currentYear;
      }
      startDate = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
      periodType = "MONTH";
      periodLabel = `${MONTH_NAMES[m - 1]} ${y}`;
    }
    // 2. Quarter (1, 2, 3, 4)
    else if (options.quarter) {
      const q = Math.max(1, Math.min(4, Number(options.quarter)));
      const y = Number(options.year) || currentYear;
      const startMonth = (q - 1) * 3; // 0, 3, 6, 9
      const endMonth = startMonth + 3; // 3, 6, 9, 12
      startDate = new Date(Date.UTC(y, startMonth, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(y, endMonth, 0, 23, 59, 59, 999));
      periodType = "QUARTER";
      periodLabel = `Q${q} ${y}`;
    }
    // 3. YTD (Year-to-Date)
    else if (options.periodType === "YTD" || options.ytd) {
      const y = Number(options.year) || currentYear;
      startDate = new Date(Date.UTC(y, 0, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999));
      periodType = "YTD";
      periodLabel = `FY ${y} YTD`;
    }
    // 4. Custom date range (from / to or startDate / endDate)
    else if (options.from || options.to || options.startDate || options.endDate) {
      const rawFrom = options.from || options.startDate;
      const rawTo = options.to || options.endDate;

      startDate = rawFrom ? new Date(rawFrom) : new Date(Date.UTC(currentYear, currentMonth - 1, 1, 0, 0, 0, 0));
      endDate = rawTo ? new Date(rawTo) : new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59, 999));

      // Normalize boundaries
      startDate.setUTCHours(0, 0, 0, 0);
      endDate.setUTCHours(23, 59, 59, 999);

      periodType = "CUSTOM";
      periodLabel = `${startDate.toISOString().slice(0, 10)} to ${endDate.toISOString().slice(0, 10)}`;
    }
    // 5. Default: Current Calendar Month
    else {
      startDate = new Date(Date.UTC(currentYear, currentMonth - 1, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59, 999));
      periodType = "MONTH";
      periodLabel = `${MONTH_NAMES[currentMonth - 1]} ${currentYear}`;
    }

    const diffMs = endDate.getTime() - startDate.getTime();
    const daysInPeriod = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));

    return {
      startDate,
      endDate,
      daysInPeriod,
      periodType,
      periodLabel,
      from: startDate.toISOString().slice(0, 10),
      to: endDate.toISOString().slice(0, 10),
    };
  }

  /**
   * Primary Consolidator: SUM(All Expenses) over active financial period
   * Maps cash burns, category distributions, fixed vs variable costs, and P&L financial bridge.
   */
  async calculatePeriodOpEx(businessId, options = {}) {
    if (!businessId) {
      throw new Error("Business ID is required for multi-tenant isolation.");
    }

    const bId = new mongoose.Types.ObjectId(businessId);
    const dateRange = this.resolveDateRange(options);
    const { startDate, endDate, daysInPeriod, periodType, periodLabel, from, to } = dateRange;

    // 1. Run Aggregation Pipeline across raw Expense records strictly on expenseDate
    const [rawResults] = await Expense.aggregate([
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
          // Overall Aggregates
          totals: [
            {
              $group: {
                _id: null,
                totalOperatingExpense: { $sum: "$amount" },
                totalTax: { $sum: "$taxAmount" },
                expenseCount: { $sum: 1 },
                averageExpense: { $avg: "$amount" },
              },
            },
          ],
          // Category-wise Breakdown
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
          // Payment Method Distribution
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
          // Daily Burn Flow
          byDay: [
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$expenseDate" } },
                date: { $first: { $dateToString: { format: "%Y-%m-%d", date: "$expenseDate" } } },
                amount: { $sum: "$amount" },
                count: { $sum: 1 },
                topCategory: { $first: "$categoryName" },
              },
            },
            { $sort: { date: 1 } },
          ],
        },
      },
    ]);

    const totalsObj = rawResults?.totals?.[0] || {};
    const totalOperatingExpense = Math.round((totalsObj.totalOperatingExpense || 0) * 100) / 100;
    const totalTax = Math.round((totalsObj.totalTax || 0) * 100) / 100;
    const expenseCount = totalsObj.expenseCount || 0;
    const averageExpense =
      expenseCount > 0 ? Math.round((totalOperatingExpense / expenseCount) * 100) / 100 : 0;

    // 2. Process Categories & Classify Fixed vs Variable Overheads
    let fixedOpEx = 0;
    let variableOpEx = 0;

    const rawCategories = rawResults?.byCategory || [];
    const categories = rawCategories.map((c) => {
      const amount = Math.round((c.totalAmount || 0) * 100) / 100;
      const percentage =
        totalOperatingExpense > 0
          ? Math.round(((amount / totalOperatingExpense) * 100) * 100) / 100
          : 0;

      const isFixed = FIXED_CATEGORIES_REGEX.test(c.categoryName || "");
      if (isFixed) {
        fixedOpEx += amount;
      } else {
        variableOpEx += amount;
      }

      return {
        categoryId: c._id,
        categoryName: c.categoryName || "General",
        categoryIcon: c.categoryIcon || "Tag",
        categoryColor: c.categoryColor || "#8E8E93",
        amount,
        count: c.count || 0,
        percentage,
        classification: isFixed ? "FIXED_OVERHEAD" : "VARIABLE_OPERATING",
      };
    });

    fixedOpEx = Math.round(fixedOpEx * 100) / 100;
    variableOpEx = Math.round(variableOpEx * 100) / 100;
    const fixedPercentage =
      totalOperatingExpense > 0
        ? Math.round(((fixedOpEx / totalOperatingExpense) * 100) * 100) / 100
        : 0;
    const variablePercentage =
      totalOperatingExpense > 0
        ? Math.round(((variableOpEx / totalOperatingExpense) * 100) * 100) / 100
        : 0;

    // 3. Process Payment Methods
    const paymentMethods = (rawResults?.byPaymentMethod || []).map((pm) => {
      const amount = Math.round((pm.totalAmount || 0) * 100) / 100;
      const percentage =
        totalOperatingExpense > 0
          ? Math.round(((amount / totalOperatingExpense) * 100) * 100) / 100
          : 0;
      return {
        method: pm._id || "CASH",
        amount,
        count: pm.count || 0,
        percentage,
      };
    });

    // 4. Store Cash Burn Velocity Mapping
    const dailyBurnLedger = (rawResults?.byDay || []).map((d) => ({
      date: d.date,
      amount: Math.round((d.amount || 0) * 100) / 100,
      count: d.count || 0,
      topCategory: d.topCategory || "General",
      shareOfPeriodBurn:
        totalOperatingExpense > 0
          ? Math.round(((d.amount / totalOperatingExpense) * 100) * 100) / 100
          : 0,
    }));

    const activeExpenseDays = dailyBurnLedger.length;
    const dailyBurnRate = Math.round((totalOperatingExpense / (daysInPeriod || 1)) * 100) / 100;
    const activeDailyBurnRate =
      Math.round((totalOperatingExpense / (activeExpenseDays || 1)) * 100) / 100;
    const annualizedRunRate = Math.round(dailyBurnRate * 365 * 100) / 100;
    const projectedMonthlyBurn = Math.round(dailyBurnRate * 30 * 100) / 100;

    let peakBurnDay = null;
    if (dailyBurnLedger.length > 0) {
      const sortedByAmount = [...dailyBurnLedger].sort((a, b) => b.amount - a.amount);
      peakBurnDay = sortedByAmount[0];
    }

    // 5. Connect into Financial Performance Bridge (T52 Revenue + T53 COGS + T54 Gross Profit -> Operating Profit)
    let financialBridge = {
      revenue: 0,
      cogs: 0,
      grossProfit: 0,
      grossMarginPercentage: 0,
      operatingProfit: Math.round(-totalOperatingExpense * 100) / 100,
      operatingMarginPercentage: 0,
      opexToRevenueRatio: 0,
      coverageRatio: 0,
      profitabilityStatus: totalOperatingExpense === 0 ? "BREAK_EVEN" : "CASH_BURNING",
    };

    try {
      const cogsPeriodData = await cogsAnalyticsService.calculatePeriodCogs(bId, {
        startDate,
        endDate,
      });

      const rev = Math.round((cogsPeriodData?.totalRevenue || 0) * 100) / 100;
      const cogsVal = Math.round((cogsPeriodData?.totalCogs || 0) * 100) / 100;
      const gp = Math.round((rev - cogsVal) * 100) / 100;
      const gpMargin = rev > 0 ? Math.round(((gp / rev) * 100) * 100) / 100 : 0;

      const opProfit = Math.round((gp - totalOperatingExpense) * 100) / 100;
      const opMargin = rev > 0 ? Math.round(((opProfit / rev) * 100) * 100) / 100 : 0;
      const opexBurden = rev > 0 ? Math.round(((totalOperatingExpense / rev) * 100) * 100) / 100 : 0;
      const coverage =
        totalOperatingExpense > 0
          ? Math.round((gp / totalOperatingExpense) * 100) / 100
          : gp > 0
          ? 999
          : 0;

      let status = "BREAK_EVEN";
      if (opProfit > 0) status = "PROFITABLE";
      else if (opProfit < 0) status = "CASH_BURNING";

      financialBridge = {
        revenue: rev,
        cogs: cogsVal,
        grossProfit: gp,
        grossMarginPercentage: gpMargin,
        operatingProfit: opProfit,
        operatingMarginPercentage: opMargin,
        opexToRevenueRatio: opexBurden,
        coverageRatio: coverage,
        profitabilityStatus: status,
      };
    } catch (bridgeErr) {
      console.warn("[OpExAnalyticsService] Financial Bridge Warning:", bridgeErr.message);
    }

    return {
      period: {
        from,
        to,
        startDate,
        endDate,
        periodType,
        periodLabel,
        daysInPeriod,
        activeExpenseDays,
      },
      totalOperatingExpense,
      totalTax,
      expenseCount,
      averageExpense,
      currency: "INR",
      cashBurn: {
        dailyBurnRate,
        activeDailyBurnRate,
        projectedMonthlyBurn,
        annualizedRunRate,
        peakBurnDay,
      },
      costStructure: {
        fixedOpEx,
        variableOpEx,
        fixedPercentage,
        variablePercentage,
      },
      categories,
      paymentMethods,
      dailyBurnLedger,
      financialBridge,
    };
  }

  /**
   * Quarterly OpEx Aggregations (Q1, Q2, Q3, Q4) for a Fiscal Year
   */
  async getQuarterlyOpExAggregations(businessId, year) {
    if (!businessId) {
      throw new Error("Business ID is required for multi-tenant isolation.");
    }

    const y = Number(year) || new Date().getUTCFullYear();
    const quarters = [];

    for (let q = 1; q <= 4; q++) {
      const qData = await this.calculatePeriodOpEx(businessId, { year: y, quarter: q });
      quarters.push({
        quarter: `Q${q}`,
        quarterLabel: `Q${q} ${y}`,
        quarterNumber: q,
        from: qData.period.from,
        to: qData.period.to,
        totalOperatingExpense: qData.totalOperatingExpense,
        expenseCount: qData.expenseCount,
        dailyBurnRate: qData.cashBurn.dailyBurnRate,
        costStructure: qData.costStructure,
        topCategories: (qData.categories || []).slice(0, 3),
        financialBridge: qData.financialBridge,
      });
    }

    const ytdTotalOpEx = quarters.reduce((acc, q) => acc + q.totalOperatingExpense, 0);
    const averageQuarterlyOpEx = Math.round((ytdTotalOpEx / 4) * 100) / 100;

    let peakQuarter = quarters[0];
    quarters.forEach((q) => {
      if (q.totalOperatingExpense > peakQuarter.totalOperatingExpense) {
        peakQuarter = q;
      }
    });

    return {
      year: y,
      ytdTotalOpEx: Math.round(ytdTotalOpEx * 100) / 100,
      averageQuarterlyOpEx,
      peakQuarter: {
        quarter: peakQuarter.quarter,
        amount: peakQuarter.totalOperatingExpense,
      },
      quarters,
    };
  }

  /**
   * 12-Month Calendar Year Financial Progression (OpEx, Cash Burns & Operating Profit)
   */
  async getMonthlyOpExFinancialOverview(businessId, year) {
    if (!businessId) {
      throw new Error("Business ID is required for multi-tenant isolation.");
    }

    const y = Number(year) || new Date().getUTCFullYear();
    const months = [];

    // 1. Fetch pre-cached monthly OpEx summaries if present
    const cachedSummaries = await monthlyOpExRepository.findByBusinessAndYear(businessId, y);
    const cacheMap = new Map();
    (cachedSummaries || []).forEach((c) => cacheMap.set(c.month, c));

    for (let m = 1; m <= 12; m++) {
      const monthKey = `${y}-${String(m).padStart(2, "0")}`;
      const monthName = `${MONTH_NAMES[m - 1]} ${y}`;

      const cached = cacheMap.get(m);
      let monthOpExData;

      if (cached && cached.totalOpEx > 0) {
        // Reuse cached OpEx summary and build financial bridge
        const { startDate, endDate, daysInPeriod } = this.resolveDateRange({
          year: y,
          month: m,
        });

        let bridge = {
          revenue: 0,
          grossProfit: 0,
          operatingProfit: -cached.totalOpEx,
          operatingMarginPercentage: 0,
        };

        try {
          const cogsData = await cogsAnalyticsService.calculatePeriodCogs(businessId, {
            startDate,
            endDate,
          });
          const rev = cogsData?.totalRevenue || 0;
          const gp = rev - (cogsData?.totalCogs || 0);
          const op = gp - cached.totalOpEx;
          bridge = {
            revenue: Math.round(rev * 100) / 100,
            grossProfit: Math.round(gp * 100) / 100,
            operatingProfit: Math.round(op * 100) / 100,
            operatingMarginPercentage:
              rev > 0 ? Math.round(((op / rev) * 100) * 100) / 100 : 0,
          };
        } catch (_) {}

        const dailyBurn = Math.round((cached.totalOpEx / (daysInPeriod || 30)) * 100) / 100;

        monthOpExData = {
          month: m,
          monthKey,
          monthName,
          totalOperatingExpense: cached.totalOpEx,
          expenseCount: cached.expenseCount || 0,
          dailyBurnRate: dailyBurn,
          financialBridge: bridge,
          status: cached.status || "FINALIZED",
        };
      } else {
        // Calculate on the fly
        const periodData = await this.calculatePeriodOpEx(businessId, { year: y, month: m });
        monthOpExData = {
          month: m,
          monthKey,
          monthName,
          totalOperatingExpense: periodData.totalOperatingExpense,
          expenseCount: periodData.expenseCount,
          dailyBurnRate: periodData.cashBurn.dailyBurnRate,
          financialBridge: periodData.financialBridge,
          status: periodData.totalOperatingExpense > 0 ? "FINALIZED" : "EMPTY",
        };
      }

      months.push(monthOpExData);
    }

    const ytdTotalOpEx = months.reduce((acc, m) => acc + m.totalOperatingExpense, 0);
    const ytdRevenue = months.reduce((acc, m) => acc + (m.financialBridge?.revenue || 0), 0);
    const ytdGrossProfit = months.reduce((acc, m) => acc + (m.financialBridge?.grossProfit || 0), 0);
    const ytdOperatingProfit = Math.round((ytdGrossProfit - ytdTotalOpEx) * 100) / 100;
    const ytdOperatingMargin =
      ytdRevenue > 0 ? Math.round(((ytdOperatingProfit / ytdRevenue) * 100) * 100) / 100 : 0;

    const nonZeroMonths = months.filter((m) => m.totalOperatingExpense > 0);
    const averageMonthlyOpEx =
      nonZeroMonths.length > 0
        ? Math.round((ytdTotalOpEx / nonZeroMonths.length) * 100) / 100
        : 0;

    let peakMonth = months[0];
    months.forEach((m) => {
      if (m.totalOperatingExpense > peakMonth.totalOperatingExpense) {
        peakMonth = m;
      }
    });

    return {
      year: y,
      ytdTotalOpEx: Math.round(ytdTotalOpEx * 100) / 100,
      ytdRevenue: Math.round(ytdRevenue * 100) / 100,
      ytdGrossProfit: Math.round(ytdGrossProfit * 100) / 100,
      ytdOperatingProfit,
      ytdOperatingMargin,
      averageMonthlyOpEx,
      peakMonth: {
        month: peakMonth.month,
        monthName: peakMonth.monthName,
        amount: peakMonth.totalOperatingExpense,
      },
      months,
    };
  }

  /**
   * Daily Cash Burn Ledger for a specific month
   */
  async getDailyCashBurnLedger(businessId, year, month) {
    const periodData = await this.calculatePeriodOpEx(businessId, {
      year,
      month,
    });
    return {
      period: periodData.period,
      totalOperatingExpense: periodData.totalOperatingExpense,
      dailyBurnRate: periodData.cashBurn.dailyBurnRate,
      peakBurnDay: periodData.cashBurn.peakBurnDay,
      dailyBurnLedger: periodData.dailyBurnLedger,
    };
  }

  /**
   * Current Active Month Snapshot with Cash Burn Trajectory
   */
  async getCurrentMonthOpExAnalytics(businessId, options = {}) {
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth() + 1;

    return await this.calculatePeriodOpEx(businessId, {
      year: currentYear,
      month: currentMonth,
      ...options,
    });
  }
}

module.exports = new OpExAnalyticsService();
