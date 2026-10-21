const dashboardService = require("../services/dashboard.service");

/**
 * Dashboard Controller Layer (Phase 10 - Task T60)
 * Exposes canonical endpoint: GET /api/dashboard/business-summary
 */

const getBusinessSummary = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: "Business ID context is required.",
      });
    }

    const { from, to, periodPreset } = req.query;

    const data = await dashboardService.getBusinessSummary(businessId, {
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
  getBusinessSummary,
};
