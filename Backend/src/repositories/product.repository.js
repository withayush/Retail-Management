const Product = require("../models/product.model");
const Category = require("../models/category.model");
const { rankProducts, tokenize } = require("../utils/fuzzySearch");

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
    const rawSearch = filters.search.trim();
    const escapedTerm = rawSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const tokens = tokenize(rawSearch).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

    // 1. Check if the search term matches any category name in this business
    let categoryIds = [];
    try {
      const matchingCategories = await Category.find({
        businessId,
        name: { $regex: escapedTerm, $options: "i" },
      }).select("_id");
      categoryIds = matchingCategories.map((c) => c._id);
    } catch {}

    const searchConditions = [
      { name: { $regex: escapedTerm, $options: "i" } },
      { sku: { $regex: escapedTerm, $options: "i" } },
      { barcode: { $regex: escapedTerm, $options: "i" } },
    ];

    if (categoryIds.length > 0) {
      searchConditions.push({ categoryId: { $in: categoryIds } });
    }

    // Support word-order invariant token matching
    if (tokens.length > 1) {
      searchConditions.push({
        $and: tokens.map((tok) => ({
          $or: [
            { name: { $regex: tok, $options: "i" } },
            { sku: { $regex: tok, $options: "i" } },
            { barcode: { $regex: tok, $options: "i" } },
          ],
        })),
      });
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
 * Task T14: Fast Search & Intelligent Fuzzy Filter for POS & Typeahead
 * Rapidly matches Barcode, SKU, Multi-Token Keywords, or Typo-resilient fuzzy similarity.
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
  const cappedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  // If query is empty, return latest active products
  if (!cleanTerm) {
    return await Product.find(dbQuery)
      .select(
        "_id businessId categoryId name sku barcode sellingPrice costPrice unit packSize packagingType description isActive isArchived createdAt"
      )
      .populate("categoryId", "name description")
      .sort({ updatedAt: -1, _id: -1 })
      .limit(cappedLimit);
  }

  // ── Step 1: Check Exact Barcode Match First (Instant O(1) POS priority) ──
  let exactBarcodeMatch = null;
  try {
    exactBarcodeMatch = await Product.findOne({
      businessId,
      barcode: cleanTerm,
      ...(includeArchived ? {} : { isArchived: false, isActive: true }),
      ...(categoryId ? { categoryId } : {}),
    })
      .select("_id businessId categoryId name sku barcode sellingPrice costPrice unit packSize packagingType description isActive isArchived createdAt")
      .populate("categoryId", "name description");
  } catch {}

  // ── Step 2: Multi-Token Regex Search ──
  const escapedTerm = cleanTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tokens = tokenize(cleanTerm).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  let matchedCategoryIds = [];
  try {
    const matchingCategories = await Category.find({
      businessId,
      name: { $regex: escapedTerm, $options: "i" },
    }).select("_id");
    matchedCategoryIds = matchingCategories.map((c) => c._id);
  } catch {}

  const searchConditions = [
    { name: { $regex: escapedTerm, $options: "i" } },
    { sku: { $regex: escapedTerm, $options: "i" } },
    { barcode: { $regex: escapedTerm, $options: "i" } },
  ];

  if (matchedCategoryIds.length > 0) {
    searchConditions.push({ categoryId: { $in: matchedCategoryIds } });
  }

  // Token-based matching (order independent, e.g. "salt tata" matches "Tata Salt")
  if (tokens.length > 1) {
    searchConditions.push({
      $and: tokens.map((tok) => ({
        $or: [
          { name: { $regex: tok, $options: "i" } },
          { sku: { $regex: tok, $options: "i" } },
          { barcode: { $regex: tok, $options: "i" } },
        ],
      })),
    });
  }

  const primarySearchQuery = { ...dbQuery, $or: searchConditions };

  let rawProducts = await Product.find(primarySearchQuery)
    .select(
      "_id businessId categoryId name sku barcode sellingPrice costPrice unit packSize packagingType description isActive isArchived createdAt"
    )
    .populate("categoryId", "name description")
    .limit(cappedLimit * 2);

  // ── Step 3: Typo / Fuzzy Fallback if few or no exact results found ──
  // If user made a spelling mistake (e.g. "chwal" for "chawal" or "magi" for "maggi")
  if (rawProducts.length < cappedLimit && cleanTerm.length >= 2) {
    const existingIds = new Set(rawProducts.map((p) => p._id.toString()));
    const candidates = await Product.find(dbQuery)
      .select(
        "_id businessId categoryId name sku barcode sellingPrice costPrice unit packSize packagingType description isActive isArchived createdAt"
      )
      .populate("categoryId", "name description")
      .sort({ updatedAt: -1 })
      .limit(100);

    const extraCandidates = candidates.filter((c) => !existingIds.has(c._id.toString()));
    rawProducts = [...rawProducts, ...extraCandidates];
  }

  // ── Step 4: Apply Fuzzy Ranking & Relevance Sorting ──
  const plainList = rawProducts.map((p) => (p.toObject ? p.toObject() : p));
  const ranked = rankProducts(plainList, cleanTerm);

  // If exact barcode match was found, ensure it sits at the absolute top (Index 0)
  if (exactBarcodeMatch) {
    const exactId = exactBarcodeMatch._id.toString();
    const rest = ranked.filter((r) => (r._id || r.id).toString() !== exactId);
    const exactObj = exactBarcodeMatch.toObject ? exactBarcodeMatch.toObject() : exactBarcodeMatch;
    exactObj._searchScore = 100;
    exactObj._matchType = "EXACT_BARCODE";
    return [exactObj, ...rest].slice(0, cappedLimit);
  }

  return ranked.slice(0, cappedLimit);
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
