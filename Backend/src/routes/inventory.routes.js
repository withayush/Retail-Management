const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const { businessMiddleware } = require("../middlewares/business.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  updateReorderLevelSchema,
  stockInSchema,
  stockOutSchema,
  batchStockOutSchema,
  adjustStockSchema,
  initializeOpeningStockSchema,
} = require("../validations/inventory.validation");
const {
  getStoreState,
  getInventorySummary,
  getProductInventory,
  updateReorderLevel,
  adjustStock,
  stockIn,
  stockOut,
  batchStockOut,
  getInventoryLedger,
  getProductLedger,
  initializeOpeningStock,
  getInventoryAlerts,
  getInventoryAlertsSummary,
  acknowledgeAlert,
  resolveAlert,
  syncAllInventoryAlerts,
} = require("../controllers/inventory.controller");

const router = express.Router();

// All inventory routes require authentication + T6 Business Context (req.businessId)
router.use(authMiddleware);
router.use(businessMiddleware);

// ============================================
// INVENTORY STORE STATE & REORDER ENDPOINTS (PHASE 3 - T15)
// ============================================
router.get("/summary", getInventorySummary);
router.get("/store-state", getStoreState);
router.get("/ledger", getInventoryLedger); // Phase 3 - Task T16 / T21: Complete Store Audit Ledger
router.get("/product/:productId/ledger", getProductLedger); // Task T16: Product History Trail
router.get("/product/:productId", getProductInventory);
router.put(
  "/product/:productId/reorder-level",
  validate(updateReorderLevelSchema),
  updateReorderLevel
);

// ============================================
// DETERMINISTIC ALERTS QUEUE (PHASE 3 - TASK T22)
// ============================================
router.get("/alerts", getInventoryAlerts);
router.get("/alerts/summary", getInventoryAlertsSummary);
router.put("/alerts/:id/acknowledge", acknowledgeAlert);
router.put("/alerts/:id/resolve", resolveAlert);
router.post("/alerts/sync", syncAllInventoryAlerts);

// ============================================
// ATOMIC STOCK MOVEMENTS & LEDGER RECORDER (PHASE 3 - T16, T17, T18, T19, T20)
// ============================================
router.post("/opening-stock", validate(initializeOpeningStockSchema), initializeOpeningStock); // Phase 3 - Task T17
router.post("/stock-in", validate(stockInSchema), stockIn); // Phase 3 - Task T18
router.post("/stock-out", validate(stockOutSchema), stockOut); // Phase 3 - Task T19
router.post("/stock-out/batch", validate(batchStockOutSchema), batchStockOut); // Phase 3 - Task T19 (POS Batch)
router.post("/adjust", validate(adjustStockSchema), adjustStock); // Phase 3 - Task T20

module.exports = router;
