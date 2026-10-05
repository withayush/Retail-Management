const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const { businessMiddleware } = require("../middlewares/business.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  createExpenseCategorySchema,
  updateExpenseCategorySchema,
} = require("../validations/expenseCategory.validation");
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  archiveCategory,
  restoreCategory,
  toggleStatus,
  seedDefaults,
  getSummary,
} = require("../controllers/expenseCategory.controller");

const router = express.Router();

// All expense category routes require authentication + T6 Business Context (req.businessId)
router.use(authMiddleware);
router.use(businessMiddleware);

// ============================================
// EXPENSE CATEGORY ENDPOINTS (PHASE 8 - T48)
// ============================================

// Summary & Defaults Seeding
router.get("/summary", getSummary);
router.post("/seed-defaults", seedDefaults);

// Primary CRUD
router.post("/", validate(createExpenseCategorySchema), createCategory);
router.get("/", getCategories);
router.get("/:id", getCategoryById);
router.put("/:id", validate(updateExpenseCategorySchema), updateCategory);

// Lifecycle Status & Archival
router.patch("/:id/status", toggleStatus);
router.post("/:id/archive", archiveCategory);
router.post("/:id/restore", restoreCategory);
router.delete("/:id", archiveCategory); // Safe soft-delete alias

module.exports = router;
