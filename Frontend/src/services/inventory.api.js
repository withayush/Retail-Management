import api from "./api";

export const getInventorySummary = async () => {
  const response = await api.get("/inventory/summary");
  return response.data;
};

export const getStoreState = async (params = {}) => {
  const response = await api.get("/inventory/store-state", { params });
  return response.data;
};

export const getInventoryLedger = async (params = {}) => {
  const response = await api.get("/inventory/ledger", { params });
  return response.data;
};

export const stockIn = async (payload) => {
  const response = await api.post("/inventory/stock-in", payload);
  return response.data;
};

export const stockOut = async (payload) => {
  const response = await api.post("/inventory/stock-out", payload);
  return response.data;
};

export const getProductInventory = async (productId) => {
  const response = await api.get(`/inventory/product/${productId}`);
  return response.data;
};

export const updateReorderLevel = async (productId, payload) => {
  const response = await api.put(`/inventory/product/${productId}/reorder-level`, payload);
  return response.data;
};

export const adjustStock = async (payload) => {
  const response = await api.post("/inventory/adjust", payload);
  return response.data;
};

export const initializeOpeningStock = async (payload) => {
  const response = await api.post("/inventory/opening-stock", payload);
  return response.data;
};

export const batchStockOut = async (payload) => {
  const response = await api.post("/inventory/stock-out/batch", payload);
  return response.data;
};

// ============================================
// DETERMINISTIC ALERTS QUEUE (PHASE 3 - TASK T22)
// ============================================
export const getInventoryAlerts = async (params = {}) => {
  const response = await api.get("/inventory/alerts", { params });
  return response.data;
};

export const getInventoryAlertsSummary = async () => {
  const response = await api.get("/inventory/alerts/summary");
  return response.data;
};

export const acknowledgeAlert = async (alertId) => {
  const response = await api.put(`/inventory/alerts/${alertId}/acknowledge`);
  return response.data;
};

export const resolveAlert = async (alertId) => {
  const response = await api.put(`/inventory/alerts/${alertId}/resolve`);
  return response.data;
};

export const syncInventoryAlerts = async () => {
  const response = await api.post("/inventory/alerts/sync");
  return response.data;
};
