const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const { businessMiddleware } = require("../middlewares/business.middleware");
const {
  getPeriodOpExAnalytics,
  getMonthlyOpExFinancialOverview,
  getCurrentMonthOpExAnalytics,
  getQuarterlyOpExAggregations,
  getDailyCashBurnLedger,
  getMonthlyGrossProfitOverview,
  getCurrentMonthGrossProfit,
  getDailyGrossProfitBreakdown,
  getProductProfitabilityMatrix,
  getCustomPeriodGrossProfit,
  getVitalHealthCheck,
  getMonthlyRevenueOverview,
  getCurrentMonthRevenue,
  getMonthlyCogsOverview,
  getCurrentMonthCogs,
  getPeriodNetProfit,
  getMonthlyNetProfitOverview,
  getCurrentMonthNetProfit,
  getQuarterlyNetProfit,
  getDailyNetProfitLedger,
  recalculateMonthlyNetProfit,
} = require("../controllers/sale.controller");

const router = express.Router();

router.use(authMiddleware);
router.use(businessMiddleware);

// ============================================
// NET PROFIT AGGREGATION SERVICE (PHASE 9 - TASK T56)
// ============================================
// Ideal endpoint matching PRD: GET /api/analytics/net-profit?from=&to=
router.get("/net-profit", getPeriodNetProfit);
router.get("/net-profit/period", getPeriodNetProfit);
router.get("/net-profit/monthly", getMonthlyNetProfitOverview);
router.get("/net-profit/current", getCurrentMonthNetProfit);
router.get("/net-profit/quarters", getQuarterlyNetProfit);
router.get("/net-profit/daily", getDailyNetProfitLedger);
router.post("/net-profit/recalculate", recalculateMonthlyNetProfit);

// ============================================
// OPERATING EXPENSE AGGREGATIONS (PHASE 9 - TASK T55)
// ============================================

// Ideal endpoint matching PRD: GET /api/analytics/operating-expenses?from=&to=
router.get("/operating-expenses", getPeriodOpExAnalytics);
router.get("/opex/period", getPeriodOpExAnalytics);
router.get("/opex/monthly", getMonthlyOpExFinancialOverview);
router.get("/opex/current", getCurrentMonthOpExAnalytics);
router.get("/opex/quarters", getQuarterlyOpExAggregations);
router.get("/opex/daily", getDailyCashBurnLedger);

// Unified Aliases for Financial Analytics
router.get("/gross-profit/monthly", getMonthlyGrossProfitOverview);
router.get("/gross-profit/current", getCurrentMonthGrossProfit);
router.get("/gross-profit/products", getProductProfitabilityMatrix);
router.get("/gross-profit/health-check", getVitalHealthCheck);
router.get("/revenue/monthly", getMonthlyRevenueOverview);
router.get("/revenue/current", getCurrentMonthRevenue);
router.get("/cogs/monthly", getMonthlyCogsOverview);
router.get("/cogs/current", getCurrentMonthCogs);

module.exports = router;
