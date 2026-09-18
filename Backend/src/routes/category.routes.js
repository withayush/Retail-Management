const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const { businessMiddleware } = require("../middlewares/business.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  createCategorySchema,
  updateCategorySchema,
} = require("../validations/category.validation");
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../controllers/category.controller");

const router = express.Router();

// All category routes require authentication + T6 Business Context (req.businessId)
router.use(authMiddleware);
router.use(businessMiddleware);

// ============================================
// CATEGORY CRUD ENDPOINTS (PHASE 2 - T7)
// ============================================
router.post("/", validate(createCategorySchema), createCategory);
router.get("/", getCategories);
router.get("/:id", getCategoryById);
router.put("/:id", validate(updateCategorySchema), updateCategory);
router.delete("/:id", deleteCategory);

module.exports = router;
