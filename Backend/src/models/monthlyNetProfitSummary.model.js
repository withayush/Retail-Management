const mongoose = require("mongoose");

/**
 * Monthly Net Profit Summary Schema (Phase 9 - Task T56)
 * Materialized, persistent calendar-month Net Profit & Operating Profitability cache.
 * Source of truth for ultimate bottom-line truth:
 * Net Profit = Gross Profit - Operating Expenses (or Revenue - COGS - OpEx).
 * Connects T52 (Revenue), T53 (COGS), T54 (Gross Profit), and T55 (Operating Expenses).
 */
const monthlyNetProfitSummarySchema = new mongoose.Schema(
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

    // 1. Complete Financial Waterfall Chain
    revenue: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    cogs: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    grossProfit: {
      type: Number,
      required: true,
      default: 0,
    },

    grossMarginPercentage: {
      type: Number,
      default: 0,
    },

    operatingExpenses: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    opexToRevenueRatio: {
      type: Number,
      default: 0,
    },

    // 2. Net Profit (Ultimate Bottom Line Truth)
    netProfit: {
      type: Number,
      required: true,
      default: 0,
    },

    netProfitMargin: {
      type: Number,
      default: 0, // (netProfit / revenue) * 100
    },

    // Dual alias for strict accounting taxonomy
    operatingProfit: {
      type: Number,
      default: 0,
    },

    operatingMargin: {
      type: Number,
      default: 0,
    },

    coverageRatio: {
      type: Number,
      default: 0, // grossProfit / operatingExpenses
    },

    status: {
      type: String,
      enum: ["PROFITABLE", "BREAK_EVEN", "LOSS_MAKING"],
      default: "BREAK_EVEN",
      index: true,
    },

    healthRating: {
      type: String,
      enum: ["EXCELLENT", "HEALTHY", "SLIM_PROFIT", "BREAK_EVEN", "LOSS"],
      default: "BREAK_EVEN",
    },

    // 3. Cost Share Waterfall Distribution (% of recognized revenue)
    costBreakdown: {
      cogsShare: { type: Number, default: 0 },
      opexShare: { type: Number, default: 0 },
      netProfitShare: { type: Number, default: 0 },
    },

    // 4. Granular Day-by-Day Financial Ledger
    dailyBreakdown: [
      {
        date: { type: String, required: true },
        day: { type: Number, required: true },
        revenue: { type: Number, default: 0 },
        cogs: { type: Number, default: 0 },
        grossProfit: { type: Number, default: 0 },
        opex: { type: Number, default: 0 },
        netProfit: { type: Number, default: 0 },
        margin: { type: Number, default: 0 },
        status: { type: String, enum: ["PROFIT", "BREAK_EVEN", "LOSS"], default: "BREAK_EVEN" },
      },
    ],

    // 5. Month-over-Month Dynamics
    previousMonthNetProfit: {
      type: Number,
      default: 0,
    },

    momVariance: {
      type: Number,
      default: 0,
    },

    momGrowthRate: {
      type: Number,
      default: 0,
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
monthlyNetProfitSummarySchema.index(
  { businessId: 1, year: 1, month: 1 },
  { unique: true }
);
monthlyNetProfitSummarySchema.index(
  { businessId: 1, monthKey: 1 },
  { unique: true }
);
monthlyNetProfitSummarySchema.index(
  { businessId: 1, year: 1, netProfit: -1 }
);

const MonthlyNetProfitSummary = mongoose.model(
  "MonthlyNetProfitSummary",
  monthlyNetProfitSummarySchema
);

module.exports = MonthlyNetProfitSummary;
