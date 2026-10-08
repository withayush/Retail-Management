const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const { businessMiddleware } = require("../middlewares/business.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  createExpenseSchema,
  updateExpenseSchema,
} = require("../validations/expense.validation");
const {
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
} = require("../controllers/expense.controller");

const router = express.Router();

// All expense routes require authentication + T6 Business Context (req.businessId)
router.use(authMiddleware);
router.use(businessMiddleware);

// ============================================
// MONTHLY OPEX AGGREGATOR ENDPOINTS (PHASE 8 - T51)
// ============================================
router.get("/monthly-opex", getMonthlyOpExOverview);
router.get("/monthly-opex/current", getCurrentMonthOpEx);
router.get("/monthly-opex/:year/:month", getMonthlyOpExDetail);
router.post("/monthly-opex/recalculate", recalculateMonthlyOpEx);

// ============================================
// EXPENSE API ENDPOINTS (PHASE 8 - T49 / T50)
// ============================================

// Summary Analytics
router.get("/summary", getSummary);

// Lookup by Expense Number (e.g. EXP-1001)
router.get("/number/:expenseNumber", getExpenseByNumber);

// Primary CRUD
router.post("/", validate(createExpenseSchema), createExpense);
router.get("/", getExpenses);
router.get("/:id", getExpenseById);
router.put("/:id", validate(updateExpenseSchema), updateExpense);

// Archival / Soft-Delete
router.post("/:id/archive", archiveExpense);
router.delete("/:id", archiveExpense); // Safe soft-delete alias

module.exports = router;
