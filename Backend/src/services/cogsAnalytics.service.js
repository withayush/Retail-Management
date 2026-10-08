const mongoose = require("mongoose");
const SaleItem = require("../models/saleItem.model");
const Invoice = require("../models/invoice.model");
const monthlyCogsRepository = require("../repositories/monthlyCogs.repository");

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
 * Cost of Goods Sold (COGS) Analytics Engine Service (Phase 9 - Task T53)
 * Mathematical calculation: SUM(Sale Item costPrice * quantity) over specified periods.
 * Computes raw inventory acquisition costs behind active sales using historical cost snapshots.
 * Strictly excludes cancelled invoices and ignores subsequent catalog product price updates.
 */
class CogsAnalyticsService {
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
   * Dynamic COGS Calculation over specified periods (custom date range or month)
   * Formula: COGS = SUM(SaleItem.costPrice * SaleItem.quantity)
   * Gross Profit = SUM(SaleItem.totalPrice) - COGS
   */
  async calculatePeriodCogs(businessId, filters = {}) {
    if (!businessId) {
      throw new Error("Business ID is required for multi-tenant isolation.");
    }

    const bId = new mongoose.Types.ObjectId(businessId);
    const match = { businessId: bId };

    if (filters.startDate || filters.endDate) {
      match.createdAt = {};
      if (filters.startDate) match.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) match.createdAt.$lte = new Date(filters.endDate);
    }

    if (filters.productId && mongoose.Types.ObjectId.isValid(filters.productId)) {
      match.productId = new mongoose.Types.ObjectId(filters.productId);
    }

