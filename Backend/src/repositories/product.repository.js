const Product = require("../models/product.model");

/**
 * Product Repository Layer
 * Strictly business-scoped database queries for Product catalog operations.
 */

const createProduct = async (productData) => {
  return await Product.create(productData);
};

const findProductsByBusinessId = async (businessId, filters = {}) => {
  const query = { businessId };

  // Status & Archival Filtering:
  // - "archived": only archived products
  // - "all": both active and archived products
  // - default: only active, non-archived products
  if (filters.status === "archived" || filters.isArchived === "true" || filters.isArchived === true) {
    query.isArchived = true;
  } else if (filters.status !== "all") {
    query.isArchived = false;
  }

  if (filters.categoryId) {
    query.categoryId = filters.categoryId;
  }

  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive === "true" || filters.isActive === true;
  }

  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: "i" } },
      { sku: { $regex: filters.search, $options: "i" } },
      { barcode: { $regex: filters.search, $options: "i" } },
    ];
  }

  // Cursor pagination seek: fetches records with _id < cursorId (Newest first)
  if (filters.cursorId) {
    query._id = { $lt: filters.cursorId };
  }

  // Limit capped between 1 and 100 (Default: 20)
  const limit = Math.min(Math.max(parseInt(filters.limit, 10) || 20, 1), 100);

  // Fetch limit + 1 items to efficiently check if more records exist
  const products = await Product.find(query)
    .select(
      "_id businessId categoryId name sku barcode sellingPrice costPrice unit packSize packagingType description isActive isArchived createdAt"
    )
    .populate("categoryId", "name description")
    .sort({ _id: -1 })
    .limit(limit + 1);

  return {
    rawProducts: products,
    limit,
  };
};

const findProductById = async (businessId, productId) => {
  return await Product.findOne({
    _id: productId,
    businessId,
  }).populate("categoryId", "name description");
};

const findProductBySku = async (businessId, sku) => {
  return await Product.findOne({
    businessId,
    sku: sku.trim().toUpperCase(),
  });
};

const findProductByBarcode = async (businessId, barcode) => {
  return await Product.findOne({
    businessId,
    barcode: barcode.trim(),
  }).populate("categoryId", "name description");
};

const updateProductById = async (businessId, productId, updateData) => {
  return await Product.findOneAndUpdate(
    {
      _id: productId,
      businessId,
    },
    { $set: updateData },
    { new: true, runValidators: true }
  ).populate("categoryId", "name description");
};

const archiveProductById = async (businessId, productId) => {
  return await Product.findOneAndUpdate(
    {
      _id: productId,
      businessId,
    },
    {
      $set: {
        isArchived: true,
        isActive: false,
        archivedAt: new Date(),
      },
    },
    { new: true }
  ).populate("categoryId", "name description");
};

const restoreProductById = async (businessId, productId) => {
  return await Product.findOneAndUpdate(
    {
      _id: productId,
      businessId,
    },
    {
      $set: {
        isArchived: false,
        isActive: true,
        archivedAt: null,
      },
    },
    { new: true }
  ).populate("categoryId", "name description");
};

const deleteProductById = async (businessId, productId) => {
  // Safe default: Soft-deletes / Archives product to preserve invoice history
  return await archiveProductById(businessId, productId);
};

module.exports = {
  createProduct,
  findProductsByBusinessId,
  findProductById,
  findProductBySku,
  findProductByBarcode,
  updateProductById,
  archiveProductById,
  restoreProductById,
  deleteProductById,
};
