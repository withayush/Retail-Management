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

  const page = parseInt(filters.page, 10) || 1;
  const limit = parseInt(filters.limit, 10) || 50;
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate("categoryId", "name description")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Product.countDocuments(query),
  ]);

  return {
    products,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
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

const deleteProductById = async (businessId, productId) => {
  return await Product.findOneAndDelete({
    _id: productId,
    businessId,
  });
};

module.exports = {
  createProduct,
  findProductsByBusinessId,
  findProductById,
  findProductBySku,
  findProductByBarcode,
  updateProductById,
  deleteProductById,
};
