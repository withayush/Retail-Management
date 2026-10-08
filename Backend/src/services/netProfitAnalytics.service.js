const mongoose = require("mongoose");
const grossProfitAnalyticsService = require("./grossProfitAnalytics.service");
const opExAnalyticsService = require("./opExAnalytics.service");
const monthlyNetProfitRepository = require("../repositories/monthlyNetProfit.repository");

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
 * Net Profit Analytics Engine Service (Phase 9 - Task T56)
 * The ultimate bottom-line financial truth.
 * Formula: Net Profit = Gross Profit - Operating Expenses (or Revenue - COGS - OpEx).
 * Orchestrates T52 (Revenue), T53 (COGS), T54 (Gross Profit), and T55 (Operating Expenses).
 */
class NetProfitAnalyticsService {
  /**
   * Helper to evaluate bottom-line health rating
   */
  evaluateHealthRating(netProfit, margin) {
    if (netProfit < 0) return "LOSS";
    if (netProfit === 0) return "BREAK_EVEN";
    if (margin < 10) return "SLIM_PROFIT";
    if (margin < 20) return "HEALTHY";
    return "EXCELLENT";
  }

  /**
   * Primary Dynamic Net Profit Aggregator over custom period / active financial ranges
   */
  async calculatePeriodNetProfit(businessId, options = {}) {
    if (!businessId) {
      throw new Error("Business ID is required for multi-tenant isolation.");
    }

    const bId = new mongoose.Types.ObjectId(businessId);

    // 1. Resolve date range from opExAnalytics helper
    const dateRange = opExAnalyticsService.resolveDateRange(options);
    const { startDate, endDate, daysInPeriod, periodType, periodLabel, from, to } = dateRange;

    // 2. Fetch Gross Profit (T54) and OpEx (T55) concurrently
    const [grossProfitData, opExData] = await Promise.all([
      grossProfitAnalyticsService.calculatePeriodGrossProfit(bId, {
        startDate,
        endDate,
      }),
      opExAnalyticsService.calculatePeriodOpEx(bId, options),
    ]);

    const revenue = Math.round((grossProfitData.revenue || 0) * 100) / 100;
    const cogs = Math.round((grossProfitData.cogs || 0) * 100) / 100;
    const grossProfit = Math.round((grossProfitData.grossProfit || 0) * 100) / 100;
    const grossMarginPercentage = grossProfitData.grossMarginPercentage || 0;

    const operatingExpenses = Math.round((opExData.totalOperatingExpense || 0) * 100) / 100;
    const opexToRevenueRatio =
      revenue > 0 ? Math.round(((operatingExpenses / revenue) * 100) * 100) / 100 : 0;

    // 3. Ultimate Bottom-Line Formula
    // Net Profit = Gross Profit - Operating Expenses
    const netProfit = Math.round((grossProfit - operatingExpenses) * 100) / 100;

    // Net Profit Margin % = (Net Profit / Revenue) * 100
    // Zero-revenue safe division
    const netProfitMargin =
      revenue > 0 ? Math.round(((netProfit / revenue) * 100) * 100) / 100 : 0;

    // Operating Profit dual alias
    const operatingProfit = netProfit;
    const operatingMargin = netProfitMargin;

    const coverageRatio =
      operatingExpenses > 0
        ? Math.round((grossProfit / operatingExpenses) * 100) / 100
        : grossProfit > 0
        ? 999
        : 0;

    let status = "BREAK_EVEN";
    if (netProfit > 0) status = "PROFITABLE";
    else if (netProfit < 0) status = "LOSS_MAKING";

    const healthRating = this.evaluateHealthRating(netProfit, netProfitMargin);

    // Cost Breakdown Waterfall Shares
    const cogsShare = revenue > 0 ? Math.round(((cogs / revenue) * 100) * 100) / 100 : 0;
    const opexShare = opexToRevenueRatio;
    const netProfitShare = netProfitMargin;

    return {
      period: {
        from,
        to,
        startDate,
        endDate,
        periodType,
        periodLabel,
        daysInPeriod,
      },
      revenue,
      cogs,
      grossProfit,
      grossMarginPercentage,
      operatingExpenses,
      opexToRevenueRatio,
      netProfit,
      netProfitMargin,
      operatingProfit,
      operatingMargin,
      coverageRatio,
      status,
      healthRating,
      costBreakdown: {
        cogsShare,
        opexShare,
        netProfitShare,
      },
      cashBurn: opExData.cashBurn,
      costStructure: opExData.costStructure,
      categories: opExData.categories,
      productBreakdown: (grossProfitData.productBreakdown || []).slice(0, 10),
      currency: "INR",
      note: "Net Profit reflects true retail business profitability under accrual accounting, not raw cash balance. Credit sales and recognized expenses are accounted for according to transaction dates.",
    };
  }

