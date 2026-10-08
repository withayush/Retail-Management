const mongoose = require("mongoose");

/**
 * Monthly Revenue Summary Schema (Phase 9 - Task T52)
 * Materialized, persistent calendar-month revenue aggregation cache.
 * Source of truth for recognized sales revenue under accrual accounting.
 */
const monthlyRevenueSummarySchema = new mongoose.Schema(
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

    // Total Recognized Revenue (Accrual basis: sum of all non-cancelled invoice totals)
    totalRevenue: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // Financial breakdown components
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalTax: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Transaction volume metrics
    invoiceCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    averageOrderValue: {
      type: Number, // AOV = totalRevenue / invoiceCount
      default: 0,
      min: 0,
    },

    averageDailyRevenue: {
      type: Number, // totalRevenue / daysElapsed or daysInMonth
      default: 0,
      min: 0,
    },

    // Cash vs Accrual transparency
    cashCollected: {
      type: Number, // Sum of paidAmount
      default: 0,
      min: 0,
    },

    receivablesCreated: {
      type: Number, // Sum of dueAmount
      default: 0,
      min: 0,
    },

    // Payment Modes breakdown: CASH, UPI, CARD, CREDIT_UDHAR, SPLIT, OTHER
    paymentModeBreakdown: [
      {
        mode: { type: String, required: true },
        totalAmount: { type: Number, default: 0 },
        count: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 },
      },
    ],

    // Payment Status breakdown: PAID, PARTIAL, PENDING
    paymentStatusBreakdown: [
      {
        status: { type: String, required: true },
        totalAmount: { type: Number, default: 0 },
        count: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 },
      },
    ],

    // Daily breakdown for this calendar month (Day-by-Day sequence)
    dailyBreakdown: [
      {
        date: { type: String, required: true }, // "YYYY-MM-DD"
        day: { type: Number, required: true }, // 1-31
        revenue: { type: Number, default: 0 },
        invoiceCount: { type: Number, default: 0 },
        cashCollected: { type: Number, default: 0 },
        receivables: { type: Number, default: 0 },
      },
    ],

    // Month-over-Month (MoM) Analytics
    previousMonthRevenue: {
      type: Number,
      default: 0,
    },

    momVariance: {
      type: Number,
      default: 0, // totalRevenue - previousMonthRevenue
    },

    momGrowthRate: {
      type: Number,
      default: 0, // % change vs previous calendar month
    },

    // Status: ACTIVE (current ongoing month) vs FINALIZED (past closed month)
    status: {
      type: String,
      enum: ["ACTIVE", "FINALIZED", "PROJECTED"],
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
monthlyRevenueSummarySchema.index({ businessId: 1, year: 1, month: 1 }, { unique: true });
monthlyRevenueSummarySchema.index({ businessId: 1, monthKey: 1 }, { unique: true });
monthlyRevenueSummarySchema.index({ businessId: 1, year: 1, totalRevenue: -1 });

const MonthlyRevenueSummary = mongoose.model("MonthlyRevenueSummary", monthlyRevenueSummarySchema);

module.exports = MonthlyRevenueSummary;
