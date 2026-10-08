const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const { businessMiddleware } = require("../middlewares/business.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  createSaleSchema,
  updatePaymentStatusSchema,
} = require("../validations/sale.validation");
const {
  createSale,
  getSales,
  getSalesSummary,
  getSaleById,
  getSaleItems,
  getGrossProfitReport,
  getNextInvoiceNumber,
  updatePaymentStatus,
  generateInvoicePdf,
  downloadInvoicePdf,
  previewInvoicePdf,
  getMonthlyRevenueOverview,
  getCurrentMonthRevenue,
  getDailyRevenueBreakdown,
  getMonthlyRevenueDetail,
  recalculateMonthlyRevenue,
  getMonthlyCogsOverview,
  getCurrentMonthCogs,
  getDailyCogsBreakdown,
  getProductCogsRanking,
  getCustomPeriodCogs,
  getMonthlyCogsDetail,
  recalculateMonthlyCogs,
  getMonthlyGrossProfitOverview,
  getCurrentMonthGrossProfit,
  getDailyGrossProfitBreakdown,
  getProductProfitabilityMatrix,
  getCustomPeriodGrossProfit,
  getVitalHealthCheck,
  getMonthlyGrossProfitDetail,
  recalculateMonthlyGrossProfit,
  getPeriodOpExAnalytics,
  getMonthlyOpExFinancialOverview,
  getCurrentMonthOpExAnalytics,
  getQuarterlyOpExAggregations,
  getDailyCashBurnLedger,
  getPeriodNetProfit,
  getMonthlyNetProfitOverview,
  getCurrentMonthNetProfit,
  getQuarterlyNetProfit,
  getDailyNetProfitLedger,
  recalculateMonthlyNetProfit,
} = require("../controllers/sale.controller");

const router = express.Router();

// All sales routes require authentication + T6 Business Context (req.businessId)
router.use(authMiddleware);
router.use(businessMiddleware);

const idempotencyMiddleware = require("../middlewares/idempotency.middleware");

// ============================================
// REVENUE ANALYTICS ENGINE (PHASE 9 - TASK T52)
// ============================================
router.get("/analytics/revenue/monthly", getMonthlyRevenueOverview);
router.get("/analytics/revenue/current", getCurrentMonthRevenue);
router.get("/analytics/revenue/daily", getDailyRevenueBreakdown);
router.get("/analytics/revenue/:year/:month", getMonthlyRevenueDetail);
router.post("/analytics/revenue/recalculate", recalculateMonthlyRevenue);

// ============================================
// COST OF GOODS SOLD (COGS) ENGINE (PHASE 9 - TASK T53)
// ============================================
router.get("/analytics/cogs/monthly", getMonthlyCogsOverview);
router.get("/analytics/cogs/current", getCurrentMonthCogs);
router.get("/analytics/cogs/daily", getDailyCogsBreakdown);
router.get("/analytics/cogs/products", getProductCogsRanking);
router.get("/analytics/cogs/period", getCustomPeriodCogs);
router.get("/analytics/cogs/:year/:month", getMonthlyCogsDetail);
router.post("/analytics/cogs/recalculate", recalculateMonthlyCogs);

// ============================================
// GROSS PROFIT & MARGIN ENGINE (PHASE 9 - TASK T54)
// ============================================
router.get("/analytics/gross-profit/monthly", getMonthlyGrossProfitOverview);
router.get("/analytics/gross-profit/current", getCurrentMonthGrossProfit);
router.get("/analytics/gross-profit/daily", getDailyGrossProfitBreakdown);
router.get("/analytics/gross-profit/products", getProductProfitabilityMatrix);
router.get("/analytics/gross-profit/period", getCustomPeriodGrossProfit);
router.get("/analytics/gross-profit/health-check", getVitalHealthCheck);
router.get("/analytics/gross-profit/:year/:month", getMonthlyGrossProfitDetail);
router.post("/analytics/gross-profit/recalculate", recalculateMonthlyGrossProfit);

// ============================================
// OPERATING EXPENSE AGGREGATIONS (PHASE 9 - TASK T55)
// ============================================
router.get("/analytics/opex/period", getPeriodOpExAnalytics);
router.get("/analytics/opex/monthly", getMonthlyOpExFinancialOverview);
router.get("/analytics/opex/current", getCurrentMonthOpExAnalytics);
router.get("/analytics/opex/quarters", getQuarterlyOpExAggregations);
router.get("/analytics/opex/daily", getDailyCashBurnLedger);

// ============================================
// NET PROFIT AGGREGATION SERVICE (PHASE 9 - TASK T56)
// ============================================
router.get("/analytics/net-profit/period", getPeriodNetProfit);
router.get("/analytics/net-profit/monthly", getMonthlyNetProfitOverview);
router.get("/analytics/net-profit/current", getCurrentMonthNetProfit);
router.get("/analytics/net-profit/quarters", getQuarterlyNetProfit);
router.get("/analytics/net-profit/daily", getDailyNetProfitLedger);
router.post("/analytics/net-profit/recalculate", recalculateMonthlyNetProfit);

// ============================================
// SALE TRANSACTION & INVOICING ENDPOINTS (PHASE 4 - TASKS T23, T24 & T25)
// ============================================
router.post("/", idempotencyMiddleware("SALE_CREATE"), validate(createSaleSchema), createSale);
router.get("/", getSales);
router.get("/summary", getSalesSummary);
router.get("/next-invoice-number", getNextInvoiceNumber);
router.get("/analytics/gross-profit", getGrossProfitReport);
router.get("/:id", getSaleById);
router.get("/:id/items", getSaleItems);
router.put("/:id/payment-status", validate(updatePaymentStatusSchema), updatePaymentStatus);

// ============================================
// INVOICE PDF GENERATION ENGINE (PHASE 4 - TASK T27)
// ============================================
router.post("/:id/generate-pdf", generateInvoicePdf);
router.get("/:id/pdf", generateInvoicePdf);
router.get("/:id/download-pdf", downloadInvoicePdf);
router.get("/:id/preview-pdf", previewInvoicePdf);

const {
  recordPayment,
  getPaymentsByInvoice,
} = require("../controllers/payment.controller");

// ============================================
// PAYMENT RECORDING ENTITY (PHASE 4 - TASK T28)
// ============================================
router.get("/:id/payments", getPaymentsByInvoice);
router.post("/:id/payments", idempotencyMiddleware("PAYMENT_CREATE"), recordPayment);

module.exports = router;


