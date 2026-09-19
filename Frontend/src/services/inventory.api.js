import api from "./api";

export const getInventorySummary = async () => {
  const response = await api.get("/api/inventory/summary");
  return response.data;
};

export const getStoreState = async (params = {}) => {
  const response = await api.get("/api/inventory/store-state", { params });
  return response.data;
};

export const getInventoryLedger = async (params = {}) => {
  const response = await api.get("/api/inventory/ledger", { params });
  return response.data;
};

export const stockIn = async (payload) => {
  const response = await api.post("/api/inventory/stock-in", payload);
  return response.data;
};

export const stockOut = async (payload) => {
  const response = await api.post("/api/inventory/stock-out", payload);
  return response.data;
};

export const adjustStock = async (payload) => {
  const response = await api.post("/api/inventory/adjust", payload);
  return response.data;
};
