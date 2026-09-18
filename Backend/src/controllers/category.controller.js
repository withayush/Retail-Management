const categoryService = require("../services/category.service");

/**
 * Category Controller Layer
 * Receives requests after authentication and T6 business context mapping.
 * Uses req.businessId established by businessMiddleware.
 */

const createCategory = async (req, res, next) => {
  try {
    const category = await categoryService.createCategory(
      req.businessId,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Category created successfully.",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getCategories(
      req.businessId,
      req.query
    );

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

const getCategoryById = async (req, res, next) => {
  try {
    const category = await categoryService.getCategoryById(
      req.businessId,
      req.params.id
    );

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const updatedCategory = await categoryService.updateCategory(
      req.businessId,
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Category updated successfully.",
      data: updatedCategory,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const result = await categoryService.deleteCategory(
      req.businessId,
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: result.message,
      data: { id: result.deletedId },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
