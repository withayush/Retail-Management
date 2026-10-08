import api from "./api";

/**
 * Phase 4 - Task T23: Sales & Billing API Client
 */

export const getSales = async (params = {}) => {
  const response = await api.get("/sales", { params });
  return response.data;
};

export const getSalesSummary = async () => {
  const response = await api.get("/sales/summary");
  return response.data;
};

export const getSaleById = async (saleId) => {
  const response = await api.get(`/sales/${saleId}`);
  return response.data;
};

export const getNextInvoiceNumber = async () => {
  const response = await api.get("/sales/next-invoice-number");
  return response.data;
};

export const createSale = async (payload, idempotencyKey = null) => {
  const headers = idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {};
  const response = await api.post("/sales", payload, { headers });
  return response.data;
};

export const getSaleItems = async (saleId) => {
  const response = await api.get(`/sales/${saleId}/items`);
  return response.data;
};

export const getGrossProfitReport = async (params = {}) => {
  const response = await api.get("/sales/analytics/gross-profit", { params });
  return response.data;
};

export const updatePaymentStatus = async (saleId, payload, idempotencyKey = null) => {
  const headers = idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {};
  const response = await api.put(`/sales/${saleId}/payment-status`, payload, { headers });
  return response.data;
};

/**
 * Phase 4 - Task T27: Invoice PDF Generation & Download Client
 */
export const generateInvoicePdf = async (saleId) => {
  const response = await api.post(`/sales/${saleId}/generate-pdf`);
  return response.data;
};

