import api from "./api";
export {
  getCategories,
  getProductCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./category.api";

// ── Products API Client ──

export const getProducts = async (params = {}) => {
  const response = await api.get("/products", { params });
  return response.data;
};

export const searchProducts = async (params = {}) => {
  // params can be { q: "...", categoryId: "...", limit: 20 } or string
  const queryParams = typeof params === "string" ? { q: params } : params;
  const response = await api.get("/products/search", { params: queryParams });
  return response.data;
};

export const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const getProductByBarcode = async (barcode) => {
  const response = await api.get(`/products/barcode/${barcode}`);
  return response.data;
};

export const createProduct = async (payload) => {
  const response = await api.post("/products", payload);
  return response.data;
};

export const updateProduct = async (id, payload) => {
  const response = await api.put(`/products/${id}`, payload);
  return response.data;
};

export const archiveProduct = async (id) => {
  const response = await api.post(`/products/${id}/archive`);
  return response.data;
};

export const restoreProduct = async (id) => {
  const response = await api.post(`/products/${id}/restore`);
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};
