const mongoose = require("mongoose");
const Invoice = require("../models/invoice.model");
const monthlyRevenueRepository = require("../repositories/monthlyRevenue.repository");

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
 * Revenue Analytics Engine Service (Phase 9 - Task T52)
 * Source of truth for recognized sales revenue under accrual accounting.
 * Groups invoice values across daily, monthly, and yearly granularities.
 */
class RevenueAnalyticsService {
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
    if (year === currentYear && month === currentMonth) {
      return "ACTIVE";
    }
    return "PROJECTED";
  }

  /**
   * Core Aggregator: Executes faceted MongoDB aggregation pipeline over Invoice collection
   * under accrual accounting principles (ignores paymentStatus, excludes cancelled sales).
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

    // 1. Faceted Aggregation over Invoices
    const [results] = await Invoice.aggregate([
      {
        $match: {
          businessId: bId,
          status: { $ne: "CANCELLED" }, // Excludes voided / cancelled invoices
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $facet: {
          // Overall month totals
          overall: [
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: "$total" },
                subtotal: { $sum: "$subtotal" },
                totalDiscount: { $sum: "$discount" },
                totalTax: { $sum: "$tax" },
                invoiceCount: { $sum: 1 },
                cashCollected: { $sum: "$paidAmount" },
                receivablesCreated: { $sum: "$dueAmount" },
              },
            },
          ],

          // Payment mode breakdown
          byPaymentMode: [
            {
              $group: {
                _id: "$paymentMode",
                totalAmount: { $sum: "$total" },
                count: { $sum: 1 },
              },
            },
            { $sort: { totalAmount: -1 } },
          ],

          // Payment status breakdown (PAID, PARTIAL, PENDING)
          byPaymentStatus: [
            {
              $group: {
                _id: "$paymentStatus",
                totalAmount: { $sum: "$total" },
                count: { $sum: 1 },
              },
            },
            { $sort: { totalAmount: -1 } },
          ],

          // Daily revenue breakdown
          byDay: [
            {
              $group: {
                _id: {
                  date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                  day: { $dayOfMonth: "$createdAt" },
                },
                revenue: { $sum: "$total" },
                invoiceCount: { $sum: 1 },
                cashCollected: { $sum: "$paidAmount" },
                receivables: { $sum: "$dueAmount" },
              },
            },
            { $sort: { "_id.day": 1 } },
          ],
        },
      },
    ]);

    const overall = results?.overall?.[0] || {
      totalRevenue: 0,
      subtotal: 0,
      totalDiscount: 0,
      totalTax: 0,
      invoiceCount: 0,
      cashCollected: 0,
      receivablesCreated: 0,
    };

    const totalRevenue = Math.round((overall.totalRevenue || 0) * 100) / 100;
    const subtotal = Math.round((overall.subtotal || 0) * 100) / 100;
    const totalDiscount = Math.round((overall.totalDiscount || 0) * 100) / 100;
    const totalTax = Math.round((overall.totalTax || 0) * 100) / 100;
    const invoiceCount = overall.invoiceCount || 0;
    const cashCollected = Math.round((overall.cashCollected || 0) * 100) / 100;
    const receivablesCreated = Math.round((overall.receivablesCreated || 0) * 100) / 100;

    const averageOrderValue = invoiceCount > 0 ? Math.round((totalRevenue / invoiceCount) * 100) / 100 : 0;

    const now = new Date();
    const isCurrentMonth = y === now.getUTCFullYear() && m === now.getUTCMonth() + 1;
    const daysElapsed = isCurrentMonth ? Math.max(1, now.getUTCDate()) : daysInMonth;
    const averageDailyRevenue = Math.round((totalRevenue / daysElapsed) * 100) / 100;

    // Format payment mode breakdown
    const rawModes = results?.byPaymentMode || [];
    const paymentModeBreakdown = rawModes.map((pm) => ({
      mode: pm._id || "CASH",
      totalAmount: Math.round(pm.totalAmount * 100) / 100,
      count: pm.count || 0,
      percentage: totalRevenue > 0 ? Math.round((pm.totalAmount / totalRevenue) * 1000) / 10 : 0,
    }));

    // Format payment status breakdown
    const rawStatuses = results?.byPaymentStatus || [];
    const paymentStatusBreakdown = rawStatuses.map((ps) => ({
      status: ps._id || "PAID",
      totalAmount: Math.round(ps.totalAmount * 100) / 100,
      count: ps.count || 0,
      percentage: totalRevenue > 0 ? Math.round((ps.totalAmount / totalRevenue) * 1000) / 10 : 0,
    }));

    // Format daily breakdown
    const rawDays = results?.byDay || [];
    const dailyBreakdown = rawDays.map((d) => ({
      date: d._id.date,
      day: d._id.day,
      revenue: Math.round(d.revenue * 100) / 100,
      invoiceCount: d.invoiceCount || 0,
      cashCollected: Math.round(d.cashCollected * 100) / 100,
      receivables: Math.round(d.receivables * 100) / 100,
    }));

    // 2. Month-over-Month (MoM) Analytics
    let prevYear = y;
    let prevMonth = m - 1;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = y - 1;
    }

    let previousMonthSummary = await monthlyRevenueRepository.findByBusinessAndMonth(
      businessId,
      prevYear,
      prevMonth
    );

    // If previous month not yet materialized, run quick aggregate
    if (!previousMonthSummary) {
      const prevBoundaries = this.getMonthBoundaries(prevYear, prevMonth);
      const prevAgg = await Invoice.aggregate([
        {
          $match: {
            businessId: bId,
            status: { $ne: "CANCELLED" },
            createdAt: { $gte: prevBoundaries.startDate, $lte: prevBoundaries.endDate },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$total" },
          },
        },
      ]);
      const prevTotal = prevAgg?.[0]?.total || 0;
      previousMonthSummary = { totalRevenue: prevTotal };
    }

    const previousMonthRevenue = Math.round((previousMonthSummary?.totalRevenue || 0) * 100) / 100;
    const momVariance = Math.round((totalRevenue - previousMonthRevenue) * 100) / 100;
    let momGrowthRate = 0;
    if (previousMonthRevenue > 0) {
      momGrowthRate = Math.round(((totalRevenue - previousMonthRevenue) / previousMonthRevenue) * 1000) / 10;
    } else if (previousMonthRevenue === 0 && totalRevenue > 0) {
      momGrowthRate = 100;
    }

    const status = this.getMonthStatus(y, m);

    // 3. Upsert Materialized Cache
    return await monthlyRevenueRepository.upsertMonthlySummary(businessId, y, m, {
      monthName,
      startDate,
      endDate,
      totalRevenue,
      subtotal,
      totalDiscount,
      totalTax,
      invoiceCount,
      averageOrderValue,
      averageDailyRevenue,
      cashCollected,
      receivablesCreated,
      paymentModeBreakdown,
      paymentStatusBreakdown,
      dailyBreakdown,
      previousMonthRevenue,
      momVariance,
      momGrowthRate,
      status,
      aggregatedBy: trigger,
    });
  }

  /**
   * Get single calendar month revenue summary
   */
  async getMonthlyRevenueSummary(businessId, { year, month, forceRefresh = false }) {
    if (!businessId) throw new Error("Business ID is required.");

    const now = new Date();
    const targetYear = Number(year) || now.getUTCFullYear();
    const targetMonth = Number(month) || now.getUTCMonth() + 1;

    if (!forceRefresh) {
      const cached = await monthlyRevenueRepository.findByBusinessAndMonth(
        businessId,
        targetYear,
        targetMonth
      );
      if (cached) return cached;
    }

    return await this.aggregateAndCacheMonth(
      businessId,
      targetYear,
      targetMonth,
      forceRefresh ? "MANUAL_RECALCULATE" : "AUTO_ENGINE"
    );
  }

  /**
   * Get current calendar month revenue summary with MoM metrics
   */
  async getCurrentMonthRevenue(businessId, forceRefresh = false) {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;

    return await this.getMonthlyRevenueSummary(businessId, {
      year,
      month,
      forceRefresh,
    });
  }

  /**
   * Get full calendar year revenue progression & executive metrics for financial statements
   */
  async getYearlyRevenueOverview(businessId, year, { forceRefresh = false } = {}) {
    if (!businessId) throw new Error("Business ID is required.");

    const now = new Date();
    const targetYear = Number(year) || now.getUTCFullYear();

    if (forceRefresh) {
      await this.recalculateYear(businessId, targetYear);
    }

    let summaries = await monthlyRevenueRepository.findByBusinessAndYear(
      businessId,
      targetYear
    );

    if (!summaries || summaries.length === 0) {
      await this.recalculateYear(businessId, targetYear);
      summaries = await monthlyRevenueRepository.findByBusinessAndYear(
        businessId,
        targetYear
      );
    }

    const summaryMap = new Map(summaries.map((s) => [s.month, s]));

    const monthsList = [];
    let totalYearlyRevenue = 0;
    let totalYearlyCashCollected = 0;
    let totalYearlyReceivables = 0;
    let totalYearlyInvoicesCount = 0;
    let activeMonthsCount = 0;

    let peakMonth = { month: 1, monthName: "January", amount: 0 };
    let lowestMonth = { month: 1, monthName: "January", amount: Infinity };

    for (let m = 1; m <= 12; m++) {
      const existing = summaryMap.get(m);
      const monthMeta = this.getMonthBoundaries(targetYear, m);

      if (existing) {
        monthsList.push(existing);
        totalYearlyRevenue += existing.totalRevenue || 0;
        totalYearlyCashCollected += existing.cashCollected || 0;
        totalYearlyReceivables += existing.receivablesCreated || 0;
        totalYearlyInvoicesCount += existing.invoiceCount || 0;

        if (existing.totalRevenue > 0) {
          activeMonthsCount++;
          if (existing.totalRevenue > peakMonth.amount) {
            peakMonth = {
              month: m,
              monthName: monthMeta.monthName,
              amount: existing.totalRevenue,
            };
          }
          if (existing.totalRevenue < lowestMonth.amount) {
            lowestMonth = {
              month: m,
              monthName: monthMeta.monthName,
              amount: existing.totalRevenue,
            };
          }
        }
      } else {
        monthsList.push({
          businessId,
          year: targetYear,
          month: m,
          monthKey: monthMeta.monthKey,
          monthName: monthMeta.monthName,
          startDate: monthMeta.startDate,
          endDate: monthMeta.endDate,
          totalRevenue: 0,
          subtotal: 0,
          totalDiscount: 0,
          totalTax: 0,
          invoiceCount: 0,
          averageOrderValue: 0,
          averageDailyRevenue: 0,
          cashCollected: 0,
          receivablesCreated: 0,
          paymentModeBreakdown: [],
          paymentStatusBreakdown: [],
          dailyBreakdown: [],
          previousMonthRevenue: 0,
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

    totalYearlyRevenue = Math.round(totalYearlyRevenue * 100) / 100;
    totalYearlyCashCollected = Math.round(totalYearlyCashCollected * 100) / 100;
    totalYearlyReceivables = Math.round(totalYearlyReceivables * 100) / 100;

    const averageMonthlyRevenue = activeMonthsCount > 0
      ? Math.round((totalYearlyRevenue / activeMonthsCount) * 100) / 100
      : 0;

    const averageYearlyOrderValue = totalYearlyInvoicesCount > 0
      ? Math.round((totalYearlyRevenue / totalYearlyInvoicesCount) * 100) / 100
      : 0;

    const currentMonthNum = now.getUTCMonth() + 1;
    const currentMonthSummary = summaryMap.get(currentMonthNum) || monthsList[currentMonthNum - 1];

    return {
      year: targetYear,
      totalYearlyRevenue,
      totalYearlyCashCollected,
      totalYearlyReceivables,
      totalYearlyInvoicesCount,
      activeMonthsCount,
      averageMonthlyRevenue,
      averageYearlyOrderValue,
      peakMonth,
      lowestMonth,
      currentMonthSummary,
      months: monthsList,
    };
  }

  /**
   * Get daily revenue breakdown for a specific month or date range
   */
  async getDailyRevenueBreakdown(businessId, { year, month, startDate, endDate }) {
    if (!businessId) throw new Error("Business ID is required.");

    const match = {
      businessId: new mongoose.Types.ObjectId(businessId),
      status: { $ne: "CANCELLED" },
    };

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        match.createdAt.$lte = end;
      }
    } else {
      const targetYear = Number(year) || new Date().getUTCFullYear();
      const targetMonth = Number(month) || new Date().getUTCMonth() + 1;
      const b = this.getMonthBoundaries(targetYear, targetMonth);
      match.createdAt = { $gte: b.startDate, $lte: b.endDate };
    }

    const dailyAgg = await Invoice.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          },
          revenue: { $sum: "$total" },
          subtotal: { $sum: "$subtotal" },
          discount: { $sum: "$discount" },
          tax: { $sum: "$tax" },
          invoiceCount: { $sum: 1 },
          cashCollected: { $sum: "$paidAmount" },
          receivables: { $sum: "$dueAmount" },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    return dailyAgg.map((item) => ({
      date: item._id.date,
      revenue: Math.round(item.revenue * 100) / 100,
      subtotal: Math.round(item.subtotal * 100) / 100,
      discount: Math.round(item.discount * 100) / 100,
      tax: Math.round(item.tax * 100) / 100,
      invoiceCount: item.invoiceCount || 0,
      averageOrderValue: item.invoiceCount > 0 ? Math.round((item.revenue / item.invoiceCount) * 100) / 100 : 0,
      cashCollected: Math.round(item.cashCollected * 100) / 100,
      receivables: Math.round(item.receivables * 100) / 100,
    }));
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

    const startOfYear = new Date(Date.UTC(targetYear, 0, 1, 0, 0, 0, 0));
    const endOfYear = new Date(Date.UTC(targetYear, 11, 31, 23, 59, 59, 999));

    const distinctDates = await Invoice.distinct("createdAt", {
      businessId: new mongoose.Types.ObjectId(businessId),
      status: { $ne: "CANCELLED" },
      createdAt: { $gte: startOfYear, $lte: endOfYear },
    });

    const monthSet = new Set();
    distinctDates.forEach((d) => {
      const dateObj = new Date(d);
      monthSet.add(dateObj.getUTCMonth() + 1);
    });

    const now = new Date();
    if (targetYear === now.getUTCFullYear()) {
      monthSet.add(now.getUTCMonth() + 1);
    }
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
   * Invoked upon sale checkout (T25) or payment settlement (T28) to eliminate revenue staleness.
   */
  async autoSyncOnSaleChange(businessId, saleDate) {
    if (!businessId || !saleDate) return;

    try {
      const dateObj = new Date(saleDate);
      if (isNaN(dateObj.getTime())) return;

      const year = dateObj.getUTCFullYear();
      const month = dateObj.getUTCMonth() + 1;

      // Recalculate this month
      await this.aggregateAndCacheMonth(businessId, year, month, "AUTO_ENGINE");

      // Also recalculate next month if exists for MoM consistency
      let nextYear = year;
      let nextMonth = month + 1;
      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear = year + 1;
      }

      const nextMonthExists = await monthlyRevenueRepository.findByBusinessAndMonth(
        businessId,
        nextYear,
        nextMonth
      );
      if (nextMonthExists) {
        await this.aggregateAndCacheMonth(businessId, nextYear, nextMonth, "AUTO_ENGINE");
      }
    } catch (err) {
      console.error("[RevenueAnalyticsService] AutoSync warning:", err.message);
    }
  }
}

module.exports = new RevenueAnalyticsService();
