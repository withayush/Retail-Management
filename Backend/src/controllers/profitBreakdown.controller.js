const profitBreakdownService = require("../services/profitBreakdown.service");

/**
 * Profit Breakdown Controller Layer (Phase 10 - Task T62)
 * Canonical endpoint: GET /api/analytics/profit-breakdown
 */

const getProfitBreakdown = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: "Business ID context is required.",
      });
    }

    const { from, to, periodPreset } = req.query;

    const data = await profitBreakdownService.getProfitBreakdown(businessId, {
      from,
      to,
      periodPreset,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    if (
      error.message &&
      (error.message.includes("date") ||
        error.message.includes("preset") ||
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
  getProfitBreakdown,
};
