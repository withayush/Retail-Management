import api from "./api";

/**
 * Task T49: Expense API Client Layer
 * Multi-tenant client scoped to active business context.
 */

// 1. Get paginated expenses with filters
export const getExpenses = async (params = {}) => {
  const response = await api.get("/expenses", { params });
  return response.data;
};

// 2. Get executive expense KPI summary metrics
export const getExpenseSummary = async (params = {}) => {
  const response = await api.get("/expenses/summary", { params });
  return response.data;
};

// 3. Get single expense by ID
export const getExpenseById = async (id) => {
  const response = await api.get(`/expenses/${id}`);
  return response.data;
};

// 4. Get expense by human-readable number (e.g. EXP-1001)
export const getExpenseByNumber = async (expenseNumber) => {
  const response = await api.get(`/expenses/number/${expenseNumber}`);
  return response.data;
};

// 5. Record / Create a new expense transaction
export const createExpense = async (payload) => {
  const response = await api.post("/expenses", payload);
  return response.data;
};

// 6. Update existing expense
export const updateExpense = async (id, payload) => {
  const response = await api.put(`/expenses/${id}`, payload);
  return response.data;
};

// 7. Archive / Soft-delete expense
export const archiveExpense = async (id) => {
  const response = await api.post(`/expenses/${id}/archive`);
  return response.data;
};

// 8. Delete expense alias
export const deleteExpense = async (id) => {
  const response = await api.delete(`/expenses/${id}`);
  return response.data;
};

// ============================================
// TASK T51: MONTHLY OPEX AGGREGATOR CLIENT
// ============================================

// 9. Get full calendar year OpEx progression & executive metrics
export const getMonthlyOpExOverview = async (params = {}) => {
  const response = await api.get("/expenses/monthly-opex", { params });
  return response.data;
};

// 10. Get current calendar month OpEx summary with MoM metrics
export const getCurrentMonthOpEx = async (params = {}) => {
  const response = await api.get("/expenses/monthly-opex/current", { params });
  return response.data;
};

// 11. Get single calendar month detailed aggregated statement
export const getMonthlyOpExDetail = async (year, month, params = {}) => {
  const response = await api.get(`/expenses/monthly-opex/${year}/${month}`, { params });
  return response.data;
};

// 12. Trigger manual recalculation and cache synchronization
export const recalculateMonthlyOpEx = async (payload = {}) => {
  const response = await api.post("/expenses/monthly-opex/recalculate", payload);
  return response.data;
};

