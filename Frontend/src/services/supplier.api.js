import api from "./api";

const getBusinessHeader = () => ({
  headers: { "x-business-id": localStorage.getItem("businessId") },
});

// Phase 6 - Task T37: Supplier API Service

/**
 * Fetch list of suppliers with optional search, status, and pagination
 */
export const getSuppliers = async (search = "", filters = {}) => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (filters.status) params.append("status", filters.status);
  if (filters.page) params.append("page", filters.page);
  if (filters.limit) params.append("limit", filters.limit);
  if (filters.sortBy) params.append("sortBy", filters.sortBy);
  if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
  const qs = params.toString();
  const res = await api.get(`/suppliers${qs ? `?${qs}` : ""}`, getBusinessHeader());
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

export default {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};
