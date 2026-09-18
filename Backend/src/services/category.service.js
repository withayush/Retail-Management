const mongoose = require("mongoose");
const categoryRepo = require("../repositories/category.repository");

/**
 * Category Service Layer
 * Business logic, duplicate checks, and tenant verification for Category management.
 */

const createCategory = async (businessId, { name, description = "" }) => {
  if (!mongoose.Types.ObjectId.isValid(businessId)) {
    const error = new Error("Invalid business ID.");
    error.statusCode = 400;
    error.code = "INVALID_BUSINESS_ID";
    throw error;
  }

  const cleanName = name.trim();

  // Multi-Tenant Duplicate Check (Name uniqueness scoped to this business)
  const existingCategory = await categoryRepo.findCategoryByName(businessId, cleanName);
  if (existingCategory) {
    const error = new Error(`Category "${cleanName}" already exists for this business.`);
    error.statusCode = 409;
    error.code = "CATEGORY_ALREADY_EXISTS";
    throw error;
  }

  return await categoryRepo.createCategory({
    businessId,
    name: cleanName,
    description: description.trim(),
  });
};

const getCategories = async (businessId, filters = {}) => {
  if (!mongoose.Types.ObjectId.isValid(businessId)) {
    const error = new Error("Invalid business ID.");
    error.statusCode = 400;
    error.code = "INVALID_BUSINESS_ID";
    throw error;
  }

  return await categoryRepo.findCategoriesByBusinessId(businessId, filters);
};

const getCategoryById = async (businessId, categoryId) => {
  if (!mongoose.Types.ObjectId.isValid(businessId) || !mongoose.Types.ObjectId.isValid(categoryId)) {
    const error = new Error("Invalid ID format.");
    error.statusCode = 400;
    error.code = "INVALID_ID";
    throw error;
  }

  const category = await categoryRepo.findCategoryById(businessId, categoryId);
  if (!category) {
    const error = new Error("Category not found in this business.");
    error.statusCode = 404;
    error.code = "CATEGORY_NOT_FOUND";
    throw error;
  }

  return category;
};

const updateCategory = async (businessId, categoryId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(businessId) || !mongoose.Types.ObjectId.isValid(categoryId)) {
    const error = new Error("Invalid ID format.");
    error.statusCode = 400;
    error.code = "INVALID_ID";
    throw error;
  }

  // 1. Verify existence in this business
  const existingCategory = await categoryRepo.findCategoryById(businessId, categoryId);
  if (!existingCategory) {
    const error = new Error("Category not found in this business.");
    error.statusCode = 404;
    error.code = "CATEGORY_NOT_FOUND";
    throw error;
  }

  // 2. If name is being changed, verify no duplicate exists
  if (updateData.name) {
    const cleanName = updateData.name.trim();
    const duplicate = await categoryRepo.findCategoryByName(businessId, cleanName);

    if (duplicate && duplicate._id.toString() !== categoryId.toString()) {
      const error = new Error(`Another category with name "${cleanName}" already exists in this business.`);
      error.statusCode = 409;
      error.code = "CATEGORY_NAME_CONFLICT";
      throw error;
    }

    updateData.name = cleanName;
  }

  if (updateData.description !== undefined) {
    updateData.description = updateData.description.trim();
  }

  return await categoryRepo.updateCategoryById(businessId, categoryId, updateData);
};

const deleteCategory = async (businessId, categoryId) => {
  if (!mongoose.Types.ObjectId.isValid(businessId) || !mongoose.Types.ObjectId.isValid(categoryId)) {
    const error = new Error("Invalid ID format.");
    error.statusCode = 400;
    error.code = "INVALID_ID";
    throw error;
  }

  const deletedCategory = await categoryRepo.deleteCategoryById(businessId, categoryId);
  if (!deletedCategory) {
    const error = new Error("Category not found in this business.");
    error.statusCode = 404;
    error.code = "CATEGORY_NOT_FOUND";
    throw error;
  }

  return {
    success: true,
    message: "Category deleted successfully.",
    deletedId: categoryId,
  };
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
