const mongoose = require("mongoose");
const Invoice = require("../models/invoice.model");

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const FULL_MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/**
 * Sales Trends & Performance Engine Service (Phase 10 - Task T61)
 * Analyzes sales revenue (T52) and distinct order volume across hourly,
 * daily, weekly, and monthly time intervals with period comparisons
 * and peak/low performance identification.
 */
class SalesTrendsService {
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
   * Resolve date boundaries from query parameters
   */
  resolvePeriod({ from, to, periodPreset, date }) {
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth();
    const currentDay = now.getUTCDate();

    let startDate;
    let endDate;
    let resolvedPreset = periodPreset || "THIS_MONTH";

    // If a specific single date is provided (common for hourly view)
    if (date) {
      const d = new Date(date);
      if (isNaN(d.getTime())) {
        throw new Error("Invalid 'date' parameter format. Expected YYYY-MM-DD.");
      }
      startDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
      endDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
      resolvedPreset = "SINGLE_DAY";
    } else if (from || to) {
      if (!from || !to) {
        throw new Error("Both 'from' and 'to' date parameters are required for custom date range.");
      }
      startDate = new Date(from);
      endDate = new Date(to);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error("Invalid date format. Expected valid ISO date or YYYY-MM-DD.");
      }

      startDate.setUTCHours(0, 0, 0, 0);
      endDate.setUTCHours(23, 59, 59, 999);

      if (startDate > endDate) {
        throw new Error("'from' date cannot be after 'to' date.");
      }
      resolvedPreset = "CUSTOM";
    } else {
      switch (periodPreset) {
        case "TODAY": {
          startDate = new Date(Date.UTC(currentYear, currentMonth, currentDay, 0, 0, 0, 0));
          endDate = new Date(Date.UTC(currentYear, currentMonth, currentDay, 23, 59, 59, 999));
          break;
        }
        case "YESTERDAY": {
          startDate = new Date(Date.UTC(currentYear, currentMonth, currentDay - 1, 0, 0, 0, 0));
          endDate = new Date(Date.UTC(currentYear, currentMonth, currentDay - 1, 23, 59, 59, 999));
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
        case "PREVIOUS_MONTH": {
          const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          startDate = new Date(Date.UTC(prevYear, prevMonth, 1, 0, 0, 0, 0));
          endDate = new Date(Date.UTC(prevYear, prevMonth + 1, 0, 23, 59, 59, 999));
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

    return {
      startDate,
      endDate,
      from: this.formatUTCDate(startDate),
      to: this.formatUTCDate(endDate),
      preset: resolvedPreset,
    };
  }

  /**
   * Primary Sales Performance Trends Query Handler
   */
  async getSalesTrends(businessId, query = {}) {
    if (!businessId) {
      throw new Error("Business ID is required for multi-tenant isolation.");
    }

    const bId = new mongoose.Types.ObjectId(businessId);
    const { startDate, endDate, from, to, preset } = this.resolvePeriod(query);
    const groupBy = (query.groupBy || "day").toLowerCase();

    if (!["hour", "day", "week", "month"].includes(groupBy)) {
      throw new Error("Invalid 'groupBy' parameter. Allowed values: hour, day, week, month.");
    }

    // 1. Fetch sales aggregation for current period
    let series = [];
    if (groupBy === "hour") {
      series = await this.aggregateHourly(bId, startDate, endDate);
    } else if (groupBy === "week") {
      series = await this.aggregateWeekly(bId, startDate, endDate);
    } else if (groupBy === "month") {
      series = await this.aggregateMonthly(bId, startDate, endDate);
    } else {
      series = await this.aggregateDaily(bId, startDate, endDate);
    }

    // 2. Compute current period total aggregates
    let totalSales = 0;
    let totalOrders = 0;
    series.forEach((s) => {
      totalSales += s.sales || 0;
      totalOrders += s.orderCount || 0;
    });

    totalSales = Math.round(totalSales * 100) / 100;
    const averageOrderValue =
      totalOrders > 0 ? Math.round((totalSales / totalOrders) * 100) / 100 : 0;

    // 3. Peak and Low period identification
    let peakPeriod = null;
    let lowestPeriod = null;

    if (series.length > 0) {
      // Find peak
      peakPeriod = series.reduce((max, cur) => (cur.sales > (max?.sales || 0) ? cur : max), series[0]);

      // Find lowest among days/buckets that had sales, or lowest overall
      const activePeriods = series.filter((s) => s.sales > 0);
      if (activePeriods.length > 0) {
        lowestPeriod = activePeriods.reduce(
          (min, cur) => (cur.sales < min.sales ? cur : min),
          activePeriods[0]
        );
      } else {
        lowestPeriod = series[0];
      }
    }

    // 4. Previous-Period Comparison
    const comparison = await this.calculatePreviousPeriodComparison(
      bId,
      startDate,
      endDate,
      totalSales,
      totalOrders
    );

    return {
      groupBy,
      currency: "INR",
      period: {
        from,
        to,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        preset,
      },
      summary: {
        totalSales,
        totalOrders,
        averageOrderValue,
        peakPeriod: peakPeriod
          ? {
              label: peakPeriod.label,
              date: peakPeriod.date,
              sales: peakPeriod.sales,
              orderCount: peakPeriod.orderCount,
            }
          : null,
        lowestPeriod: lowestPeriod
          ? {
              label: lowestPeriod.label,
              date: lowestPeriod.date,
              sales: lowestPeriod.sales,
              orderCount: lowestPeriod.orderCount,
            }
          : null,
      },
      comparison,
      data: series,
    };
  }

  /**
   * Hourly Sales Aggregator for a selected date
   */
  async aggregateHourly(businessId, startDate, endDate) {
    const rawData = await Invoice.aggregate([
      {
        $match: {
          businessId,
          status: { $ne: "CANCELLED" },
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%H", date: "$createdAt", timezone: "UTC" } },
          sales: { $sum: "$total" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const hourMap = new Map();
    rawData.forEach((r) => hourMap.set(r._id, r));

    const series = [];
    for (let h = 0; h < 24; h++) {
      const hourKey = String(h).padStart(2, "0");
      const item = hourMap.get(hourKey);
      const sales = Math.round((item?.sales || 0) * 100) / 100;
      const orderCount = item?.orderCount || 0;

      // 12-hour AM/PM label
      const period = h >= 12 ? "PM" : "AM";
      const displayHour = h % 12 === 0 ? 12 : h % 12;
      const label = `${displayHour} ${period}`;

      series.push({
        date: `${this.formatUTCDate(startDate)}T${hourKey}:00:00Z`,
        key: hourKey,
        label,
        time: `${hourKey}:00`,
        sales,
        orderCount,
        averageOrderValue: orderCount > 0 ? Math.round((sales / orderCount) * 100) / 100 : 0,
      });
    }

    return series;
  }

  /**
   * Daily Sales Aggregator
   */
  async aggregateDaily(businessId, startDate, endDate) {
    const rawData = await Invoice.aggregate([
      {
        $match: {
          businessId,
          status: { $ne: "CANCELLED" },
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } },
          sales: { $sum: "$total" },
          orderCount: { $sum: 1 },
        },
      },
    ]);

    const dayMap = new Map();
    rawData.forEach((r) => dayMap.set(r._id, r));

    const series = [];
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    let cur = new Date(startDate);
    for (let i = 0; i < Math.min(diffDays, 366); i++) {
      if (cur > endDate) break;

      const dateStr = this.formatUTCDate(cur);
      const item = dayMap.get(dateStr);
      const sales = Math.round((item?.sales || 0) * 100) / 100;
      const orderCount = item?.orderCount || 0;
      const displayLabel = `${cur.getUTCDate()} ${MONTH_NAMES[cur.getUTCMonth()]}`;

      series.push({
        date: dateStr,
        key: dateStr,
        label: displayLabel,
        sales,
        orderCount,
        averageOrderValue: orderCount > 0 ? Math.round((sales / orderCount) * 100) / 100 : 0,
      });

      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    return series;
  }

  /**
   * Weekly Sales Aggregator
   */
  async aggregateWeekly(businessId, startDate, endDate) {
    const rawData = await Invoice.aggregate([
      {
        $match: {
          businessId,
          status: { $ne: "CANCELLED" },
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: { date: "$createdAt", timezone: "UTC" } },
            week: { $isoWeek: { date: "$createdAt", timezone: "UTC" } },
          },
          sales: { $sum: "$total" },
          orderCount: { $sum: 1 },
          minDate: { $min: "$createdAt" },
        },
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
    ]);

    const weekMap = new Map();
    rawData.forEach((r) => {
      const key = `${r._id.year}-W${String(r._id.week).padStart(2, "0")}`;
      weekMap.set(key, r);
    });

    // Generate weekly slots across the range
    const series = [];
    let cur = new Date(startDate);

    while (cur <= endDate) {
      // Calculate ISO week
      const temp = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate()));
      const dayNum = (temp.getUTCDay() + 6) % 7;
      temp.setUTCDate(temp.getUTCDate() - dayNum + 3);
      const firstThursday = temp.getTime();
      temp.setUTCMonth(0, 1);
      if (temp.getUTCDay() !== 4) {
        temp.setUTCMonth(0, 1 + ((4 - temp.getUTCDay() + 7) % 7));
      }
      const weekNo = 1 + Math.ceil((firstThursday - temp.getTime()) / 604800000);
      const yearNo = new Date(firstThursday).getUTCFullYear();
      const weekKey = `${yearNo}-W${String(weekNo).padStart(2, "0")}`;

      if (!series.some((s) => s.key === weekKey)) {
        const item = weekMap.get(weekKey);
        const sales = Math.round((item?.sales || 0) * 100) / 100;
        const orderCount = item?.orderCount || 0;
        const label = `Week ${weekNo} (${MONTH_NAMES[cur.getUTCMonth()]})`;

        series.push({
          date: this.formatUTCDate(cur),
          key: weekKey,
          label,
          weekNumber: weekNo,
          year: yearNo,
          sales,
          orderCount,
          averageOrderValue: orderCount > 0 ? Math.round((sales / orderCount) * 100) / 100 : 0,
        });
      }

      // Advance by 7 days
      cur.setUTCDate(cur.getUTCDate() + 7);
    }

    return series;
  }

  /**
   * Monthly Sales Aggregator
   */
  async aggregateMonthly(businessId, startDate, endDate) {
    const rawData = await Invoice.aggregate([
      {
        $match: {
          businessId,
          status: { $ne: "CANCELLED" },
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: "UTC" } },
          sales: { $sum: "$total" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const monthMap = new Map();
    rawData.forEach((r) => monthMap.set(r._id, r));

    const series = [];
    let cur = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1));
    const endMonth = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), 1));

    while (cur <= endMonth) {
      const year = cur.getUTCFullYear();
      const mNum = cur.getUTCMonth() + 1;
      const monthKey = `${year}-${String(mNum).padStart(2, "0")}`;

      const item = monthMap.get(monthKey);
      const sales = Math.round((item?.sales || 0) * 100) / 100;
      const orderCount = item?.orderCount || 0;
      const label = `${MONTH_NAMES[mNum - 1]} ${year}`;

      series.push({
        date: `${monthKey}-01`,
        key: monthKey,
        label,
        year,
        month: mNum,
        sales,
        orderCount,
        averageOrderValue: orderCount > 0 ? Math.round((sales / orderCount) * 100) / 100 : 0,
      });

      cur.setUTCMonth(cur.getUTCMonth() + 1);
    }

    return series;
  }

  /**
   * Calculate previous comparable period metrics and growth rates
   */
  async calculatePreviousPeriodComparison(businessId, startDate, endDate, currentSales, currentOrders) {
    const durationMs = endDate.getTime() - startDate.getTime();
    const prevEndDate = new Date(startDate.getTime() - 1);
    const prevStartDate = new Date(prevEndDate.getTime() - durationMs);

    const [prevAgg] = await Invoice.aggregate([
      {
        $match: {
          businessId,
          status: { $ne: "CANCELLED" },
          createdAt: { $gte: prevStartDate, $lte: prevEndDate },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$total" },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    const previousSales = Math.round((prevAgg?.totalSales || 0) * 100) / 100;
    const previousOrders = prevAgg?.totalOrders || 0;

    const salesVariance = Math.round((currentSales - previousSales) * 100) / 100;
    const ordersVariance = currentOrders - previousOrders;

    let salesGrowthPercentage = 0;
    if (previousSales > 0) {
      salesGrowthPercentage = Math.round(((salesVariance / previousSales) * 100) * 10) / 10;
    } else if (previousSales === 0 && currentSales > 0) {
      salesGrowthPercentage = 100;
    }

    let ordersGrowthPercentage = 0;
    if (previousOrders > 0) {
      ordersGrowthPercentage = Math.round(((ordersVariance / previousOrders) * 100) * 10) / 10;
    } else if (previousOrders === 0 && currentOrders > 0) {
      ordersGrowthPercentage = 100;
    }

    return {
      previousPeriod: {
        from: this.formatUTCDate(prevStartDate),
        to: this.formatUTCDate(prevEndDate),
      },
      previousSales,
      previousOrders,
      salesVariance,
      ordersVariance,
      salesGrowthPercentage,
      ordersGrowthPercentage,
      isComparable: true,
    };
  }
}

module.exports = new SalesTrendsService();
