import api from "../../../services/api";

/**
 * Dashboard API Client (Phase 10 - Task T60)
 * Canonical endpoint: GET /api/dashboard/business-summary
 */

export const getBusinessSummary = async (params = {}) => {
  const response = await api.get("/dashboard/business-summary", { params });
  return response.data;
};

/**
 * Phase 10 - Task T63: Inventory Warning Center Endpoint
 * Canonical endpoint: GET /api/dashboard/inventory-warnings
 */
export const getInventoryWarnings = async (params = {}) => {
  const response = await api.get("/dashboard/inventory-warnings", { params });
  return response.data;
};

export default {
  getBusinessSummary,
  getInventoryWarnings,
};
