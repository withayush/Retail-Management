const mongoose = require("mongoose");
const netProfitAnalyticsService = require("./netProfitAnalytics.service");

/**
 * Profit Breakdown & Visualizer Analytics Service (Phase 10 - Task T62)
 *
 * Implements the financial presentation layer explaining how recognized revenue
 * is reduced by Cost of Goods Sold (COGS) and Operating Expenses (OpEx)
 * to produce Gross Profit and Operating Profit.
 *
 * Reuses established T52-T56 accounting engines without reimplementing formulas.
 * Formula:
 *   Revenue - COGS = Gross Profit
 *   Gross Profit - Operating Expenses = Operating Profit
 *   Gross Margin = (Gross Profit / Revenue) * 100
 *   Operating Margin = (Operating Profit / Revenue) * 100
 */
class ProfitBreakdownService {
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
   * Calculate previous equivalent period for comparison
   */
  resolvePreviousPeriod({ startDate, endDate, periodPreset }) {
    if (periodPreset === "THIS_MONTH") {
      const year = startDate.getUTCFullYear();
      const month = startDate.getUTCMonth();
      const prevYear = month === 0 ? year - 1 : year;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevStart = new Date(Date.UTC(prevYear, prevMonth, 1, 0, 0, 0, 0));
      const prevEnd = new Date(Date.UTC(prevYear, prevMonth + 1, 0, 23, 59, 59, 999));
      return {
        startDate: prevStart,
        endDate: prevEnd,
        from: this.formatUTCDate(prevStart),
        to: this.formatUTCDate(prevEnd),
      };
    }

    if (periodPreset === "PREVIOUS_MONTH") {
      const year = startDate.getUTCFullYear();
      const month = startDate.getUTCMonth();
      const prevYear = month === 0 ? year - 1 : year;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevStart = new Date(Date.UTC(prevYear, prevMonth, 1, 0, 0, 0, 0));
      const prevEnd = new Date(Date.UTC(prevYear, prevMonth + 1, 0, 23, 59, 59, 999));
      return {
        startDate: prevStart,
        endDate: prevEnd,
        from: this.formatUTCDate(prevStart),
        to: this.formatUTCDate(prevEnd),
      };
    }

    // Default duration shift (e.g. for LAST_30_DAYS, THIS_YEAR, or CUSTOM)
    const durationMs = endDate.getTime() - startDate.getTime();
    const prevEnd = new Date(startDate.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - durationMs);
    prevStart.setUTCHours(0, 0, 0, 0);
    prevEnd.setUTCHours(23, 59, 59, 999);

    return {
      startDate: prevStart,
      endDate: prevEnd,
      from: this.formatUTCDate(prevStart),
      to: this.formatUTCDate(prevEnd),
    };
  }

  /**
   * Helper to safely compute percentage change between two values
   */
  computePercentageChange(current, previous) {
    if (previous === 0) {
      if (current === 0) return 0;
      return current > 0 ? 100 : -100;
    }
    const diff = current - previous;
    return Math.round(((diff / Math.abs(previous)) * 100) * 10) / 10;
  }

