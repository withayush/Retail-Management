const expenseCategoryRepository = require("../repositories/expenseCategory.repository");

class ExpenseCategoryService {
  /**
   * Create a new expense category with multi-tenant duplicate validation
   */
  async createCategory(businessId, payload) {
    if (!businessId) {
      const error = new Error("Business ID is required.");
      error.statusCode = 400;
      throw error;
    }

    const { categoryName, description, icon, color, budgetLimit, sortOrder, isActive } = payload;

    // Duplicate name collision check within the same business
    const existing = await expenseCategoryRepository.findCategoryByName(businessId, categoryName);
    if (existing) {
      const error = new Error(`Expense category '${categoryName}' already exists in your store.`);
      error.statusCode = 409;
      error.code = "DUPLICATE_CATEGORY_NAME";
      throw error;
    }

    return await expenseCategoryRepository.createCategory({
      businessId,
      categoryName,
      description,
      icon,
      color,
      budgetLimit,
      sortOrder,
      isActive: isActive !== undefined ? isActive : true,
      isDefault: false,
    });
  }

  /**
   * Get all expense categories with optional auto-seeding of defaults for new stores
   */
  async getCategories(businessId, filters = {}) {
    if (!businessId) {
      const error = new Error("Business ID is required.");
      error.statusCode = 400;
      throw error;
    }

    // Auto-seed defaults if business has 0 categories and no search query was passed
    const totalCount = await expenseCategoryRepository.countCategoriesByBusinessId(businessId);
    if (totalCount === 0 && !filters.search) {
      await expenseCategoryRepository.seedDefaultCategories(businessId);
    }

    return await expenseCategoryRepository.findCategoriesByBusinessId(businessId, filters);
  }

  /**
   * Get single expense category by ID
   */
  async getCategoryById(businessId, categoryId) {
    if (!businessId || !categoryId) {
      const error = new Error("Business ID and Category ID are required.");
      error.statusCode = 400;
      throw error;
    }

    const category = await expenseCategoryRepository.findCategoryById(businessId, categoryId);
    if (!category || category.isArchived) {
      const error = new Error("Expense category not found.");
      error.statusCode = 404;
      throw error;
    }

    return category;
  }

  /**
   * Update expense category
   */
  async updateCategory(businessId, categoryId, payload) {
    if (!businessId || !categoryId) {
      const error = new Error("Business ID and Category ID are required.");
      error.statusCode = 400;
      throw error;
    }

    const category = await expenseCategoryRepository.findCategoryById(businessId, categoryId);
    if (!category) {
      const error = new Error("Expense category not found.");
      error.statusCode = 404;
      throw error;
    }

    // If renaming, check for collision with another existing category in same business
    if (payload.categoryName && payload.categoryName.trim().toLowerCase() !== category.categoryName.toLowerCase()) {
      const duplicate = await expenseCategoryRepository.findCategoryByName(
        businessId,
        payload.categoryName,
        categoryId
      );
      if (duplicate) {
        const error = new Error(`Expense category '${payload.categoryName}' already exists.`);
        error.statusCode = 409;
        error.code = "DUPLICATE_CATEGORY_NAME";
        throw error;
      }
    }

    return await expenseCategoryRepository.updateCategoryById(businessId, categoryId, payload);
  }

  /**
   * Soft-delete / Archive expense category
   */
  async archiveCategory(businessId, categoryId) {
    if (!businessId || !categoryId) {
      const error = new Error("Business ID and Category ID are required.");
      error.statusCode = 400;
      throw error;
    }

    const category = await expenseCategoryRepository.findCategoryById(businessId, categoryId);
    if (!category) {
      const error = new Error("Expense category not found.");
      error.statusCode = 404;
      throw error;
    }

    return await expenseCategoryRepository.archiveCategoryById(businessId, categoryId);
  }

  /**
   * Restore archived category
   */
  async restoreCategory(businessId, categoryId) {
    if (!businessId || !categoryId) {
      const error = new Error("Business ID and Category ID are required.");
      error.statusCode = 400;
      throw error;
    }

    return await expenseCategoryRepository.restoreCategoryById(businessId, categoryId);
  }

  /**
   * Toggle active status
   */
  async toggleStatus(businessId, categoryId) {
    if (!businessId || !categoryId) {
      const error = new Error("Business ID and Category ID are required.");
      error.statusCode = 400;
      throw error;
    }

    const updated = await expenseCategoryRepository.toggleCategoryStatus(businessId, categoryId);
    if (!updated) {
      const error = new Error("Expense category not found.");
      error.statusCode = 404;
      throw error;
    }

    return updated;
  }

  /**
   * Explicitly seed default categories
   */
  async seedDefaults(businessId) {
    if (!businessId) {
      const error = new Error("Business ID is required.");
      error.statusCode = 400;
      throw error;
    }

    return await expenseCategoryRepository.seedDefaultCategories(businessId);
  }

  /**
   * Summary KPI metrics
   */
  async getSummary(businessId) {
    if (!businessId) {
      const error = new Error("Business ID is required.");
      error.statusCode = 400;
      throw error;
    }

    return await expenseCategoryRepository.getCategorySummary(businessId);
  }
}

module.exports = new ExpenseCategoryService();
