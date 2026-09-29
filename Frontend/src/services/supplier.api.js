import api from "./api";

const getBusinessHeader = () => ({
  headers: { "x-business-id": localStorage.getItem("businessId") },
});

// Phase 6 - Task T38: Supplier API Service

/**
 * Fetch list of suppliers with optional search, status, phone, and pagination
 */
export const getSuppliers = async (search = "", filters = {}) => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (filters.status) params.append("status", filters.status);
  if (filters.phone) params.append("phone", filters.phone);
  if (filters.hasBalance) params.append("hasBalance", filters.hasBalance);
  if (filters.city) params.append("city", filters.city);
  if (filters.page) params.append("page", filters.page);
  if (filters.limit) params.append("limit", filters.limit);
  if (filters.sortBy) params.append("sortBy", filters.sortBy);
  if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
  const qs = params.toString();
  const res = await api.get(`/suppliers${qs ? `?${qs}` : ""}`, getBusinessHeader());
  return res.data;
};

/**
 * Fast Autocomplete search by company, contactName, phone
 */
export const searchSuppliers = async (query = "", limit = 10) => {
  const res = await api.get(`/suppliers/search?q=${encodeURIComponent(query)}&limit=${limit}`, getBusinessHeader());
  return res.data;
};

/**
 * Get supplier summary KPI totals
 */
export const getSupplierSummary = async () => {
  const res = await api.get("/suppliers/summary", getBusinessHeader());
  return res.data;
};

/**
 * Fetch single supplier by ID
 */
export const getSupplierById = async (supplierId) => {
  const res = await api.get(`/suppliers/${supplierId}`, getBusinessHeader());
  return res.data;
};

/**
 * Fetch single supplier by phone
 */
export const getSupplierByPhone = async (phone) => {
  const res = await api.get(`/suppliers/phone/${encodeURIComponent(phone)}`, getBusinessHeader());
  return res.data;
};

/**
 * Register a new supplier
 */
export const createSupplier = async (data) => {
  const res = await api.post("/suppliers", data, getBusinessHeader());
  return res.data;
};

/**
 * Update existing supplier details
 */
export const updateSupplier = async (supplierId, data) => {
  const res = await api.put(`/suppliers/${supplierId}`, data, getBusinessHeader());
  return res.data;
};

/**
 * Soft-delete / Deactivate supplier
 */
export const deleteSupplier = async (supplierId) => {
  const res = await api.delete(`/suppliers/${supplierId}`, getBusinessHeader());
  return res.data;
};

/**
 * Archive supplier explicitly
 */
export const archiveSupplier = async (supplierId) => {
  const res = await api.post(`/suppliers/${supplierId}/archive`, {}, getBusinessHeader());
  return res.data;
};

/**
 * Restore archived supplier to ACTIVE
 */
export const restoreSupplier = async (supplierId) => {
  const res = await api.post(`/suppliers/${supplierId}/restore`, {}, getBusinessHeader());
  return res.data;
};

// ── Phase 6 - Task T39: Supplier Ledger Transaction Log APIs ───────────────

/**
 * Get supplier ledger statement with running balances and summary stats
 */
export const getSupplierLedger = async (supplierId, pagination = {}) => {
  const params = new URLSearchParams();
  if (pagination.page) params.append("page", pagination.page);
  if (pagination.limit) params.append("limit", pagination.limit);
  const qs = params.toString();
  const res = await api.get(`/suppliers/${supplierId}/ledger${qs ? `?${qs}` : ""}`, getBusinessHeader());
  return res.data;
};

/**
 * Record a payment disbursement / settlement to supplier (reduces accounts payable)
 */
export const recordSupplierPayment = async (supplierId, paymentData, idempotencyKey = null) => {
  const config = getBusinessHeader();
  if (idempotencyKey) {
    config.headers = { ...config.headers, "Idempotency-Key": idempotencyKey };
  }
  const res = await api.post(`/suppliers/${supplierId}/settle`, paymentData, config);
  return res.data;
};

/**
 * Append manual adjustment or opening balance entry into supplier ledger
 */
export const appendSupplierLedgerEntry = async (supplierId, entryData, idempotencyKey = null) => {
  const config = getBusinessHeader();
  if (idempotencyKey) {
    config.headers = { ...config.headers, "Idempotency-Key": idempotencyKey };
  }
  const res = await api.post(`/suppliers/${supplierId}/ledger`, entryData, config);
  return res.data;
};

/**
 * Record inventory purchase credit (increases accounts payable)
 */
export const recordPurchaseCredit = async (supplierId, creditData, idempotencyKey = null) => {
  const config = getBusinessHeader();
  if (idempotencyKey) {
    config.headers = { ...config.headers, "Idempotency-Key": idempotencyKey };
  }
  const res = await api.post(`/suppliers/${supplierId}/purchases/credit`, creditData, config);
  return res.data;
};

/**
 * Get single supplier real-time payable outstanding
 */
export const getSupplierOutstanding = async (supplierId) => {
  const res = await api.get(`/suppliers/${supplierId}/outstanding`, getBusinessHeader());
  return res.data;
};

/**
 * Get business-wide ranking of payables due to suppliers
 */
export const getBusinessPayablesSummary = async (limit = 50) => {
  const res = await api.get(`/suppliers/payables/summary?limit=${limit}`, getBusinessHeader());
  return res.data;
};

/**
 * Get business-wide aggregate payable totals
 */
export const getBusinessPayablesTotals = async () => {
  const res = await api.get("/suppliers/payables/totals", getBusinessHeader());
  return res.data;
};

/**
 * Phase 6 - Task T41: Get complete Supplier 360° Management Center Summary
 */
export const getSupplier360Summary = async (supplierId) => {
  const res = await api.get(`/suppliers/${supplierId}/summary-360`, getBusinessHeader());
  return res.data;
};


export default {
  getSuppliers,
  searchSuppliers,
  getSupplierSummary,
  getSupplierById,
  getSupplierByPhone,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  archiveSupplier,
  restoreSupplier,
  getSupplierLedger,
  recordSupplierPayment,
  appendSupplierLedgerEntry,
  recordPurchaseCredit,
  getSupplierOutstanding,
  getBusinessPayablesSummary,
  getBusinessPayablesTotals,
  getSupplier360Summary,
};