  /**
   * Calendar Month Aggregator & Materialized Cache Generator
   */
  async aggregateAndCacheMonth(businessId, year, month, trigger = "AUTO_ENGINE") {
    if (!businessId) {
      throw new Error("Business ID is required for multi-tenant isolation.");
    }

    const y = Number(year);
    const m = Number(month);
    const { startDate, endDate, daysInMonth, monthKey, monthName } =
      grossProfitAnalyticsService.getMonthBoundaries(y, m);

    // 1. Fetch Gross Profit and OpEx for the calendar month
    const [gpSummary, opExData] = await Promise.all([
      grossProfitAnalyticsService.aggregateAndCacheMonth(
        businessId,
        y,
        m,
        trigger
      ),
      opExAnalyticsService.calculatePeriodOpEx(businessId, {
        year: y,
        month: m,
      }),
    ]);

    const revenue = Math.round((gpSummary?.revenue || 0) * 100) / 100;
    const cogs = Math.round((gpSummary?.cogs || 0) * 100) / 100;
    const grossProfit = Math.round((gpSummary?.grossProfit || 0) * 100) / 100;
    const grossMarginPercentage = gpSummary?.grossMarginPercentage || 0;

    const operatingExpenses = Math.round((opExData.totalOperatingExpense || 0) * 100) / 100;
    const opexToRevenueRatio =
      revenue > 0 ? Math.round(((operatingExpenses / revenue) * 100) * 100) / 100 : 0;

    const netProfit = Math.round((grossProfit - operatingExpenses) * 100) / 100;
    const netProfitMargin =
      revenue > 0 ? Math.round(((netProfit / revenue) * 100) * 100) / 100 : 0;

    const operatingProfit = netProfit;
    const operatingMargin = netProfitMargin;

    const coverageRatio =
      operatingExpenses > 0
        ? Math.round((grossProfit / operatingExpenses) * 100) / 100
        : grossProfit > 0
        ? 999
        : 0;

    let status = "BREAK_EVEN";
    if (netProfit > 0) status = "PROFITABLE";
    else if (netProfit < 0) status = "LOSS_MAKING";

    const healthRating = this.evaluateHealthRating(netProfit, netProfitMargin);

    const cogsShare = revenue > 0 ? Math.round(((cogs / revenue) * 100) * 100) / 100 : 0;
    const opexShare = opexToRevenueRatio;
    const netProfitShare = netProfitMargin;

    // 2. Synthesize Daily Net Profit Breakdown
    const gpDailyMap = new Map();
    (gpSummary?.dailyBreakdown || []).forEach((d) => gpDailyMap.set(d.day, d));

    const opExDailyMap = new Map();
    (opExData.dailyBurnLedger || []).forEach((d) => {
      const dayNum = Number(d.date.slice(8, 10));
      opExDailyMap.set(dayNum, d.amount);
    });

    const dailyBreakdown = [];
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      const gpDay = gpDailyMap.get(dayNum);
      const dRev = gpDay?.revenue || 0;
      const dCogs = gpDay?.cogs || 0;
      const dGp = gpDay?.grossProfit || 0;
      const dOpEx = opExDailyMap.get(dayNum) || 0;
      const dNetProfit = Math.round((dGp - dOpEx) * 100) / 100;
      const dMargin = dRev > 0 ? Math.round(((dNetProfit / dRev) * 100) * 100) / 100 : 0;

      let dStatus = "BREAK_EVEN";
      if (dNetProfit > 0) dStatus = "PROFIT";
      else if (dNetProfit < 0) dStatus = "LOSS";

      dailyBreakdown.push({
        date: dateStr,
        day: dayNum,
        revenue: dRev,
        cogs: dCogs,
        grossProfit: dGp,
        opex: dOpEx,
        netProfit: dNetProfit,
        margin: dMargin,
        status: dStatus,
      });
    }

