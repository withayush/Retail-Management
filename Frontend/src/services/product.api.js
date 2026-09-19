import api from "./api";

export const getProducts = async (params = {}) => {
  const response = await api.get("/api/products", { params });
  return response.data;
};

export const getProductById = async (id) => {
  const response = await api.get(`/api/products/${id}`);
  return response.data;
};

export const getProductByBarcode = async (barcode) => {
  const response = await api.get(`/api/products/barcode/${barcode}`);
  return response.data;
};

export const createProduct = async (payload) => {
  const response = await api.post("/api/products", payload);
  return response.data;
};

export const updateProduct = async (id, payload) => {
  const response = await api.put(`/api/products/${id}`, payload);
  return response.data;
};

export const archiveProduct = async (id) => {
  const response = await api.post(`/api/products/${id}/archive`);
  return response.data;
};

export const restoreProduct = async (id) => {
  const response = await api.post(`/api/products/${id}/restore`);
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/api/products/${id}`);
  return response.data;
};

export const getProductCategories = async () => {
  const response = await api.get("/api/categories");
  return response.data;
};

export const createCategory = async (payload) => {
  const response = await api.post("/api/categories", payload);
  return response.data;
};
