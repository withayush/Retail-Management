const expenseCategoryService = require("../services/expenseCategory.service");

/**
 * ExpenseCategory Controller Layer
 * Multi-tenant controller strictly anchored to req.businessId.
 */

const createCategory = async (req, res, next) => {
  try {
    const category = await expenseCategoryService.createCategory(
      req.businessId,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Expense category created successfully.",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await expenseCategoryService.getCategories(
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
    const category = await expenseCategoryService.getCategoryById(
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
    const updated = await expenseCategoryService.updateCategory(
      req.businessId,
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Expense category updated successfully.",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const archiveCategory = async (req, res, next) => {
  try {
    const archived = await expenseCategoryService.archiveCategory(
      req.businessId,
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: "Expense category archived successfully.",
      data: archived,
    });
  } catch (error) {
    next(error);
  }
};

const restoreCategory = async (req, res, next) => {
  try {
    const restored = await expenseCategoryService.restoreCategory(
      req.businessId,
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: "Expense category restored successfully.",
      data: restored,
    });
  } catch (error) {
    next(error);
  }
};

const toggleStatus = async (req, res, next) => {
  try {
    const toggled = await expenseCategoryService.toggleStatus(
      req.businessId,
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: `Expense category ${toggled.isActive ? "activated" : "deactivated"} successfully.`,
      data: toggled,
    });
  } catch (error) {
    next(error);
  }
};

const seedDefaults = async (req, res, next) => {
  try {
    const categories = await expenseCategoryService.seedDefaults(req.businessId);

    return res.status(200).json({
      success: true,
      message: "Default expense categories seeded successfully.",
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const summary = await expenseCategoryService.getSummary(req.businessId);

    return res.status(200).json({
      success: true,
      data: summary,
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
  archiveCategory,
  restoreCategory,
  toggleStatus,
  seedDefaults,
  getSummary,
};