    // 3. Retrieve Previous Month for MoM Analytics
    const prevMonthSummary = await monthlyNetProfitRepository.findPreviousMonthSummary(
      businessId,
      y,
      m
    );
    const previousMonthNetProfit = prevMonthSummary ? prevMonthSummary.netProfit : 0;
    const momVariance = Math.round((netProfit - previousMonthNetProfit) * 100) / 100;

    let momGrowthRate = 0;
    if (previousMonthNetProfit !== 0) {
      momGrowthRate =
        Math.round(((momVariance / Math.abs(previousMonthNetProfit)) * 100) * 100) / 100;
    }

    const payload = {
      year: y,
      month: m,
      monthKey,
      monthName,
      startDate,
      endDate,
      revenue,
      cogs,
      grossProfit,
      grossMarginPercentage,
      operatingExpenses,
      opexToRevenueRatio,
      netProfit,
      netProfitMargin,
      operatingProfit,
      operatingMargin,
      coverageRatio,
      status,
      healthRating,
      costBreakdown: {
        cogsShare,
        opexShare,
        netProfitShare,
      },
      dailyBreakdown,
      previousMonthNetProfit,
      momVariance,
      momGrowthRate,
      aggregatedBy: trigger,
    };

    return await monthlyNetProfitRepository.upsertMonthlySummary(
      businessId,
      y,
      m,
      payload
    );
  }

  /**
   * Get single calendar-month Net Profit summary (Hits materialized cache if present)
   */
  async getMonthlyNetProfitSummary(businessId, options = {}) {
    if (!businessId) {
      throw new Error("Business ID is required for multi-tenant isolation.");
    }

    const now = new Date();
    const year = Number(options.year) || now.getUTCFullYear();
    const month = Number(options.month) || now.getUTCMonth() + 1;
    const forceRefresh = options.forceRefresh === true || options.forceRefresh === "true";

    if (!forceRefresh) {
      const cached = await monthlyNetProfitRepository.findByBusinessAndMonth(
        businessId,
        year,
        month
      );
      if (cached) {
        return cached;
      }
    }

    return await this.aggregateAndCacheMonth(
      businessId,
      year,
      month,
      forceRefresh ? "MANUAL_RECALCULATE" : "AUTO_ENGINE"
    );
  }

  /**
   * Current Ongoing Month Net Profit Snapshot
   */
  async getCurrentMonthNetProfit(businessId, options = {}) {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;
    return await this.getMonthlyNetProfitSummary(businessId, {
      year,
      month,
      ...options,
    });
  }

  /**
   * 12-Month Fiscal Year Progression & Annual Bottom-Line Summary
   */
  async getMonthlyNetProfitOverview(businessId, options = {}) {
    if (!businessId) {
      throw new Error("Business ID is required for multi-tenant isolation.");
    }

    const year = Number(options.year) || new Date().getUTCFullYear();
    const forceRefresh = options.forceRefresh === true || options.forceRefresh === "true";

    const months = [];
    for (let m = 1; m <= 12; m++) {
      const mSummary = await this.getMonthlyNetProfitSummary(businessId, {
        year,
        month: m,
        forceRefresh,
      });
      months.push(mSummary);
    }

    const ytdRevenue = months.reduce((acc, m) => acc + (m.revenue || 0), 0);
    const ytdCogs = months.reduce((acc, m) => acc + (m.cogs || 0), 0);
    const ytdGrossProfit = months.reduce((acc, m) => acc + (m.grossProfit || 0), 0);
    const ytdOperatingExpenses = months.reduce((acc, m) => acc + (m.operatingExpenses || 0), 0);
    const ytdNetProfit = Math.round((ytdGrossProfit - ytdOperatingExpenses) * 100) / 100;
    const ytdNetProfitMargin =
      ytdRevenue > 0 ? Math.round(((ytdNetProfit / ytdRevenue) * 100) * 100) / 100 : 0;

    const nonZeroMonths = months.filter((m) => m.revenue > 0 || m.operatingExpenses > 0);
    const averageMonthlyNetProfit =
      nonZeroMonths.length > 0
        ? Math.round((ytdNetProfit / nonZeroMonths.length) * 100) / 100
        : 0;

    let peakMonth = months[0];
    let lowestMonth = months[0];
    months.forEach((m) => {
      if (m.netProfit > peakMonth.netProfit) peakMonth = m;
      if (m.netProfit < lowestMonth.netProfit) lowestMonth = m;
    });

    return {
      year,
      ytdRevenue: Math.round(ytdRevenue * 100) / 100,
      ytdCogs: Math.round(ytdCogs * 100) / 100,
      ytdGrossProfit: Math.round(ytdGrossProfit * 100) / 100,
      ytdOperatingExpenses: Math.round(ytdOperatingExpenses * 100) / 100,
      ytdNetProfit,
      ytdNetProfitMargin,
      averageMonthlyNetProfit,
      peakMonth: {
        month: peakMonth.month,
        monthName: peakMonth.monthName,
        netProfit: peakMonth.netProfit,
        margin: peakMonth.netProfitMargin,
      },
      lowestMonth: {
        month: lowestMonth.month,
        monthName: lowestMonth.monthName,
        netProfit: lowestMonth.netProfit,
        margin: lowestMonth.netProfitMargin,
      },
      months,
    };
  }

  /**
   * Quarterly Net Profit Aggregations (Q1, Q2, Q3, Q4)
   */
  async getQuarterlyNetProfit(businessId, year) {
    if (!businessId) {
      throw new Error("Business ID is required for multi-tenant isolation.");
    }

    const y = Number(year) || new Date().getUTCFullYear();
    const quarters = [];

    for (let q = 1; q <= 4; q++) {
      const qData = await this.calculatePeriodNetProfit(businessId, { year: y, quarter: q });
      quarters.push({
        quarter: `Q${q}`,
        quarterLabel: `Q${q} ${y}`,
        quarterNumber: q,
        from: qData.period.from,
        to: qData.period.to,
        revenue: qData.revenue,
        cogs: qData.cogs,
        grossProfit: qData.grossProfit,
        operatingExpenses: qData.operatingExpenses,
        netProfit: qData.netProfit,
        netProfitMargin: qData.netProfitMargin,
        status: qData.status,
        healthRating: qData.healthRating,
        costBreakdown: qData.costBreakdown,
      });
    }

    const ytdNetProfit = quarters.reduce((acc, q) => acc + q.netProfit, 0);

    return {
      year: y,
      ytdNetProfit: Math.round(ytdNetProfit * 100) / 100,
      quarters,
    };
  }

  /**
   * Daily Net Profit Ledger for a specified month
   */
  async getDailyNetProfitLedger(businessId, year, month) {
    const summary = await this.getMonthlyNetProfitSummary(businessId, {
      year,
      month,
    });
    return {
      year: summary.year,
      month: summary.month,
      monthKey: summary.monthKey,
      netProfit: summary.netProfit,
      netProfitMargin: summary.netProfitMargin,
      dailyBreakdown: summary.dailyBreakdown || [],
    };
  }

  /**
   * Recalculate and refresh cache for a month or full year
   */
  async recalculateMonthlyNetProfit(businessId, options = {}) {
    const year = Number(options.year) || new Date().getUTCFullYear();
    if (options.month) {
      return await this.aggregateAndCacheMonth(
        businessId,
        year,
        Number(options.month),
        "MANUAL_RECALCULATE"
      );
    }

    const results = [];
    for (let m = 1; m <= 12; m++) {
      const res = await this.aggregateAndCacheMonth(
        businessId,
        year,
        m,
        "MANUAL_RECALCULATE"
      );
      results.push(res);
    }
    return results;
  }

  /**
   * Auto-sync hook on sales or expenses change
   */
  async autoSyncOnMutation(businessId, transactionDate) {
    if (!businessId || !transactionDate) return;
    try {
      const d = new Date(transactionDate);
      const year = d.getUTCFullYear();
      const month = d.getUTCMonth() + 1;
      await this.aggregateAndCacheMonth(businessId, year, month, "AUTO_ENGINE");
    } catch (err) {
      console.warn("[NetProfitAnalyticsService] AutoSync warning:", err.message);
    }
  }
}

module.exports = new NetProfitAnalyticsService();
