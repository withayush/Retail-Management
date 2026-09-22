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
  const product = await productRepo.createProduct({
    ...payload,
    businessId,
    sku: cleanSku,
    barcode: cleanBarcode,
  });

  // 5. Phase 3 - Task T17: Opening Stock Initialization with Immutable OPENING Ledger Entry
  const customReorder = Number(payload.reorderLevel);
  const defaultReorder = !isNaN(customReorder) && customReorder >= 0 ? customReorder : 5;
  const initialStockQty = Number(payload.openingStock ?? payload.initialStock ?? payload.availableStock ?? 0);

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    const inventoryRepo = require("../repositories/inventory.repository");
    if (!isNaN(initialStockQty) && initialStockQty > 0) {
      // Record audited opening balance in ledger and set inventory availableStock
      await inventoryRepo.recordStockMovement({
        businessId,
        productId: product._id,
        qtyChange: initialStockQty,
        type: "OPENING",
        reason: "Opening Stock Initial Balance",
        notes: payload.openingStockNotes || "Seeded upon product creation (T17)",
      });

      if (defaultReorder !== 5) {
        await inventoryRepo.updateReorderLevel(businessId, product._id, defaultReorder);
      }
    } else {
      // Establish base inventory store state with 0 availableStock and specified reorder threshold
      await inventoryRepo.getOrCreateInventory(businessId, product._id, 0, defaultReorder);
    }
  }

  return product;
};

const { encodeCursor, decodeCursor } = require("../utils/pagination");

const getProducts = async (businessId, filters = {}) => {
  if (!mongoose.Types.ObjectId.isValid(businessId)) {
    const error = new Error("Invalid business ID.");
    error.statusCode = 400;
    error.code = "INVALID_BUSINESS_ID";
    throw error;
  }

  // 1. Decode Cursor if provided
  let cursorId = null;
  if (filters.cursor) {
    const decoded = decodeCursor(filters.cursor);
    if (decoded && decoded.id && mongoose.Types.ObjectId.isValid(decoded.id)) {
      cursorId = new mongoose.Types.ObjectId(decoded.id);
    } else if (mongoose.Types.ObjectId.isValid(filters.cursor)) {
      cursorId = new mongoose.Types.ObjectId(filters.cursor);
    }
  }

  // 2. Fetch limit + 1 items from Repository
  const { rawProducts, limit } = await productRepo.findProductsByBusinessId(businessId, {
    ...filters,
    cursorId,
  });

  // 3. Determine if more items exist and slice results to requested limit
  const hasMore = rawProducts.length > limit;
  const products = hasMore ? rawProducts.slice(0, limit) : rawProducts;

  // 4. Generate opaque nextCursor from the last item
  const lastProduct = products.length > 0 ? products[products.length - 1] : null;
  const nextCursor = hasMore && lastProduct
    ? encodeCursor({ id: lastProduct._id.toString() })
    : null;

  // 5. Fetch live inventory stock state for these products
  const { Inventory } = require("../models/inventory.model");
  const productIds = products.map((p) => p._id);
  let inventories = [];
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      inventories = await Inventory.find({
        businessId,
        productId: { $in: productIds },
      }).lean();
    }
  } catch {
    inventories = [];
  }

  const invMap = new Map();
  for (const inv of inventories) {
    invMap.set(inv.productId.toString(), inv);
  }

  // 6. Payload Shaping (Restricts return payload to lightweight, fast-rendering representation for mobile/web)
  const data = products.map((prod) => {
    const inv = invMap.get(prod._id.toString());
    const availableStock = inv ? inv.availableStock : 0;
    const reorderLevel = inv ? inv.reorderLevel : 5;
    const lowStockAlert = availableStock <= reorderLevel;
    let stockStatus = "IN_STOCK";
    if (availableStock <= 0) stockStatus = "OUT_OF_STOCK";
    else if (availableStock <= reorderLevel) stockStatus = "LOW_STOCK";

    return {
      id: prod._id,
      name: prod.name,
      sku: prod.sku,
      barcode: prod.barcode || null,
      sellingPrice: prod.sellingPrice,
      costPrice: prod.costPrice,
      unit: prod.unit || "pcs",
      packSize: prod.packSize || 1,
      packagingType: prod.packagingType || "",
      category: prod.categoryId
        ? {
            id: prod.categoryId._id || prod.categoryId,
            name: prod.categoryId.name || "Uncategorized",
          }
        : null,
      description: prod.description || "",
      availableStock,
      reorderLevel,
      lowStockAlert,
      stockStatus,
      isActive: prod.isActive,
      isArchived: prod.isArchived,
      createdAt: prod.createdAt,
    };
  });

  return {
    data,
    pagination: {
      limit,
      nextCursor,
      hasMore,
    },
  };
};

/**
 * Task T14: Product Elastic Search & Rapid POS Lookup Service
 */
