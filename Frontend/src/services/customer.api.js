import api from "./api";

const getBusinessHeader = () => ({
  headers: { "x-business-id": localStorage.getItem("businessId") },
});

// T31 / T32: Fetch all customers (with optional search)
export const getCustomers = async (search = "") => {
  const res = await api.get(`/customers?search=${encodeURIComponent(search)}`, getBusinessHeader());
  return res.data;
};

// T32: Fetch single customer by ID
export const getCustomerById = async (customerId) => {
  const res = await api.get(`/customers/${customerId}`, getBusinessHeader());
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

// T35: Get ledger / full payment history for a customer
export const getCustomerLedger = async (customerId) => {
  const res = await api.get(`/customers/${customerId}/ledger`, getBusinessHeader());
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
