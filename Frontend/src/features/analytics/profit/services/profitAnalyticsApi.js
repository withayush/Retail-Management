import api from "../../../../services/api";

/**
 * Profit Breakdown & Visualizers API Client (Phase 10 - Task T62)
 * Canonical endpoint: GET /api/analytics/profit-breakdown
 */

export const getProfitBreakdown = async (params = {}) => {
  const response = await api.get("/analytics/profit-breakdown", { params });
  return response.data;
};

export default {
  getProfitBreakdown,
};