  /**
   * Builds the true waterfall chart dataset from revenue to operating profit
   */
  buildWaterfallData(revenue, cogs, grossProfit, operatingExpenses, operatingProfit) {
    // Stage 1: Recognized Revenue (Total Bar)
    const step1Revenue = {
      id: "revenue",
      step: "Revenue",
      label: "Gross Recognized Revenue",
      type: "total",
      amount: revenue,
      startLevel: 0,
      endLevel: revenue,
      base: 0,
      value: revenue,
      isDeduction: false,
      fill: "#10B981", // Emerald
      stroke: "#059669",
    };

    // Stage 2: Cost of Goods Sold (COGS Floating Deduction Bar)
    // Drops cumulative balance from Revenue down to Gross Profit
    const step2Cogs = {
      id: "cogs",
      step: "Cost of Goods Sold",
      label: "Cost of Goods Sold (COGS)",
      type: "deduction",
      amount: -cogs,
      startLevel: revenue,
      endLevel: grossProfit,
      // In Recharts stacked bar: base is the lower of startLevel and endLevel (or 0 if negative)
      base: Math.max(0, grossProfit),
      value: cogs,
      isDeduction: true,
      fill: "#EF4444", // Crimson / Red
      stroke: "#DC2626",
    };

    // Stage 3: Gross Profit Subtotal
    const step3GrossProfit = {
      id: "grossProfit",
      step: "Gross Profit",
      label: "Gross Profit (Revenue - COGS)",
      type: "subtotal",
      amount: grossProfit,
      startLevel: 0,
      endLevel: grossProfit,
      base: grossProfit < 0 ? grossProfit : 0,
      value: Math.abs(grossProfit),
      isDeduction: false,
      fill: grossProfit >= 0 ? "#3B82F6" : "#EF4444", // Blue or Red if negative
      stroke: grossProfit >= 0 ? "#2563EB" : "#DC2626",
    };

    // Stage 4: Operating Expenses (OpEx Floating Deduction Bar)
    // Drops cumulative balance from Gross Profit down to Operating Profit
    const step4OpEx = {
      id: "operatingExpenses",
      step: "Operating Expenses",
      label: "Operating Expenses (OpEx)",
      type: "deduction",
      amount: -operatingExpenses,
      startLevel: grossProfit,
      endLevel: operatingProfit,
      // In Recharts stacked bar: base is the lower of startLevel and endLevel
      base: Math.max(0, operatingProfit),
      value: operatingExpenses,
      isDeduction: true,
      fill: "#F59E0B", // Amber
      stroke: "#D97706",
    };

    // Stage 5: Operating Profit (Final Total / Bottom-line Bar)
    const step5OperatingProfit = {
      id: "operatingProfit",
      step: "Operating Profit",
      label: "Operating Profit (Gross Profit - OpEx)",
      type: "total",
      amount: operatingProfit,
      startLevel: 0,
      endLevel: operatingProfit,
      base: operatingProfit < 0 ? operatingProfit : 0,
      value: Math.abs(operatingProfit),
      isDeduction: false,
      isNegative: operatingProfit < 0,
      fill: operatingProfit >= 0 ? "#8B5CF6" : "#EF4444", // Purple / Violet or Red
      stroke: operatingProfit >= 0 ? "#7C3AED" : "#DC2626",
    };

    return [step1Revenue, step2Cogs, step3GrossProfit, step4OpEx, step5OperatingProfit];
  }

