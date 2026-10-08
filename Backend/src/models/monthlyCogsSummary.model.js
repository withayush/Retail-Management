const mongoose = require("mongoose");

/**
 * Monthly Cost of Goods Sold (COGS) Summary Schema (Phase 9 - Task T53)
 * Materialized, persistent calendar-month COGS aggregation cache.
 * Source of truth for raw inventory cost of goods sold based on historical cost snapshots.
 * Mathematical calculation: SUM(Sale Item costPrice * quantity) over calendar months and periods.
 */
const monthlyCogsSummarySchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: [true, "Business ID is required for multi-tenant isolation."],
      index: true,
    },

    year: {
      type: Number,
      required: [true, "Year is required."],
      min: 2000,
      max: 2100,
      index: true,
    },

    month: {
      type: Number,
      required: [true, "Month is required."],
      min: 1,
      max: 12,
      index: true,
    },

    monthKey: {
      type: String, // e.g. "2026-10"
      required: true,
      trim: true,
      index: true,
    },

    monthName: {
      type: String, // e.g. "October 2026"
      required: true,
      trim: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    // Total Cost of Goods Sold: SUM(SaleItem.costPrice * SaleItem.quantity)
    totalCogs: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // Total Recognized Gross Revenue for the same period: SUM(SaleItem.totalPrice)
    totalRevenue: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Gross Profit: totalRevenue - totalCogs
    grossProfit: {
      type: Number,
      default: 0,
    },

    // Gross Margin Percentage: ((totalRevenue - totalCogs) / totalRevenue) * 100
    grossMarginPercentage: {
      type: Number,
      default: 0,
    },

    // Total units of inventory sold in this period
    totalUnitsSold: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Average unit cost: totalCogs / totalUnitsSold
    averageUnitCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Number of distinct sales/invoices containing items in this period
    invoiceCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Daily run rate: totalCogs / daysInMonth
    dailyRunRate: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Product Cost Drivers Breakdown (Top products sorted by total cost)
    productBreakdown: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: { type: String, default: "" },
        sku: { type: String, default: "" },
        unit: { type: String, default: "pcs" },
        unitsSold: { type: Number, default: 0 },
        historicalCostPrice: { type: Number, default: 0 }, // average or snapshot cost
        totalCogs: { type: Number, default: 0 },
        totalRevenue: { type: Number, default: 0 },
        grossProfit: { type: Number, default: 0 },
        grossMarginPercentage: { type: Number, default: 0 },
        costSharePercentage: { type: Number, default: 0 }, // (product Cogs / total Cogs) * 100
      },
    ],

    // Daily breakdown for this calendar month (Day-by-Day sequence)
    dailyBreakdown: [
      {
        date: { type: String, required: true }, // "YYYY-MM-DD"
        day: { type: Number, required: true }, // 1-31
        cogs: { type: Number, default: 0 },
        revenue: { type: Number, default: 0 },
        grossProfit: { type: Number, default: 0 },
        unitsSold: { type: Number, default: 0 },
        invoiceCount: { type: Number, default: 0 },
      },
    ],

    // Month-over-Month (MoM) Analytics vs previous calendar month
    previousMonthCogs: {
      type: Number,
      default: 0,
    },

    momVariance: {
      type: Number,
      default: 0, // totalCogs - previousMonthCogs
    },

    momGrowthRate: {
      type: Number,
      default: 0, // % change vs previous calendar month
    },

    // Status: ACTIVE (ongoing month) vs FINALIZED (past closed month)
    status: {
      type: String,
      enum: ["ACTIVE", "FINALIZED"],
      default: "ACTIVE",
    },

    lastAggregatedAt: {
      type: Date,
      default: Date.now,
    },

    aggregatedBy: {
      type: String,
      enum: ["AUTO_ENGINE", "MANUAL_RECALCULATE", "CRON_SYNC"],
      default: "AUTO_ENGINE",
    },
  },
  {
    timestamps: true,
  }
);

// Compound Multi-Tenant Unique Constraints
monthlyCogsSummarySchema.index({ businessId: 1, year: 1, month: 1 }, { unique: true });
monthlyCogsSummarySchema.index({ businessId: 1, monthKey: 1 }, { unique: true });
monthlyCogsSummarySchema.index({ businessId: 1, year: 1, totalCogs: -1 });

const MonthlyCogsSummary = mongoose.model("MonthlyCogsSummary", monthlyCogsSummarySchema);

module.exports = MonthlyCogsSummary;
