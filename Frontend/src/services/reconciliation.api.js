import api from "./api";

/**
 * Helper to ensure x-business-id is passed if present in localStorage
 */
const getBusinessHeader = () => {
  const businessId = localStorage.getItem("businessId");
  return businessId ? { headers: { "x-business-id": businessId } } : {};
};

/**
 * Reconciliation & System Integrity API Client
 */

export const getFullReconciliation = async (autoFix = false) => {
  const res = await api.get(`/reconciliation/full?autoFix=${autoFix}`, getBusinessHeader());
  return res.data;
};

export const getInventoryReconciliation = async (autoFix = false) => {
  const res = await api.get(`/reconciliation/inventory?autoFix=${autoFix}`, getBusinessHeader());
  return res.data;
};

export const fixInventoryDiscrepancies = async () => {
  const res = await api.post("/reconciliation/inventory/fix", {}, getBusinessHeader());
  return res.data;
};

export const getCustomerReconciliation = async (autoFix = false) => {
  const res = await api.get(`/reconciliation/customers?autoFix=${autoFix}`, getBusinessHeader());
  return res.data;
};

export const fixCustomerDiscrepancies = async () => {
  const res = await api.post("/reconciliation/customers/fix", {}, getBusinessHeader());
  return res.data;
};

export const getSupplierReconciliation = async (autoFix = false) => {
  const res = await api.get(`/reconciliation/suppliers?autoFix=${autoFix}`, getBusinessHeader());
  return res.data;
};

export const fixSupplierDiscrepancies = async () => {
  const res = await api.post("/reconciliation/suppliers/fix", {}, getBusinessHeader());
  return res.data;
};

export const runAllReconciliation = async (autoFix = false) => {
  const res = await api.post("/reconciliation/run-all", { autoFix }, getBusinessHeader());
  return res.data;
};

export default {
  getFullReconciliation,
  getInventoryReconciliation,
  fixInventoryDiscrepancies,
  getCustomerReconciliation,
  fixCustomerDiscrepancies,
  getSupplierReconciliation,
  fixSupplierDiscrepancies,
  runAllReconciliation,
};
