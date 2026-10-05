import api from "./api";

/**
 * Task T48: Expense Category Configurations API Client
 * Multi-tenant client scoped to active business context.
 */

// 1. Get all expense categories with optional filtering
export const getExpenseCategories = async (params = {}) => {
  const response = await api.get("/expense-categories", { params });
  return response.data;
};

// 2. Get single expense category by ID
export const getExpenseCategoryById = async (id) => {
  const response = await api.get(`/expense-categories/${id}`);
  return response.data;
};

// 3. Create a new custom expense category
export const createExpenseCategory = async (payload) => {
  const response = await api.post("/expense-categories", payload);
  return response.data;
};

// 4. Update an existing expense category
export const updateExpenseCategory = async (id, payload) => {
  const response = await api.put(`/expense-categories/${id}`, payload);
  return response.data;
};

// 5. Toggle active / inactive status
export const toggleExpenseCategoryStatus = async (id) => {
  const response = await api.patch(`/expense-categories/${id}/status`);
  return response.data;
};

// 6. Archive (soft-delete) expense category
export const archiveExpenseCategory = async (id) => {
  const response = await api.post(`/expense-categories/${id}/archive`);
  return response.data;
};

// 7. Restore archived category
export const restoreExpenseCategory = async (id) => {
  const response = await api.post(`/expense-categories/${id}/restore`);
  return response.data;
};

// 8. Delete category alias
export const deleteExpenseCategory = async (id) => {
  const response = await api.delete(`/expense-categories/${id}`);
  return response.data;
};

// 9. Seed default categories
export const seedDefaultExpenseCategories = async () => {
  const response = await api.post("/expense-categories/seed-defaults");
  return response.data;
};

// 10. Get summary metrics
export const getExpenseCategorySummary = async () => {
  const response = await api.get("/expense-categories/summary");
  return response.data;
};
