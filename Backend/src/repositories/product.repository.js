const Product = require("../models/product.model");
const Category = require("../models/category.model");

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

  if (filters.search && filters.search.trim()) {
    const searchTerm = filters.search.trim();

    // 1. Check if the search term matches any category name in this business
    const matchingCategories = await Category.find({
      businessId,
      name: { $regex: searchTerm, $options: "i" },
    }).select("_id");

    const categoryIds = matchingCategories.map((c) => c._id);

    const searchConditions = [
      { name: { $regex: searchTerm, $options: "i" } },
      { sku: { $regex: searchTerm, $options: "i" } },
      { barcode: { $regex: searchTerm, $options: "i" } },
    ];

    if (categoryIds.length > 0) {
      searchConditions.push({ categoryId: { $in: categoryIds } });
    }

    query.$or = searchConditions;
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

/**
 * Task T14: Fast Search & Filter for POS & Typeahead
 * Rapidly matches SKU, Name, Barcode, or Category with high priority.
 */
const searchProducts = async (businessId, { query = "", limit = 20, categoryId = null, includeArchived = false }) => {
  const dbQuery = { businessId };

  if (!includeArchived) {
    dbQuery.isArchived = false;
    dbQuery.isActive = true;
  }

  if (categoryId) {
    dbQuery.categoryId = categoryId;
  }

  const cleanTerm = (query || "").trim();

  if (cleanTerm) {
    // 1. Resolve matching categories
    const matchingCategories = await Category.find({
      businessId,
      name: { $regex: cleanTerm, $options: "i" },
    }).select("_id");

    const matchedCategoryIds = matchingCategories.map((c) => c._id);

    const searchConditions = [
      { name: { $regex: cleanTerm, $options: "i" } },
      { sku: { $regex: cleanTerm, $options: "i" } },
      { barcode: { $regex: cleanTerm, $options: "i" } },
    ];

    if (matchedCategoryIds.length > 0) {
      searchConditions.push({ categoryId: { $in: matchedCategoryIds } });
    }

    dbQuery.$or = searchConditions;
  }

  const cappedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  return await Product.find(dbQuery)
    .select(
      "_id businessId categoryId name sku barcode sellingPrice costPrice unit packSize packagingType description isActive isArchived createdAt"
    )
    .populate("categoryId", "name description")
    .sort({ updatedAt: -1, _id: -1 })
    .limit(cappedLimit);
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
    { returnDocument: "after", new: true, runValidators: true }
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
    { returnDocument: "after", new: true }
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
    { returnDocument: "after", new: true }
  ).populate("categoryId", "name description");
};

const deleteProductById = async (businessId, productId) => {
  // Safe default: Soft-deletes / Archives product to preserve invoice history
  return await archiveProductById(businessId, productId);
};

module.exports = {
  createProduct,
  findProductsByBusinessId,
  searchProducts,
  findProductById,
  findProductBySku,
  findProductByBarcode,
  updateProductById,
  archiveProductById,
  restoreProductById,
  deleteProductById,
};
