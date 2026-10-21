import api from "./api";

/**
 * Phase 9 - Task T56: Net Profit Aggregation Service - Analytics API Client
 * Canonical endpoints: GET /api/analytics/net-profit
 */

// --- Net Profit Aggregation (T56) --------------------------------------------

export const getPeriodNetProfit = async (params = {}) => {
  const response = await api.get("/analytics/net-profit", { params });
  return response.data;
};

export const getPeriodNetProfitByDateRange = async (from, to) => {
  const response = await api.get("/analytics/net-profit/period", { params: { from, to } });
  return response.data;
};

export const getMonthlyNetProfitOverview = async (params = {}) => {
  const response = await api.get("/analytics/net-profit/monthly", { params });
  return response.data;
};

export const getCurrentMonthNetProfit = async (params = {}) => {
  const response = await api.get("/analytics/net-profit/current", { params });
  return response.data;
};

export const getQuarterlyNetProfit = async (params = {}) => {
  const response = await api.get("/analytics/net-profit/quarters", { params });
  return response.data;
};

export const getDailyNetProfitLedger = async (params = {}) => {
  const response = await api.get("/analytics/net-profit/daily", { params });
  return response.data;
};

export const recalculateMonthlyNetProfit = async (payload = {}) => {
  const response = await api.post("/analytics/net-profit/recalculate", payload);
  return response.data;
};

// --- Operating Expense Aggregations (T55) ------------------------------------

export const getPeriodOpExAnalytics = async (params = {}) => {
  const response = await api.get("/analytics/operating-expenses", { params });
  return response.data;
};

export const getMonthlyOpExOverview = async (params = {}) => {
  const response = await api.get("/analytics/opex/monthly", { params });
  return response.data;
};

export const getCurrentMonthOpEx = async (params = {}) => {
  const response = await api.get("/analytics/opex/current", { params });
  return response.data;
};

export const getQuarterlyOpEx = async (params = {}) => {
  const response = await api.get("/analytics/opex/quarters", { params });
  return response.data;
};

// --- Gross Profit (T54) ------------------------------------------------------

export const getMonthlyGrossProfitOverview = async (params = {}) => {
  const response = await api.get("/analytics/gross-profit/monthly", { params });
  return response.data;
};

export const getCurrentMonthGrossProfit = async (params = {}) => {
  const response = await api.get("/analytics/gross-profit/current", { params });
  return response.data;
};

export const getVitalHealthCheck = async (params = {}) => {
  const response = await api.get("/analytics/gross-profit/health-check", { params });
  return response.data;
};

// --- Receivables Consolidated Index (T57) ------------------------------------

export const getReceivablesIndex = async (params = {}) => {
  const response = await api.get("/analytics/receivables", { params });
  return response.data;
};

export const getReceivablesSummary = async () => {
  const response = await api.get("/analytics/receivables/summary");
  return response.data;
};

// --- Payables Consolidated Index (T58) ---------------------------------------

export const getPayablesIndex = async (params = {}) => {
  const response = await api.get("/analytics/payables", { params });
  return response.data;
};

export const getPayablesSummary = async () => {
  const response = await api.get("/analytics/payables/summary");
  return response.data;
};

