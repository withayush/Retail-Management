import api from "./api";

/**
 * Task T7: Category Management API Client Layer
 * Scoped to active business tenant via x-business-id header / auto-resolution.
 */

// 1. Get all categories for active business
export const getCategories = async (params = {}) => {
  const response = await api.get("/categories", { params });
  return response.data;
};

export const getProductCategories = getCategories;

// 2. Get single category by ID
export const getCategoryById = async (id) => {
  const response = await api.get(`/categories/${id}`);
  return response.data;
};

// 3. Create a new category
export const createCategory = async (payload) => {
  const response = await api.post("/categories", payload);
  return response.data;
};

// 4. Update an existing category (name, description)
export const updateCategory = async (id, payload) => {
  const response = await api.put(`/categories/${id}`, payload);
  return response.data;
};

// 5. Delete category (safe check if products are attached)
export const deleteCategory = async (id) => {
  const response = await api.delete(`/categories/${id}`);
  return response.data;
};
