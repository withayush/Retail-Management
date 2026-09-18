const Category = require("../models/category.model");

/**
 * Category Repository Layer
 * Every query is strictly scoped to businessId to guarantee tenant isolation.
 */

const createCategory = async ({ businessId, name, description = "" }) => {
  return await Category.create({
    businessId,
    name,
    description,
  });
};

const findCategoriesByBusinessId = async (businessId, filters = {}) => {
  const query = { businessId };

  if (filters.search) {
    query.name = { $regex: filters.search, $options: "i" };
  }

  return await Category.find(query).sort({ createdAt: -1 });
};

const findCategoryById = async (businessId, categoryId) => {
  return await Category.findOne({
    _id: categoryId,
    businessId,
  });
};

const findCategoryByName = async (businessId, name) => {
  return await Category.findOne({
    businessId,
    name: { $regex: `^${name.trim()}$`, $options: "i" },
  });
};

const updateCategoryById = async (businessId, categoryId, updateData) => {
  return await Category.findOneAndUpdate(
    {
      _id: categoryId,
      businessId,
    },
    { $set: updateData },
    { new: true, runValidators: true }
  );
};

const deleteCategoryById = async (businessId, categoryId) => {
  return await Category.findOneAndDelete({
    _id: categoryId,
    businessId,
  });
};

const countCategoriesByBusinessId = async (businessId) => {
  return await Category.countDocuments({ businessId });
};

module.exports = {
  createCategory,
  findCategoriesByBusinessId,
  findCategoryById,
  findCategoryByName,
  updateCategoryById,
  deleteCategoryById,
  countCategoriesByBusinessId,
};
