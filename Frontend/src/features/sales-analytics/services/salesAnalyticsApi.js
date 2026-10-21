import api from "../../../services/api";

/**
 * Sales Analytics API Client (Phase 10 - Task T61)
 * Canonical endpoint: GET /api/analytics/sales-trends
 */

export const getSalesTrends = async (params = {}) => {
  const response = await api.get("/analytics/sales-trends", { params });
  return response.data;
};

export default {
  getSalesTrends,
};
