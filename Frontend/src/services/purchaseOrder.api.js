import api from "./api";

/**
 * Helper to ensure x-business-id is passed if present in localStorage
 */
const getBusinessHeader = () => {
  const businessId = localStorage.getItem("businessId");
  return businessId ? { headers: { "x-business-id": businessId } } : {};
};

/**
 * Phase 7 - Task T42: Purchase Order API Client
 */

/**
 * Get paginated list of Purchase Orders with optional search & filters
 */
export const getPurchaseOrders = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.supplierId) query.append("supplierId", params.supplierId);
  if (params.status && params.status !== "ALL") query.append("status", params.status);
  if (params.search) query.append("search", params.search);
  if (params.startDate) query.append("startDate", params.startDate);
  if (params.endDate) query.append("endDate", params.endDate);
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);

  const res = await api.get(`/purchase-orders?${query.toString()}`, getBusinessHeader());
  return res.data;
};

/**
 * Get store-wide Purchase Order KPI summary
 */
export const getPOSummary = async () => {
  const res = await api.get("/purchase-orders/summary", getBusinessHeader());
  return res.data;
};

/**
 * Get single Purchase Order by ID
 */
export const getPurchaseOrderById = async (id) => {
  const res = await api.get(`/purchase-orders/${id}`, getBusinessHeader());
  return res.data;
};

/**
 * Get Purchase Order by human-readable PO number (e.g. PO-1001)
 */
export const getPurchaseOrderByNumber = async (poNumber) => {
  const res = await api.get(`/purchase-orders/number/${poNumber}`, getBusinessHeader());
  return res.data;
};

/**
 * Create a new Purchase Order
 */
export const createPurchaseOrder = async (poData, idempotencyKey = null) => {
  const config = getBusinessHeader();
  if (idempotencyKey) {
    config.headers = { ...config.headers, "Idempotency-Key": idempotencyKey };
  }
  const res = await api.post("/purchase-orders", poData, config);
  return res.data;
};

/**
 * Update Purchase Order details / items
 */
export const updatePurchaseOrder = async (id, updateData) => {
  const res = await api.put(`/purchase-orders/${id}`, updateData, getBusinessHeader());
  return res.data;
};

/**
 * Update Purchase Order status (e.g. DRAFT, PENDING, RECEIVED, CANCELLED)
 */
export const updatePOStatus = async (id, status, notes = "") => {
  const res = await api.patch(`/purchase-orders/${id}/status`, { status, notes }, getBusinessHeader());
  return res.data;
};

/**
 * Cancel a Purchase Order
 */
export const cancelPurchaseOrder = async (id, reason = "") => {
  const res = await api.post(`/purchase-orders/${id}/cancel`, { reason }, getBusinessHeader());
  return res.data;
};

/**
 * Get all Purchase Orders for a specific supplier
 */
export const getSupplierPurchaseOrders = async (supplierId, limit = 50) => {
  const res = await api.get(`/purchase-orders/supplier/${supplierId}?limit=${limit}`, getBusinessHeader());
  return res.data;
};

/**
 * Phase 7 - Task T43: Get all PurchaseItem lines for a Purchase Order
 */
export const getPurchaseOrderItems = async (poId) => {
  const res = await api.get(`/purchase-orders/${poId}/items`, getBusinessHeader());
  return res.data;
};

/**
 * Phase 7 - Task T43: Get historical purchase price history for a product
 */
export const getProductPurchaseHistory = async (productId, limit = 50) => {
  const res = await api.get(`/purchase-orders/items/product/${productId}?limit=${limit}`, getBusinessHeader());
  return res.data;
};

/**
 * Phase 7 - Task T44: Goods Received Note (GRN) API Methods
 */

/**
 * Receive physical stock items against a Purchase Order (creates GRN & increments inventory)
 */
export const receiveStock = async (receiveData, idempotencyKey = null) => {
  const config = getBusinessHeader();
  if (idempotencyKey) {
    config.headers = { ...config.headers, "Idempotency-Key": idempotencyKey };
  }
  const res = await api.post("/purchases/receive", receiveData, config);
  return res.data;
};

/**
 * Get all GRNs with optional filters
 */
export const getGRNs = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.purchaseOrderId) query.append("purchaseOrderId", params.purchaseOrderId);
  if (params.supplierId) query.append("supplierId", params.supplierId);
  if (params.status && params.status !== "ALL") query.append("status", params.status);
  if (params.search) query.append("search", params.search);
  if (params.startDate) query.append("startDate", params.startDate);
  if (params.endDate) query.append("endDate", params.endDate);
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);

  const res = await api.get(`/purchases/grn?${query.toString()}`, getBusinessHeader());
  return res.data;
};

/**
 * Get single Goods Received Note by ID
 */
export const getGRNById = async (id) => {
  const res = await api.get(`/purchases/grn/${id}`, getBusinessHeader());
  return res.data;
};

/**
 * Get all Goods Received Notes for a specific Purchase Order
 */
export const getGRNsByPoId = async (poId) => {
  const res = await api.get(`/purchases/grn/po/${poId}`, getBusinessHeader());
  return res.data;
};

/**
 * Get GRN KPI summary
 */
export const getGRNSummary = async () => {
  const res = await api.get("/purchases/grn/summary", getBusinessHeader());
  return res.data;
};

/**
 * Phase 7 - Task T47: Purchase Order Workflow History & Timeline API Methods
 */

/**
 * Get raw chronological audit history events for a Purchase Order
 */
export const getPurchaseOrderHistory = async (poId, params = {}) => {
  const query = new URLSearchParams();
  if (params.sortOrder) query.append("sortOrder", params.sortOrder);
  if (params.eventType && params.eventType !== "ALL") query.append("eventType", params.eventType);

  const res = await api.get(`/purchase-orders/${poId}/history?${query.toString()}`, getBusinessHeader());
  return res.data;
};

/**
 * Get aggregated visual audit timeline and lead-time analytics for a Purchase Order
 */
export const getPurchaseOrderTimeline = async (poId) => {
  const res = await api.get(`/purchase-orders/${poId}/timeline`, getBusinessHeader());
  return res.data;
};

/**
 * Append manual operational note to Purchase Order timeline
 */
export const addPurchaseOrderHistoryLog = async (poId, logData) => {
  const res = await api.post(`/purchase-orders/${poId}/history/log`, logData, getBusinessHeader());
  return res.data;
};

/**
 * Get supplier procurement delivery performance & lead time stats
 */
export const getSupplierProcurementPerformance = async (supplierId) => {
  const res = await api.get(`/purchase-orders/suppliers/${supplierId}/performance`, getBusinessHeader());
  return res.data;
};

export default {
  getPurchaseOrders,
  getPOSummary,
  getPurchaseOrderById,
  getPurchaseOrderByNumber,
  createPurchaseOrder,
  updatePurchaseOrder,
  updatePOStatus,
  cancelPurchaseOrder,
  getSupplierPurchaseOrders,
  getPurchaseOrderItems,
  getProductPurchaseHistory,
  receiveStock,
  getGRNs,
  getGRNById,
  getGRNsByPoId,
  getGRNSummary,
  getPurchaseOrderHistory,
  getPurchaseOrderTimeline,
  addPurchaseOrderHistoryLog,
  getSupplierProcurementPerformance,
};
