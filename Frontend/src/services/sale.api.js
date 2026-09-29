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