    const [results] = await SaleItem.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "invoices",
          localField: "saleId",
          foreignField: "_id",
          as: "invoice",
        },
      },
      { $unwind: "$invoice" },
      {
        $match: {
          "invoice.status": { $ne: "CANCELLED" }, // Exclude cancelled invoices
        },
      },
      {
        $project: {
          businessId: 1,
          saleId: 1,
          productId: 1,
          name: 1,
          sku: 1,
          unit: 1,
          costPrice: { $ifNull: ["$costPrice", 0] },
          soldPrice: { $ifNull: ["$soldPrice", 0] },
          quantity: { $ifNull: ["$quantity", 1] },
          totalPrice: { $ifNull: ["$totalPrice", 0] },
          createdAt: 1,
          lineCogs: {
            $multiply: [
              { $ifNull: ["$costPrice", 0] },
              { $ifNull: ["$quantity", 1] },
            ],
          },
          lineRevenue: { $ifNull: ["$totalPrice", 0] },
        },
      },
      {
        $facet: {
          // Overall Aggregates
          overall: [
            {
              $group: {
                _id: null,
                totalCogs: { $sum: "$lineCogs" },
                totalRevenue: { $sum: "$lineRevenue" },
                totalUnitsSold: { $sum: "$quantity" },
                invoices: { $addToSet: "$saleId" },
              },
            },
          ],

          // Product-wise Breakdown
          byProduct: [
            {
              $group: {
                _id: "$productId",
                name: { $first: "$name" },
                sku: { $first: "$sku" },
                unit: { $first: "$unit" },
                unitsSold: { $sum: "$quantity" },
                totalCogs: { $sum: "$lineCogs" },
                totalRevenue: { $sum: "$lineRevenue" },
                avgCostPrice: { $avg: "$costPrice" },
              },
            },
            { $sort: { totalCogs: -1 } },
          ],

          // Daily Timeline Breakdown
          byDay: [
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" },
                },
                cogs: { $sum: "$lineCogs" },
                revenue: { $sum: "$lineRevenue" },
                unitsSold: { $sum: "$quantity" },
                invoices: { $addToSet: "$saleId" },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);

    const overallData = results?.overall?.[0] || {
      totalCogs: 0,
      totalRevenue: 0,
      totalUnitsSold: 0,
      invoices: [],
    };

    const totalCogs = Math.round((overallData.totalCogs || 0) * 100) / 100;
    const totalRevenue = Math.round((overallData.totalRevenue || 0) * 100) / 100;
    const grossProfit = Math.round((totalRevenue - totalCogs) * 100) / 100;
    const grossMarginPercentage =
      totalRevenue > 0
        ? Math.round(((grossProfit / totalRevenue) * 100) * 100) / 100
        : 0;
    const totalUnitsSold = overallData.totalUnitsSold || 0;
    const invoiceCount = overallData.invoices?.length || 0;
    const averageUnitCost =
      totalUnitsSold > 0 ? Math.round((totalCogs / totalUnitsSold) * 100) / 100 : 0;

    // Process Product Breakdown with Margin and Cost Share %
    const productBreakdown = (results?.byProduct || []).map((p) => {
      const pCogs = Math.round((p.totalCogs || 0) * 100) / 100;
      const pRev = Math.round((p.totalRevenue || 0) * 100) / 100;
      const pProfit = Math.round((pRev - pCogs) * 100) / 100;
      const pMargin =
        pRev > 0 ? Math.round(((pProfit / pRev) * 100) * 100) / 100 : 0;
      const costShare =
        totalCogs > 0 ? Math.round(((pCogs / totalCogs) * 100) * 100) / 100 : 0;

      return {
        productId: p._id,
        name: p.name || "Unknown Product",
        sku: p.sku || "N/A",
        unit: p.unit || "pcs",
        unitsSold: p.unitsSold || 0,
        historicalCostPrice: Math.round((p.avgCostPrice || 0) * 100) / 100,
        totalCogs: pCogs,
        totalRevenue: pRev,
        grossProfit: pProfit,
        grossMarginPercentage: pMargin,
        costSharePercentage: costShare,
      };
    });

    // Process Daily Timeline
    const dailyMap = new Map();
    (results?.byDay || []).forEach((d) => {
      const dCogs = Math.round((d.cogs || 0) * 100) / 100;
      const dRev = Math.round((d.revenue || 0) * 100) / 100;
      dailyMap.set(d._id, {
        date: d._id,
        cogs: dCogs,
        revenue: dRev,
        grossProfit: Math.round((dRev - dCogs) * 100) / 100,
        unitsSold: d.unitsSold || 0,
        invoiceCount: d.invoices?.length || 0,
      });
    });

    return {
      totalCogs,
      totalRevenue,
      grossProfit,
      grossMarginPercentage,
      totalUnitsSold,
      averageUnitCost,
      invoiceCount,
      productBreakdown,
      dailyMap,
    };
  }

  /**
   * Aggregate calendar month and save into materialized cache (MonthlyCogsSummary)
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

    // 1. Calculate Period COGS
    const periodData = await this.calculatePeriodCogs(bId, {
      startDate,
      endDate,
    });

    // 2. Generate Full Calendar Daily Breakdown (Days 1 to daysInMonth)
    const dailyBreakdown = [];
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      const dayData = periodData.dailyMap.get(dateStr) || {
        date: dateStr,
        cogs: 0,
        revenue: 0,
        grossProfit: 0,
        unitsSold: 0,
        invoiceCount: 0,
      };

      dailyBreakdown.push({
        date: dateStr,
        day: dayNum,
        cogs: dayData.cogs,
        revenue: dayData.revenue,
        grossProfit: dayData.grossProfit,
        unitsSold: dayData.unitsSold,
        invoiceCount: dayData.invoiceCount,
      });
    }

    // 3. Daily run rate
    const dailyRunRate =
      daysInMonth > 0
        ? Math.round((periodData.totalCogs / daysInMonth) * 100) / 100
        : 0;

    // 4. Retrieve Previous Calendar Month for MoM calculation
    const prevMonthSummary = await monthlyCogsRepository.findPreviousMonthSummary(
      bId,
      y,
      m
    );

    const previousMonthCogs = prevMonthSummary ? prevMonthSummary.totalCogs : 0;
    const momVariance =
      Math.round((periodData.totalCogs - previousMonthCogs) * 100) / 100;

    let momGrowthRate = 0;
    if (prevMonthSummary && previousMonthCogs > 0) {
      momGrowthRate =
        Math.round(((momVariance / previousMonthCogs) * 100) * 100) / 100;
    }

    const status = this.getMonthStatus(y, m);

    // 5. Upsert into Materialized Cache
    const summaryDocument = await monthlyCogsRepository.upsertMonthlySummary(
      bId,
      y,
      m,
      {
        monthName,
        startDate,
        endDate,
        totalCogs: periodData.totalCogs,
        totalRevenue: periodData.totalRevenue,
        grossProfit: periodData.grossProfit,
        grossMarginPercentage: periodData.grossMarginPercentage,
        totalUnitsSold: periodData.totalUnitsSold,
        averageUnitCost: periodData.averageUnitCost,
        invoiceCount: periodData.invoiceCount,
        dailyRunRate,
        productBreakdown: periodData.productBreakdown,
        dailyBreakdown,
        previousMonthCogs,
        momVariance,
        momGrowthRate,
        status,
        aggregatedBy: trigger,
      }
    );

    return summaryDocument;
  }

  /**
   * Executive 12-Month Fiscal Year COGS Overview
   * Sweeps all 12 calendar months and returns full annual trajectory
   */
  async getMonthlyCogsOverview(businessId, options = {}) {
    const year = Number(options.year) || new Date().getUTCFullYear();
    const forceRefresh = Boolean(options.forceRefresh);
    const bId = new mongoose.Types.ObjectId(businessId);

    // Fetch existing cached summaries for the year
    let cachedSummaries = await monthlyCogsRepository.findByBusinessAndYear(
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
            totalCogs: 0,
            totalRevenue: 0,
            grossProfit: 0,
            grossMarginPercentage: 0,
            totalUnitsSold: 0,
            averageUnitCost: 0,
            invoiceCount: 0,
            productBreakdown: [],
            dailyBreakdown: [],
            momGrowthRate: 0,
            status: "PROJECTED",
          };
        }
      }

      monthSummaries.push(monthDoc);
    }

    // Compute Fiscal Year Annual Aggregates
    const activeMonths = monthSummaries.filter((m) => (m.totalCogs || 0) > 0 || (m.totalRevenue || 0) > 0);
    const totalYearCogs = Math.round(
      monthSummaries.reduce((acc, m) => acc + (m.totalCogs || 0), 0) * 100
    ) / 100;
    const totalYearRevenue = Math.round(
      monthSummaries.reduce((acc, m) => acc + (m.totalRevenue || 0), 0) * 100
    ) / 100;
    const totalYearGrossProfit = Math.round(
      (totalYearRevenue - totalYearCogs) * 100
    ) / 100;
    const totalYearMarginPercentage =
      totalYearRevenue > 0
        ? Math.round(((totalYearGrossProfit / totalYearRevenue) * 100) * 100) / 100
        : 0;
    const totalYearUnitsSold = monthSummaries.reduce(
      (acc, m) => acc + (m.totalUnitsSold || 0),
      0
    );
    const totalYearInvoices = monthSummaries.reduce(
      (acc, m) => acc + (m.invoiceCount || 0),
      0
    );
    const averageMonthlyCogs =
      activeMonths.length > 0
        ? Math.round((totalYearCogs / activeMonths.length) * 100) / 100
        : 0;
    const averageUnitCost =
      totalYearUnitsSold > 0
        ? Math.round((totalYearCogs / totalYearUnitsSold) * 100) / 100
        : 0;

    // Peak COGS Month
    let peakCogsMonth = monthSummaries[0];
    monthSummaries.forEach((m) => {
      if ((m.totalCogs || 0) > (peakCogsMonth?.totalCogs || 0)) {
        peakCogsMonth = m;
      }
    });

    const currentMonthSummary =
      monthSummaries.find((m) => m.month === currentMonth && year === currentYear) ||
      monthSummaries[0];

    return {
      year,
      yearlyAggregates: {
        totalCogs: totalYearCogs,
        totalRevenue: totalYearRevenue,
        grossProfit: totalYearGrossProfit,
        grossMarginPercentage: totalYearMarginPercentage,
        totalUnitsSold: totalYearUnitsSold,
        totalInvoices: totalYearInvoices,
        averageMonthlyCogs,
        averageUnitCost,
        peakCogsMonth: {
          month: peakCogsMonth?.month,
          monthName: peakCogsMonth?.monthName,
          totalCogs: peakCogsMonth?.totalCogs || 0,
          grossProfit: peakCogsMonth?.grossProfit || 0,
        },
      },
      months: monthSummaries,
      currentMonthSummary,
    };
  }

  /**
   * Fast Snapshot of current ongoing calendar month
   */
  async getCurrentMonthCogs(businessId, options = {}) {
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

    const cached = await monthlyCogsRepository.findByBusinessAndMonth(
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
   * Granular Day-by-Day COGS Breakdown for a calendar month
   */
  async getDailyCogsBreakdown(businessId, year, month) {
    const y = Number(year) || new Date().getUTCFullYear();
    const m = Number(month) || new Date().getUTCMonth() + 1;

    let summary = await monthlyCogsRepository.findByBusinessAndMonth(
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
      totalCogs: summary.totalCogs,
      totalRevenue: summary.totalRevenue,
      grossProfit: summary.grossProfit,
      dailyBreakdown: summary.dailyBreakdown || [],
    };
  }

  /**
   * Top Product Cost Drivers & Margin Ranking
   */
  async getProductCogsRanking(businessId, options = {}) {
    const year = Number(options.year) || new Date().getUTCFullYear();
    const month = options.month ? Number(options.month) : null;
    const limit = Math.min(50, Math.max(1, Number(options.limit) || 10));
    const sortBy = options.sortBy || "totalCogs"; // totalCogs | unitsSold | grossProfit | grossMarginPercentage

    let productList = [];

    if (month) {
      const summary = await monthlyCogsRepository.findByBusinessAndMonth(
        businessId,
        year,
        month
      );
      productList = summary?.productBreakdown || [];
    } else {
      // Annual Product rollup across all months
      const summaries = await monthlyCogsRepository.findByBusinessAndYear(
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
            unit: p.unit,
            unitsSold: 0,
            totalCogs: 0,
            totalRevenue: 0,
            grossProfit: 0,
          };

          existing.unitsSold += p.unitsSold || 0;
          existing.totalCogs += p.totalCogs || 0;
          existing.totalRevenue += p.totalRevenue || 0;
          existing.grossProfit += p.grossProfit || 0;
          prodMap.set(key, existing);
        });
      });

      const totalAnnualCogs = Math.round(
        Array.from(prodMap.values()).reduce((acc, p) => acc + p.totalCogs, 0) * 100
      ) / 100;

      productList = Array.from(prodMap.values()).map((p) => {
        const cogs = Math.round(p.totalCogs * 100) / 100;
        const rev = Math.round(p.totalRevenue * 100) / 100;
        const profit = Math.round((rev - cogs) * 100) / 100;
        const margin =
          rev > 0 ? Math.round(((profit / rev) * 100) * 100) / 100 : 0;
        const share =
          totalAnnualCogs > 0
            ? Math.round(((cogs / totalAnnualCogs) * 100) * 100) / 100
            : 0;

        return {
          ...p,
          totalCogs: cogs,
          totalRevenue: rev,
          grossProfit: profit,
          grossMarginPercentage: margin,
          costSharePercentage: share,
          historicalCostPrice:
            p.unitsSold > 0 ? Math.round((cogs / p.unitsSold) * 100) / 100 : 0,
        };
      });
    }

    // Sort accordingly
    productList.sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));

    return productList.slice(0, limit);
  }

  /**
   * Recalculate and refresh the materialized cache for a given month or entire year
   */
  async recalculateMonthlyCogs(businessId, payload = {}) {
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
   * Triggered upon POS checkout (createSale) or invoice status changes
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
      const nextCached = await monthlyCogsRepository.findByBusinessAndMonth(
        businessId,
        nextYear,
        nextMonth
      );
      if (nextCached) {
        await this.aggregateAndCacheMonth(businessId, nextYear, nextMonth, "AUTO_ENGINE");
      }
    } catch (err) {
      console.error("[CogsAnalyticsService] autoSyncOnSaleChange error:", err.message);
    }
  }
}

module.exports = new CogsAnalyticsService();