export const downloadInvoicePdf = async (saleId, invoiceNumber = "INV-001") => {
  const response = await api.get(`/sales/${saleId}/download-pdf`, {
    responseType: "blob",
  });

  const blob = new Blob([response.data], { type: "application/pdf" });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = `Invoice-${invoiceNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
  return true;
};

export const previewInvoicePdf = async (saleId) => {
  const response = await api.get(`/sales/${saleId}/preview-pdf`, {
    responseType: "blob",
  });

  const blob = new Blob([response.data], { type: "application/pdf" });
  const fileUrl = window.URL.createObjectURL(blob);
  window.open(fileUrl, "_blank");
  return fileUrl;
};

/**
 * Phase 4 - Task T28: Payment Recording Entity Client
 */
export const getPaymentsByInvoice = async (saleId) => {
  const response = await api.get(`/sales/${saleId}/payments`);
  return response.data;
};

export const recordPayment = async (payload, idempotencyKey = null) => {
  const headers = idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {};
  const response = await api.post("/payments", payload, { headers });
  return response.data;
};

/**
 * Phase 9 - Task T52: Monthly Revenue Aggregations API Client
 */
export const getMonthlyRevenueOverview = async (params = {}) => {
  const response = await api.get("/sales/analytics/revenue/monthly", { params });
  return response.data;
};

export const getCurrentMonthRevenue = async (params = {}) => {
  const response = await api.get("/sales/analytics/revenue/current", { params });
  return response.data;
};

export const getDailyRevenueBreakdown = async (params = {}) => {
  const response = await api.get("/sales/analytics/revenue/daily", { params });
  return response.data;
};

export const getMonthlyRevenueDetail = async (year, month, params = {}) => {
  const response = await api.get(`/sales/analytics/revenue/${year}/${month}`, { params });
  return response.data;
};

export const recalculateMonthlyRevenue = async (payload = {}) => {
  const response = await api.post("/sales/analytics/revenue/recalculate", payload);
  return response.data;
};

/**
 * Phase 9 - Task T53: Cost of Goods Sold (COGS) Calculator API Client
 */
export const getMonthlyCogsOverview = async (params = {}) => {
  const response = await api.get("/sales/analytics/cogs/monthly", { params });
  return response.data;
};

export const getCurrentMonthCogs = async (params = {}) => {
  const response = await api.get("/sales/analytics/cogs/current", { params });
  return response.data;
};

export const getDailyCogsBreakdown = async (params = {}) => {
  const response = await api.get("/sales/analytics/cogs/daily", { params });
  return response.data;
};

export const getProductCogsRanking = async (params = {}) => {
  const response = await api.get("/sales/analytics/cogs/products", { params });
  return response.data;
};

export const getCustomPeriodCogs = async (params = {}) => {
  const response = await api.get("/sales/analytics/cogs/period", { params });
  return response.data;
};

export const getMonthlyCogsDetail = async (year, month, params = {}) => {
  const response = await api.get(`/sales/analytics/cogs/${year}/${month}`, { params });
  return response.data;
};

export const recalculateMonthlyCogs = async (payload = {}) => {
  const response = await api.post("/sales/analytics/cogs/recalculate", payload);
  return response.data;
};

/**
 * Phase 9 - Task T54: Gross Profit Calculations API Client
 */
export const getMonthlyGrossProfitOverview = async (params = {}) => {
  const response = await api.get("/sales/analytics/gross-profit/monthly", { params });
  return response.data;
};

export const getCurrentMonthGrossProfit = async (params = {}) => {
  const response = await api.get("/sales/analytics/gross-profit/current", { params });
  return response.data;
};

export const getDailyGrossProfitBreakdown = async (params = {}) => {
  const response = await api.get("/sales/analytics/gross-profit/daily", { params });
  return response.data;
};

export const getProductProfitabilityMatrix = async (params = {}) => {
  const response = await api.get("/sales/analytics/gross-profit/products", { params });
  return response.data;
};

export const getCustomPeriodGrossProfit = async (params = {}) => {
  const response = await api.get("/sales/analytics/gross-profit/period", { params });
  return response.data;
};

export const getVitalHealthCheck = async (params = {}) => {
  const response = await api.get("/sales/analytics/gross-profit/health-check", { params });
  return response.data;
};

export const getMonthlyGrossProfitDetail = async (year, month, params = {}) => {
  const response = await api.get(`/sales/analytics/gross-profit/${year}/${month}`, { params });
  return response.data;
};

export const recalculateMonthlyGrossProfit = async (payload = {}) => {
  const response = await api.post("/sales/analytics/gross-profit/recalculate", payload);
  return response.data;
};

/**
 * Phase 9 - Task T55: Operating Expense Aggregations API Client
 */
export const getPeriodOpExAnalytics = async (params = {}) => {
  const response = await api.get("/sales/analytics/opex/period", { params });
  return response.data;
};

export const getMonthlyOpExFinancialOverview = async (params = {}) => {
  const response = await api.get("/sales/analytics/opex/monthly", { params });
  return response.data;
};

export const getCurrentMonthOpExAnalytics = async (params = {}) => {
  const response = await api.get("/sales/analytics/opex/current", { params });
  return response.data;
};

export const getQuarterlyOpExAggregations = async (params = {}) => {
  const response = await api.get("/sales/analytics/opex/quarters", { params });
  return response.data;
};

export const getDailyCashBurnLedger = async (params = {}) => {
  const response = await api.get("/sales/analytics/opex/daily", { params });
  return response.data;
};

/**
 * Phase 9 - Task T56: Net Profit Aggregation Service API Client
 */
export const getPeriodNetProfit = async (params = {}) => {
  const response = await api.get("/sales/analytics/net-profit/period", { params });
  return response.data;
};

export const getMonthlyNetProfitOverview = async (params = {}) => {
  const response = await api.get("/sales/analytics/net-profit/monthly", { params });
  return response.data;
};

export const getCurrentMonthNetProfit = async (params = {}) => {
  const response = await api.get("/sales/analytics/net-profit/current", { params });
  return response.data;
};

export const getQuarterlyNetProfit = async (params = {}) => {
  const response = await api.get("/sales/analytics/net-profit/quarters", { params });
  return response.data;
};

export const getDailyNetProfitLedger = async (params = {}) => {
  const response = await api.get("/sales/analytics/net-profit/daily", { params });
  return response.data;
};

export const recalculateMonthlyNetProfit = async (payload = {}) => {
  const response = await api.post("/sales/analytics/net-profit/recalculate", payload);
  return response.data;
};


