const mongoose = require("mongoose");
const netProfitAnalyticsService = require("./netProfitAnalytics.service");
const receivablesAnalyticsService = require("./receivablesAnalytics.service");
const payablesAnalyticsService = require("./payablesAnalytics.service");
const Invoice = require("../models/invoice.model");
const Expense = require("../models/expense.model");
const SaleItem = require("../models/saleItem.model");

/**
 * Dashboard Analytics Engine Service (Phase 10 - Task T60)
 * Orchestrates T52 (Revenue), T53 (COGS), T54 (Gross Profit), T55 (OpEx),
 * T56 (Net Profit / Operating Profit), T57 (Receivables), T58 (Payables),
 * and T59 (Cash Position - gracefully marked as unavailable if not implemented).
 */
class DashboardService {
  /**
   * Helper to format Date to YYYY-MM-DD in UTC
   */
  formatUTCDate(d) {
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  /**
   * Resolve reporting period boundaries with strict UTC normalization
   */
  resolvePeriodBoundaries({ from, to, periodPreset }) {
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth(); // 0-indexed
    const currentDay = now.getUTCDate();

    let startDate;
    let endDate;
    let resolvedPreset = periodPreset || "THIS_MONTH";

    if (from || to) {
      if (!from || !to) {
        throw new Error("Both 'from' and 'to' date parameters are required for custom date range.");
      }

      startDate = new Date(from);
      endDate = new Date(to);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error("Invalid date format. Expected valid ISO date or YYYY-MM-DD.");
      }

      // Normalize boundaries: Start at 00:00:00.000 UTC, End at 23:59:59.999 UTC
      startDate.setUTCHours(0, 0, 0, 0);
      endDate.setUTCHours(23, 59, 59, 999);

      if (startDate > endDate) {
        throw new Error("'from' date cannot be after 'to' date.");
      }

      resolvedPreset = "CUSTOM";
    } else {
      switch (periodPreset) {
        case "PREVIOUS_MONTH": {
          const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          startDate = new Date(Date.UTC(prevYear, prevMonth, 1, 0, 0, 0, 0));
          endDate = new Date(Date.UTC(prevYear, prevMonth + 1, 0, 23, 59, 59, 999));
          break;
        }
        case "LAST_7_DAYS": {
          startDate = new Date(Date.UTC(currentYear, currentMonth, currentDay - 6, 0, 0, 0, 0));
          endDate = new Date(Date.UTC(currentYear, currentMonth, currentDay, 23, 59, 59, 999));
          break;
        }
        case "LAST_30_DAYS": {
          startDate = new Date(Date.UTC(currentYear, currentMonth, currentDay - 29, 0, 0, 0, 0));
          endDate = new Date(Date.UTC(currentYear, currentMonth, currentDay, 23, 59, 59, 999));
          break;
        }
        case "THIS_YEAR": {
          startDate = new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0, 0));
          endDate = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59, 999));
          break;
        }
        case "THIS_MONTH":
        default: {
          startDate = new Date(Date.UTC(currentYear, currentMonth, 1, 0, 0, 0, 0));
          endDate = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59, 999));
          resolvedPreset = "THIS_MONTH";
          break;
        }
      }
    }

    const fromFormatted = this.formatUTCDate(startDate);
    const toFormatted = this.formatUTCDate(endDate);

    return {
      startDate,
      endDate,
      from: fromFormatted,
      to: toFormatted,
      periodPreset: resolvedPreset,
    };
  }

  /**
   * Primary Business Summary Aggregator for T60
   * Combines period-based metrics (Revenue, Profit, Margins, OpEx)
   * with current snapshot metrics (Receivables, Payables, Cash Position)
   * and synchronized time series for interactive charts.
   */
  async getBusinessSummary(businessId, query = {}) {
    if (!businessId) {
      throw new Error("Business ID is required for multi-tenant isolation.");
    }

    const bId = new mongoose.Types.ObjectId(businessId);
    const { startDate, endDate, from, to, periodPreset } = this.resolvePeriodBoundaries(query);

    // 1. Fetch period financial figures (T52-T56) and current snapshots (T57, T58) concurrently
    const [periodNetProfit, receivablesRes, payablesRes, trendsData] = await Promise.all([
      netProfitAnalyticsService.calculatePeriodNetProfit(bId, {
        startDate,
        endDate,
        from,
        to,
      }),
      receivablesAnalyticsService.getConsolidatedReceivablesIndex(bId, { limit: 1 }).catch((err) => {
        console.warn("[DashboardService] Receivables warning:", err.message);
        return { totalReceivables: 0, grossReceivables: 0 };
      }),
      payablesAnalyticsService.getConsolidatedPayablesIndex(bId, { limit: 1 }).catch((err) => {
        console.warn("[DashboardService] Payables warning:", err.message);
        return { totalPayables: 0, grossPayables: 0 };
      }),
      this.aggregateTrends(bId, startDate, endDate),
    ]);

    // 2. Extract and format period metrics
    const revenue = Math.round((periodNetProfit.revenue || 0) * 100) / 100;
    const cogs = Math.round((periodNetProfit.cogs || 0) * 100) / 100;
    const grossProfit = Math.round((periodNetProfit.grossProfit || 0) * 100) / 100;
    const operatingExpenses = Math.round((periodNetProfit.operatingExpenses || 0) * 100) / 100;
    const operatingProfit = Math.round((periodNetProfit.operatingProfit !== undefined ? periodNetProfit.operatingProfit : periodNetProfit.netProfit || 0) * 100) / 100;

    // Calculate margins safely (zero-revenue guard to prevent NaN / Infinity)
    const grossMargin = revenue > 0 ? Math.round(((grossProfit / revenue) * 100) * 10) / 10 : 0;
    const operatingMargin = revenue > 0 ? Math.round(((operatingProfit / revenue) * 100) * 10) / 10 : 0;

    // 3. Extract snapshot metrics (point-in-time semantics)
    const receivables = Math.round((receivablesRes.totalReceivables || receivablesRes.grossReceivables || 0) * 100) / 100;
    const payables = Math.round((payablesRes.totalPayables || payablesRes.grossPayables || 0) * 100) / 100;

    // 4. Cash Position (T59 status):
    // In accordance with specification: Cash Position is a point-in-time metric (Source: T59).
    // T59 is not yet implemented in the backend, so we clearly report its unavailable status
    // rather than fabricating data.
    const cashPosition = null;
    const cashPositionStatus = {
      isAvailable: false,
      missingDependency: "T59",
      label: "Current Cash Position",
      description: "Eligible financial accounts integration (T59) is pending.",
    };

    return {
      period: {
        from,
        to,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        preset: periodPreset,
      },
      // Summary Cards Data
      revenue,
      cogs,
      grossProfit,
      operatingExpenses,
      operatingProfit,
      grossMargin,
      operatingMargin,
      cashPosition,
      cashPositionStatus,
      receivables,
      payables,
      // Status indicators
      profitabilityStatus: periodNetProfit.status || (operatingProfit > 0 ? "PROFITABLE" : operatingProfit < 0 ? "LOSS_MAKING" : "BREAK_EVEN"),
      healthRating: periodNetProfit.healthRating || "HEALTHY",
      currency: "INR",
      // Time-series trends for Charts A, B, and C
      trends: trendsData.timeline,
      trendsSummary: trendsData.summary,
    };
  }

  /**
   * Aggregate Synchronized Daily Timeline Data for Charts A, B, and C
   * Chart A: Revenue Trend
   * Chart B: Revenue vs Operating Expenses
   * Chart C: Profit and Margin Trend
   */
  async aggregateTrends(businessId, startDate, endDate) {
    const bId = new mongoose.Types.ObjectId(businessId);

    // 1. Daily Revenue & Invoice Count from Invoices
    const revenueAgg = await Invoice.aggregate([
      {
        $match: {
          businessId: bId,
          status: { $ne: "CANCELLED" },
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } },
          revenue: { $sum: "$total" },
          invoiceCount: { $sum: 1 },
          cashCollected: { $sum: "$paidAmount" },
        },
      },
    ]);

    // 2. Daily COGS from SaleItems
    const cogsAgg = await SaleItem.aggregate([
      {
        $match: {
          businessId: bId,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
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
          "invoice.status": { $ne: "CANCELLED" },
        },
      },
      {
        $project: {
          createdAt: 1,
          lineCogs: {
            $multiply: [
              { $ifNull: ["$costPrice", 0] },
              { $ifNull: ["$quantity", 1] },
            ],
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } },
          cogs: { $sum: "$lineCogs" },
        },
      },
    ]);

    // 3. Daily Operating Expenses from Expense
    const expenseAgg = await Expense.aggregate([
      {
        $match: {
          businessId: bId,
          expenseDate: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$expenseDate", timezone: "UTC" } },
          operatingExpenses: { $sum: "$amount" },
          expenseCount: { $sum: 1 },
        },
      },
    ]);

    // Index daily maps
    const revMap = new Map();
    revenueAgg.forEach((r) => revMap.set(r._id, r));

    const cogsMap = new Map();
    cogsAgg.forEach((c) => cogsMap.set(c._id, c));

    const expMap = new Map();
    expenseAgg.forEach((e) => expMap.set(e._id, e));

    // Determine interval days count
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const timeline = [];
    let curDate = new Date(startDate);

    // Build uniform day-by-day continuous timeline to avoid chart gaps
    for (let i = 0; i < Math.min(diffDays, 366); i++) {
      const dateKey = this.formatUTCDate(curDate);
      if (curDate > endDate) break;

      const revItem = revMap.get(dateKey);
      const cogsItem = cogsMap.get(dateKey);
      const expItem = expMap.get(dateKey);

      const dRevenue = Math.round((revItem?.revenue || 0) * 100) / 100;
      const dCogs = Math.round((cogsItem?.cogs || 0) * 100) / 100;
      const dGrossProfit = Math.round((dRevenue - dCogs) * 100) / 100;
      const dGrossMargin = dRevenue > 0 ? Math.round(((dGrossProfit / dRevenue) * 100) * 10) / 10 : 0;

      const dOpEx = Math.round((expItem?.operatingExpenses || 0) * 100) / 100;
      const dOperatingProfit = Math.round((dGrossProfit - dOpEx) * 100) / 100;
      const dOperatingMargin = dRevenue > 0 ? Math.round(((dOperatingProfit / dRevenue) * 100) * 10) / 10 : 0;

      // Human readable date label, e.g. "Oct 12"
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const displayLabel = `${curDate.getUTCDate()} ${monthNames[curDate.getUTCMonth()]}`;

      timeline.push({
        date: dateKey,
        label: displayLabel,
        revenue: dRevenue,
        cogs: dCogs,
        grossProfit: dGrossProfit,
        grossMargin: dGrossMargin,
        operatingExpenses: dOpEx,
        operatingProfit: dOperatingProfit,
        operatingMargin: dOperatingMargin,
        invoiceCount: revItem?.invoiceCount || 0,
        expenseCount: expItem?.expenseCount || 0,
      });

      curDate.setUTCDate(curDate.getUTCDate() + 1);
    }

    return {
      timeline,
      summary: {
        totalDays: timeline.length,
        daysWithSales: timeline.filter((d) => d.revenue > 0).length,
        daysWithExpenses: timeline.filter((d) => d.operatingExpenses > 0).length,
      },
    };
  }
}

module.exports = new DashboardService();
