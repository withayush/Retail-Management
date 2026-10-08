const expenseRepository = require("../repositories/expense.repository");
const expenseCategoryRepository = require("../repositories/expenseCategory.repository");
const monthlyOpExService = require("./monthlyOpEx.service");

class ExpenseService {
  /**
   * Create a new expense transaction
   * Strictly verifies that categoryId belongs to the same business tenant and is active.
   */
  async createExpense(businessId, payload, accountUser = {}) {
    if (!businessId) {
      const error = new Error("Business ID is required for multi-tenant isolation.");
      error.statusCode = 400;
      throw error;
    }

    const {
      categoryId,
      amount,
      expenseDate,
      paymentMethod,
      referenceNumber,
      payee,
      description,
      taxAmount,
      attachment,
      status,
    } = payload;

    // 1. Validate Category Ownership and Active Status
    const category = await expenseCategoryRepository.findCategoryById(businessId, categoryId);
    if (!category || category.isArchived) {
      const error = new Error("Invalid expense category. Category does not exist in your store.");
      error.statusCode = 404;
      error.code = "CATEGORY_NOT_FOUND";
      throw error;
    }

    if (!category.isActive) {
      const error = new Error(`Expense category '${category.categoryName}' is inactive. Please activate it first.`);
      error.statusCode = 400;
      error.code = "CATEGORY_INACTIVE";
      throw error;
    }

    // 2. Validate Amount
    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      const error = new Error("Expense amount must be a valid positive number.");
      error.statusCode = 400;
      throw error;
    }

    // 3. User Audit Attribution
    const createdBy = accountUser?._id || accountUser?.id || null;
    const createdByName = accountUser?.name || accountUser?.phone || "Store Admin";

    // 4. Create Immutable Expense Transaction
    const createdExpense = await expenseRepository.createExpense({
      businessId,
      categoryId: category._id,
      categoryName: category.categoryName,
      categoryIcon: category.icon || "Tag",
      categoryColor: category.color || "#8E8E93",
      amount: parsedAmount,
      expenseDate: expenseDate || new Date(),
      paymentMethod: paymentMethod || "CASH",
      referenceNumber: referenceNumber || "",
      payee: payee || "",
      description: description || "",
      taxAmount: Math.max(0, Number(taxAmount) || 0),
      attachment: attachment || { fileName: "", url: "", fileType: "", fileSize: 0 },
      status: status || "PAID",
      createdBy,
      createdByName,
    });

    // 5. Auto-sync Monthly OpEx Aggregator Engine cache (T51)
    monthlyOpExService.autoSyncOnExpenseChange(businessId, createdExpense.expenseDate).catch(() => {});

    return createdExpense;
  }

  /**
   * Get all expenses with filtering and pagination
   */
  async getExpenses(businessId, filters = {}) {
    if (!businessId) {
      const error = new Error("Business ID is required.");
      error.statusCode = 400;
      throw error;
    }

    return await expenseRepository.findExpensesByBusinessId(businessId, filters);
  }

  /**
   * Get single expense by ID
   */
  async getExpenseById(businessId, expenseId) {
    if (!businessId || !expenseId) {
      const error = new Error("Business ID and Expense ID are required.");
      error.statusCode = 400;
      throw error;
    }

    const expense = await expenseRepository.findExpenseById(businessId, expenseId);
    if (!expense || expense.isArchived) {
      const error = new Error("Expense record not found.");
      error.statusCode = 404;
      throw error;
    }

    return expense;
  }

  /**
   * Get single expense by human-readable expense number (e.g. EXP-1001)
   */
  async getExpenseByNumber(businessId, expenseNumber) {
    if (!businessId || !expenseNumber) {
      const error = new Error("Business ID and Expense Number are required.");
      error.statusCode = 400;
      throw error;
    }

    const expense = await expenseRepository.findExpenseByNumber(businessId, expenseNumber);
    if (!expense || expense.isArchived) {
      const error = new Error(`Expense '${expenseNumber}' not found.`);
      error.statusCode = 404;
      throw error;
    }

    return expense;
  }

  /**
   * Update expense record
   */
  async updateExpense(businessId, expenseId, payload) {
    if (!businessId || !expenseId) {
      const error = new Error("Business ID and Expense ID are required.");
      error.statusCode = 400;
      throw error;
    }

    const existing = await expenseRepository.findExpenseById(businessId, expenseId);
    if (!existing || existing.isArchived) {
      const error = new Error("Expense record not found.");
      error.statusCode = 404;
      throw error;
    }

    const updateData = { ...payload };

    // If changing category, verify category belongs to same business
    if (payload.categoryId && payload.categoryId.toString() !== existing.categoryId.toString()) {
      const newCategory = await expenseCategoryRepository.findCategoryById(businessId, payload.categoryId);
      if (!newCategory || newCategory.isArchived) {
        const error = new Error("Target expense category does not exist.");
        error.statusCode = 404;
        throw error;
      }
      updateData.categoryId = newCategory._id;
      updateData.categoryName = newCategory.categoryName;
      updateData.categoryIcon = newCategory.icon || "Tag";
      updateData.categoryColor = newCategory.color || "#8E8E93";
    }

    const updated = await expenseRepository.updateExpenseById(businessId, expenseId, updateData);

    // Auto-sync Monthly OpEx Aggregator Engine cache (T51)
    if (updated?.expenseDate) {
      monthlyOpExService.autoSyncOnExpenseChange(businessId, updated.expenseDate).catch(() => {});
    }
    if (existing.expenseDate && (!updated?.expenseDate || existing.expenseDate.getTime() !== updated.expenseDate.getTime())) {
      monthlyOpExService.autoSyncOnExpenseChange(businessId, existing.expenseDate).catch(() => {});
    }

    return updated;
  }

  /**
   * Archive / soft-delete expense
   */
  async archiveExpense(businessId, expenseId) {
    if (!businessId || !expenseId) {
      const error = new Error("Business ID and Expense ID are required.");
      error.statusCode = 400;
      throw error;
    }

    const existing = await expenseRepository.findExpenseById(businessId, expenseId);
    if (!existing || existing.isArchived) {
      const error = new Error("Expense record not found.");
      error.statusCode = 404;
      throw error;
    }

    const archived = await expenseRepository.archiveExpenseById(businessId, expenseId);

    // Auto-sync Monthly OpEx Aggregator Engine cache (T51)
    if (existing.expenseDate) {
      monthlyOpExService.autoSyncOnExpenseChange(businessId, existing.expenseDate).catch(() => {});
    }

    return archived;
  }

  /**
   * Get executive expense KPI summary
   */
  async getSummary(businessId, dateFilters = {}) {
    if (!businessId) {
      const error = new Error("Business ID is required.");
      error.statusCode = 400;
      throw error;
    }

    return await expenseRepository.getExpenseSummary(businessId, dateFilters);
  }
}

module.exports = new ExpenseService();
