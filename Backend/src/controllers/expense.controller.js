const expenseService = require("../services/expense.service");
const monthlyOpExService = require("../services/monthlyOpEx.service");

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

// ============================================
// MONTHLY OPEX AGGREGATOR CONTROLLERS (T51)
// ============================================

const getMonthlyOpExOverview = async (req, res, next) => {
  try {
    const year = req.query.year || new Date().getUTCFullYear();
    const forceRefresh = req.query.forceRefresh === "true" || req.query.forceRefresh === true;

    const data = await monthlyOpExService.getYearlyOpExOverview(req.businessId, year, { forceRefresh });
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentMonthOpEx = async (req, res, next) => {
  try {
    const forceRefresh = req.query.forceRefresh === "true" || req.query.forceRefresh === true;
    const data = await monthlyOpExService.getCurrentMonthOpEx(req.businessId, forceRefresh);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getMonthlyOpExDetail = async (req, res, next) => {
  try {
    const { year, month } = req.params;
    const forceRefresh = req.query.forceRefresh === "true" || req.query.forceRefresh === true;

    const data = await monthlyOpExService.getMonthlyOpExSummary(req.businessId, {
      year: Number(year),
      month: Number(month),
      forceRefresh,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const recalculateMonthlyOpEx = async (req, res, next) => {
  try {
    const { year, month } = req.body || {};
    let result;

    if (year && month) {
      result = await monthlyOpExService.recalculateMonth(req.businessId, Number(year), Number(month));
    } else {
      const targetYear = year || new Date().getUTCFullYear();
      result = await monthlyOpExService.recalculateYear(req.businessId, Number(targetYear));
    }

    return res.status(200).json({
      success: true,
      message: "Monthly OpEx summary recalculated and cached successfully.",
      data: result,
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
  getMonthlyOpExOverview,
  getCurrentMonthOpEx,
  getMonthlyOpExDetail,
  recalculateMonthlyOpEx,
};

