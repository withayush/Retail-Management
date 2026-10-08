const mongoose = require("mongoose");

/**
 * Monthly Gross Profit Summary Schema (Phase 9 - Task T54)
 * Materialized, persistent calendar-month Gross Profit & Profitability cache.
 * Source of truth for core retail profitability: Gross Profit = Revenue - COGS, and GP Margin %.
 * Connects T52 (Revenue) and T53 (COGS) and bridges with T51 (OpEx) for Operating Profit.
 */
const monthlyGrossProfitSummarySchema = new mongoose.Schema(
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

    // 1. Core Financial Performance Metrics
    // Recognized Gross Revenue from completed invoices (T52)
    revenue: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // Raw inventory acquisition Cost of Goods Sold from historical snapshots (T53)
    cogs: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // Core Retail Gross Profit: Revenue - COGS
    grossProfit: {
      type: Number,
      required: true,
      default: 0,
    },

    // Gross Profit Margin Percentage: (Gross Profit / Revenue) * 100
    grossMarginPercentage: {
      type: Number,
      required: true,
      default: 0,
    },

    // 2. Operational Overhead Bridge (T51 OpEx Integration)
    opEx: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Operating Profit: Gross Profit - OpEx
    operatingProfit: {
      type: Number,
      default: 0,
    },

    // Operating Margin Percentage: (Operating Profit / Revenue) * 100
    operatingMarginPercentage: {
      type: Number,
      default: 0,
    },

    // 3. Vital Health Check Diagnostic Indicator
    // HEALTHY (>= 30%), MODERATE (15% - 29.9%), LOW (0% - 14.9%), CRITICAL_NEGATIVE (< 0%)
    marginHealth: {
      type: String,
      enum: ["HEALTHY", "MODERATE", "LOW", "CRITICAL_NEGATIVE"],
      default: "HEALTHY",
    },

    // Volume Statistics
    totalUnitsSold: {
      type: Number,
      default: 0,
      min: 0,
    },

    invoiceCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    averageGrossProfitPerOrder: {
      type: Number,
      default: 0,
    },

    // 4. Product Profitability Breakdown
    productBreakdown: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: { type: String, default: "" },
        sku: { type: String, default: "" },
        unitsSold: { type: Number, default: 0 },
        historicalCostPrice: { type: Number, default: 0 },
        sellingPrice: { type: Number, default: 0 },
        totalRevenue: { type: Number, default: 0 },
        totalCogs: { type: Number, default: 0 },
        grossProfit: { type: Number, default: 0 },
        grossMarginPercentage: { type: Number, default: 0 },
        profitContributionPercentage: { type: Number, default: 0 }, // (product GP / total GP) * 100
      },
    ],

    // 5. Daily Breakdown Timeline for this calendar month
    dailyBreakdown: [
      {
        date: { type: String, required: true }, // "YYYY-MM-DD"
        day: { type: Number, required: true }, // 1-31
        revenue: { type: Number, default: 0 },
        cogs: { type: Number, default: 0 },
        grossProfit: { type: Number, default: 0 },
        grossMarginPercentage: { type: Number, default: 0 },
        unitsSold: { type: Number, default: 0 },
        invoiceCount: { type: Number, default: 0 },
      },
    ],

    // 6. Month-over-Month (MoM) Analytics vs previous calendar month
    previousMonthGrossProfit: {
      type: Number,
      default: 0,
    },

    previousMonthMarginPercentage: {
      type: Number,
      default: 0,
    },

    momProfitVariance: {
      type: Number,
      default: 0, // grossProfit - previousMonthGrossProfit
    },

    momProfitGrowthRate: {
      type: Number,
      default: 0, // % change in gross profit vs previous month
    },

    marginChangeRate: {
      type: Number,
      default: 0, // grossMarginPercentage - previousMonthMarginPercentage
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
monthlyGrossProfitSummarySchema.index({ businessId: 1, year: 1, month: 1 }, { unique: true });
monthlyGrossProfitSummarySchema.index({ businessId: 1, monthKey: 1 }, { unique: true });
monthlyGrossProfitSummarySchema.index({ businessId: 1, year: 1, grossProfit: -1 });

const MonthlyGrossProfitSummary = mongoose.model(
  "MonthlyGrossProfitSummary",
  monthlyGrossProfitSummarySchema
);

module.exports = MonthlyGrossProfitSummary;
