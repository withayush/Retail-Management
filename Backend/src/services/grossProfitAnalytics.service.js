const mongoose = require("mongoose");
const revenueAnalyticsService = require("./revenueAnalytics.service");
const cogsAnalyticsService = require("./cogsAnalytics.service");
const monthlyGrossProfitRepository = require("../repositories/monthlyGrossProfit.repository");
const monthlyRevenueRepository = require("../repositories/monthlyRevenue.repository");
const monthlyCogsRepository = require("../repositories/monthlyCogs.repository");
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
 * Gross Profit Analytics Engine Service (Phase 9 - Task T54)
 * Combines T52 (Revenue) and T53 (COGS) to calculate:
 *   Gross Profit = Revenue - COGS
 *   GP Margin % = (Gross Profit / Revenue) * 100
 * Bridges with T51 (OpEx) for Operating Profit = Gross Profit - OpEx.
 * Provides vital business health checks and profitability matrix.
 */
class GrossProfitAnalyticsService {
  /**
   * Helper to compute calendar month UTC boundaries and metadata
   */
  getMonthBoundaries(year, month) {
    const y = Number(year);
    const m = Number(month); // 1-12

    const startDate = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
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
   * Determine margin health status
   */
  evaluateMarginHealth(marginPercentage) {
    if (marginPercentage >= 30) return "HEALTHY";
    if (marginPercentage >= 15) return "MODERATE";
    if (marginPercentage >= 0) return "LOW";
    return "CRITICAL_NEGATIVE";
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
    return "ACTIVE";
  }

  /**
   * Dynamic Gross Profit & Margin Calculation over custom period / date range
   */
  async calculatePeriodGrossProfit(businessId, filters = {}) {
    if (!businessId) {
      throw new Error("Business ID is required for multi-tenant isolation.");
    }

    const bId = new mongoose.Types.ObjectId(businessId);

    // Delegate granular line item aggregates to COGS analytics service
    const cogsData = await cogsAnalyticsService.calculatePeriodCogs(bId, filters);

    const revenue = Math.round((cogsData.totalRevenue || 0) * 100) / 100;
    const cogs = Math.round((cogsData.totalCogs || 0) * 100) / 100;
    const grossProfit = Math.round((revenue - cogs) * 100) / 100;

    // Gracefully handle zero revenue without NaN or Infinity
    const grossMarginPercentage =
      revenue > 0 ? Math.round(((grossProfit / revenue) * 100) * 100) / 100 : 0;

    const marginHealth = this.evaluateMarginHealth(grossMarginPercentage);

    // Enrich product breakdown with profit contribution %
    const productBreakdown = (cogsData.productBreakdown || []).map((p) => {
      const pContribution =
        grossProfit > 0
          ? Math.round(((p.grossProfit / grossProfit) * 100) * 100) / 100
          : 0;
      return {
        ...p,
        profitContributionPercentage: pContribution,
      };
    });

    return {
      revenue,
      cogs,
      grossProfit,
      grossMarginPercentage,
      marginHealth,
      totalUnitsSold: cogsData.totalUnitsSold || 0,
      invoiceCount: cogsData.invoiceCount || 0,
      averageGrossProfitPerOrder:
        cogsData.invoiceCount > 0
          ? Math.round((grossProfit / cogsData.invoiceCount) * 100) / 100
          : 0,
      productBreakdown,
      dailyMap: cogsData.dailyMap,
    };
  }

  /**
   * Core Aggregator: Unites T52 Revenue and T53 COGS for a calendar month
   * and caches into MonthlyGrossProfitSummary
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

    // 1. Fetch / Sync T52 Revenue Summary
    let revenueSummary = await monthlyRevenueRepository.findByBusinessAndMonth(
      bId,
      y,
      m
    );
    if (!revenueSummary || trigger === "MANUAL_RECALCULATE") {
      revenueSummary = await revenueAnalyticsService.aggregateAndCacheMonth(
        bId,
        y,
        m,
        trigger
      );
    }

    // 2. Fetch / Sync T53 COGS Summary
    let cogsSummary = await monthlyCogsRepository.findByBusinessAndMonth(
      bId,
      y,
      m
    );
    if (!cogsSummary || trigger === "MANUAL_RECALCULATE") {
      cogsSummary = await cogsAnalyticsService.aggregateAndCacheMonth(
        bId,
        y,
        m,
        trigger
      );
    }

    // 3. Fetch T51 OpEx Summary (if exists for operating profit bridge)
    let opExSummary = await monthlyOpExRepository.findByBusinessAndMonth(
      bId,
      y,
      m
    );

    // 4. Mathematical Calculations
    const revenue = Math.round((revenueSummary?.totalRevenue || 0) * 100) / 100;
    const cogs = Math.round((cogsSummary?.totalCogs || 0) * 100) / 100;
    const grossProfit = Math.round((revenue - cogs) * 100) / 100;

    // Zero-revenue guard
    const grossMarginPercentage =
      revenue > 0 ? Math.round(((grossProfit / revenue) * 100) * 100) / 100 : 0;

    const opEx = Math.round((opExSummary?.totalOpEx || 0) * 100) / 100;
    const operatingProfit = Math.round((grossProfit - opEx) * 100) / 100;
    const operatingMarginPercentage =
      revenue > 0 ? Math.round(((operatingProfit / revenue) * 100) * 100) / 100 : 0;

    const marginHealth = this.evaluateMarginHealth(grossMarginPercentage);

    const totalUnitsSold = cogsSummary?.totalUnitsSold || 0;
    const invoiceCount = revenueSummary?.invoiceCount || 0;
    const averageGrossProfitPerOrder =
      invoiceCount > 0 ? Math.round((grossProfit / invoiceCount) * 100) / 100 : 0;

    // 5. Daily Breakdown Timeline Fusion
    const cogsDailyMap = new Map();
    (cogsSummary?.dailyBreakdown || []).forEach((d) => cogsDailyMap.set(d.day, d));

    const dailyBreakdown = [];
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      const revDay = (revenueSummary?.dailyBreakdown || []).find((d) => d.day === dayNum);
      const cogsDay = cogsDailyMap.get(dayNum);

      const dRev = Math.round((revDay?.revenue || 0) * 100) / 100;
      const dCogs = Math.round((cogsDay?.cogs || 0) * 100) / 100;
      const dGp = Math.round((dRev - dCogs) * 100) / 100;
      const dMargin = dRev > 0 ? Math.round(((dGp / dRev) * 100) * 100) / 100 : 0;

      dailyBreakdown.push({
        date: dateStr,
        day: dayNum,
        revenue: dRev,
        cogs: dCogs,
        grossProfit: dGp,
        grossMarginPercentage: dMargin,
        unitsSold: cogsDay?.unitsSold || 0,
        invoiceCount: revDay?.invoiceCount || 0,
      });
    }

    // 6. Product Breakdown Enrichment
    const productBreakdown = (cogsSummary?.productBreakdown || []).map((p) => {
      const pContribution =
        grossProfit > 0
          ? Math.round(((p.grossProfit / grossProfit) * 100) * 100) / 100
          : 0;
      return {
        productId: p.productId,
        name: p.name,
        sku: p.sku,
        unitsSold: p.unitsSold,
        historicalCostPrice: p.historicalCostPrice,
        sellingPrice: p.unitsSold > 0 ? Math.round((p.totalRevenue / p.unitsSold) * 100) / 100 : 0,
        totalRevenue: p.totalRevenue,
        totalCogs: p.totalCogs,
        grossProfit: p.grossProfit,
        grossMarginPercentage: p.grossMarginPercentage,
        profitContributionPercentage: pContribution,
      };
    });

    // 7. Retrieve Previous Calendar Month for MoM Analytics
    const prevSummary = await monthlyGrossProfitRepository.findPreviousMonthSummary(
      bId,
      y,
      m
    );

    const previousMonthGrossProfit = prevSummary ? prevSummary.grossProfit : 0;
    const previousMonthMarginPercentage = prevSummary ? prevSummary.grossMarginPercentage : 0;

    const momProfitVariance =
      Math.round((grossProfit - previousMonthGrossProfit) * 100) / 100;

    let momProfitGrowthRate = 0;
    if (prevSummary && previousMonthGrossProfit > 0) {
      momProfitGrowthRate =
        Math.round(((momProfitVariance / previousMonthGrossProfit) * 100) * 100) / 100;
    }

    const marginChangeRate =
      Math.round((grossMarginPercentage - previousMonthMarginPercentage) * 100) / 100;

    const status = this.getMonthStatus(y, m);

    // 8. Upsert into Materialized Cache
    const summaryDocument = await monthlyGrossProfitRepository.upsertMonthlySummary(
      bId,
      y,
      m,
      {
        monthName,
        startDate,
        endDate,
        revenue,
        cogs,
        grossProfit,
        grossMarginPercentage,
        opEx,
        operatingProfit,
        operatingMarginPercentage,
        marginHealth,
        totalUnitsSold,
        invoiceCount,
        averageGrossProfitPerOrder,
        productBreakdown,
        dailyBreakdown,
        previousMonthGrossProfit,
        previousMonthMarginPercentage,
        momProfitVariance,
        momProfitGrowthRate,
        marginChangeRate,
        status,
        aggregatedBy: trigger,
      }
    );

    return summaryDocument;
  }

  /**
   * Executive 12-Month Fiscal Year Gross Profit Overview
   */
  async getMonthlyGrossProfitOverview(businessId, options = {}) {
    const year = Number(options.year) || new Date().getUTCFullYear();
    const forceRefresh = Boolean(options.forceRefresh);
    const bId = new mongoose.Types.ObjectId(businessId);

    // Fetch existing cached summaries for the year
    let cachedSummaries = await monthlyGrossProfitRepository.findByBusinessAndYear(
      bId,
      year
    );
    const cachedMonthMap = new Map();
    cachedSummaries.forEach((s) => cachedMonthMap.set(s.month, s));

    const currentYear = new Date().getUTCFullYear();
    const currentMonth = new Date().getUTCMonth() + 1;

    // Ensure all 12 calendar months are populated
    const monthSummaries = [];
    for (let m = 1; m <= 12; m++) {
      let monthDoc = cachedMonthMap.get(m);
      const isPastOrCurrent =
        year < currentYear || (year === currentYear && m <= currentMonth);

      if (!monthDoc || forceRefresh || (year === currentYear && m === currentMonth)) {
        if (isPastOrCurrent) {
          monthDoc = await this.aggregateAndCacheMonth(
            bId,
            year,
            m,
            forceRefresh ? "MANUAL_RECALCULATE" : "AUTO_ENGINE"
          );
        } else {
          // Future projected month
          const bounds = this.getMonthBoundaries(year, m);
          monthDoc = {
            year,
            month: m,
            monthKey: bounds.monthKey,
            monthName: bounds.monthName,
            revenue: 0,
            cogs: 0,
            grossProfit: 0,
            grossMarginPercentage: 0,
            opEx: 0,
            operatingProfit: 0,
            operatingMarginPercentage: 0,
            marginHealth: "HEALTHY",
            totalUnitsSold: 0,
            invoiceCount: 0,
            averageGrossProfitPerOrder: 0,
            productBreakdown: [],
            dailyBreakdown: [],
            momProfitGrowthRate: 0,
            marginChangeRate: 0,
            status: "PROJECTED",
          };
        }
      }

      monthSummaries.push(monthDoc);
    }

    // Compute Fiscal Year Annual Aggregates
    const activeMonths = monthSummaries.filter(
      (m) => (m.revenue || 0) > 0 || (m.cogs || 0) > 0
    );

    const totalYearRevenue = Math.round(
      monthSummaries.reduce((acc, m) => acc + (m.revenue || 0), 0) * 100
    ) / 100;
    const totalYearCogs = Math.round(
      monthSummaries.reduce((acc, m) => acc + (m.cogs || 0), 0) * 100
    ) / 100;
    const totalYearGrossProfit = Math.round(
      (totalYearRevenue - totalYearCogs) * 100
    ) / 100;
    const totalYearMarginPercentage =
      totalYearRevenue > 0
        ? Math.round(((totalYearGrossProfit / totalYearRevenue) * 100) * 100) / 100
        : 0;

    const totalYearOpEx = Math.round(
      monthSummaries.reduce((acc, m) => acc + (m.opEx || 0), 0) * 100
    ) / 100;
    const totalYearOperatingProfit = Math.round(
      (totalYearGrossProfit - totalYearOpEx) * 100
    ) / 100;
    const totalYearOperatingMargin =
      totalYearRevenue > 0
        ? Math.round(((totalYearOperatingProfit / totalYearRevenue) * 100) * 100) / 100
        : 0;

    const totalYearUnitsSold = monthSummaries.reduce(
      (acc, m) => acc + (m.totalUnitsSold || 0),
      0
    );
    const totalYearInvoices = monthSummaries.reduce(
      (acc, m) => acc + (m.invoiceCount || 0),
      0
    );
    const averageMonthlyGrossProfit =
      activeMonths.length > 0
        ? Math.round((totalYearGrossProfit / activeMonths.length) * 100) / 100
        : 0;

    // Peak Gross Profit Month
    let peakProfitMonth = monthSummaries[0];
    monthSummaries.forEach((m) => {
      if ((m.grossProfit || 0) > (peakProfitMonth?.grossProfit || 0)) {
        peakProfitMonth = m;
      }
    });

    const currentMonthSummary =
      monthSummaries.find((m) => m.month === currentMonth && year === currentYear) ||
      monthSummaries[0];

    const overallMarginHealth = this.evaluateMarginHealth(totalYearMarginPercentage);

    return {
      year,
      yearlyAggregates: {
        totalRevenue: totalYearRevenue,
        totalCogs: totalYearCogs,
        totalGrossProfit: totalYearGrossProfit,
        grossMarginPercentage: totalYearMarginPercentage,
        totalOpEx: totalYearOpEx,
        operatingProfit: totalYearOperatingProfit,
        operatingMarginPercentage: totalYearOperatingMargin,
        marginHealth: overallMarginHealth,
        totalUnitsSold: totalYearUnitsSold,
        totalInvoices: totalYearInvoices,
        averageMonthlyGrossProfit,
        peakProfitMonth: {
          month: peakProfitMonth?.month,
          monthName: peakProfitMonth?.monthName,
          grossProfit: peakProfitMonth?.grossProfit || 0,
          grossMarginPercentage: peakProfitMonth?.grossMarginPercentage || 0,
        },
      },
      months: monthSummaries,
      currentMonthSummary,
    };
  }

  /**
   * Fast Snapshot of current ongoing calendar month
   */
  async getCurrentMonthGrossProfit(businessId, options = {}) {
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth() + 1;

    if (options.forceRefresh) {
      return await this.aggregateAndCacheMonth(
        businessId,
        currentYear,
        currentMonth,
        "MANUAL_RECALCULATE"
      );
    }

    const cached = await monthlyGrossProfitRepository.findByBusinessAndMonth(
      businessId,
      currentYear,
      currentMonth
    );

    if (cached) return cached;

    return await this.aggregateAndCacheMonth(
      businessId,
      currentYear,
      currentMonth,
      "AUTO_ENGINE"
    );
  }

  /**
   * Granular Day-by-Day Gross Profit Timeline
   */
  async getDailyGrossProfitBreakdown(businessId, year, month) {
    const y = Number(year) || new Date().getUTCFullYear();
    const m = Number(month) || new Date().getUTCMonth() + 1;

    let summary = await monthlyGrossProfitRepository.findByBusinessAndMonth(
      businessId,
      y,
      m
    );

    if (!summary) {
      summary = await this.aggregateAndCacheMonth(businessId, y, m, "AUTO_ENGINE");
    }

    return {
      year: y,
      month: m,
      monthName: summary.monthName,
      revenue: summary.revenue,
      cogs: summary.cogs,
      grossProfit: summary.grossProfit,
      grossMarginPercentage: summary.grossMarginPercentage,
      marginHealth: summary.marginHealth,
      dailyBreakdown: summary.dailyBreakdown || [],
    };
  }

  /**
   * Product Profitability Matrix
   * Categorizes products into Star Performers, Volume Drivers, Low Margin, Loss Making
   */
  async getProductProfitabilityMatrix(businessId, options = {}) {
    const year = Number(options.year) || new Date().getUTCFullYear();
    const month = options.month ? Number(options.month) : null;
    const limit = Math.min(50, Math.max(1, Number(options.limit) || 20));
    const sortBy = options.sortBy || "grossProfit"; // grossProfit | grossMarginPercentage | totalRevenue | unitsSold

    let productList = [];

    if (month) {
      const summary = await monthlyGrossProfitRepository.findByBusinessAndMonth(
        businessId,
        year,
        month
      );
      productList = summary?.productBreakdown || [];
    } else {
      // Annual Rollup
      const summaries = await monthlyGrossProfitRepository.findByBusinessAndYear(
        businessId,
        year
      );
      const prodMap = new Map();

      summaries.forEach((s) => {
        (s.productBreakdown || []).forEach((p) => {
          const key = p.productId ? p.productId.toString() : p.name;
          const existing = prodMap.get(key) || {
            productId: p.productId,
            name: p.name,
            sku: p.sku,
            unitsSold: 0,
            totalRevenue: 0,
            totalCogs: 0,
            grossProfit: 0,
          };

          existing.unitsSold += p.unitsSold || 0;
          existing.totalRevenue += p.totalRevenue || 0;
          existing.totalCogs += p.totalCogs || 0;
          existing.grossProfit += p.grossProfit || 0;
          prodMap.set(key, existing);
        });
      });

      const totalAnnualProfit = Math.round(
        Array.from(prodMap.values()).reduce((acc, p) => acc + p.grossProfit, 0) * 100
      ) / 100;

      productList = Array.from(prodMap.values()).map((p) => {
        const rev = Math.round(p.totalRevenue * 100) / 100;
        const cost = Math.round(p.totalCogs * 100) / 100;
        const profit = Math.round((rev - cost) * 100) / 100;
        const margin =
          rev > 0 ? Math.round(((profit / rev) * 100) * 100) / 100 : 0;
        const contribution =
          totalAnnualProfit > 0
            ? Math.round(((profit / totalAnnualProfit) * 100) * 100) / 100
            : 0;

        return {
          ...p,
          totalRevenue: rev,
          totalCogs: cost,
          grossProfit: profit,
          grossMarginPercentage: margin,
          profitContributionPercentage: contribution,
          historicalCostPrice:
            p.unitsSold > 0 ? Math.round((cost / p.unitsSold) * 100) / 100 : 0,
          sellingPrice:
            p.unitsSold > 0 ? Math.round((rev / p.unitsSold) * 100) / 100 : 0,
        };
      });
    }

    // Classify into Strategic Matrix Quadrants
    const classifiedProducts = productList.map((p) => {
      let matrixQuadrant = "STAR_PERFORMER";
      if (p.grossMarginPercentage < 0) {
        matrixQuadrant = "LOSS_MAKING";
      } else if (p.grossMarginPercentage < 15) {
        matrixQuadrant = "MARGIN_DRAG";
      } else if (p.grossMarginPercentage < 30) {
        matrixQuadrant = "VOLUME_DRIVER";
      }

      return {
        ...p,
        matrixQuadrant,
      };
    });

    // Sort accordingly
    classifiedProducts.sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));

