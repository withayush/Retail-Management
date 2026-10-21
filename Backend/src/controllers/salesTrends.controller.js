const salesTrendsService = require("../services/salesTrends.service");

/**
 * Sales Trends Controller Layer (Phase 10 - Task T61)
 * Canonical endpoint: GET /api/analytics/sales-trends
 */

const getSalesTrends = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: "Business ID context is required.",
      });
    }

    const { from, to, groupBy, periodPreset, date } = req.query;

    const data = await salesTrendsService.getSalesTrends(businessId, {
      from,
      to,
      groupBy,
      periodPreset,
      date,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    if (
      error.message &&
      (error.message.includes("date") ||
        error.message.includes("groupBy") ||
        error.message.includes("Invalid") ||
        error.message.includes("required"))
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

module.exports = {
  getSalesTrends,
};
