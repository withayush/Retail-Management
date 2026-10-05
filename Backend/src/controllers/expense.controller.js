const expenseService = require("../services/expense.service");

/**
 * Expense Controller Layer
 * Multi-tenant controller strictly anchored to req.businessId and req.account.
 */

const createExpense = async (req, res, next) => {
  try {
    const expense = await expenseService.createExpense(
      req.businessId,
      req.body,
      req.account || req.user || {}
    );

    return res.status(201).json({
      success: true,
      message: "Expense recorded successfully.",
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

const getExpenses = async (req, res, next) => {
  try {
    const result = await expenseService.getExpenses(
      req.businessId,
      req.query
    );

    return res.status(200).json({
      success: true,
      data: result.expenses,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getExpenseById = async (req, res, next) => {
  try {
    const expense = await expenseService.getExpenseById(
      req.businessId,
      req.params.id
    );

    return res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

const getExpenseByNumber = async (req, res, next) => {
  try {
    const expense = await expenseService.getExpenseByNumber(
      req.businessId,
      req.params.expenseNumber
    );

    return res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

const updateExpense = async (req, res, next) => {
  try {
    const updated = await expenseService.updateExpense(
      req.businessId,
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Expense updated successfully.",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const archiveExpense = async (req, res, next) => {
  try {
    const archived = await expenseService.archiveExpense(
      req.businessId,
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: "Expense archived successfully.",
      data: archived,
    });
  } catch (error) {
    next(error);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const summary = await expenseService.getSummary(
      req.businessId,
      req.query
    );

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  getExpenseByNumber,
  updateExpense,
  archiveExpense,
  getSummary,
};
