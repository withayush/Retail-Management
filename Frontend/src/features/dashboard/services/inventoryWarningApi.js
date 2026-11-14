import api from "../../../services/api";

/**
 * Phase 10 - Task T63: Inventory Warning Center API
 * Exposes canonical endpoint: GET /api/dashboard/inventory-warnings
 */
export const getInventoryWarnings = async (params = {}) => {
  const response = await api.get("/dashboard/inventory-warnings", { params });
  return response.data;
};

export default {
  getInventoryWarnings,
};

