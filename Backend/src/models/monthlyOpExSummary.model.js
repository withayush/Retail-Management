const mongoose = require("mongoose");

/**
 * Monthly OpEx Summary Schema (Phase 8 - T51)
 * Materialized, cached monthly aggregation of operational expenditures.
 * Provides $O(1)$ fast lookups for financial statements, P&L reports, and executive dashboards.
 */
const monthlyOpExSummarySchema = new mongoose.Schema(
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

    totalOpEx: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    totalTax: {
      type: Number,
      default: 0,
      min: 0,
    },

    expenseCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    averageExpense: {
      type: Number,
      default: 0,
      min: 0,
    },

    averageDailyOpEx: {
      type: Number,
      default: 0,
      min: 0,
    },

    categoryBreakdown: [
      {
        categoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ExpenseCategory",
        },
        categoryName: { type: String, required: true },
        categoryIcon: { type: String, default: "Tag" },
        categoryColor: { type: String, default: "#8E8E93" },
        totalAmount: { type: Number, default: 0 },
        count: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 }, // % of totalOpEx
        budgetLimit: { type: Number, default: 0 },
        isOverBudget: { type: Boolean, default: false },
        budgetVariance: { type: Number, default: 0 },
      },
    ],

    paymentMethodBreakdown: [
      {
        method: { type: String, required: true },
        totalAmount: { type: Number, default: 0 },
        count: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 },
      },
    ],

    previousMonthOpEx: {
      type: Number,
      default: 0,
    },

    momVariance: {
      type: Number,
      default: 0, // totalOpEx - previousMonthOpEx
    },

    momGrowthRate: {
      type: Number,
      default: 0, // % change vs previous month
    },

    status: {
      type: String,
      enum: ["ACTIVE", "FINALIZED", "PROJECTED"],
      default: "ACTIVE", // ACTIVE = current ongoing month, FINALIZED = past calendar month
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
monthlyOpExSummarySchema.index({ businessId: 1, year: 1, month: 1 }, { unique: true });
monthlyOpExSummarySchema.index({ businessId: 1, monthKey: 1 }, { unique: true });
monthlyOpExSummarySchema.index({ businessId: 1, year: 1, totalOpEx: -1 });

const MonthlyOpExSummary = mongoose.model("MonthlyOpExSummary", monthlyOpExSummarySchema);

module.exports = MonthlyOpExSummary;
