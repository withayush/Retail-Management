const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const { businessMiddleware } = require("../middlewares/business.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  createProductSchema,
  updateProductSchema,
} = require("../validations/product.validation");
const {
  createProduct,
  getProducts,
  searchProducts,
  getProductById,
  getProductByBarcode,
  updateProduct,
  archiveProduct,
  restoreProduct,
  deleteProduct,
} = require("../controllers/product.controller");

const router = express.Router();

// All product routes require authentication + T6 Business Context (req.businessId)
router.use(authMiddleware);
router.use(businessMiddleware);

// ============================================
// PRODUCT CATALOG & POS LOOKUP ENDPOINTS (PHASE 2 - T8, T9, T10, T11, T12, T14)
// ============================================
router.post("/", validate(createProductSchema), createProduct);
router.get("/", getProducts);
router.get("/search", searchProducts); // Task T14: Fast Search & POS Typeahead
router.get("/barcode/:barcode", getProductByBarcode);
router.get("/:id", getProductById);
router.put("/:id", validate(updateProductSchema), updateProduct);
router.post("/:id/archive", archiveProduct);
router.post("/:id/restore", restoreProduct);
router.delete("/:id", deleteProduct); // Soft-deletes and archives product

module.exports = router;
