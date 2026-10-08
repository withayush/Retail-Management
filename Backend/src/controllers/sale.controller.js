const saleService = require("../services/sale.service");

/**
 * Phase 4 - Task T23: Sale / Invoice Controller Layer
 */

const createSale = async (req, res, next) => {
  try {
    const sale = await saleService.createSale(req.businessId, {
      ...req.body,
      createdBy: req.user?.accountId,
      createdByName: req.account?.fullName || "Staff",
    });

    return res.status(201).json({
      success: true,
      message: `Sale transaction ${sale.invoiceNumber} created successfully.`,
      data: sale,
    });
  } catch (error) {
    next(error);
  }
};

const getSales = async (req, res, next) => {
  try {
    const { paymentStatus, paymentMode, customerId, startDate, endDate, search, page, limit } =
      req.query;

    const result = await saleService.getSales(
      req.businessId,
      { paymentStatus, paymentMode, customerId, startDate, endDate, search },
      { page, limit }
    );

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getSalesSummary = async (req, res, next) => {
  try {
    const summary = await saleService.getSalesSummary(req.businessId);

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

const getSaleById = async (req, res, next) => {
  try {
    const sale = await saleService.getSaleById(req.businessId, req.params.id);

    return res.status(200).json({
      success: true,
      data: sale,
    });
  } catch (error) {
    next(error);
  }
};

const getNextInvoiceNumber = async (req, res, next) => {
  try {
    const nextInvoiceNumber = await saleService.getNextInvoiceNumber(req.businessId);

    return res.status(200).json({
      success: true,
      data: { nextInvoiceNumber },
    });
  } catch (error) {
    next(error);
  }
};

const getSaleItems = async (req, res, next) => {
  try {
    const items = await saleService.getSaleItems(req.businessId, req.params.id);

    return res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

const getGrossProfitReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const report = await saleService.getGrossProfitReport(req.businessId, { startDate, endDate });

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

const updatePaymentStatus = async (req, res, next) => {
  try {
    const updated = await saleService.updatePaymentStatus(
      req.businessId,
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Payment status updated successfully.",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const invoicePdfService = require("../services/invoicePdf.service");

const generateInvoicePdf = async (req, res, next) => {
  try {
    const result = await invoicePdfService.generateAndStoreInvoicePdf(req.businessId, req.params.id);

    return res.status(200).json({
      success: true,
      message: `Invoice PDF for #${result.invoiceNumber} generated successfully.`,
      data: {
        invoiceId: result.invoiceId,
        invoiceNumber: result.invoiceNumber,
        publicUrl: result.publicUrl,
        fileName: result.fileName,
        pdfGeneratedAt: result.pdfGeneratedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

const downloadInvoicePdf = async (req, res, next) => {
  try {
    const { invoiceNumber, pdfBuffer } = await invoicePdfService.getInvoicePdfStreamData(
      req.businessId,
      req.params.id
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Invoice-${invoiceNumber}.pdf"`);
    res.setHeader("Content-Length", pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

const previewInvoicePdf = async (req, res, next) => {
  try {
    const { invoiceNumber, pdfBuffer } = await invoicePdfService.getInvoicePdfStreamData(
      req.businessId,
      req.params.id
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="Invoice-${invoiceNumber}.pdf"`);
    res.setHeader("Content-Length", pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

const revenueAnalyticsService = require("../services/revenueAnalytics.service");

// ============================================
// PHASE 9 - TASK T52: REVENUE ANALYTICS CONTROLLER
// ============================================

const getMonthlyRevenueOverview = async (req, res, next) => {
  try {
    const year = req.query.year || new Date().getUTCFullYear();
    const forceRefresh = req.query.forceRefresh === "true" || req.query.forceRefresh === true;

    const data = await revenueAnalyticsService.getYearlyRevenueOverview(req.businessId, year, {
      forceRefresh,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentMonthRevenue = async (req, res, next) => {
  try {
    const forceRefresh = req.query.forceRefresh === "true" || req.query.forceRefresh === true;

    const data = await revenueAnalyticsService.getCurrentMonthRevenue(req.businessId, forceRefresh);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getDailyRevenueBreakdown = async (req, res, next) => {
  try {
    const { year, month, startDate, endDate } = req.query;

    const data = await revenueAnalyticsService.getDailyRevenueBreakdown(req.businessId, {
      year,
      month,
      startDate,
      endDate,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getMonthlyRevenueDetail = async (req, res, next) => {
  try {
    const { year, month } = req.params;
    const forceRefresh = req.query.forceRefresh === "true" || req.query.forceRefresh === true;

    const data = await revenueAnalyticsService.getMonthlyRevenueSummary(req.businessId, {
      year: Number(year),
      month: Number(month),
      forceRefresh,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const recalculateMonthlyRevenue = async (req, res, next) => {
  try {
    const { year, month } = req.body || {};
    let result;

    if (year && month) {
      result = await revenueAnalyticsService.recalculateMonth(req.businessId, Number(year), Number(month));
    } else {
      const targetYear = year || new Date().getUTCFullYear();
      result = await revenueAnalyticsService.recalculateYear(req.businessId, Number(targetYear));
    }

    return res.status(200).json({
      success: true,
      message: "Monthly revenue summary recalculated and cached successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const cogsAnalyticsService = require("../services/cogsAnalytics.service");

// ============================================
// PHASE 9 - TASK T53: COST OF GOODS SOLD (COGS) CONTROLLER
// ============================================

const getMonthlyCogsOverview = async (req, res, next) => {
  try {
    const year = req.query.year || new Date().getUTCFullYear();
    const forceRefresh = req.query.forceRefresh === "true" || req.query.forceRefresh === true;

    const data = await cogsAnalyticsService.getMonthlyCogsOverview(req.businessId, {
      year: Number(year),
      forceRefresh,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentMonthCogs = async (req, res, next) => {
  try {
    const forceRefresh = req.query.forceRefresh === "true" || req.query.forceRefresh === true;

    const data = await cogsAnalyticsService.getCurrentMonthCogs(req.businessId, {
      forceRefresh,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getDailyCogsBreakdown = async (req, res, next) => {
  try {
    const { year, month } = req.query;

    const data = await cogsAnalyticsService.getDailyCogsBreakdown(
      req.businessId,
      year,
      month
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getProductCogsRanking = async (req, res, next) => {
  try {
    const { year, month, limit, sortBy } = req.query;

    const data = await cogsAnalyticsService.getProductCogsRanking(req.businessId, {
      year,
      month,
      limit,
      sortBy,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getCustomPeriodCogs = async (req, res, next) => {
  try {
    const { startDate, endDate, productId } = req.query;

    const data = await cogsAnalyticsService.calculatePeriodCogs(req.businessId, {
      startDate,
      endDate,
      productId,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getMonthlyCogsDetail = async (req, res, next) => {
  try {
    const { year, month } = req.params;
    const forceRefresh = req.query.forceRefresh === "true" || req.query.forceRefresh === true;

    const data = await cogsAnalyticsService.aggregateAndCacheMonth(
      req.businessId,
      Number(year),
      Number(month),
      forceRefresh ? "MANUAL_RECALCULATE" : "AUTO_ENGINE"
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const recalculateMonthlyCogs = async (req, res, next) => {
  try {
    const { year, month } = req.body || {};
    const result = await cogsAnalyticsService.recalculateMonthlyCogs(req.businessId, {
      year,
      month,
    });

    return res.status(200).json({
      success: true,
      message: "Cost of Goods Sold (COGS) summaries recalculated and cached successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const grossProfitAnalyticsService = require("../services/grossProfitAnalytics.service");

// ============================================
// PHASE 9 - TASK T54: GROSS PROFIT CALCULATIONS CONTROLLER
// ============================================

const getMonthlyGrossProfitOverview = async (req, res, next) => {
  try {
    const year = req.query.year || new Date().getUTCFullYear();
    const forceRefresh = req.query.forceRefresh === "true" || req.query.forceRefresh === true;

    const data = await grossProfitAnalyticsService.getMonthlyGrossProfitOverview(req.businessId, {
      year: Number(year),
      forceRefresh,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentMonthGrossProfit = async (req, res, next) => {
  try {
    const forceRefresh = req.query.forceRefresh === "true" || req.query.forceRefresh === true;

    const data = await grossProfitAnalyticsService.getCurrentMonthGrossProfit(req.businessId, {
      forceRefresh,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getDailyGrossProfitBreakdown = async (req, res, next) => {
  try {
    const { year, month } = req.query;

    const data = await grossProfitAnalyticsService.getDailyGrossProfitBreakdown(
      req.businessId,
      year,
      month
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getProductProfitabilityMatrix = async (req, res, next) => {
  try {
    const { year, month, limit, sortBy } = req.query;

    const data = await grossProfitAnalyticsService.getProductProfitabilityMatrix(req.businessId, {
      year,
      month,
      limit,
      sortBy,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getCustomPeriodGrossProfit = async (req, res, next) => {
  try {
    const { startDate, endDate, productId } = req.query;

    const data = await grossProfitAnalyticsService.calculatePeriodGrossProfit(req.businessId, {
      startDate,
      endDate,
      productId,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getVitalHealthCheck = async (req, res, next) => {
  try {
    const { year, month } = req.query;

    const data = await grossProfitAnalyticsService.getVitalHealthCheck(req.businessId, {
      year,
      month,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getMonthlyGrossProfitDetail = async (req, res, next) => {
  try {
    const { year, month } = req.params;
    const forceRefresh = req.query.forceRefresh === "true" || req.query.forceRefresh === true;

    const data = await grossProfitAnalyticsService.aggregateAndCacheMonth(
      req.businessId,
      Number(year),
      Number(month),
      forceRefresh ? "MANUAL_RECALCULATE" : "AUTO_ENGINE"
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const recalculateMonthlyGrossProfit = async (req, res, next) => {
  try {
    const { year, month } = req.body || {};
    const result = await grossProfitAnalyticsService.recalculateMonthlyGrossProfit(req.businessId, {
      year,
      month,
    });

    return res.status(200).json({
      success: true,
      message: "Gross Profit summaries recalculated and cached successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const opExAnalyticsService = require("../services/opExAnalytics.service");

// ============================================
// PHASE 9 - TASK T55: OPERATING EXPENSE AGGREGATIONS CONTROLLER
// ============================================

const getPeriodOpExAnalytics = async (req, res, next) => {
  try {
    const { from, to, startDate, endDate, month, year, quarter, periodType } = req.query;

    const data = await opExAnalyticsService.calculatePeriodOpEx(req.businessId, {
      from,
      to,
      startDate,
      endDate,
      month,
      year,
      quarter,
      periodType,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getMonthlyOpExFinancialOverview = async (req, res, next) => {
  try {
    const year = req.query.year || new Date().getUTCFullYear();

    const data = await opExAnalyticsService.getMonthlyOpExFinancialOverview(
      req.businessId,
      Number(year)
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentMonthOpExAnalytics = async (req, res, next) => {
  try {
    const data = await opExAnalyticsService.getCurrentMonthOpExAnalytics(req.businessId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getQuarterlyOpExAggregations = async (req, res, next) => {
  try {
    const year = req.query.year || new Date().getUTCFullYear();

    const data = await opExAnalyticsService.getQuarterlyOpExAggregations(
      req.businessId,
      Number(year)
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getDailyCashBurnLedger = async (req, res, next) => {
  try {
    const { year, month } = req.query;

    const data = await opExAnalyticsService.getDailyCashBurnLedger(
      req.businessId,
      year,
      month
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const netProfitAnalyticsService = require("../services/netProfitAnalytics.service");

// ============================================
// PHASE 9 - TASK T56: NET PROFIT AGGREGATION SERVICE CONTROLLER
// ============================================

const getPeriodNetProfit = async (req, res, next) => {
  try {
    const { from, to, startDate, endDate, month, year, quarter, periodType } = req.query;

    const data = await netProfitAnalyticsService.calculatePeriodNetProfit(req.businessId, {
      from,
      to,
      startDate,
      endDate,
      month,
      year,
      quarter,
      periodType,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getMonthlyNetProfitOverview = async (req, res, next) => {
  try {
    const year = req.query.year || new Date().getUTCFullYear();
    const forceRefresh = req.query.forceRefresh === "true" || req.query.forceRefresh === true;

    const data = await netProfitAnalyticsService.getMonthlyNetProfitOverview(req.businessId, {
      year: Number(year),
      forceRefresh,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentMonthNetProfit = async (req, res, next) => {
  try {
    const forceRefresh = req.query.forceRefresh === "true" || req.query.forceRefresh === true;

    const data = await netProfitAnalyticsService.getCurrentMonthNetProfit(req.businessId, {
      forceRefresh,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getQuarterlyNetProfit = async (req, res, next) => {
  try {
    const year = req.query.year || new Date().getUTCFullYear();

    const data = await netProfitAnalyticsService.getQuarterlyNetProfit(
      req.businessId,
      Number(year)
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getDailyNetProfitLedger = async (req, res, next) => {
  try {
    const { year, month } = req.query;

    const data = await netProfitAnalyticsService.getDailyNetProfitLedger(
      req.businessId,
      year,
      month
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const recalculateMonthlyNetProfit = async (req, res, next) => {
  try {
    const { year, month } = req.body || {};

    const data = await netProfitAnalyticsService.recalculateMonthlyNetProfit(req.businessId, {
      year,
      month,
    });

    return res.status(200).json({
      success: true,
      message: "Net Profit summaries recalculated and cached successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};




