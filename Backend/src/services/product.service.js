const mongoose = require("mongoose");
const productRepo = require("../repositories/product.repository");
const categoryRepo = require("../repositories/category.repository");

/**
 * Product Service Layer
 * Business logic, category verification, SKU uniqueness, and multi-tenant security.
 */

const createProduct = async (businessId, payload) => {
  if (!mongoose.Types.ObjectId.isValid(businessId)) {
    const error = new Error("Invalid business ID.");
    error.statusCode = 400;
    error.code = "INVALID_BUSINESS_ID";
    throw error;
  }

  // 1. Verify that Category exists and belongs to THIS business
  const category = await categoryRepo.findCategoryById(businessId, payload.categoryId);
  if (!category) {
    const error = new Error("Selected category does not exist or does not belong to this business.");
    error.statusCode = 400;
    error.code = "INVALID_CATEGORY";
    throw error;
  }

  // 2. Multi-tenant SKU Uniqueness Check
  const cleanSku = payload.sku.trim().toUpperCase();
  const existingSku = await productRepo.findProductBySku(businessId, cleanSku);
  if (existingSku) {
    const error = new Error(`A product with SKU "${cleanSku}" already exists in this business.`);
    error.statusCode = 409;
    error.code = "SKU_ALREADY_EXISTS";
    throw error;
  }

  // 3. Multi-tenant Barcode Uniqueness Check (if barcode is provided)
  let cleanBarcode = payload.barcode ? payload.barcode.trim() : null;
  if (cleanBarcode) {
    const existingBarcode = await productRepo.findProductByBarcode(businessId, cleanBarcode);
    if (existingBarcode) {
      const error = new Error(`A product with barcode "${cleanBarcode}" already exists in this business.`);
      error.statusCode = 409;
      error.code = "BARCODE_ALREADY_EXISTS";
      throw error;
    }
  }

  // 4. Create Product with server-injected businessId
  return await productRepo.createProduct({
    ...payload,
    businessId,
    sku: cleanSku,
    barcode: cleanBarcode,
  });
};

const getProducts = async (businessId, filters = {}) => {
  if (!mongoose.Types.ObjectId.isValid(businessId)) {
    const error = new Error("Invalid business ID.");
    error.statusCode = 400;
    error.code = "INVALID_BUSINESS_ID";
    throw error;
  }

  return await productRepo.findProductsByBusinessId(businessId, filters);
};

const getProductById = async (businessId, productId) => {
  if (!mongoose.Types.ObjectId.isValid(businessId) || !mongoose.Types.ObjectId.isValid(productId)) {
    const error = new Error("Invalid ID format.");
    error.statusCode = 400;
    error.code = "INVALID_ID";
    throw error;
  }

  const product = await productRepo.findProductById(businessId, productId);
  if (!product) {
    const error = new Error("Product not found in this business.");
    error.statusCode = 404;
    error.code = "PRODUCT_NOT_FOUND";
    throw error;
  }

  return product;
};

const getProductByBarcode = async (businessId, barcode) => {
  if (!mongoose.Types.ObjectId.isValid(businessId)) {
    const error = new Error("Invalid business ID.");
    error.statusCode = 400;
    error.code = "INVALID_BUSINESS_ID";
    throw error;
  }

  if (!barcode || typeof barcode !== "string") {
    const error = new Error("Barcode parameter is required.");
    error.statusCode = 400;
    error.code = "BARCODE_REQUIRED";
    throw error;
  }

  const product = await productRepo.findProductByBarcode(businessId, barcode.trim());
  if (!product) {
    const error = new Error(`No product found with barcode "${barcode.trim()}" in this business.`);
    error.statusCode = 404;
    error.code = "PRODUCT_NOT_FOUND";
    throw error;
  }

  return product;
};

const updateProduct = async (businessId, productId, updatePayload) => {
  if (!mongoose.Types.ObjectId.isValid(businessId) || !mongoose.Types.ObjectId.isValid(productId)) {
    const error = new Error("Invalid ID format.");
    error.statusCode = 400;
    error.code = "INVALID_ID";
    throw error;
  }

  // 1. Verify existence in this business
  const existingProduct = await productRepo.findProductById(businessId, productId);
  if (!existingProduct) {
    const error = new Error("Product not found in this business.");
    error.statusCode = 404;
    error.code = "PRODUCT_NOT_FOUND";
    throw error;
  }

  // 2. If Category is updated, verify it belongs to this business
  if (updatePayload.categoryId) {
    const category = await categoryRepo.findCategoryById(businessId, updatePayload.categoryId);
    if (!category) {
      const error = new Error("Selected category does not exist or does not belong to this business.");
      error.statusCode = 400;
      error.code = "INVALID_CATEGORY";
      throw error;
    }
  }

  // 3. If SKU is updated, verify uniqueness
  if (updatePayload.sku) {
    const cleanSku = updatePayload.sku.trim().toUpperCase();
    const duplicateSku = await productRepo.findProductBySku(businessId, cleanSku);
    if (duplicateSku && duplicateSku._id.toString() !== productId.toString()) {
      const error = new Error(`Another product with SKU "${cleanSku}" already exists in this business.`);
      error.statusCode = 409;
      error.code = "SKU_ALREADY_EXISTS";
      throw error;
    }
    updatePayload.sku = cleanSku;
  }

  // 4. If Barcode is updated, verify uniqueness
  if (updatePayload.barcode) {
    const cleanBarcode = updatePayload.barcode.trim();
    const duplicateBarcode = await productRepo.findProductByBarcode(businessId, cleanBarcode);
    if (duplicateBarcode && duplicateBarcode._id.toString() !== productId.toString()) {
      const error = new Error(`Another product with barcode "${cleanBarcode}" already exists in this business.`);
      error.statusCode = 409;
      error.code = "BARCODE_ALREADY_EXISTS";
      throw error;
    }
    updatePayload.barcode = cleanBarcode;
  }

  return await productRepo.updateProductById(businessId, productId, updatePayload);
};

const deleteProduct = async (businessId, productId) => {
  if (!mongoose.Types.ObjectId.isValid(businessId) || !mongoose.Types.ObjectId.isValid(productId)) {
    const error = new Error("Invalid ID format.");
    error.statusCode = 400;
    error.code = "INVALID_ID";
    throw error;
  }

  const deleted = await productRepo.deleteProductById(businessId, productId);
  if (!deleted) {
    const error = new Error("Product not found in this business.");
    error.statusCode = 404;
    error.code = "PRODUCT_NOT_FOUND";
    throw error;
  }

  return {
    success: true,
    message: "Product deleted successfully.",
    deletedId: productId,
  };
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  getProductByBarcode,
  updateProduct,
  deleteProduct,
};
