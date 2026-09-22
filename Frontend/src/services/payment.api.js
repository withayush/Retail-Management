import api from "./api";

/**
 * Phase 4 - Task T28: Payment Recording API Client
 */

export const recordPayment = async (payload) => {
  const response = await api.post("/payments", payload);
  return response.data;
};

export const getPayments = async (params = {}) => {
  const response = await api.get("/payments", { params });
  return response.data;
};

export const getPaymentsByInvoice = async (invoiceId) => {
  const response = await api.get(`/payments/invoice/${invoiceId}`);
  return response.data;
};

export const getPaymentSummary = async (params = {}) => {
  const response = await api.get("/payments/summary", { params });
  return response.data;
};