const searchProducts = async (businessId, queryParams = {}) => {
  if (!mongoose.Types.ObjectId.isValid(businessId)) {
    const error = new Error("Invalid business ID.");
    error.statusCode = 400;
    error.code = "INVALID_BUSINESS_ID";
    throw error;
  }

  const query = queryParams.q || queryParams.query || queryParams.search || "";
  const limit = Math.min(Math.max(parseInt(queryParams.limit, 10) || 20, 1), 100);
  const categoryId = queryParams.categoryId && mongoose.Types.ObjectId.isValid(queryParams.categoryId)
    ? queryParams.categoryId
    : null;

  const rawProducts = await productRepo.searchProducts(businessId, {
    query,
    limit,
    categoryId,
    includeArchived: queryParams.includeArchived === "true" || queryParams.includeArchived === true,
  });

  const { Inventory } = require("../models/inventory.model");
  const productIds = rawProducts.map((p) => p._id);
  let inventories = [];
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      inventories = await Inventory.find({
        businessId,
        productId: { $in: productIds },
      }).lean();
    }
  } catch {
    inventories = [];
  }

  const invMap = new Map();
  for (const inv of inventories) {
    invMap.set(inv.productId.toString(), inv);
  }

  const data = rawProducts.map((prod) => {
    const inv = invMap.get(prod._id.toString());
    const availableStock = inv ? inv.availableStock : 0;
    const reorderLevel = inv ? inv.reorderLevel : 5;
    const lowStockAlert = availableStock <= reorderLevel;
    let stockStatus = "IN_STOCK";
    if (availableStock <= 0) stockStatus = "OUT_OF_STOCK";
    else if (availableStock <= reorderLevel) stockStatus = "LOW_STOCK";

    return {
      id: prod._id,
      name: prod.name,
      sku: prod.sku,
      barcode: prod.barcode || null,
      sellingPrice: prod.sellingPrice,
      costPrice: prod.costPrice,
      unit: prod.unit || "pcs",
      packSize: prod.packSize || 1,
      packagingType: prod.packagingType || "",
      category: prod.categoryId
        ? {
            id: prod.categoryId._id || prod.categoryId,
            name: prod.categoryId.name || "Uncategorized",
          }
        : null,
      description: prod.description || "",
      availableStock,
      reorderLevel,
      lowStockAlert,
      stockStatus,
      isActive: prod.isActive,
      isArchived: prod.isArchived,
    };
  });

  return {
    data,
    count: data.length,
    query,
  };
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

  // 2. Prevent updating an archived product without restoring it first
  if (existingProduct.isArchived && updatePayload.isArchived === undefined) {
    const error = new Error("Cannot update an archived product. Please restore the product first.");
    error.statusCode = 400;
    error.code = "CANNOT_UPDATE_ARCHIVED_PRODUCT";
    throw error;
  }

  // 3. If Category is updated, verify it belongs to this business
  if (updatePayload.categoryId) {
    const category = await categoryRepo.findCategoryById(businessId, updatePayload.categoryId);
    if (!category) {
      const error = new Error("Selected category does not exist or does not belong to this business.");
      error.statusCode = 400;
      error.code = "INVALID_CATEGORY";
      throw error;
    }
  }

  // 4. If SKU is updated, verify uniqueness
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

  // 5. If Barcode is updated, verify uniqueness
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

const archiveProduct = async (businessId, productId) => {
  if (!mongoose.Types.ObjectId.isValid(businessId) || !mongoose.Types.ObjectId.isValid(productId)) {
    const error = new Error("Invalid ID format.");
    error.statusCode = 400;
    error.code = "INVALID_ID";
    throw error;
  }

  const existingProduct = await productRepo.findProductById(businessId, productId);
  if (!existingProduct) {
    const error = new Error("Product not found in this business.");
    error.statusCode = 404;
    error.code = "PRODUCT_NOT_FOUND";
    throw error;
  }

  if (existingProduct.isArchived) {
    const error = new Error("Product is already archived.");
    error.statusCode = 400;
    error.code = "PRODUCT_ALREADY_ARCHIVED";
    throw error;
  }

  return await productRepo.archiveProductById(businessId, productId);
};

const restoreProduct = async (businessId, productId) => {
  if (!mongoose.Types.ObjectId.isValid(businessId) || !mongoose.Types.ObjectId.isValid(productId)) {
    const error = new Error("Invalid ID format.");
    error.statusCode = 400;
    error.code = "INVALID_ID";
    throw error;
  }

  const existingProduct = await productRepo.findProductById(businessId, productId);
  if (!existingProduct) {
    const error = new Error("Product not found in this business.");
    error.statusCode = 404;
    error.code = "PRODUCT_NOT_FOUND";
    throw error;
  }

  if (!existingProduct.isArchived) {
    const error = new Error("Product is not archived.");
    error.statusCode = 400;
    error.code = "PRODUCT_NOT_ARCHIVED";
    throw error;
  }

  return await productRepo.restoreProductById(businessId, productId);
};

const deleteProduct = async (businessId, productId) => {
  // Soft-deletes / Archives product to preserve historic invoices and reporting data
  const archived = await archiveProduct(businessId, productId);

  return {
    success: true,
    message: "Product soft-deleted (archived) successfully. Historical invoices remain intact.",
    data: archived,
  };
};

module.exports = {
  createProduct,
  getProducts,
  searchProducts,
  getProductById,
  getProductByBarcode,
  updateProduct,
  archiveProduct,
  restoreProduct,
  deleteProduct,
};