    return classifiedProducts.slice(0, limit);
  }

  /**
   * Vital Health Check Diagnostic Indicator (Task T54 Health Check)
   * Detects margin erosion, low margin drag, and profitability leaks
   */
  async getVitalHealthCheck(businessId, options = {}) {
    const year = Number(options.year) || new Date().getUTCFullYear();
    const month = Number(options.month) || new Date().getUTCMonth() + 1;

    let current = await monthlyGrossProfitRepository.findByBusinessAndMonth(
      businessId,
      year,
      month
    );

    if (!current) {
      current = await this.aggregateAndCacheMonth(businessId, year, month, "AUTO_ENGINE");
    }

    const marginPercentage = current.grossMarginPercentage || 0;
    const marginHealth = this.evaluateMarginHealth(marginPercentage);
    const marginChangeRate = current.marginChangeRate || 0;

    // Detect margin erosion (> 3% drop in gross margin vs previous month)
    const isMarginCompressing = marginChangeRate < -3;

    // Identify low-margin products (< 15%) and loss-making items (< 0%)
    const lowMarginProducts = (current.productBreakdown || []).filter(
      (p) => p.grossMarginPercentage >= 0 && p.grossMarginPercentage < 15
    );
    const lossMakingProducts = (current.productBreakdown || []).filter(
      (p) => p.grossMarginPercentage < 0
    );

    const diagnostics = [];
    if (lossMakingProducts.length > 0) {
      diagnostics.push({
        severity: "CRITICAL",
        type: "LOSS_MAKING_INVENTORY",
        message: `${lossMakingProducts.length} product(s) are selling at a loss (selling price lower than acquisition cost).`,
        items: lossMakingProducts.map((p) => ({ name: p.name, margin: p.grossMarginPercentage })),
      });
    }

    if (isMarginCompressing) {
      diagnostics.push({
        severity: "WARNING",
        type: "MARGIN_COMPRESSION",
        message: `Gross Profit Margin compressed by ${Math.abs(marginChangeRate)}% compared to preceding month.`,
      });
    }

    if (marginPercentage < 15 && marginPercentage >= 0) {
      diagnostics.push({
        severity: "WARNING",
        type: "LOW_MARGIN_ALERT",
        message: `Store Gross Margin (${marginPercentage}%) is below standard retail benchmark of 20%.`,
      });
    }

    if (diagnostics.length === 0) {
      diagnostics.push({
        severity: "SUCCESS",
        type: "HEALTHY_MARGINS",
        message: `Store margins are performing robustly at ${marginPercentage}% with positive profitability.`,
      });
    }

    return {
      period: current.monthName,
      revenue: current.revenue,
      cogs: current.cogs,
      grossProfit: current.grossProfit,
      grossMarginPercentage: marginPercentage,
      marginHealth,
      marginChangeRate,
      isMarginCompressing,
      diagnostics,
      lowMarginCount: lowMarginProducts.length,
      lossMakingCount: lossMakingProducts.length,
    };
  }

  /**
   * Recalculate and refresh the materialized cache for a given month or entire year
   */
  async recalculateMonthlyGrossProfit(businessId, payload = {}) {
    const year = Number(payload.year) || new Date().getUTCFullYear();
    const month = payload.month ? Number(payload.month) : null;

    if (month) {
      const updated = await this.aggregateAndCacheMonth(
        businessId,
        year,
        month,
        "MANUAL_RECALCULATE"
      );
      return { success: true, recalculatedMonths: [updated] };
    }

    // Recalculate full calendar year (1-12)
    const recalculated = [];
    for (let m = 1; m <= 12; m++) {
      const summary = await this.aggregateAndCacheMonth(
        businessId,
        year,
        m,
        "MANUAL_RECALCULATE"
      );
      recalculated.push(summary);
    }

    return {
      success: true,
      year,
      totalMonthsRecalculated: recalculated.length,
      recalculatedMonths: recalculated,
    };
  }

  /**
   * Background Real-Time Auto-Sync Hook
   */
  async autoSyncOnSaleChange(businessId, saleDate = new Date()) {
    try {
      const date = new Date(saleDate);
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth() + 1;

      // Recalculate affected month
      await this.aggregateAndCacheMonth(businessId, year, month, "AUTO_ENGINE");

      // Also recalculate next month if active, to update MoM metrics
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      const nextCached = await monthlyGrossProfitRepository.findByBusinessAndMonth(
        businessId,
        nextYear,
        nextMonth
      );
      if (nextCached) {
        await this.aggregateAndCacheMonth(businessId, nextYear, nextMonth, "AUTO_ENGINE");
      }
    } catch (err) {
      console.error("[GrossProfitAnalyticsService] autoSyncOnSaleChange error:", err.message);
    }
  }
}

module.exports = new GrossProfitAnalyticsService();
