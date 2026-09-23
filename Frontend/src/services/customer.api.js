import api from "./api";

const getBusinessHeader = () => ({
  headers: { "x-business-id": localStorage.getItem("businessId") },
});

// T31 / T32: Fetch all customers (with optional search, phone, status, hasDebt filters)
export const getCustomers = async (search = "", filters = {}) => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (filters.phone) params.append("phone", filters.phone);
  if (filters.status) params.append("status", filters.status);
  if (filters.hasDebt) params.append("hasDebt", filters.hasDebt);
  if (filters.page) params.append("page", filters.page);
  if (filters.limit) params.append("limit", filters.limit);
  const qs = params.toString();
  const res = await api.get(`/customers${qs ? `?${qs}` : ""}`, getBusinessHeader());
  return res.data;
};

// T32: Fast POS Autocomplete Search
export const searchCustomers = async (query = "", limit = 10) => {
  const res = await api.get(`/customers/search?q=${encodeURIComponent(query)}&limit=${limit}`, getBusinessHeader());
  return res.data;
};

// T32: Fetch single customer by ID
export const getCustomerById = async (customerId) => {
  const res = await api.get(`/customers/${customerId}`, getBusinessHeader());
  return res.data;
};

// T32: Fetch customer by raw/canonical Phone
export const getCustomerByPhone = async (phone) => {
  const res = await api.get(`/customers/phone/${encodeURIComponent(phone)}`, getBusinessHeader());
  return res.data;
};

// T32: Register a new customer
export const createCustomer = async (data) => {
  const res = await api.post("/customers", data, getBusinessHeader());
  return res.data;
};

// T32: Update existing customer
export const updateCustomer = async (customerId, data) => {
  const res = await api.put(`/customers/${customerId}`, data, getBusinessHeader());
  return res.data;
};

// T32: Soft-delete / Archive customer
export const archiveCustomer = async (customerId) => {
  const res = await api.delete(`/customers/${customerId}`, getBusinessHeader());
  return res.data;
};

// T32: Restore customer back to ACTIVE
export const restoreCustomer = async (customerId) => {
  const res = await api.post(`/customers/${customerId}/restore`, {}, getBusinessHeader());
  return res.data;
};

// T34: Real-time outstanding balance for a single customer
export const getCustomerOutstanding = async (customerId) => {
  const res = await api.get(`/customers/${customerId}/outstanding`, getBusinessHeader());
  return res.data;
};

// T34: All customers with active outstanding debt (business-wide, ordered by amount)
export const getBusinessOutstandingSummary = async () => {
  const res = await api.get("/customers/outstanding/summary", getBusinessHeader());
  return res.data;
};

// T34: Aggregated outstanding totals for the whole business (dashboard widget)
export const getBusinessOutstandingTotals = async () => {
  const res = await api.get("/customers/outstanding/totals", getBusinessHeader());
  return res.data;
};

// T35: Record a payment settlement
export const recordCustomerPayment = async (customerId, data) => {
  const res = await api.post(`/customers/${customerId}/pay`, data, getBusinessHeader());
  return res.data;
};

// T33 / T35: Get ledger / full payment history for a customer
export const getCustomerLedger = async (customerId, pagination = {}) => {
  const params = new URLSearchParams();
  if (pagination.page) params.append("page", pagination.page);
  if (pagination.limit) params.append("limit", pagination.limit);
  const qs = params.toString();
  const res = await api.get(`/customers/${customerId}/ledger${qs ? `?${qs}` : ""}`, getBusinessHeader());
  return res.data;
};

// T33: Append a manual credit/debit or adjustment customer ledger entry
export const appendCustomerLedgerEntry = async (customerId, data) => {
  const res = await api.post(`/customers/${customerId}/ledger`, data, getBusinessHeader());
  return res.data;
};

// T35: Dedicated payment settlements only (PAYMENT_RECEIVED entries, supports ?from=&to=&limit=)
export const getCustomerPaymentHistory = async (customerId, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.from) params.append("from", filters.from);
  if (filters.to) params.append("to", filters.to);
  if (filters.limit) params.append("limit", filters.limit);
  const qs = params.toString();
  const res = await api.get(`/customers/${customerId}/payments${qs ? `?${qs}` : ""}`, getBusinessHeader());
  return res.data;
};

// T36: Full CRM Profiling — sales metrics, debt aging, top products, monthly trend
export const getCustomerCRMProfile = async (customerId) => {
  const res = await api.get(`/customers/${customerId}/profile`, getBusinessHeader());
  return res.data;
};