  /**
   * Primary Profit Breakdown API Engine
   */
  async getProfitBreakdown(businessId, query = {}) {
    if (!businessId) {
      throw new Error("Business ID is required for multi-tenant isolation.");
    }

    const bId = new mongoose.Types.ObjectId(businessId);
    const { startDate, endDate, from, to, periodPreset } = this.resolvePeriodBoundaries(query);

    // Concurrently fetch current period metrics and previous period for comparison
    const previousPeriod = this.resolvePreviousPeriod({ startDate, endDate, periodPreset });

    const [currentNetProfit, prevNetProfit] = await Promise.all([
      netProfitAnalyticsService.calculatePeriodNetProfit(bId, {
        startDate,
        endDate,
        from,
        to,
      }),
      netProfitAnalyticsService
        .calculatePeriodNetProfit(bId, {
          startDate: previousPeriod.startDate,
          endDate: previousPeriod.endDate,
          from: previousPeriod.from,
          to: previousPeriod.to,
        })
        .catch((err) => {
          console.warn("[ProfitBreakdownService] Previous period calculation warning:", err.message);
          return null;
        }),
    ]);

    // Financial definitions directly from T52-T56
    const revenue = Math.round((currentNetProfit.revenue || 0) * 100) / 100;
    const cogs = Math.round((currentNetProfit.cogs || 0) * 100) / 100;
    const grossProfit = Math.round((currentNetProfit.grossProfit || 0) * 100) / 100;
    const operatingExpenses = Math.round((currentNetProfit.operatingExpenses || 0) * 100) / 100;
    const operatingProfit =
      Math.round(
        (currentNetProfit.operatingProfit !== undefined
          ? currentNetProfit.operatingProfit
          : currentNetProfit.netProfit || 0) * 100
      ) / 100;

    // Zero-revenue safe division; do not clamp negative margins to zero
    const grossMargin =
      revenue > 0 ? Math.round(((grossProfit / revenue) * 100) * 100) / 100 : 0;
    const operatingMargin =
      revenue > 0 ? Math.round(((operatingProfit / revenue) * 100) * 100) / 100 : 0;

    // Waterfall progression data
    const waterfall = this.buildWaterfallData(
      revenue,
      cogs,
      grossProfit,
      operatingExpenses,
      operatingProfit
    );

    // Period-over-period comparison details
    let comparison = null;
    if (prevNetProfit) {
      const prevRevenue = Math.round((prevNetProfit.revenue || 0) * 100) / 100;
      const prevCogs = Math.round((prevNetProfit.cogs || 0) * 100) / 100;
      const prevGrossProfit = Math.round((prevNetProfit.grossProfit || 0) * 100) / 100;
      const prevOperatingExpenses = Math.round((prevNetProfit.operatingExpenses || 0) * 100) / 100;
      const prevOperatingProfit =
        Math.round(
          (prevNetProfit.operatingProfit !== undefined
            ? prevNetProfit.operatingProfit
            : prevNetProfit.netProfit || 0) * 100
        ) / 100;

      const prevGrossMargin =
        prevRevenue > 0 ? Math.round(((prevGrossProfit / prevRevenue) * 100) * 100) / 100 : 0;
      const prevOperatingMargin =
        prevRevenue > 0 ? Math.round(((prevOperatingProfit / prevRevenue) * 100) * 100) / 100 : 0;

      comparison = {
        hasPreviousPeriod: true,
        previousPeriod: {
          from: previousPeriod.from,
          to: previousPeriod.to,
        },
        metrics: {
          revenue: {
            current: revenue,
            previous: prevRevenue,
            change: Math.round((revenue - prevRevenue) * 100) / 100,
            changePercent: this.computePercentageChange(revenue, prevRevenue),
          },
          cogs: {
            current: cogs,
            previous: prevCogs,
            change: Math.round((cogs - prevCogs) * 100) / 100,
            changePercent: this.computePercentageChange(cogs, prevCogs),
          },
          grossProfit: {
            current: grossProfit,
            previous: prevGrossProfit,
            change: Math.round((grossProfit - prevGrossProfit) * 100) / 100,
            changePercent: this.computePercentageChange(grossProfit, prevGrossProfit),
          },
          operatingExpenses: {
            current: operatingExpenses,
            previous: prevOperatingExpenses,
            change: Math.round((operatingExpenses - prevOperatingExpenses) * 100) / 100,
            changePercent: this.computePercentageChange(operatingExpenses, prevOperatingExpenses),
          },
          operatingProfit: {
            current: operatingProfit,
            previous: prevOperatingProfit,
            change: Math.round((operatingProfit - prevOperatingProfit) * 100) / 100,
            changePercent: this.computePercentageChange(operatingProfit, prevOperatingProfit),
          },
          grossMargin: {
            current: grossMargin,
            previous: prevGrossMargin,
            change: Math.round((grossMargin - prevGrossMargin) * 100) / 100,
          },
          operatingMargin: {
            current: operatingMargin,
            previous: prevOperatingMargin,
            change: Math.round((operatingMargin - prevOperatingMargin) * 100) / 100,
          },
        },
      };
    }

    return {
      period: {
        from,
        to,
        preset: periodPreset,
      },
      currency: "INR",
      revenue,
      cogs,
      grossProfit,
      operatingExpenses,
      operatingProfit,
      grossMargin,
      operatingMargin,
      status: currentNetProfit.status || (operatingProfit > 0 ? "PROFITABLE" : operatingProfit < 0 ? "LOSS_MAKING" : "BREAK_EVEN"),
      healthRating: currentNetProfit.healthRating || (operatingProfit > 0 ? "HEALTHY" : "LOSS"),
      waterfall,
      comparison,
    };
  }
}

module.exports = new ProfitBreakdownService();
